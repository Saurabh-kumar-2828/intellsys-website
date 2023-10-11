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
import type {GoogleAnalyticsData, GoogleAnalyticsDataAggregatedRow} from "~/backend/business-insights";
import {TimeGranularity, getGoogleAnalyticsData, getTimeGranularityFromUnknown} from "~/backend/business-insights";
import {getDestinationCredentialId} from "~/backend/utilities/connectors/common.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {PageScaffold} from "~/components/pageScaffold";
import {DateFilterSection, GenericCard} from "~/components/scratchpad";
import {VerticalSpacer} from "~/global-common-typescript/components/verticalSpacer";
import {getNonEmptyStringFromUnknown, getStringFromUnknown, getUuidFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getSingletonValue} from "~/global-common-typescript/utilities/utilities";
import {agGridDateComparator, dateToMediumNoneEnFormat, defaultColumnDefinitions, getDates} from "~/utilities/utilities";
import type {CompanyLoaderData} from "~/routes/$companyId";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";

// Google analytics

export const meta: MetaFunction = ({data, matches}) => {
    return [
        {
            title: "Google Analytics Report - Intellsys",
        },
    ];
};

type LoaderData = {
    appliedMinDate: Iso8601Date;
    appliedMaxDate: Iso8601Date;
    appliedSelectedGranularity: TimeGranularity;
    googleAnalyticsData: GoogleAnalyticsData;
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

    const googleAnalyticsData = await getGoogleAnalyticsData(
        getStringFromUnknown(minDate),
        getStringFromUnknown(maxDate),
        selectedGranularity,
        getUuidFromUnknown(destinationDatabaseCredentialId),
        getUuidFromUnknown(connectorId),
    );

    if (googleAnalyticsData instanceof Error) {
        throw new Response("caf48cb5-5dd9-411a-b49e-c6a2ae7e23e3", {
            status: 400,
        });
    }

    if (!googleAnalyticsData) {
        throw new Response("bc6d8bac-f3d8-4efe-8a2a-353b205e7d02", {
            status: 400,
        });
    }

    // TODO: Add filters
    const loaderData: LoaderData = {
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: minDate,
        appliedMaxDate: maxDate,
        googleAnalyticsData: googleAnalyticsData,
        companyId: getUuidFromUnknown(companyId),
        connectorId: getUuidFromUnknown(connectorId),
    };

    return json(loaderData);
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, googleAnalyticsData, companyId, connectorId} = useLoaderData() as LoaderData;

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
                googleAnalyticsData={googleAnalyticsData}
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
    googleAnalyticsData,
    companyId,
    connectorId,
}: {
    appliedMinDate: Iso8601Date;
    appliedSelectedGranularity: TimeGranularity;
    appliedMaxDate: Iso8601Date;
    googleAnalyticsData: GoogleAnalyticsData;
    companyId: Uuid;
    connectorId: Uuid;
}) {
    const [selectedGranularity, setSelectedGranularity] = useState<TimeGranularity>(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState<Iso8601Date>(appliedMinDate);
    const [selectedMaxDate, setSelectedMaxDate] = useState<Iso8601Date>(appliedMaxDate);

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
                    page={`/${companyId}/6cd015ff-ec2e-412a-a777-f983fbdcb63e/${connectorId}`}
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
                    analyticsData={googleAnalyticsData.rows}
                    granularity={selectedGranularity}
                    minDate={appliedMinDate}
                    maxDate={appliedMaxDate}
                />
            </div>
        </>
    );
}

