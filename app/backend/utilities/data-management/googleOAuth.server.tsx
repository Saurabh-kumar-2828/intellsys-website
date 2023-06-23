import type {Credentials} from "~/backend/utilities/data-management/credentials.server";
import type {Uuid} from "~/utilities/typeDefinitions";
import {ConnectorType} from "~/utilities/typeDefinitions";
import type {ConnectorId} from "~/backend/utilities/data-management/common.server";
import {getArrayOfConnectorIdsAssociatedWithCompanyId} from "~/backend/utilities/data-management/common.server";
import {getRedirectUri, getSystemConnectorsDatabaseManager} from "~/backend/utilities/data-management/common.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getSingletonValueOrNull} from "~/utilities/utilities";

// TODO: Fix timezone in database

export type GoogleAdsAccessibleAccount = {
    customerClientId: string;
    customerClientName: string;
    managerId: string;
    managerName: string;
};

export const googleAdsScope = "https://www.googleapis.com/auth/adwords";
export const googleAnalyticsScope = "https://www.googleapis.com/auth/analytics.readonly";

export type GoogleAdsCredentials = {
    refreshToken: string;
    googleAccountId: string;
    googleLoginCustomerId: string;
};

export type GoogleAdsAccessToken = {
    accessToken: string;
};

export type Connector = {
    id: Uuid;
    accountId: string;
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
    const rawResponse = await response.json();

    if (rawResponse.refresh_token == undefined) {
        return Error("Refresh token not found");
    }

    return rawResponse.refresh_token;
}

/**
 * Retrieves a list of all Google Ads accounts that you are able to act upon directly given your current credentials.
 */
export async function getAccessibleAccounts(refreshToken: string): Promise<Array<GoogleAdsAccessibleAccount> | Error> {
    const googleAdsHelperUrl = getRequiredEnvironmentVariableNew("INTELLSYS_GOOGLE_ADS_HELPER_URL");

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

export function convertToAccessbileAccount(row: Credentials) {
    const result: GoogleAdsAccessibleAccount = {
        customerClientId: row.customer_client_id as string,
        customerClientName: row.customer_client_name as string,
        managerId: row.manager_id as string,
        managerName: row.manager_name as string,
    };

    return result;
}

/**
 * Checks if connector already exists for given accountId.
 */
export async function checkConnectorExistsForAccount(connectorType: ConnectorType, accountId: string): Promise<boolean | Error> {
    const connectorDatabaseManager = await getSystemConnectorsDatabaseManager();
    if (connectorDatabaseManager instanceof Error) {
        return connectorDatabaseManager;
    }

    const response = await connectorDatabaseManager.execute(
        `
        SELECT
            *
        FROM
            connectors
        WHERE
            connector_type = $1
            AND
            extra_information->>'accountId' = $2
    `,
        [connectorType, accountId],
    );

    if (response instanceof Error) {
        return response;
    }

    const row = getSingletonValueOrNull(response.rows);

    if (row == null) {
        return false;
    }

    return true;
}

export async function getConnectorsAssociatedWithCompanyId(companyId: Uuid, connectorType: Uuid): Promise<Array<Connector> | Error> {
    const connectorIds = await getArrayOfConnectorIdsAssociatedWithCompanyId(companyId, connectorType);
    if (connectorIds instanceof Error) {
        return connectorIds;
    }

    if (connectorIds.length == 0) {
        return [];
    }

    const connectors = await getAccountIdForConnector(connectorIds, connectorType);
    if (connectors instanceof Error) {
        return connectors;
    }

    return connectors;
}

/**
 * Retrieves the account id associated with given connector.
 */
export async function getAccountIdForConnector(connectorIds: Array<ConnectorId>, connectorType: Uuid): Promise<Array<Connector> | Error> {
    const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();

    if (systemConnectorsDatabaseManager instanceof Error) {
        return systemConnectorsDatabaseManager;
    }

    const query = `
        SELECT
            id,
            extra_information->>'accountId' AS accountId
        FROM
            connectors
        WHERE
            id IN (${connectorIds.map((item) => `'${item}'`).join(", ")})
            AND
            connector_type = '${connectorType}'
    `;

    const connectorDetails = await systemConnectorsDatabaseManager.execute(query);

    if (connectorDetails instanceof Error) {
        return connectorDetails;
    }

    const result: Array<Connector> = connectorDetails.rows.map((row) => rowToConnector(row as Credentials));

    return result;
}

function rowToConnector(row: Credentials): Connector {
    const result: Connector = {
        id: getUuidFromUnknown(row.id),
        accountId: row.accountid as string,
    };
    return result;
}
