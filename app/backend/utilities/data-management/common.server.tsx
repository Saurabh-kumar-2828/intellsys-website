import {getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";
import type {PostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {CredentialType} from "~/utilities/typeDefinitions";
import {getSingletonValue} from "~/utilities/utilities";


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
    if (dataSource == CredentialType.facebookAds) {
        return `${process.env.REDIRECT_BASE_URI!}/${companyId}/capture-authorization-code`;
    }

    if (dataSource == CredentialType.googleAds) {
        console.log("in google ads")
        const url =  `${process.env.REDIRECT_BASE_URI!}/capture-authorization-code`;
        console.log(url);
        return url;
    }

    return Error("Invalid data source!");
}