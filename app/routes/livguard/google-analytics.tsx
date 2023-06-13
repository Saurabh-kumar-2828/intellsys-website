import type {LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Title, Tooltip} from "chart.js";
import csvDownload from "json-to-csv-export";
import React, {useState} from "react";
import {TriangleFill} from "react-bootstrap-icons";
import {Bar, Line} from "react-chartjs-2";
import {getSearchQueriesWithInfo} from "~/backend/livguard.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {EmptyFlexFiller} from "~/global-common-typescript/components/emptyFlexFiller";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getNonEmptyStringFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {concatenateNonNullStringsWithSpaces} from "~/global-common-typescript/utilities/utilities";

export type GoogleAnalyticsData = {
    date: string;
    users: number;
    newUsers: number;
    bounceRate: number;
    sessions: number;
    avgSessionDuration: number;
};

type LoaderData = {
    startDate: string;
    endDate: string;
    totalRows: number;
    googleAnalyticsData: Array<GoogleAnalyticsData>;
};

export const loader: LoaderFunction = async ({request}) => {
    const accessToken = await getAccessTokenFromCookies(request);

    if (accessToken == null) {
        // TODO: Add message in login page
        return redirect(`/sign-in?redirectTo=${getUrlFromRequest(request)}`);
    }

    // const companyId = params.companyId;
    // if (companyId == null) {
    //     throw new Response(null, {status: 404});
    // }

    const urlSearchParams = new URL(request.url).searchParams;

    const startDate = safeParse(getNonEmptyStringFromUnknown, urlSearchParams.get("startDate")) ?? new Date().toISOString().slice(0, 10);
    const endDate = safeParse(getNonEmptyStringFromUnknown, urlSearchParams.get("endDate")) ?? new Date().toISOString().slice(0, 10);

    const googleAnalyticsData = [
        {
            date: "2023-05-22",
            users: 1406,
            newUsers: 1168,
            bounceRate: 62.49,
            sessions: 1565,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 57,
        },
        {
            date: "2023-05-23",
            users: 1390,
            newUsers: 1165,
            bounceRate: 60.43,
            sessions: 1544,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 13,
        },
        {
            date: "2023-06-08",
            users: 1360,
            newUsers: 1144,
            bounceRate: 63.11,
            sessions: 1510,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 2,
        },
        {
            date: "2023-05-24",
            users: 1294,
            newUsers: 1091,
            bounceRate: 63.2,
            sessions: 1405,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 13,
        },
        {
            date: "2023-05-18",
            users: 1279,
            newUsers: 1052,
            bounceRate: 59.48,
            sessions: 1424,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 4,
        },
        {
            date: "2023-05-25",
            users: 1269,
            newUsers: 1068,
            bounceRate: 61.33,
            sessions: 1394,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 53,
        },
        {
            date: "2023-06-07",
            users: 1256,
            newUsers: 1074,
            bounceRate: 66.36,
            sessions: 1403,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 41,
        },
        {
            date: "2023-05-16",
            users: 1250,
            newUsers: 1071,
            bounceRate: 60.62,
            sessions: 1389,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 47,
        },
        {
            date: "2023-06-06",
            users: 1203,
            newUsers: 1006,
            bounceRate: 65.83,
            sessions: 1314,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 30,
        },
        {
            date: "2023-05-19",
            users: 1196,
            newUsers: 1018,
            bounceRate: 60.35,
            sessions: 1329,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 52,
        },
        {
            date: "2023-06-05",
            users: 1194,
            newUsers: 1017,
            bounceRate: 61.04,
            sessions: 1309,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 16,
        },
        {
            date: "2023-05-26",
            users: 1189,
            newUsers: 974,
            bounceRate: 65.94,
            sessions: 1336,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 46,
        },
        {
            date: "2023-05-30",
            users: 1182,
            newUsers: 983,
            bounceRate: 61.66,
            sessions: 1299,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 54,
        },
        {
            date: "2023-05-31",
            users: 1169,
            newUsers: 969,
            bounceRate: 63.18,
            sessions: 1290,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 52,
        },
        {
            date: "2023-06-02",
            users: 1157,
            newUsers: 954,
            bounceRate: 63.96,
            sessions: 1279,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 32,
        },
        {
            date: "2023-06-03",
            users: 1155,
            newUsers: 954,
            bounceRate: 64.9,
            sessions: 1285,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 36,
        },
        {
            date: "2023-06-01",
            users: 1149,
            newUsers: 971,
            bounceRate: 61.53,
            sessions: 1253,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 44,
        },
        {
            date: "2023-05-27",
            users: 1145,
            newUsers: 988,
            bounceRate: 62.91,
            sessions: 1270,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 54,
        },
        {
            date: "2023-05-15",
            users: 1128,
            newUsers: 947,
            bounceRate: 63.31,
            sessions: 1240,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 52,
        },
        {
            date: "2023-05-21",
            users: 1122,
            newUsers: 963,
            bounceRate: 63.84,
            sessions: 1228,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 40,
        },
        {
            date: "2023-05-29",
            users: 1122,
            newUsers: 925,
            bounceRate: 62.57,
            sessions: 1245,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 48,
        },
        {
            date: "2023-05-17",
            users: 1116,
            newUsers: 916,
            bounceRate: 60.68,
            sessions: 1241,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 19,
        },
        {
            date: "2023-05-20",
            users: 1110,
            newUsers: 949,
            bounceRate: 62.47,
            sessions: 1215,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 34,
        },
        {
            date: "2023-06-04",
            users: 1018,
            newUsers: 871,
            bounceRate: 64.23,
            sessions: 1121,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 23,
        },
        {
            date: "2023-05-28",
            users: 973,
            newUsers: 806,
            bounceRate: 64.54,
            sessions: 1080,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 42,
        },
        {
            date: "2023-05-10",
            users: 917,
            newUsers: 770,
            bounceRate: 62.9,
            sessions: 1027,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 52,
        },
        {
            date: "2023-05-13",
            users: 895,
            newUsers: 743,
            bounceRate: 60.91,
            sessions: 985,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 21,
        },
        {
            date: "2023-05-14",
            users: 895,
            newUsers: 774,
            bounceRate: 65.0,
            sessions: 980,
            avgSessionDuration: 0 * 3600 + 1 * 60 + 32,
        },
        {
            date: "2023-05-11",
            users: 870,
            newUsers: 724,
            bounceRate: 63.31,
            sessions: 973,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 0,
        },
        {
            date: "2023-05-12",
            users: 847,
            newUsers: 697,
            bounceRate: 59.62,
            sessions: 946,
            avgSessionDuration: 0 * 3600 + 2 * 60 + 11,
        },
    ];

    const loaderData: LoaderData = {
        startDate: startDate,
        endDate: endDate,
        totalRows: 31,
        googleAnalyticsData: googleAnalyticsData,
    };

    return json(loaderData);
};

