import type {ActionFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {createFreshsalesLeadsRaw, doesTableExist, TablesAndViews} from "~/backend/table-management";

export const meta: MetaFunction = () => {
    return {
        title: "Table Management - Intellsys",
    };
};

export const action: ActionFunction = async ({request}) => {
    const body = await request.formData();

    const table = parseInt(body.get("table") as string) as TablesAndViews;
    const operation = parseInt(body.get("operation") as string) as Operation;

    if (operation == Operation.drop) {
        // await processFileUpload(table, file);
    } else if (operation == Operation.create) {
        if (table == TablesAndViews.freshsalesLeadsRaw) {
            createFreshsalesLeadsRaw();
        } else {
            throw new Response(null, {status: 400});
        }
        // await processDelete(table, startDate, endDate);
    } else {
        throw new Response(null, {status: 400});
    }

    return null;
};

type LoaderData = {
    // shopifySalesRawExists: boolean;
    freshsalesLeadsRawExists: boolean;
    // googleAdsRawExists: boolean;
    // facebookAdsRawExists: boolean;
    // websitePopupFormResponsesRawExists: boolean;
    // typeformResponsesMattressExists: boolean;
    // typeformResponsesWaterPurifierExists: boolean;
};

export const loader: LoaderFunction = async () => {
    const loaderData: LoaderData = {
        // facebookAdsRawExists: await doesTableExist(getNameForTable(Table.facebookAdsRaw)),
        freshsalesLeadsRawExists: await doesTableExist("freshsales_leads_raw"),
        // googleAdsRawExists: await doesTableExist(getNameForTable(Table.googleAdsRaw)),
        // shopifySalesRawExists: await doesTableExist(getNameForTable(Table.shopifySalesRaw)),
        // typeformResponsesMattressExists: await doesTableExist(getNameForTable(Table.typeformResponsesMattressRaw)),
        // typeformResponsesWaterPurifierExists: await doesTableExist(getNameForTable(Table.typeformResponsesWaterPurifierRaw)),
        // websitePopupFormResponsesRawExists: await doesTableExist(getNameForTable(Table.websitePopupFormResponsesRaw)),
    };

    return json(loaderData);
};

export default function () {
    const {
        // shopifySalesRawExists,
        freshsalesLeadsRawExists,
        // googleAdsRawExists,
        // facebookAdsRawExists,
        // websitePopupFormResponsesRawExists,
        // typeformResponsesMattressExists,
        // typeformResponsesWaterPurifierExists,
    } = useLoaderData() as LoaderData;

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            {freshsalesLeadsRawExists ? (
                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value="freshsales_leads_raw" readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.create} readOnly className="tw-hidden" />

                    <button className="tw-lp-button tw-bg-red-500 tw-text-white">Delete freshsales_leads_raw</button>
                </Form>
            ) : (
                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={TablesAndViews.freshsalesLeadsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.create} readOnly className="tw-hidden" />

                    <button className="tw-lp-button tw-bg-[#d3504e] tw-text-white">Create freshsales_leads_raw</button>
                </Form>
            )}
        </div>
    );
}

enum Operation {
    drop,
    create,
}
