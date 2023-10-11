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
import type {AdsActionStatsObject, FacebookAdsAggregatedRow, FacebookAdsData} from "~/backend/business-insights";
import {TimeGranularity, getFacebookAdsData, getTimeGranularityFromUnknown} from "~/backend/business-insights";
import {getDestinationCredentialId} from "~/backend/utilities/connectors/common.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {ComposedChart} from "~/components/d3Componenets/composedChart";
import LineGraphComponent from "~/components/d3Componenets/lineGraphComponent";
import {PageScaffold} from "~/components/pageScaffold";
import {DateFilterSection, GenericCard, ValueDisplayingCardWithTarget} from "~/components/scratchpad";
import {HorizontalSpacer} from "~/global-common-typescript/components/horizontalSpacer";
import type {Integer} from "~/common--type-definitions/typeDefinitions";
import {getNonEmptyStringFromUnknown, getStringFromUnknown, getUuidFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getSingletonValue} from "~/global-common-typescript/utilities/utilities";
import {
    Scale,
    aggregateByDate,
    defaultColumnDefinitions,
    getDates,
    getMaxFromArray,
    getDataPoints,
    agGridDateComparator,
    dateToMediumNoneEnFormat,
    numberToHumanFriendlyString,
    roundOffToTwoDigits,
} from "~/utilities/utilities";
import type {CompanyLoaderData} from "~/routes/$companyId";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
import {ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";

// Facebook ads

export const meta: MetaFunction = ({data, matches}) => {
    return [
        {
            title: "Facebook Ads Funnel - Intellsys",
        },
    ];
};

type CampaignMetrics = {
    campaignName: string;
    spend: Integer;
    inlineLinkClicks: Integer;
    clicks: Integer;
    impressions: Integer;
};

type AdMetrics = {
    adId: string;
    adName: string;
    impressions: Integer;
    cpc: Integer;
};

type LoaderData = {
    appliedMinDate: Iso8601Date;
    appliedMaxDate: Iso8601Date;
    appliedSelectedGranularity: TimeGranularity;
    facebookAdsData: {
        metaQuery: string;
        rows: Array<FacebookAdsAggregatedRow>;
    };
    companyId: Uuid;
    connectorId: Uuid;
};

type FacebookAdsMetrics = {
    conversions: Integer;
    clicks: Integer;
    frequency: Integer;
    impressions: Integer;
    reach: Integer;
    cpc: Integer;
    cpm: Integer;
    cpp: Integer;
    ctr: Integer;
    spend: Integer;
    costPerAdClick: Integer;
    inlineLinkClicks: Integer;
    inlineLinkClickCtr: Integer;
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

    const facebookAdsData = await getFacebookAdsData(
        getStringFromUnknown(minDate),
        getStringFromUnknown(maxDate),
        selectedGranularity,
        getUuidFromUnknown(destinationDatabaseCredentialId),
        getUuidFromUnknown(connectorId),
    );

    if (facebookAdsData instanceof Error) {
        throw new Response("c6749c49-1410-48f1-857a-abb1cb03da9e", {
            status: 400,
        });
    }

    if (!facebookAdsData) {
        throw new Response("78d046eb-1490-4d52-933d-9aad667bd626", {
            status: 400,
        });
    }

    // TODO: Add filters
    const loaderData: LoaderData = {
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: safeParse(getNonEmptyStringFromUnknown, minDate), // TODO: Fix this,
        appliedMaxDate: safeParse(getNonEmptyStringFromUnknown, maxDate),
        facebookAdsData: facebookAdsData,
        companyId: getUuidFromUnknown(companyId),
        connectorId: getUuidFromUnknown(connectorId),
    };

    return json(loaderData);
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, facebookAdsData, companyId, connectorId} = useLoaderData() as LoaderData;

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
                facebookAdsData={facebookAdsData}
                companyId={companyId}
                connectorId={connectorId}
            />
        </PageScaffold>
    );
}

