import * as Tabs from "@radix-ui/react-tabs";
import type {LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {AgGridReact} from "ag-grid-react";
import styles from "app/styles.css";
import {DateTime} from "luxon";
import type {FacebookAdsAggregatedRow} from "~/backend/business-insights";
import {getFacebookAdsLectrixData} from "~/backend/business-insights";
import {getTimeGranularityFromUnknown, TimeGranularity} from "~/backend/business-insights";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {DateFilterSection, GenericCard} from "~/components/scratchpad";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
import {agGridDateComparator, dateToMediumNoneEnFormat, defaultColumnDefinitions, getDates, getNonEmptyStringOrNull} from "~/utilities/utilities";
import "ag-grid-enterprise";
import {getStringFromUnknown, getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getDestinationCredentialId} from "~/backend/utilities/connectors/common.server";
import {useState} from "react";
import {CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from "chart.js";
import {Line} from "react-chartjs-2";

export const meta: MetaFunction = () => {
    return {
        title: "Facebook Ads Funnel - Intellsys",
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
    facebookAdsData: {
        metaQuery: string;
        rows: Array<FacebookAdsAggregatedRow>;
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

    const facebookAdsData = await getFacebookAdsLectrixData(
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
        appliedMinDate: minDate as string,
        appliedMaxDate: maxDate as string,
        facebookAdsData: facebookAdsData,
        companyId: getUuidFromUnknown(companyId),
        connectorId: getUuidFromUnknown(connectorId),
    };

    return json(loaderData);
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, facebookAdsData, companyId, connectorId} = useLoaderData() as LoaderData;

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
    // chartjs graphs
    ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement);

    const dates = getDates(minDate, maxDate);
    const dayWiseSpend = adsData.map((row) => parseInt(row.spend));

    const labels = dates;
    const data = {
        labels,
        datasets: [
            {
                label: "Daily Spend",
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
                text: "Day-wise distribution of total spend",
            },
        },
    };

    return (
        <div className="tw-grid tw-grid-cols-1 tw-p-2 tw-gap-5">
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
                className="tw-row-start-2"
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
                <Tabs.Content value="2"></Tabs.Content>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={adsData.map((object) => ({
                                        accountCurrency: object.accountCurrency,
                                        accountId: object.accountId,
                                        accountName: object.accountName,
                                        campaignId: object.campaignId,
                                        campaignName: object.campaignName,
                                        clicks: object.clicks,
                                        createdTime: object.createdTime,
                                        dateStart: object.dateStart,
                                        dateStop: object.dateStop,
                                        frequency: object.frequency,
                                        impressions: object.impressions,
                                        reach: object.reach,
                                        spend: object.spend,
                                    }))}
                                    columnDefs={[
                                        {
                                            headerName: "Date",
                                            valueGetter: (params) => dateToMediumNoneEnFormat(params.data.dateStart),
                                            filter: "agDateColumnFilter",
                                            comparator: agGridDateComparator,
                                            resizable: true,
                                        },
                                        {headerName: "accountCurrency", field: "accountCurrency", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "accountId", field: "accountId", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "accountName", field: "accountName", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "clicks", field: "clicks", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "createdTime", field: "createdTime", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "dateStart", field: "dateStart", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "dateStop", field: "dateStop", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "frequency", field: "frequency", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "impressions", field: "impressions", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "reach", field: "reach", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "spend", field: "spend", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "campaignId", field: "campaignId", cellClass: "!tw-px-0", resizable: true},
                                        {headerName: "campaignName", field: "campaignName", cellClass: "!tw-px-0", resizable: true},
                                    ]}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                />
                            </div>
                        }
                    />
                </Tabs.Content>
            </Tabs.Root>
        </div>
    );
}
