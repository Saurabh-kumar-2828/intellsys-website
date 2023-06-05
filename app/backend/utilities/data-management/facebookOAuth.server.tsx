import {
    getDestinationCredentialId,
    getRedirectUri,
    getSystemConnectorsDatabaseManager,
    getSystemPostgresDatabaseManager,
    initializeConnectorAndSubConnector,
    mapCompanyIdToConnectorId,
} from "~/backend/utilities/data-management/common.server";
import {storeCredentials} from "~/backend/utilities/data-management/credentials.server";
import {ingestHistoricalDataFromConnectorsApi, intellsysConnectors} from "~/global-common-typescript/server/connectors.server";
import type {PostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {TransactionCommand, getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import type {Uuid} from "~/utilities/typeDefinitions";
import {ConnectorTableType, ConnectorType, dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {CredentialType} from "~/utilities/typeDefinitions";

export const facebookAdsScope = "ads_read, ads_management";

type FacebookAdsSourceCredentials = {
    facebookExchangeToken: string;
    adAccountId?: string;
};

const facebookApiBaseUrl = "https://graph.facebook.com";

/**
 * Post API to get access token.
 * @returns FacebookAdsSourceCredentials
 */
async function getFacebookAdsAccessToken(redirectUri: string, authorizationCode: string): Promise<FacebookAdsSourceCredentials | Error> {
    const apiVersion = getRequiredEnvironmentVariableNew("FACEBOOK_API_VERSION");
    const clientId = getRequiredEnvironmentVariableNew("FACEBOOK_CLIENT_ID");
    const clientSecret = getRequiredEnvironmentVariableNew("FACEBOOK_CLIENT_SECRET");

    const url = `
        ${facebookApiBaseUrl}/${apiVersion}/oauth/access_token?
        client_id=${clientId}&
        client_secret=${clientSecret}&
        redirect_uri=${redirectUri}&
        code=${authorizationCode}
    `;

    const response = await fetch(url, {
        method: "POST",
    });

    const responseJson = await response.json();
    const acceseToken = mapTokenToFacebookAdsSourceCredentialsType(responseJson);

    return acceseToken;
}

/**
 * Handles the OAuth2 flow to authorize the Facebook API for the given companyId and stores the credentials in database.
 */
export async function facebookOAuthFlow(authorizationCode: string, companyId: Uuid, adAccountId: string): Promise<void | Error> {
    const redirectUri = getRedirectUri(companyId, CredentialType.FacebookAds);
    if (redirectUri instanceof Error) {
        return redirectUri;
    }

    // TODO: Rename
    const credentials = await getFacebookAdsAccessToken(redirectUri, authorizationCode);
    if (credentials instanceof Error) {
        return credentials;
    }

    credentials["adAccountId"] = adAccountId;

    const sourceCredentialId = generateUuid();

    const connectorId = generateUuid();

    // Destination = Company's Database.
    const companyDatabaseCredentialId = await getDestinationCredentialId(companyId);

    if (companyDatabaseCredentialId instanceof Error) {
        return companyDatabaseCredentialId;
    }

    const companyDatabaseManager = await getPostgresDatabaseManager(companyDatabaseCredentialId);
    if (companyDatabaseManager instanceof Error) {
        return companyDatabaseManager;
    }

    // System Database
    const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();
    if (systemConnectorsDatabaseManager instanceof Error) {
        return systemConnectorsDatabaseManager;
    }

    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    // Store source credentials in KMS.
    const response = await storeCredentials(getUuidFromUnknown(sourceCredentialId), credentials, companyId, CredentialType.FacebookAds);
    if (response instanceof Error) {
        return response;
    }

    await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);
    await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);

    const connectorInitializationResponse = await initializeConnectorAndSubConnector(
        systemConnectorsDatabaseManager,
        connectorId,
        sourceCredentialId,
        companyDatabaseCredentialId,
        `Facebook Ads: ${credentials.adAccountId}`,
        ConnectorTableType.FacebookAds,
        ConnectorType.FacebookAds,
        `{"accountId": "${credentials.adAccountId}"}`,
    );

    const mapCompanyIdToConnectorIdResponse = await mapCompanyIdToConnectorId(systemPostgresDatabaseManager, companyId, connectorId, ConnectorType.FacebookAds, "Facebook Ads");

    if (connectorInitializationResponse instanceof Error || mapCompanyIdToConnectorIdResponse instanceof Error) {
        await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);
        await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);

        console.log("All transactions rollbacked");
        return connectorInitializationResponse;
    }

    await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);
    await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);

    // Creates a source table in company's database.
    const createTableResponse = await createTable(companyDatabaseManager, credentials);
    if (createTableResponse instanceof Error) {
        return createTableResponse;
    }

    const dataIngestionResponse = await ingestHistoricalDataFromConnectorsApi(getUuidFromUnknown(connectorId), 45, intellsysConnectors.FacebookAds);
    if (dataIngestionResponse instanceof Error) {
        return dataIngestionResponse;
    }
}

async function createTable(postgresDatabaseManager: PostgresDatabaseManager, facebookAdsCredentials: FacebookAdsSourceCredentials): Promise<Error | void> {
    const tableName = `${dataSourcesAbbreviations.facebookAds}_${facebookAdsCredentials.adAccountId}`;

    const response = await postgresDatabaseManager.execute(
        `
            CREATE TABLE ${tableName} (
                id text NOT NULL,
                ingested_at timestamp NOT NULL,
                "data" json NOT NULL,
                CONSTRAINT ${tableName}_pkey PRIMARY KEY (id)
            );
        `,
    );

    if (response instanceof Error) {
        return response;
    }
}

function mapTokenToFacebookAdsSourceCredentialsType(credentials: any): FacebookAdsSourceCredentials | Error {
    if (credentials.access_token == undefined) {
        return Error("Invalid Facebook Ads credentials");
    }

    let result: FacebookAdsSourceCredentials = {
        facebookExchangeToken: credentials.access_token,
    };

    return result;
}

export function getFacebookAuthorizationCodeUrl(redirectUri: string) {
    const apiVersion = getRequiredEnvironmentVariableNew("FACEBOOK_API_VERSION");
    const clientId = getRequiredEnvironmentVariableNew("FACEBOOK_CLIENT_ID");

    const url = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${facebookAdsScope}`;

    return url;
}

export function checkIfFacebookAdsConnectorExistsForAccount(adAccountId: string) {}