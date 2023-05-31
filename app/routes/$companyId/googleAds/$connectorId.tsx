import * as Tabs from "@radix-ui/react-tabs";
import type {LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {AgGridReact} from "ag-grid-react";
import styles from "app/styles.css";
import {DateTime} from "luxon";
import {useCallback, useEffect, useRef, useState} from "react";
import type {AdsDataAggregatedRow, GoogleAdsDataAggregatedRow} from "~/backend/business-insights";
import {getGoogleAdsLectrixData, getTimeGranularityFromUnknown, TimeGranularity} from "~/backend/business-insights";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {ComposedChart} from "~/components/d3Componenets/composedChartComponent";
import {LineGraphComponent} from "~/components/d3Componenets/lineGraphComponent";
import {HorizontalSpacer} from "~/components/reusableComponents/horizontalSpacer";
import {CustomCard, DateFilterSection, FancySearchableSelect, GenericCard, SmallValueDisplayingCardWithTarget} from "~/components/scratchpad";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
import {ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
import {
    aggregateByDate,
    agGridDateComparator,
    columnWiseSummationOfMatrix,
    createGroupByReducer,
    dateToMediumNoneEnFormat,
    defaultColumnDefinitions,
    getDates,
    getNonEmptyStringOrNull,
    numberToHumanFriendlyString,
    roundOffToTwoDigits,
    Scale,
    sumReducer,
} from "~/utilities/utilities";
import "ag-grid-enterprise";
import {getStringFromUnknown, getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getDestinationCredentialId, getSourceAndDestinationId} from "~/backend/utilities/data-management/common.server";

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
    googleAdsData: {
        metaQuery: string;
        rows: Array<GoogleAdsDataAggregatedRow>;
    };
    companyId: Uuid;
    connectorId: Uuid;
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

    const connectorId = params.connectorId;
    if(connectorId == undefined){
        throw new Response("Connector undefined!");
    }

    const destinationDatabaseCredentialId = await getDestinationCredentialId(getUuidFromUnknown(companyId));

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

    const googleAdsData = await getGoogleAdsLectrixData(
        getStringFromUnknown(minDate),
        getStringFromUnknown(maxDate),
        selectedGranularity,
        getUuidFromUnknown(destinationDatabaseCredentialId),
        getUuidFromUnknown(connectorId),
    );
    if (googleAdsData instanceof Error) {
        return googleAdsData;
    }

    // TODO: Add filters
    const loaderData: LoaderData = {
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: minDate as string,
        appliedMaxDate: maxDate as string,
        googleAdsData: googleAdsData,
        companyId: getUuidFromUnknown(companyId),
        connectorId: getUuidFromUnknown(connectorId),
    };

    return json(loaderData);
};

type DayWiseDistributionPerCampaignObject = {
    impressions: Array<number>;
    clicks: Array<number>;
    averageCost: Array<number>;
    // amountSpent: Array<number>;
    // leads: Array<number>;
    // orders: Array<number>;
};

type CampaignTargetObject = {
    impressions: number;
    clicks: number;
    averageCost: number;
    // leads: number;
    // orders: number;
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, googleAdsData, companyId, connectorId} = useLoaderData() as LoaderData;

    // TODO: Add additional filtering to ensure this only shows facebook campaigns
    // TODO: Add additional filtering to remove on form fb leads

    // const [selectedCategories, setSelectedCategories] = useState<Array<string>>([]);
    // const [selectedProducts, setSelectedProducts] = useState<Array<string>>([]);
    // const [selectedPlatforms, setSelectedPlatforms] = useState<Array<string>>([]);
    const [selectedGranularity, setSelectedGranularity] = useState<TimeGranularity>(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState<Iso8601Date>(appliedMinDate);
    const [selectedMaxDate, setSelectedMaxDate] = useState<Iso8601Date>(appliedMaxDate);
    // const [hoverOnImpressionsCard, setHoverOnImpressionsCard] = useState(false);

    const granularities = [TimeGranularity.daily, TimeGranularity.monthly, TimeGranularity.yearly, TimeGranularity.hourly];

    // const filterAdsData = googleAdsData.rows
    //     .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
    //     .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.platform));

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
                    page={`/${companyId}/googleAds/${connectorId}`}
                />
                {/* <FancySearchableSelect
                    label="Granularity"
                    options={granularities}
                    selectedOption={selectedGranularity}
                    setSelectedOption={setSelectedGranularity}
                /> */}
            </div>

            <div className="tw-gap-x-5 tw-px-4 tw-py-4">
                <CampaignsSection
                    adsData={googleAdsData.rows}
                    granularity={selectedGranularity}
                    minDate={appliedMinDate}
                    maxDate={appliedMaxDate}
                />

                {/* <div className="tw-grid-col-start-1">
                    <CampaignsSection
                        // adsData={filterAdsData}
                        minDate={appliedMinDate}
                        maxDate={appliedMaxDate}
                        hoverOnImpressionCard={hoverOnImpressionsCard}
                        setHoverOnImpressionCard={setHoverOnImpressionsCard}
                    />
                </div> */}
            </div>

            {/* <div className="tw-grid tw-grid-cols-2 tw-gap-x-5 tw-px-4 tw-py-4">
                <div className="tw-grid-col-start-1">
                    <CampaignsSection
                        adsData={googleAdsData.rows}
                        // adsData={filterAdsData}
                        minDate={appliedMinDate}
                        maxDate={appliedMaxDate}
                    />
                </div>

                {/* <div className="tw-grid-col-start-1">
                    <CampaignsSection
                        // adsData={filterAdsData}
                        minDate={appliedMinDate}
                        maxDate={appliedMaxDate}
                        hoverOnImpressionCard={hoverOnImpressionsCard}
                        setHoverOnImpressionCard={setHoverOnImpressionsCard}
                    />
                </div> */}
            {/* </div> */}
        </>
    );
}

