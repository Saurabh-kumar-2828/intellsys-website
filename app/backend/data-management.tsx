// import * as csv from "csv-string";
// var format = require("pg-format");
// import {execute} from "~/backend/utilities/databaseManager.server";
// import {getNonEmptyStringOrNull} from "~/utilities/utilities";
// import {ingestDataFromTypeformMattressApi, ingestDataFromTypeformWaterPurifierApi} from "~/backend/utilities/data-management/typeform.server";
// import {googleAdsRawColumnInfos} from "~/backend/utilities/data-management/googleAds.server";
// import {ingestDataFromShopifyApi, shopifyTableColumnInfos} from "~/backend/utilities/data-management/shopify.server";
// import {websitePopupFormResponsesRawColumnInfos} from "~/backend/utilities/data-management/websitePopupFormResponses.server";
// import {freshsalesColumnInfos, ingestDataFromFreshsalesApi} from "~/backend/utilities/data-management/freshsales.server";
// import {facebookAdsRawColumnInfos, ingestDataFromFacebookApi} from "~/backend/utilities/data-management/facebookAds.server";
// import {ingestDataFromGoogleAnalyticsApi} from "~/backend/utilities/data-management/googleAnalytics.server";

// export async function fullRefresh(): Promise<void> {
//     const query = `
//                 REFRESH MATERIALIZED VIEW shopify_sales;
//                 REFRESH MATERIALIZED VIEW shopify_sales_deduped_by_email;

//                 REFRESH MATERIALIZED VIEW freshsales_leads;
//                 REFRESH MATERIALIZED VIEW freshsales_leads_deduped_by_email;

//                 REFRESH MATERIALIZED VIEW website_popup_form_responses;
//                 REFRESH MATERIALIZED VIEW website_popup_form_responses_deduped_by_email;
//                 REFRESH MATERIALIZED VIEW website_popup_form_responses_deduped_by_email_with_utm;

//                 REFRESH MATERIALIZED VIEW typeform_responses;
//                 REFRESH MATERIALIZED VIEW typeform_responses_deduped_by_email;

//                 REFRESH MATERIALIZED VIEW facebook_ads;

//                 REFRESH MATERIALIZED VIEW google_ads;

//                 REFRESH MATERIALIZED VIEW captured_utm_campaign_library;

//                 REFRESH MATERIALIZED VIEW facebook_ads_with_information;

//                 REFRESH MATERIALIZED VIEW google_ads_with_information;

//                 REFRESH MATERIALIZED VIEW ads_with_information;

//                 REFRESH MATERIALIZED VIEW shopify_sales_to_source;
//                 REFRESH MATERIALIZED VIEW shopify_sales_to_source_with_information;

//                 REFRESH MATERIALIZED VIEW freshsales_leads_to_source;
//                 REFRESH MATERIALIZED VIEW freshsales_leads_to_source_with_information;
//             `;

//     await execute(null, query);
// }

// export async function insertIntoTable(tableName: string, tableColumns: Array<string>, rows: Array<Array<string>>, companyId: string): Promise<void> {
//     const maxRowsPerQuery = 500;

//     for (let i = 0; i < rows.length; i += maxRowsPerQuery) {
//         const rowsSubset = rows.slice(i, i + maxRowsPerQuery);

//         const query = format(
//             `
//                     INSERT INTO ${tableName}
//                         (${tableColumns.join(", ")})
//                     VALUES
//                         %L
//                 `,
//             rowsSubset
//         );

//         await execute(companyId, query);
//     }
// }

// async function deleteDataFromTable(tableName: string, dateColumn: string, startDate: string, endDate: string, companyId: string): Promise<void> {
//     const query = `DELETE FROM ${tableName} WHERE ${dateColumn} >= $1 AND ${dateColumn} <= $2`;

//     await execute(companyId, query, [startDate, endDate]);
// }

// async function truncateTable(tableName: string, companyId: string): Promise<void> {
//     const query = `DELETE FROM ${tableName}`;

//     await execute(companyId, query);
// }

// export enum Table {
//     facebookAdsRaw,
//     // TODO: Deprecate
//     freshsalesLeadsMattressRaw,
//     // TODO: Deprecate
//     freshsalesLeadsNonMattressRaw,
//     // TODO: Deprecate
//     freshsalesLeadsWaterPurifierRaw,
//     // TODO: Un-deprecate
//     // freshsalesLeadsRaw,
//     googleAdsRaw,
//     shopifySalesRaw,
//     typeformResponsesMattressRaw,
//     typeformResponsesWaterPurifierRaw,
//     websitePopupFormResponsesRaw,

//     //TODO: For test purpose, remove it
//     googleAnalyticsApi,
//     facebookOnFormApi,
// }

