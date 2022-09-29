import {execute} from "~/backend/utilities/databaseManager.server";
import {dateToMediumEnFormat} from "~/utilities/utilities";
import {getGranularityQuery, joinValues} from "~/backend/utilities/utilities";
import { get_r1_performanceLeadsCount, get_r4_facebookAdsSpends } from "~/backend/business-insights";

export async function getCampaignsInformation(
    selectedCategories: Array<string>,
    selectedProducts: Array<string>,
    selectedPlatforms: Array<string>,
    selectedCampaigns: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string,
) {
    try {
        const selectValues = [];
        const whereValues = [];

        if (selectedCategories.length > 0) {
            whereValues.push(`category IN (${joinValues(selectedCategories, ", ", "'")})`);
        }

        // if (selectedProducts.length > 0) {
        //     groupByValues.push("source_information_category");
        // }

        if (selectedPlatforms.length > 0) {
            whereValues.push(`platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("SUM(amount_spent) AS amount_spent");
        selectValues.push("SUM(impressions) AS impressions");
        selectValues.push("SUM(clicks) AS clicks");

        whereValues.push("platform = 'Facebook'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        const query = (
            `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    ads_with_information
                WHERE
                    ${joinValues(whereValues, " AND ")}
            `
        );

        const result = await execute(query);

        if (result.rows.length != 1) {
            throw "";
        }

        const row = result.rows[0];
        return {
            metaQuery: query,
            amountSpent: parseFloat(row.amount_spent),
            impressions: parseFloat(row.impressions),
            clicks: parseFloat(row.clicks),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function getCampaignsTrends (
    selectedCategories: Array<string>,
    selectedProducts: Array<string>,
    selectedPlatforms: Array<string>,
    selectedCampaigns: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string,
) {
    try {
        const selectValues = [];
        const whereValues = [];
        const groupByValues = [];

        if (selectedCategories.length > 0) {
            whereValues.push(`category IN (${joinValues(selectedCategories, ", ", "'")})`);
        }

        // if (selectedProducts.length > 0) {
        //     groupByValues.push("source_information_category");
        // }

        if (selectedPlatforms.length > 0) {
            whereValues.push(`platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("SUM(amount_spent) AS amount_spent");
        selectValues.push("SUM(impressions) AS impressions");
        selectValues.push("SUM(clicks) AS clicks");
        selectValues.push(`${getGranularityQuery(selectedGranularity, "date")} AS date`);

        whereValues.push("platform = 'Facebook'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push(getGranularityQuery(selectedGranularity, "date"));

        const query = (
            `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    ads_with_information
                WHERE
                    ${joinValues(whereValues, " AND ")}
                GROUP BY
                    ${joinValues(groupByValues, ", ")}
                ORDER BY
                    date
            `
        );

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map(row => ({
                date: row.date,
                amountSpent: parseFloat(row.amount_spent),
                impressions: parseFloat(row.impressions),
                clicks: parseFloat(row.clicks),
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function getLeads(
    selectedCategories: Array<string>,
    selectedProducts: Array<string>,
    selectedPlatforms: Array<string>,
    selectedCampaigns: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string,
) {
    return get_r1_performanceLeadsCount(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate);
}

export async function getSales(
    selectedCategories: Array<string>,
    selectedProducts: Array<string>,
    selectedPlatforms: Array<string>,
    selectedCampaigns: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string,
) {
    try {
        const selectValues = [];
        const whereValues = [];

        if (selectedCategories.length > 0) {
            whereValues.push(`product_category IN (${joinValues(selectedCategories, ", ", "'")})`);
        }

        // if (selectedProducts.length > 0) {
        //     groupByValues.push("source_information_category");
        // }

        if (selectedPlatforms.length > 0) {
            whereValues.push(`source_information_platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`source_information_campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("COUNT(*) AS count");

        whereValues.push("cancelled = 'No'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        const query = (
            `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    shopify_sales_to_source_with_information
                WHERE
                    ${joinValues(whereValues, " AND ")}
            `
        );

        const result = await execute(query);

        if (result.rows.length != 1) {
            throw "";
        }

        const row = result.rows[0];
        return {
            metaQuery: query,
            count: parseInt(row.count),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}