function CampaignsSection({adsData, granularity, minDate, maxDate}: {adsData: Array<GoogleAdsDataAggregatedRow>; granularity: TimeGranularity; minDate: Iso8601Date; maxDate: Iso8601Date}) {
    // const gridRef = useRef(null);

    // const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    // const [showAmountSpent, setShowAmountSpent] = useState(true);
    // const [showClicks, setShowClicks] = useState(false);
    // const [showImpressions, setShowImpressions] = useState(false);

    const dates = getDates(minDate, maxDate);

    if (granularity == TimeGranularity.daily) {
        const dailyDistributionOfData = aggregateHourlyData(adsData);
        adsData = Object.values(dailyDistributionOfData);
    }

    // const onSelectionChanged = useCallback(() => {
    //     var selectedRows = gridRef.current.api.getSelectedRows();
    //     const campaigns = selectedRows.map((row: {campaignName: any}) => row.campaignName);
    //     setSelectedCampaigns(campaigns);
    // }, []);

    // const onDataFirstRendered = useCallback((params) => {
    //     gridRef.current.api.forEachNode((node) => node.setSelected(true));
    // }, []);

    // const dayWiseCampaignsTrends = getDayWiseCampaignsTrends(adsData, minDate, maxDate);
    // const campaigns = Object.keys(dayWiseCampaignsTrends);

    // console.log(dayWiseCampaignsTrends);

    // const campaigns = Object.keys(dayWiseCampaignsTrends);

    // const performanceleadscount = {
    //     count: selectedCampaigns.map((campaign) => (campaign in dayWiseCampaignsTrends == true ? dayWiseCampaignsTrends[campaign!].leads.reduce(sumReducer, 0) : 0)).reduce(sumReducer, 0),
    //     metaInformation: "Number of leads created",
    // };

    // // TODO: net quantity or count?
    // const sales = {
    //     count: selectedCampaigns.map((campaign) => (campaign in dayWiseCampaignsTrends == true ? dayWiseCampaignsTrends[campaign!].orders.reduce(sumReducer, 0) : 0)).reduce(sumReducer, 0),
    //     metaInformation: "Number of units sold",
    // };

    // const campaignsInformation = {
    //     impressions: selectedCampaigns.map((campaign) => (campaign in dayWiseCampaignsTrends == true ? dayWiseCampaignsTrends[campaign].impressions.reduce(sumReducer, 0) : 0)).reduce(sumReducer, 0),
    //     amountSpent: selectedCampaigns.map((campaign) => (campaign in dayWiseCampaignsTrends == true ? dayWiseCampaignsTrends[campaign].amountSpent.reduce(sumReducer, 0) : 0)).reduce(sumReducer, 0),
    //     clicks: selectedCampaigns.map((campaign) => (campaign in dayWiseCampaignsTrends == true ? dayWiseCampaignsTrends[campaign].clicks.reduce(sumReducer, 0) : 0)).reduce(sumReducer, 0),
    // };

    // Graphs
    // const labels = getDates(minDate, maxDate);

    // // Targets
    // const targetForCampaigns = getTargets(campaigns);

    // Leads and orders group by date and campaign
    // const leadsAndOrdersGroupByCampaignNameAndDate = getMetricsGroupByDateAndCampaignName(adsData, campaigns, minDate, maxDate);

    // // Data for lineChartComponent

    // const amountSpent =
    //     selectedCampaigns.length > 0
    //         ? columnWiseSummationOfMatrix(
    //               selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
    //                   campaign in dayWiseCampaignsTrends == true ? result.push(dayWiseCampaignsTrends[campaign].amountSpent) : result.push(new Array(dates.length).fill(0));
    //                   return result;
    //               }, []),
    //           )
    //         : [];

    // const clicks =
    //     selectedCampaigns.length > 0
    //         ? columnWiseSummationOfMatrix(
    //               selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
    //                   campaign in dayWiseCampaignsTrends == true ? result.push(dayWiseCampaignsTrends[campaign].clicks) : result.push(new Array(dates.length).fill(0));
    //                   return result;
    //               }, []),
    //           )
    //         : [];

    // const impressions =
    //     selectedCampaigns.length > 0
    //         ? columnWiseSummationOfMatrix(
    //               selectedCampaigns.reduce((result: Array<Array<number>>, campaign) => {
    //                   campaign in dayWiseCampaignsTrends == true ? result.push(dayWiseCampaignsTrends[campaign].impressions) : result.push(new Array(dates.length).fill(0));
    //                   return result;
    //               }, []),
    //           )
    //         : [];

    // const impressionsLineData = {
    //     series: {
    //         name: "Impressions",
    //         color: "#FF9F47",
    //         values: impressions.map((d, index) => ({date: labels[index], value: d})),
    //     },
    //     dates: labels,
    //     yMax: impressions.length > 0 ? Math.max(...impressions) : 100,
    // };

    // const clicksLineData = {
    //     series: {
    //         name: "Clicks",
    //         color: "#a5b4fc",
    //         values: clicks.map((d, index) => ({date: labels[index], value: d})),
    //     },
    //     dates: labels,
    //     yMax: clicks.length > 0 ? Math.max(...clicks) : 100,
    // };

    // const salesLineData = {
    //     series: {
    //         name: "Net amount spent",
    //         color: "#fbbf24",
    //         values: amountSpent.map((d, index) => ({date: labels[index], value: d})),
    //     },
    //     dates: labels,
    //     yMax: amountSpent.length > 0 ? Math.max(...amountSpent) : 100,
    // };

    const canvasDimensions = {
        height: 533,
        width: 680,
    };

    return (
        <div className="tw-grid tw-grid-cols-1 tw-p-2">
            {/* <div className="tw-row-start-1">
                <div className="tw-h-[410px] ag-theme-alpine-dark ag-root-wrapper">
                    <AgGridReact
                        ref={gridRef}
                        rowData={campaigns.map((campaign: string) => ({
                            campaignName: campaign,
                            impressions: numberToHumanFriendlyString(dayWiseCampaignsTrends[campaign].impressions.reduce(sumReducer, 0)),
                            amountSpent: numberToHumanFriendlyString(roundOffToTwoDigits(dayWiseCampaignsTrends[campaign].amountSpent.reduce(sumReducer, 0))),
                            clicks: numberToHumanFriendlyString(dayWiseCampaignsTrends[campaign].clicks.reduce(sumReducer, 0)),
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
                                resizable: true,
                            },
                            {
                                headerName: "Impressions",
                                field: "impressions",
                                sort: "desc",
                                sortIndex: 1,
                                // cellRenderer: progressCellRendererTarget,
                                // cellRendererParams: {target: targetForCampaigns, color: campaignsColorPalette.impressions},
                                cellClass: "!tw-px-0.5",
                                headerClass: "tw-text-sm tw-font-medium",
                                resizable: true,
                            },
                            {
                                headerName: "Amount Spent",
                                field: "amountSpent",
                                // cellRenderer: progressCellRendererTarget,
                                // cellRendererParams: {target: targetForCampaigns, color: campaignsColorPalette.amountSpent},
                                cellClass: "!tw-px-0.5",
                                headerClass: "tw-text-sm tw-font-medium",
                                resizable: true,
                            },
                            {
                                headerName: "Clicks",
                                field: "clicks",
                                // cellRenderer: progressCellRendererTarget,
                                // cellRendererParams: {target: targetForCampaigns, color: campaignsColorPalette.clicks},
                                cellClass: "!tw-px-0.5",
                                headerClass: "tw-text-sm tw-font-medium",
                                resizable: true,
                            },
                        ]}
                        defaultColDef={defaultColumnDefinitions}
                        animateRows={true}
                        rowSelection={"multiple"}
                        onSelectionChanged={onSelectionChanged}
                        onFirstDataRendered={onDataFirstRendered}
                        enableRangeSelection={true}
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
                </div>
            </div> */}

            <Tabs.Root
                defaultValue="1"
                className="tw-row-start-4"
            >
                <Tabs.List>
                    <Tabs.Trigger
                        value="1"
                        className="lp-tab tw-rounded-tl-md"
                    >
                        {granularity} Distribution
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="2"
                        className="lp-tab tw-rounded-tr-md"
                    >
                        Raw Data
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="2">
                    <div className="tw-grid tw-overflow-auto">
                        {/* <GenericCard
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
                                            {showAmountSpent && (
                                                <LineGraphComponent
                                                    data={salesLineData}
                                                    scale={Scale.dataDriven}
                                                />
                                            )}

                                            {showClicks && (
                                                <LineGraphComponent
                                                    data={clicksLineData}
                                                    scale={Scale.dataDriven}
                                                />
                                            )}

                                            {showImpressions && (
                                                <LineGraphComponent
                                                    data={impressionsLineData}
                                                    scale={Scale.dataDriven}
                                                />
                                            )}
                                        </ComposedChart>
                                    </div>

                                    <div className="tw-row-start-2 tw-flex tw-flex-row tw-justify-center">
                                        <input
                                            type="checkbox"
                                            className="tw-h-5 tw-w-5"
                                            id="amountspent"
                                            checked={showAmountSpent}
                                            onChange={(e) => {
                                                showClicks == false && showImpressions == false ? setShowAmountSpent(true) : setShowAmountSpent(e.target.checked);
                                            }}
                                        />
                                        <label
                                            // TODO: Disabled because having multiple panes is causing issue with this
                                            // htmlFor="amountspent"
                                            className="tw-pl-3 tw-font-sans"
                                        >
                                            Amount Spent
                                        </label>

                                        <HorizontalSpacer className="tw-w-8" />

                                        <input
                                            type="checkbox"
                                            className="tw-h-5 tw-w-5"
                                            id="clicks"
                                            checked={showClicks}
                                            onChange={(e) => {
                                                showAmountSpent == false && showImpressions == false ? setShowClicks(true) : setShowClicks(e.target.checked);
                                            }}
                                        />
                                        <label
                                            // TODO: Disabled because having multiple panes is causing issue with this
                                            // htmlFor="clicks"
                                            className="tw-pl-3 tw-font-sans"
                                        >
                                            Clicks
                                        </label>

                                        <HorizontalSpacer className="tw-w-8" />

                                        <input
                                            type="checkbox"
                                            className="tw-h-5 tw-w-5"
                                            id="impressions"
                                            checked={showImpressions}
                                            onChange={(e) => {
                                                showAmountSpent == false && showClicks == false ? setShowImpressions(true) : setShowImpressions(e.target.checked);
                                            }}
                                        />
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
                        /> */}
                        Sample
                    </div>
                </Tabs.Content>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={adsData.map((object) => ({
                                        date: object.date,
                                        hour: object.hour,
                                        campaignId: object.campaignId,
                                        campaignName: object.campaignName,
                                        averageCost: object.averageCost,
                                        impressions: object.impressions,
                                        clicks: object.clicks,
                                        // leads: leadsAndOrdersGroupByCampaignNameAndDate[object.campaignName].leads[object.date],
                                        // orders: leadsAndOrdersGroupByCampaignNameAndDate[object.campaignName].orders[object.date],
                                        interactionEventTypes: object.interactionEventTypes,
                                        valuePerAllConversions: object.valuePerAllConversions,
                                        videoViewRate: object.videoViewRate,
                                        videoViews: object.videoViews,
                                        viewThroughConversions: object.viewThroughConversions,
                                        conversionsFromInteractionsRate: object.conversionsFromInteractionsRate,
                                        conversionsValue: object.conversionsValue,
                                        conversions: object.conversions,
                                        costMicros: object.costMicros,
                                        costPerAllConversions: object.costPerAllConversions,
                                        ctr: object.ctr,
                                        engagementRate: object.engagementRate,
                                        engagements: object.engagements,
                                        activeViewImpressions: object.activeViewImpressions,
                                        activeViewMeasurability: object.activeViewMeasurability,
                                        activeViewMeasurableCostMicros: object.activeViewMeasurableCostMicros,
                                        activeViewMeasurableImpressions: object.activeViewMeasurableImpressions,
                                        allConversionsFromInteractionsRate: object.allConversionsFromInteractionsRate,
                                        allConversionsValue: object.allConversionsValue,
                                        allConversions: object.allConversions,
                                        averageCpc: object.averageCpc,
                                        averageCpe: object.averageCpe,
                                        averageCpm: object.averageCpm,
                                        averageCpv: object.averageCpv,
                                        interactionRate: object.interactionRate,
                                        interactions: object.interactions,
                                        allConversionsByConversionDate: object.allConversionsByConversionDate,
                                        valuePerAllConversionsByConversionDate: object.valuePerAllConversionsByConversionDate,
                                    }))}
                                    columnDefs={[
                                        {
                                            headerName: "Date",
                                            valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date),
                                            filter: "agDateColumnFilter",
                                            comparator: agGridDateComparator,
                                            resizable: true,
                                        },
                                        {headerName: "hour", field: "hour", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "CampaignId", field: "campaignId", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "campaignName", field: "campaignName", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averageCost", field: "averageCost", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "impressions", field: "impressions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "clicks", field: "clicks", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "amountSpent", field: "amountSpent", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "interactionEventTypes", field: "interactionEventTypes", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "valuePerAllConversions", field: "valuePerAllConversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "videoViewRate", field: "videoViewRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "videoViews", field: "videoViews", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "viewThroughConversions", field: "viewThroughConversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversionsFromInteractionsRate", field: "conversionsFromInteractionsRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversionsValue", field: "conversionsValue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversions", field: "conversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "costMicros", field: "costMicros", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "costPerAllConversions", field: "costPerAllConversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "ctr", field: "ctr", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "engagementRate", field: "engagementRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "engagements", field: "engagements", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "activeViewImpressions", field: "activeViewImpressions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "activeViewMeasurability", field: "activeViewMeasurability", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "activeViewMeasurableCostMicros", field: "activeViewMeasurableCostMicros", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "activeViewMeasurableImpressions", field: "activeViewMeasurableImpressions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "allConversionsFromInteractionsRate", field: "allConversionsFromInteractionsRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "allConversionsValue", field: "allConversionsValue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "allConversions", field: "allConversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averageCpc", field: "averageCpc", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averageCpe", field: "averageCpe", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averageCpm", field: "averageCpm", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averageCpv", field: "averageCpv", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "interactionRate", field: "interactionRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "interactions", field: "interactions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "allConversionsByConversionDate", field: "allConversionsByConversionDate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "valuePerAllConversionsByConversionDate", field: "valuePerAllConversionsByConversionDate", cellClass: "!tw-px-0", resizable: true},
                                    ]}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                    // frameworkComponents={{
                                    //     progressCellRenderer,
                                    // }}
                                />
                            </div>
                        }
                    />
                </Tabs.Content>
            </Tabs.Root>
        </div>
    );
}

