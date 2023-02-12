import {companyDatabaseCredentialsMap} from "do-not-commit";
import {Pool, QueryResult} from "pg";
import {Uuid} from "~/utilities/typeDefinitions";

declare global {
    var _databaseConnectionPool: {[key: Uuid]: Pool};
}

// TODO: Proper error handling
// TODO: Rename to something better
export async function execute(companyId: Uuid , query: string, queryArguments?: Array<any>): Promise<QueryResult<any>> {
    const databaseConnectionPool = await getDatabaseConnectionPool(companyId);

    // TODO: Confirm success, or log error
    const response = await databaseConnectionPool.query(query, queryArguments);

    return response;
}

async function getDatabaseConnectionPool(companyId: Uuid): Promise<Pool> {
    // TODO: Proper error handling
    if (global._databaseConnectionPool.companyId == null) {
        global._databaseConnectionPool.companyId = await getNewDatabaseConnectionPool(companyId);
    }
    return global._databaseConnectionPool.companyId;
}

async function getNewDatabaseConnectionPool(companyId: Uuid): Promise<Pool> {
    // const dbHost: string = process.env.DB_HOST;
    // const dbPort: number = parseInt(process.env.DB_PORT);
    // const dbName: string = process.env.DB_NAME;
    // const dbUsername: string = process.env.DB_USERNAME;
    // const dbPassword: string = process.env.DB_PASSWORD;

    console.log(companyDatabaseCredentialsMap);

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