function Connector({
    appliedMinDate,
    appliedMaxDate,
    appliedSelectedGranularity,
    facebookAdsData,
    companyId,
    connectorId,
}: {
    appliedMinDate: Iso8601Date;
    appliedSelectedGranularity: TimeGranularity;
    appliedMaxDate: Iso8601Date;
    facebookAdsData: FacebookAdsData;
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
                    page={`/${companyId}/3350d73d-64c1-4c88-92b4-0d791d954ae9/${connectorId}`}
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
                    adsData={facebookAdsData.rows}
                    granularity={selectedGranularity}
                    minDate={appliedMinDate}
                    maxDate={appliedMaxDate}
                />
            </div>
        </>
    );
}

function CampaignsSection({adsData, granularity, minDate, maxDate}: {adsData: Array<FacebookAdsAggregatedRow>; granularity: TimeGranularity; minDate: Iso8601Date; maxDate: Iso8601Date}) {
    const dates = getDates(minDate, maxDate);
    const aggregatedMetrics = getAggregatedMetrics(adsData);

    const dayWiseImpressions = aggregateByDate(adsData, "impressions", dates);
    const dayWiseClicks = aggregateByDate(adsData, "clicks", dates);
    const dayWiseLinkClicks = aggregateByDate(adsData, "inlineLinkClicks", dates);
    const dayWiseReach = aggregateByDate(adsData, "reach", dates);

    const impressionsDataPoints = getDataPoints(dates, dayWiseImpressions);
    const clicksDataPoints = getDataPoints(dates, dayWiseClicks);
    const linkClickDataPoints = getDataPoints(dates, dayWiseLinkClicks);
    const reachDataPoints = getDataPoints(dates, dayWiseReach);

    const maxValueImpression = getMaxFromArray(dayWiseImpressions);
    const maxValueClicks = getMaxFromArray(dayWiseClicks);
    const maxValueLinkClicks = getMaxFromArray(dayWiseLinkClicks);
    const maxValueReach = getMaxFromArray(dayWiseReach);

    const lineCharHeight = 600;

    return (
        <>
            <div className="tw-grid tw-grid-cols-4 tw-p-2 tw-gap-4">
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
                        label={"Clicks"}
                        value={aggregatedMetrics.clicks}
                        target={0}
                        type={ValueDisplayingCardInformationType.integer}
                    />
                </div>
                <div className="tw-col-start-3">
                    <ValueDisplayingCardWithTarget
                        label={"Average CPC"}
                        value={aggregatedMetrics.cpc}
                        target={0}
                        type={ValueDisplayingCardInformationType.float}
                    />
                </div>
                <div className="tw-col-start-4">
                    <ValueDisplayingCardWithTarget
                        label={"Spend"}
                        value={aggregatedMetrics.spend}
                        target={0}
                        type={ValueDisplayingCardInformationType.integer}
                    />
                </div>
            </div>
            <HorizontalSpacer className="tw-h-3" />
            <div className="tw-grid tw-grid-cols-2 tw-p-2 tw-gap-4">
                <div className="tw-col-start-1">
                    <AccountOverview
                        aggregatedMetrics={aggregatedMetrics}
                        minDate={minDate}
                        maxDate={maxDate}
                    />
                </div>
                <div className="tw-col-start-2">
                    <CampaignOverview adsData={adsData} />
                </div>
            </div>
            <div className="tw-grid tw-grid-cols-3 tw-p-2 tw-gap-2">
                <div className="tw-col-start-1">
                    <GenericCard
                        className="tw-rounded-tl-none"
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
                                                color: "Red",
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
                <div className="tw-col-start-3">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <ComposedChart
                                height={lineCharHeight}
                                xValues={dates}
                                className={""}
                                title={"Day-wise Distribution of Link-Clicks"}
                                children={
                                    <LineGraphComponent
                                        key="LineGraph"
                                        scale={Scale.dataDriven}
                                        data={{
                                            xValues: dates,
                                            yMax: maxValueLinkClicks,
                                            series: {
                                                values: linkClickDataPoints,
                                                name: "Link-Clicks",
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
                                title={"Day-wise Distribution of Reach"}
                                children={
                                    <LineGraphComponent
                                        key="LineGraph"
                                        scale={Scale.dataDriven}
                                        data={{
                                            xValues: dates,
                                            yMax: maxValueReach,
                                            series: {
                                                values: reachDataPoints,
                                                name: "Reach",
                                                color: "Purple",
                                            },
                                        }}
                                        className={""}
                                    />
                                }
                            />
                        }
                    />
                </div>
                <div className="tw-col-start-2 tw-col-span-3">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={adsData.map((object) => ({
                                        date: object.date,
                                        accountCurrency: object.accountCurrency,
                                        accountId: object.accountId,
                                        accountName: object.accountName,
                                        campaignId: object.campaignId,
                                        campaignName: object.campaignName,
                                        clicks: object.clicks,
                                        createdTime: object.createdTime,
                                        frequency: object.frequency,
                                        impressions: object.impressions,
                                        reach: object.reach,
                                        spend: object.spend,
                                        adId: object.adId,
                                        adName: object.adName,
                                        conversions: object.conversions,
                                        costPerAdClick: object.costPerAdClick,
                                        costPerConversion: object.costPerConversion,
                                        costPerUniqueClick: object.costPerUniqueClick,
                                        cpc: object.cpc,
                                        cpm: object.cpm,
                                        cpp: object.cpp,
                                        ctr: object.ctr,
                                        inlineLinkClicks: object.inlineLinkClicks,
                                        inlineLinkClickCtr: object.inlineLinkClickCtr,
                                        location: object.location,
                                        socialSpend: object.socialSpend,
                                        adsetId: object.adsetId,
                                    }))}
                                    columnDefs={[
                                        {
                                            headerName: "Date",
                                            valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date),
                                            filter: "agDateColumnFilter",
                                            comparator: agGridDateComparator,
                                            resizable: true,
                                        },
                                        {headerName: "accountCurrency", field: "accountCurrency", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "accountId", field: "accountId", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "accountName", field: "accountName", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "clicks", field: "clicks", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "createdTime", field: "createdTime", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "frequency", field: "frequency", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "impressions", field: "impressions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "reach", field: "reach", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "spend", field: "spend", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "campaignId", field: "campaignId", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "campaignName", field: "campaignName", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "adId", field: "adId", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "adName", field: "adName", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversions", field: "conversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "costPerAdClick", field: "costPerAdClick", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "costPerConversion", field: "costPerConversion", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "costPerUniqueClick", field: "costPerUniqueClick", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "cpc", field: "cpc", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "cpm", field: "cpm", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "cpp", field: "cpp", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "ctr", field: "ctr", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "inlineLinkClicks", field: "inlineLinkClicks", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "inlineLinkClickCtr", field: "inlineLinkClickCtr", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "location", field: "location", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "socialSpend", field: "socialSpend", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "adsetId", field: "adsetId", cellClass: "!tw-px-0", resizable: true},
                                    ]}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                />
                            </div>
                        }
                    />
                </div>
            </div>
        </>
    );
}

function AccountOverview({aggregatedMetrics, minDate, maxDate}: {aggregatedMetrics: FacebookAdsMetrics; minDate: Iso8601Date; maxDate: Iso8601Date}) {
    return (
        <GenericCard
            className="tw-rounded-tl-none"
            label="Account overview"
            content={
                <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
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

function CampaignOverview({adsData}: {adsData: Array<FacebookAdsAggregatedRow>}) {
    const metricsGroupByCampaign = getMetricsGroupByCampaign(adsData);

    return (
        <GenericCard
            className="tw-rounded-tl-none"
            label="Campaigns overview"
            content={
                <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                    <AgGridReact
                        rowData={metricsGroupByCampaign.map((object) => ({
                            campaignName: object.campaignName,
                            spend: numberToHumanFriendlyString(object.spend),
                            inlineLinkClicks: numberToHumanFriendlyString(object.inlineLinkClicks),
                            clicks: numberToHumanFriendlyString(object.clicks),
                            impressions: numberToHumanFriendlyString(object.impressions),
                            inlineLinkClicksCtr: object.impressions == 0 ? `${0.0}` : `${roundOffToTwoDigits((object.inlineLinkClicks / object.impressions) * 100)}%`,
                        }))}
                        columnDefs={[
                            {headerName: "Campaign Name", field: "campaignName", cellClass: "!tw-px-2", resizable: true},
                            {headerName: "Spend", field: "spend", cellClass: "!tw-px-2", resizable: true},
                            {headerName: "Clicks", field: "clicks", cellClass: "!tw-px-2", resizable: true},
                            {headerName: "Impressions", field: "impressions", cellClass: "!tw-px-2", resizable: true},
                            {headerName: "Link Clicks Ctr", field: "inlineLinkClicksCtr", cellClass: "!tw-px-2", resizable: true},
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

function getMetricsGroupByCampaign(facebookAdsData: Array<FacebookAdsAggregatedRow>): Array<CampaignMetrics> {
    const result = facebookAdsData.reduce((accumulatedResult: {[key: string]: CampaignMetrics}, currentObject) => {
        let campaignId = currentObject.campaignId;
        const impressions = currentObject.impressions;
        const inlineLinkClicks = currentObject.inlineLinkClicks;
        const spend = currentObject.spend;
        const clicks = currentObject.clicks;

        if (!accumulatedResult[campaignId]) {
            const facebookAdsMetrics: CampaignMetrics = {
                campaignName: currentObject.campaignName,
                spend: 0,
                inlineLinkClicks: 0,
                clicks: 0,
                impressions: 0,
            };
            accumulatedResult[campaignId] = facebookAdsMetrics;
        }

        accumulatedResult[campaignId].impressions += impressions;
        accumulatedResult[campaignId].inlineLinkClicks += inlineLinkClicks;
        accumulatedResult[campaignId].spend += spend;
        accumulatedResult[campaignId].clicks += clicks;

        return accumulatedResult;
    }, {});

    return Object.values(result);
}

function getAggregatedMetrics(facebookAdsData: Array<FacebookAdsAggregatedRow>): FacebookAdsMetrics {
    const initialObject: FacebookAdsMetrics = {
        conversions: 0,
        clicks: 0,
        frequency: 0,
        impressions: 0,
        reach: 0,
        cpc: 0,
        cpm: 0,
        cpp: 0,
        ctr: 0,
        spend: 0, // cost
        costPerAdClick: 0,
        inlineLinkClicks: 0,
        inlineLinkClickCtr: 0,
    };

    const aggregatedMetrics = facebookAdsData.reduce((accumulatedResult, currentObject) => {
        accumulatedResult.impressions += currentObject.impressions;
        accumulatedResult.clicks += currentObject.clicks;
        accumulatedResult.reach += currentObject.reach;
        accumulatedResult.spend += currentObject.spend;
        accumulatedResult.inlineLinkClicks += currentObject.inlineLinkClicks;

        return accumulatedResult;
    }, initialObject);

    // Conversions
    aggregatedMetrics.conversions = facebookAdsData.reduce((totalConversions: number, currentRow: FacebookAdsAggregatedRow) => {
        const rowTotal = currentRow.conversions.reduce((totalRowConversions: number, row: AdsActionStatsObject) => {
            return totalRowConversions + row.value;
        }, 0);

        return totalConversions + rowTotal;
    }, 0);

    // Frequency = Total Impressions / Total Reach
    aggregatedMetrics.frequency = aggregatedMetrics.reach == 0 ? 0 : aggregatedMetrics.impressions / aggregatedMetrics.reach;

    // CPM = Cost per thousand impressiosn
    aggregatedMetrics.cpm = aggregatedMetrics.impressions / 1000 == 0 ? 0 : aggregatedMetrics.spend / (aggregatedMetrics.impressions / 1000);

    // CTR = total clicks / total impressions
    aggregatedMetrics.ctr = aggregatedMetrics.impressions == 0 ? 0.0 : (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100;

    // Link-click CTR
    aggregatedMetrics.inlineLinkClickCtr = aggregatedMetrics.impressions == 0 ? 0.0 : (aggregatedMetrics.inlineLinkClicks / aggregatedMetrics.impressions) * 100;

    // Average cost-per-click (all)
    aggregatedMetrics.cpc = aggregatedMetrics.spend == 0 ? 0 : aggregatedMetrics.spend / aggregatedMetrics.clicks;

    // CPP: cost per thousand reach
    aggregatedMetrics.cpp = aggregatedMetrics.reach / 1000 == 0 ? 0 : aggregatedMetrics.spend / (aggregatedMetrics.reach / 1000);

    return aggregatedMetrics;
}
