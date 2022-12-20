import {execute} from "~/backend/utilities/databaseManager.server";
import {dateToIso8601Date, dateToMediumEnFormat} from "~/utilities/utilities";
import {getGranularityQuery, joinValues} from "~/backend/utilities/utilities";
import {Iso8601Date} from "~/utilities/typeDefinitions";

export enum TimeGranularity {
    daily = "Daily",
    weekly = "Weekly",
    monthly = "Monthly",
    // quarterly = "Quarterly",
    yearly = "Yearly",
}

export type ShopifyDataAggregatedRow = {
    date: Iso8601Date,
    productCategory: string;
    productSubCategory: string;
    productTitle: string;
    productPrice: string;
    variantTitle: string;
    leadGenerationSource: string;
    leadGenerationSourceCampaignPlatform: string;
    leadGenerationSourceCampaignCategory: string;
    isAssisted: boolean;
    netSales: number;
    netQuantit: number;
};

export async function getShopifyData(
    minDate: Iso8601Date,
    maxDate: Iso8601Date,
    granularity: TimeGranularity
): Promise<{
    metaQuery: string;
    rows: Array<ShopifyDataAggregatedRow>;
}> {
    try {
        const query = `
            SELECT
                ${getGranularityQuery(granularity, "date")} AS date,
                product_category,
                product_sub_category,
                product_title,
                product_price,
                variant_title,
                lead_generation_source,
                lead_generation_source_campaign_platform,
                lead_generation_source_campaign_category,
                is_assisted,
                SUM(net_sales) AS net_sales,
                SUM(net_quantity) AS net_quantity
            FROM
                shopify_sales_to_source_with_information
            WHERE
                date >= '${minDate}' AND
                date <= '${maxDate}' AND
                cancelled = 'No'
            GROUP BY
                ${getGranularityQuery(granularity, "date")},
                product_category,
                product_sub_category,
                product_title,
                product_price,
                variant_title,
                lead_generation_source,
                lead_generation_source_campaign_platform,
                lead_generation_source_campaign_category,
                is_assisted,
            ORDER BY
                date
        `;

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result
                ? result.rows.map((row: any) => ({
                      date: row.date.toISOString().slice(0, 10),
                      category: row.product_category,
                      productTitle: row.product_title,
                      productPrice: parseInt(row.product_title),
                      sourcePlatform: row.source_information_platform,
                      sourceCampaignName: row.source_information_campaign_name,
                      isAssisted: row.is_assisted,
                      source: row.source,
                      cancelled: row.cancelled == "Yes",
                      netSales: parseFloat(row.net_sales),
                      netQuantity: parseInt(row.net_quantity),
                      subCategory: row.product_sub_category,
                      variantTitle: row.variant_title,
                  }))
                : [],
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return null;
    }
}

export type FreshsalesDataAggregatedRow = {
    date: Iso8601Date;
    count: number;
    category: string;
    leadCaptureSource: string;
    leadGenerationSource: string;
    leadGenerationSourceCampaignPlatform: string;
    leadGenerationSourceCampaignCategory: string;
};

export async function getFreshsalesData(
    minDate: Iso8601Date,
    maxDate: Iso8601Date,
    granularity: TimeGranularity
): Promise<{
    metaQuery: string;
    rows: Array<FreshsalesDataAggregatedRow>;
}> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "lead_created_at")} AS date,
            category,
            lead_capture_source,
            lead_generation_source,
            lead_generation_source_campaign_platform,
            lead_generation_source_campaign_category,
            COUNT(*) AS count
        FROM
            freshsales_leads_to_source_with_information
        WHERE
            DATE(lead_created_at) >= '${minDate}' AND
            DATE(lead_created_at) <= '${maxDate}'
        GROUP BY
            date,
            category,
            lead_capture_source,
            lead_generation_source,
            lead_generation_source_campaign_platform,
            lead_generation_source_campaign_category
        ORDER BY
            date
    `;

    const result = await execute(query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToFreshsalesDataAggregatedRow(row)),
    };
}

function rowToFreshsalesDataAggregatedRow(row: any): FreshsalesDataAggregatedRow {
    const freshsalesDataAggregatedRow: FreshsalesDataAggregatedRow = {
        date: dateToIso8601Date(row.date),
        count: parseInt(row.count),
        category: row.category,
        leadCaptureSource: row.lead_capture_source,
        leadGenerationSource: row.lead_generation_source,
        leadGenerationSourceCampaignPlatform: row.lead_generation_source_campaign_platform,
        leadGenerationSourceCampaignCategory: row.lead_generation_source_campaign_category,
    };

    return freshsalesDataAggregatedRow;
}

export type AdsDataAggregatedRow = {
    date: Iso8601Date;
    amountSpent: number;
    impressions: number;
    clicks: string;
    campaignName: string;
    platform: string;
    category: string;
};

export async function getAdsData(
    minDate: Iso8601Date,
    maxDate: Iso8601Date,
    granularity: TimeGranularity,
): Promise<{
    metaQuery: string;
    rows: Array<AdsDataAggregatedRow>;
}> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "date")} AS date,
            SUM(amount_spent) AS amount_spent,
            SUM(impressions) AS impressions,
            SUM(clicks) AS clicks,
            campaign_name,
            platform
            category,
        FROM
            ads_with_information
        WHERE
            DATE(date) >= '${minDate}'
            AND DATE(date) <= '${maxDate}'
        GROUP BY
            date,
            campaign_name,
            platform,
            category
        ORDER BY
            date
    `;

    const result = await execute(query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToAdsDataAggregatedRow(row)),
    };
}

function rowToAdsDataAggregatedRow(row: any): AdsDataAggregatedRow {
    const adsDataAggregatedRow: AdsDataAggregatedRow = {
        date: row.date.toISOString().slice(0, 10),
        amountSpent: parseFloat(row.amount_spent),
        impressions: parseInt(row.impressions),
        clicks: parseInt(row.clicks),
        platform: row.platform,
        campaignName: row.campaign_name,
        category: row.category,
    };

    return adsDataAggregatedRow;
}