// // export function getNameForTable(table: Table): string {
// //     if (table == Table.facebookAdsRaw) {
// //         return "facebook_ads_raw";
// //     } else if (table == Table.freshsalesLeadsRaw) {
// //         return "freshsales_leads_raw";
// //     } else if (table == Table.googleAdsRaw) {
// //         return "google_ads_raw";
// //     } else if (table == Table.shopifySalesRaw) {
// //         return "shopify_sales_raw";
// //     } else if (table == Table.typeformResponsesMattressRaw) {
// //         return "typeform_responses_mattress_raw";
// //     } else if (table == Table.typeformResponsesWaterPurifierRaw) {
// //         return "typeform_responses_water_purifier_raw";
// //     } else if (table == Table.websitePopupFormResponsesRaw) {
// //         return "website_popup_form_responses_raw";
// //     } else {
// //         throw new Response(null, {status: 400});
// //     }
// // }

// export async function processFileUpload(table: Table, file: File, companyId: string): Promise<void> {
//     const fileContents = await file.text();
//     const rowObjects = csv.parse(fileContents, {output: "objects"});

//     if (rowObjects.length == 0) {
//         console.log("processFileUpload: File empty");
//         throw new Response(null, {status: 400});
//     }

//     if (table == Table.facebookAdsRaw) {
//         await insertIntoTableWrapper("facebook_ads_raw", facebookAdsRawColumnInfos, rowObjects, companyId);
//     } else if (table == Table.freshsalesLeadsMattressRaw) {
//         await insertIntoTableWrapper("freshsales_leads_mattress_raw", freshsalesColumnInfos, rowObjects, companyId);
//     } else if (table == Table.freshsalesLeadsNonMattressRaw) {
//         await insertIntoTableWrapper("freshsales_leads_non_mattress_raw", freshsalesColumnInfos, rowObjects, companyId);
//     } else if (table == Table.freshsalesLeadsWaterPurifierRaw) {
//         await insertIntoTableWrapper("freshsales_leads_water_purifier_raw", freshsalesColumnInfos, rowObjects, companyId);
//         // TODO: Un-deprecate
//         // } else if (table == Table.freshsalesLeadsRaw) {
//         //     await insertIntoTableWrapper("freshsales_leads_raw", freshsalesColumnInfos, rowObjects);
//     } else if (table == Table.googleAdsRaw) {
//         await insertIntoTableWrapper("google_ads_raw", googleAdsRawColumnInfos, rowObjects, companyId);
//     } else if (table == Table.shopifySalesRaw) {
//         await insertIntoTableWrapper("shopify_sales_raw", shopifyTableColumnInfos, rowObjects, companyId);
//         // } else if (table == Table.typeformResponsesMattressRaw) {
//         //     await insertIntoTableWrapper("typeform_responses_mattress_raw", typeformRawColumnInfos, rowObjects);
//         // } else if (table == Table.typeformResponsesWaterPurifierRaw) {
//         //     await insertIntoTableWrapper("typeform_responses_water_purifier_raw", typeformRawColumnInfos, rowObjects);
//     } else if (table == Table.websitePopupFormResponsesRaw) {
//         await insertIntoTableWrapper("website_popup_form_responses_raw", websitePopupFormResponsesRawColumnInfos, rowObjects, companyId);
//     } else {
//         console.log("processFileUpload: invalid table");
//         throw new Response(null, {status: 400});
//     }
// }

// async function insertIntoTableWrapper(tableName: string, columnInfos: Array<ColumnInfo>, rowObjects, companyId: string): Promise<void> {
//     const rows = convertObjectArrayIntoArrayArray(
//         rowObjects,
//         columnInfos.map((columnInfo) => columnInfo.csvColumn)
//     );

//     await insertIntoTable(
//         tableName,
//         columnInfos.map((columnInfo) => columnInfo.tableColumn),
//         rows,
//         companyId
//     );
// }

// export async function processDelete(table: Table, startDate: string, endDate: string, companyId: string): Promise<void> {
//     if (table == Table.facebookAdsRaw) {
//         await deleteDataFromTable("facebook_ads_raw", "day", startDate, endDate, companyId);
//     } else if (table == Table.freshsalesLeadsMattressRaw) {
//         await deleteDataFromTable("freshsales_leads_mattress_raw", "DATE(lead_created_at)", startDate, endDate, companyId);
//     } else if (table == Table.freshsalesLeadsNonMattressRaw) {
//         await deleteDataFromTable("freshsales_leads_non_mattress_raw", "DATE(lead_created_at)", startDate, endDate, companyId);
//     } else if (table == Table.freshsalesLeadsWaterPurifierRaw) {
//         await deleteDataFromTable("freshsales_leads_water_purifier_raw", "DATE(lead_created_at)", startDate, endDate, companyId);
//         // TODO: Un-deprecate
//         // } else if (table == Table.freshsalesLeadsRaw) {
//         //     await deleteDataFromTable("freshsales_leads_raw", "DATE(lead_created_at)", startDate, endDate);
//     } else if (table == Table.googleAdsRaw) {
//         await deleteDataFromTable("google_ads_raw", "day", startDate, endDate, companyId);
//     } else if (table == Table.shopifySalesRaw) {
//         await deleteDataFromTable("shopify_sales_raw", "DATE(hour)", startDate, endDate, companyId);
//     } else if (table == Table.typeformResponsesMattressRaw) {
//         await truncateTable("typeform_responses_mattress_raw", companyId);
//     } else if (table == Table.typeformResponsesWaterPurifierRaw) {
//         await truncateTable("typeform_responses_water_purifier_raw", companyId);
//     } else if (table == Table.websitePopupFormResponsesRaw) {
//         await deleteDataFromTable("shopify_sales_raw", "DATE(timestamp)", startDate, endDate, companyId);
//     } else {
//         throw new Response(null, {status: 400});
//     }
// }

