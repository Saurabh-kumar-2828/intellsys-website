import type {LoaderFunction, MetaFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Link, useLoaderData, useMatches} from "@remix-run/react";
import {PlusCircle} from "react-bootstrap-icons";
import {getConnectorsAssociatedWithCompanyId} from "~/backend/utilities/connectors/common.server";
import type {Connector} from "~/backend/utilities/connectors/googleOAuth.server";
import {getSummarizedViewOfFacebookAdsConnector, getSummarizedViewOfGoogleAdsConnector, getSummarizedViewOfGoogleAnalyticsConnector} from "~/backend/utilities/temporary.server";
import {PageScaffold} from "~/components/pageScaffold";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {VerticalSpacer} from "~/global-common-typescript/components/verticalSpacer";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import type {CompanyLoaderData} from "~/routes/$companyId";
import {ConnectorType} from "~/utilities/typeDefinitions";
import {getSingletonValue} from "~/utilities/utilities";

type LoaderData = {
    googleAdsConnectorsWithDetails: Array<{
        connector: Connector;
        spends: number;
        impressions: number;
        clicks: number;
    }>;
    facebookAdsConnectorsWithDetails: Array<{
        connector: Connector;
        spends: number;
        impressions: number;
        clicks: number;
    }>;
    googleAnalyticsConnectorsWithDetails: Array<{
        connector: Connector;
        sessions: number;
    }>;
};

export const loader: LoaderFunction = async ({request, params}) => {
    // TODO: Ensure companyId is valid

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const googleAdsConnectors = await getConnectorsAssociatedWithCompanyId(getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.GoogleAds));
    if (googleAdsConnectors instanceof Error) {
        return googleAdsConnectors;
    }
    const googleAdsConnectorsWithDetails: Array<{
        connector: Connector;
        spends: number;
        impressions: number;
        clicks: number;
    }> = [];
    for (const googleAdsConnector of googleAdsConnectors) {
        const summary = await getSummarizedViewOfGoogleAdsConnector(googleAdsConnector);
        if (summary instanceof Error) {
            throw summary;
        }
        googleAdsConnectorsWithDetails.push({
            connector: googleAdsConnector,
            ...summary,
        });
    }

    const facebookAdsConnectors = await getConnectorsAssociatedWithCompanyId(getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.FacebookAds));
    if (facebookAdsConnectors instanceof Error) {
        return facebookAdsConnectors;
    }
    const facebookAdsConnectorsWithDetails: Array<{
        connector: Connector;
        spends: number;
        impressions: number;
        clicks: number;
    }> = [];
    for (const facebookAdsConnector of facebookAdsConnectors) {
        const summary = await getSummarizedViewOfFacebookAdsConnector(facebookAdsConnector);
        if (summary instanceof Error) {
            throw summary;
        }
        facebookAdsConnectorsWithDetails.push({
            connector: facebookAdsConnector,
            ...summary,
        });
    }

    const googleAnalyticsConnectors = await getConnectorsAssociatedWithCompanyId(getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.GoogleAnalytics));
    if (googleAnalyticsConnectors instanceof Error) {
        return googleAnalyticsConnectors;
    }
    const googleAnalyticsConnectorsWithDetails: Array<{
        connector: Connector;
        sessions: number;
    }> = [];
    for (const googleAnalyticsConnector of googleAnalyticsConnectors) {
        const summary = await getSummarizedViewOfGoogleAnalyticsConnector(googleAnalyticsConnector);
        if (summary instanceof Error) {
            throw summary;
        }
        googleAnalyticsConnectorsWithDetails.push({
            connector: googleAnalyticsConnector,
            ...summary,
        });
    }

    const loaderData: LoaderData = {
        googleAdsConnectorsWithDetails: googleAdsConnectorsWithDetails,
        facebookAdsConnectorsWithDetails: facebookAdsConnectorsWithDetails,
        googleAnalyticsConnectorsWithDetails: googleAnalyticsConnectorsWithDetails,
    };

    return json(loaderData);
};

export const meta: MetaFunction = () => {
    return {
        title: "Intellsys",
    };
};

export default function () {
    const {googleAdsConnectorsWithDetails, facebookAdsConnectorsWithDetails, googleAnalyticsConnectorsWithDetails} = useLoaderData() as LoaderData;

    const routeMatches = useMatches();
    const {user, accessibleCompanies, currentCompany} = getSingletonValue(routeMatches.filter((routeMatch) => routeMatch.id == "routes/$companyId")).data as CompanyLoaderData;

    return (
        <PageScaffold
            user={user}
            accessibleCompanies={accessibleCompanies}
            currentCompany={currentCompany}
        >
            <div className="tw-min-h-full tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
                <div className="tw-col-span-12 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-y-4">
                    {googleAdsConnectorsWithDetails.length == 0 && facebookAdsConnectorsWithDetails.length == 0 && googleAnalyticsConnectorsWithDetails.length == 0 ? (
                        <div>
                            <Link
                                to={`/${currentCompany.id}/data-sources`}
                                className="tw-flex tw-flex-col tw-items-center tw-gap-y-4"
                            >
                                <PlusCircle className="tw-w-16 tw-h-16 tw-text-green-500" />
                                Add your first data source to get started!
                            </Link>
                        </div>
                    ) : (
                        <div className="tw-w-full tw-flex tw-flex-col tw-gap-y-4 tw-max-w-2xl">
                            <ItemBuilder
                                items={googleAdsConnectorsWithDetails}
                                itemBuilder={(googleAdsConnectorWithDetails) => (
                                    <GoogleAdsSummaryCard
                                        connector={googleAdsConnectorWithDetails.connector}
                                        spends={googleAdsConnectorWithDetails.spends}
                                        impressions={googleAdsConnectorWithDetails.impressions}
                                        clicks={googleAdsConnectorWithDetails.clicks}
                                    />
                                )}
                            />

                            <ItemBuilder
                                items={facebookAdsConnectorsWithDetails}
                                itemBuilder={(facebookAdsConnectorWithDetails) => <div>Facebook ads: {facebookAdsConnectorWithDetails.id}</div>}
                            />

                            <ItemBuilder
                                items={googleAnalyticsConnectorsWithDetails}
                                itemBuilder={(googleAnalyticsConnectorWithDetails) => <div>Google analytics: {googleAnalyticsConnectorWithDetails.id}</div>}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PageScaffold>
    );
}

function GoogleAdsSummaryCard({connector, spends, impressions, clicks}: {connector: Connector; spends: number; impressions: number; clicks: number}) {
    return (
        <div className="tw-w-full tw-bg-gray-800 tw-grid tw-grid-cols-3 tw-items-center tw-p-4 tw-rounded-lg">
            <div className="tw-col-span-3">Google Ads: {connector.accountId}</div>

            <VerticalSpacer className="tw-col-span-3 tw-h-4" />

            <div className="tw-text-center">
                <div>Spends</div>
                <div>{spends}</div>
            </div>

            <div className="tw-text-center">
                <div>Impressions</div>
                <div>{impressions}</div>
            </div>

            <div className="tw-text-center">
                <div>Clicks</div>
                <div>{clicks}</div>
            </div>
        </div>
    );
}
