import * as Tabs from "@radix-ui/react-tabs";
import type {LinksFunction, LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import type {MetaFunction} from "@remix-run/react";
import {useLoaderData, useMatches} from "@remix-run/react";
import "ag-grid-enterprise";
import {AgGridReact} from "ag-grid-react";
import {CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Title, Tooltip} from "chart.js";
import {DateTime} from "luxon";
import {useState} from "react";
import {Line} from "react-chartjs-2";
import type {GoogleAdsDataAggregatedRow} from "~/backend/business-insights";
import {TimeGranularity, getGoogleAdsData, getTimeGranularityFromUnknown} from "~/backend/business-insights";
import {getDestinationCredentialId} from "~/backend/utilities/connectors/common.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {PageScaffold} from "~/components/pageScaffold";
import {DateFilterSection, GenericCard} from "~/components/scratchpad";
import {VerticalSpacer} from "~/global-common-typescript/components/verticalSpacer";
import {getNonEmptyStringFromUnknown, getStringFromUnknown, getUuidFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getSingletonValue} from "~/global-common-typescript/utilities/utilities";
import {numberToHumanFriendlyString, dateToMediumNoneEnFormat, agGridDateComparator, roundOffToTwoDigits, defaultColumnDefinitions, getDates} from "~/utilities/utilities";
import type {CompanyLoaderData} from "~/routes/$companyId";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";

// Google ads

export const meta: MetaFunction = ({data, matches}) => {
    return [
        {
            title: "Google Ads Report - Intellsys",
        },
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

type CampaignMetrics = {
    campaignName: string;
    impressions: Integer;
    clicks: Integer;
};

type GoogleAdsMetrics = {
    impressions: Integer;
    clicks: Integer;
    ctr: Integer;
    averageCpc: Integer;
    cost: Integer;
    conversions: Integer;
    costPerConversions: Integer;
    averageCpm: Integer; // Cost per thousand impressions
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
    if (connectorId == undefined) {
        throw new Response("Connector undefined!");
    }

    const destinationDatabaseCredentialId = await getDestinationCredentialId(getUuidFromUnknown(companyId));

    const urlSearchParams = new URL(request.url).searchParams;

    const selectedGranularityRaw = safeParse(getNonEmptyStringFromUnknown, urlSearchParams.get("selected_granularity"));
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

    const googleAdsData = await getGoogleAdsData(
        getStringFromUnknown(minDate),
        getStringFromUnknown(maxDate),
        selectedGranularity,
        getUuidFromUnknown(destinationDatabaseCredentialId),
        getUuidFromUnknown(connectorId),
    );

    if (googleAdsData instanceof Error) {
        throw new Response("970986e8-eddb-4597-ba18-e5b34ad972c0", {
            status: 400,
        });
    }

    if (!googleAdsData) {
        throw new Response("163fc3d9-1bdf-495b-b1e6-94b9eba47af7", {
            status: 400,
        });
    }

    // TODO: Add filters
    const loaderData: LoaderData = {
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: getStringFromUnknown(minDate),
        appliedMaxDate: getStringFromUnknown(maxDate),
        googleAdsData: googleAdsData,
        companyId: getUuidFromUnknown(companyId),
        connectorId: getUuidFromUnknown(connectorId),
    };

    return json(loaderData);
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, googleAdsData, companyId, connectorId} = useLoaderData() as LoaderData;

    const routeMatches = useMatches();
    const {user, accessibleCompanies, currentCompany} = getSingletonValue(routeMatches.filter((routeMatch) => routeMatch.id == "routes/$companyId")).data as CompanyLoaderData;

    return (
        <PageScaffold
            user={user}
            accessibleCompanies={accessibleCompanies}
            currentCompany={currentCompany}
        >
            <Connector
                appliedSelectedGranularity={appliedSelectedGranularity}
                appliedMinDate={appliedMinDate}
                appliedMaxDate={appliedMaxDate}
                googleAdsData={googleAdsData}
                companyId={companyId}
                connectorId={connectorId}
            />
        </PageScaffold>
    );
}

function Connector({
    appliedSelectedGranularity,
    appliedMinDate,
    appliedMaxDate,
    googleAdsData,
    companyId,
    connectorId,
}: {
    appliedMinDate: Iso8601Date;
    appliedMaxDate: Iso8601Date;
    appliedSelectedGranularity: TimeGranularity;
    googleAdsData: {
        metaQuery: string;
        rows: Array<GoogleAdsDataAggregatedRow>;
    };
    companyId: Uuid;
    connectorId: Uuid;
}) {
    const [selectedGranularity, setSelectedGranularity] = useState<TimeGranularity>(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState<Iso8601Date>(appliedMinDate);
    const [selectedMaxDate, setSelectedMaxDate] = useState<Iso8601Date>(appliedMaxDate);
    // const [hoverOnImpressionsCard, setHoverOnImpressionsCard] = useState(false);

    const granularities = [TimeGranularity.daily, TimeGranularity.monthly, TimeGranularity.yearly, TimeGranularity.hourly];

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
                    page={`/${companyId}/0be2e81c-f5a7-41c6-bc34-6668088f7c4e/${connectorId}`}
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
            </div>
        </>
    );
}

function CampaignsSection({adsData, granularity, minDate, maxDate}: {adsData: Array<GoogleAdsDataAggregatedRow>; granularity: TimeGranularity; minDate: Iso8601Date; maxDate: Iso8601Date}) {
    const dates = getDates(minDate, maxDate);
    const aggregatedMetrics = getAggregatedMetrics(adsData);

    const dayWiseImpressions = aggregateByDate(adsData, "impressions", dates);
    const dayWiseClicks = aggregateByDate(adsData, "clicks", dates);
    const dayWiseConversions = aggregateByDate(adsData, "conversions", dates);

    const impressionsDataPoints = getDataPoints(dates, dayWiseImpressions);
    const clicksDataPoints = getDataPoints(dates, dayWiseClicks);
    const conversionsDataPoints = getDataPoints(dates, dayWiseConversions);

    const maxValueImpression = getMaxFromArray(dayWiseImpressions);
    const maxValueClicks = getMaxFromArray(dayWiseClicks);
    const maxValueConversions = getMaxFromArray(dayWiseConversions);

    const lineCharHeight = 600;

    return (
        <>
            <div className="tw-grid tw-grid-cols-4 tw-gap-4 ">
                <div className="tw-col-start-1">
                    <ValueDisplayingCardWithTarget
                        label={"Impressions"}
                        value={aggregatedMetrics.impressions}
                        target={0}
                        type={ValueDisplayingCardInformationType.integer}
                    />
                </div>
                <div className="tw-col-start-2">
                    <ValueDisplayingCardWithTarget
                        label={"Average CPC"}
                        value={aggregatedMetrics.averageCpc}
                        target={0}
                        type={ValueDisplayingCardInformationType.float}
                    />
                </div>
                <div className="tw-col-start-3">
                    <ValueDisplayingCardWithTarget
                        label={"Clicks"}
                        value={aggregatedMetrics.clicks}
                        target={0}
                        type={ValueDisplayingCardInformationType.integer}
                    />
                </div>
                <div className="tw-col-start-4">
                    <ValueDisplayingCardWithTarget
                        label={"Conversions"}
                        value={aggregatedMetrics.conversions}
                        target={0}
                        type={ValueDisplayingCardInformationType.integer}
                    />
                </div>
                <div className="tw-col-start-1">
                    <ValueDisplayingCardWithTarget
                        label={"Cost"}
                        value={aggregatedMetrics.cost}
                        target={0}
                        type={ValueDisplayingCardInformationType.integer}
                    />
                </div>
                <div className="tw-col-start-2">
                    <ValueDisplayingCardWithTarget
                        label={"CTR"}
                        value={aggregatedMetrics.ctr}
                        target={0}
                        type={ValueDisplayingCardInformationType.percentage}
                    />
                </div>
                <div className="tw-col-start-3">
                    <ValueDisplayingCardWithTarget
                        label={"Average CPM"}
                        value={aggregatedMetrics.averageCpm}
                        target={0}
                        type={ValueDisplayingCardInformationType.float}
                    />
                </div>
                <div className="tw-col-start-4">
                    <ValueDisplayingCardWithTarget
                        label={"Cost / Conversions"}
                        value={aggregatedMetrics.costPerConversions} // TODO: Add rupees symbol
                        target={0}
                        type={ValueDisplayingCardInformationType.float}
                    />
                </div>
            </div>

            <VerticalSpacer className="tw-h-3" />

            <div className="tw-grid tw-grid-cols-2 tw-gap-4 ">
                <div className="tw-col-start-1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <ComposedChart
                                height={lineCharHeight}
                                xValues={dates}
                                className={""}
                                title={"Day-wise Distribution of Impressions"}
                                children={
                                    <LineGraphComponent
                                        key="LineGraph"
                                        scale={Scale.dataDriven}
                                        data={{
                                            xValues: dates,
                                            yMax: maxValueImpression,
                                            series: {
                                                values: impressionsDataPoints,
                                                name: "Impressions",
                                                color: "Green",
                                            },
                                        }}
                                        className={""}
                                    />
                                }
                            />
                        }
                    />
                </div>
                <div className="tw-col-start-2">
                    <GenericCard
                        className="tw-col-start-2 tw-rounded-tl-none"
                        content={
                            <ComposedChart
                                height={lineCharHeight}
                                xValues={dates}
                                className={""}
                                title={"Day-wise Distribution of Clicks"}
                                children={
                                    <LineGraphComponent
                                        key="LineGraph"
                                        scale={Scale.dataDriven}
                                        data={{
                                            xValues: dates,
                                            yMax: maxValueClicks,
                                            series: {
                                                values: clicksDataPoints,
                                                name: "Clicks",
                                                color: "White",
                                            },
                                        }}
                                        className={""}
                                    />
                                }
                            />
                        }
                    />
                </div>
                <div className="tw-col-start-1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <ComposedChart
                                height={lineCharHeight}
                                xValues={dates}
                                className={""}
                                title={"Day-wise Distribution of Conversions"}
                                children={
                                    <LineGraphComponent
                                        key="LineGraph"
                                        scale={Scale.dataDriven}
                                        data={{
                                            xValues: dates,
                                            yMax: maxValueConversions,
                                            series: {
                                                values: conversionsDataPoints,
                                                name: "Conversions",
                                                color: "Blue",
                                            },
                                        }}
                                        className={""}
                                    />
                                }
                            />
                        }
                    />
                </div>
                <div className="tw-col-start-2">
                    <AccountOverview
                        adsData={adsData}
                        minDate={minDate}
                        maxDate={maxDate}
                    />
                </div>
            </div>

            <VerticalSpacer className="tw-h-3" />

            <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                {/* Campaign overview: Impressions and CTR */}
                <div className="tw-col-start-1">
                    <div className="tw-col-start-2">
                        <Tabs.Root
                            defaultValue="1"
                            className="tw-row-start-3"
                        >
                            <Tabs.List>
                                <Tabs.Trigger
                                    value="1"
                                    className="lp-tab tw-rounded-tl-md"
                                >
                                    Campaign's Overview
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                    value="2"
                                    className="lp-tab tw-rounded-tr-md"
                                >
                                    Raw Data
                                </Tabs.Trigger>
                            </Tabs.List>
                            <Tabs.Content value="1">
                                <CampaignsOverview adsData={adsData} />
                            </Tabs.Content>
                            <Tabs.Content value="2">
                                <RawData adsData={adsData} />
                            </Tabs.Content>
                        </Tabs.Root>
                    </div>
                </div>
            </div>
        </>
    );
}