// export async function processTruncate(table: Table, companyId: string): Promise<void> {
//     if (table == Table.facebookAdsRaw) {
//         await truncateTable("facebook_ads_raw", companyId);
//     } else if (table == Table.freshsalesLeadsMattressRaw) {
//         await truncateTable("freshsales_leads_mattress_raw", companyId);
//     } else if (table == Table.freshsalesLeadsNonMattressRaw) {
//         await truncateTable("freshsales_leads_non_mattress_raw", companyId);
//     } else if (table == Table.freshsalesLeadsWaterPurifierRaw) {
//         await truncateTable("freshsales_leads_water_purifier_raw", companyId);
//         // TODO: Un-deprecate
//         // } else if (table == Table.freshsalesLeadsRaw) {
//         //     await truncateTable("freshsales_leads_raw");
//     } else if (table == Table.googleAdsRaw) {
//         await truncateTable("google_ads_raw", companyId);
//     } else if (table == Table.shopifySalesRaw) {
//         await truncateTable("shopify_sales_raw", companyId);
//     } else if (table == Table.typeformResponsesMattressRaw, companyId) {
//         await truncateTable("typeform_responses_mattress_raw", companyId);
//     } else if (table == Table.typeformResponsesWaterPurifierRaw) {
//         await truncateTable("typeform_responses_water_purifier_raw", companyId);
//     } else if (table == Table.websitePopupFormResponsesRaw) {
//         await truncateTable("website_popup_form_responses_raw", companyId);
//     } else {
//         throw new Response(null, {status: 400});
//     }
// }

// export async function processIngestDataFromApi(table: Table, date: string): Promise<void> {
//     if (table == Table.facebookAdsRaw) {
//         await ingestDataFromFacebookApi(date);
//         // TODO: Un-deprecate
//         // if (table == Table.freshsalesLeadsRaw) {
//         //     await ingestDataFromFreshsalesApi(date);
//         // } else if (table == Table.googleAdsRaw) {
//         //     await truncateTable("google_ads_raw");
//     } else if (table == Table.shopifySalesRaw) {
//         await ingestDataFromShopifyApi(date);
//     } else if (table == Table.typeformResponsesMattressRaw) {
//         await ingestDataFromTypeformMattressApi(date);
//     } else if (table == Table.typeformResponsesWaterPurifierRaw) {
//         await ingestDataFromTypeformWaterPurifierApi(date);
//         // } else if (table == Table.websitePopupFormResponsesRaw) {
//         //     await truncateTable("website_popup_form_responses_raw");
//     } else if (table == Table.googleAnalyticsApi) {
//         await ingestDataFromGoogleAnalyticsApi("2022-12-12", "2022-12-25");
//     } else {
//         throw new Response(null, {status: 400});
//     }
// }

// function convertObjectArrayIntoArrayArray(rowObjects: Array<{[k: string]: string}>, columns: Array<string>) {
//     const headers = Object.keys(rowObjects[0]);

//     for (const column of columns) {
//         if (!headers.includes(column)) {
//             console.log(`convertObjectArrayIntoArrayArray: column ${column} not found`);
//             throw new Error(`convertObjectArrayIntoArrayArray: column ${column} not found`);
//         }
//     }

//     return rowObjects.map((rowObject) => columns.map((column) => getNonEmptyStringOrNull(rowObject[column].trim())));
// }

// export async function processInitializeDataFromApi(table: Table, date: string): Promise<void> {
//     if (table == Table.facebookOnFormApi) {
//         // await initializeDataFromFacebookOnFormsApi("2022-10-01", "2022-11-01");
//         // await updateDataFromFacebookOnFormsApi();
//     } else {
//         throw new Response(null, {status: 400});
//     }
// }

// export type ColumnInfo = {
//     tableColumn: string;
//     csvColumn: string;
// };
