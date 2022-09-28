import {execute} from "~/backend/utilities/databaseManager.server";

export async function getAllProductInformation() {
    // TODO: Authentication
    const result = await execute(
        `
            SELECT
                *
            FROM
                product_information
        `,
    );

    return result.rows.map(row => ({
        productName: row.product_name,
        category: row.category,
        subCategory: row.sub_category,
    }));
}

export async function getAllSourceToInformation() {
    // TODO: Authentication
    const result = await execute(
        `
            SELECT
                *
            FROM
                source_to_information
        `,
    );

    return result.rows.map(row => ({
        source: row.source,
        campaignName: row.campaign_name,
        category: row.category,
        platform: row.platform,
    }));
}