function CampaignsSection({
    analyticsData,
    granularity,
    minDate,
    maxDate,
}: {
    analyticsData: Array<GoogleAnalyticsDataAggregatedRow>;
    granularity: TimeGranularity;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
}) {
    ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement);

    const dates = getDates(minDate, maxDate);
    const dayWiseSpend = analyticsData.map((row) => parseInt(row.activeUsers));

    const labels = dates;
    const data = {
        labels,
        datasets: [
            {
                label: "Daily Active Users",
                data: dayWiseSpend,
                borderColor: "rgb(212, 172, 13)",
                backgroundColor: "rgb(212, 172, 13)",
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Day-wise distribution of total clicks",
            },
        },
    };

    return (
        <div className="tw-grid tw-grid-cols-1 tw-p-2">
            <div className="tw-row-start-1">
                <GenericCard
                    className="tw-rounded-tl-none"
                    content={
                        <div className="tw-grid tw-grid-cols-4">
                            <div className="tw-row-start-1 tw-col-start-2 tw-col-span-2 tw-grid">
                                <Line
                                    options={options}
                                    data={data}
                                    className="tw-row-start-1 tw-col-start-1"
                                />
                            </div>
                        </div>
                    }
                    metaQuery={""}
                />
            </div>

            <VerticalSpacer className="tw-row-start-2 tw-h-8" />

            <Tabs.Root
                defaultValue="1"
                className="tw-row-start-3"
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
                    <div className="tw-grid tw-overflow-auto">Sample</div>
                </Tabs.Content>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={analyticsData.map((object) => ({
                                        date: object.date,
                                        adSourceName: object.adSourceName,
                                        adUnitName: object.adUnitName,
                                        newVsReturning: object.newVsReturning,
                                        platform: object.platform,
                                        active1DayUsers: object.active1DayUsers,
                                        active28DayUsers: object.active28DayUsers,
                                        active7DayUsers: object.active7DayUsers,
                                        activeUsers: object.activeUsers,
                                        addToCarts: object.addToCarts,
                                        adUnitExposure: object.adUnitExposure,
                                        averagePurchaseRevenue: object.averagePurchaseRevenue,
                                        averagePurchaseRevenuePerPayingUser: object.averagePurchaseRevenuePerPayingUser,
                                        averagePurchaseRevenuePerUser: object.averagePurchaseRevenuePerUser,
                                        averageRevenuePerUser: object.averageRevenuePerUser,
                                        averageSessionDuration: object.averageSessionDuration,
                                        bounceRate: object.bounceRate,
                                        cartToViewRate: object.cartToViewRate,
                                        checkouts: object.checkouts,
                                        conversions: object.conversions,
                                        conversionsTest_Ride: object.conversionsTest_Ride,
                                        conversionsTRD: object.conversionsTRD,
                                        conversionsTRH_CYTR: object.conversionsTRH_CYTR,
                                        conversionsTRH_OTPverified: object.conversionsTRH_OTPverified,
                                        conversionsPurchase: object.conversionsPurchase,
                                        crashAffectedUsers: object.crashAffectedUsers,
                                        crashFreeUsersRate: object.crashFreeUsersRate,
                                        dauPerMau: object.dauPerMau,
                                        dauPerWau: object.dauPerWau,
                                        ecommercePurchases: object.ecommercePurchases,
                                        engagedSessions: object.engagedSessions,
                                        engagementRate: object.engagementRate,
                                        eventCount: object.eventCount,
                                        eventCountPerUser: object.eventCountPerUser,
                                        eventsPerSession: object.eventsPerSession,
                                        eventValue: object.eventValue,
                                        firstTimePurchaserConversionRate: object.firstTimePurchaserConversionRate,
                                        firstTimePurchasers: object.firstTimePurchasers,
                                        firstTimePurchasersPerNewUser: object.firstTimePurchasersPerNewUser,
                                        grossPurchaseRevenue: object.grossPurchaseRevenue,
                                        itemListClickEvents: object.itemListClickEvents,
                                        itemListClickThroughRate: object.itemListClickThroughRate,
                                        itemListViewEvents: object.itemListViewEvents,
                                        itemPromotionClickThroughRate: object.itemPromotionClickThroughRate,
                                        itemViewEvents: object.itemViewEvents,
                                        newUsers: object.newUsers,
                                        promotionClicks: object.promotionClicks,
                                        promotionViews: object.promotionViews,
                                        publisherAdClicks: object.publisherAdClicks,
                                        publisherAdImpressions: object.publisherAdImpressions,
                                        purchaseRevenue: object.purchaseRevenue,
                                        purchaseToViewRate: object.purchaseToViewRate,
                                        purchaserConversionRate: object.purchaserConversionRate,
                                        refundAmount: object.refundAmount,
                                        screenPageViews: object.screenPageViews,
                                        screenPageViewsPerSession: object.screenPageViewsPerSession,
                                        screenPageViewsPerUser: object.screenPageViewsPerUser,
                                        scrolledUsers: object.scrolledUsers,
                                        sessionConversionRate: object.sessionConversionRate,
                                        sessionConversionRateTestRide: object.sessionConversionRateTestRide,
                                        sessionConversionRateTRD: object.sessionConversionRateTRD,
                                        sessionConversionRateTRH_CYTR: object.sessionConversionRateTRH_CYTR,
                                        sessionConversionRateTRH_OTPverified: object.sessionConversionRateTRH_OTPverified,
                                        sessionConversionRatePurchase: object.sessionConversionRatePurchase,
                                        sessions: object.sessions,
                                        sessionsPerUser: object.sessionsPerUser,
                                        shippingAmount: object.shippingAmount,
                                        taxAmount: object.taxAmount,
                                        totalAdRevenue: object.totalAdRevenue,
                                        totalPurchasers: object.totalPurchasers,
                                        totalRevenue: object.totalRevenue,
                                        totalUsers: object.totalUsers,
                                        transactions: object.transactions,
                                        transactionsPerPurchaser: object.transactionsPerPurchaser,
                                        userConversionRate: object.userConversionRate,
                                        userConversionRateTestRide: object.userConversionRateTestRide,
                                        userConversionRateTRD: object.userConversionRateTRD,
                                        userConversionRateTRH_CYTR: object.userConversionRateTRH_CYTR,
                                        userConversionRateTRH_Otpverified: object.userConversionRateTRH_Otpverified,
                                        userConversionRatePurchase: object.userConversionRatePurchase,
                                        userEngagementDuration: object.userEngagementDuration,
                                        wauPerMau: object.wauPerMau,
                                    }))}
                                    columnDefs={[
                                        {
                                            headerName: "Date",
                                            valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date),
                                            filter: "agDateColumnFilter",
                                            comparator: agGridDateComparator,
                                            resizable: true,
                                        },
                                        {headerName: "adSourceName", field: "adSourceName", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "adUnitName", field: "adUnitName", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "newVsReturning", field: "newVsReturning", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "platform", field: "platform", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "active1DayUsers", field: "active1DayUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "active28DayUsers", field: "active28DayUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "active7DayUsers", field: "active7DayUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "activeUsers", field: "activeUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "addToCarts", field: "addToCarts", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "adUnitExposure", field: "adUnitExposure", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averagePurchaseRevenue", field: "averagePurchaseRevenue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averagePurchaseRevenuePerPayingUser", field: "averagePurchaseRevenuePerPayingUser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averagePurchaseRevenuePerUser", field: "averagePurchaseRevenuePerUser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averageRevenuePerUser", field: "averageRevenuePerUser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averageSessionDuration", field: "averageSessionDuration", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "bounceRate", field: "bounceRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "cartToViewRate", field: "cartToViewRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "checkouts", field: "checkouts", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversions", field: "conversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversionsTest_Ride", field: "conversionsTest_Ride", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversionsTRD", field: "conversionsTRD", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversionsTRH_CYTR", field: "conversionsTRH_CYTR", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversionsTRH_OTPverified", field: "conversionsTRH_OTPverified", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversionsPurchase", field: "conversionsPurchase", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "crashAffectedUsers", field: "crashAffectedUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "crashFreeUsersRate", field: "crashFreeUsersRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "dauPerMau", field: "dauPerMau", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "dauPerWau", field: "dauPerWau", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "ecommercePurchases", field: "ecommercePurchases", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "engagedSessions", field: "engagedSessions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "engagementRate", field: "engagementRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "eventCount", field: "eventCount", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "eventCountPerUser", field: "eventCountPerUser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "eventsPerSession", field: "eventsPerSession", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "eventValue", field: "eventValue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "firstTimePurchaserConversionRate", field: "firstTimePurchaserConversionRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "firstTimePurchasers", field: "firstTimePurchasers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "firstTimePurchasersPerNewUser", field: "firstTimePurchasersPerNewUser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "grossPurchaseRevenue", field: "grossPurchaseRevenue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "itemListClickEvents", field: "itemListClickEvents", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "itemListClickThroughRate", field: "itemListClickThroughRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "itemListViewEvents", field: "itemListViewEvents", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "itemPromotionClickThroughRate", field: "itemPromotionClickThroughRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "itemViewEvents", field: "itemViewEvents", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "newUsers", field: "newUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "promotionClicks", field: "promotionClicks", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "promotionViews", field: "promotionViews", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "publisherAdClicks", field: "publisherAdClicks", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "publisherAdImpressions", field: "publisherAdImpressions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "purchaseRevenue", field: "purchaseRevenue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "purchaseToViewRate", field: "purchaseToViewRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "purchaserConversionRate", field: "purchaserConversionRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "refundAmount", field: "refundAmount", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "screenPageViews", field: "screenPageViews", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "screenPageViewsPerSession", field: "screenPageViewsPerSession", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "screenPageViewsPerUser", field: "screenPageViewsPerUser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "scrolledUsers", field: "scrolledUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessionConversionRate", field: "sessionConversionRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessionConversionRateTestRide", field: "sessionConversionRateTestRide", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessionConversionRateTRD", field: "sessionConversionRateTRD", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessionConversionRateTRH_CYTR", field: "sessionConversionRateTRH_CYTR", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessionConversionRateTRH_OTPverified", field: "sessionConversionRateTRH_OTPverified", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessionConversionRatePurchase", field: "sessionConversionRatePurchase", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessions", field: "sessions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessionsPerUser", field: "sessionsPerUser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "shippingAmount", field: "shippingAmount", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "taxAmount", field: "taxAmount", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "totalAdRevenue", field: "totalAdRevenue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "totalPurchasers", field: "totalPurchasers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "totalRevenue", field: "totalRevenue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "totalUsers", field: "totalUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "transactions", field: "transactions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "transactionsPerPurchaser", field: "transactionsPerPurchaser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "userConversionRate", field: "userConversionRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "userConversionRateTestRide", field: "userConversionRateTestRide", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "userConversionRateTRD", field: "userConversionRateTRD", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "userConversionRateTRH_CYTR", field: "userConversionRateTRH_CYTR", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "userConversionRateTRH_Otpverified", field: "userConversionRateTRH_Otpverified", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "userConversionRatePurchase", field: "userConversionRatePurchase", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "userEngagementDuration", field: "userEngagementDuration", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "wauPerMau", field: "wauPerMau", cellClass: "!tw-px-0", resizable: true},
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
