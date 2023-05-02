import {execute} from "~/backend/utilities/databaseManager.server";
import {Companies, Uuid} from "~/utilities/typeDefinitions";

export type ProductInformation = {
    productName: string;
    category: string;
    subCategory: string;
};

export async function getProductLibrary(companyId: Uuid): Promise<Array<ProductInformation>> {
    // TODO: Authentication
    const result = await execute(
        Companies.IntellsysRaw,
        `
            SELECT
                product_name,
                product_category,
                product_sub_category
            FROM
                product_library
        `,
    );

    return result.rows.map((row) => rowToProductInformation(row));
}

function rowToProductInformation(row: unknown): ProductInformation {
    // TODO: Change row naming
    const productInformation = {
        productName: row.product_name,
        category: row.product_category,
        subCategory: row.product_sub_category,
    };

    return productInformation;
}

export type CampaignInformation = {
    campaignName: string;
    category: string;
    platform: string;
};

export async function getCampaignLibrary(companyId: Uuid) {
    // TODO: Authentication
    const result = await execute(
        Companies.IntellsysRaw,
        `
            SELECT
                campaign_name,
                campaign_category,
                campaign_platform
            FROM
                campaign_library
        `,
    );

    return result.rows.map((row) => rowToCampaignInformation(row));
}

function rowToCampaignInformation(row: unknown): CampaignInformation {
    // TODO: Change row naming
    const campaignInformation = {
        campaignName: row.campaign_name,
        category: row.campaign_category,
        platform: row.campaign_platform,
    };

    return campaignInformation;
}
