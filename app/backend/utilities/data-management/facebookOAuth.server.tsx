import Cryptr from "cryptr";
import {DateTime} from "luxon";
import {Credentials, getCredentials, storeCredentials, updateCredentials} from "~/backend/utilities/data-management/credentials.server";
import {getErrorFromUnknown} from "~/backend/utilities/databaseManager.server";
import {CredentialType, Uuid} from "~/utilities/typeDefinitions";
import {Response} from "~/backend/utilities/data-management/credentials.server";

const cryptr = new Cryptr(process.env.ENCRYPTION_KEY!);
export const facebookAdsScope = "ads_read, ads_management";

type FacebookAdsCredentials = {
    accessToken: string;
    expiryDate: string;
    tokenType?: string;
};

const facebookApiBaseUrl = "https://graph.facebook.com";

export function getRedirectUri(companyId: Uuid, dataSource: Uuid): string | Error {
    if (dataSource == CredentialType.facebookAds) {
        return `${process.env.REDIRECT_BASE_URI!}/${companyId}/capture-authorization-code`;
    }

    if (dataSource == CredentialType.googleAds) {
        return `${process.env.REDIRECT_BASE_URI!}/capture-authorization-code`;
    }

    return Error("Invalid data source!");
}

export async function facebookOAuthFlow(authorizationCode: string, companyId: string): Promise<string | Error> {
    /**
     * Handles the OAuth2 flow to authorize the Facebook API for the given companyId and stores the credentials in database.
     */

    const redirectUri = getRedirectUri(companyId, CredentialType.facebookAds);
    if (redirectUri instanceof Error) {
        return redirectUri;
    }

    try {
        // Post api to retrieve access token by giving authorization code.
        const url = `
            ${facebookApiBaseUrl}/${process.env.FACEBOOK_API_VERSION!}/oauth/access_token?
            client_id=${process.env.FACEBOOK_CLIENT_ID!}&
            client_secret=${process.env.FACEBOOK_CLIENT_SECRET!}&
            redirect_uri=${redirectUri}&
            code=${authorizationCode}
        `;

        const response = await fetch(url, {
            method: "POST",
        });
        var token = await response.json();
        token = convertTokenToFacebookCredentialsType(token);

        if (token instanceof Error) {
            return token;
        }

        if (companyId != undefined) {
            // Store credentials in database.
            const response1 = await storeCredentials(
                {
                    access_token: cryptr.encrypt(token.accessToken),
                    expiry_date: DateTime.now()
                        .plus({seconds: parseInt(token.expiryDate)})
                        .toISO(),
                },
                companyId,
                CredentialType.facebookAds,
            );

            if (response1 instanceof Error) {
                return response1;
            }

            return Response.Success;
        }
    } catch (e) {
        const error = getErrorFromUnknown(e);
        return error;
    }
}

function convertTokenToFacebookCredentialsType(token: any): FacebookAdsCredentials | Error {
    try {
        let result: FacebookAdsCredentials = {
            accessToken: token.access_token,
            expiryDate: token.expires_in,
        };
        return result;
    } catch (error_: unknown) {
        const error = getErrorFromUnknown(error_);
        return error;
    }
}

export async function getFacebookCredentials(companyId: string): Promise<Credentials | Error> {
    /**
     * Retrieves the Facebook Ads credentials for a given company ID.
     */

    const credentialsRaw = await getCredentials(companyId, CredentialType.facebookAds);
    if (credentialsRaw instanceof Error) {
        return credentialsRaw;
    } else {
        const credentials: FacebookAdsCredentials = {
            accessToken: credentialsRaw["access_token"] as string,
            expiryDate: credentialsRaw["expiry_date"] as string,
        };

        return credentials;
    }
}

export async function refreshAccessToken(expiredAccessToken: Uuid, companyId: Uuid): Promise<Uuid | Error> {
    /**
     * Retrieves a new access token from the Facebook API using a provided expired access token.
     * Updates the credentials in the database for the specified company ID.
     */

    const url = `
        ${facebookApiBaseUrl}/${process.env.FACEBOOK_API_VERSION!}/oauth/access_token?
        client_id=${process.env.FACEBOOK_CLIENT_ID!}&
        client_secret=${process.env.FACEBOOK_CLIENT_SECRET!}&
        grant_type=fb_exchange_token&
        fb_exchange_token=${expiredAccessToken}
    `;
    const response = await fetch(url, {
        method: "GET",
    });
    var token = await response.json();
    token = convertTokenToFacebookCredentialsType(token);

    if (token instanceof Error) {
        return token;
    }

    if (companyId != "undefined") {
        // Update credentials in database.
        updateCredentials(
            {
                access_token: cryptr.encrypt(token.access_token),
                expiry_date: DateTime.now()
                    .plus({seconds: parseInt(token.expiryDate)})
                    .toISO(),
            },
            companyId,
            CredentialType.facebookAds,
        );
        return token.accessToken;
    } else {
        return Error("Company undefined!");
    }
}

export async function getFacebookData(companyId: Uuid) {
    // 1. Retrieve Facebook credentials stored in database.
    const credentials = await getFacebookCredentials(companyId);
    if (credentials instanceof Error) {
        return credentials;
    }

    let accessToken = credentials.accessToken as string;

    // 2. If access token is expired, refresh the token.
    if (credentials.expiryDate < DateTime.now().toISO()) {
        const newAccessToken = await refreshAccessToken(credentials.accessToken as string, companyId);
        if (newAccessToken instanceof Error) {
            return newAccessToken;
        }

        accessToken = newAccessToken as string;
    }

    // 3. Get data from the facebook ads source.
    const data = await callFacbookAdsApi(accessToken);
    console.log("data: ", data);
}

async function callFacbookAdsApi(accessToken: string) {
    try {
        const fields = "campaign_id,campaign_name";
        const level = "campaign";
        let url = `
            ${facebookApiBaseUrl}/${process.env.FACEBOOK_API_VERSION!}/act_${process.env.FACEBOOK_ACCOUNT_ID!}/insights?
            fields=${fields}&
            level=${level}&
            access_token=${accessToken}
        `;
        const response = await fetch(url, {
            method: "GET",
        });

        const insights = await response.json();
        return insights;
    } catch (e) {
        console.log(e);
    }
}
