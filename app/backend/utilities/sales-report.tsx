import {execute} from "~/backend/utilities/databaseManager.server";
import {dateToMediumNoneEnFormat} from "~/utilities/utilities";
import {getGranularityQuery, joinValues} from "~/backend/utilities/utilities";
import {QueryFilterType} from "~/utilities/typeDefinitions";

export async function get_shopifyInsights(
    // selectedCategories: Array<string>,
    // selectedProducts: Array<string>,
    selectedGranularity: string,
    minDate: string,
    maxDate: string
) {
    try {
        const selectValues = [];
        const whereValues = [];
        const groupByValues = [];

        // if (selectedCategories.length > 0) {
        //     whereValues.push(`product_category IN (${joinValues(selectedCategories, ", ", "'")})`);
        //     groupByValues.push("category");
        // }

        // if (selectedProducts.length > 0) {
        //     whereValues.push(`product_title IN (${joinValues(selectedProducts, ", ", "'")})`);
        //     groupByValues.push("source_information_platform");
        // }

        selectValues.push("SUM(net_sales) AS net_sales");
        selectValues.push("SUM(net_quantity) AS net_quantity");
        selectValues.push("product_category");
        selectValues.push("product_sub_category");
        selectValues.push("product_title");
        selectValues.push("variant_title");
        selectValues.push(`${getGranularityQuery(selectedGranularity, "date")} AS date`);

        whereValues.push("cancelled = 'No'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push(getGranularityQuery(selectedGranularity, "date"));
        groupByValues.push("product_sub_category");
        groupByValues.push("product_category");
        groupByValues.push("product_title");
        groupByValues.push("variant_title");

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
                date: dateToMediumNoneEnFormat(row.date),
                netQuantity: parseInt(row.net_quantity),
                grossRevenue: row.net_sales,
                category: row.product_category,
                subCategory: row.product_sub_category,
                productTitle: row.product_title,
                variantTitle: row.variant_title,
                netSales: parseFloat(row.net_sales),
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}
