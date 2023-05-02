import {companyDatabaseCredentialsMap} from "~/utilities/typeDefinitions";
import {getDatabaseCredentials} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {Pool, QueryResult} from "pg";
import {Uuid} from "~/utilities/typeDefinitions";

declare global {
    var _databaseConnectionPool: {[key: Uuid]: Pool};
}

export type PostgresDatabaseCredentials = {
    dbHost: string;
    dbPort: string;
    dbName: string;
    dbUsername: string;
    dbPassword: string;
};

export function getErrorFromUnknown(error: unknown) {
    if (error instanceof Error) {
        return error;
    }

    return Error(String(error));
}

// TODO: Proper error handling
// TODO: Rename to something better
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

async function getNewDatabaseConnectionPool(companyId: Uuid): Promise<Pool | Error> {
    const companyDatabaseCredentialsId = companyDatabaseCredentialsMap[companyId];
    const credentials = await getDatabaseCredentials(companyDatabaseCredentialsId);
    if (credentials instanceof Error) {
        return credentials;
    }

    const databaseConnectionPool = new Pool({
        host: credentials.dbHost,
        port: parseInt(credentials.dbPort),
        database: credentials.dbName,
        user: credentials.dbUsername,
        password: credentials.dbPassword,
    });

    return databaseConnectionPool;
}