function CampaignsOverview({adsData}: {adsData: Array<GoogleAdsDataAggregatedRow>}) {
    const impressionsAndCtrGroupByCampaigns = getImpressionsAndCtrGroupByCampaign(adsData);

    return (
        <GenericCard
            className="tw-rounded-tl-none"
            label="Campaigns overview"
            content={
                <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                    <AgGridReact
                        rowData={impressionsAndCtrGroupByCampaigns.map((object) => ({
                            campaignName: object.campaignName,
                            impressions: object.impressions,
                            clicks: object.clicks,
                            ctr: object.impressions == 0 ? 0 : `${roundOffToTwoDigits((object.clicks / object.impressions) * 100)}%`,
                        }))}
                        columnDefs={[
                            {headerName: "Campaign Name", field: "campaignName", cellClass: "!tw-px-0", resizable: true},
                            {headerName: "Impressions", field: "impressions", cellClass: "!tw-px-0", resizable: true},
                            {headerName: "Clicks", field: "clicks", cellClass: "!tw-px-2", resizable: true},
                            {headerName: "CTR", field: "ctr", cellClass: "!tw-px-2", resizable: true},
                        ]}
                        defaultColDef={defaultColumnDefinitions}
                        animateRows={true}
                        enableRangeSelection={true}
                    />
                </div>
            }
        />
    );
}

