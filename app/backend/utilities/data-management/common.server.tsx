import {DateTime} from "luxon";
import type {Credentials} from "~/backend/utilities/data-management/credentials.server";
import {storeCredentials} from "~/backend/utilities/data-management/credentials.server";
import {getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";
import type {PostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {TransactionCommand} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import type {Integer, Iso8601DateTime, Uuid} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid, getCurrentIsoTimestamp} from "~/global-common-typescript/utilities/utilities";
import {ConnectorType} from "~/utilities/typeDefinitions";
import {ConnectorTableType} from "~/utilities/typeDefinitions";
import {getSingletonValue, getSingletonValueOrNull} from "~/utilities/utilities";
import type {GoogleAdsCredentials} from "~/backend/utilities/data-management/googleOAuth.server";
import {deleteCredentialFromKms} from "~/global-common-typescript/server/kms.server";

export type ConnectorId = Uuid;

export type SourceAndDestinationId = {
    sourceId: Uuid,
    destinationId: Uuid
}

/**
 * Retrives internal Postgres database of the system.
 */
export async function getSystemPostgresDatabaseManager(): Promise<PostgresDatabaseManager | Error> {
    const systemDatabaseCredentialId = getUuidFromUnknown(getRequiredEnvironmentVariable("SYSTEM_DATABASE_CREDENTIAL_ID"));

    const postgresDatabaseManager = await getPostgresDatabaseManager(systemDatabaseCredentialId);
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    return postgresDatabaseManager;
}

/**
 * Retrives internal Connectors database of the system.
 */
export async function getSystemConnectorsDatabaseManager(): Promise<PostgresDatabaseManager | Error> {

    const systemDatabaseCredentialId = getUuidFromUnknown(getRequiredEnvironmentVariable("SYSTEM_CONNECTORS_DATABASE_CREDENTIAL_ID"));

    const connectorsDatabaseManager = await getPostgresDatabaseManager(systemDatabaseCredentialId);
    if (connectorsDatabaseManager instanceof Error) {
        return connectorsDatabaseManager;
    }

    return connectorsDatabaseManager;
}

/**
 * Retrieve company's database credential id.
 */
export async function getDestinationCredentialId(companyId: Uuid): Promise<Uuid | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    const response = await systemPostgresDatabaseManager.execute(
        `
            SELECT
                database_credential_id
            FROM
                company_to_database_mapping
            WHERE
                company_id = $1
        `,
        [companyId]
    );

    if (response instanceof Error) {
        return response;
    }

    const credentials = getSingletonValue(response.rows);

    // TODO: Fix type error
    return getUuidFromUnknown(credentials.database_credential_id);
}

export function getRedirectUri(companyId: Uuid, dataSource: Uuid): string | Error {
    const redirectBaseUri = getRequiredEnvironmentVariableNew("REDIRECT_BASE_URI");

    if (dataSource == ConnectorType.FacebookAds) {
        const url = `${redirectBaseUri}/oauth-callback/3350d73d-64c1-4c88-92b4-0d791d954ae9`;
        return url;
    }

    if (dataSource == ConnectorType.GoogleAds) {
        const url = `${redirectBaseUri}/oauth-callback/0be2e81c-f5a7-41c6-bc34-6668088f7c4e`;
        return url;
    }

    if (dataSource == ConnectorType.GoogleAnalytics) {
        const url = `${redirectBaseUri}/oauth-callback/6cd015ff-ec2e-412a-a777-f983fbdcb63e`;
        return url;
    }

    return Error("Invalid data source!");
}

export async function mapCompanyIdToConnectorId(systemPostgresDatabaseManager: PostgresDatabaseManager, companyId: Uuid, connectorId: Uuid, connectorType: ConnectorType, comments?: string): Promise<void | Error> {

    const response = await systemPostgresDatabaseManager.execute(
        `
            INSERT INTO
                company_to_connector_mapping
            VALUES (
                $1,
                $2,
                $3,
                $4
            )
        `,
        [companyId, connectorId, connectorType, comments]
    )

    if (response instanceof Error) {
        return response;
    }
}

export async function initializeConnectorAndSubConnector(
    systemConnectorsDatabaseManager: PostgresDatabaseManager,
    connectorId: Uuid,
    sourceCredentialId: Uuid,
    destinationCredentialId: Uuid,
    comments: string,
    connectorTableType: ConnectorTableType,
    connectorType: ConnectorType,
    extraInformation?: string
    ): Promise<void | Error> {
    const currentTimestamp = getCurrentIsoTimestamp();

    const historicalCursorThreshold = DateTime.fromISO(currentTimestamp).minus({days: 15}).toJSDate().toISOString() as Iso8601DateTime;

    const connectorResponse = await systemConnectorsDatabaseManager.execute(
        `
            INSERT INTO
                connectors
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
            )
        `,
        [connectorId, currentTimestamp, currentTimestamp, connectorType, sourceCredentialId, destinationCredentialId, comments, extraInformation]
    );

    if (connectorResponse instanceof Error) {
        return connectorResponse;
    }

    const subConnectorResponse = await systemConnectorsDatabaseManager.execute(
        `
            INSERT INTO
                connector_metadata
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
        `,
        [connectorId, connectorTableType, currentTimestamp, currentTimestamp, currentTimestamp, historicalCursorThreshold, comments]
    );

    if (subConnectorResponse instanceof Error) {
        return subConnectorResponse;
    }

}

