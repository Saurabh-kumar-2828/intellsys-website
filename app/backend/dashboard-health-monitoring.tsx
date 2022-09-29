import {execute} from "~/backend/utilities/databaseManager.server";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

export async function getMissingCampaigns() {
    try {
        const query = (
            `
                SELECT DISTINCT
                    campaign_name,
                    'Facebook' AS platform
                FROM
                    facebook_ads_with_information
                WHERE
                    category IS NULL AND
                    platform IS NULL
                UNION
                SELECT DISTINCT
                    campaign AS campaign_name,
                    'Google' AS platform
                FROM
                    google_ads_with_information
                WHERE
                    category IS NULL AND
                    platform IS NULL
            `
        );

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map(row =>({
                campaignName: row.campaign_name,
                platform: row.platform,
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
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

export async function getMissingProducts() {
    try {
        const query = (
            `
                SELECT DISTINCT
                    product_title
                FROM
                    shopify_sales_to_source_with_information
                WHERE
                    product_category IS NULL AND
                    product_sub_category IS NULL
            `
        );

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map(row =>({
                productName: row.product_title,
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
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

export async function getMissingSources() {
    try {
        const query = (
            `
                SELECT DISTINCT
                    source
                FROM
                    shopify_sales_to_source_with_information
                WHERE
                    source_information_campaign_name IS NULL AND
                    source_information_category IS NULL
                    AND source_information_platform IS NULL
                UNION
                SELECT DISTINCT
                    source
                FROM
                    freshsales_leads_to_source_with_information
                WHERE
                    source_information_campaign_name IS NULL AND
                    source_information_category IS NULL
                    AND source_information_platform IS NULL
            `
        );

        const result = await execute(query);

        return {
            metaQuery: query,
            rows: result.rows.map(row =>({
                source: row.source,
            })),
        };
    } catch (e) {
        console.log("Error executing function");
        console.trace();
        return "?";
    }
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
