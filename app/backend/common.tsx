import {execute} from "~/backend/utilities/databaseManager.server";

export type ProductInformation = {
    productName: string;
    category: string;
    subCategory: string;
};

export async function getProductLibrary(): Promise<Array<ProductInformation>> {
    // TODO: Authentication
    const result = await execute(
        `
            SELECT
                *
            FROM
                product_library
        `
    );

    return result.rows.map((row) => rowToProductInformation(row));
}

function rowToProductInformation(row: any): ProductInformation {
    // TODO: Change row naming
    const productInformation = {
        productName: row.product_name,
        category: row.product_category,
        subCategory: row.product_sub_category,
    };

    return productInformation;
}

// TODO: Rename
export type SourceInformation = {
    source: string;
    campaignName: string;
    category: string;
    platform: string;
};

export async function getCapturedUtmCampaignLibrary() {
    // TODO: Authentication
    const result = await execute(
        `
            SELECT
                *
            FROM
                captured_utm_campaign_library
        `
    );

    return result.rows.map((row) => rowToSourceInformation(row));
}

function rowToSourceInformation(row: any): SourceInformation {
    // TODO: Change row naming
    const sourceInformation = {
        source: row.source,
        campaignName: row.campaign_name,
        category: row.campaign_category,
        platform: row.campaign_platform,
    };

    return sourceInformation;
}
