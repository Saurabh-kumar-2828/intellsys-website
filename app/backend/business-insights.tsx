import {getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getCredentialId} from "~/backend/utilities/data-management/credentials.server";
import {execute} from "~/backend/utilities/databaseManager.server";
import {getGranularityQuery} from "~/backend/utilities/utilities.server";
import {Iso8601Date, Uuid, dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {CredentialType} from "~/utilities/typeDefinitions";
import {dateToIso8601Date, getSingletonValue} from "~/utilities/utilities";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import { Integer } from "~/global-common-typescript/typeDefinitions";
import { getCredentialFromKms } from "~/global-common-typescript/server/kms.server";
import { getLoginCustomerIdForConnector } from "./utilities/data-management/googleOAuth.server";

export enum TimeGranularity {
    daily = "Daily",
    weekly = "Weekly",
    monthly = "Monthly",
    // quarterly = "Quarterly",
    hourly = "Hourly",
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

export type GoogleAdsData = {
    metaQuery: string;
    rows: Array<GoogleAdsDataAggregatedRow>;
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

export type GoogleAdsDataAggregatedRow = {
    date: Iso8601Date;
    hour: Integer;
    campaignId: string;
    campaignName: string;
    averageCost: any;
    impressions: any;
    clicks: any;
    interactionEventTypes: any;
    valuePerAllConversions: any;
    videoViewRate: any;
    videoViews: any;
    viewThroughConversions: any;
    conversionsFromInteractionsRate: any;
    conversionsValue: any;
    conversions: any;
    costMicros: any;
    costPerAllConversions: any;
    ctr: any;
    engagementRate: any;
    engagements: any;
    activeViewImpressions: any;
    activeViewMeasurability: any;
    activeViewMeasurableCostMicros: any;
    activeViewMeasurableImpressions: any;
    allConversionsFromInteractionsRate: any;
    allConversionsValue: any;
    allConversions: any;
    averageCpc: any;
    averageCpe: any;
    averageCpm: any;
    averageCpv: any;
    interactionRate: any;
    interactions: any;
    allConversionsByConversionDate: any;
    valuePerAllConversionsByConversionDate: any;
}

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

function rowToGoogleAdsDataAggregatedRow(row: unknown): GoogleAdsDataAggregatedRow {
    const adsDataAggregatedRow: GoogleAdsDataAggregatedRow = {
        date: row.date,
        hour: row.hour,
        campaignId: row.campaignid,
        campaignName: row.campaignname,
        averageCost: row.averagecost,
        impressions: row.impressions,
        clicks: row.clicks,
        interactionEventTypes: row.interactioneventtypes,
        valuePerAllConversions: row.valueperallconversions,
        videoViewRate: row.videoviewrate,
        videoViews: row.videoviews,
        viewThroughConversions: row.viewthroughconversions,
        conversionsFromInteractionsRate: row.conversionsfrominteractionsrate,
        conversionsValue: row.conversionsvalue,
        conversions: row.conversions,
        costMicros: row.costmicros,
        costPerAllConversions: row.costperallconversions,
        ctr: row.ctr,
        engagementRate: row.engagementrate,
        engagements: row.engagements,
        activeViewImpressions: row.activeviewimpressions,
        activeViewMeasurability: row.activeviewmeasurability,
        activeViewMeasurableCostMicros: row.activeviewmeasurablecostmicros,
        activeViewMeasurableImpressions: row.activeviewmeasurableimpressions,
        allConversionsFromInteractionsRate: row.allconversionsfrominteractionsrate,
        allConversionsValue: row.allconversionsvalue,
        allConversions: row.allconversions,
        averageCpc: row.averagecpc,
        averageCpe: row.averagecpe,
        averageCpm: row.averagecpm,
        averageCpv: row.averagecpv,
        interactionRate: row.interactionrate,
        interactions: row.interactions,
        allConversionsByConversionDate: row.allconversionsbyconversiondate,
        valuePerAllConversionsByConversionDate: row.valueperallconversionsbyconversiondate,
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

export async function getGoogleAdsLectrixData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, destinationDatabaseId: Uuid, connectorId: Uuid): Promise<GoogleAdsData | Error> {

    const postgresDatabaseManager = await getPostgresDatabaseManager(destinationDatabaseId);

    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const loginCustomerIdRaw = await getLoginCustomerIdForConnector([connectorId]);
    if (loginCustomerIdRaw instanceof Error) {
        return loginCustomerIdRaw;
    }

    const loginCustomerId = getSingletonValue(loginCustomerIdRaw);

    const tableName = `${dataSourcesAbbreviations.googleAds}_${loginCustomerId.loginCustomerId}`;

    // TODO: Fix the name of the table

    const query = `
        SELECT
            data->'campaign'->>'id' as campaignId,
            data->'campaign'->>'name' as campaignName,
            data->'campaign'->>'resourceName' as resourceName,
            data->'metrics'->>'interactionEventTypes' as interactionEventTypes,
            data->'metrics'->>'valuePerAllConversions' as valuePerAllConversions,
            data->'metrics'->>'videoViewRate' as videoViewRate,
            data->'metrics'->>'videoViews' as videoViews,
            data->'metrics'->>'viewThroughConversions' as viewThroughConversions,
            data->'metrics'->>'conversionsFromInteractionsRate' as conversionsFromInteractionsRate,
            data->'metrics'->>'conversionsValue' as conversionsValue,
            data->'metrics'->>'conversions' as conversions,
            data->'metrics'->>'costMicros' as costMicros,
            data->'metrics'->>'costPerAllConversions' as costPerAllConversions,
            data->'metrics'->>'ctr' as ctr,
            data->'metrics'->>'engagementRate' as engagementRate,
            data->'metrics'->>'engagements' as engagements,
            data->'metrics'->>'activeViewImpressions' as activeViewImpressions,
            data->'metrics'->>'activeViewMeasurability' as activeViewMeasurability,
            data->'metrics'->>'activeViewMeasurableCostMicros' as activeViewMeasurableCostMicros,
            data->'metrics'->>'activeViewMeasurableImpressions' as activeViewMeasurableImpressions,
            data->'metrics'->>'allConversionsFromInteractionsRate' as allConversionsFromInteractionsRate,
            data->'metrics'->>'allConversionsValue' as allConversionsValue,
            data->'metrics'->>'allConversions' as allConversions,
            data->'metrics'->>'averageCpc' as averageCpc,
            data->'metrics'->>'averageCpe' as averageCpe,
            data->'metrics'->>'averageCpm' as averageCpm,
            data->'metrics'->>'averageCpv' as averageCpv,
            data->'metrics'->>'interactionRate' as interactionRate,
            data->'metrics'->>'interactions' as interactions,
            data->'metrics'->>'allConversionsByConversionDate' as allConversionsByConversionDate,
            data->'metrics'->>'valuePerAllConversionsByConversionDate' as valuePerAllConversionsByConversionDate,
            DATE((data->'segments'->>'date')) AS date,
            data->'segments'->>'hour' AS hour,
            'Google' AS platform,
            data->'metrics'->>'clicks' as clicks,
            data->'metrics'->>'impressions' as impressions,
            data->'metrics'->>'averageCost' as averageCost
        FROM
            ${tableName}
        WHERE
            DATE((data->'segments'->>'date')) >= '${minDate}'
            AND DATE((data->'segments'->>'date')) <= '${maxDate}'
        ORDER BY
            date
    `;

    const result = await postgresDatabaseManager.execute(query);
    if (result instanceof Error) {
        return result;
    }

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToGoogleAdsDataAggregatedRow(row)),
    };


}

export async function getFacebookAdsLectrixData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<AdsData | Error> {
    const credentialId = await getCredentialId(companyId, CredentialType.DatabaseNew);
    if (credentialId instanceof Error) {
        return credentialId;
    }

    const postgresDatabaseManager = await getPostgresDatabaseManager(credentialId);
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const query = `
        SELECT
            DATE_TRUNC('DAY', "date_start"::timestamp) AS date,
            campaign_name,
            spend AS spend,
            impressions AS impressions,
            inline_link_clicks AS clicks
        FROM
            facebook_ads_ad_insights
        WHERE
            DATE(date_start) >= '${minDate}'
            AND DATE(date_start) <= '${maxDate}'
            AND (spend > 0 OR impressions > 0 OR inline_link_clicks > 0)
        ORDER BY
            date
    `;
    const result = await postgresDatabaseManager.execute(query);

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
