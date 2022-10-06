var format = require('pg-format');
import * as csv from "csv-string";
import {execute} from "~/backend/utilities/databaseManager.server";
import { getNonEmptyStringOrNull } from "~/utilities/utilities";

export async function fullRefresh(): Promise<void> {
    try {
        const query = (
            `
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
            `
        );

        await execute(query);
    } catch (e) {
        console.log("Error executing function");
        console.log(e);
        console.trace();
    }
}

async function insertIntoTable(tableName: string, tableColumns: Array<string>, rows: Array<Array<string>>): Promise<void> {
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
    freshsalesLeadsMattressRaw,
    freshsalesLeadsNonMattressRaw,
    freshsalesLeadsWaterPurifierRaw,
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
    } else if (table == Table.freshsalesLeadsMattressRaw) {
        await insertIntoTableWrapper("freshsales_leads_mattress_raw", freshsalesColumnInfos, rowObjects);
    } else if (table == Table.freshsalesLeadsNonMattressRaw) {
        await insertIntoTableWrapper("freshsales_leads_non_mattress_raw", freshsalesColumnInfos, rowObjects);
    } else if (table == Table.freshsalesLeadsWaterPurifierRaw) {
        await insertIntoTableWrapper("freshsales_leads_water_purifier_raw", freshsalesColumnInfos, rowObjects);
    } else if (table == Table.googleAdsRaw) {
        await insertIntoTableWrapper("google_ads_raw", googleAdsRawColumnInfos, rowObjects);
    } else if (table == Table.shopifySalesRaw) {
        await insertIntoTableWrapper("shopify_sales_raw", shopifyTableColumnInfos, rowObjects);
    } else if (table == Table.typeformResponsesMattressRaw) {
        await insertIntoTableWrapper("typeform_responses_mattress_raw", typeformRawColumnInfos, rowObjects);
    } else if (table == Table.typeformResponsesWaterPurifierRaw) {
        await insertIntoTableWrapper("typeform_responses_water_purifier_raw", typeformRawColumnInfos, rowObjects);
    } else if (table == Table.websitePopupFormResponsesRaw) {
        await insertIntoTableWrapper("website_popup_form_responses_raw", websitePopupFormResponsesRawColumnInfos, rowObjects);
    } else {
        console.log("processFileUpload: invalid table");
        throw new Response(null, {status: 400});
    }
}

async function insertIntoTableWrapper(tableName: string, columnInfos, rowObjects): Promise<void> {
    const rows = convertObjectArrayIntoArrayArray(rowObjects, columnInfos.map(columnInfo => columnInfo.csvColumn));

    await insertIntoTable(
        tableName,
        columnInfos.map(columnInfo => columnInfo.tableColumn),
        rows,
    );
}

export async function processDelete(table: Table, startDate: string, endDate: string): Promise<void> {
    if (table == Table.facebookAdsRaw) {
        await deleteDataFromTable("facebook_ads_raw", "day", startDate, endDate);
    } else if (table == Table.freshsalesLeadsMattressRaw) {
        await deleteDataFromTable("freshsales_leads_mattress_raw", "DATE(lead_created_at)", startDate, endDate);
    } else if (table == Table.freshsalesLeadsNonMattressRaw) {
        await deleteDataFromTable("freshsales_leads_non_mattress_raw", "DATE(lead_created_at)", startDate, endDate);
    } else if (table == Table.freshsalesLeadsWaterPurifierRaw) {
        await deleteDataFromTable("freshsales_leads_water_purifier_raw", "DATE(lead_created_at)", startDate, endDate);
    } else if (table == Table.googleAdsRaw) {
        await deleteDataFromTable("google_ads_raw", "day", startDate, endDate);
    } else if (table == Table.shopifySalesRaw) {
        await deleteDataFromTable("shopify_sales_raw", "DATE(hour)", startDate, endDate);
    // } else if (table == Table.typeformResponsesMattressRaw) {
    //     await truncateTable("typeform_responses_mattress_raw");
    // } else if (table == Table.typeformResponsesWaterPurifierRaw) {
    //     await truncateTable("typeform_responses_water_purifier_raw");
    } else if (table == Table.websitePopupFormResponsesRaw) {
        await deleteDataFromTable("shopify_sales_raw", "DATE(timestamp)", startDate, endDate);
    } else {
        throw new Response(null, {status: 400});
    }
}

