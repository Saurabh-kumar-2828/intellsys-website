import type {LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import React, {useState} from "react";
import {getContactUsLeadsWithInfo} from "~/backend/livguard.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {EmptyFlexFiller} from "~/global-common-typescript/components/emptyFlexFiller";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getNonEmptyStringFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {concatenateNonNullStringsWithSpaces} from "~/global-common-typescript/utilities/utilities";
import csvDownload from "json-to-csv-export";
import {TriangleFill} from "react-bootstrap-icons";

export type ContactUsLead = {
    id: Uuid;
    createdAt: Uuid;
    updatedAt: Uuid;
    formResponse: any;
};

type LoaderData = {
    startDate: string;
    endDate: string;
    totalRows: number;
    contactUsLeads: Array<ContactUsLead>;
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

    const contactUsLeadsWithInfo = await getContactUsLeadsWithInfo(startDate, endDate, 999999, 0);
    if (contactUsLeadsWithInfo instanceof Error) {
        throw contactUsLeadsWithInfo;
    }

    const loaderData: LoaderData = {
        startDate: startDate,
        endDate: endDate,
        totalRows: contactUsLeadsWithInfo.nRows,
        contactUsLeads: contactUsLeadsWithInfo.rows,
    };

    return json(loaderData);
};

export default function () {
    const {startDate: originalStartDate, endDate: originalEndDate, totalRows, contactUsLeads} = useLoaderData() as LoaderData;

    const [rows, setRows] = useState(() => structuredClone(contactUsLeads));

    const [rowsToInsert, setRowsToInsert] = useState<Array<Uuid>>([]);
    const [rowsToUpdate, setRowsToUpdate] = useState<Array<Uuid>>([]);
    const [rowsToDelete, setRowsToDelete] = useState<Array<Uuid>>([]);

    const [startDate, setStartDate] = useState(originalStartDate);
    const [endDate, setEndDate] = useState(originalEndDate);

    function markRowAsInserted(row: ContactUsLead) {
        if (rowsToInsert.includes(row.id)) {
            return;
        }

        setRowsToInsert([...rowsToInsert, row.id]);
    }

    function markRowAsUpdated(row: ContactUsLead) {
        if (rowsToInsert.includes(row.id) || rowsToUpdate.includes(row.id)) {
            return;
        }

        setRowsToUpdate([...rowsToUpdate, row.id]);
    }

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center tw-relative">
                Contact Us Leads
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
                    href={`/livguard/contact-us-leads?startDate=${startDate}&endDate=${endDate}`}
                    className="tw-top-4 tw-bottom-4 tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                >
                    Update
                </a>

                <EmptyFlexFiller />

                <div>
                    Total leads: {totalRows}
                </div>

                <button
                    type="button"
                    className="tw-top-4 tw-bottom-4 tw-px-8 tw-py-2 tw-bg-primary disabled:tw-bg-slate-700 tw-text-white disabled:tw-text-[#888888] tw-text-[1rem] tw-rounded-full"
                    onClick={() => {
                        csvDownload({
                            data: rows.map((row) => flattenObject(row)),
                            delimiter: ",",
                            filename: "contact-us-leads.csv",
                        });
                    }}
                >
                    Export
                </button>
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
                        id
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        <div className="tw-flex tw-flex-row tw-gap-x-4 tw-items-center tw-justify-center">
                            <div>
                                createdAt
                            </div>
                            <TriangleFill className="tw-w-3 tw-h-3 tw-rotate-180" />
                        </div>
                    </th>
                    {/* <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        updatedAt
                    </th> */}
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        name
                    </th>
                    <th
                        className="tw-px-4 tw-py-2"
                        style={{outline: "1px solid white"}}
                    >
                        formResponse
                    </th>
                </tr>
            </thead>

            <tbody>
                <ItemBuilder
                    items={rows}
                    itemBuilder={(row, rowIndex) => (
                        <tr
                            className={
                                rowsToInsert.includes(row.id) ? "tw-bg-green-600" : rowsToUpdate.includes(row.id) ? "tw-bg-yellow-600" : rowsToDelete.includes(row.id) ? "tw-bg-red-400" : undefined
                            }
                            key={rowIndex}
                        >
                            {/* <td className="tw-p-d" style={{border: "1px solid white"}}>
                                <div className="tw-bg-primary-1 tw-rounded-full tw-w-8 tw-h-8" />
                            </td> */}
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.id}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
                                {/* <EditableTextField object={location} property="id" onChangeCallback={() => markLocationAsUpdated(location)} className="tw-whitespace-nowrap tw-overflow-hidden" placeholder="" /> */}
                                <div className="tw-px-4 tw-py-2 tw-whitespace-nowrap tw-overflow-hidden">{row.createdAt}</div>
                            </td>
                            <td style={{border: "1px solid white"}}>
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
                            </td>
                            <td
                                style={{border: "1px solid white"}}
                                className="tw-px-4 tw-py-2"
                            >
                                <TreeRepresentation object={row.formResponse} />
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
