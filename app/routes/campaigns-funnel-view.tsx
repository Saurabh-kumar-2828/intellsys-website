import type {LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {AgGridReact} from "ag-grid-react";
import {CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from "chart.js";
import {DateTime} from "luxon";
import {useCallback, useEffect, useRef, useState} from "react";
import {Line} from "react-chartjs-2";
import {getAdsData, getFreshsalesData, getShopifyData} from "~/backend/business-insights";
import {getAllProductInformation, getAllSourceToInformation} from "~/backend/common";
import {
    aggregateByDate,
    columnWiseSummationOfMatrix,
    createGroupByReducer,
    doesFreshsalesLeadsToSourceWithInformationSourceCorrespondToPerformanceLead,
    sumReducer,
} from "~/backend/utilities/utilities";
import {HorizontalSpacer} from "~/components/reusableComponents/horizontalSpacer";
import {Card, DateFilterSection, DateFilterSection, FancySearchableMultiSelect, GenericCard} from "~/components/scratchpad";
import {QueryFilterType} from "~/utilities/typeDefinitions";
import {distinct, getDates, numberToHumanFriendlyString, roundOffToTwoDigits} from "~/utilities/utilities";

export const meta: MetaFunction = () => {
    return {
        title: "Facebook Campaigns Funnel - Intellsys",
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
    let selectedGranularity;
    if (selectedGranularityRaw == null || selectedGranularityRaw.length == 0) {
        selectedGranularity = "Daily";
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
        allProductInformation: await getAllProductInformation(),
        allSourceInformation: await getAllSourceToInformation(),
        CampaignsInformation: await getAdsData(minDate, maxDate, selectedGranularity),
        freshsalesLeadsData: await getFreshsalesData(minDate, maxDate, selectedGranularity),
        adsData: await getAdsData(minDate, maxDate, selectedGranularity),
        shopifyData: await getShopifyData(minDate, maxDate, selectedGranularity),
    });
};

function getDayWiseCampaignsTrends(adsData: Array<object>, freshSalesData: Array<object>, shopifyData: Array<object>, minDate: Date, maxDate: Date) {
    const dates = getDates(minDate, maxDate);

    const adsDataGroupByCampaign = adsData.reduce(createGroupByReducer("campaignName"), {});
    const freshSalesDataGroupByCampaign = freshSalesData.filter((row) => doesFreshsalesLeadsToSourceWithInformationSourceCorrespondToPerformanceLead(row)).reduce(createGroupByReducer("campaign"), {});
    const shopifyDataGroupByCampaign = shopifyData.reduce(createGroupByReducer("sourceCampaignName"), {});

    const dayWiseDistributionPerCampaign = {};
    for (const campaign in adsDataGroupByCampaign) {
        const dayWiseImpressions = aggregateByDate(adsDataGroupByCampaign[campaign], "impressions", dates);
        const dayWiseClicks = aggregateByDate(adsDataGroupByCampaign[campaign], "clicks", dates);
        const dayWiseAmountSpent = aggregateByDate(adsDataGroupByCampaign[campaign], "amountSpent", dates);
        let dayWiseLeads: Array<number> = [];
        if (campaign in freshSalesDataGroupByCampaign) {
            dayWiseLeads = aggregateByDate(freshSalesDataGroupByCampaign[campaign], "count", dates);
        }

        let dayWiseOrders: Array<number> = [];
        if (campaign in shopifyDataGroupByCampaign) {
            dayWiseOrders = aggregateByDate(shopifyDataGroupByCampaign[campaign], "netQuantity", dates);
        }

        dayWiseDistributionPerCampaign[campaign] = {
            impressions: dayWiseImpressions,
            clicks: dayWiseClicks,
            amountSpent: dayWiseAmountSpent,
            leads: dayWiseLeads,
            orders: dayWiseOrders,
        };
    }

    return dayWiseDistributionPerCampaign;
}

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, allProductInformation, allSourceInformation, adsData, freshsalesLeadsData, shopifyData} = useLoaderData();

    const businesses = distinct(allProductInformation.map((productInformation) => productInformation.category));
    let products = distinct(allProductInformation.map((productInformation) => productInformation.productName));
    let campaigns = distinct(allSourceInformation.map((sourceInformation) => sourceInformation.productName));
    const platforms = distinct(allSourceInformation.map((sourceInformation) => sourceInformation.platform));

    // TODO: Add additional filtering to ensure this only shows facebook campaigns
    // TODO: Add additional filtering to remove on form fb leads

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [selectedGranularity, setSelectedGranularity] = useState(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState(appliedMinDate ?? "");
    const [selectedMaxDate, setSelectedMaxDate] = useState(appliedMaxDate ?? "");

    // TODO: Update filters when changing another one

    products = allProductInformation
        .filter((productInformation) => selectedCategories.length == 0 || selectedCategories.includes(productInformation.category))
        .map((productInformation) => productInformation.productName);
    campaigns = distinct(
        allSourceInformation
            .filter((sourceInformation) => selectedCategories.length == 0 || selectedCategories.includes(sourceInformation.category))
            .filter((sourceInformation) => selectedPlatforms.length == 0 || selectedPlatforms.includes(sourceInformation.platform))
            .map((sourceInformation) => sourceInformation.campaignName)
    );
    const granularities = ["Daily", "Monthly", "Yearly"];

    const filterFreshsalesData = freshsalesLeadsData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.platform));

    const filterShopifyData = shopifyData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.sourcePlatform))
        .filter((row) => selectedProducts.length == 0 || selectedProducts.includes(row.productTitle));

    const filterAdsData = adsData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.platform));

    useEffect(() => {
        setSelectedProducts([]);
        setSelectedPlatforms([]);
    }, [selectedCategories]);

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <DateFilterSection
                granularities={granularities}
                selectedGranularity={selectedGranularity}
                setSelectedGranularity={setSelectedGranularity}
                selectedMinDate={selectedMinDate}
                setSelectedMinDate={setSelectedMinDate}
                selectedMaxDate={selectedMaxDate}
                setSelectedMaxDate={setSelectedMaxDate}
                page={"campaigns-funnel-view"}
            />

            <div className="tw-col-span-12 tw-bg-dark-bg-400 tw-sticky tw-top-32 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                <FancySearchableMultiSelect
                    label="Choose Category"
                    options={businesses}
                    selectedOptions={selectedCategories}
                    setSelectedOptions={setSelectedCategories}
                    filterType={QueryFilterType.category}
                />
                <FancySearchableMultiSelect
                    label="Choose Products"
                    options={products}
                    selectedOptions={selectedProducts}
                    setSelectedOptions={setSelectedProducts}
                    filterType={QueryFilterType.product}
                />
                <FancySearchableMultiSelect
                    label="Choose Platforms"
                    options={platforms}
                    selectedOptions={selectedPlatforms}
                    setSelectedOptions={setSelectedPlatforms}
                    filterType={QueryFilterType.platform}
                />
            </div>

            <CampaignsSection shopifyData={filterShopifyData} adsData={filterAdsData} freshsalesData={filterFreshsalesData} minDate={appliedMinDate} maxDate={appliedMaxDate} />
            <CampaignsSection shopifyData={filterShopifyData} adsData={filterAdsData} freshsalesData={filterFreshsalesData} minDate={appliedMinDate} maxDate={appliedMaxDate} />
        </div>
    );
}

