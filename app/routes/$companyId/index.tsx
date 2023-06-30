import type {LoaderFunction, MetaFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Link, useLoaderData, useMatches} from "@remix-run/react";
import {getConnectorsAssociatedWithCompanyId} from "~/backend/utilities/connectors/common.server";
import {PageScaffold} from "~/components/pageScaffold";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {ConnectorType} from "~/utilities/typeDefinitions";
import type {Connector} from "~/backend/utilities/connectors/googleOAuth.server";
import {CompanyLoaderData} from "~/routes/$companyId";
import {getSingletonValue} from "~/utilities/utilities";
import {PlusCircle} from "react-bootstrap-icons";

type LoaderData = {
    googleAdsConnectors: Array<Connector>;
    facebookAdsConnectors: Array<Connector>;
    googleAnalyticsConnectors: Array<Connector>;
};

export const loader: LoaderFunction = async ({request, params}) => {
    // TODO: Ensure companyId is valid

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const googleAdsConnectorDetails = await getConnectorsAssociatedWithCompanyId(getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.GoogleAds));
    if (googleAdsConnectorDetails instanceof Error) {
        return googleAdsConnectorDetails;
    }

    const facebookConnectorDetails = await getConnectorsAssociatedWithCompanyId(getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.FacebookAds));
    if (facebookConnectorDetails instanceof Error) {
        return facebookConnectorDetails;
    }

    const googleAnalyticsDetails = await getConnectorsAssociatedWithCompanyId(getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.GoogleAnalytics));
    if (googleAnalyticsDetails instanceof Error) {
        return googleAnalyticsDetails;
    }

    const loaderData: LoaderData = {
        googleAdsConnectors: googleAdsConnectorDetails,
        facebookAdsConnectors: facebookConnectorDetails,
        googleAnalyticsConnectors: googleAnalyticsDetails,
    };

    return json(loaderData);
};

export const meta: MetaFunction = () => {
    return {
        title: "Intellsys",
    };
};

export default function () {
    const {googleAdsConnectors, facebookAdsConnectors, googleAnalyticsConnectors} = useLoaderData() as LoaderData;

    const routeMatches = useMatches();
    const {user, accessibleCompanies, currentCompany} = getSingletonValue(routeMatches.filter(routeMatch => routeMatch.id == "routes/$companyId")).data as CompanyLoaderData;

    return (
        <PageScaffold
            user={user}
            accessibleCompanies={accessibleCompanies}
            currentCompany={currentCompany}
        >
            <div className="tw-min-h-full tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
                <div className="tw-col-span-12 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-y-4">
                    {googleAdsConnectors.length == 0 && facebookAdsConnectors.length == 0 && googleAnalyticsConnectors.length == 0 ? (
                        <div>
                            <Link
                                to={`/${currentCompany.id}/data-sources`}
                                className="tw-flex tw-flex-col tw-items-center tw-gap-y-4"
                            >
                                <PlusCircle
                                    className="tw-w-16 tw-h-16 tw-text-green-500"
                                />
                                Add your first data source to get started!
                            </Link>
                        </div>
                    ) : (
                        <div className="tw-flex tw-flex-col">
                            <div>
                                {googleAdsConnectors.length} Google Ads Connectors
                            </div>

                            <div>
                                {facebookAdsConnectors.length} Facebook Ads Connectors
                            </div>

                            <div>
                                {googleAnalyticsConnectors.length} Google Analytics Connectors
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageScaffold>
    );
}
