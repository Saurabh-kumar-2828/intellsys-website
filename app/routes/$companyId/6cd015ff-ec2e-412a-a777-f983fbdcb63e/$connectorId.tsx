import * as Tabs from "@radix-ui/react-tabs";
import type {LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {useLoaderData, useMatches} from "@remix-run/react";
import "ag-grid-enterprise";
import {AgGridReact} from "ag-grid-react";
import styles from "app/styles.css";
import {DateTime} from "luxon";
import {useState} from "react";
import { Line } from "react-chartjs-2";
import {CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Title, Tooltip} from "chart.js";
import type {GoogleAnalyticsData, GoogleAnalyticsDataAggregatedRow} from "~/backend/business-insights";
import {TimeGranularity, getGoogleAnalyticsLectrixData, getTimeGranularityFromUnknown} from "~/backend/business-insights";
import {getDestinationCredentialId} from "~/backend/utilities/connectors/common.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {PageScaffold} from "~/components/pageScaffold";
import {DateFilterSection, GenericCard} from "~/components/scratchpad";
import {getStringFromUnknown, getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {CompanyLoaderData} from "~/routes/$companyId";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
import {agGridDateComparator, dateToMediumNoneEnFormat, defaultColumnDefinitions, getDates, getNonEmptyStringOrNull, getSingletonValue} from "~/utilities/utilities";

// Google analytics

export const meta: MetaFunction = () => {
    return {
        title: "Google Analytics Report - Intellsys",
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
                position: "top" as const,
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
                                        date: object.date,
                                        source: object.source,
                                        activeUsers: object.activeUsers,
                                        conversions: object.conversions,
                                        dauPerMau: object.dauPerMau,
                                        dauPerWau: object.dauPerWau,
                                        totalUsers: object.totalUsers,
                                        userConversionRate: object.userConversionRate,
                                        wauPerMau: object.wauPerMau
                                    }))}
                                    columnDefs={[
                                        {
                                            headerName: "Date",
                                            valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date),
                                            filter: "agDateColumnFilter",
                                            comparator: agGridDateComparator,
                                            resizable: true,
                                        },
                                        {headerName: "source", field: "source", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "activeUsers", field: "activeUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "conversions", field: "conversions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "dauPerMau", field: "dauPerMau", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "dauPerWau", field: "dauPerWau", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "totalUsers", field: "totalUsers", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "userConversionRate", field: "userConversionRate", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "wauPerMau", field: "wauPerMau", cellClass: "!tw-px-0", resizable: true}
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
