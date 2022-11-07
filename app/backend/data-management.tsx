import * as csv from "csv-string";
var format = require("pg-format");
import {execute} from "~/backend/utilities/databaseManager.server";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";
import {ingestDataFromTypeformMattressApi, ingestDataFromTypeformWaterPurifierApi} from "~/backend/utilities/data-management/typeform.server";
import {googleAdsRawColumnInfos} from "~/backend/utilities/data-management/googleAds.server";
import {ingestDataFromShopifyApi, shopifyTableColumnInfos} from "~/backend/utilities/data-management/shopify.server";
import {websitePopupFormResponsesRawColumnInfos} from "~/backend/utilities/data-management/websitePopupFormResponses.server";
import {freshsalesColumnInfos, ingestDataFromFreshsalesApi} from "~/backend/utilities/data-management/freshsales.server";
import {facebookAdsRawColumnInfos} from "~/backend/utilities/data-management/facebookAds.server";

export async function fullRefresh(): Promise<void> {
    try {
        const query = `
                REFRESH MATERIALIZED VIEW shopify_sales;
                REFRESH MATERIALIZED VIEW shopify_sales_deduped_by_email;

                REFRESH MATERIALIZED VIEW freshsales_leads;
                REFRESH MATERIALIZED VIEW freshsales_leads_deduped_by_email;

                REFRESH MATERIALIZED VIEW website_popup_form_responses;
                REFRESH MATERIALIZED VIEW website_popup_form_responses_deduped_by_email;
                REFRESH MATERIALIZED VIEW website_popup_form_responses_deduped_by_email_with_utm;

                REFRESH MATERIALIZED VIEW typeform_responses;
                REFRESH MATERIALIZED VIEW typeform_responses_deduped_by_email;

                REFRESH MATERIALIZED VIEW facebook_ads;

                REFRESH MATERIALIZED VIEW google_ads;

                REFRESH MATERIALIZED VIEW source_to_information;

                REFRESH MATERIALIZED VIEW facebook_ads_with_information;

                REFRESH MATERIALIZED VIEW google_ads_with_information;

                REFRESH MATERIALIZED VIEW ads_with_information;

                REFRESH MATERIALIZED VIEW shopify_sales_to_possible_sources;
                REFRESH MATERIALIZED VIEW shopify_sales_to_source;
                REFRESH MATERIALIZED VIEW shopify_sales_to_source_with_information;

                REFRESH MATERIALIZED VIEW freshsales_leads_to_fb_source;
                REFRESH MATERIALIZED VIEW freshsales_leads_to_possible_sources;
                REFRESH MATERIALIZED VIEW freshsales_leads_to_source;
                REFRESH MATERIALIZED VIEW freshsales_leads_to_source_with_information;
            `;

        await execute(query);
    } catch (e) {
        console.log("Error executing function");
        console.log(e);
        console.trace();
    }
}

export async function insertIntoTable(tableName: string, tableColumns: Array<string>, rows: Array<Array<string>>): Promise<void> {
    try {
        const maxRowsPerQuery = 500;

        for (let i = 0; i < rows.length; i += maxRowsPerQuery) {
            const rowsSubset = rows.slice(i, i + maxRowsPerQuery);

            const query = format(
                `
                    INSERT INTO ${tableName}
                        (${tableColumns.join(", ")})
                    VALUES
                        %L
                `,
                rowsSubset
            );

            await execute(query);
        }
    } catch (e) {
        console.log("Error executing function");
        console.log(e);
        console.trace();
    }
}

async function deleteDataFromTable(tableName: string, dateColumn: string, startDate: string, endDate: string): Promise<void> {
    try {
        const query = `DELETE FROM ${tableName} WHERE ${dateColumn} >= $1 AND ${dateColumn} <= $2`;

        await execute(query, [startDate, endDate]);
    } catch (e) {
        console.log("Error executing function");
        console.log(e);
        console.trace();
    }
}

async function truncateTable(tableName: string): Promise<void> {
    try {
        const query = `DELETE FROM ${tableName}`;

        await execute(query);
    } catch (e) {
        console.log("Error executing function");
        console.log(e);
        console.trace();
    }
}

export enum Table {
    facebookAdsRaw,
    freshsalesLeadsRaw,
    googleAdsRaw,
    shopifySalesRaw,
    typeformResponsesMattressRaw,
    typeformResponsesWaterPurifierRaw,
    websitePopupFormResponsesRaw,
}

export enum Operation {
    upload,
    delete,
    truncate,
    refresh,
    ingestDataFromApi,
}

