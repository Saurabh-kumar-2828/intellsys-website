import type {LoaderFunction, MetaFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Link, useLoaderData, useMatches} from "@remix-run/react";
import {PlusCircle} from "react-bootstrap-icons";
import {getConnectorsAssociatedWithCompanyId} from "~/backend/utilities/connectors/common.server";
import type {Connector} from "~/backend/utilities/connectors/googleOAuth.server";
import {getSummarizedViewOfFacebookAdsConnector, getSummarizedViewOfGoogleAdsConnector, getSummarizedViewOfGoogleAnalyticsConnector} from "~/backend/utilities/temporary.server";
import {PageScaffold} from "~/components/pageScaffold";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {SectionHeader} from "~/components/scratchpad";
import {VerticalSpacer} from "~/global-common-typescript/components/verticalSpacer";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import type {CompanyLoaderData} from "~/routes/$companyId";
import {Company, ConnectorType, DataSourceIds, User} from "~/utilities/typeDefinitions";
import {getSingletonValue, getTagFromEmail} from "~/utilities/utilities";

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
            <CompanyHome
                user={user}
                accessibleCompanies={accessibleCompanies}
                currentCompany={currentCompany}
                googleAdsConnectorsWithDetails={googleAdsConnectorsWithDetails}
                facebookAdsConnectorsWithDetails={facebookAdsConnectorsWithDetails}
                googleAnalyticsConnectorsWithDetails={googleAnalyticsConnectorsWithDetails}
            />
        </PageScaffold>
    );
}

function CompanyHome({user, accessibleCompanies, currentCompany, googleAdsConnectorsWithDetails, facebookAdsConnectorsWithDetails, googleAnalyticsConnectorsWithDetails}: {
    user: User;
    accessibleCompanies: Array<Company>;
    currentCompany: Company;
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
}) {
    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-font-2rem tw-font-bold">
                Welcome back, {getTagFromEmail(user.email)}!
            </div>

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
                    <div className="tw-w-full tw-flex tw-flex-col tw-gap-y-4 tw-max-w-2xl tw-mr-auto">
                        <ItemBuilder
                            items={googleAdsConnectorsWithDetails}
                            itemBuilder={(connectorWithDetails, connectorWithDetailsIndex) => (
                                <GoogleAdsSummaryCard
                                    currentCompany={currentCompany}
                                    connector={connectorWithDetails.connector}
                                    spends={connectorWithDetails.spends}
                                    impressions={connectorWithDetails.impressions}
                                    clicks={connectorWithDetails.clicks}
                                    key={connectorWithDetailsIndex}
                                />
                            )}
                        />

                        <ItemBuilder
                            items={facebookAdsConnectorsWithDetails}
                            itemBuilder={(connectorWithDetails, connectorWithDetailsIndex) => (
                                <FacebookAdsSummaryCard
                                    currentCompany={currentCompany}
                                    connector={connectorWithDetails.connector}
                                    spends={connectorWithDetails.spends}
                                    impressions={connectorWithDetails.impressions}
                                    clicks={connectorWithDetails.clicks}
                                    key={connectorWithDetailsIndex}
                                />
                            )}
                        />

                        <ItemBuilder
                            items={googleAnalyticsConnectorsWithDetails}
                            itemBuilder={(connectorWithDetails, connectorWithDetailsIndex) => (
                                <GoogleAnalyticsSummaryCard
                                    currentCompany={currentCompany}
                                    connector={connectorWithDetails.connector}
                                    sessions={connectorWithDetails.sessions}
                                    key={connectorWithDetailsIndex}
                                />
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function GoogleAdsSummaryCard({currentCompany, connector, spends, impressions, clicks}: {currentCompany: Company, connector: Connector; spends: number; impressions: number; clicks: number}) {
    return (
        <div className="tw-w-full tw-bg-gray-800 tw-grid tw-grid-cols-3 tw-items-center tw-p-4 tw-rounded-lg">
            <Link to={`/${currentCompany.id}/${DataSourceIds.googleAds}/${connector.id}`} className="tw-col-span-3">Google Ads: {connector.extraInformation.accountName} ({connector.extraInformation.accountId})</Link>

            {/* <VerticalSpacer className="tw-col-span-3 tw-h-4" />

            <div className="tw-text-center">
                <div className="tw-text-[1.5rem] tw-font-bold">{spends}</div>
                <div>Spends</div>
            </div>

            <div className="tw-text-center">
                <div className="tw-text-[1.5rem] tw-font-bold">{impressions}</div>
                <div>Impressions</div>
            </div>

            <div className="tw-text-center">
                <div className="tw-text-[1.5rem] tw-font-bold">{clicks}</div>
                <div>Clicks</div>
            </div> */}
        </div>
    );
}

function FacebookAdsSummaryCard({currentCompany, connector, spends, impressions, clicks}: {currentCompany: Company, connector: Connector; spends: number; impressions: number; clicks: number}) {
    return (
        <div className="tw-w-full tw-bg-gray-800 tw-grid tw-grid-cols-3 tw-items-center tw-p-4 tw-rounded-lg">
            <Link to={`/${currentCompany.id}/${DataSourceIds.facebookAds}/${connector.id}`} className="tw-col-span-3">Facebook Ads: {connector.extraInformation.accountName} ({connector.extraInformation.accountId})</Link>

            {/* <VerticalSpacer className="tw-col-span-3 tw-h-4" />

            <div className="tw-text-center">
                <div className="tw-text-[1.5rem] tw-font-bold">{spends}</div>
                <div>Spends</div>
            </div>

            <div className="tw-text-center">
                <div className="tw-text-[1.5rem] tw-font-bold">{impressions}</div>
                <div>Impressions</div>
            </div>

            <div className="tw-text-center">
                <div className="tw-text-[1.5rem] tw-font-bold">{clicks}</div>
                <div>Clicks</div>
            </div> */}
        </div>
    );
}

function GoogleAnalyticsSummaryCard({currentCompany, connector, sessions}: {currentCompany: Company, connector: Connector; sessions: number}) {
    return (
        <div className="tw-w-full tw-bg-gray-800 tw-grid tw-grid-cols-3 tw-items-center tw-p-4 tw-rounded-lg">
            <Link to={`/${currentCompany.id}/${DataSourceIds.googleAnalytics}/${connector.id}`} className="tw-col-span-3">Google Analytics: {connector.extraInformation.accountName} ({connector.extraInformation.accountId})</Link>

            {/* <VerticalSpacer className="tw-col-span-3 tw-h-4" />

            <div className="tw-text-center">
                <div className="tw-text-[1.5rem] tw-font-bold">{sessions}</div>
                <div>Sessions</div>
            </div> */}
        </div>
    );
}
