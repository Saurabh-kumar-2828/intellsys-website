import {json, LinksFunction, LoaderFunction, MetaFunction, redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {AgGridReact} from "ag-grid-react";
import styles from "app/styles.css";
import {DateTime} from "luxon";
import {useCallback, useEffect, useRef, useState} from "react";
import {
    AdsDataAggregatedRow,
    FreshsalesData,
    FreshsalesDataAggregatedRow,
    getFreshsalesData,
    getGoogleAdsData,
    getShopifyData,
    getTimeGranularityFromUnknown,
    ShopifyDataAggregatedRow,
    TimeGranularity,
} from "~/backend/business-insights";
import {CampaignInformation, getCampaignLibrary, getProductLibrary, ProductInformation} from "~/backend/common";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {ComposedChart} from "~/components/d3Componenets/composedChartComponent";
import {LineGraphComponent} from "~/components/d3Componenets/lineGraphComponent";
import {progressCellRendererTarget} from "~/components/progressCellRenderer";
import {HorizontalSpacer} from "~/components/reusableComponents/horizontalSpacer";
import {CustomCard, DateFilterSection, FancySearchableMultiSelect, GenericCard, SmallValueDisplayingCardWithTarget} from "~/components/scratchpad";
import {Iso8601Date, QueryFilterType, Uuid, ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
import {
    aggregateByDate,
    campaignsColorPalette,
    columnWiseSummationOfMatrix,
    createGroupByReducer,
    defaultColumnDefinitions,
    distinct,
    getDates,
    getNonEmptyStringOrNull,
    numberToHumanFriendlyString,
    roundOffToTwoDigits,
    Scale,
    sumReducer,
} from "~/utilities/utilities";

export const meta: MetaFunction = () => {
    return {
        title: "Google Ads Funnel - Intellsys",
    };
};

export const links: LinksFunction = () => {
    return [
        {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-grid.css"},
        {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-theme-alpine.css"},
        {rel: "stylesheet", href: styles},
    ];
};

type LoaderData = {
    appliedMinDate: Iso8601Date;
    appliedMaxDate: Iso8601Date;
    appliedSelectedGranularity: TimeGranularity;
    allProductInformation: Array<ProductInformation>;
    allCampaignInformation: Array<CampaignInformation>;
    freshsalesLeadsData: FreshsalesData;
    googleAdsData: {
        metaQuery: string;
        rows: Array<AdsDataAggregatedRow>;
    };
    shopifyData: {
        metaQuery: string;
        rows: Array<ShopifyDataAggregatedRow>;
    };
    companyId: Uuid;
};

export const loader: LoaderFunction = async ({request, params}) => {
    const accessToken = await getAccessTokenFromCookies(request);

    if (accessToken == null) {
        // TODO: Add message in login page
        return redirect(`/sign-in?redirectTo=${getUrlFromRequest(request)}`);
    }

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const urlSearchParams = new URL(request.url).searchParams;

    const selectedGranularityRaw = getNonEmptyStringOrNull(urlSearchParams.get("selected_granularity"));
    const selectedGranularity: TimeGranularity = selectedGranularityRaw == null ? TimeGranularity.daily : getTimeGranularityFromUnknown(selectedGranularityRaw);

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
        allProductInformation: await getProductLibrary(companyId),
        allCampaignInformation: await getCampaignLibrary(companyId),
        freshsalesLeadsData: await getFreshsalesData(minDate, maxDate, selectedGranularity, companyId),
        googleAdsData: await getGoogleAdsData(minDate, maxDate, selectedGranularity, companyId),
        shopifyData: await getShopifyData(minDate, maxDate, selectedGranularity, companyId),
        companyId: companyId,
    };

    return json(loaderData);
};

type dayWiseDistributionPerCampaignObject = {
    impressions: Array<number>;
    clicks: Array<number>;
    amountSpent: Array<number>;
    leads: Array<number>;
    orders: Array<number>;
};

type campaignTargetObject = {
    impressions: number;
    clicks: number;
    amountSpent: number;
    leads: number;
    orders: number;
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, allProductInformation, allCampaignInformation, freshsalesLeadsData, googleAdsData, shopifyData, companyId} = useLoaderData() as LoaderData;

    const businesses = distinct(allProductInformation.map((productInformation: ProductInformation) => productInformation.category));
    let products = distinct(allProductInformation.map((productInformation: ProductInformation) => productInformation.productName));
    let campaigns = distinct(allCampaignInformation.map((campaignInformation: CampaignInformation) => campaignInformation.campaignName));
    const platforms = distinct(allCampaignInformation.map((campaignInformation: CampaignInformation) => campaignInformation.platform));

    // TODO: Add additional filtering to ensure this only shows facebook campaigns
    // TODO: Add additional filtering to remove on form fb leads

    const [selectedCategories, setSelectedCategories] = useState<Array<string>>([]);
    const [selectedProducts, setSelectedProducts] = useState<Array<string>>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Array<string>>([]);
    const [selectedGranularity, setSelectedGranularity] = useState<TimeGranularity>(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState<Iso8601Date>(appliedMinDate);
    const [selectedMaxDate, setSelectedMaxDate] = useState<Iso8601Date>(appliedMaxDate);
    const [hoverOnImpressionsCard, setHoverOnImpressionsCard] = useState(false);

    // TODO: Update filters when changing another one

    products = allProductInformation
        .filter((productInformation: ProductInformation) => selectedCategories.length == 0 || selectedCategories.includes(productInformation.category))
        .map((productInformation: {productName: string}) => productInformation.productName);
    campaigns = distinct(
        allCampaignInformation
            .filter((campaignInformation: CampaignInformation) => selectedCategories.length == 0 || selectedCategories.includes(campaignInformation.category))
            .filter((campaignInformation: CampaignInformation) => selectedPlatforms.length == 0 || selectedPlatforms.includes(campaignInformation.platform))
            .map((campaignInformation: CampaignInformation) => campaignInformation.campaignName),
    );
    const granularities = [TimeGranularity.daily, TimeGranularity.monthly, TimeGranularity.yearly];

    const filterFreshsalesData = freshsalesLeadsData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform));

    const filterShopifyData = shopifyData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.productCategory))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform))
        .filter((row) => selectedProducts.length == 0 || selectedProducts.includes(row.productTitle));

    const filterAdsData = googleAdsData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.platform));

    useEffect(() => {
        setSelectedProducts([]);
        setSelectedPlatforms([]);
    }, [selectedCategories]);

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
                    page={`/${companyId}/google-ads-funnel`}
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
            </div>
            <div className="tw-grid tw-grid-cols-2 tw-gap-x-5 tw-px-4 tw-py-4">
                <div className="tw-grid-col-start-1">
                    <CampaignsSection
                        shopifyData={filterShopifyData}
                        adsData={filterAdsData}
                        freshsalesLeadsData={filterFreshsalesData}
                        minDate={appliedMinDate}
                        maxDate={appliedMaxDate}
                        hoverOnImpressionCard={hoverOnImpressionsCard}
                        setHoverOnImpressionCard={setHoverOnImpressionsCard}
                    />
                </div>

                <div className="tw-grid-col-start-1">
                    <CampaignsSection
                        shopifyData={filterShopifyData}
                        adsData={filterAdsData}
                        freshsalesLeadsData={filterFreshsalesData}
                        minDate={appliedMinDate}
                        maxDate={appliedMaxDate}
                        hoverOnImpressionCard={hoverOnImpressionsCard}
                        setHoverOnImpressionCard={setHoverOnImpressionsCard}
                    />
                </div>
            </div>
        </>
    );
}