function AccountOverview({adsData, minDate, maxDate}: {adsData: Array<GoogleAdsDataAggregatedRow>; minDate: Iso8601Date; maxDate: Iso8601Date}) {
    const aggregatedMetrics = getAggregatedMetrics(adsData);

    return (
        <GenericCard
            className="tw-rounded-tl-none"
            label="Account overview"
            content={
                <div className="tw-col-span-12 tw-h-[320px] ag-theme-alpine-dark">
                    <AgGridReact
                        rowData={Object.entries(aggregatedMetrics).map((object) => ({
                            metric: object[0],
                            value: numberToHumanFriendlyString(roundOffToTwoDigits(object[1])), // TODO: Add isPercentage for ctr metric
                        }))}
                        columnDefs={[
                            {headerName: "Metric", field: "metric", cellClass: "tw-px-2", resizable: true},
                            {headerName: `${minDate} - ${maxDate}`, field: "value", cellClass: "tw-px-2", resizable: true},
                        ]}
                        defaultColDef={defaultColumnDefinitions}
                        animateRows={true}
                        domLayout="autoHeight"
                        enableRangeSelection={true}
                    />
                </div>
            }
        />
    );
}

function RawData({adsData}: {adsData: Array<GoogleAdsDataAggregatedRow>}) {
    return (
        <GenericCard
            className="tw-rounded-tl-none"
            label="Raw Google Ads data"
            content={
                <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                    <AgGridReact
                        rowData={adsData.map((object) => ({
                            date: object.date,
                            hour: object.hour,
                            campaignId: object.campaignId,
                            campaignName: object.campaignName,
                            averageCost: numberToHumanFriendlyString(object.averageCost),
                            impressions: numberToHumanFriendlyString(object.impressions),
                            clicks: numberToHumanFriendlyString(object.clicks),
                            averageCpc: numberToHumanFriendlyString(object.averageCpc / microValue),
                            averageCpe: numberToHumanFriendlyString(roundOffToTwoDigits(object.averageCpe / microValue)),
                            averageCpm: numberToHumanFriendlyString(roundOffToTwoDigits(object.averageCpm / microValue)),
                            averageCpv: numberToHumanFriendlyString(roundOffToTwoDigits(object.averageCpv / microValue)),
                            interactionEventTypes: numberToHumanFriendlyString(object.interactionEventTypes),
                            valuePerAllConversions: numberToHumanFriendlyString(object.valuePerAllConversions),
                            videoViewRate: roundOffToTwoDigits(object.videoViewRate),
                            videoViews: roundOffToTwoDigits(object.videoViews),
                            viewThroughConversions: numberToHumanFriendlyString(object.viewThroughConversions),
                            conversionsFromInteractionsRate: numberToHumanFriendlyString(object.conversionsFromInteractionsRate),
                            conversionsValue: numberToHumanFriendlyString(object.conversionsValue),
                            conversions: numberToHumanFriendlyString(object.conversions),
                            costMicros: numberToHumanFriendlyString(object.costMicros / microValue),
                            costPerAllConversions: numberToHumanFriendlyString(object.costPerAllConversions),
                            ctr: roundOffToTwoDigits(object.ctr),
                            engagementRate: numberToHumanFriendlyString(object.engagementRate),
                            engagements: numberToHumanFriendlyString(object.engagements),
                            activeViewImpressions: numberToHumanFriendlyString(object.activeViewImpressions),
                            activeViewMeasurability: numberToHumanFriendlyString(object.activeViewMeasurability),
                            activeViewMeasurableCostMicros: numberToHumanFriendlyString(object.activeViewMeasurableCostMicros),
                            activeViewMeasurableImpressions: numberToHumanFriendlyString(object.activeViewMeasurableImpressions),
                            allConversionsFromInteractionsRate: roundOffToTwoDigits(object.allConversionsFromInteractionsRate),
                            allConversionsValue: numberToHumanFriendlyString(object.allConversionsValue),
                            allConversions: numberToHumanFriendlyString(object.allConversions),
                            interactionRate: roundOffToTwoDigits(object.interactionRate),
                            interactions: numberToHumanFriendlyString(object.interactions),
                            allConversionsByConversionDate: numberToHumanFriendlyString(object.allConversionsByConversionDate),
                            valuePerAllConversionsByConversionDate: numberToHumanFriendlyString(object.valuePerAllConversionsByConversionDate),
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
                            {headerName: "averageCpc", field: "averageCpc", cellClass: "!tw-px-0", resizable: true},
                            {headerName: "averageCpe", field: "averageCpe", cellClass: "!tw-px-0", resizable: true},
                            {headerName: "averageCpm", field: "averageCpm", cellClass: "!tw-px-0", resizable: true},
                            {headerName: "averageCpv", field: "averageCpv", cellClass: "!tw-px-0", resizable: true},
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
    );
}

function getImpressionsAndCtrGroupByCampaign(googleAdsData: Array<GoogleAdsDataAggregatedRow>): Array<CampaignMetrics> {
    const result = googleAdsData.reduce((accumulatedResult: {[key: string]: CampaignMetrics}, currentObject) => {
        var campaignName = currentObject.campaignName;
        const impressions = currentObject.impressions;
        const clicks = currentObject.clicks;

        if (!accumulatedResult[campaignName]) {
            const googleAdsMetrics: CampaignMetrics = {
                campaignName: campaignName,
                impressions: 0,
                clicks: 0,
            };
            accumulatedResult[campaignName] = googleAdsMetrics;
        }

        accumulatedResult[campaignName].impressions += impressions;
        accumulatedResult[campaignName].clicks += clicks;

        return accumulatedResult;
    }, {});

    return Object.values(result);
}

function getAggregatedMetrics(googleAdsData: Array<GoogleAdsDataAggregatedRow>): GoogleAdsMetrics {
    const initialObject: GoogleAdsMetrics = {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        averageCpc: 0,
        cost: 0,
        conversions: 0,
        costPerConversions: 0,
        averageCpm: 0,
    };

    const aggregatedMetrics = googleAdsData.reduce((accumulatedResult, currentObject) => {
        accumulatedResult.impressions += currentObject.impressions;
        accumulatedResult.clicks += currentObject.clicks;
        accumulatedResult.cost += currentObject.costMicros;
        accumulatedResult.conversions += currentObject.conversions;

        return accumulatedResult;
    }, initialObject);

    aggregatedMetrics.cost = aggregatedMetrics.cost / microValue;

    // CPM = Cost per thousand metrics
    aggregatedMetrics.averageCpm = aggregatedMetrics.impressions / 1000 == 0 ? 0 : aggregatedMetrics.cost / (aggregatedMetrics.impressions / 1000);

    // CTR = total clicks / total impressions
    aggregatedMetrics.ctr = aggregatedMetrics.impressions == 0 ? 0.0 : aggregatedMetrics.clicks / aggregatedMetrics.impressions;

    // Cost-per-conversions = Total cost / Total conversions
    aggregatedMetrics.costPerConversions = aggregatedMetrics.conversions == 0 ? 0 : aggregatedMetrics.cost / aggregatedMetrics.conversions;

    // Average cost-per-click
    aggregatedMetrics.averageCpc = aggregatedMetrics.clicks == 0 ? 0 : aggregatedMetrics.cost / aggregatedMetrics.clicks;

    return aggregatedMetrics;
}
