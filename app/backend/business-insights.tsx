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

export type ShopifyData = {
    metaQuery: string;
    rows: Array<ShopifyDataAggregatedRow>;
};

export type ShopifyDataAggregatedRow = {
    date: Iso8601Date;
    productCategory: string;
    productSubCategory: string;
    productTitle: string;
    productPrice: number;
    variantTitle: string;
    leadGenerationSource: string;
    leadCaptureSource: string;
    leadGenerationSourceCampaignName: string;
    leadGenerationSourceCampaignPlatform: string;
    leadGenerationSourceCampaignCategory: string;
    isAssisted: boolean;
    netSales: number;
    netQuantity: number;
};

export async function getShopifyData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity): Promise<ShopifyData> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "date")} AS date,
            product_category,
            product_sub_category,
            product_title,
            product_price,
            variant_title,
            lead_generation_source,
            lead_capture_source,
            lead_generation_source_campaign_name,
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
            lead_capture_source,
            lead_generation_source_campaign_name,
            lead_generation_source_campaign_platform,
            lead_generation_source_campaign_category,
            is_assisted
        ORDER BY
            date
    `;

    const result = await execute(query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => getRowToShopifyDataAggregatedRow(row)),
    };
}

function getRowToShopifyDataAggregatedRow(row: any): ShopifyDataAggregatedRow {
    const shopifyDataAggregatedRow: ShopifyDataAggregatedRow = {
        date: row.date.toISOString().slice(0, 10),
        productCategory: row.product_category,
        productSubCategory: row.product_sub_category,
        productTitle: row.product_title,
        productPrice: parseInt(row.product_price),
        variantTitle: row.variant_title,
        leadGenerationSource: row.lead_generation_source,
        leadCaptureSource: row.lead_capture_source,
        leadGenerationSourceCampaignName: row.lead_generation_source_campaign_name,
        leadGenerationSourceCampaignPlatform: row.lead_generation_source_campaign_platform,
        leadGenerationSourceCampaignCategory: row.lead_generation_source_campaign_category,
        isAssisted: row.is_assisted,
        netSales: parseFloat(row.net_sales),
        netQuantity: parseInt(row.net_quantity),
    };

    return shopifyDataAggregatedRow;
}

export type FreshsalesData = {
    metaQuery: string;
    rows: Array<FreshsalesDataAggregatedRow>;
};

export type FreshsalesDataAggregatedRow = {
    date: Iso8601Date;
    count: number;
    category: string;
    leadStage: string;
    leadCaptureSource: string;
    leadGenerationSource: string;
    leadGenerationSourceCampaignName: string;
    leadGenerationSourceCampaignPlatform: string;
    leadGenerationSourceCampaignCategory: string;
};

export async function getFreshsalesData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity): Promise<FreshsalesData> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "lead_created_at")} AS date,
            category,
            lead_lead_stage,
            lead_capture_source,
            lead_generation_source,
            lead_generation_source_campaign_name,
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
            lead_lead_stage,
            lead_capture_source,
            lead_generation_source,
            lead_generation_source_campaign_name,
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
        leadStage: row.lead_lead_stage,
        leadCaptureSource: row.lead_capture_source,
        leadGenerationSource: row.lead_generation_source,
        leadGenerationSourceCampaignName: row.lead_generation_source_campaign_name,
        leadGenerationSourceCampaignPlatform: row.lead_generation_source_campaign_platform,
        leadGenerationSourceCampaignCategory: row.lead_generation_source_campaign_category,
    };

    return freshsalesDataAggregatedRow;
}

export type AdsData = {
    metaQuery: string;
    rows: Array<AdsDataAggregatedRow>;
};

export type AdsDataAggregatedRow = {
    date: Iso8601Date;
    amountSpent: number;
    impressions: number;
    clicks: number;
    campaignName: string;
    platform: string;
    category: string;
};

export async function getAdsData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity): Promise<AdsData> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "date")} AS date,
            SUM(amount_spent) AS amount_spent,
            SUM(impressions) AS impressions,
            SUM(clicks) AS clicks,
            campaign_name,
            platform,
            category
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
