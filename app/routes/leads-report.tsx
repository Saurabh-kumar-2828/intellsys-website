import type {LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import * as Tabs from "@radix-ui/react-tabs";
import {json} from "@remix-run/node";
import {Link, useLoaderData} from "@remix-run/react";
import {DateTime} from "luxon";
import {Profiler, useCallback, useEffect, useState} from "react";
import {
    getShopifyData,
    getAdsData,
    ShopifyData,
    AdsData,
    ShopifyDataAggregatedRow,
    AdsDataAggregatedRow,
    TimeGranularity,
    getFreshsalesData,
    FreshsalesData,
    FreshsalesDataAggregatedRow,
} from "~/backend/business-insights";
import {getProductLibrary, getCapturedUtmCampaignLibrary, ProductInformation} from "~/backend/common";
import {Card, DateFilterSection, FancyCalendar, FancySearchableMultiSelect, FancySearchableSelect, GenericCard, ValueDisplayingCard} from "~/components/scratchpad";
import {Iso8601Date, QueryFilterType, ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
import {
    agGridDateComparator,
    agGridFloatComparator,
    colorPalette,
    concatenateNonNullStringsWithAmpersand,
    dateToMediumNoneEnFormat,
    distinct,
    fillColors,
    getColor,
    getDates,
    kvpArrayToObjectReducer,
    numberToHumanFriendlyString,
    roundOffToTwoDigits,
} from "~/utilities/utilities";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement} from "chart.js";
import {getElementAtEvent, getElementsAtEvent, Line, Pie} from "react-chartjs-2";
import {useRef} from "react";
import {Bar, getDatasetAtEvent} from "react-chartjs-2";
import {AgGridReact} from "ag-grid-react";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {aggregateByDate, createGroupByReducer, sumReducer} from "~/backend/utilities/utilities";

export const meta: MetaFunction = () => {
    return {
        title: "Sales Report - Intellsys",
    };
};

export const links: LinksFunction = () => {
    return [
        {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-grid.css"},
        {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-theme-alpine.css"},
    ];
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const selectedGranularityRaw = urlSearchParams.get("selected_granularity");
    let selectedGranularity: TimeGranularity;
    if (selectedGranularityRaw == null || selectedGranularityRaw.length == 0) {
        selectedGranularity = TimeGranularity.daily;
    } else {
        selectedGranularity = selectedGranularityRaw;
    }

    const minDateRaw = urlSearchParams.get("min_date");
    let minDate;
    if (minDateRaw == null || minDateRaw.length == 0) {
        minDate = DateTime.now().startOf("month").toISODate();
    } else {
        minDate = minDateRaw;
    }

    const maxDateRaw = urlSearchParams.get("max_date");
    let maxDate;
    if (maxDateRaw == null || maxDateRaw.length == 0) {
        maxDate = DateTime.now().toISODate();
    } else {
        maxDate = maxDateRaw;
    }

    // TODO: Add filters

    return json({
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: minDate,
        appliedMaxDate: maxDate,
        allProductInformation: await getProductLibrary(),
        allSourceInformation: await getCapturedUtmCampaignLibrary(),
        shopifyData: await getShopifyData(minDate, maxDate, selectedGranularity),
        freshsalesLeadsData: await getFreshsalesData(minDate, maxDate, selectedGranularity),
        adsData: await getAdsData(minDate, maxDate, selectedGranularity),
    });
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, allProductInformation, freshsalesLeadsData, shopifyData, adsData} = useLoaderData();
    const numberOfSelectedDays = DateTime.fromISO(appliedMaxDate).diff(DateTime.fromISO(appliedMinDate), "days").toObject().days! + 1;

    const r5_marketingAcos = "?";
    const r5_facebookAcos = "?";
    const r5_agentAcos = "?";
    const r5_googleAcos = "?";
    const r5_highestAcos = "?";
    const r5_lowestAcos = "?";
    const r5_netAcos = "?";

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedGranularity, setSelectedGranularity] = useState(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState(appliedMinDate ?? "");
    const [selectedMaxDate, setSelectedMaxDate] = useState(appliedMaxDate ?? "");

    const businesses = distinct(allProductInformation.map((productInformation: ProductInformation) => productInformation.category));

    const [selectedProducts, setSelectedProducts] = useState<Array<string>>([]);

    const granularities = ["Daily", "Weekly", "Monthly", "Yearly"];

    return (
        <>
            <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
                <DateFilterSection
                    granularities={granularities}
                    selectedGranularity={selectedGranularity}
                    setSelectedGranularity={setSelectedGranularity}
                    selectedMinDate={selectedMinDate}
                    setSelectedMinDate={setSelectedMinDate}
                    selectedMaxDate={selectedMaxDate}
                    setSelectedMaxDate={setSelectedMaxDate}
                    page={"leads-report"}
                />

                <div className="tw-col-span-12 tw-bg-dark-bg-400 tw-sticky tw-top-32 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                    <FancySearchableMultiSelect
                        label="Choose Category"
                        options={businesses}
                        selectedOptions={selectedCategories}
                        setSelectedOptions={setSelectedCategories}
                        filterType={QueryFilterType.category}
                    />
                </div>
            </div>
            <div className="tw-p-8">
                <LeadsSection freshsalesLeadsData={freshsalesLeadsData} minDate={appliedMinDate} maxDate={appliedMaxDate} selectedCategories={selectedCategories} />
            </div>
            <div className="tw-p-8">
                <DespositionsToCampaignsSection freshsalesLeadsData={freshsalesLeadsData} minDate={appliedMinDate} maxDate={appliedMaxDate} selectedCategories={selectedCategories} />
            </div>
        </>
    );
}

function LeadsSection({
    freshsalesLeadsData,
    minDate,
    maxDate,
    selectedCategories,
}: {
    freshsalesLeadsData: FreshsalesData;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    selectedCategories: Array<string>;
}) {
    const filterFreshsalesLeadsData = freshsalesLeadsData.rows.filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category));

    const totalLeadsCount = {
        //TODO: correct metaInformation
        metaInformation: `Total Leads = ${numberToHumanFriendlyString(filterFreshsalesLeadsData.length)}`,
        count: filterFreshsalesLeadsData
            .filter((row: FreshsalesDataAggregatedRow) => row.date <= maxDate && row.date >= minDate)
            .reduce((totalLeads, row: FreshsalesDataAggregatedRow) => {
                return totalLeads + row.count;
            }, 0),
    };

    const dates = getDates(minDate, maxDate);
    const FreshSalesLeadsDataGroupByLeadStatus = filterFreshsalesLeadsData
        .filter((row: FreshsalesDataAggregatedRow) => row.date <= maxDate && row.date >= minDate)
        .reduce(createGroupByReducer("leadStage"), {});

    type LeadStatusTotalLeadsCount = {
        name: string;
        value: number;
    };

    let leadStatusTotalLeadsCount: Array<LeadStatusTotalLeadsCount> = [];

    Object.keys(FreshSalesLeadsDataGroupByLeadStatus).forEach((leadStatus) => {
        leadStatusTotalLeadsCount.push({
            name: leadStatus,
            value: FreshSalesLeadsDataGroupByLeadStatus[leadStatus].reduce((total: number, item: FreshsalesDataAggregatedRow) => total + item.count, 0),
        });
    });

    const dayWiseLeadsStatusDistribution: {[key: string]: Array<number>} = {};

    for (const leadStatus in FreshSalesLeadsDataGroupByLeadStatus) {
        const dataGroupByDate = aggregateByDate(FreshSalesLeadsDataGroupByLeadStatus[leadStatus], "count", dates);
        dayWiseLeadsStatusDistribution[leadStatus] = dataGroupByDate;
    }

    // Line Chart
    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);
    const labels = dates;
    const noOfLeadsGeneratedDataset: Array<object> = [];
    const noOfLeadsGeneratedOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Day-wise distribution -> Total Leads per status",
            },
        },
    };

    Object.keys(FreshSalesLeadsDataGroupByLeadStatus).map((leadStatus) => {
        const lineColor = getColor(leadStatus);
        const result = {
            label: leadStatus,
            data: dayWiseLeadsStatusDistribution[leadStatus],
            borderColor: lineColor,
            backgroundColor: lineColor,
        };
        noOfLeadsGeneratedDataset.push(result);
    });

    return (
        <div>
            <div className="tw-grid tw-content-center tw-grid-cols-4 tw-gap-4">
                <ValueDisplayingCard
                    queryInformation={totalLeadsCount}
                    contentExtractor={(totalLeadsCount: any) => totalLeadsCount.count}
                    label="Total Leads"
                    className="tw-row-start-1 tw-col-start-1"
                    type={ValueDisplayingCardInformationType.integer}
                />
                <ItemBuilder
                    items={leadStatusTotalLeadsCount}
                    itemBuilder={(item, itemIndex) => (
                        <ValueDisplayingCard
                            queryInformation={item}
                            contentExtractor={(item) => item.value}
                            label={item.name}
                            className="tw-row-span-1"
                            type={ValueDisplayingCardInformationType.integer}
                            key={itemIndex}
                        />
                    )}
                />
            </div>

            <VerticalSpacer className="tw-h-8" />

            <GenericCard
                className="tw-col-span-6"
                content={
                    <div className="tw-grid tw-grid-cols-6">
                        <div className="tw-col-start-2 tw-col-span-4">
                            <Line options={noOfLeadsGeneratedOptions} data={{labels, datasets: noOfLeadsGeneratedDataset}} />
                        </div>
                    </div>
                }
                metaQuery={freshsalesLeadsData.metaQuery}
            />
        </div>
    );
}