export async function deleteCompanyIdToConnectorIdMapping(connectorId: Uuid): Promise<void | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        throw systemPostgresDatabaseManager;
    }

    const query1 = `
            DELETE FROM
                company_to_connector_mapping
            WHERE
                connector_id=$1
        `;

    const response = await systemPostgresDatabaseManager.execute(query1, [connectorId]);

    if (response instanceof Error) {
        return response;
    }

}

/**
 * Retrieves a connector Id associated with a given company Id and connector type.
 */
export async function getConnectorId(companyId: Uuid, connectorType: ConnectorType): Promise<Uuid | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        throw systemPostgresDatabaseManager;
    }

    const query1 = `
            SELECT
                *
            FROM
                company_to_connector_mapping
            WHERE
                company_id=$1
            AND
                connector_type=$2
        `;

    const credentialIdRaw = await systemPostgresDatabaseManager.execute(query1, [companyId, connectorType]);

    if (credentialIdRaw instanceof Error) {
        return credentialIdRaw;
    }

    const row = getSingletonValue(credentialIdRaw.rows);

    return rowToConnectorId(row);

}

/**
 * Retrieves source and destination ids associated with connector id.
 */
export async function getSourceAndDestinationId(connectorId: Uuid): Promise<SourceAndDestinationId | Error> {
    const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();
    if (systemConnectorsDatabaseManager instanceof Error) {
        throw systemConnectorsDatabaseManager;
    }

    const query1 = `
            SELECT
                source_credentials_id,
                destination_credentials_id
            FROM
                connectors
            WHERE
                id=$1
        `;

    const connectorResponse = await systemConnectorsDatabaseManager.execute(query1, [connectorId]);

    if (connectorResponse instanceof Error) {
        return connectorResponse;
    }

    const row = getSingletonValue(connectorResponse.rows);

    // TODO: Refactor the implementation.
    return rowToSourceAndDestinationId(row);

}

function rowToSourceAndDestinationId(row: Credentials): SourceAndDestinationId {
    const result: SourceAndDestinationId = {
        sourceId: getUuidFromUnknown(row.source_credentials_id),
        destinationId: getUuidFromUnknown(row.destination_credentials_id)
    }

    return result;
}

/**
 * Retrieves a connector Id associated with a given company Id and connector type.
 */
export async function doesConnectorIdExists(companyId: Uuid, connectorType: ConnectorType): Promise<boolean> {
    // Remove this function
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        throw systemPostgresDatabaseManager;
    }

    const query1 = `
            SELECT
                *
            FROM
                company_to_connector_mapping
            WHERE
                company_id=$1
            AND
                connector_type=$2
        `;

    const credentialIdRaw = await systemPostgresDatabaseManager.execute(query1, [companyId, connectorType]);

    if (credentialIdRaw instanceof Error) {
        console.log(credentialIdRaw);
    }

    const row = getSingletonValueOrNull(credentialIdRaw.rows);
    if (row == null) {
        return false;
    }
    return true;
}

function rowToConnectorId(row: any): ConnectorId {
    const id: ConnectorId = getUuidFromUnknown(row.connector_id);

    return id;
}

/**
 * Delete a credential Id associated with a given company Id and credential type.
 */
export async function deleteCompanyIdToCredentialIdMapping(credentialId: Uuid): Promise<void | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        throw systemPostgresDatabaseManager;
    }

    const query1 = `
            DELETE FROM
                credentials_store
            WHERE
                credential_id=$1
        `;

    const response = await systemPostgresDatabaseManager.execute(query1, [credentialId]);

    if (response instanceof Error) {
        return response;
    }

}

/**
 * Delete connectors and subconnector associated with connector id.
 */
export async function deleteConnectorAndSubconnector(connectorId: Uuid): Promise<void | Error> {
    const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();
    if (systemConnectorsDatabaseManager instanceof Error) {
        throw systemConnectorsDatabaseManager;
    }

    const query1 = `
            DELETE FROM
                connectors
            WHERE
                id=$1
        `;

    const connectorResponse = await systemConnectorsDatabaseManager.execute(query1, [connectorId]);

    if (connectorResponse instanceof Error) {
        return connectorResponse;
    }

    const query2 = `
            DELETE FROM
                connector_metadata
            WHERE
                connector_id=$1
        `;

    const connectorMetadataResponse = await systemConnectorsDatabaseManager.execute(query2, [connectorId]);

    if (connectorMetadataResponse instanceof Error) {
        return connectorMetadataResponse;
    }
}

