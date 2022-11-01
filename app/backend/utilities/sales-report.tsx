import {execute} from "~/backend/utilities/databaseManager.server";
import {dateToMediumEnFormat} from "~/utilities/utilities";
import {getGranularityQuery, joinValues} from "~/backend/utilities/utilities";
import {QueryFilterType} from "~/utilities/typeDefinitions";


export async function get_shopifyInsights(
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
        selectValues.push("SUM(net_quantity) AS net_quantity");
        selectValues.push("product_category");
        selectValues.push(`${getGranularityQuery(selectedGranularity, "date")} AS date`);
        // selectValues.push("source_information_platform");
        // selectValues.push("is_assisted");
        // selectValues.push("source");

        whereValues.push("cancelled = 'No'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push(getGranularityQuery(selectedGranularity, "date"));
        groupByValues.push("product_category");
        // groupByValues.push("is_assisted");
        // groupByValues.push("source");

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
                netQuantity: row.net_quantity,
                grossRevenue: row.net_sales,
                category: row.product_category
                // count: parseInt(row.count),
                // netSales: parseFloat(row.net_sales),
                // sourcePlatform: row.source_information_platform,
                // isAssisted: row.is_assisted,
                // source: row.source,
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}