export async function processTruncate(table: Table): Promise<void> {
    if (table == Table.facebookAdsRaw) {
        await truncateTable("facebook_ads_raw");
    } else if (table == Table.freshsalesLeadsMattressRaw) {
        await truncateTable("freshsales_leads_mattress_raw");
    } else if (table == Table.freshsalesLeadsNonMattressRaw) {
        await truncateTable("freshsales_leads_non_mattress_raw");
    } else if (table == Table.freshsalesLeadsWaterPurifierRaw) {
        await truncateTable("freshsales_leads_water_purifier_raw");
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

export async function processIngestDataFromApi(table: Table): Promise<void> {
    console.log("dummy operation succeeded");
}

function convertObjectArrayIntoArrayArray(rowObjects: Array<{[k: string]: string}>, columns: Array<string>) {
    const headers = Object.keys(rowObjects[0]);

    for (const column of columns) {
        if (!headers.includes(column)) {
            console.log(`convertObjectArrayIntoArrayArray: column ${column} not found`);
            throw new Response(null, {status: 400});
        }
    }

    return rowObjects.map(rowObject => columns.map(column => getNonEmptyStringOrNull(rowObject[column].trim())));
}

const freshsalesColumnInfos = [
    {tableColumn: "lead_id", csvColumn: "Lead : id"},
    {tableColumn: "lead_first_name", csvColumn: "Lead : First name"},
    {tableColumn: "lead_last_name", csvColumn: "Lead : Last name"},
    {tableColumn: "lead_emails", csvColumn: "Lead : Emails"},
    {tableColumn: "lead_job_title", csvColumn: "Lead : Job title"},
    {tableColumn: "lead_sales_owner", csvColumn: "Lead : Sales owner"},
    {tableColumn: "lead_sales_owner_email", csvColumn: "Lead : Sales owner email"},
    {tableColumn: "lead_created_at", csvColumn: "Lead : Created at"},
    {tableColumn: "lead_lead_stage", csvColumn: "Lead : Lead stage"},
    {tableColumn: "lead_last_contacted_time", csvColumn: "Lead : Last contacted time"},
    {tableColumn: "lead_converted_leads", csvColumn: "Lead : Converted Leads"},
    {tableColumn: "lead_source", csvColumn: "Lead : Source"},
    {tableColumn: "lead_phone_number", csvColumn: "Lead : Phone_Number"},
    {tableColumn: "lead_updated_at", csvColumn: "Lead : Updated at"},
];

const shopifyTableColumnInfos = [
    {tableColumn: "hour", csvColumn: "hour"},
    {tableColumn: "cancelled", csvColumn: "cancelled"},
    {tableColumn: "financial_status", csvColumn: "financial_status"},
    {tableColumn: "order_id", csvColumn: "order_id"},
    {tableColumn: "order_name", csvColumn: "order_name"},
    {tableColumn: "adjustment", csvColumn: "adjustment"},
    {tableColumn: "fulfillment_status", csvColumn: "fulfillment_status"},
    {tableColumn: "purchase_option", csvColumn: "purchase_option"},
    {tableColumn: "sale_kind", csvColumn: "sale_kind"},
    {tableColumn: "sale_line_type", csvColumn: "sale_line_type"},
    {tableColumn: "cost_tracked", csvColumn: "cost_tracked"},
    {tableColumn: "billing_company", csvColumn: "billing_company"},
    {tableColumn: "billing_city", csvColumn: "billing_city"},
    {tableColumn: "billing_region", csvColumn: "billing_region"},
    {tableColumn: "billing_country", csvColumn: "billing_country"},
    {tableColumn: "billing_postal_code", csvColumn: "billing_postal_code"},
    {tableColumn: "customer_email", csvColumn: "customer_email"},
    {tableColumn: "customer_id", csvColumn: "customer_id"},
    {tableColumn: "customer_name", csvColumn: "customer_name"},
    {tableColumn: "customer_type", csvColumn: "customer_type"},
    {tableColumn: "marketing_event_target", csvColumn: "marketing_event_target"},
    {tableColumn: "marketing_event_type", csvColumn: "marketing_event_type"},
    {tableColumn: "utm_campaign_content", csvColumn: "utm_campaign_content"},
    {tableColumn: "utm_campaign_medium", csvColumn: "utm_campaign_medium"},
    {tableColumn: "utm_campaign_name", csvColumn: "utm_campaign_name"},
    {tableColumn: "utm_campaign_source", csvColumn: "utm_campaign_source"},
    {tableColumn: "utm_campaign_term", csvColumn: "utm_campaign_term"},
    {tableColumn: "pos_location_name", csvColumn: "pos_location_name"},
    {tableColumn: "product_id", csvColumn: "product_id"},
    {tableColumn: "product_price", csvColumn: "product_price"},
    {tableColumn: "product_title", csvColumn: "product_title"},
    {tableColumn: "product_type", csvColumn: "product_type"},
    {tableColumn: "product_vendor", csvColumn: "product_vendor"},
    {tableColumn: "variant_id", csvColumn: "variant_id"},
    {tableColumn: "variant_sku", csvColumn: "variant_sku"},
    {tableColumn: "variant_title", csvColumn: "variant_title"},
    {tableColumn: "shipping_city", csvColumn: "shipping_city"},
    {tableColumn: "shipping_region", csvColumn: "shipping_region"},
    {tableColumn: "shipping_country", csvColumn: "shipping_country"},
    {tableColumn: "shipping_postal_code", csvColumn: "shipping_postal_code"},
    {tableColumn: "api_client_title", csvColumn: "api_client_title"},
    {tableColumn: "staff_id", csvColumn: "staff_id"},
    {tableColumn: "staff_name", csvColumn: "staff_name"},
    {tableColumn: "id_of_staff_who_helped_with_sale", csvColumn: "id_of_staff_who_helped_with_sale"},
    {tableColumn: "name_of_staff_who_helped_with_sale", csvColumn: "name_of_staff_who_helped_with_sale"},
    {tableColumn: "referrer_host", csvColumn: "referrer_host"},
    {tableColumn: "referrer_name", csvColumn: "referrer_name"},
    {tableColumn: "referrer_path", csvColumn: "referrer_path"},
    {tableColumn: "referrer_source", csvColumn: "referrer_source"},
    {tableColumn: "referrer_url", csvColumn: "referrer_url"},
    {tableColumn: "orders", csvColumn: "orders"},
    {tableColumn: "gross_sales", csvColumn: "gross_sales"},
    {tableColumn: "discounts", csvColumn: "discounts"},
    {tableColumn: "returns", csvColumn: "returns"},
    {tableColumn: "net_sales", csvColumn: "net_sales"},
    {tableColumn: "shipping", csvColumn: "shipping"},
    {tableColumn: "duties", csvColumn: "duties"},
    {tableColumn: "additional_fees", csvColumn: "additional_fees"},
    {tableColumn: "taxes", csvColumn: "taxes"},
    {tableColumn: "total_sales", csvColumn: "total_sales"},
    {tableColumn: "average_order_value", csvColumn: "average_order_value"},
    {tableColumn: "total_tips", csvColumn: "total_tips"},
    {tableColumn: "total_cost", csvColumn: "total_cost"},
    {tableColumn: "gross_profit", csvColumn: "gross_profit"},
    {tableColumn: "gross_margin", csvColumn: "gross_margin"},
    {tableColumn: "units_per_transaction", csvColumn: "units_per_transaction"},
    {tableColumn: "customers", csvColumn: "customers"},
    {tableColumn: "gift_card_discounts", csvColumn: "gift_card_discounts"},
    {tableColumn: "gift_card_gross_sales", csvColumn: "gift_card_gross_sales"},
    {tableColumn: "gift_cards_issued", csvColumn: "gift_cards_issued"},
    {tableColumn: "pending_sales", csvColumn: "pending_sales"},
    {tableColumn: "net_quantity", csvColumn: "net_quantity"},
    {tableColumn: "ordered_item_quantity", csvColumn: "ordered_item_quantity"},
    {tableColumn: "average_units_ordered", csvColumn: "average_units_ordered"},
    {tableColumn: "returned_item_quantity", csvColumn: "returned_item_quantity"},
    {tableColumn: "percent_of_sales_with_staff_help", csvColumn: "percent_of_sales_with_staff_help"},
];

const googleAdsRawColumnInfos = [
    {tableColumn: "day", csvColumn: "Day"},
    {tableColumn: "campaign", csvColumn: "Campaign"},
    {tableColumn: "campaign_type", csvColumn: "Campaign type"},
    {tableColumn: "ad_group", csvColumn: "Ad group"},
    {tableColumn: "currency_code", csvColumn: "Currency code"},
    {tableColumn: "clicks", csvColumn: "Clicks"},
    {tableColumn: "impr", csvColumn: "Impr."},
    {tableColumn: "ctr", csvColumn: "CTR"},
    {tableColumn: "cost", csvColumn: "Cost"},
    {tableColumn: "avg_cpc", csvColumn: "Avg. CPC"},
];

const facebookAdsRawColumnInfos = [
    {tableColumn: "campaign_name", csvColumn: "Campaign name"},
    {tableColumn: "ad_set_name", csvColumn: "Ad set name"},
    {tableColumn: "ad_name", csvColumn: "Ad name"},
    {tableColumn: "day", csvColumn: "Day"},
    {tableColumn: "impressions", csvColumn: "Impressions"},
    {tableColumn: "currency", csvColumn: "Currency"},
    {tableColumn: "amount_spent", csvColumn: "Amount spent (INR)"},
    {tableColumn: "leads", csvColumn: "Leads"},
    {tableColumn: "link_clicks", csvColumn: "Link clicks"},
    {tableColumn: "ctr", csvColumn: "CTR (link click-through rate)"},
    {tableColumn: "cpc", csvColumn: "CPC (cost per link click)"},
    {tableColumn: "cpi", csvColumn: "CPI"},
];

const typeformRawColumnInfos = [
];

const websitePopupFormResponsesRawColumnInfos = [
    {tableColumn: "timestamp", csvColumn: "Timestamp"},
    {tableColumn: "name", csvColumn: "Name"},
    {tableColumn: "email", csvColumn: "Email"},
    {tableColumn: "phone", csvColumn: "Phone"},
    {tableColumn: "interested_product", csvColumn: "Which product are you most interested in?"},
    {tableColumn: "url", csvColumn: "URL"},
];