export async function ingestAndStoreGoogleAdsData(credentials: GoogleAdsCredentials, companyId: Uuid, connectorId: Uuid): Promise<void | Error> {
    const response = await storeGoogleAdsOAuthDetails(credentials, companyId, connectorId);
    if (response instanceof Error) {
        return response;
    }
}

/**
 *  Handles the OAuth2 flow to authorize the Google Ads API for the given companyId and stores the credentials in KMS table, connectors table, subconnecter table and companyToConnectorTable.
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
        const response = await storeCredentials(getUuidFromUnknown(sourceCredentialId), credentials, companyId, getUuidFromUnknown(ConnectorType.GoogleAds));
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
            "Google Ads",
            ConnectorTableType.GoogleAds,
            ConnectorType.GoogleAds,
            `{"accountId": "${credentials.googleLoginCustomerId}"}`,
        );

        const mapCompanyIdToConnectorIdResponse = await mapCompanyIdToConnectorId(systemPostgresDatabaseManager, companyId, connectorId, ConnectorType.GoogleAds, "Google Ads");

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

        const dataIngestionResponse = await ingestGoogleAdsData(getUuidFromUnknown(connectorId), 45);
        if (dataIngestionResponse instanceof Error) {
            return dataIngestionResponse;
        }

    } catch (e) {
        console.log(e);
    }
}

/**
 * Store the Google Ads data in the company's database through intellsys-connectors.
 * @param connectorId: Unique id of the connector object.
 * @param duration: Duration to ingest data.
 * @returns : No. of rows deleted and inserted.
 */
export async function ingestGoogleAdsData(connectorId: Uuid, duration: Integer, connector?: string): Promise<void | Error> {
    try {
        const url = `${getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_URL")}/googleads/historical`;

        const body = new FormData();
        body.set("connectorId", connectorId);
        body.set("duration", duration.toString());

        const headers = new Headers();
        headers.append("Authorization", getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_TOKEN"));

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: body,
            redirect: "follow",
        });

        if (!response.ok) {
            return Error(await response.text());
        }

        const ingestionResult = await response.json();
        console.log(ingestionResult);

    } catch(e) {
        console.log(e);
    }
}

// export async function createTable(postgresDatabaseManager: PostgresDatabaseManager, googleAdsCredentials: GoogleAdsCredentials): Promise<Error | void> {
//     const tableName = `${dataSourcesAbbreviations.googleAds}_${googleAdsCredentials.googleLoginCustomerId}`;

//     const response = await postgresDatabaseManager.execute(
//         `
//             CREATE TABLE ${tableName} (
//                 id text NOT NULL,
//                 ingested_at timestamp NOT NULL,
//                 "data" json NOT NULL,
//                 CONSTRAINT ${tableName}_pkey PRIMARY KEY (id)
//             );
//         `,
//     );

//     if (response instanceof Error) {
//         return response;
//     }
// }

export async function createTable(postgresDatabaseManager: PostgresDatabaseManager, tableName: string): Promise<Error | void> {

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

export async function deleteConnector(connectorId: Uuid, accountId: string, tablePrefix: string) {
    // TODO: Add transactions

    const connector = await getSourceAndDestinationId(connectorId);
    if (connector instanceof Error) {
        return connector;
    }

    const systemPostgresDatabaseManager = getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    // TODO: Discuss if this is required.
    await deleteCompanyIdToCredentialIdMapping(connector.sourceId);

    await deleteCredentialFromKms(connector.sourceId);

    await deleteCompanyIdToConnectorIdMapping(connectorId);
    await deleteConnectorAndSubconnector(connectorId);

    // Delete data from google ads data
    await dropConnectorTable(accountId, connector.destinationId, tablePrefix);
}

async function dropConnectorTable(accountId: string, destinationDatabaseCredentialId: Uuid, tablePrefix: string) {
    const databaseManager = await getPostgresDatabaseManager(destinationDatabaseCredentialId);
    if (databaseManager instanceof Error) {
        return databaseManager;
    }

    const query = `
        DROP TABLE ${tablePrefix}_${accountId}
    `;

    const response = await databaseManager.execute(query);

    if (response instanceof Error) {
        return response;
    }
}

export async function getArrayOfConnectorIdsAssociatedWithCompanyId(
    companyId: Uuid,
    connectorType: Uuid
): Promise<Array<ConnectorId> | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    const connectorIdsResponse = await systemPostgresDatabaseManager.execute(
        `
            SELECT
                connector_id
            FROM
                company_to_connector_mapping
            WHERE
                company_id = $1
                AND
                connector_type = $2
        `,
        [companyId, connectorType],
    );

    if (connectorIdsResponse instanceof Error) {
        return connectorIdsResponse;
    }
    if(connectorIdsResponse.rowCount == 0){
        return [];
    }

    const connectorIds: Array<ConnectorId> = connectorIdsResponse.rows.map((row) => getUuidFromUnknown(row.connector_id));

    return connectorIds;
}
