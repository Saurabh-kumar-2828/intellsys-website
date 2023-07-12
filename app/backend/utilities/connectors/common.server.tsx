import {DateTime} from "luxon";
import {getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";
import type {PostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import type {Iso8601DateTime, Uuid} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getCurrentIsoTimestamp, getSingletonValue, getSingletonValueOrNull} from "~/global-common-typescript/utilities/utilities";
import {ConnectorType} from "~/utilities/typeDefinitions";
import type {ConnectorTableType} from "~/utilities/typeDefinitions";
import {deleteCredentialFromKms} from "~/global-common-typescript/server/kms.server";
import type {Connector} from "./googleOAuth.server";

export type ConnectorId = Uuid;

export type SourceAndDestinationId = {
    sourceId: Uuid;
    destinationId: Uuid;
};

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
                companies
            WHERE
                id = $1
        `,
        [companyId],
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

export async function mapCompanyIdToConnectorId(
    systemPostgresDatabaseManager: PostgresDatabaseManager,
    companyId: Uuid,
    connectorId: Uuid,
    connectorType: typeof ConnectorType,
    comments?: string,
    extraInformation?: string,
): Promise<void | Error> {
    const response = await systemPostgresDatabaseManager.execute(
        `
            INSERT INTO
                company_to_connector_mapping
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
        `,
        [companyId, connectorId, connectorType, comments, extraInformation],
    );

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
    // TODO: Fix ConnectorType typing
    connectorType: ConnectorType,
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
                $7
            )
        `,
        [connectorId, currentTimestamp, currentTimestamp, connectorType, sourceCredentialId, destinationCredentialId, comments],
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
        [connectorId, connectorTableType, currentTimestamp, currentTimestamp, currentTimestamp, historicalCursorThreshold, comments],
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
                connector_id AS id
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
 * Checks if connector already exists for given accountId.
 */
export async function checkConnectorExistsForAccount(companyId: Uuid, connectorType: Uuid, accountId: string): Promise<boolean | Error> {
    const postgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const response = await postgresDatabaseManager.execute(
        `
            SELECT
                *
            FROM
                company_to_connector_mapping
            WHERE
                company_id = $1 AND
                connector_type = $2 AND
                extra_information->>'accountId' = $3
        `,
        [companyId, connectorType, accountId],
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

function rowToSourceAndDestinationId(row: unknown): SourceAndDestinationId {
    const result: SourceAndDestinationId = {
        sourceId: getUuidFromUnknown(row.source_credentials_id),
        destinationId: getUuidFromUnknown(row.destination_credentials_id),
    };

    return result;
}

/**
 * Retrieves a connector Id associated with a given company Id and connector type.
 */
// export async function doesConnectorIdExists(companyId: Uuid, connectorType: ConnectorType): Promise<boolean> {
//     // Remove this function
//     const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
//     if (systemPostgresDatabaseManager instanceof Error) {
//         throw systemPostgresDatabaseManager;
//     }

//     const result = await systemPostgresDatabaseManager.execute(
//         `
//             SELECT
//                 *
//             FROM
//                 company_to_connector_mapping
//             WHERE
//                 company_id=$1
//             AND
//                 connector_type=$2
//         `,
//         [companyId, connectorType]
//     );

//     if (result instanceof Error) {
//         return result;
//     }

//     const row = getSingletonValueOrNull(result.rows);
//     if (row == null) {
//         return false;
//     }
//     return true;
// }

function rowToConnectorId(row: unknown): ConnectorId {
    const id: ConnectorId = getUuidFromUnknown(row.id);

    return id;
}

/**
 * Delete connectors and subconnector associated with connector id.
 */
export async function deleteConnectorAndSubConnector(connectorId: Uuid): Promise<void | Error> {
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

export async function getConnectorsAssociatedWithCompanyId(companyId: Uuid, connectorType: Uuid): Promise<Array<Connector> | Error> {
    const connectors = await getArrayOfConnectorIdsAssociatedWithCompanyId(companyId, connectorType);
    if (connectors instanceof Error) {
        return connectors;
    }

    if (connectors.length == 0) {
        return [];
    }

    return connectors;
}

/**
 * Retrieves the account id associated with given connector.
 */
export async function getAccountIdForConnector(connectorId: ConnectorId): Promise<Connector | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();

    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    const result = await systemPostgresDatabaseManager.execute(
        `
            SELECT
                connector_id AS id,
                extra_information
            FROM
                company_to_connector_mapping
            WHERE
                connector_id = $1
        `,
        [connectorId],
    );

    if (result instanceof Error) {
        return result;
    }

    return rowToConnector(getSingletonValue(result.rows));
}

function rowToConnector(row: unknown): Connector {
    const result: Connector = {
        id: row.id,
        accountId: row.extra_information["accountId"],
        extraInformation: row.extra_information,
    };
    return result;
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

    await deleteCredentialFromKms(connector.sourceId);

    await deleteCompanyIdToConnectorIdMapping(connectorId);
    await deleteConnectorAndSubConnector(connectorId);

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

export async function getArrayOfConnectorIdsAssociatedWithCompanyId(companyId: Uuid, connectorType: Uuid): Promise<Array<Connector> | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    const connectorIdsResponse = await systemPostgresDatabaseManager.execute(
        `
            SELECT
                connector_id AS id,
                extra_information
            FROM
                company_to_connector_mapping
            WHERE
                company_id = $1 AND
                connector_type = $2
        `,
        [companyId, connectorType],
    );

    if (connectorIdsResponse instanceof Error) {
        return connectorIdsResponse;
    }
    if (connectorIdsResponse.rowCount == 0) {
        return [];
    }

    const result: Array<Connector> = connectorIdsResponse.rows.map((row) => rowToConnector(row));

    return result;
}
