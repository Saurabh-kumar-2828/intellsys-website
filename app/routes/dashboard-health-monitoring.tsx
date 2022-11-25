import type {MetaFunction, LoaderFunction, ActionFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {getMissingCampaigns, getMissingProducts, getMissingSources} from "~/backend/dashboard-health-monitoring";
import {Card, GenericCard} from "~/components/scratchpad";
import {dateToMediumNoneEnFormat, numberToHumanFriendlyString} from "~/utilities/utilities";
import {FileInputField} from "~/components/reusableComponents/fileInputField";
import {useState} from "react";
import {fullRefresh, Operation, processFileUpload, processTruncate, Table} from "~/backend/data-management";

export const meta: MetaFunction = () => {
    return {
        title: "Dashboard Health Monitoring - Intellsys",
    };
};

export const loader: LoaderFunction = async ({request}) => {
    return json({
        missingCampaigns: await getMissingCampaigns(),
        // missingCampaignNamesFromFacebookAds: await getMissingCampaignNamesFromFacebookAds(),
        // missingCampaignNamesFromGoogleAds: await getMissingCampaignNamesFromGoogleAds(),
        missingProducts: await getMissingProducts(),
        // missingProductDetailsFromShopifySalesToSourceWithInformation: await getMissingProductDetailsFromShopifySalesToSourceWithInformation(),
        missingSources: await getMissingSources(),
        // missingSourceDetailsFromShopifySalesToSourceWithInformation: await getMissingSourceDetailsFromShopifySalesToSourceWithInformation(),
        // missingSourceDetailsFromFreshsalesLeadsToSourceWithInformation: await getMissingSourceDetailsFromFreshsalesLeadsToSourceWithInformation(),
    });
};

export default function () {
    const {
        missingCampaigns,
        // missingCampaignNamesFromFacebookAds,
        // missingCampaignNamesFromGoogleAds,
        missingProducts,
        // missingProductDetailsFromShopifySalesToSourceWithInformation,
        missingSources,
        // missingSourceDetailsFromShopifySalesToSourceWithInformation,
        // missingSourceDetailsFromFreshsalesLeadsToSourceWithInformation,
    } = useLoaderData();

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <GenericCard
                content={
                    missingCampaigns.rows.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Campaign Name</th>
                                <th className="tw-px-4 tw-text-center">Category</th>
                                <th className="tw-px-4 tw-text-center">Platform</th>
                            </tr>
                            {missingCampaigns.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.campaignName}</td>
                                    <td className="tw-text-center">?</td>
                                    <td className="tw-text-center">{row.platform}</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
                label="Campaigns with Missing Information"
                metaQuery={missingCampaigns.metaQuery}
                className="tw-col-span-12"
            />

            {/* <GenericCard
                content={
                    missingCampaignNamesFromFacebookAds.rows.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Campaign Name</th>
                                <th className="tw-px-4 tw-text-center">Category</th>
                                <th className="tw-px-4 tw-text-center">Platform</th>
                            </tr>
                            {missingCampaignNamesFromFacebookAds.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.campaignName}</td>
                                    <td className="tw-text-center">?</td>
                                    <td className="tw-text-center">Facebook</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
                label="Facebook Ads - Unmapped Campaigns"
                metaQuery={missingCampaignNamesFromFacebookAds.metaQuery}
                className="tw-col-span-12"
            />

            <GenericCard
                content={
                    missingCampaignNamesFromGoogleAds.rows.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Campaign Name</th>
                                <th className="tw-px-4 tw-text-center">Category</th>
                                <th className="tw-px-4 tw-text-center">Platform</th>
                            </tr>
                            {missingCampaignNamesFromGoogleAds.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.campaignName}</td>
                                    <td className="tw-text-center">?</td>
                                    <td className="tw-text-center">Google</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
                label="Google Ads - Unmapped Campaigns"
                metaQuery={missingCampaignNamesFromGoogleAds.metaQuery}
                className="tw-col-span-12"
            /> */}

            <GenericCard
                content={
                    missingProducts.rows.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Product Name</th>
                                <th className="tw-px-4 tw-text-center">Category</th>
                                <th className="tw-px-4 tw-text-center">Sub-Category</th>
                            </tr>
                            {missingProducts.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.productName}</td>
                                    <td className="tw-text-center">?</td>
                                    <td className="tw-text-center">?</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
                label="Products with Missing Information"
                metaQuery={missingProducts.metaQuery}
                className="tw-col-span-12"
            />

            {/* <GenericCard
                content={
                    missingProductDetailsFromShopifySalesToSourceWithInformation.rows.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Product Name</th>
                                <th className="tw-px-4 tw-text-center">Category</th>
                                <th className="tw-px-4 tw-text-center">Sub-Category</th>
                            </tr>
                            {missingProductDetailsFromShopifySalesToSourceWithInformation.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.productName}</td>
                                    <td className="tw-text-center">?</td>
                                    <td className="tw-text-center">?</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
                label="Shopify Sales - Unmapped Products"
                metaQuery={missingProductDetailsFromShopifySalesToSourceWithInformation.metaQuery}
                className="tw-col-span-12"
            /> */}

            <GenericCard
                content={
                    missingSources.rows.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Source</th>
                                <th className="tw-px-4 tw-text-center">Campaign Name</th>
                            </tr>
                            {missingSources.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.source}</td>
                                    <td className="tw-text-center">?</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
                label="Sources with Missing Information"
                metaQuery={missingSources.metaQuery}
                className="tw-col-span-12"
            />

            {/* <GenericCard
                content={
                    missingSourceDetailsFromShopifySalesToSourceWithInformation.rows.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Source</th>
                                <th className="tw-px-4 tw-text-center">Campaign Name</th>
                            </tr>
                            {missingSourceDetailsFromShopifySalesToSourceWithInformation.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.source}</td>
                                    <td className="tw-text-center">?</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
                label="Shopify Sales - Unmapped Sources"
                metaQuery={missingSourceDetailsFromShopifySalesToSourceWithInformation.metaQuery}
                className="tw-col-span-12"
            />

            <GenericCard
                content={
                    missingSourceDetailsFromFreshsalesLeadsToSourceWithInformation.rows.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Source</th>
                                <th className="tw-px-4 tw-text-center">Campaign Name</th>
                            </tr>
                            {missingSourceDetailsFromFreshsalesLeadsToSourceWithInformation.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.source}</td>
                                    <td className="tw-text-center">?</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
                label="Shopify Sales - Unmapped Sources"
                metaQuery={missingSourceDetailsFromFreshsalesLeadsToSourceWithInformation.metaQuery}
                className="tw-col-span-12"
            /> */}
        </div>
    );
}
