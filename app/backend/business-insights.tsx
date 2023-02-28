import {execute} from "~/backend/utilities/databaseManager.server";
import {getGranularityQuery} from "~/backend/utilities/utilities.server";
import {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
import {dateToIso8601Date} from "~/utilities/utilities";

export enum TimeGranularity {
    daily = "Daily",
    weekly = "Weekly",
    monthly = "Monthly",
    // quarterly = "Quarterly",
    yearly = "Yearly",
}

export function getTimeGranularityFromUnknown(timeGranularity: unknown): TimeGranularity {
    if (!(typeof timeGranularity === "string")) {
        throw Error(`Unexpected TimeGranularity ${timeGranularity}`);
    }

    switch (timeGranularity) {
        case TimeGranularity.daily: {
            return TimeGranularity.daily;
        }
        case TimeGranularity.weekly: {
            return TimeGranularity.weekly;
        }
        case TimeGranularity.monthly: {
            return TimeGranularity.monthly;
        }
        case TimeGranularity.yearly: {
            return TimeGranularity.yearly;
        }
        default: {
            throw Error(`Unexpected TimeGranularity ${timeGranularity}`);
        }
    }
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

export async function getShopifyData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<ShopifyData> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "date")} AS date,
            product_category,
            product_sub_category,
            product_title,
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

    const result = await execute(companyId, query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => getRowToShopifyDataAggregatedRow(row)),
    };
}

function getRowToShopifyDataAggregatedRow(row: unknown): ShopifyDataAggregatedRow {
    const shopifyDataAggregatedRow: ShopifyDataAggregatedRow = {
        date: row.date.toISOString().slice(0, 10),
        productCategory: row.product_category,
        productSubCategory: row.product_sub_category,
        productTitle: row.product_title,
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
    timeToClose: number;
};

export async function getFreshsalesData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<FreshsalesData> {
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
            COUNT(*) AS count,
            AVG(time_to_close) AS time_to_close
        FROM
            freshsales_leads_to_source_with_information
        WHERE
            DATE(lead_created_at) >= '${minDate}' AND
            DATE(lead_created_at) <= '${maxDate}'
        GROUP BY
            lead_created_at,
            category,
            lead_lead_stage,
            lead_capture_source,
            lead_generation_source,
            lead_generation_source_campaign_name,
            lead_generation_source_campaign_platform,
            lead_generation_source_campaign_category
        ORDER BY
            lead_created_at
    `;

    const result = await execute(companyId, query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToFreshsalesDataAggregatedRow(row)),
    };
}

function rowToFreshsalesDataAggregatedRow(row: unknown): FreshsalesDataAggregatedRow {
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
        timeToClose: row.time_to_close,
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

// TODO: Remove? At the very least, refactor to use getGoogleAdsData and getFacebookAdsData.
// Metrics: amountSpent, impressions, clicks
// Dependent column: platform, category
// pivots: date, campaign name
export async function getAdsData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<AdsData> {
    const googleAdsData = await getGoogleAdsData(minDate, maxDate, granularity, companyId);
    const facebookAdsData = await getFacebookAdsData(minDate, maxDate, granularity, companyId);

    const result = {
        metaQuery: googleAdsData.metaQuery + "\n" + facebookAdsData.metaQuery,
        rows: [...googleAdsData.rows, ...facebookAdsData.rows],
    };

    return result;
}

function rowToAdsDataAggregatedRow(row: unknown): AdsDataAggregatedRow {
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

export async function getGoogleAdsData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<AdsData> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "date")} AS date,
            campaign_name,
            spend AS amount_spent,
            impressions,
            clicks,
            campaign_category AS category,
            'Google' AS platform
        FROM
            google_ads_with_information
        WHERE
            DATE(date) >= '${minDate}'
            AND DATE(date) <= '${maxDate}'
        ORDER BY
            date
    `;

    const result = await execute(companyId, query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToAdsDataAggregatedRow(row)),
    };
}

export async function getFacebookAdsData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<AdsData> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "date")} AS date,
            campaign_name,
            spend AS amount_spent,
            impressions,
            clicks,
            campaign_category AS category,
            'Facebook' AS platform
        FROM
            facebook_ads_with_information
        WHERE
            DATE(date) >= '${minDate}'
            AND DATE(date) <= '${maxDate}'
        ORDER BY
            date
    `;

    const result = await execute(companyId, query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToAdsDataAggregatedRow(row)),
    };
}
