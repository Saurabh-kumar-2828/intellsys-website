import type {LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {AgGridReact} from "ag-grid-react";
import {CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from "chart.js";
import {DateTime} from "luxon";
import {useCallback, useEffect, useRef, useState} from "react";
import {Line} from "react-chartjs-2";
import {AdsDataAggregatedRow, FreshsalesData, FreshsalesDataAggregatedRow, getAdsData, getFreshsalesData, getShopifyData, ShopifyDataAggregatedRow, TimeGranularity} from "~/backend/business-insights";
import {getCapturedUtmCampaignLibrary, getProductLibrary, ProductInformation, SourceInformation} from "~/backend/common";
import {aggregateByDate, columnWiseSummationOfMatrix, createGroupByReducer, sumReducer} from "~/backend/utilities/utilities";
import {HorizontalSpacer} from "~/components/reusableComponents/horizontalSpacer";
import {Card, DateFilterSection, FancySearchableMultiSelect, GenericCard} from "~/components/scratchpad";
import {Iso8601Date, QueryFilterType} from "~/utilities/typeDefinitions";
import {defaultColumnDefinitions, distinct, getDates, getNonEmptyStringOrNull, numberToHumanFriendlyString, roundOffToTwoDigits} from "~/utilities/utilities";

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

type LoaderData = {
    appliedMinDate: Iso8601Date;
    appliedMaxDate: Iso8601Date;
    appliedSelectedGranularity: TimeGranularity;
    allProductInformation: Array<ProductInformation>;
    allSourceInformation: Array<SourceInformation>;
    freshsalesLeadsData: FreshsalesData;
    adsData: {
        metaQuery: string;
        rows: Array<AdsDataAggregatedRow>;
    };
    shopifyData: {
        metaQuery: string;
        rows: Array<ShopifyDataAggregatedRow>;
    };
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    // TODO: Make a function for parsing this, including handling invalid values
    const selectedGranularityRaw = getNonEmptyStringOrNull(urlSearchParams.get("selected_granularity"));
    let selectedGranularity;
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
    const loaderData: LoaderData = {
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: minDate,
        appliedMaxDate: maxDate,
        allProductInformation: await getProductLibrary(),
        allSourceInformation: await getCapturedUtmCampaignLibrary(),
        shopifyData: await getShopifyData(minDate, maxDate, selectedGranularity),
        freshsalesLeadsData: await getFreshsalesData(minDate, maxDate, selectedGranularity),
        adsData: await getAdsData(minDate, maxDate, selectedGranularity),
    };

    return json(loaderData);
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, allProductInformation, allSourceInformation, adsData, freshsalesLeadsData, shopifyData} = useLoaderData() as LoaderData;

    const businesses = distinct(allProductInformation.map((productInformation: ProductInformation) => productInformation.category));
    let products = distinct(allProductInformation.map((productInformation: ProductInformation) => productInformation.productName));
    let campaigns = distinct(allSourceInformation.map((sourceInformation: SourceInformation) => sourceInformation.campaignName));
    const platforms = distinct(allSourceInformation.map((sourceInformation: SourceInformation) => sourceInformation.platform));

    // TODO: Add additional filtering to ensure this only shows facebook campaigns
    // TODO: Add additional filtering to remove on form fb leads

    const [selectedCategories, setSelectedCategories] = useState<Array<string>>([]);
    const [selectedProducts, setSelectedProducts] = useState<Array<string>>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Array<string>>([]);
    const [selectedGranularity, setSelectedGranularity] = useState<TimeGranularity>(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState<Iso8601Date>(appliedMinDate);
    const [selectedMaxDate, setSelectedMaxDate] = useState<Iso8601Date>(appliedMaxDate);

    // TODO: Update filters when changing another one

    products = allProductInformation
        .filter((productInformation: ProductInformation) => selectedCategories.length == 0 || selectedCategories.includes(productInformation.category))
        .map((productInformation: {productName: string}) => productInformation.productName);
    campaigns = distinct(
        allSourceInformation
            .filter((sourceInformation: SourceInformation) => selectedCategories.length == 0 || selectedCategories.includes(sourceInformation.category))
            .filter((sourceInformation: SourceInformation) => selectedPlatforms.length == 0 || selectedPlatforms.includes(sourceInformation.platform))
            .map((sourceInformation: SourceInformation) => sourceInformation.campaignName)
    );
    const granularities = [TimeGranularity.daily, TimeGranularity.monthly, TimeGranularity.yearly];

    const filterFreshsalesData = freshsalesLeadsData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform));

    const filterShopifyData = shopifyData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.productCategory))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform))
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
                page="campaigns-funnel-view"
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

            <CampaignsSection shopifyData={filterShopifyData} adsData={filterAdsData} freshsalesLeadsData={filterFreshsalesData} minDate={appliedMinDate} maxDate={appliedMaxDate} />
            <CampaignsSection shopifyData={filterShopifyData} adsData={filterAdsData} freshsalesLeadsData={filterFreshsalesData} minDate={appliedMinDate} maxDate={appliedMaxDate} />
        </div>
    );
}

