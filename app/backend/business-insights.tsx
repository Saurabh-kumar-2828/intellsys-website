import {execute} from "~/backend/utilities/databaseManager.server";
import {dateToMediumEnFormat} from "~/utilities/utilities";
import {getGranularityQuery, joinValues} from "~/backend/utilities/utilities";

export async function getShopifyData(
    minDate: string,
    maxDate: string,
    selectedGranularity: string
): Promise<{
    metaQuery: string;
    rows: Array<{
        date: string;
        category: string;
        productTitle: string;
        productPrice: number;
        sourcePlatform: string;
        sourceCampaignName: string;
        isAssisted: boolean;
        source: string;
        cancelled: boolean;
        netQuantity: number;
        netSales: number;
    }>;
} | null> {
    try {
        const query = `
            SELECT
                ${getGranularityQuery(selectedGranularity, "date")} AS date,
                product_category,
                product_sub_category,
                product_title,
                product_price,
                variant_title,
                source_information_platform,
                source_information_campaign_name,
                is_assisted,
                source,
                SUM(net_sales) AS net_sales,
                SUM(net_quantity) AS net_quantity
            FROM
                shopify_sales_to_source_with_information
            WHERE
                date >= '${minDate}' AND
                date <= '${maxDate}' AND
                cancelled = 'No'
            GROUP BY
                ${getGranularityQuery(selectedGranularity, "date")},
                product_category,
                product_sub_category,
                product_title,
                source,
                variant_title,
                product_price,
                source_information_platform,
                source_information_campaign_name,
                is_assisted
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

export async function getFreshsalesData(
    minDate: string,
    maxDate: string,
    selectedGranularity: string
): Promise<{
    metaQuery: string;
    rows: Array<{
        date: string;
        category: string;
        sourceCampaignName: string;
        count: number;
    }>;
} | null> {
    try {
        const query = `
            SELECT
                ${getGranularityQuery(selectedGranularity, "lead_created_at")} AS date,
                source_information_category,
                category,
                source,
                source_information_platform,
                source_information_campaign_name,
                COUNT(*) AS count
            FROM
                freshsales_leads_to_source_with_information
            WHERE
                DATE(lead_created_at) >= '${minDate}' AND
                DATE(lead_created_at) <= '${maxDate}'
            GROUP BY
                date,
                source,
                source_information_category,
                category,
                source_information_platform,
                source_information_campaign_name
            ORDER BY
                date
        `;

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result
                ? result.rows.map((row: any) => ({
                      date: row.date.toISOString().slice(0, 10),
                      count: parseInt(row.count),
                      source: row.source,
                      sourceCategory: row.source_information_category,
                      category: row.category,
                      platform: row.source_information_platform,
                      campaign: row.source_information_campaign_name,
                  }))
                : [],
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function getAdsData(minDate: string, maxDate: string, selectedGranularity: string) {
    try {
        const query = `
            SELECT
                SUM(amount_spent) AS amount_spent,
                SUM(impressions) AS impressions,
                SUM(clicks) AS clicks,
                ${getGranularityQuery(selectedGranularity, "date")} AS date,
                campaign_name,
                category,
                platform
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
            rows: result
                ? result.rows.map((row) => ({
                      date: row.date.toISOString().slice(0, 10),
                      amountSpent: parseFloat(row.amount_spent),
                      impressions: parseInt(row.impressions),
                      clicks: parseInt(row.clicks),
                      platform: row.platform,
                      campaignName: row.campaign_name,
                      category: row.category,
                  }))
                : [],
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}
