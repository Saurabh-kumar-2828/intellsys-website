import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {Form, Link, useLoaderData} from "@remix-run/react";
import {deleteConnector, getRedirectUri} from "~/backend/utilities/data-management/common.server";
import {getFacebookAuthorizationCodeUrl} from "~/backend/utilities/data-management/facebookOAuth.server";
import type {Connector} from "~/backend/utilities/data-management/googleOAuth.server";
import {googleAnalyticsScope} from "~/backend/utilities/data-management/googleOAuth.server";
import {getGoogleAuthorizationCodeUrl} from "~/backend/utilities/data-management/googleOAuth.server";
import {getConnectorsAssociatedWithCompanyId} from "~/backend/utilities/data-management/googleOAuth.server";
import {googleAdsScope} from "~/backend/utilities/data-management/googleOAuth.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {SectionHeader} from "~/components/scratchpad";
import {HiddenFormField} from "~/global-common-typescript/components/hiddenFormField";
import {VerticalSpacer} from "~/global-common-typescript/components/verticalSpacer";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import type {Uuid} from "~/utilities/typeDefinitions";
import {dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {ConnectorType} from "~/utilities/typeDefinitions";

export const action: ActionFunction = async ({request, params}) => {
    const body = await request.formData();
    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const companyIdUuid = getUuidFromUnknown(companyId);

    if (body.get("action") == "facebook") {
        const redirectUri = getRedirectUri(companyIdUuid, getUuidFromUnknown(ConnectorType.FacebookAds));
        if (redirectUri instanceof Error) {
            return "Facebook Ads redirect uri not defined!";
        }

        const authUrl = getFacebookAuthorizationCodeUrl(redirectUri, companyIdUuid);

        return redirect(authUrl);
    } else if (body.get("action") == "googleAds") {
        const redirectUri = getRedirectUri(companyIdUuid, getUuidFromUnknown(ConnectorType.GoogleAds));
        if (redirectUri instanceof Error) {
            return "Google Ads redirect uri not defined!";
        }

        const authUrl = getGoogleAuthorizationCodeUrl(redirectUri, companyIdUuid, googleAdsScope);

        return redirect(authUrl);
    } else if (body.get("action") == "googleAnalytics") {
        const redirectUri = getRedirectUri(companyIdUuid, getUuidFromUnknown(ConnectorType.GoogleAnalytics));
        if (redirectUri instanceof Error) {
            return "Google Analytics redirect uri not defined!";
        }

        const authUrl = getGoogleAuthorizationCodeUrl(redirectUri, companyIdUuid, googleAnalyticsScope);

        return redirect(authUrl);
    } else if (body.get("action") == "deleteGoogleAds") {
        const connectorId = body.get("connectorId") as Uuid;
        const loginCustomerId = body.get("loginCustomerId") as Uuid;

        await deleteConnector(connectorId, loginCustomerId, dataSourcesAbbreviations.googleAds);
    } else if (body.get("action") == "deleteFacebookAds") {
        const connectorId = body.get("connectorId") as Uuid;
        const adAccountId = body.get("adAccountId") as Uuid;

        await deleteConnector(connectorId, adAccountId, dataSourcesAbbreviations.facebookAds);
    } else if (body.get("action") == "deleteGoogleAnalytics") {
        const connectorId = body.get("connectorId") as Uuid;
        const propertyId = body.get("propertyId") as Uuid;

        await deleteConnector(connectorId, propertyId, dataSourcesAbbreviations.googleAnalytics);
    }

    return null;
};

type LoaderData = {
    googleAdsConnectors: Array<Connector>;
    facebookAdsConnectors: Array<Connector>;
    googleAnalyticsConnectors: Array<Connector>;
    companyId: Uuid;
};

export const loader: LoaderFunction = async ({request, params}) => {
    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const companyIdUuid = getUuidFromUnknown(companyId);

    const googleConnectorDetails = await getConnectorsAssociatedWithCompanyId(companyIdUuid, getUuidFromUnknown(ConnectorType.GoogleAds));
    if (googleConnectorDetails instanceof Error) {
        return googleConnectorDetails;
    }

    const facebookConnectorDetails = await getConnectorsAssociatedWithCompanyId(companyIdUuid, getUuidFromUnknown(ConnectorType.FacebookAds));
    if (facebookConnectorDetails instanceof Error) {
        return facebookConnectorDetails;
    }

    const googleAnalyticsDetails = await getConnectorsAssociatedWithCompanyId(companyIdUuid, getUuidFromUnknown(ConnectorType.GoogleAnalytics));
    if (googleAnalyticsDetails instanceof Error) {
        return googleAnalyticsDetails;
    }

    const response: LoaderData = {
        googleAdsConnectors: googleConnectorDetails,
        facebookAdsConnectors: facebookConnectorDetails,
        googleAnalyticsConnectors: googleAnalyticsDetails,
        companyId: companyIdUuid,
    };

    return json(response);
};

export default function () {
    const {googleAdsConnectors, facebookAdsConnectors, googleAnalyticsConnectors, companyId} = useLoaderData() as LoaderData;

    return (
        <div className="tw-p-8 tw-grid tw-grid-rows-auto tw-gap-8">
            <div className="tw-row-start-2 tw-bg-dark-bg-500 tw-p-8 tw-m-4">
                <SectionHeader label="Google Ads Sources" />

                <VerticalSpacer className="tw-h-4" />

                <div className="tw-grid tw-grid-rows-auto tw-gap-2">
                    {googleAdsConnectors.length == 0 ? (
                        <div>
                            No connected account!
                        </div>
                    ) : (
                        <table className="tw-w-full tw-border tw-border-solid tw-border-white">
                            <tr className="tw-w-full tw-border tw-border-solid tw-border-white">
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Source Id
                                </th>
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Account Id
                                </th>
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Actions
                                </th>
                            </tr>

                            <ItemBuilder
                                items={googleAdsConnectors}
                                itemBuilder={(connector, connectorIndex) => (
                                    <tr key={connectorIndex}>
                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            <Link
                                                to={`/${companyId}/0be2e81c-f5a7-41c6-bc34-6668088f7c4e/${connector.id}`}
                                                className="tw-text-blue-500"
                                            >
                                                {connector.id}
                                            </Link>
                                        </td>

                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            {connector.accountId}
                                        </td>

                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            <Form
                                                method="post"
                                            >
                                                <HiddenFormField
                                                    name="action"
                                                    value="deleteGoogleAds"
                                                />

                                                <HiddenFormField
                                                    name="connectorId"
                                                    value={connector.id}
                                                />

                                                <HiddenFormField
                                                    name="loginCustomerId"
                                                    value={connector.accountId}
                                                />

                                                <button
                                                    type="submit"
                                                    className="tw-text-red-500 disabled:tw-text-gray-600"
                                                >
                                                    Delete
                                                </button>
                                            </Form>
                                        </td>
                                    </tr>
                                )}
                            />
                        </table>
                    )}
                </div>

                <VerticalSpacer className="tw-h-4" />

                <Form method="post" className="tw-w-full tw-grid tw-place-items-center">
                    <HiddenFormField
                        name="action"
                        value="googleAds"
                    />

                    <button
                        type="submit"
                        className="tw-lp-button tw-bg-green-700 disabled:tw-bg-gray-600"
                    >
                        Connect New Source
                    </button>
                </Form>
            </div>

            <div className="tw-row-start-3 tw-bg-dark-bg-500 tw-p-8 tw-m-4">
                <SectionHeader label="Facebook Ads Sources" />

                <VerticalSpacer className="tw-h-4" />

                <div className="tw-grid tw-grid-rows-auto tw-gap-2">
                    {facebookAdsConnectors.length == 0 ? (
                        <div>
                            No connected account!
                        </div>
                    ) : (
                        <table className="tw-w-full tw-border tw-border-solid tw-border-white">
                            <tr className="tw-w-full tw-border tw-border-solid tw-border-white">
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Source Id
                                </th>
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Account Id
                                </th>
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Actions
                                </th>
                            </tr>

                            <ItemBuilder
                                items={facebookAdsConnectors}
                                itemBuilder={(connector, connectorIndex) => (
                                    <tr
                                        key={connectorIndex}
                                    >
                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            <Link
                                                to={`/${companyId}/3350d73d-64c1-4c88-92b4-0d791d954ae9/${connector.id}`}
                                                className="tw-text-blue-500"
                                            >
                                                {connector.id}
                                            </Link>
                                        </td>

                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            {connector.accountId}
                                        </td>

                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            <Form
                                                method="post"
                                            >
                                                <HiddenFormField
                                                    name="action"
                                                    value="deleteFacebookAds"
                                                />

                                                <HiddenFormField
                                                    name="connectorId"
                                                    value={connector.id}
                                                />

                                                <HiddenFormField
                                                    name="adAccountId"
                                                    value={connector.accountId}
                                                />

                                                <button
                                                    type="submit"
                                                    className="tw-text-red-500 disabled:tw-text-gray-600"
                                                >
                                                    Delete
                                                </button>
                                            </Form>
                                        </td>
                                    </tr>
                                )}
                            />
                        </table>
                    )}
                </div>

                <VerticalSpacer className="tw-h-4" />

                <Form method="post" className="tw-w-full tw-grid tw-place-items-center">
                    <input
                        type="hidden"
                        name="action"
                        value="facebook"
                    />

                    <button
                        type="submit"
                        className="tw-lp-button tw-bg-green-700 disabled:tw-bg-gray-600"
                    >
                        Connect New Source
                    </button>
                </Form>
            </div>

            <div className="tw-row-start-4 tw-bg-dark-bg-500 tw-p-8 tw-m-4">
                <SectionHeader label="Google Analytics Sources" />

                <VerticalSpacer className="tw-h-4" />

                <div className="tw-grid tw-grid-rows-auto tw-gap-2">
                    {googleAnalyticsConnectors.length == 0 ? (
                        <div>
                            No connected account!
                        </div>
                    ) : (
                        <table className="tw-w-full tw-border tw-border-solid tw-border-white">
                            <tr className="tw-w-full tw-border tw-border-solid tw-border-white">
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Source Id
                                </th>
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Account Id
                                </th>
                                <th className="tw-w-full tw-border tw-border-solid tw-border-white tw-text-left tw-p-2 tw-whitespace-nowrap">
                                    Actions
                                </th>
                            </tr>

                            <ItemBuilder
                                items={googleAnalyticsConnectors}
                                itemBuilder={(connector, connectorIndex) => (
                                    <tr
                                        key={connectorIndex}
                                    >
                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            <Link
                                                to={`/${companyId}/6cd015ff-ec2e-412a-a777-f983fbdcb63e/${connector.id}`}
                                                className="tw-text-blue-500"
                                            >
                                                {connector.id}
                                            </Link>

                                        </td>

                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            {connector.accountId}
                                        </td>

                                        <td className="tw-w-full tw-border tw-border-solid tw-border-white tw-p-2 tw-whitespace-nowrap">
                                            <Form
                                                method="post"
                                            >
                                                <HiddenFormField
                                                    name="action"
                                                    value="deleteGoogleAnalytics"
                                                />

                                                <HiddenFormField
                                                    name="connectorId"
                                                    value={connector.id}
                                                />

                                                <HiddenFormField
                                                    name="propertyId"
                                                    value={connector.accountId}
                                                />

                                                <button
                                                    type="submit"
                                                    className="tw-text-red-500 disabled:tw-text-gray-600"
                                                >
                                                    Delete
                                                </button>
                                            </Form>
                                        </td>
                                    </tr>
                                )}
                            />
                        </table>
                    )}
                </div>

                <VerticalSpacer className="tw-h-4" />

                <Form method="post" className="tw-w-full tw-grid tw-place-items-center">
                    <input
                        type="hidden"
                        name="action"
                        value="googleAnalytics"
                    />

                    <button
                        type="submit"
                        className="tw-lp-button tw-bg-green-700 disabled:tw-bg-gray-600"
                    >
                        Connect New Source
                    </button>
                </Form>
            </div>
        </div>
    );
}
