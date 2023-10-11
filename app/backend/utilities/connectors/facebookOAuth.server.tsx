import {ingestHistoricalDataFromConnectorsApi} from "~/backend/connectors.server";
import {
    createTable,
    getConnectorsAssociatedWithCompanyId,
    getDestinationCredentialId,
    getRedirectUri,
    getSystemConnectorsDatabaseManager,
    getSystemPostgresDatabaseManager,
    initializeConnectorAndSubConnector,
    mapCompanyIdToConnectorId,
} from "~/backend/utilities/connectors/common.server";
import {addCredentialToKms, deleteCredentialFromKms} from "~/common-remix--kms--intellsys-kms/kms.server";
import {TransactionCommand, getPostgresDatabaseManager} from "~/common--database-manager--postgres/postgresDatabaseManager.server";
import {getRequiredEnvironmentVariable} from "~/common-remix--utilities/utilities.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import type {Uuid} from "~/utilities/typeDefinitions";
import {ConnectorTableType, ConnectorType, dataSourcesAbbreviations} from "~/utilities/typeDefinitions";

export const facebookAdsScope = "ads_read, ads_management, public_profile, business_management";

export type FacebookAdsSourceCredentials = {
    facebookExchangeToken: string;
    adAccountId?: string;
};

export type FacebookAccessibleAccount = {
    accountId: string;
    accountName: string;
    disable: boolean;
};

const facebookApiBaseUrl = "https://graph.facebook.com";

/**
 * Post API to get access token.
 * @returns FacebookAdsSourceCredentials
 */
export async function getFacebookAdsAccessToken(authorizationCode: string, companyId: Uuid): Promise<FacebookAdsSourceCredentials | Error> {
    const redirectUri = getRedirectUri(companyId, getUuidFromUnknown(ConnectorType.FacebookAds));
    if (redirectUri instanceof Error) {
        return redirectUri;
    }

    const apiVersion = getRequiredEnvironmentVariable("FACEBOOK_API_VERSION");
    const clientId = getRequiredEnvironmentVariable("FACEBOOK_CLIENT_ID");
    const clientSecret = getRequiredEnvironmentVariable("FACEBOOK_CLIENT_SECRET");

    const url = `${facebookApiBaseUrl}/${apiVersion}/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${authorizationCode}`;

    const response = await fetch(url, {
        method: "POST",
    });

    const responseJson = await response.json();
    const acceseToken = mapTokenToFacebookAdsSourceCredentialsType(responseJson);

    return acceseToken;
}

/**
 * Generates new access token for facebook ads.
 * @returns New access token.
 */
export async function refreshFacebookAdsAccessToken(oldAccessToken: string): Promise<FacebookAdsSourceCredentials | Error> {
    const apiVersion = getRequiredEnvironmentVariable("FACEBOOK_API_VERSION");
    const clientId = getRequiredEnvironmentVariable("FACEBOOK_CLIENT_ID");
    const clientSecret = getRequiredEnvironmentVariable("FACEBOOK_CLIENT_SECRET");

    const url = `${facebookApiBaseUrl}/${apiVersion}/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${oldAccessToken}&grant_type=fb_exchange_token`;

    const response = await fetch(url, {
        method: "GET",
    });

    const responseJson = await response.json();
    const acceseToken = mapTokenToFacebookAdsSourceCredentialsType(responseJson);

    return acceseToken;
}

/**
 * Handles the OAuth2 flow to authorize the Facebook API for the given companyId and stores the credentials in database.
 */