function CampaignsSection(props: {shopifyData: any; adsData: any; freshsalesData: any; minDate: Date; maxDate: Date}) {
    const gridRef = useRef();

    const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    const [showAmountSpent, setShowAmountSpent] = useState(true);
    const [showClicks, setShowClicks] = useState(false);
    const [showImpressions, setShowImpressions] = useState(false);

    const onSelectionChanged = useCallback(() => {
        var selectedRows = gridRef.current.api.getSelectedRows();
        const campaigns = selectedRows.map((row, index) => row.campaignName);
        setSelectedCampaigns(campaigns);
    }, []);

    const defaultColumnDefinitions = {
        sortable: true,
        filter: true,
    };

    const dayWiseCampaignsTrends = getDayWiseCampaignsTrends(props.adsData, props.freshsalesData, props.shopifyData, props.minDate, props.maxDate);
    const campaigns = Object.keys(dayWiseCampaignsTrends);

    const performanceleadscount = {
        count: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].leads.reduce(sumReducer, 0)).reduce(sumReducer, 0),
        metaInformation: "performance leads",
    };

    // TODO: net quantity or count?
    const sales = {
        count: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].orders.reduce(sumReducer, 0)).reduce(sumReducer, 0),
        metaInformation: "sales",
    };

    const campaignsInformation = {
        impressions: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].impressions.reduce(sumReducer, 0)).reduce(sumReducer, 0),
        amountSpent: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].amountSpent.reduce(sumReducer, 0)).reduce(sumReducer, 0),
        clicks: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].clicks.reduce(sumReducer, 0)).reduce(sumReducer, 0),
    };

    // graphs
    const labels = getDates(props.minDate, props.maxDate);
    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Day wise distribution",
            },
        },
    };

    let color = "rgb(121,23,255)";
    const yClicks = {
        label: "Clicks",
        data:
            selectedCampaigns.length > 0
                ? columnWiseSummationOfMatrix(
                      selectedCampaigns.reduce((result, campaign) => {
                          result.push(dayWiseCampaignsTrends[campaign].clicks);
                          return result;
                      }, [])
                  )
                : [],
        borderColor: color,
        backgroundColor: color,
    };

    color = "rgb(255,23,255)";
    const yImpressions = {
        label: "Impressions",
        data:
            selectedCampaigns.length > 0
                ? columnWiseSummationOfMatrix(
                      selectedCampaigns.reduce((result, campaign) => {
                          result.push(dayWiseCampaignsTrends[campaign].impressions);
                          return result;
                      }, [])
                  )
                : [],
        borderColor: color,
        backgroundColor: color,
    };

    color = "rgb(125,255,255)";
    const yAmountSpent = {
        label: "Amount Spent",
        data:
            selectedCampaigns.length > 0
                ? columnWiseSummationOfMatrix(
                      selectedCampaigns.reduce((result, campaign) => {
                          result.push(dayWiseCampaignsTrends[campaign].amountSpent);
                          return result;
                      }, [])
                  )
                : [],
        borderColor: color,
        backgroundColor: color,
    };

    const yClicksData = {
        labels,
        datasets: [yClicks],
    };

    const yImpressionsData = {
        labels,
        datasets: [yImpressions],
    };

    const yAmountSpentData = {
        labels,
        datasets: [yAmountSpent],
    };

    const funnelSlope = 8;

    return (
        <>
            <div className="tw-col-span-6 tw-h-[640px] ag-theme-alpine-dark">
                <AgGridReact
                    ref={gridRef}
                    rowData={campaigns.map((campaign: string, index) => ({
                        campaignName: campaign,
                        impressions: dayWiseCampaignsTrends[campaign].impressions.reduce(sumReducer, 0),
                        amountSpent: roundOffToTwoDigits(dayWiseCampaignsTrends[campaign].amountSpent.reduce(sumReducer, 0)),
                        clicks: dayWiseCampaignsTrends[campaign].clicks.reduce(sumReducer, 0),
                        leads: dayWiseCampaignsTrends[campaign].leads.reduce(sumReducer, 0),
                        orders: dayWiseCampaignsTrends[campaign].orders.reduce(sumReducer, 0),
                    }))}
                    columnDefs={[
                        {
                            headerName: "Campaign",
                            field: "campaignName",
                            headerCheckboxSelection: true,
                            showDisabledCheckboxes: true,
                            checkboxSelection: (params) => {
                                return !!params.data;
                            },
                            minWidth: 250,
                        },
                        {headerName: "Impressions", field: "impressions", sort: "desc", sortIndex: 1},
                        {headerName: "Amount Spent", field: "amountSpent"},
                        {headerName: "Clicks", field: "clicks"},
                        {headerName: "Leads", field: "leads"},
                        {headerName: "Orders", field: "orders"},
                    ]}
                    defaultColDef={defaultColumnDefinitions}
                    animateRows={true}
                    rowSelection={"multiple"}
                    onSelectionChanged={onSelectionChanged}
                />
            </div>

            <div className="tw-col-span-6 tw-grid tw-grid-cols-[1fr_2fr] tw-items-stretch tw-gap-x-4">
                <Card information={numberToHumanFriendlyString(campaignsInformation.amountSpent)} label="Spends" metaInformation={props.adsData.metaQuery} className="tw-row-start-1" />
                <Card information={numberToHumanFriendlyString(campaignsInformation.impressions)} label="Impressions" metaInformation={props.adsData.metaQuery} className="tw-row-start-2" />
                <Card information={numberToHumanFriendlyString(campaignsInformation.clicks)} label="Clicks" metaInformation={props.adsData.metaQuery} className="tw-row-start-3" />
                <Card information={numberToHumanFriendlyString(performanceleadscount.count)} label="Leads" metaInformation={performanceleadscount.metaInformation} className="tw-row-start-4" />
                <Card information={numberToHumanFriendlyString(sales.count)} label="Orders" metaInformation={sales.metaInformation} className="tw-row-start-5" />

                <div className="tw-row-start-1 tw-col-start-2 tw-bg-violet-700" style={{clipPath: `polygon(0 0, 100% 0, ${100 - funnelSlope}% 100%, ${funnelSlope}% 100%)`}} />
                <div className="tw-row-start-1 tw-col-start-2 tw-text-white tw-grid tw-place-content-center tw-z-10">
                    <div>Amount Spent: ₹{numberToHumanFriendlyString(campaignsInformation.amountSpent)}</div>
                </div>

                <div
                    className="tw-row-start-2 tw-col-start-2 tw-bg-blue-700"
                    style={{clipPath: `polygon(${funnelSlope}% 0, ${100 - funnelSlope}% 0, ${100 - 2 * funnelSlope}% 100%, ${2 * funnelSlope}% 100%)`}}
                />
                <div className="tw-row-start-2 tw-col-start-2 tw-text-white tw-z-10 tw-grid tw-place-content-center tw-text-center">
                    <div>Impressions: {numberToHumanFriendlyString(campaignsInformation.impressions)}</div>
                    <div>(CPI = ₹{numberToHumanFriendlyString(campaignsInformation.amountSpent / campaignsInformation.impressions, true)})</div>
                </div>

                <div
                    className="tw-row-start-3 tw-col-start-2 tw-bg-cyan-600"
                    style={{clipPath: `polygon(${2 * funnelSlope}% 0, ${100 - 2 * funnelSlope}% 0, ${100 - 3 * funnelSlope}% 100%, ${3 * funnelSlope}% 100%)`}}
                />
                <div className="tw-row-start-3 tw-col-start-2 tw-text-white tw-z-10 tw-grid tw-place-content-center tw-text-center">
                    <div>Clicks: {numberToHumanFriendlyString(campaignsInformation.clicks)}</div>
                    <div>(CTR = {numberToHumanFriendlyString(campaignsInformation.clicks / campaignsInformation.impressions, true, true, true)})</div>
                    <div>(CPC = ₹{numberToHumanFriendlyString(campaignsInformation.amountSpent / campaignsInformation.clicks, true)})</div>
                </div>

                <div
                    className="tw-row-start-4 tw-col-start-2 tw-bg-emerald-600"
                    style={{clipPath: `polygon(${3 * funnelSlope}% 0, ${100 - 3 * funnelSlope}% 0, ${100 - 4 * funnelSlope}% 100%, ${4 * funnelSlope}% 100%)`}}
                />
                <div className="tw-row-start-4 tw-col-start-2 tw-text-white tw-z-10 tw-grid tw-place-content-center tw-text-center">
                    <div>Leads: {numberToHumanFriendlyString(performanceleadscount.count)}</div>
                    <div>(CPL = ₹{numberToHumanFriendlyString(campaignsInformation.amountSpent / performanceleadscount.count, true)})</div>
                </div>

                <div
                    className="tw-row-start-5 tw-col-start-2 tw-bg-lime-600"
                    style={{clipPath: `polygon(${4 * funnelSlope}% 0, ${100 - 4 * funnelSlope}% 0, ${100 - 5 * funnelSlope}% 100%, ${5 * funnelSlope}% 100%)`}}
                />
                <div className="tw-row-start-5 tw-col-start-2 tw-text-white tw-z-10 tw-grid tw-place-content-center tw-text-center">
                    <div>Sales: {numberToHumanFriendlyString(sales.count)}</div>
                    <div>(CR = {numberToHumanFriendlyString(sales.count / performanceleadscount.count, true, true, true)})</div>
                </div>
            </div>

            <div className="tw-col-span-12 tw-grid">
                <GenericCard
                    content={
                        <div className="tw-grid tw-grid-cols-4">
                            <div className="tw-row-start-1 tw-col-start-2 tw-col-span-2 tw-grid">
                                {showAmountSpent && <Line options={options} data={yAmountSpentData} className="tw-row-start-1 tw-col-start-1" />}
                                {showImpressions && <Line options={options} data={yImpressionsData} className="tw-row-start-1 tw-col-start-1" />}
                                {showClicks && <Line options={options} data={yClicksData} className="tw-row-start-1 tw-col-start-1" />}
                            </div>

                            <div className="tw-row-start-2 tw-col-start-1 tw-col-span-4 tw-flex tw-flex-row tw-justify-center">
                                <input type="checkbox" id="amountspent" checked={showAmountSpent} onChange={(e) => setShowAmountSpent(e.target.checked)} />
                                <label htmlFor="amountspent" className="tw-pl-2">
                                    Amount Spent
                                </label>

                                <HorizontalSpacer className="tw-w-8" />

                                <input type="checkbox" id="clicks" checked={showClicks} onChange={(e) => setShowClicks(e.target.checked)} />
                                <label htmlFor="clicks" className="tw-pl-2">
                                    Clicks
                                </label>

                                <HorizontalSpacer className="tw-w-8" />

                                <input type="checkbox" id="impressions" checked={showImpressions} onChange={(e) => setShowImpressions(e.target.checked)} />
                                <label htmlFor="impressions" className="tw-pl-2">
                                    Impressions
                                </label>
                            </div>
                        </div>
                    }
                    metaQuery={props.shopifyData.metaQuery}
                />
            </div>
        </>
    );
}
