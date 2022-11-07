import type {ActionFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {fullRefresh, processDelete, processFileUpload, processIngestDataFromApi, processTruncate, Table} from "~/backend/data-management";
import {
    get_facebookAdsRawDataInformation,
    get_freshsalesLeadsMattressRawDataInformation,
    get_freshsalesLeadsNonMattressRawDataInformation,
    get_freshsalesLeadsWaterPurifierRawDataInformation,
    get_googleAdsRawDataInformation,
    get_shopifySalesRawDataInformation,
    get_typeformResponsesMattressDataInformation,
    get_typeformResponsesWaterPurifierDataInformation,
    get_websitePopupFormResponsesRawDataInformation,
} from "~/backend/data-source-information";
import {Card} from "~/components/scratchpad";
import {dateToMediumEnFormat, numberToHumanFriendlyString} from "~/utilities/utilities";

export const meta: MetaFunction = () => {
    return {
        title: "Data Management - Livpure Data Management",
    };
};

export const action: ActionFunction = async ({request}) => {
    const body = await request.formData();

    const table = parseInt(body.get("table") as string) as Table;
    const operation = parseInt(body.get("operation") as string) as Operation;

    if (operation == Operation.upload) {
        const files = body.getAll("file");

        if (files.length == 0 || files.some((file) => !(file instanceof File))) {
            throw new Response(null, {status: 400});
        }

        for (const file_ of files) {
            const file = file_ as File;

            await processFileUpload(table, file);
        }
    } else if (operation == Operation.delete) {
        const startDate = body.get("startDate") as string;
        const endDate = body.get("endDate") as string;

        await processDelete(table, startDate, endDate);
    } else if (operation == Operation.truncate) {
        await processTruncate(table);
    } else if (operation == Operation.refresh) {
        await fullRefresh();
    } else if (operation == Operation.ingestDataFromApi) {
        const startDate = body.get("startDate") as string;

        // TODO: Remove null coalesce
        await processIngestDataFromApi(table, startDate ?? "1990-01-01T00:00:00Z");
    } else {
        throw new Response(null, {status: 400});
    }

    return null;
};

export const loader: LoaderFunction = async ({request}) => {
    return json({
        shopifySalesRawDataInformation: await get_shopifySalesRawDataInformation(),
        freshsalesLeadsMattressRawDataInformation: await get_freshsalesLeadsMattressRawDataInformation(),
        freshsalesLeadsNonMattressRawDataInformation: await get_freshsalesLeadsNonMattressRawDataInformation(),
        freshsalesLeadsWaterPurifierRawDataInformation: await get_freshsalesLeadsWaterPurifierRawDataInformation(),
        // TODO: Un-deprecate
        // freshsalesLeadsRawDataInformation: await get_freshsalesLeadsRawDataInformation(),
        googleAdsRawDataInformation: await get_googleAdsRawDataInformation(),
        facebookAdsRawDataInformation: await get_facebookAdsRawDataInformation(),
        websitePopupFormResponsesRawDataInformation: await get_websitePopupFormResponsesRawDataInformation(),
        typeformResponsesMattressDataInformation: await get_typeformResponsesMattressDataInformation(),
        typeformResponsesWaterPurifierDataInformation: await get_typeformResponsesWaterPurifierDataInformation(),
    });
};

export default function () {
    const {
        shopifySalesRawDataInformation,
        freshsalesLeadsMattressRawDataInformation,
        freshsalesLeadsNonMattressRawDataInformation,
        freshsalesLeadsWaterPurifierRawDataInformation,
        // TODO: Un-deprecate
        // freshsalesLeadsRawDataInformation,
        googleAdsRawDataInformation,
        facebookAdsRawDataInformation,
        websitePopupFormResponsesRawDataInformation,
        typeformResponsesMattressDataInformation,
        typeformResponsesWaterPurifierDataInformation,
    } = useLoaderData();

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            {/* Facebook Ads Raw */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Facebook Ads Raw</div>

                <Card information={numberToHumanFriendlyString(facebookAdsRawDataInformation.count)} label="Count" metaQuery={facebookAdsRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Card information={dateToMediumEnFormat(facebookAdsRawDataInformation.minDate)} label="Data Start" metaQuery={facebookAdsRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Card information={dateToMediumEnFormat(facebookAdsRawDataInformation.maxDate)} label="Data End" metaQuery={facebookAdsRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.facebookAdsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button">
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.facebookAdsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.facebookAdsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button">
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.facebookAdsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <button className="tw-lp-button" disabled>
                        Fetch Data From API
                    </button>
                </Form>
            </>


            {/* Freshsales Leads Mattress Raw */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Freshsales Leads Mattress Raw</div>

                <Card
                    information={numberToHumanFriendlyString(freshsalesLeadsMattressRawDataInformation.count)}
                    label="Count"
                    metaQuery={freshsalesLeadsMattressRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(freshsalesLeadsMattressRawDataInformation.minDate)}
                    label="Data Start"
                    metaQuery={freshsalesLeadsMattressRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(freshsalesLeadsMattressRawDataInformation.maxDate)}
                    label="Data End"
                    metaQuery={freshsalesLeadsMattressRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button">
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button">
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <input type="text" name="startDate" value={"2022-10-20T22:00:00Z"} readOnly className="tw-hidden" />
                    <button className="tw-lp-button">
                        Fetch Data From API
                    </button>
                </Form>
            </>

            {/* Freshsales Leads Non Mattress Raw */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Freshsales Leads Non Mattress Raw</div>

                <Card
                    information={numberToHumanFriendlyString(freshsalesLeadsNonMattressRawDataInformation.count)}
                    label="Count"
                    metaQuery={freshsalesLeadsNonMattressRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(freshsalesLeadsNonMattressRawDataInformation.minDate)}
                    label="Data Start"
                    metaQuery={freshsalesLeadsNonMattressRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(freshsalesLeadsNonMattressRawDataInformation.maxDate)}
                    label="Data End"
                    metaQuery={freshsalesLeadsNonMattressRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsNonMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button">
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsNonMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsNonMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button">
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsNonMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <input type="text" name="startDate" value={"2022-10-20T22:00:00Z"} readOnly className="tw-hidden" />
                    <button className="tw-lp-button">
                        Fetch Data From API
                    </button>
                </Form>
            </>

            {/* Freshsales Leads Water Purifier Raw */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Freshsales Leads Water Purifier Raw</div>

                <Card
                    information={numberToHumanFriendlyString(freshsalesLeadsWaterPurifierRawDataInformation.count)}
                    label="Count"
                    metaQuery={freshsalesLeadsWaterPurifierRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(freshsalesLeadsWaterPurifierRawDataInformation.minDate)}
                    label="Data Start"
                    metaQuery={freshsalesLeadsWaterPurifierRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(freshsalesLeadsWaterPurifierRawDataInformation.maxDate)}
                    label="Data End"
                    metaQuery={freshsalesLeadsWaterPurifierRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsWaterPurifierRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button">
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsWaterPurifierRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsWaterPurifierRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button">
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsWaterPurifierRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <input type="text" name="startDate" value={"2022-10-20T22:00:00Z"} readOnly className="tw-hidden" />
                    <button className="tw-lp-button">
                        Fetch Data From API
                    </button>
                </Form>
            </>

            {/* TODO: Un-deprecate */}
            {/* Freshsales Leads Raw */}
            {/* <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Freshsales Leads Raw</div>

                <Card
                    information={numberToHumanFriendlyString(freshsalesLeadsRawDataInformation.count)}
                    label="Count"
                    metaQuery={freshsalesLeadsRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(freshsalesLeadsRawDataInformation.minDate)}
                    label="Data Start"
                    metaQuery={freshsalesLeadsRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(freshsalesLeadsRawDataInformation.maxDate)}
                    label="Data End"
                    metaQuery={freshsalesLeadsRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button">
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button">
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.freshsalesLeadsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <input type="text" name="startDate" value={"2022-10-20T22:00:00Z"} readOnly className="tw-hidden" />
                    <button className="tw-lp-button">
                        Fetch Data From API
                    </button>
                </Form>
            </> */}

            {/* Google Ads Raw */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Google Ads Raw</div>

                <Card information={numberToHumanFriendlyString(googleAdsRawDataInformation.count)} label="Count" metaQuery={googleAdsRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Card information={dateToMediumEnFormat(googleAdsRawDataInformation.minDate)} label="Data Start" metaQuery={googleAdsRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Card information={dateToMediumEnFormat(googleAdsRawDataInformation.maxDate)} label="Data End" metaQuery={googleAdsRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.googleAdsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button">
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.googleAdsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.googleAdsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button">
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.googleAdsRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <button className="tw-lp-button" disabled>
                        Fetch Data From API
                    </button>
                </Form>
            </>

            {/* Shopify Sales Raw */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Shopify Sales Raw</div>

                <Card information={numberToHumanFriendlyString(shopifySalesRawDataInformation.count)} label="Count" metaQuery={shopifySalesRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Card information={dateToMediumEnFormat(shopifySalesRawDataInformation.minDate)} label="Data Start" metaQuery={shopifySalesRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Card information={dateToMediumEnFormat(shopifySalesRawDataInformation.maxDate)} label="Data End" metaQuery={shopifySalesRawDataInformation.metaQuery} className="tw-col-span-4" />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.shopifySalesRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button">
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.shopifySalesRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.shopifySalesRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button">
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.shopifySalesRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <button className="tw-lp-button" disabled>
                        Fetch Data From API
                    </button>
                </Form>
            </>

            {/* Typeform Responses Mattress Raw */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Typeform Responses Mattress Raw</div>

                <Card
                    information={numberToHumanFriendlyString(typeformResponsesMattressDataInformation.count)}
                    label="Count"
                    metaQuery={typeformResponsesMattressDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(typeformResponsesMattressDataInformation.minDate)}
                    label="Data Start"
                    metaQuery={typeformResponsesMattressDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(typeformResponsesMattressDataInformation.maxDate)}
                    label="Data End"
                    metaQuery={typeformResponsesMattressDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.typeformResponsesMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button" disabled>
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.typeformResponsesMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.typeformResponsesMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button" disabled>
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.typeformResponsesMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <button className="tw-lp-button">Fetch Data From API</button>
                </Form>
            </>

            {/* Typeform Responses Water Purifier Raw */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Typeform Responses Water Purifier Raw</div>

                <Card
                    information={numberToHumanFriendlyString(typeformResponsesWaterPurifierDataInformation.count)}
                    label="Count"
                    metaQuery={typeformResponsesWaterPurifierDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(typeformResponsesWaterPurifierDataInformation.minDate)}
                    label="Data Start"
                    metaQuery={typeformResponsesWaterPurifierDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(typeformResponsesWaterPurifierDataInformation.maxDate)}
                    label="Data End"
                    metaQuery={typeformResponsesWaterPurifierDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.typeformResponsesWaterPurifierRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button" disabled>
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.typeformResponsesWaterPurifierRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.typeformResponsesMattressRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button" disabled>
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.typeformResponsesWaterPurifierRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <button className="tw-lp-button">Fetch Data From API</button>
                </Form>
            </>

            {/* Website Popup Form Responses */}
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Website Popup Form Responses</div>

                <Card
                    information={numberToHumanFriendlyString(websitePopupFormResponsesRawDataInformation.count)}
                    label="Count"
                    metaQuery={websitePopupFormResponsesRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(websitePopupFormResponsesRawDataInformation.minDate)}
                    label="Data Start"
                    metaQuery={websitePopupFormResponsesRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Card
                    information={dateToMediumEnFormat(websitePopupFormResponsesRawDataInformation.maxDate)}
                    label="Data End"
                    metaQuery={websitePopupFormResponsesRawDataInformation.metaQuery}
                    className="tw-col-span-4"
                />

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.websitePopupFormResponsesRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.delete} readOnly className="tw-hidden" />

                    <input type="date" name="startDate" required />
                    <input type="date" name="endDate" defaultValue={new Date().toISOString().substring(0, 10)} required />

                    <button type="submit" className="tw-lp-button">
                        Delete Data For Selected Time Period
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.websitePopupFormResponsesRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.truncate} readOnly className="tw-hidden" />

                    <button type="submit" className="tw-lp-button" disabled>
                        Truncate All Data
                    </button>
                </Form>

                <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.websitePopupFormResponsesRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.upload} readOnly className="tw-hidden" />

                    <input type="file" name="file" multiple required />

                    <button type="submit" className="tw-lp-button">
                        Upload CSV
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.websitePopupFormResponsesRaw} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.ingestDataFromApi} readOnly className="tw-hidden" />
                    <button className="tw-lp-button" disabled>
                        Fetch Data From API
                    </button>
                </Form>

                <Form method="post" className="tw-col-span-12 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value="" readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.refresh} readOnly className="tw-hidden" />

                    <button className="tw-lp-button">Run Complete Data Refresh Pipeline</button>
                </Form>
            </>
        </div>
    );
}

enum Operation {
    upload,
    delete,
    truncate,
    refresh,
    ingestDataFromApi,
}
