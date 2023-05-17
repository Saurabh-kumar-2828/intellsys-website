import {getCredentialId} from "~/backend/utilities/data-management/credentials.server";
import {storeCredentials} from "~/backend/utilities/data-management/credentials.server";
import type {Uuid} from "~/utilities/typeDefinitions";
import {dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {ConnectorTableType, ConnectorType} from "~/utilities/typeDefinitions";
import {CredentialType} from "~/utilities/typeDefinitions";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {deleteCompanyIdToConnectorIdMapping, deleteCompanyIdToCredentialIdMapping, deleteConnectorAndSubconnector, getConnectorId, getDestinationCredentialId, getRedirectUri, getSystemConnectorsDatabaseManager, getSystemPostgresDatabaseManager, initializeConnectorAndSubConnector, mapCompanyIdToConnectorId} from "~/backend/utilities/data-management/common.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import type {Integer} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {TransactionCommand, getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {deleteCredentialFromKms} from "~/global-common-typescript/server/kms.server";
import jwt from "jsonwebtoken";
import {getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";


// TODO: Fix timezone in database

export const googleAdsScope = "https://www.googleapis.com/auth/adwords";

export type GoogleAdsCredentials = {
    refreshToken: string,
    googleAccountId: string,
    googleLoginCustomerId: string
};

export type GoogleAdsAccessToken = {
    accessToken: string
}

export async function getGoogleAdsRefreshToken(authorizationCode: string, companyId: Uuid): Promise<string | Error> {
    const redirectUri = getRedirectUri(companyId, CredentialType.GoogleAds);
    if (redirectUri instanceof Error) {
        return redirectUri;
    }

    // Post api to retrieve access token by giving authorization code.
    const url = `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_CLIENT_ID!}&client_secret=${process.env
        .GOOGLE_CLIENT_SECRET!}&redirect_uri=${redirectUri}&code=${authorizationCode}&grant_type=authorization_code`;

    const response = await fetch(url, {
        method: "POST",
    });
    const rawResponse = await response.json();

    if(rawResponse.refresh_token == undefined) {
        return Error("Refresh token not found");
    }

    return rawResponse.refresh_token;
}


export async function ingestAndStoreGoogleAdsData(credentials: string, companyId: Uuid) {

    const credentialsDecoded = jwt.verify(credentials, getRequiredEnvironmentVariable("TOKEN_SECRET")) as GoogleAdsCredentials;

    const response = await storeGoogleAdsOAuthDetails(credentialsDecoded, companyId);
    if(response instanceof Error){
        return response;
    }
}

/**
 *  Handles the OAuth2 flow to authorize the Google Ads API for the given companyId and stores the credentials in KMS table, connectors table, subconnecter table and companyToConnectorTable
 */
export async function storeGoogleAdsOAuthDetails(credentials: GoogleAdsCredentials, companyId: Uuid): Promise<void | Error> {
    try {

        const sourceCredentialId = generateUuid();

        const connectorId = generateUuid();

        // Destination = Company's Database.
        const companyDatabaseCredentialId = await getDestinationCredentialId(companyId);
        if (companyDatabaseCredentialId instanceof Error) {

            return companyDatabaseCredentialId;
        }

        const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();
        if (systemConnectorsDatabaseManager instanceof Error) {
            return systemConnectorsDatabaseManager;
        }

        const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
        if (systemPostgresDatabaseManager instanceof Error) {
            return systemPostgresDatabaseManager;
        }

        // Store credentials in KMS.
        const response = await storeCredentials(
            getUuidFromUnknown(sourceCredentialId),
            credentials,
            companyId,
            CredentialType.GoogleAds
        );
        if (response instanceof Error) {
            return response;
        }

        await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);
        await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);

        const connectorInitializationResponse = await initializeConnectorAndSubConnector(systemConnectorsDatabaseManager, connectorId, sourceCredentialId, companyDatabaseCredentialId, "Google Ads", ConnectorTableType.GoogleAds, ConnectorType.GoogleAds);

        const mapCompanyIdToConnectorIdResponse = await mapCompanyIdToConnectorId(systemPostgresDatabaseManager, companyId, connectorId, ConnectorType.GoogleAds, "Google Ads");

        if (connectorInitializationResponse instanceof Error || mapCompanyIdToConnectorIdResponse instanceof Error) {
            await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);
            await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);

            console.log("All transactions rollbacked");
            return connectorInitializationResponse;
        }

        await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);
        await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);

        const createTableResponse = await createTable(companyDatabaseCredentialId, credentials);
        if(createTableResponse instanceof Error){
            throw Error("Failed to create table!");
        }

        const dataIngestionResponse = await ingestGoogleAdsData(getUuidFromUnknown(connectorId), 15);
        if (dataIngestionResponse instanceof Error) {
            return dataIngestionResponse;
        }


    } catch (e) {
        console.log(e);
    }
}


export async function createTable(databaseCredentialId: Uuid, googleAdsCredentials: GoogleAdsCredentials): Promise<Error | void> {
    const postgresDatabaseManager = await getPostgresDatabaseManager(databaseCredentialId);
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }
    // TODO: check if it is right id

    const tableName = `${dataSourcesAbbreviations.googleAds}_${googleAdsCredentials.googleLoginCustomerId}`;
    const response = await postgresDatabaseManager.execute(
        `
            CREATE TABLE ${tableName} (
                id text NOT NULL,
                ingested_at timestamp NOT NULL,
                "data" json NOT NULL,
                CONSTRAINT ${tableName}_pkey PRIMARY KEY (id)
            );
        `
    )

    if(response instanceof Error){
        return response;
    }

}


export async function ingestGoogleAdsData(connectorId: Uuid, duration: Integer): Promise<void | Error> {
    const url = `${getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_URL")}/googleads/historical`;

    const body = new FormData();
    body.set("connectorId", connectorId);
    body.set("duration", duration.toString());

    const headers = new Headers();
    headers.append("Authorization", getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_TOKEN"))

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
        redirect: 'follow'
    });

    if (!response.ok) {
        return Error(await response.text());
    }

    const ingestionResult = await response.json();
    console.log(ingestionResult);
}

export async function deleteCredentialsFromSources(companyId: Uuid, credentialType: Uuid, connectorType: ConnectorType) {

    // TODO: Add transactions

    const systemPostgresDatabaseManager = getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    // get from connector;

    // Delete Credential and its details
    const credentialId = await getCredentialId(companyId, credentialType);
    if (credentialId instanceof Error) {
        return credentialId;
    }

    await deleteCompanyIdToCredentialIdMapping(credentialId);

    await deleteCredentialFromKms(credentialId);

    // Delete Connector and its details
    const connectorId = await getConnectorId(companyId, connectorType);
    if (connectorId instanceof Error) {
        return connectorId;
    }

    await deleteCompanyIdToConnectorIdMapping(connectorId);
    await deleteConnectorAndSubconnector(connectorId);

    // Delete data from google ads data
    await dropGoogleAdsTable(companyId);
}

export async function dropGoogleAdsTable(companyId: Uuid) {
    const destinationCredentialId = await getDestinationCredentialId(companyId);
    if (destinationCredentialId instanceof Error) {
        return destinationCredentialId;
    }

    const databaseManager = await getPostgresDatabaseManager(destinationCredentialId);
    if (databaseManager instanceof Error) {
        return databaseManager;
    }

    // Change it to DROP
    const query = `
        DELETE FROM google_ads_insights
    `;

    const response = await databaseManager.execute(query);

    if (response instanceof Error) {
        return response;
    }
}
