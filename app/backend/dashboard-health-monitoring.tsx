import type {Uuid} from "~/utilities/typeDefinitions";

export type CampaignLibraryRow = {
    campaignName: string;
    campaignPlatform: string;
    campaignCategory: string;
};

export async function getMissingCampaigns(companyId: Uuid): Promise<Array<CampaignLibraryRow>> {
    const query = `
        SELECT DISTINCT
            campaign_name,
            'Facebook' AS campaign_platform,
            NULL AS campaign_category
        FROM
            facebook_ads_with_information
        WHERE
            campaign_platform IS NULL AND
            campaign_category IS NULL
        UNION
        SELECT DISTINCT
            campaign AS campaign_name,
            'Google' AS platform,
            NULL AS campaign_category
        FROM
            google_ads_with_information
        WHERE
            campaign_platform IS NULL AND
            campaign_category IS NULL
    `;

    // TODO: Comment out or delete old files
    const result = await execute(query);

    return result.rows.map((row) => rowToCampaignLibraryRow(row));
}

function rowToCampaignLibraryRow(row: unknown): CampaignLibraryRow {
    const campaignLibraryRow: CampaignLibraryRow = {
        campaignName: row.campaign_name ?? "[NULL]",
        campaignPlatform: row.campaign_platform ?? "[NULL]",
        campaignCategory: row.campaign_category ?? "[NULL]",
    };

    return campaignLibraryRow;
}

// export async function getMissingCampaignNamesFromFacebookAds() {
//     try {
//         const query = (
//             `
//                 SELECT DISTINCT
//                     campaign_name
//                 FROM
//                     facebook_ads_with_information
//                 WHERE
//                     category IS NULL AND
//                     platform IS NULL
//             `
//         );

//         const result = await execute(query);

//         return {
//             metaQuery: query,
//             rows: result.rows.map(row =>({
//                 campaignName: row.campaign_name,
//             })),
//         };
//     } catch (e) {
//         console.log("Error executing function");
//         console.trace();
//         return "?";
//     }
// }

// export async function getMissingCampaignNamesFromGoogleAds() {
//     try {
//         const query = (
//             `
//                 SELECT DISTINCT
//                     campaign
//                 FROM
//                     google_ads_with_information
//                 WHERE
//                     category IS NULL AND
//                     platform IS NULL
//             `
//         );

//         const result = await execute(query);

//         return {
//             metaQuery: query,
//             rows: result.rows.map(row =>({
//                 campaignName: row.campaign,
//             })),
//         };
//     } catch (e) {
//         console.log("Error executing function");
//         console.trace();
//         return "?";
//     }
// }

export type ProductLibraryRow = {
    productName: string;
    productCategory: string;
    productSubCategory: string;
};

export async function getMissingProducts(companyId: Uuid): Promise<Array<ProductLibraryRow>> {
    const query = `
        SELECT DISTINCT
            product_title,
            NULL AS product_category,
            NULL AS product_sub_category
        FROM
            shopify_sales_to_source_with_information
        WHERE
            product_title IS NOT NULL AND
            product_category IS NULL AND
            product_sub_category IS NULL
    `;

    const result = await execute(companyId, query);

    return result.rows.map((row) => rowToProductLibraryRow(row));
}

function rowToProductLibraryRow(row: unknown): ProductLibraryRow {
    const productLibraryRow: ProductLibraryRow = {
        productName: row.product_title ?? "[NULL]",
        productCategory: row.product_category ?? "[NULL]",
        productSubCategory: row.product_sub_category ?? "[NULL]",
    };

    return productLibraryRow;
}

// export async function getMissingProductDetailsFromShopifySalesToSourceWithInformation() {
//     try {
//         const query = (
//             `
//                 SELECT DISTINCT
//                     product_title
//                 FROM
//                     shopify_sales_to_source_with_information
//                 WHERE
//                     product_category IS NULL AND
//                     product_sub_category IS NULL
//             `
//         );

//         const result = await execute(query);

//         return {
//             metaQuery: query,
//             rows: result.rows.map(row =>({
//                 productName: row.product_title,
//             })),
//         };
//     } catch (e) {
//         console.log("Error executing function");
//         console.trace();
//         return "?";
//     }
// }

export type CapturedUtmCampaignToCampaignNameRow = {
    capturedUtmCampaign: string;
    campaignName: string;
};

export async function getMissingSources(companyId: Uuid): Promise<Array<CapturedUtmCampaignToCampaignNameRow>> {
    const query = `
        SELECT DISTINCT
            lead_generation_source AS captured_utm_campaign,
            NULL AS campaign_name
        FROM
            shopify_sales_to_source_with_information
        WHERE
            lead_generation_source_campaign_name IS NULL AND
            lead_generation_source_campaign_category IS NULL AND
            lead_generation_source_campaign_platform IS NULL
        UNION
        SELECT DISTINCT
            lead_generation_source AS captured_utm_campaign,
            NULL AS campaign_name
        FROM
            freshsales_leads_to_source_with_information
        WHERE
            lead_generation_source_campaign_name IS NULL AND
            lead_generation_source_campaign_category IS NULL AND
            lead_generation_source_campaign_platform IS NULL
    `;

    const result = await execute(companyId, query);

    return result.rows.map((row) => rowToCapturedUtmCampaignToCampaignNameRow(row));
}

function rowToCapturedUtmCampaignToCampaignNameRow(row: unknown): CapturedUtmCampaignToCampaignNameRow {
    const capturedUtmCampaignToCampaignNameRow: CapturedUtmCampaignToCampaignNameRow = {
        capturedUtmCampaign: row.captured_utm_campaign ?? "[NULL]",
        campaignName: row.campaign_name ?? "[NULL]",
    };

    return capturedUtmCampaignToCampaignNameRow;
}

// export async function getMissingSourceDetailsFromShopifySalesToSourceWithInformation() {
//     try {
//         const query = (
//             `
//                 SELECT DISTINCT
//                     source
//                 FROM
//                     shopify_sales_to_source_with_information
//                 WHERE
//                     source_information_campaign_name IS NULL AND
//                     source_information_category IS NULL
//                     AND source_information_platform IS NULL
//             `
//         );

//         const result = await execute(query);

//         return {
//             metaQuery: query,
//             rows: result.rows.map(row =>({
//                 source: row.source,
//             })),
//         };
//     } catch (e) {
//         console.log("Error executing function");
//         console.trace();
//         return "?";
//     }
// }

// export async function getMissingSourceDetailsFromFreshsalesLeadsToSourceWithInformation() {
//     try {
//         const query = (
//             `
//                 SELECT DISTINCT
//                     source
//                 FROM
//                     freshsales_leads_to_source_with_information
//                 WHERE
//                     source_information_campaign_name IS NULL AND
//                     source_information_category IS NULL
//                     AND source_information_platform IS NULL
//             `
//         );

//         const result = await execute(query);

//         return {
//             metaQuery: query,
//             rows: result.rows.map(row =>({
//                 source: row.source,
//             })),
//         };
//     } catch (e) {
//         console.log("Error executing function");
//         console.trace();
//         return "?";
//     }
// }