export default function () {
    const {startDate: originalStartDate, endDate: originalEndDate, totalRows, googleAnalyticsData} = useLoaderData() as LoaderData;

    const [rows, setRows] = useState(() => structuredClone(googleAnalyticsData));

    const [rowsToInsert, setRowsToInsert] = useState<Array<Uuid>>([]);
    const [rowsToUpdate, setRowsToUpdate] = useState<Array<Uuid>>([]);
    const [rowsToDelete, setRowsToDelete] = useState<Array<Uuid>>([]);

    const [startDate, setStartDate] = useState(originalStartDate);
    const [endDate, setEndDate] = useState(originalEndDate);

    function markRowAsInserted(row: GoogleAnalyticsData) {
        if (rowsToInsert.includes(row.date)) {
            return;
        }

        setRowsToInsert([...rowsToInsert, row.date]);
    }

    function markRowAsUpdated(row: GoogleAnalyticsData) {
        if (rowsToInsert.includes(row.date) || rowsToUpdate.includes(row.date)) {
            return;
        }

        setRowsToUpdate([...rowsToUpdate, row.date]);
    }

    // chartjs graphs
    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center tw-relative">
                Google Analytics
                <button
                    type="button"
                    className="tw-absolute tw-left-0 tw-top-4 tw-bottom-4 tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                    // onClick={() => {
                    //     const location: Location = {
                    //         id: generateUuid(),
                    //         cityId: "",
                    //         name: "",
                    //         addressLine1: "",
                    //         addressLine2: "",
                    //         pinCode: "",
                    //         phoneNumber: "",
                    //         emailId: "",
                    //         testRideSlotsStart: 36000,
                    //         testRideSlotsEnd: 64800,
                    //         testRideSlotsDuration: 7200,
                    //         testRideVehiclesInventory: 1,
                    //         subscriptionVehiclesInventory: 1,
                    //         latitude: 0,
                    //         longitude: 0,
                    //         googleMapsLink: "",
                    //         isTestRideEnabled: false,
                    //         isSubscriptionEnabled: false,
                    //         isPurchaseEnabled: false,
                    //         dealerCode:"",
                    //         isDeleted: false
                    //     };

                    //     markLocationAsInserted(location);
                    //     setLocations([...locations, location]);
                    // }}
                    disabled={true}
                >
                    Add Row
                </button>
                {/* <fetcher.Form */}
                <form
                    method="post"
                    action="/update-locations"
                    className="tw-absolute tw-right-0 tw-top-4 tw-bottom-4 tw-flex"
                >
                    {/* <input
                        name="locationsToInsert"
                        className="tw-hidden"
                        readOnly
                        value={JSON.stringify(locations.filter(location => locationsToInsert.includes(location.id)))}
                    />

                    <input
                        name="locationsToUpdate"
                        className="tw-hidden"
                        readOnly
                        value={JSON.stringify(locations.filter(location => locationsToUpdate.includes(location.id)))}
                    /> */}

                    <button
                        // type="submit"
                        type="button"
                        className="tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                        // disabled={(locationsToInsert.length == 0 && locationsToUpdate.length == 0) || transition.state != "idle"}
                        disabled={true}
                    >
                        Save All
                    </button>
                </form>
                {/* </fetcher.Form> */}
            </div>

            <div className="tw-col-span-12 tw-flex tw-gap-x-4 tw-items-center">
                <input
                    type="date"
                    value={startDate}
                    className="tw-p-2 tw-bg-dark-bg-500"
                    onChange={(e) => setStartDate(e.target.value)}
                />

                <input
                    type="date"
                    value={endDate}
                    className="tw-p-2 tw-bg-dark-bg-500"
                    onChange={(e) => setEndDate(e.target.value)}
                />

                <a
                    href={`/livguard/search-queries?startDate=${startDate}&endDate=${endDate}`}
                    className="tw-top-4 tw-bottom-4 tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                >
                    Update
                </a>

                <EmptyFlexFiller />

                <div>Days: {totalRows}</div>

                <button
                    type="button"
                    className="tw-top-4 tw-bottom-4 tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                    onClick={() => {
                        csvDownload({
                            data: rows.map((row) => flattenObject(row)),
                            delimiter: ",",
                            filename: "search-queries.csv",
                        });
                    }}
                >
                    Export
                </button>
            </div>

            <div className="tw-col-span-12 tw-h-[calc(100vh-14rem)]">
                <Line
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: "top" as const,
                            },
                            title: {
                                display: true,
                                text: "DoD Metrics",
                            },
                        },
                    }}
                    data={{
                        labels: rows.map((row) => row.date),
                        datasets: [
                            {
                                label: "users",
                                data: rows.map((row) => row.users),
                                backgroundColor: "rgba(75, 192, 192, 0.6)",
                                borderColor: "rgba(75, 192, 192, 0.6)",
                            },
                            {
                                label: "newUsers",
                                data: rows.map((row) => row.newUsers),
                                backgroundColor: "rgba(255, 159, 64, 0.6)",
                                borderColor: "rgba(255, 159, 64, 0.6)",
                            },
                        ],
                    }}
                />
            </div>

            <div className="tw-col-span-12 tw-h-[calc(100vh-14rem)]">
                <Line
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: "top" as const,
                            },
                            title: {
                                display: true,
                                text: "DoD Metrics",
                            },
                        },
                    }}
                    data={{
                        labels: rows.map((row) => row.date),
                        datasets: [
                            {
                                label: "bounceRate (%)",
                                data: rows.map((row) => row.bounceRate),
                                backgroundColor: "rgba(201, 203, 207, 0.6)",
                                borderColor: "rgba(201, 203, 207, 0.6)",
                            },
                        ],
                    }}
                />
            </div>

            <div className="tw-col-span-12 tw-h-[calc(100vh-14rem)]">
                <Line
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: "top" as const,
                            },
                            title: {
                                display: true,
                                text: "DoD Metrics",
                            },
                        },
                    }}
                    data={{
                        labels: rows.map((row) => row.date),
                        datasets: [
                            {
                                label: "sessions",
                                data: rows.map((row) => row.sessions),
                                backgroundColor: "rgba(255, 99, 132, 0.6)",
                                borderColor: "rgba(255, 99, 132, 0.6)",
                            },
                        ],
                    }}
                />
            </div>

            <div className="tw-col-span-12 tw-h-[calc(100vh-14rem)]">
                <Line
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: "top" as const,
                            },
                            title: {
                                display: true,
                                text: "DoD Metrics",
                            },
                        },
                    }}
                    data={{
                        labels: rows.map((row) => row.date),
                        datasets: [
                            {
                                label: "avgSessionDuration (s)",
                                data: rows.map((row) => row.avgSessionDuration),
                                backgroundColor: "rgba(54, 162, 235, 0.6)",
                                borderColor: "rgba(54, 162, 235, 0.6)",
                            },
                        ],
                    }}
                />
            </div>

            <div className="tw-col-span-12 tw-h-[calc(100vh-14rem)]">
                <DataTable
                    totalRows={totalRows}
                    rows={rows}
                    setRows={setRows}
                    rowsToInsert={rowsToInsert}
                    rowsToUpdate={rowsToUpdate}
                    rowsToDelete={rowsToDelete}
                    markRowAsUpdated={markRowAsUpdated}
                    className="tw-h-full"
                />
            </div>
        </div>
    );
}