function CampaignsSection({
    freshsalesLeadsData,
    adsData,
    shopifyData,
    minDate,
    maxDate,
}: {
    freshsalesLeadsData: Array<FreshsalesDataAggregatedRow>;
    adsData: Array<AdsDataAggregatedRow>;
    shopifyData: Array<ShopifyDataAggregatedRow>;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
}) {
    const gridRef = useRef();

    const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    const [showAmountSpent, setShowAmountSpent] = useState(true);
    const [showClicks, setShowClicks] = useState(false);
    const [showImpressions, setShowImpressions] = useState(false);

    const onSelectionChanged = useCallback(() => {
        var selectedRows = gridRef.current.api.getSelectedRows();
        const campaigns = selectedRows.map((row) => row.campaignName);
        setSelectedCampaigns(campaigns);
    }, []);

    const dayWiseCampaignsTrends = getDayWiseCampaignsTrends(freshsalesLeadsData, adsData, shopifyData, minDate, maxDate);

    const campaigns = Object.keys(dayWiseCampaignsTrends);

    const performanceleadscount = {
        count: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].leads.reduce(sumReducer, 0)).reduce(sumReducer, 0),
        metaInformation: "Number of leads created",
    };

    // TODO: net quantity or count?
    const sales = {
        count: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].orders.reduce(sumReducer, 0)).reduce(sumReducer, 0),
        metaInformation: "Number of units sold",
    };

    const campaignsInformation = {
        impressions: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].impressions.reduce(sumReducer, 0)).reduce(sumReducer, 0),
        amountSpent: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].amountSpent.reduce(sumReducer, 0)).reduce(sumReducer, 0),
        clicks: selectedCampaigns.map((campaign) => dayWiseCampaignsTrends[campaign!].clicks.reduce(sumReducer, 0)).reduce(sumReducer, 0),
    };

    // graphs
    const labels = getDates(minDate, maxDate);
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
                      selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
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
                      selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
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
                      selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
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
                    rowData={campaigns.map((campaign: string) => ({
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
                <Card information={numberToHumanFriendlyString(campaignsInformation.amountSpent)} label="Spends" metaInformation={"Spends"} className="tw-row-start-1" />
                <Card information={numberToHumanFriendlyString(campaignsInformation.impressions)} label="Impressions" metaInformation={"Impressions"} className="tw-row-start-2" />
                <Card information={numberToHumanFriendlyString(campaignsInformation.clicks)} label="Clicks" metaInformation={"Clicks"} className="tw-row-start-3" />
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
                    metaQuery={shopifyData.metaQuery}
                />
            </div>
        </>
    );
}

function getDayWiseCampaignsTrends(
    freshsalesLeadsData: Array<FreshsalesDataAggregatedRow>,
    adsData: Array<AdsDataAggregatedRow>,
    shopifyData: Array<ShopifyDataAggregatedRow>,
    minDate: Iso8601Date,
    maxDate: Iso8601Date
) {
    type dayWiseDistributionPerCampaignObject = {
        impressions: Array<number>;
        clicks: Array<number>;
        amountSpent: Array<number>;
        leads: Array<number>;
        orders: Array<number>;
    };

    const dates = getDates(minDate, maxDate);
    const adsDataGroupByCampaign = adsData.reduce(createGroupByReducer("campaignName"), {});
    // TODO: Is this correct?
    const freshsalesDataGroupByCampaign = freshsalesLeadsData.reduce(createGroupByReducer("leadGenerationSourceCampaignName"), {});
    const shopifyDataGroupByCampaign = shopifyData.reduce(createGroupByReducer("leadGenerationSourceCampaignName"), {});

    // Datatable
    const dayWiseDistributionPerCampaign: {[key: string]: dayWiseDistributionPerCampaignObject} = {};
    for (const campaign in adsDataGroupByCampaign) {
        let dayWiseLeads: Array<number> = [];
        let dayWiseOrders: Array<number> = [];
        const dayWiseImpressions: Array<number> = aggregateByDate(adsDataGroupByCampaign[campaign], "impressions", dates);
        const dayWiseClicks: Array<number> = aggregateByDate(adsDataGroupByCampaign[campaign], "clicks", dates);
        const dayWiseAmountSpent: Array<number> = aggregateByDate(adsDataGroupByCampaign[campaign], "amountSpent", dates);
        if (campaign in freshsalesDataGroupByCampaign) {
            dayWiseLeads = aggregateByDate(freshsalesDataGroupByCampaign[campaign], "count", dates);
        }
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
