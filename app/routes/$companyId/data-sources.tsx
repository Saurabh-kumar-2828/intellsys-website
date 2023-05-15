import {ActionFunction, LoaderFunction, json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {doesConnectorIdExists, getConnectorId, getRedirectUri} from "~/backend/utilities/data-management/common.server";
import {facebookAdsScope} from "~/backend/utilities/data-management/facebookOAuth.server";
import {deleteCredentialsFromSources, googleAdsScope, ingestGoogleAdsData} from "~/backend/utilities/data-management/googleOAuth.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {ConnectorType, CredentialType} from "~/utilities/typeDefinitions";

export const action: ActionFunction = async ({request, params}) => {
    const body = await request.formData();
    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const companyIdUuid = getUuidFromUnknown(companyId);

    if (body.get("action") == "facebook") {

        const redirectUri = getRedirectUri(companyIdUuid, CredentialType.facebookAds);
        console.log("Redirect Uri", redirectUri);

        // TODO: Create function to get env variables
        const authUrl = `https://www.facebook.com/${process.env.FACEBOOK_API_VERSION!}/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID!}&redirect_uri=${redirectUri}&scope=${facebookAdsScope}`;

        return redirect(authUrl);

    } else if (body.get("action") == "google") {

        const redirectUri = getRedirectUri(companyIdUuid, CredentialType.GoogleAds);

        const url = `https://accounts.google.com/o/oauth2/v2/auth?scope=${googleAdsScope}&client_id=${process.env
            .GOOGLE_CLIENT_ID!}&response_type=code&redirect_uri=${redirectUri}&prompt=consent&access_type=offline&state=${companyId}`;

        return redirect(url);

    } else if(body.get("action") == "deleteGoogleAds") {

        await deleteCredentialsFromSources(companyIdUuid, CredentialType.GoogleAds, ConnectorType.GoogleAds)

    }

    return null;
};

export const loader: LoaderFunction = async ({request, params}) => {
    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const companyIdUuid = getUuidFromUnknown(companyId);

    const response = await doesConnectorIdExists(companyIdUuid, ConnectorType.GoogleAds);

    return json(response);
}

export default function () {

    const googleConnectorExists: boolean = useLoaderData();


    return (
        <div className="tw-p-8 tw-grid tw-h-32 tw-grid-cols-4 tw-gap-0">
            <div className="tw-col-start-1">
                {/* <Form method="post">
                    <input
                        type="hidden"
                        name="action"
                        value="facebook"
                    />
                    <button className="tw-lp-button tw-bg-blue-500">Authorize Facebook Account</button>
                </Form> */}
                    <Form method="post">
                        <input
                            type="hidden"
                            name="action"
                            value="google"
                        />
                        <button className="tw-lp-button tw-bg-blue-700 disabled:opacity-25" disabled={googleConnectorExists}>Authorize Google Account</button>
                    </Form>
                    {
                        googleConnectorExists ? <div className="tw-text-[1rem] tw-text-center">Connected</div> : <div></div>

                    }
            </div>
            <div className="tw-col-start-2">
                <Form method="post">
                    <input
                        type="hidden"
                        name="action"
                        value="deleteGoogleAds"
                    />
                    <button className="tw-lp-button tw-bg-red-500 disabled:opacity-25" disabled={!googleConnectorExists}>Delete Connector</button>
                </Form>
            </div>
        </div>
    );
}
