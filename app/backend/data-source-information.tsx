import {execute} from "~/backend/utilities/databaseManager.server";
import {dateToMediumEnFormat} from "~/utilities/utilities";
import {getGranularityQuery, joinValues} from "~/backend/utilities/utilities";

// TODO: Fix nomenclature

async function getDataInformation(tableName: string, dateColumn: string) {
    try {
        const query = (
            `
                SELECT
                    COUNT(*) AS count,
                    MIN(${dateColumn}) AS min_date,
                    MAX(${dateColumn}) AS max_date
                FROM
                    ${tableName}
            `
        );

        const result = await execute(query);

        if (result.rows.length == 0) {
            throw "";
        }

        const row = result.rows[0];
        return {
            metaQuery: query,
            count: row.count,
            minDate: row.min_date,
            maxDate: row.max_date,
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_shopifySalesDataInformation() {
    return await getDataInformation("shopify_sales", "date");
}

export async function get_shopifySalesRawDataInformation() {
    return await getDataInformation("shopify_sales_raw", "DATE(hour)");
}

export async function get_freshsalesLeadsDataInformation() {
    return await getDataInformation("freshsales_leads", "lead_created_at");
}

export async function get_freshsalesLeadsMattressRawDataInformation() {
    return await getDataInformation("freshsales_leads_mattress_raw", "lead_created_at");
}

export async function get_freshsalesLeadsNonMattressRawDataInformation() {
    return await getDataInformation("freshsales_leads_non_mattress_raw", "lead_created_at");
}

export async function get_freshsalesLeadsWaterPurifierRawDataInformation() {
    return await getDataInformation("freshsales_leads_water_purifier_raw", "lead_created_at");
}

export async function get_googleAdsDataInformation() {
    return await getDataInformation("google_ads", "day");
}

export async function get_googleAdsRawDataInformation() {
    return await getDataInformation("google_ads_raw", "day");
}

export async function get_facebookAdsDataInformation() {
    return await getDataInformation("facebook_ads", "day");
}

export async function get_facebookAdsRawDataInformation() {
    return await getDataInformation("facebook_ads_raw", "day");
}

export async function get_websitePopupFormResponsesDataInformation() {
    return await getDataInformation("website_popup_form_responses", "DATE(timestamp)");
}

export async function get_websitePopupFormResponsesRawDataInformation() {
    return await getDataInformation("website_popup_form_responses_raw", "DATE(timestamp)");
}

export async function get_typeformResponsesDataInformation() {
    return await getDataInformation("typeform_responses", "date");
}

export async function get_typeformResponsesMattressDataInformation() {
    return await getDataInformation("typeform_responses_mattress_raw", "date");
}

export async function get_typeformResponsesWaterPurifierDataInformation() {
    return await getDataInformation("typeform_responses_water_purifier_raw", "date");
}