function DataTable<T>({
    totalRows,
    rows,
    setRows,
    rowsToInsert,
    rowsToUpdate,
    rowsToDelete,
    markRowAsUpdated,
    className,
}: {
    totalRows: number;
    rows: Array<T>;
    setRows: React.Dispatch<Array<T>>;
    rowsToInsert: Array<Uuid>;
    rowsToUpdate: Array<Uuid>;
    rowsToDelete: Array<Uuid>;
    markRowAsUpdated: (row: T) => void;
    className?: string;
}) {
    // TODO: Generate columns from type T automatically
    // TODO: Convert border attributes to tailwind classes

    return (
        <table
            className={concatenateNonNullStringsWithSpaces("tw-w-full tw-overflow-auto tw-block", className)}
            style={{border: "1px solid white"}}
        >
            <thead className="tw-sticky tw-top-0 tw-bg-dark-bg-500">
                <tr>
                    {/* <th className="tw-px-4 tw-py-2" style={{border: "1px solid white"}} /> */}
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        <div className="tw-flex tw-flex-row tw-gap-x-4 tw-items-center tw-justify-center">
                            <div>date</div>
                            <TriangleFill className="tw-w-3 tw-h-3 tw-rotate-180" />
                        </div>
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        users
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        newUsers
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        bounceRate
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        sessions
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        avgSessionDuration
                    </th>
                </tr>
            </thead>

            <tbody>
                <ItemBuilder
                    items={rows}
                    itemBuilder={(row, rowIndex) => (
                        <tr
                            className={
                                rowsToInsert.includes(row.date)
                                    ? "tw-bg-green-600"
                                    : rowsToUpdate.includes(row.date)
                                    ? "tw-bg-yellow-600"
                                    : rowsToDelete.includes(row.date)
                                    ? "tw-bg-red-400"
                                    : undefined
                            }
                            key={rowIndex}
                        >
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.date}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.users}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.newUsers}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.bounceRate}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.sessions}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.avgSessionDuration}</div>
                            </td>
                        </tr>
                    )}
                />
            </tbody>
        </table>
    );
}

function isObject(input: unknown) {
    if (input != null && typeof input === "object") {
        return true;
    }

    return false;
}

const flattenObject = (obj = {}, res = {}, extraKey = "") => {
    for (const key in obj) {
        if (typeof obj[key] !== "object") {
            res[extraKey + key] = obj[key];
        } else {
            flattenObject(obj[key], res, `${extraKey}${key}.`);
        }
    }

    return res;
};

function TreeRepresentation({object}: {object: any}) {
    if (!isObject(object)) {
        return object;
    }

    return (
        <ItemBuilder
            items={Object.keys(object)}
            itemBuilder={(attribute, attributeIndex) => (
                <React.Fragment key={attributeIndex}>
                    <div className="tw-font-bold">{attribute}</div>

                    <div className="tw-pl-8">
                        <TreeRepresentation object={object[attribute]} />
                    </div>
                </React.Fragment>
            )}
            spaceBuilder={(spaceIndex) => (
                <div
                    className="tw-w-full tw-h-4"
                    key={spaceIndex}
                />
            )}
        />
    );
}
