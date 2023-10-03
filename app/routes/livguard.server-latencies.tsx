import type {LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import React, {useState} from "react";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {EmptyFlexFiller} from "~/global-common-typescript/components/emptyFlexFiller";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getNonEmptyStringFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {concatenateNonNullStringsWithSpaces} from "~/global-common-typescript/utilities/utilities";
import csvDownload from "json-to-csv-export";
import {TriangleFill} from "react-bootstrap-icons";
import {Bar} from "react-chartjs-2";
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Title, Tooltip} from "chart.js";

export type ServerLatency = {
    time: string;
    latency: null | number;
};

type LoaderData = {
    startDate: string;
    endDate: string;
    totalRows: number,
    serverLatencies: Array<ServerLatency>;
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

    // TODO: Generate this properly
    const serverLatencies: Array<ServerLatency> = [
        {
            time: "2023-06-09T17-00-00Z",
            latency: 40.82,
        },
        {
            time: "2023-06-08T17-00-00Z",
            latency: 25.87,
        },
        {
            time: "2023-06-07T17-00-00Z",
            latency: 69.94,
        },
        {
            time: "2023-06-06T17-00-00Z",
            latency: 73.33,
        },
        {
            time: "2023-06-05T17-00-00Z",
            latency: 84.97,
        },
        {
            time: "2023-06-04T17-00-00Z",
            latency: 33.3,
        },
        {
            time: "2023-06-03T17-00-00Z",
            latency: 42.73,
        },
        {
            time: "2023-06-02T17-00-00Z",
            latency: 47.75,
        },
        {
            time: "2023-06-01T17-00-00Z",
            latency: 42.93,
        },
        {
            time: "2023-05-31T17-00-00Z",
            latency: 65.07,
        },
        {
            time: "2023-05-30T17-00-00Z",
            latency: 52.9,
        },
        {
            time: "2023-05-29T17-00-00Z",
            latency: 55.12,
        },
        {
            time: "2023-05-28T17-00-00Z",
            latency: 55.43,
        },
        {
            time: "2023-05-27T17-00-00Z",
            latency: 79.1,
        },
        {
            time: "2023-05-26T17-00-00Z",
            latency: 63.65,
        },
        {
            time: "2023-05-25T17-00-00Z",
            latency: 44.93,
        },
        {
            time: "2023-05-24T17-00-00Z",
            latency: 68.97,
        },
        {
            time: "2023-05-23T17-00-00Z",
            latency: 35.23,
        },
        {
            time: "2023-05-22T17-00-00Z",
            latency: 17.52,
        },
        {
            time: "2023-05-21T17-00-00Z",
            latency: 34.47,
        },
        {
            time: "2023-05-20T17-00-00Z",
            latency: 52.22,
        },
        {
            time: "2023-05-19T17-00-00Z",
            latency: 19.18,
        },
    ].reverse();

    const loaderData: LoaderData = {
        startDate: startDate,
        endDate: endDate,
        totalRows: 22,
        serverLatencies: serverLatencies,
    };

    return json(loaderData);
};

export default function () {
    const {startDate: originalStartDate, endDate: originalEndDate, totalRows, serverLatencies} = useLoaderData() as LoaderData;

    const [rows, setRows] = useState(() => structuredClone(serverLatencies));

    const [rowsToInsert, setRowsToInsert] = useState<Array<Uuid>>([]);
    const [rowsToUpdate, setRowsToUpdate] = useState<Array<Uuid>>([]);
    const [rowsToDelete, setRowsToDelete] = useState<Array<Uuid>>([]);

    const [startDate, setStartDate] = useState(originalStartDate);
    const [endDate, setEndDate] = useState(originalEndDate);

    function markRowAsInserted(row: ServerLatency) {
        if (rowsToInsert.includes(row.time)) {
            return;
        }

        setRowsToInsert([...rowsToInsert, row.time]);
    }

    function markRowAsUpdated(row: ServerLatency) {
        if (rowsToInsert.includes(row.time) || rowsToUpdate.includes(row.time)) {
            return;
        }

        setRowsToUpdate([...rowsToUpdate, row.time]);
    }

    // chartjs graphs
    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center tw-relative">
                Server Latencies
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
                <Form
                    method="POST"
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
                </Form>
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
                    href={`/livguard/server-latencies?startDate=${startDate}&endDate=${endDate}`}
                    className="tw-top-4 tw-bottom-4 tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                >
                    Update
                </a>

                <EmptyFlexFiller />

                <div>
                    Total rows: {totalRows}
                </div>

                <button
                    type="button"
                    className="tw-top-4 tw-bottom-4 tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                    onClick={() => {
                        csvDownload({
                            data: rows.map((row) => flattenObject(row)),
                            delimiter: ",",
                            filename: "server-latencies.csv",
                        });
                    }}
                >
                    Export
                </button>
            </div>

            <div className="tw-col-span-12 tw-h-[calc(100vh-14rem)]">
                <Bar
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: "top",
                            },
                            title: {
                                display: true,
                                text: "Server latencies",
                            },
                        },
                    }}
                    data={{
                        labels: rows.map((row) => row.time),
                        datasets: [
                            {
                                label: "Latency",
                                data: rows.map((row) => row.latency),
                                backgroundColor: "rgba(75, 192, 192, 0.2)",
                                borderColor: "rgb(75, 192, 192)",
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
                            <div>
                                time
                            </div>
                            <TriangleFill className="tw-w-3 tw-h-3 tw-rotate-180" />
                        </div>
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        latency
                    </th>
                    {/* <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        updatedAt
                    </th> */}
                </tr>
            </thead>

            <tbody>
                <ItemBuilder
                    items={rows}
                    itemBuilder={(row, rowIndex) => (
                        <tr
                            className={
                                rowsToInsert.includes(row.time) ? "tw-bg-green-600" : rowsToUpdate.includes(row.time) ? "tw-bg-yellow-600" : rowsToDelete.includes(row.time) ? "tw-bg-red-400" : undefined
                            }
                            key={rowIndex}
                        >
                            {/* <td className="tw-p-d" style={{border: "1px solid white"}}>
                                <div className="tw-bg-primary-1 tw-rounded-full tw-w-8 tw-h-8" />
                            </td> */}
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.time}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.latency}</div>
                            </td>
                            {/* <td style={{border: "1px solid white"}}>
                                <input
                                    type="text"
                                    value={row.formResponse.name}
                                    onChange={(e) => {
                                        row.formResponse.name = e.target.value;
                                        markRowAsUpdated(row);
                                    }}
                                    className="tw-whitespace-nowrap tw-overflow-hidden tw-bg-transparent tw-px-4 tw-py-2"
                                    placeholder=""
                                />
                            </td> */}
                            {/* <td
                                style={{border: "1px solid white"}}
                                className="tw-px-4 tw-py-2"
                            >
                                <TreeRepresentation object={row.formResponse} />
                            </td> */}
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
