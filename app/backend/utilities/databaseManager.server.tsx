import {companyDatabaseCredentialsMap} from "do-not-commit";
import {Pool, QueryResult} from "pg";
import {Uuid} from "~/utilities/typeDefinitions";

declare global {
    var _databaseConnectionPool: {[key: Uuid]: Pool};
}

export function getErrorFromUnknown(error: unknown) {
    if (error instanceof Error) {
        return error;
    }

    return Error(String(error));
}

// TODO: Proper error handling
// TODO: Rename to something better
export async function execute(companyId: Uuid , query: string, queryArguments?: Array<any>): Promise<QueryResult<any> | Error> {
    try {

        const databaseConnectionPool = await getDatabaseConnectionPool(companyId);

        // TODO: Confirm success, or log error
        const response = await databaseConnectionPool.query(query, queryArguments);

        return response as QueryResult<any>;;

    } catch(error_: unknown) {
        const error = getErrorFromUnknown(error_);
        return error;
    }

}

async function getDatabaseConnectionPool(companyId: Uuid): Promise<Pool> {
    if (global._databaseConnectionPool == null) {
        global._databaseConnectionPool = {};
    }

    if (!(companyId in global._databaseConnectionPool)) {
        global._databaseConnectionPool[companyId] = await getNewDatabaseConnectionPool(companyId);
    }

    return global._databaseConnectionPool[companyId];
}

async function getNewDatabaseConnectionPool(companyId: Uuid): Promise<Pool> {
    const companyDatabaseCredentials = companyDatabaseCredentialsMap[companyId];

    const dbHost: string = companyDatabaseCredentials.DB_HOST;
    const dbPort: number = parseInt(companyDatabaseCredentials.DB_PORT);
    const dbName: string = companyDatabaseCredentials.DB_NAME;
    const dbUsername: string = companyDatabaseCredentials.DB_USERNAME;
    const dbPassword: string = companyDatabaseCredentials.DB_PASSWORD;

    const databaseConnectionPool = new Pool({
        host: dbHost,
        port: dbPort,
        database: dbName,
        user: dbUsername,
        password: dbPassword,
    });

    return databaseConnectionPool;
}
