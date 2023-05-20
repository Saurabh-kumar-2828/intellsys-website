import {Credentials, getCredentialId} from "~/backend/utilities/data-management/credentials.server";
import {storeCredentials} from "~/backend/utilities/data-management/credentials.server";
import type {Uuid} from "~/utilities/typeDefinitions";
import {dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {ConnectorTableType, ConnectorType} from "~/utilities/typeDefinitions";
import {CredentialType} from "~/utilities/typeDefinitions";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {deleteCompanyIdToConnectorIdMapping, deleteCompanyIdToCredentialIdMapping, deleteConnectorAndSubconnector, getConnectorId, getDestinationCredentialId, getRedirectUri, getSourceAndDestinationId, getSystemConnectorsDatabaseManager, getSystemPostgresDatabaseManager, initializeConnectorAndSubConnector, mapCompanyIdToConnectorId} from "~/backend/utilities/data-management/common.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import type {Integer} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {PostgresDatabaseManager, TransactionCommand, getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {deleteCredentialFromKms} from "~/global-common-typescript/server/kms.server";
import jwt from "jsonwebtoken";
import {getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";
import {getSingletonValueOrNull} from "~/utilities/utilities";


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

export type Connector = {
    id: Uuid
    loginCustomerId: string
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

    if (rawResponse.refresh_token == undefined) {
        return Error("Refresh token not found");
    }

    return rawResponse.refresh_token;
}


export async function ingestAndStoreGoogleAdsData(credentials: string, companyId: Uuid, connectorId: Uuid): Promise<void | Error> {

    const credentialsDecoded = jwt.verify(credentials, getRequiredEnvironmentVariable("TOKEN_SECRET")) as GoogleAdsCredentials;

    const response = await storeGoogleAdsOAuthDetails(credentialsDecoded, companyId, connectorId);
    if (response instanceof Error) {
        return response;
    }
}

/**
 *  Handles the OAuth2 flow to authorize the Google Ads API for the given companyId and stores the credentials in KMS table, connectors table, subconnecter table and companyToConnectorTable
 */
export async function storeGoogleAdsOAuthDetails(credentials: GoogleAdsCredentials, companyId: Uuid, connectorId: Uuid): Promise<void | Error> {
    try {

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

        const connectorInitializationResponse = await initializeConnectorAndSubConnector(systemConnectorsDatabaseManager, connectorId, sourceCredentialId, companyDatabaseCredentialId, "Google Ads", ConnectorTableType.GoogleAds, ConnectorType.GoogleAds, `{"loginCustomerId": "${credentials.googleLoginCustomerId}"}`);

        const mapCompanyIdToConnectorIdResponse = await mapCompanyIdToConnectorId(systemPostgresDatabaseManager, companyId, connectorId, ConnectorType.GoogleAds, "Google Ads");

        if (connectorInitializationResponse instanceof Error || mapCompanyIdToConnectorIdResponse instanceof Error ) {
            await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);
            await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);

            console.log("All transactions rollbacked");
            return connectorInitializationResponse;
        }

        await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);
        await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);

        const createTableResponse = await createTable(companyDatabaseManager, credentials);
        if (createTableResponse instanceof Error){
            return createTableResponse;
        }

        const dataIngestionResponse = await ingestGoogleAdsData(getUuidFromUnknown(connectorId), 30);
        if (dataIngestionResponse instanceof Error) {
            return dataIngestionResponse;
        }

    } catch (e) {
        console.log(e);
    }
}


export async function createTable(postgresDatabaseManager: PostgresDatabaseManager, googleAdsCredentials: GoogleAdsCredentials): Promise<Error | void> {
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

    if (response instanceof Error) {
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


export async function deleteCredentialsFromSources(connectorId: Uuid, googleAdsLoginCustomerId: string, connectorType: ConnectorType) {

    // TODO: Add transactions

    const connector = await getSourceAndDestinationId(connectorId);
    if(connector instanceof Error){
        return connector;
    }

    const systemPostgresDatabaseManager = getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    await deleteCompanyIdToCredentialIdMapping(connector.sourceId);

    await deleteCredentialFromKms(connector.sourceId);

    await deleteCompanyIdToConnectorIdMapping(connectorId);
    await deleteConnectorAndSubconnector(connectorId);

    // Delete data from google ads data
    await dropGoogleAdsTable(googleAdsLoginCustomerId, connector.destinationId);
}


export async function dropGoogleAdsTable(accountId: string, destinationDatabaseCredentialId: Uuid) {
    const databaseManager = await getPostgresDatabaseManager(destinationDatabaseCredentialId);
    if (databaseManager instanceof Error) {
        return databaseManager;
    }

    // Change it to DROP
    const query = `
        DROP TABLE ${dataSourcesAbbreviations.googleAds}_${accountId}
    `;

    const response = await databaseManager.execute(query);

    if (response instanceof Error) {
        return response;
    }
}

export async function checkGoogleAdsConnectorExistsForAccount(googleLoginCustomerId: string): Promise<boolean | Error> {
    const connectorDatabaseManager = await getSystemConnectorsDatabaseManager();
    if (connectorDatabaseManager instanceof Error) {
        return connectorDatabaseManager;
    }

    const response = await connectorDatabaseManager.execute(`
        SELECT
            *
        FROM
            connectors
        WHERE
            connector_type = $1
            AND
            extra_information->>'loginCustomerId' = $2
    `, [ConnectorType.GoogleAds, googleLoginCustomerId]
    );

    const row = getSingletonValueOrNull(response.rows);

    if (row != null) {
        return true;
    }

    return false;
}


export async function getGoogleAdsConnectorsAssociatedWithCompanyId(companyId: Uuid): Promise<Array<Connector> | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();

    if (systemConnectorsDatabaseManager instanceof Error) {

        return systemConnectorsDatabaseManager;
    }


    const connectorIdsResponse = await systemPostgresDatabaseManager.execute(
        `
            SELECT
                connector_id
            FROM
                company_to_connector_mapping
            WHERE
                company_id = $1
        `, [companyId]
    )


    if (connectorIdsResponse instanceof Error) {
        return connectorIdsResponse;
    }


    if (connectorIdsResponse.rows.length == 0) {

        return Error("Connector Ids not found!")
    }


    const connectorIds: Array<Uuid> = connectorIdsResponse.rows.map((row) => getUuidFromUnknown(row.connector_id));


    const connectorDetails = await systemConnectorsDatabaseManager.execute(
        `
            SELECT
                id,
                extra_information->>'loginCustomerId' AS loginCustomerId
            FROM
                connectors
            WHERE
                id IN (${connectorIds.map((item) => `'${item}'`).join(", ")})
                AND
                connector_type = $1
        `, [ConnectorType.GoogleAds]
    );


    if(connectorDetails instanceof Error){

        return connectorDetails;
    }

    const result: Array<Connector> = connectorDetails.rows.map((row) => rowToConnector(row));
    return result;
}

function rowToConnector(row: Credentials): Connector {
    const result: Connector = {
        id: getUuidFromUnknown(row.id),
        loginCustomerId: row.logincustomerid as string
    }
    return result;
}
