import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {deleteConnector, getRedirectUri} from "~/backend/utilities/data-management/common.server";
import {getFacebookAuthorizationCodeUrl} from "~/backend/utilities/data-management/facebookOAuth.server";
import type {Connector} from "~/backend/utilities/data-management/googleOAuth.server";
import {googleAnalyticsScope} from "~/backend/utilities/data-management/googleOAuth.server";
import {getGoogleAuthorizationCodeUrl} from "~/backend/utilities/data-management/googleOAuth.server";
import {getConnectorsAssociatedWithCompanyId} from "~/backend/utilities/data-management/googleOAuth.server";
import {googleAdsScope} from "~/backend/utilities/data-management/googleOAuth.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {SectionHeader} from "~/components/scratchpad";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import type {Uuid} from "~/utilities/typeDefinitions";
import {dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {ConnectorType} from "~/utilities/typeDefinitions";

type LoaderData = {
    googleAdsConnectors: Array<Connector>;
    facebookAdsConnectors: Array<Connector>;
    googleAnalyticsConnectors: Array<Connector>
};

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

        const authUrl = getFacebookAuthorizationCodeUrl(redirectUri);

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
        googleAnalyticsConnectors: googleAnalyticsDetails
    };

    return json(response);
};

export default function () {
    const loaderData = useLoaderData() as LoaderData;

    return (
        <div className="tw-p-8 tw-grid tw-grid-rows-auto tw-gap-8">
            <div className="tw-flex tw-flex-row tw-row-start-1">
                <div className="tw-basis-1/4">
                    <Form method="post">
                        <input
                            type="hidden"
                            name="action"
                            value="facebook"
                        />
                        <button className="tw-lp-button tw-bg-blue-500">Facebook Ads</button>
                    </Form>
                </div>
                <div className="tw-basis-1/4">
                    <Form method="post">
                        <input
                            type="hidden"
                            name="action"
                            value="googleAds"
                        />
                        <button className="tw-lp-button tw-bg-blue-600 disabled:opacity-25">Google Ads</button>
                    </Form>
                </div>
                <div className="tw-basis-1/4">
                    <Form method="post">
                        <input
                            type="hidden"
                            name="action"
                            value="googleAnalytics"
                        />
                        <button className="tw-lp-button tw-bg-blue-700 disabled:opacity-25">Google Analytics</button>
                    </Form>
                </div>
            </div>
            <div className="tw-row-start-2 tw-bg-dark-bg-500 tw-p-8 tw-m-4">
                <SectionHeader label="Google Ads' Connectors" />
                <div className="tw-grid tw-grid-rows-auto tw-gap-2">
                    <div className="tw-flex tw-flex-col tw-w-auto tw-gap-y-4">
                        <div className="tw-flex tw-flex-row tw-flex-auto tw-gap-x-8 tw-items-center tw-justify-center">
                            <div className="tw-font-bold tw-font-sans">Connector Id</div>
                            <div className="tw-font-bold tw-font-sans">Account Id</div>
                            <div className="tw-font-bold tw-font-sans">Actions</div>
                        </div>
                        {loaderData.googleAdsConnectors.length > 0 ? (
                            <ItemBuilder
                                items={loaderData.googleAdsConnectors}
                                itemBuilder={(connector, connectorIndex) => (
                                    <Form
                                        method="post"
                                        className="tw-bg-dark-bg-500 tw-p-4 tw-flex tw-flex-row tw-gap-x-8 tw-flex-1 tw-items-center tw-justify-center"
                                    >
                                        <input
                                            type="hidden"
                                            name="action"
                                            value="deleteGoogleAds"
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <input
                                            name="connectorId"
                                            value={connector.id}
                                            readOnly
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <input
                                            name="loginCustomerId"
                                            value={connector.accountId}
                                            readOnly
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <button className="tw-lp-button tw-bg-red-500 disabled:opacity-25">Delete Connector</button>
                                    </Form>
                                )}
                            />
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            </div>
            <div className="tw-row-start-3 tw-bg-dark-bg-500 tw-p-8 tw-m-4">
                <SectionHeader label="Facebook Ads' Connectors" />
                <div className="tw-grid tw-grid-rows-auto tw-gap-2">
                    <div className="tw-flex tw-flex-col tw-w-auto tw-gap-y-4">
                        <div className="tw-flex tw-flex-row tw-flex-auto tw-gap-x-8 tw-items-center tw-justify-center">
                            <div className="tw-font-bold tw-font-sans">Connector Id</div>
                            <div className="tw-font-bold tw-font-sans">Account Id</div>
                            <div className="tw-font-bold tw-font-sans">Actions</div>
                        </div>
                        {loaderData.facebookAdsConnectors.length > 0 ? (
                            <ItemBuilder
                                items={loaderData.facebookAdsConnectors}
                                itemBuilder={(connector, connectorIndex) => (
                                    <Form
                                        method="post"
                                        className="tw-bg-dark-bg-500 tw-p-4 tw-flex tw-flex-row tw-gap-x-8 tw-flex-1 tw-items-center tw-justify-center"
                                    >
                                        <input
                                            type="hidden"
                                            name="action"
                                            value="deleteFacebookAds"
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <input
                                            name="connectorId"
                                            value={connector.id}
                                            readOnly
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <input
                                            name="adAccountId"
                                            value={connector.accountId}
                                            readOnly
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <button className="tw-lp-button tw-bg-red-500 disabled:opacity-25">Delete Connector</button>
                                    </Form>
                                )}
                            />
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            </div>
            <div className="tw-row-start-4 tw-bg-dark-bg-500 tw-p-8 tw-m-4">
                <SectionHeader label="Google Analytics' Connectors" />
                <div className="tw-grid tw-grid-rows-auto tw-gap-2">
                    <div className="tw-flex tw-flex-col tw-w-auto tw-gap-y-4">
                        <div className="tw-flex tw-flex-row tw-flex-auto tw-gap-x-8 tw-items-center tw-justify-center">
                            <div className="tw-font-bold tw-font-sans">Connector Id</div>
                            <div className="tw-font-bold tw-font-sans">Account Id</div>
                            <div className="tw-font-bold tw-font-sans">Actions</div>
                        </div>
                        {loaderData.googleAnalyticsConnectors.length > 0 ? (
                            <ItemBuilder
                                items={loaderData.googleAnalyticsConnectors}
                                itemBuilder={(connector, connectorIndex) => (
                                    <Form
                                        method="post"
                                        className="tw-bg-dark-bg-500 tw-p-4 tw-flex tw-flex-row tw-gap-x-8 tw-flex-1 tw-items-center tw-justify-center"
                                    >
                                        <input
                                            type="hidden"
                                            name="action"
                                            value="deleteGoogleAnalytics"
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <input
                                            name="connectorId"
                                            value={connector.id}
                                            readOnly
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <input
                                            name="propertyId"
                                            value={connector.accountId}
                                            readOnly
                                            className="tw-bg-dark-bg-500"
                                        />
                                        <button className="tw-lp-button tw-bg-red-500 disabled:opacity-25">Delete Connector</button>
                                    </Form>
                                )}
                            />
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
