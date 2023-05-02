import type {LoaderFunction, MetaFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {Companies} from "~/utilities/typeDefinitions";
import {CampaignLibraryRow, CapturedUtmCampaignToCampaignNameRow, getMissingCampaigns, getMissingProducts, getMissingSources, ProductLibraryRow} from "~/backend/dashboard-health-monitoring";
import {GenericCard, SectionHeader} from "~/components/scratchpad";

export const meta: MetaFunction = () => {
    return {
        title: "Dashboard Health Monitoring - Intellsys",
    };
};

type LoaderData = {
    missingCampaigns: Array<CampaignLibraryRow>;
    missingProducts: Array<ProductLibraryRow>;
    missingSources: Array<CapturedUtmCampaignToCampaignNameRow>;
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;
    // Get companyId
    // const companyId = urlSearchParams.get("company_id");

    // For test purpose
    const companyId = Companies.livpure;
    const loaderData: LoaderData = {
        missingCampaigns: await getMissingCampaigns(companyId),
        // missingCampaignNamesFromFacebookAds: await getMissingCampaignNamesFromFacebookAds(),
        // missingCampaignNamesFromGoogleAds: await getMissingCampaignNamesFromGoogleAds(),
        missingProducts: await getMissingProducts(companyId),
        // missingProductDetailsFromShopifySalesToSourceWithInformation: await getMissingProductDetailsFromShopifySalesToSourceWithInformation(),
        missingSources: await getMissingSources(companyId),
        // missingSourceDetailsFromShopifySalesToSourceWithInformation: await getMissingSourceDetailsFromShopifySalesToSourceWithInformation(),
        // missingSourceDetailsFromFreshsalesLeadsToSourceWithInformation: await getMissingSourceDetailsFromFreshsalesLeadsToSourceWithInformation(),
    };

    return json(loaderData);
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
    } = useLoaderData() as LoaderData;

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <SectionHeader label="Campaigns with Missing Information" />

            <GenericCard
                content={
                    missingCampaigns.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Campaign Name</th>
                                <th className="tw-px-4 tw-text-center">Platform</th>
                                <th className="tw-px-4 tw-text-center">Category</th>
                            </tr>
                            {missingCampaigns.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.campaignName}</td>
                                    <td className="tw-text-center">{row.campaignPlatform}</td>
                                    <td className="tw-text-center">?</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
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

            <SectionHeader label="Products with Missing Information" />

            <GenericCard
                content={
                    missingProducts.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Product Name</th>
                                <th className="tw-px-4 tw-text-center">Category</th>
                                <th className="tw-px-4 tw-text-center">Sub-Category</th>
                            </tr>
                            {missingProducts.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.productName}</td>
                                    <td className="tw-text-center">?</td>
                                    <td className="tw-text-center">?</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
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

            <SectionHeader label="Unmapped utm_campaign" />

            <GenericCard
                content={
                    missingSources.length == 0 ? (
                        <div>Everything working as expected</div>
                    ) : (
                        <table>
                            <tr>
                                <th className="tw-px-2">Source</th>
                                <th className="tw-px-4 tw-text-center">Campaign Name</th>
                            </tr>
                            {missingSources.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td>{row.capturedUtmCampaign}</td>
                                    <td className="tw-text-center">?</td>
                                </tr>
                            ))}
                        </table>
                    )
                }
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