function DespositionsToCampaignsSection({
    freshsalesLeadsData,
    minDate,
    maxDate,
    selectedCategories,
}: {
    freshsalesLeadsData: FreshsalesData;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    selectedCategories: Array<string>;
}) {
    const filterFreshsalesLeadsData = freshsalesLeadsData.rows.filter((row: FreshsalesDataAggregatedRow) => selectedCategories.length == 0 || selectedCategories.includes(row.category));

    const freshsalesDataGroupByCampaigns = filterFreshsalesLeadsData.reduce(createGroupByReducer("leadGenerationSourceCampaignName"), {});

    // {"campaign": {"leadStatus1": 12, "leadStatus2": 12}, ....}
    const x = kvpArrayToObjectReducer(
        Object.entries(freshsalesDataGroupByCampaigns)
            .map(([key, value]) => [
                key,
                Object.entries(value.reduce(createGroupByReducer("leadStage"), {})).map(([key2, value2]) => [
                    key2,
                    value2.reduce((total: number, current: FreshsalesDataAggregatedRow) => total + current.count, 0),
                ]),
            ])
            .map(([key, value]) => [key, kvpArrayToObjectReducer(value)])
    );

    const timeToCloseGroupByCampaign = kvpArrayToObjectReducer(Object.entries(freshsalesDataGroupByCampaigns).map(([key,value]) => [
        key,
        value.reduce((total: number, current: FreshsalesDataAggregatedRow) => total + current.timeToClose, 0)
    ]));

    const campaigns = Object.keys(x);

    const defaultColumnDefinitions = {
        sortable: true,
        filter: true,
    };

    return (
        <div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                        <AgGridReact
                            rowData={campaigns.map((campaignName, index) => ({
                                campaign: campaignName,
                                appointmentTaken: x[campaignName]["Appointment Taken"],
                                qualified: x[campaignName]["Qualified"],
                                new: x[campaignName]["New"],
                                disqualified: x[campaignName]["Disqualified"],
                                nonContactable: x[campaignName]["Non Contactable"],
                                requirementsReceived: x[campaignName]["Requirements Received"],
                                notResponding: x[campaignName]["Not Responding"],
                                timeToClose: roundOffToTwoDigits(timeToCloseGroupByCampaign[campaignName])
                            }))}
                            columnDefs={[
                                {
                                    headerName: "Campaign",
                                    field: "campaign",
                                },
                                {headerName: "Appointment Taken", field: "appointmentTaken"},
                                {headerName: "Qualified", field: "qualified"},
                                {headerName: "New", field: "new"},
                                {headerName: "Disqualified", field: "disqualified"},
                                {headerName: "Non Contactable", field: "nonContactable"},
                                {headerName: "Requirements Received", field: "requirementsReceived"},
                                {headerName: "Not Responding", field: "notResponding"},
                                {headerName: "Time To Close", field: "timeToClose"}
                            ]}
                            defaultColDef={defaultColumnDefinitions}
                            animateRows={true}
                            enableRangeSelection={true}
                        />
                    </div>
                }
                metaQuery={freshsalesLeadsData.metaQuery}
            />
        </div>
    );
}