import type {Uuid} from "~/utilities/typeDefinitions";
import {getRedirectUri} from "~/backend/utilities/connectors/common.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";

// TODO: Fix timezone in database

export const googleAdsScope = "https://www.googleapis.com/auth/adwords";
export const googleAnalyticsScope = "https://www.googleapis.com/auth/analytics.readonly";

export type GoogleAdsAccessibleAccount = {
    customerClientId: string;
    customerClientName: string;
    managerId: string;
    managerName: string;
};

export type GoogleAdsCredentials = {
    refreshToken: string;
    googleAccountId: string;
    googleLoginCustomerId: string;
};

export type GoogleAdsAccessToken = {
    accessToken: string;
};

export function getGoogleAuthorizationCodeUrl(redirectUri: string, companyId: Uuid, scope: string) {
    const clientId = getRequiredEnvironmentVariableNew("GOOGLE_CLIENT_ID");

    const url = `https://accounts.google.com/o/oauth2/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&prompt=consent&access_type=offline&state=${companyId}`;

    return url;
}

export async function getGoogleAdsRefreshToken(authorizationCode: string, companyId: Uuid, connector: Uuid): Promise<string | Error> {
    const redirectUri = getRedirectUri(companyId, connector);
    if (redirectUri instanceof Error) {
        return redirectUri;
    }

    // Post api to retrieve access token by giving authorization code.
    const url = `https://oauth2.googleapis.com/token?client_id=${getRequiredEnvironmentVariableNew("GOOGLE_CLIENT_ID")}&client_secret=${getRequiredEnvironmentVariableNew(
        "GOOGLE_CLIENT_SECRET",
    )}&redirect_uri=${redirectUri}&code=${authorizationCode}&grant_type=authorization_code`;

    const response = await fetch(url, {
        method: "POST",
    });
    const responseBody = await response.text();
    const responseBodyJson = JSON.parse(responseBody);

    if (responseBodyJson.refresh_token == undefined) {
        console.log(responseBody);
        return Error("Refresh token not found");

    }

    return responseBodyJson.refresh_token;
}

/**
 * Retrieves a list of all Google Ads accounts that you are able to act upon directly given your current credentials.
 */
export async function getAccessibleAccounts(refreshToken: string): Promise<Array<GoogleAdsAccessibleAccount> | Error> {
    const googleAdsHelperUrl = getRequiredEnvironmentVariableNew("INTELLSYS_PYTHON_HELPER_URL");

    var formdata = new FormData();
    formdata.append("developer_token", getRequiredEnvironmentVariableNew("GOOGLE_DEVELOPER_TOKEN"));
    formdata.append("client_id", getRequiredEnvironmentVariableNew("GOOGLE_CLIENT_ID"));
    formdata.append("client_secret", getRequiredEnvironmentVariableNew("GOOGLE_CLIENT_SECRET"));
    formdata.append("refresh_token", refreshToken);

    var requestOptions = {
        method: "POST",
        body: formdata,
    };

    const rawResponse = await fetch(`${googleAdsHelperUrl}/get_accessible_accounts`, requestOptions);

    if (!rawResponse.ok) {
        return Error("Request to get accessible account failed");
    }

    const response = await rawResponse.json();

    const accessbileAccounts: Array<GoogleAdsAccessibleAccount> = response.map((row) => convertToAccessbileAccount(row));

    return accessbileAccounts;
}

export function convertToAccessbileAccount(row: unknown) {
    const result: GoogleAdsAccessibleAccount = {
        customerClientId: row.customer_client_id,
        customerClientName: row.customer_client_name,
        managerId: row.manager_id,
        managerName: row.manager_name,
    };

    return result;
}
