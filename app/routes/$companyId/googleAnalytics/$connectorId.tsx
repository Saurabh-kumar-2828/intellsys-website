import * as Tabs from "@radix-ui/react-tabs";
import type {LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {AgGridReact} from "ag-grid-react";
import styles from "app/styles.css";
import {DateTime} from "luxon";
import {useState} from "react";
import type {GoogleAnalyticsData, GoogleAnalyticsDataAggregatedRow} from "~/backend/business-insights";
import {getGoogleAnalyticsLectrixData} from "~/backend/business-insights";
import {getTimeGranularityFromUnknown, TimeGranularity} from "~/backend/business-insights";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {DateFilterSection, GenericCard} from "~/components/scratchpad";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
import {agGridDateComparator, dateToMediumNoneEnFormat, defaultColumnDefinitions, getNonEmptyStringOrNull} from "~/utilities/utilities";
import "ag-grid-enterprise";
import {getStringFromUnknown, getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getDestinationCredentialId} from "~/backend/utilities/data-management/common.server";

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

    const googleAnalyticsData = await getGoogleAnalyticsLectrixData(
        getStringFromUnknown(minDate),
        getStringFromUnknown(maxDate),
        selectedGranularity,
        getUuidFromUnknown(destinationDatabaseCredentialId),
        getUuidFromUnknown(connectorId),
    );

    if (googleAnalyticsData instanceof Error) {
        throw new Response(null, {status: 402});
    }

    if (!googleAnalyticsData) {
        throw new Response(null, {status: 402});
    }

    // TODO: Add filters
    const loaderData: LoaderData = {
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: minDate as string,
        appliedMaxDate: maxDate as string,
        googleAnalyticsData: googleAnalyticsData,
        companyId: getUuidFromUnknown(companyId),
        connectorId: getUuidFromUnknown(connectorId),
    };

    return json(loaderData);
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, googleAnalyticsData, companyId, connectorId} = useLoaderData() as LoaderData;

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
                    page={`/${companyId}/googleAnalytics/${connectorId}`}
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
    return (
        <div className="tw-grid tw-grid-cols-1 tw-p-2">
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
                    <div className="tw-grid tw-overflow-auto">Sample</div>
                </Tabs.Content>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={analyticsData.map((object) => ({
                                        Date: object.date,
                                        sessionCampaignName: object.sessionCampaignName,
                                        source: object.source,
                                        sourceMedium: object.sourceMedium,
                                        sourcePlatform: object.sourcePlatform,
                                        audienceId: object.audienceId,
                                        sessions: object.sessions,
                                        averagePurchaseRevenuePerPayingUser: object.averagePurchaseRevenuePerPayingUser,
                                        bounceRate: object.bounceRate,
                                        cartToViewRate: object.cartToViewRate,
                                        conversions: object.conversions,
                                        engagedSessions: object.engagedSessions,
                                        engagementRate: object.engagementRate,
                                        eventValue: object.eventValue,
                                        firstTimePurchasers: object.firstTimePurchasers,
                                        grossPurchaseRevenue: object.grossPurchaseRevenue,
                                    }))}
                                    columnDefs={[
                                        {
                                            headerName: "Date",
                                            valueGetter: (params) => dateToMediumNoneEnFormat(params.data.Date),
                                            filter: "agDateColumnFilter",
                                            comparator: agGridDateComparator,
                                            resizable: true,
                                        },
                                        {headerName: "sessionCampaignName", field: "sessionCampaignName", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "source", field: "source", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sourceMedium", field: "sourceMedium", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sourcePlatform", field: "sourcePlatform", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "audienceId", field: "audienceId", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "sessions", field: "sessions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "averagePurchaseRevenuePerPayingUser", field: "averagePurchaseRevenuePerPayingUser", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "bounceRate", field: "bounceRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "cartToViewRate", field: "cartToViewRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversions", field: "conversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "engagedSessions", field: "engagedSessions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "engagementRate", field: "engagementRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "eventValue", field: "eventValue", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "firstTimePurchasers", field: "firstTimePurchasers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "grossPurchaseRevenue", field: "grossPurchaseRevenue", cellClass: "!tw-px-0", resizable: true},
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