export async function processFileUpload(table: Table, file: File): Promise<void> {
    const fileContents = await file.text();
    const rowObjects = csv.parse(fileContents, {output: "objects"});

    if (rowObjects.length == 0) {
        console.log("processFileUpload: File empty");
        throw new Response(null, {status: 400});
    }

    if (table == Table.facebookAdsRaw) {
        await insertIntoTableWrapper("facebook_ads_raw", facebookAdsRawColumnInfos, rowObjects);
    } else if (table == Table.freshsalesLeadsRaw) {
        await insertIntoTableWrapper("freshsales_leads_raw", freshsalesColumnInfos, rowObjects);
    } else if (table == Table.googleAdsRaw) {
        await insertIntoTableWrapper("google_ads_raw", googleAdsRawColumnInfos, rowObjects);
    } else if (table == Table.shopifySalesRaw) {
        await insertIntoTableWrapper("shopify_sales_raw", shopifyTableColumnInfos, rowObjects);
        // } else if (table == Table.typeformResponsesMattressRaw) {
        //     await insertIntoTableWrapper("typeform_responses_mattress_raw", typeformRawColumnInfos, rowObjects);
        // } else if (table == Table.typeformResponsesWaterPurifierRaw) {
        //     await insertIntoTableWrapper("typeform_responses_water_purifier_raw", typeformRawColumnInfos, rowObjects);
    } else if (table == Table.websitePopupFormResponsesRaw) {
        await insertIntoTableWrapper("website_popup_form_responses_raw", websitePopupFormResponsesRawColumnInfos, rowObjects);
    } else {
        console.log("processFileUpload: invalid table");
        throw new Response(null, {status: 400});
    }
}

async function insertIntoTableWrapper(tableName: string, columnInfos: Array<ColumnInfo>, rowObjects): Promise<void> {
    const rows = convertObjectArrayIntoArrayArray(
        rowObjects,
        columnInfos.map((columnInfo) => columnInfo.csvColumn)
    );

    await insertIntoTable(
        tableName,
        columnInfos.map((columnInfo) => columnInfo.tableColumn),
        rows
    );
}

export async function processDelete(table: Table, startDate: string, endDate: string): Promise<void> {
    if (table == Table.facebookAdsRaw) {
        await deleteDataFromTable("facebook_ads_raw", "day", startDate, endDate);
    } else if (table == Table.freshsalesLeadsRaw) {
        await deleteDataFromTable("freshsales_leads_raw", "DATE(lead_created_at)", startDate, endDate);
    } else if (table == Table.googleAdsRaw) {
        await deleteDataFromTable("google_ads_raw", "day", startDate, endDate);
    } else if (table == Table.shopifySalesRaw) {
        await deleteDataFromTable("shopify_sales_raw", "DATE(hour)", startDate, endDate);
    } else if (table == Table.typeformResponsesMattressRaw) {
        await truncateTable("typeform_responses_mattress_raw");
    } else if (table == Table.typeformResponsesWaterPurifierRaw) {
        await truncateTable("typeform_responses_water_purifier_raw");
    } else if (table == Table.websitePopupFormResponsesRaw) {
        await deleteDataFromTable("shopify_sales_raw", "DATE(timestamp)", startDate, endDate);
    } else {
        throw new Response(null, {status: 400});
    }
}

export async function processTruncate(table: Table): Promise<void> {
    if (table == Table.facebookAdsRaw) {
        await truncateTable("facebook_ads_raw");
    } else if (table == Table.freshsalesLeadsRaw) {
        await truncateTable("freshsales_leads_raw");
    } else if (table == Table.googleAdsRaw) {
        await truncateTable("google_ads_raw");
    } else if (table == Table.shopifySalesRaw) {
        await truncateTable("shopify_sales_raw");
    } else if (table == Table.typeformResponsesMattressRaw) {
        await truncateTable("typeform_responses_mattress_raw");
    } else if (table == Table.typeformResponsesWaterPurifierRaw) {
        await truncateTable("typeform_responses_water_purifier_raw");
    } else if (table == Table.websitePopupFormResponsesRaw) {
        await truncateTable("website_popup_form_responses_raw");
    } else {
        throw new Response(null, {status: 400});
    }
}

export async function processIngestDataFromApi(table: Table, date: string): Promise<void> {
    // if (table == Table.facebookAdsRaw) {
    //     await truncateTable("facebook_ads_raw");
    if (table == Table.freshsalesLeadsRaw) {
        await ingestDataFromFreshsalesApi(date);
        // } else if (table == Table.freshsalesLeadsNonMattressRaw) {
        //     await truncateTable("freshsales_leads_non_mattress_raw");
        // } else if (table == Table.freshsalesLeadsWaterPurifierRaw) {
        //     await truncateTable("freshsales_leads_water_purifier_raw");
        // } else if (table == Table.googleAdsRaw) {
        //     await truncateTable("google_ads_raw");
        // } else if (table == Table.shopifySalesRaw) {
        //     await truncateTable("shopify_sales_raw");
    } else if (table == Table.shopifySalesRaw) {
        await ingestDataFromShopifyApi(date);
    }else if (table == Table.typeformResponsesMattressRaw) {
        await ingestDataFromTypeformMattressApi(date);
    } else if (table == Table.typeformResponsesWaterPurifierRaw) {
        await ingestDataFromTypeformWaterPurifierApi(date);
        // } else if (table == Table.websitePopupFormResponsesRaw) {
        // await truncateTable("website_popup_form_responses_raw");
    } else {
        throw new Response(null, {status: 400});
    }
}

function convertObjectArrayIntoArrayArray(rowObjects: Array<{[k: string]: string}>, columns: Array<string>) {
    const headers = Object.keys(rowObjects[0]);

    for (const column of columns) {
        if (!headers.includes(column)) {
            console.log(`convertObjectArrayIntoArrayArray: column ${column} not found`);
            throw new Response(null, {status: 400});
        }
    }

    return rowObjects.map((rowObject) => columns.map((column) => getNonEmptyStringOrNull(rowObject[column].trim())));
}

export type ColumnInfo = {
    tableColumn: string;
    csvColumn: string;
};
