import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {getRedirectUri} from "~/backend/utilities/data-management/common.server";
import { getFacebookAuthorizationCodeUrl } from "~/backend/utilities/data-management/facebookOAuth.server";
import type {Connector} from "~/backend/utilities/data-management/googleOAuth.server";
import {deleteConnector, getGoogleAdsConnectorsAssociatedWithCompanyId, googleAdsScope} from "~/backend/utilities/data-management/googleOAuth.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import type {Uuid} from "~/utilities/typeDefinitions";
import {ConnectorType, CredentialType} from "~/utilities/typeDefinitions";

type LoaderData =
    | {
          googleAdsConnectors: Array<Connector>;
      }
    | Error;

export const action: ActionFunction = async ({request, params}) => {
    const body = await request.formData();
    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const companyIdUuid = getUuidFromUnknown(companyId);

    if (body.get("action") == "facebook") {

        const redirectUri = getRedirectUri(companyIdUuid, CredentialType.FacebookAds);
        if(redirectUri instanceof Error){
            return "Facebook Ads redirect uri not defined!"
        }

        const authUrl = getFacebookAuthorizationCodeUrl(redirectUri);

        return redirect(authUrl);

    } else if (body.get("action") == "google") {

        const redirectUri = getRedirectUri(companyIdUuid, CredentialType.GoogleAds);
        if(redirectUri instanceof Error){
            return "Google Ads redirect uri not defined!"
        }

        const url = `https://accounts.google.com/o/oauth2/v2/auth?scope=${googleAdsScope}&client_id=${process.env
            .GOOGLE_CLIENT_ID!}&response_type=code&redirect_uri=${redirectUri}&prompt=consent&access_type=offline&state=${companyId}`;

        return redirect(url);

    } else if (body.get("action") == "deleteGoogleAds") {

        const connectorId = body.get("connectorId") as Uuid;
        const loginCustomerId = body.get("loginCustomerId") as Uuid;

        await deleteConnector(connectorId, loginCustomerId, ConnectorType.GoogleAds);
    }

    return null;
};

export const loader: LoaderFunction = async ({request, params}) => {
    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const companyIdUuid = getUuidFromUnknown(companyId);

    const connectorDetails = await getGoogleAdsConnectorsAssociatedWithCompanyId(companyIdUuid);
    if (connectorDetails instanceof Error) {
        return connectorDetails;
    }

    const response: LoaderData = {
        googleAdsConnectors: connectorDetails,
    };
    return json(response);
};

export default function () {
    const loaderData = useLoaderData() as LoaderData;
    // Fix this
    if (loaderData instanceof Error) {
        return loaderData;
    }

    return (
        <div className="tw-p-8 tw-grid tw-grid-rows-auto tw-gap-2">
            <div className="tw-row-start-1">
                <Form method="post">
                    <input
                        type="hidden"
                        name="action"
                        value="facebook"
                    />
                    <button className="tw-lp-button tw-bg-blue-500">Authorize Facebook Account</button>
                </Form>
                <Form method="post">
                    <input
                        type="hidden"
                        name="action"
                        value="google"
                    />
                    <button className="tw-lp-button tw-bg-blue-700 disabled:opacity-25">Authorize Google Account</button>
                </Form>
            </div>
            <div className="tw-row-start-2">
                <div className="tw-grid tw-grid-rows-auto tw-gap-2">
                    <div className="tw-flex tw-flex-col tw-w-auto tw-gap-y-4">
                        <div className="tw-flex tw-flex-row tw-flex-auto tw-gap-x-8 tw-items-center tw-justify-center">
                            <div className="tw-font-bold tw-font-sans">Connector Id</div>
                            <div className="tw-font-bold tw-font-sans">Account Id</div>
                            <div className="tw-font-bold tw-font-sans">Actions</div>
                        </div>
                        <ItemBuilder
                            items={loaderData.googleAdsConnectors}
                            itemBuilder={(connector, connectorIndex) => (
                                <Form
                                    method="post"
                                    className="tw-bg-dark-bg-400 tw-p-4 tw-flex tw-flex-row tw-gap-x-8 tw-flex-1 tw-items-center tw-justify-center"
                                >
                                    <input
                                        type="hidden"
                                        name="action"
                                        value="deleteGoogleAds"
                                    />
                                    <input
                                        name="connectorId"
                                        value={connector.id}
                                        readOnly
                                    />
                                    <input
                                        name="loginCustomerId"
                                        value={connector.loginCustomerId}
                                        readOnly
                                    />
                                    <button className="tw-lp-button tw-bg-red-500 disabled:opacity-25">Delete Connector</button>
                                </Form>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
