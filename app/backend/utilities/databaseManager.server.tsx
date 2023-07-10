import {companyDatabaseCredentialsMap} from "~/utilities/typeDefinitions";
import {getDatabaseCredentials} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import type {QueryResult} from "pg";
import {Pool} from "pg";
import type {Uuid} from "~/utilities/typeDefinitions";

declare global {
    // @deprecated
    var _databaseConnectionPool: {[key: Uuid]: Pool};
}

// @deprecated
export type PostgresDatabaseCredentials = {
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
};

// @deprecated
export function getErrorFromUnknown(error: unknown) {
    if (error instanceof Error) {
        return error;
    }

    return Error(String(error));
}

// TODO: Proper error handling
// TODO: Rename to something better
// @deprecated
export async function execute(companyId: Uuid, query: string, queryArguments?: Array<any>): Promise<QueryResult<any> | Error> {
    try {
        const databaseConnectionPool = await getDatabaseConnectionPool(companyId);
        if (databaseConnectionPool instanceof Error) {
            return databaseConnectionPool;
        }

        // TODO: Confirm success, or log error
        const response = await databaseConnectionPool.query(query, queryArguments);

        return response as QueryResult<any>;
    } catch (error_: unknown) {
        const error = getErrorFromUnknown(error_);
        return error;
    }
}

// @deprecated
async function getDatabaseConnectionPool(companyId: Uuid): Promise<Pool | Error> {
    if (global._databaseConnectionPool == null) {
        global._databaseConnectionPool = {};
    }

    if (!(companyId in global._databaseConnectionPool)) {
        const connectionPool = await getNewDatabaseConnectionPool(companyId);

        if (connectionPool instanceof Error) {
            return connectionPool;
        }
        global._databaseConnectionPool[companyId] = connectionPool;
    }

    return global._databaseConnectionPool[companyId];
}

// @deprecated
async function getNewDatabaseConnectionPool(companyId: Uuid): Promise<Pool | Error> {
    const companyDatabaseCredentialsId = companyDatabaseCredentialsMap[companyId];

    const credentials = await getDatabaseCredentials(companyDatabaseCredentialsId);
    if (credentials instanceof Error) {
        return credentials;
    }

    const databaseConnectionPool = new Pool({
        host: credentials.DB_HOST,
        port: parseInt(credentials.DB_PORT),
        database: credentials.DB_NAME,
        user: credentials.DB_USERNAME,
        password: credentials.DB_PASSWORD,
    });

    return databaseConnectionPool;
}
