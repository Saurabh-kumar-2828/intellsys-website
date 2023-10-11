import type {LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Title, Tooltip} from "chart.js";
import csvDownload from "json-to-csv-export";
import React, {useState} from "react";
import {TriangleFill} from "react-bootstrap-icons";
import {Bar} from "react-chartjs-2";
import {getSearchQueriesWithInfo} from "~/backend/livguard.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {EmptyFlexFiller} from "~/global-common-typescript/components/emptyFlexFiller";
import type {Uuid} from "~/common--type-definitions/typeDefinitions";
import {getNonEmptyStringFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {concatenateNonNullStringsWithSpaces} from "~/global-common-typescript/utilities/utilities";

export type TermFrequency = {
    term: string;
    frequency: number;
};

type LoaderData = {
    startDate: string;
    endDate: string;
    totalRows: number;
    termFrequencies: Array<TermFrequency>;
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

    const searchQueriesWithInfo = await getSearchQueriesWithInfo(startDate, endDate, 999999, 0);
    if (searchQueriesWithInfo instanceof Error) {
        throw searchQueriesWithInfo;
    }

    // TODO: Something is still wrong since we are still seeing capitals here. Investigate.
    function processTermFrequencies(termFrequencies: Array<TermFrequency>): Array<TermFrequency> {
        const termFrequenciesMap = new Map<string, number>();
        for (let termFrequencyIndex = 0; termFrequencyIndex < termFrequencies.length; termFrequencyIndex++) {
            const termFrequency = termFrequencies[termFrequencyIndex];

            termFrequencies[termFrequencyIndex].term = termFrequency.term;
            termFrequenciesMap.set(termFrequency.term, termFrequency.frequency);
        }

        const processedTermFrequencies: Array<TermFrequency> = [];
        for (let termFrequenciesIndex = 0; termFrequenciesIndex < termFrequencies.length; termFrequenciesIndex++) {
            const termFrequency = termFrequencies[termFrequenciesIndex];

            processedTermFrequencies[termFrequenciesIndex] = {
                term: termFrequency.term,
                frequency:
                    termFrequency.frequency -
                    (termFrequenciesMap.get(`${termFrequency.term}a`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}b`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}c`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}d`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}e`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}f`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}g`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}h`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}i`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}j`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}k`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}l`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}m`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}n`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}o`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}p`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}q`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}r`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}s`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}t`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}u`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}v`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}w`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}x`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}y`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}z`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}0`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}1`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}2`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}3`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}4`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}5`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}6`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}7`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}8`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}9`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term} `) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}-`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term},`) ?? 0) -
                    (termFrequenciesMap.get(`${termFrequency.term}.`) ?? 0),
            };
        }
        return processedTermFrequencies.sort((a, b) => b.frequency - a.frequency);
    }

    const loaderData: LoaderData = {
        startDate: startDate,
        endDate: endDate,
        totalRows: searchQueriesWithInfo.nRows,
        termFrequencies: processTermFrequencies(searchQueriesWithInfo.rows),
    };

    return json(loaderData);
};

export default function () {
    const {startDate: originalStartDate, endDate: originalEndDate, totalRows, termFrequencies} = useLoaderData() as LoaderData;

    const [rows, setRows] = useState(() => structuredClone(termFrequencies));

    const [rowsToInsert, setRowsToInsert] = useState<Array<Uuid>>([]);
    const [rowsToUpdate, setRowsToUpdate] = useState<Array<Uuid>>([]);
    const [rowsToDelete, setRowsToDelete] = useState<Array<Uuid>>([]);

    const [startDate, setStartDate] = useState(originalStartDate);
    const [endDate, setEndDate] = useState(originalEndDate);

    function markRowAsInserted(row: TermFrequency) {
        if (rowsToInsert.includes(row.term)) {
            return;
        }

        setRowsToInsert([...rowsToInsert, row.term]);
    }

    function markRowAsUpdated(row: TermFrequency) {
        if (rowsToInsert.includes(row.term) || rowsToUpdate.includes(row.term)) {
            return;
        }

        setRowsToUpdate([...rowsToUpdate, row.term]);
    }

    // chartjs graphs
    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center tw-relative">
                Search Queries
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
                    href={`/livguard/search-queries?startDate=${startDate}&endDate=${endDate}`}
                    className="tw-top-4 tw-bottom-4 tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                >
                    Update
                </a>

                <EmptyFlexFiller />

                <div>Search Queries: {totalRows}</div>

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
                <Bar
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: "top",
                            },
                            title: {
                                display: true,
                                text: "Search term frequencies",
                            },
                        },
                    }}
                    data={{
                        labels: rows.slice(0, 20).map((row) => row.term),
                        datasets: [
                            {
                                label: "Frequency",
                                data: rows.slice(0, 20).map((row) => row.frequency),
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
                        term
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        <div className="tw-flex tw-flex-row tw-gap-x-4 tw-items-center tw-justify-center">
                            <div>frequency</div>
                            <TriangleFill className="tw-w-3 tw-h-3 tw-rotate-180" />
                        </div>
                    </th>
                </tr>
            </thead>

            <tbody>
                <ItemBuilder
                    items={rows}
                    itemBuilder={(row, rowIndex) => (
                        <tr
                            className={
                                rowsToInsert.includes(row.term)
                                    ? "tw-bg-green-600"
                                    : rowsToUpdate.includes(row.term)
                                    ? "tw-bg-yellow-600"
                                    : rowsToDelete.includes(row.term)
                                    ? "tw-bg-red-400"
                                    : undefined
                            }
                            key={rowIndex}
                        >
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.term}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.frequency}</div>
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