export async function facebookOAuthFlow(facebookAdsCredentials: FacebookAdsSourceCredentials, companyId: Uuid, connectorId: Uuid, extraInformation: {[key: string]: any}): Promise<void | Error> {
    const sourceCredentialId = generateUuid();

    // Destination = Company's Database.
    const companyDatabaseCredentialId = await getDestinationCredentialId(companyId);

    if (companyDatabaseCredentialId instanceof Error) {
        return companyDatabaseCredentialId;
    }

    const companyDatabaseManager = await getPostgresDatabaseManager(companyDatabaseCredentialId);
    if (companyDatabaseManager instanceof Error) {
        return companyDatabaseManager;
    }

    // System Database.
    const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();
    if (systemConnectorsDatabaseManager instanceof Error) {
        return systemConnectorsDatabaseManager;
    }

    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);
    await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);

    // Store source credentials in KMS.
    const response = await addCredentialToKms(getUuidFromUnknown(sourceCredentialId), JSON.stringify(facebookAdsCredentials), `${companyId} - Facebook Ads`);
    if (response instanceof Error) {
        return response;
    }

    const connectorInitializationResponse = await initializeConnectorAndSubConnector(
        systemConnectorsDatabaseManager,
        connectorId,
        sourceCredentialId,
        companyDatabaseCredentialId,
        `Facebook Ads: ${facebookAdsCredentials.adAccountId}`,
        ConnectorTableType.FacebookAds,
        ConnectorType.FacebookAds,
    );

    const mapCompanyIdToConnectorIdResponse = await mapCompanyIdToConnectorId(
        systemPostgresDatabaseManager,
        companyId,
        connectorId,
        ConnectorType.FacebookAds,
        "Facebook Ads",
        JSON.stringify(extraInformation),
    );

    if (connectorInitializationResponse instanceof Error || mapCompanyIdToConnectorIdResponse instanceof Error) {
        await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);
        await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);

        const response = await deleteCredentialFromKms(sourceCredentialId);

        console.log("All transactions rollbacked");
        return connectorInitializationResponse;
    }

    await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);
    await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);

    // Creates a source table in company's database.
    const tableName = `${dataSourcesAbbreviations.facebookAds}_${facebookAdsCredentials.adAccountId}`;
    const createTableResponse = await createTable(companyDatabaseManager, tableName);
    if (createTableResponse instanceof Error) {
        return createTableResponse;
    }

    const dataIngestionResponse = await ingestHistoricalDataFromConnectorsApi(getUuidFromUnknown(connectorId), 45, getUuidFromUnknown(ConnectorType.FacebookAds));
    if (dataIngestionResponse instanceof Error) {
        return dataIngestionResponse;
    }
}

function mapTokenToFacebookAdsSourceCredentialsType(credentials: unknown): FacebookAdsSourceCredentials | Error {
    if (credentials.access_token == undefined) {
        return Error("Invalid Facebook Ads credentials");
    }

    let result: FacebookAdsSourceCredentials = {
        facebookExchangeToken: credentials.access_token,
    };

    return result;
}

export function getFacebookAuthorizationCodeUrl(redirectUri: string, state: string) {
    const apiVersion = getRequiredEnvironmentVariable("FACEBOOK_API_VERSION");
    const clientId = getRequiredEnvironmentVariable("FACEBOOK_CLIENT_ID");

    const url = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${facebookAdsScope}&state=${state}`;

    return url;
}

export async function getAccessibleAccounts(credentials: FacebookAdsSourceCredentials, companyId: Uuid) {
    const apiVersion = getRequiredEnvironmentVariable("FACEBOOK_API_VERSION");
    const fields = "account_id,account_status,business,business_name,users,name";
    let after = "";
    const accessibleAccounts: Array<FacebookAccessibleAccount> = [];

    while (true) {
        const url = `${facebookApiBaseUrl}/${apiVersion}/me/adaccounts?fields=${fields}&access_token=${credentials.facebookExchangeToken}&after=${after}`;

        const response = await fetch(url, {
            method: "GET",
        });

        const responseJson = await response.json();
        if (!responseJson.paging) {
            break;
        }

        const data = responseJson.data.map((row) => {
            return convertToFacebookAccessibleAccount(row);
        });

        accessibleAccounts.push(...data);

        after = responseJson.paging.cursors.after;
    }

    // Array of existing facebook connectors.
    const facebookConnectorDetails = await getConnectorsAssociatedWithCompanyId(companyId, getUuidFromUnknown(ConnectorType.FacebookAds));
    if (facebookConnectorDetails instanceof Error) {
        return facebookConnectorDetails;
    }

    const existingAccountIds = new Set(facebookConnectorDetails.map((obj) => obj.accountId));
    const newAccounts = accessibleAccounts.map((obj) => {
        if (existingAccountIds.has(obj.accountId)) {
            obj.disable = true;
            return obj;
        } else {
            return obj;
        }
    });

    return newAccounts;
}

function convertToFacebookAccessibleAccount(row: unknown): FacebookAccessibleAccount {
    const result: FacebookAccessibleAccount = {
        accountId: row.account_id,
        accountName: row.name,
        disable: false,
    };

    return result;
}
