import {DateTime} from "luxon";
import {getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";
import type {PostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import type {Iso8601DateTime, Uuid} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getCurrentIsoTimestamp} from "~/global-common-typescript/utilities/utilities";
import type {ConnectorTableType, ConnectorType} from "~/utilities/typeDefinitions";
import {CredentialType} from "~/utilities/typeDefinitions";
import {getSingletonValue, getSingletonValueOrNull} from "~/utilities/utilities";

export type ConnectorId = Uuid;

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

    if(response instanceof Error){
        return response;
    }

    const credentials = getSingletonValue(response.rows);

    // TODO: Fix type error
    return getUuidFromUnknown(credentials.database_credential_id);
}

export function getRedirectUri(companyId: Uuid, dataSource: Uuid): string | Error {
    if (dataSource == CredentialType.FacebookAds) {
        return `${process.env.REDIRECT_BASE_URI!}/${companyId}/capture-authorization-code`;
    }

    if (dataSource == CredentialType.GoogleAds) {
        const url =  `${process.env.REDIRECT_BASE_URI!}/capture-authorization-code`;
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

export async function initializeConnectorAndSubConnector(systemConnectorsDatabaseManager: PostgresDatabaseManager, connectorId: Uuid, sourceCredentialId: Uuid, destinationCredentialId: Uuid, comments: string, connectorTableType: ConnectorTableType, connectorType: ConnectorType): Promise<void | Error> {

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
        [connectorId, currentTimestamp, currentTimestamp, connectorType, sourceCredentialId, destinationCredentialId, comments]
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

/**
 * Delete a connector Id associated with a given company Id and connector type.
 */
export async function deleteCompanyIdToConnectorIdMapping(connectorId: Uuid): Promise<void | Error> {
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if(systemPostgresDatabaseManager instanceof Error) {
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
    if(systemPostgresDatabaseManager instanceof Error) {
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
 * Retrieves a connector Id associated with a given company Id and connector type.
 */
export async function doesConnectorIdExists(companyId: Uuid, connectorType: ConnectorType): Promise<boolean> {
    // Remove this function
    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if(systemPostgresDatabaseManager instanceof Error) {
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
    if(row == null){
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
    if(systemPostgresDatabaseManager instanceof Error) {
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
    if(systemConnectorsDatabaseManager instanceof Error) {
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