// function getDayWiseCampaignsTrends(adsData: Array<AdsDataAggregatedRow>, minDate: Iso8601Date, maxDate: Iso8601Date) {
//     const dates = getDates(minDate, maxDate);

//     const adsDataGroupByCampaign = adsData.reduce(createGroupByReducer("campaignName"), {});

//     // Datatable
//     const dayWiseDistributionPerCampaign: {[key: string]: DayWiseDistributionPerCampaignObject} = {};
//     for (const campaign in adsDataGroupByCampaign) {
//         let dayWiseLeads: Array<number> = new Array(dates.length).fill(0);
//         let dayWiseOrders: Array<number> = new Array(dates.length).fill(0);
//         let dayWiseImpressions: Array<number> = new Array(dates.length).fill(0);
//         let dayWiseClicks: Array<number> = new Array(dates.length).fill(0);
//         let dayWiseAmountSpent: Array<number> = new Array(dates.length).fill(0);

//         dayWiseImpressions = aggregateByDate(adsDataGroupByCampaign[campaign], "impressions", dates);
//         dayWiseClicks = aggregateByDate(adsDataGroupByCampaign[campaign], "clicks", dates);
//         dayWiseAmountSpent = aggregateByDate(adsDataGroupByCampaign[campaign], "amountSpent", dates);
//         dayWiseDistributionPerCampaign[campaign] = {
//             impressions: dayWiseImpressions,
//             clicks: dayWiseClicks,
//             amountSpent: dayWiseAmountSpent,
//             leads: dayWiseLeads,
//             orders: dayWiseOrders,
//         };
//     }

