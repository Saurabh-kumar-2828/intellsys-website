import {execute} from "~/backend/utilities/databaseManager.server";
import {dateToMediumEnFormat} from "~/utilities/utilities";
import {getGranularityQuery, joinValues} from "~/backend/utilities/utilities";
import { QueryFilterType } from "~/utilities/typeDefinitions";

// TODO: Fix nomenclature

export async function get_r1_performanceLeadsCount(
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

        if (selectedPlatforms.length > 0) {
            whereValues.push(`source_information_platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`source_information_campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("COUNT(*) AS count");

        whereValues.push("source != 'Facebook Ads'");
        if (minDate != null) {
            whereValues.push(`DATE(lead_created_at) >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`DATE(lead_created_at) <= '${maxDate}'`);
        }

        const query = (
            `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    freshsales_leads_to_source_with_information
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
            metaFiltersPossible: [QueryFilterType.category, QueryFilterType.platform, QueryFilterType.campaign, QueryFilterType.date],
            metaFiltersApplied: [
                selectedCategories.length > 0 ? QueryFilterType.category : null,
                selectedPlatforms.length > 0 ? QueryFilterType.platform : null,
                selectedCampaigns.length > 0 ? QueryFilterType.campaign : null,
                minDate != null || maxDate != null ? QueryFilterType.date : null,
            ].filter(x => x != null),
            count: parseInt(row.count),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r1_facebookLeadsCount(
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

        if (selectedPlatforms.length > 0) {
            whereValues.push(`source_information_platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`source_information_campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("COUNT(*) AS count");

        whereValues.push("source = 'Facebook Ads'");
        if (minDate != null) {
            whereValues.push(`DATE(lead_created_at) >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`DATE(lead_created_at) <= '${maxDate}'`);
        }

        const query = (
            `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    freshsales_leads_to_source_with_information
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
            metaFiltersRespected: ["Categories", "Platforms", "Campaigns"],
            metaFiltersApplied: [
                selectedCategories.length > 0 ? "Categories" : null,
                selectedPlatforms.length > 0 ? "Platforms" : null,
                selectedCampaigns.length > 0 ? "Campaigns" : null,
            ].filter(x => x != null),
            count: parseInt(row.count),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r1_performanceLeadsAmountSpent(
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

        if (selectedPlatforms.length > 0) {
            whereValues.push(`platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("SUM(amount_spent) AS amount_spent");

        // On form fb leads
        //                 campaign_name != 'GJ_LeadGen_18May' AND -> WP
        // campaign_name != 'GJ_LeadGen_Mattress_10 May' AND -> Mattress

        whereValues.push("campaign_name NOT IN ('GJ_LeadGen_18May', 'GJ_LeadGen_Mattress_10 May', 'SOK/LSH_LeadGen_All_Int_InterestAudiences_India_20012022', 'Sok_LeadGen_Int_InterestAudience_04082021')");
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
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r1_facebookLeadsAmountSpent(
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

        if (selectedPlatforms.length > 0) {
            whereValues.push(`platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("SUM(amount_spent) AS amount_spent");

        whereValues.push("campaign_name IN ('GJ_LeadGen_18May', 'GJ_LeadGen_Mattress_10 May', 'SOK/LSH_LeadGen_All_Int_InterestAudiences_India_20012022', 'Sok_LeadGen_Int_InterestAudience_04082021')");
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
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r1_performanceLeadsSales(
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

        if (selectedProducts.length > 0) {
            whereValues.push(`product_title IN (${joinValues(selectedProducts, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`source_information_campaign_name IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("SUM(net_sales) AS net_sales");

        whereValues.push("source NOT IN ('GJ_LeadGen_18May', 'GJ_LeadGen_Mattress_10 May', 'SOK/LSH_LeadGen_All_Int_InterestAudiences_India_20012022', 'Sok_LeadGen_Int_InterestAudience_04082021')");
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
            netSales: parseFloat(row.net_sales),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r1_facebookLeadsSales(
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

        if (selectedProducts.length > 0) {
            whereValues.push(`product_title IN (${joinValues(selectedProducts, ", ", "'")})`);
        }

        if (selectedPlatforms.length > 0) {
            whereValues.push(`source_information_platform IN (${joinValues(selectedPlatforms, ", ", "'")})`);
        }

        if (selectedCampaigns.length > 0) {
            whereValues.push(`source_information_campaign IN (${joinValues(selectedCampaigns, ", ", "'")})`);
        }

        selectValues.push("SUM(net_sales) AS net_sales");

        whereValues.push("source NOT IN ('GJ_LeadGen_18May', 'GJ_LeadGen_Mattress_10 May', 'SOK/LSH_LeadGen_All_Int_InterestAudiences_India_20012022', 'Sok_LeadGen_Int_InterestAudience_04082021')");
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
            netSales: parseFloat(row.net_sales),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r1_performanceLeadsCountTrend(
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

        whereValues.push("source != 'Facebook Ads'");
        if (minDate != null) {
            whereValues.push(`DATE(lead_created_at) >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`DATE(lead_created_at) <= '${maxDate}'`);
        }

        groupByValues.push(getGranularityQuery(selectedGranularity, "lead_created_at"));

        const query = (
            `
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
            `
        );

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map(row => ({
                date: dateToMediumEnFormat(row.date),
                count: parseInt(row.count),
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r1_facebookLeadsCountTrend(
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

        whereValues.push("source = 'Facebook Ads'");
        if (minDate != null) {
            whereValues.push(`DATE(lead_created_at) >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`DATE(lead_created_at) <= '${maxDate}'`);
        }

        groupByValues.push(getGranularityQuery(selectedGranularity, "lead_created_at"));

        const query = (
            `
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
            `
        );

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map(row => ({
                date: dateToMediumEnFormat(row.date),
                count: parseInt(row.count),
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r2_directOrdersCount(
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
        whereValues.push("is_assisted = false");
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

export async function get_r2_assistedOrdersCount(
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
        whereValues.push("is_assisted = true");
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

export async function get_r2_r3_directOrdersGrossRevenue(
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

        selectValues.push("SUM(net_sales) AS net_sales");

        whereValues.push("cancelled = 'No'");
        whereValues.push("is_assisted = false");
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
            netSales: parseFloat(row.net_sales),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r2_r3_assistedOrdersGrossRevenue(
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

        selectValues.push("SUM(net_sales) AS net_sales");

        whereValues.push("cancelled = 'No'");
        whereValues.push("is_assisted = true");
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
            netSales: parseFloat(row.net_sales),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function r3_ordersRevenuePivotedByAssistAndBusiness(
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

        whereValues.push("cancelled = 'No'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push("is_assisted");
        groupByValues.push("product_category");

        const query = (
            `
                SELECT
                    ${joinValues(selectValues, ", ")}
                FROM
                    shopify_sales_to_source_with_information
                WHERE
                    ${joinValues(whereValues, " AND ")}
                GROUP BY
                    ${joinValues(groupByValues, ", ")}
            `
        );

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map(row => ({
                netSales: row.net_sales,
                isAssisted: row.is_assisted,
                category: row.product_category,
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r4_facebookAdsSpends(
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
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r4_googleAdsSpends(
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

        whereValues.push("platform = 'Google'");
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
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r4_facebookAdsLiveCampaignsCount(
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
        const havingValues = [];

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

        selectValues.push("COUNT(*) AS count");
        selectValues.push("campaign_name AS campaign_name");

        whereValues.push("platform = 'Facebook'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push("campaign_name");

        havingValues.push("SUM(amount_spent) > 0");

        const query = (
            `
                SELECT
                    COUNT(*)
                FROM
                    (
                        SELECT
                            ${joinValues(selectValues, ", ")}
                        FROM
                            ads_with_information
                        WHERE
                            ${joinValues(whereValues, " AND ")}
                        GROUP BY
                            ${joinValues(groupByValues, ", ")}
                        HAVING
                            ${joinValues(havingValues, ", ")}
                    ) AS _
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

export async function get_r4_googleAdsLiveCampaignsCount(
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
        const havingValues = [];

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

        selectValues.push("COUNT(*) AS count");
        selectValues.push("campaign_name AS campaign_name");

        whereValues.push("platform = 'Google'");
        if (minDate != null) {
            whereValues.push(`date >= '${minDate}'`);
        }
        if (maxDate != null) {
            whereValues.push(`date <= '${maxDate}'`);
        }

        groupByValues.push("campaign_name");

        havingValues.push("SUM(amount_spent) > 0");

        const query = (
            `
                SELECT
                    COUNT(*)
                FROM
                    (
                        SELECT
                            ${joinValues(selectValues, ", ")}
                        FROM
                            ads_with_information
                        WHERE
                            ${joinValues(whereValues, " AND ")}
                        GROUP BY
                            ${joinValues(groupByValues, ", ")}
                        HAVING
                            ${joinValues(havingValues, ", ")}
                    ) AS _
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

export async function get_r4_facebookAdsRevenue(
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

        if (selectedProducts.length > 0) {
            whereValues.push(`product_title IN (${joinValues(selectedProducts, ", ", "'")})`);
        }

        selectValues.push("SUM(net_sales) AS net_sales");

        whereValues.push("source_information_platform = 'Facebook'");
        // TODO: Ensure this does not mess up my other values
        whereValues.push("net_sales > 0");
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
            netSales: parseFloat(row.net_sales),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}

export async function get_r4_googleAdsRevenue(
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

        if (selectedProducts.length > 0) {
            whereValues.push(`product_title IN (${joinValues(selectedProducts, ", ", "'")})`);
        }

        selectValues.push("SUM(net_sales) AS net_sales");

        whereValues.push("source_information_platform = 'Google'");
        // TODO: Ensure this does not mess up my other values
        whereValues.push("net_sales > 0");
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
            netSales: parseFloat(row.net_sales),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
}
