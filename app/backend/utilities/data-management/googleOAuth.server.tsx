import Cryptr from "cryptr";
import {DateTime} from "luxon";
import {Credentials, getCredentials, storeCredentials, updateCredentials} from "~/backend/utilities/data-management/credentials.server";
import {getRedirectUri} from "~/backend/utilities/data-management/facebookOAuth.server";
import {getErrorFromUnknown} from "~/backend/utilities/databaseManager.server";
import {CredentialType, Uuid} from "~/utilities/typeDefinitions";

// TODO: Fix timezone in database

export const googleAdsScope = "https://www.googleapis.com/auth/adwords";

type GoogleAdsCredentials = {
    accessToken: string;
    refreshToken: string;
    expiryDate: string;
};

const cryptr = new Cryptr(process.env.ENCRYPTION_KEY!);

export async function getGoogleCredentials(companyId: string): Promise<GoogleAdsCredentials | Error> {
    /**
     * Retrieves Google Ads credentials from the database for the given companyId.
     */

    const credentialsRaw = await getCredentials(companyId, CredentialType.googleAds);
    if (credentialsRaw instanceof Error) {
        return credentialsRaw;
    } else {
        const credentials: GoogleAdsCredentials = {
            accessToken: credentialsRaw["access_token"] as string,
            expiryDate: credentialsRaw["expiry_date"] as string,
            refreshToken: credentialsRaw["refresh_token"] as string,
        };

        return credentials;
    }
}

async function refreshAccessToken(oldAccessToken: string): Promise<any | Error> {
    /**
     * Sends a request to the Google Ads OAuth2 API to refresh an access token.
     */

    try {
        let url = `
            https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}&refresh_token=${oldAccessToken}&grant_type=refresh_token;
        `;

        const response = await fetch(url, {
            method: "POST",
        });

        const insights = await response.json();
        return insights;
    } catch (e) {
        console.log(e);
    }
}

function convertTokenToGoogleCredentialsType(credentials: Credentials): GoogleAdsCredentials | Error {
    try {
        if (credentials.access_token == undefined || credentials.expires_in == undefined) {
            return Error("Google credentials not valid");
        }

        let result: GoogleAdsCredentials = {
            accessToken: credentials.access_token as string,
            expiryDate: credentials.expires_in as string,
            refreshToken: credentials.refresh_token != undefined ? (credentials.refresh_token as string) : "",
        };

        return result;
    } catch (error_: unknown) {
        const error = getErrorFromUnknown(error_);
        return error;
    }
}

export async function googleOAuthFlow(authorizationCode: Uuid, companyId: Uuid): Promise<void | Error> {
    /**
     *  Handles the OAuth2 flow to authorize the Google Ads API for the given companyId.
     */

    try {
        const redirectUri = getRedirectUri(companyId, Sources.GoogleAds);

        // Post api to retrieve access token by giving authorization code.
        const url = `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_CLIENT_ID!}&client_secret=${process.env
            .GOOGLE_CLIENT_SECRET!}&redirect_uri=${redirectUri}&code=${authorizationCode}&grant_type=authorization_code`;

        const response = await fetch(url, {
            method: "POST",
        });
        const rawResponse = await response.json();

        const token = convertTokenToGoogleCredentialsType(rawResponse);

        if (token instanceof Error) {
            return token;
        }

        if (companyId != "undefined") {
            // Store credentials in database.
            await storeCredentials(
                {
                    access_token: cryptr.encrypt(token.accessToken),
                    expiry_date: DateTime.now()
                        .plus({seconds: parseInt(token.expiryDate)})
                        .toISO(),
                    refresh_token: cryptr.encrypt(token.refreshToken),
                },
                companyId,
                Sources.GoogleAds,
            );
        }
    } catch (e) {
        console.log(e);
    }
}

async function getAccessToken(companyId: Uuid): Promise<string | Error> {
    /**
     *  Retrieves a valid access token for the Google Ads API for the given companyId, refreshing the token if necessary.
     */

    // 1. Retrieve Google credentials stored in database.
    const credentials = await getGoogleCredentials(companyId);

    if (credentials instanceof Error) {
        return credentials;
    }

    let accessToken = credentials.accessToken as string;

    // 2. Check if access token is valid.
    if (DateTime.now().toISO() > credentials.expiryDate) {
        const rawResponse = await refreshAccessToken(accessToken);

        if (rawResponse instanceof Error) {
            return Error("Invalid token");
        }

        const token = convertTokenToGoogleCredentialsType(rawResponse);

        if (token instanceof Error) {
            return token;
        }

        if (companyId != "undefined") {
            // Update credentials in database.
            updateCredentials(
                {
                    access_token: cryptr.encrypt(token.accessToken),
                    expiry_date: DateTime.now()
                        .plus({seconds: parseInt(token.expiryDate)})
                        .toISO(),
                    refresh_token: credentials.refreshToken, // TODO: Hash refresh token.
                },
                companyId,
                Sources.GoogleAds,
            );
        } else {
            return Error("Company undefined!");
        }
        return token.accessToken;
    }

    return accessToken;
}

export async function getGoogleData(companyId: Uuid) {
    try {
        const accessToken = await getAccessToken(companyId);
        if (accessToken instanceof Error) {
            return accessToken;
        }

        const data = await callGoogleAdsApi(accessToken);
        console.log("data: ", data);
    } catch (e) {
        console.log(e);
    }
}

function getGoogleHeaders(accessToken: string) {
    var headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);
    headers.append("developer-token", process.env.GOOGLE_DEVELOPER_TOKEN!);
    headers.append("Content-Type", "application/json");
    headers.append("client_id", process.env.GOOGLE_CLIENT_ID!);
    headers.append("login-customer-id", process.env.GOOGLE_LOGIN_CUSTOMER_ID!);

    return headers;
}

function getGoogleQuery() {
    return JSON.stringify({
        query: "SELECT campaign.id, campaign.name, campaign.status FROM campaign",
    });
}

async function callGoogleAdsApi(accessToken: string) {
    try {
        let url = `
            https://googleads.googleapis.com/v13/customers/${process.env.GOOGLE_ACCOUNT_ID}/googleAds:search
        `;
        const headers = getGoogleHeaders(accessToken);
        const query = getGoogleQuery();

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: query,
        });

        const insights = await response.json();
        return insights;
    } catch (e) {
        console.log(e);
    }
}