//     return dayWiseDistributionPerCampaign;
// }

function getMetricsGroupByDateAndCampaignName(adsData: Array<AdsDataAggregatedRow>, campaigns: Array<string>, minDate: Iso8601Date, maxDate: Iso8601Date) {
    const dates = getDates(minDate, maxDate);

    let leadsAndOrdersGroupByCampaignNameAndDate: {[key: string]: any} = {};
    for (const campaign of campaigns) {
        let dayWiseLeads: Array<number> = new Array(dates.length).fill(0);
        let dayWiseOrders: Array<number> = new Array(dates.length).fill(0);

        //map leads to date
        let leadsToDate: {[key: string]: number} = {};
        let ordersToDate: {[key: string]: number} = {};
        dates.forEach((key, i) => (leadsToDate[key] = dayWiseLeads[i]));
        dates.forEach((key, i) => (ordersToDate[key] = dayWiseOrders[i]));

        leadsAndOrdersGroupByCampaignNameAndDate[campaign] = {
            leads: leadsToDate,
            orders: ordersToDate,
        };
    }

    return leadsAndOrdersGroupByCampaignNameAndDate;
}

function aggregateHourlyData(adsData: Array<GoogleAdsDataAggregatedRow>) {
    var result = Object.values(adsData);
    var response = result.reduce((acc: {[key: string]: GoogleAdsDataAggregatedRow}, obj) => {
        var key = `${obj.date}_${obj.campaignName}`;

        if (!acc[key]) {
            const googleAdsRow: GoogleAdsDataAggregatedRow = {
                date: "",
                hour: 0,
                campaignId: "",
                campaignName: "",
                averageCost: 0,
                impressions: 0,
                clicks: 0,
                interactionEventTypes: 0,
                valuePerAllConversions: 0,
                videoViewRate: 0,
                videoViews: 0,
                viewThroughConversions: 0,
                conversionsFromInteractionsRate: 0,
                conversionsValue: 0,
                conversions: 0,
                costMicros: 0,
                costPerAllConversions: 0,
                ctr: 0,
                engagementRate: 0,
                engagements: 0,
                activeViewImpressions: 0,
                activeViewMeasurability: 0,
                activeViewMeasurableCostMicros: 0,
                activeViewMeasurableImpressions: 0,
                allConversionsFromInteractionsRate: 0,
                allConversionsValue: 0,
                averageCpc: 0,
                allConversions: 0,
                averageCpe: 0,
                averageCpm: 0,
                averageCpv: 0,
                interactionRate: 0,
                interactions: 0,
                allConversionsByConversionDate: 0,
                valuePerAllConversionsByConversionDate: 0,
            };
            acc[key] = googleAdsRow;
        }

        acc[key].campaignId = obj.campaignId;
        acc[key].date = obj.date;
        acc[key].campaignName = obj.campaignName;
        acc[key].clicks = parseInt(acc[key].clicks) + parseInt(obj.clicks);
        acc[key].impressions += parseInt(obj.impressions);
        acc[key].averageCost += parseInt(obj.averageCost);

        return acc;
    }, {});

    return response;
}

// function getTargets(campaigns: Array<string>) {
//     campaigns.length > 0
//         ? campaigns.reduce((result: {[key: string]: CampaignTargetObject}, currentCampaign) => {
//               result[currentCampaign] = {
//                   impressions: 400000,
//                   clicks: 20000,
//                   amountSpent: 200000,
//                   leads: 2000,
//                   orders: 100,
//               };
//               return result;
//           }, {})
//         : {};
// }