function CampaignsSection({
    freshsalesLeadsData,
    adsData,
    shopifyData,
    minDate,
    maxDate,
    hoverOnImpressionCard,
    setHoverOnImpressionCard,
}: {
    freshsalesLeadsData: Array<FreshsalesDataAggregatedRow>;
    adsData: Array<AdsDataAggregatedRow>;
    shopifyData: Array<ShopifyDataAggregatedRow>;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    hoverOnImpressionCard: boolean;
    setHoverOnImpressionCard: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const gridRef = useRef(null);

    const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    const [showAmountSpent, setShowAmountSpent] = useState(true);
    const [showClicks, setShowClicks] = useState(false);
    const [showImpressions, setShowImpressions] = useState(false);

    const onSelectionChanged = useCallback(() => {
        var selectedRows = gridRef.current.api.getSelectedRows();
        const campaigns = selectedRows.map((row) => row.campaignName);
        setSelectedCampaigns(campaigns);
    }, []);

    const onDataFirstRendered = useCallback((params) => {
        gridRef.current.api.forEachNode((node) =>
          node.setSelected(true)
        );
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

    // Graphs
    const labels = getDates(minDate, maxDate);

    // Targets
    const targetForCampaigns =
        campaigns.length > 0
            ? campaigns.reduce((result: {[key: string]: campaignTargetObject}, currentCampaign) => {
                  result[currentCampaign] = {
                      impressions: 400000,
                      clicks: 20000,
                      amountSpent: 200000,
                      leads: 2000,
                      orders: 100,
                  };
                  return result;
              }, {})
            : {};

    // Data for lineChartComponent

    const amountSpent =
        selectedCampaigns.length > 0
            ? columnWiseSummationOfMatrix(
                  selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
                      result.push(dayWiseCampaignsTrends[campaign].amountSpent);
                      return result;
                  }, []),
              )
            : [];

    const clicks =
        selectedCampaigns.length > 0
            ? columnWiseSummationOfMatrix(
                  selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
                      result.push(dayWiseCampaignsTrends[campaign].clicks);
                      return result;
                  }, []),
              )
            : [];

    const impressions =
        selectedCampaigns.length > 0
            ? columnWiseSummationOfMatrix(
                  selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
                      result.push(dayWiseCampaignsTrends[campaign].impressions);
                      return result;
                  }, []),
              )
            : [];

    const impressionsLineData = {
        series: {
            name: "Impressions",
            color: "#FF9F47",
            values: impressions.map((d, index) => ({date: labels[index], value: d})),
        },
        dates: labels,
        yMax: impressions.length > 0 ? Math.max(...impressions) : 100,
    };

    const clicksLineData = {
        series: {
            name: "Clicks",
            color: "#a5b4fc",
            values: clicks.map((d, index) => ({date: labels[index], value: d})),
        },
        dates: labels,
        yMax: amountSpent.length > 0 ? Math.max(...clicks) : 100,
    };

    const salesLineData = {
        series: {
            name: "Net amount spent",
            color: "#fbbf24",
            values: amountSpent.map((d, index) => ({date: labels[index], value: d})),
        },
        dates: labels,
        yMax: amountSpent.length > 0 ? Math.max(...amountSpent) : 100,
    };

    const canvasDimensions = {
        height: 533,
        width: 680,
    };

    return (
        <div className="tw-grid tw-grid-cols-1 tw-gap-y-8">
            <div className="tw-row-start-1">
                <div className="tw-h-[410px] ag-theme-alpine-dark ag-root-wrapper">
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
                                headerClass: "tw-text-sm tw-font-medium",
                            },
                            {
                                headerName: "Impressions",
                                field: "impressions",
                                sort: "desc",
                                sortIndex: 1,
                                cellRenderer: progressCellRendererTarget,
                                cellRendererParams: {target: targetForCampaigns, color: campaignsColorPalette.impressions},
                                cellClass: "!tw-px-0.5",
                                headerClass: "tw-text-sm tw-font-medium",
                            },
                            {
                                headerName: "Amount Spent",
                                field: "amountSpent",
                                cellRenderer: progressCellRendererTarget,
                                cellRendererParams: {target: targetForCampaigns, color: campaignsColorPalette.amountSpent},
                                cellClass: "!tw-px-0.5",
                                headerClass: "tw-text-sm tw-font-medium",
                            },
                            {
                                headerName: "Clicks",
                                field: "clicks",
                                cellRenderer: progressCellRendererTarget,
                                cellRendererParams: {target: targetForCampaigns, color: campaignsColorPalette.clicks},
                                cellClass: "!tw-px-0.5",
                                headerClass: "tw-text-sm tw-font-medium",
                            },
                            {
                                headerName: "Leads",
                                field: "leads",
                                cellRenderer: progressCellRendererTarget,
                                cellRendererParams: {target: targetForCampaigns, color: campaignsColorPalette.leads},
                                cellClass: "!tw-px-0.5",
                                headerClass: "tw-text-sm tw-font-medium",
                            },
                            {
                                headerName: "Orders",
                                field: "orders",
                                cellRenderer: progressCellRendererTarget,
                                cellRendererParams: {target: targetForCampaigns, color: campaignsColorPalette.orders},
                                cellClass: "!tw-px-0.5",
                                headerClass: "tw-text-sm tw-font-medium",
                            },
                        ]}
                        defaultColDef={defaultColumnDefinitions}
                        animateRows={true}
                        rowSelection={"multiple"}
                        onSelectionChanged={onSelectionChanged}
                        onFirstDataRendered={onDataFirstRendered}
                    />
                </div>
            </div>

            <div className="tw-row-start-2">
                <div className="tw-grid tw-grid-cols-5 tw-gap-x-3">
                    <CustomCard
                        information={`₹${numberToHumanFriendlyString(campaignsInformation.amountSpent, true)}`}
                        label="Amount Spent"
                        metaInformation={"Amount Spent"}
                        className="tw-col-start-1 tw-rounded-lg"
                        informationClassName={"tw-text-2xl tw-font-semibold"}
                    />
                    <CustomCard
                        information={numberToHumanFriendlyString(campaignsInformation.impressions)}
                        label="Impressions"
                        metaInformation={"Impressions"}
                        // onMouseEnter = {handleMouseEvent}
                        className="tw-col-start-2 tw-rounded-lg"
                        extraLabels={[`(CPI = ₹${numberToHumanFriendlyString(campaignsInformation.amountSpent / campaignsInformation.impressions, true)})`]}
                        informationClassName={"tw-text-2xl tw-font-semibold"}
                    />
                    <CustomCard
                        information={numberToHumanFriendlyString(campaignsInformation.clicks)}
                        label="Clicks"
                        metaInformation={"Clicks"}
                        className="tw-col-start-3 tw-rounded-lg"
                        extraLabels={[
                            `CTR = ${numberToHumanFriendlyString(campaignsInformation.clicks / campaignsInformation.impressions, true, true, true)}`,
                            `CPC = ₹${numberToHumanFriendlyString(campaignsInformation.amountSpent / campaignsInformation.clicks, true)}`,
                        ]}
                        informationClassName={"tw-text-2xl tw-font-semibold"}
                    />
                    <CustomCard
                        information={numberToHumanFriendlyString(performanceleadscount.count)}
                        label="Leads"
                        metaInformation={performanceleadscount.metaInformation}
                        className="tw-col-start-4 tw-rounded-lg"
                        extraLabels={[`CPL = ₹${numberToHumanFriendlyString(campaignsInformation.amountSpent / performanceleadscount.count, true)}`]}
                        informationClassName={"tw-text-2xl tw-font-semibold"}
                    />
                    <CustomCard
                        information={numberToHumanFriendlyString(sales.count)}
                        label="Sales"
                        metaInformation={sales.metaInformation}
                        className="tw-col-start-5 tw-rounded-lg"
                        extraLabels={[`CR = ${numberToHumanFriendlyString(sales.count / performanceleadscount.count, true, true, true)}`]}
                        informationClassName={"tw-text-2xl tw-font-semibold"}
                    />
                </div>
            </div>

            <div className="tw-row-start-3">
                <div className="tw-grid tw-grid-cols-10 tw-gap-x-3">
                    <SmallValueDisplayingCardWithTarget
                        label="Spends"
                        value={campaignsInformation.amountSpent}
                        target={1 + campaignsInformation.amountSpent * 1.3}
                        explanation={`Spends = ${numberToHumanFriendlyString(campaignsInformation.amountSpent)}`}
                        type={ValueDisplayingCardInformationType.float}
                        className="tw-col-start-1 hover:bg-sky-700"
                        valueClassName="tw-text-lg tw-px-0.2 tw-font-semibold"
                    />
                    <SmallValueDisplayingCardWithTarget
                        label="Impressions"
                        value={campaignsInformation.impressions}
                        target={1 + campaignsInformation.impressions * 1.3}
                        explanation={`Impressions = ${numberToHumanFriendlyString(campaignsInformation.impressions)}`}
                        type={ValueDisplayingCardInformationType.integer}
                        className="tw-col-start-3"
                        valueClassName="tw-text-lg tw-px-0.2 tw-font-semibold"
                    />
                    <SmallValueDisplayingCardWithTarget
                        label="Clicks"
                        value={campaignsInformation.clicks}
                        target={1 + campaignsInformation.clicks * 1.3}
                        explanation={`Clicks = ${numberToHumanFriendlyString(campaignsInformation.clicks)}`}
                        type={ValueDisplayingCardInformationType.integer}
                        className="tw-col-start-5"
                        valueClassName="tw-text-lg tw-px-0.2 tw-font-semibold"
                    />
                    <SmallValueDisplayingCardWithTarget
                        label="Leads"
                        value={performanceleadscount.count}
                        target={1 + performanceleadscount.count * 1.3}
                        explanation={`Leads = ${numberToHumanFriendlyString(performanceleadscount.count)}`}
                        type={ValueDisplayingCardInformationType.integer}
                        className="tw-col-start-7"
                        valueClassName="tw-text-lg tw-px-0.2 tw-font-semibold"
                    />
                    <SmallValueDisplayingCardWithTarget
                        label="Orders"
                        value={sales.count}
                        target={1 + sales.count * 1.3}
                        explanation={`Orders = ${numberToHumanFriendlyString(sales.count)}`}
                        type={ValueDisplayingCardInformationType.integer}
                        className="tw-col-start-9"
                        valueClassName="tw-text-lg tw-px-0.2 tw-font-semibold"
                    />
                </div>
            </div>

            <div className="tw-row-start-4">
                <div className="tw-grid tw-overflow-auto">
                    <GenericCard
                        content={
                            <div className="tw-grid tw-grid-cols-1 tw-overflow-auto tw-gap-y-2 tw-py-4">
                                <div className="tw-row-start-1">
                                    <ComposedChart
                                        width={canvasDimensions.width}
                                        height={canvasDimensions.height}
                                        xValues={labels}
                                        title={"Day-on-day distribution of selected campaigns"}
                                        className="tw-row-start-1 tw-col-start-1"
                                    >
                                        {showAmountSpent && <LineGraphComponent data={salesLineData} scale={Scale.dataDriven} />}

                                        {showClicks && <LineGraphComponent data={clicksLineData} scale={Scale.dataDriven} />}

                                        {showImpressions && <LineGraphComponent data={impressionsLineData} scale={Scale.dataDriven} />}
                                    </ComposedChart>
                                </div>

                                <div className="tw-row-start-2 tw-flex tw-flex-row tw-justify-center">
                                    <input type="checkbox" className="tw-h-5 tw-w-5" id="amountspent" checked={showAmountSpent} onChange={(e) => setShowAmountSpent(e.target.checked)} />
                                    <label
                                        // TODO: Disabled because having multiple panes is causing issue with this
                                        // htmlFor="amountspent"
                                        className="tw-pl-3 tw-font-sans"
                                    >
                                        Amount Spent
                                    </label>

                                    <HorizontalSpacer className="tw-w-8" />

                                    <input type="checkbox" className="tw-h-5 tw-w-5" id="clicks" checked={showClicks} onChange={(e) => setShowClicks(e.target.checked)} />
                                    <label
                                        // TODO: Disabled because having multiple panes is causing issue with this
                                        // htmlFor="clicks"
                                        className="tw-pl-3 tw-font-sans"
                                    >
                                        Clicks
                                    </label>

                                    <HorizontalSpacer className="tw-w-8" />

                                    <input type="checkbox" className="tw-h-5 tw-w-5" id="impressions" checked={showImpressions} onChange={(e) => setShowImpressions(e.target.checked)} />
                                    <label
                                        // TODO: Disabled because having multiple panes is causing issue with this
                                        // htmlFor="impressions"
                                        className="tw-pl-3 tw-font-sans"
                                    >
                                        Impressions
                                    </label>
                                </div>
                            </div>
                        }
                        // metaQuery={shopifyData.metaQuery}
                    />
                </div>
            </div>
        </div>
    );
}

function getDayWiseCampaignsTrends(
    freshsalesLeadsData: Array<FreshsalesDataAggregatedRow>,
    adsData: Array<AdsDataAggregatedRow>,
    shopifyData: Array<ShopifyDataAggregatedRow>,
    minDate: Iso8601Date,
    maxDate: Iso8601Date,
) {
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
