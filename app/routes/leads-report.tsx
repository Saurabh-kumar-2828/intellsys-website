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
import {Card, DateFilterSection, FancyCalendar, FancySearchableSelect, GenericCard, ValueDisplayingCard} from "~/components/scratchpad";
import {Iso8601Date, QueryFilterType, ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
import {
    agGridDateComparator,
    agGridFloatComparator,
    colorPalette,
    concatenateNonNullStringsWithAmpersand,
    distinct,
    fillColors,
    getColor,
    getDates,
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

    const [selectedCategory, setSelectedCategory] = useState("Non Mattress");
    const [selectedGranularity, setSelectedGranularity] = useState(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState(appliedMinDate ?? "");
    const [selectedMaxDate, setSelectedMaxDate] = useState(appliedMaxDate ?? "");
    const [selectedInsight, setSelectedInsight] = useState("netQuantity");

    const businesses = distinct(allProductInformation.map((productInformation: ProductInformation) => productInformation.category));
    const insights = ["netQuantity", "netSales"];

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
                    <FancySearchableSelect label="Choose Category" options={businesses} selectedOption={selectedCategory} setSelectedOption={setSelectedCategory} />
                    <FancySearchableSelect label="Insights On" options={insights} selectedOption={selectedInsight} setSelectedOption={setSelectedInsight} />
                </div>
            </div>
            <div className="tw-p-8">
                <LeadsSection freshsalesLeadsData={freshsalesLeadsData} minDate={appliedMinDate} maxDate={appliedMaxDate} />
            </div>
        </>
    );
}
function LeadsSection({freshsalesLeadsData, minDate, maxDate}: {freshsalesLeadsData: FreshsalesData; minDate: Iso8601Date; maxDate: Iso8601Date}) {
    const totalLeadsCount = {
        //TODO: correct metaInformation
        metaInformation: `Total Leads = ${numberToHumanFriendlyString(freshsalesLeadsData.rows.length)}`,
        count: freshsalesLeadsData.rows
            .filter((row: FreshsalesDataAggregatedRow) => row.date <= maxDate && row.date >= minDate)
            .reduce((totalLeads, row: FreshsalesDataAggregatedRow) => {
                return totalLeads + row.count;
            }, 0),
    };

    const dates = getDates(minDate, maxDate);
    const FreshSalesLeadsDataGroupByLeadStatus = freshsalesLeadsData.rows
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
