import {execute} from "~/backend/utilities/databaseManager.server";
import {dateToMediumEnFormat} from "~/utilities/utilities";
import {getGranularityQuery, joinValues} from "~/backend/utilities/utilities";
import {QueryFilterType} from "~/utilities/typeDefinitions";

// TODO: Fix nomenclature

export async function get_shopifyData(
    selectedCategories: Array<string>,
    selectedProducts: Array<string>,
    selectedPlatforms: Array<string>,
    selectedCampaigns: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string
) {
    try {
        const selectValues = [];
        const whereValues = [];
        const groupByValues = [];

        if (selectedCategories.length > 0) {
            whereValues.push(`product_category IN (${joinValues(selectedCategories, ", ", "'")})`);
            groupByValues.push("category");
        }

        if (selectedProducts.length > 0) {
            whereValues.push(`product_title IN (${joinValues(selectedProducts, ", ", "'")})`);
            groupByValues.push("source_information_platform");
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`source_information_campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
            groupByValues.push("source_information_campaign_name");
        }

        selectValues.push("SUM(net_sales) AS net_sales");
        selectValues.push("COUNT(*) AS count");
        selectValues.push(`${getGranularityQuery(selectedGranularity, "date")} AS date`);
        selectValues.push("source_information_platform");
        selectValues.push("is_assisted");
        selectValues.push("source");

        whereValues.push("cancelled = 'No'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push(getGranularityQuery(selectedGranularity, "date"));
        groupByValues.push("source_information_platform");
        groupByValues.push("is_assisted");
        groupByValues.push("source");

        const query = `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    shopify_sales_to_source_with_information
                WHERE
                    ${joinValues(whereValues, " AND ")}
                GROUP BY
                    ${joinValues(groupByValues, ", ")}
                ORDER BY
                    date
            `;

        const result = await execute(query);
        return {
            metaQuery: query,
            rows: result.rows.map((row) => ({
                date: dateToMediumEnFormat(row.date),
                count: parseInt(row.count),
                netSales: parseFloat(row.net_sales),
                sourcePlatform: row.source_information_platform,
                isAssisted: row.is_assisted,
                source: row.source,
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_freshSalesData(
    selectedCategories: Array<string>,
    selectedProducts: Array<string>,
    selectedPlatforms: Array<string>,
    selectedCampaigns: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string
) {
    try {
        const selectValues = [];
        const whereValues = [];
        const groupByValues = [];

        if (selectedCategories.length > 0) {
            selectValues.push("category AS category");
            whereValues.push(`category IN (${joinValues(selectedCategories, ", ", "'")})`);
            groupByValues.push("category");
        }

        // if (selectedProducts.length > 0) {
        //     selectValues.push("source_information_category");
        //     groupByValues.push("source_information_category");
        // }

        if (selectedPlatforms.length > 0) {
            selectValues.push("source_information_platform AS platform");
            whereValues.push(`source_information_platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
            groupByValues.push("source_information_platform");
        }

        if (selectedCampaigns.length > 0) {
            selectValues.push("source_information_campaign_name AS campaign_name");
            whereValues.push(`source_information_campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
            groupByValues.push("source_information_campaign_name");
        }

        selectValues.push("COUNT(*) AS count");
        selectValues.push(`${getGranularityQuery(selectedGranularity, "lead_created_at")} AS date`);
        selectValues.push("source");

        if (minDate != null) {
            whereValues.push(`DATE(lead_created_at) >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`DATE(lead_created_at) <= '${maxDate}'`);
        }

        groupByValues.push(getGranularityQuery(selectedGranularity, "lead_created_at"));
        groupByValues.push("source");
        const query = `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    freshsales_leads_to_source_with_information
                WHERE
                    ${joinValues(whereValues, " AND ")}
                GROUP BY
                    ${joinValues(groupByValues, ", ")}
                ORDER BY
                    date
            `;

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map((row) => ({
                date: dateToMediumEnFormat(row.date),
                count: parseInt(row.count),
                source: row.source,
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function getOrdersRevenue(
    selectedCategories: Array<string>,
    selectedProducts: Array<string>,
    selectedPlatforms: Array<string>,
    selectedCampaigns: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string
) {
    try {
        const selectValues = [];
        const whereValues = [];
        const groupByValues = [];

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

        selectValues.push("SUM(net_sales) AS net_sales");
        selectValues.push("is_assisted");
        selectValues.push("product_category");
        selectValues.push(`${getGranularityQuery(selectedGranularity, "date")} AS date`);

        whereValues.push("cancelled = 'No'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push("is_assisted");
        groupByValues.push("product_category");
        groupByValues.push(getGranularityQuery(selectedGranularity, "date"));

        const query = `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    shopify_sales_to_source_with_information
                WHERE
                    ${joinValues(whereValues, " AND ")}
                GROUP BY
                    ${joinValues(groupByValues, ", ")}
                ORDER BY
                    date
            `;

        const result = await execute(query);

        const temp = {
            metaQuery: query,
            rows: result.rows.map((row) => ({
                date: dateToMediumEnFormat(row.date),
                netSales: parseFloat(row.net_sales),
                isAssisted: row.is_assisted,
                category: row.product_category,
            })),
        };

        return temp;
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_adsData(
    selectedCategories: Array<string>,
    selectedProducts: Array<string>,
    selectedPlatforms: Array<string>,
    selectedCampaigns: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string
) {
    try {
        const selectValues = [];
        const whereValues = [];
        const groupByValues = [];

        if (selectedCategories.length > 0) {
            whereValues.push(`category IN (${joinValues(selectedCategories, ", ", "'")})`);
            groupByValues.push("category");
        }

        // if (selectedProducts.length > 0) {
        //     groupByValues.push("source_information_category");
        // }

        if (selectedPlatforms.length > 0) {
            whereValues.push(`platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
            groupByValues.push("source_information_platform");
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
            groupByValues.push("source_information_campaign_name");
        }

        selectValues.push("SUM(amount_spent) AS amount_spent");
        selectValues.push(`${getGranularityQuery(selectedGranularity, "date")} AS date`);
        selectValues.push("campaign_name");
        selectValues.push("platform");

        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push(getGranularityQuery(selectedGranularity, "date"));
        groupByValues.push("campaign_name");
        groupByValues.push("platform");

        const query = `
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
            `;

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map((row) => ({
                date: dateToMediumEnFormat(row.date),
                amountSpent: parseFloat(row.amount_spent),
                platform: row.platform,
                campaignName: row.campaign_name,
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}
