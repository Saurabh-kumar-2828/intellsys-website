import {Pool, QueryResult} from "pg";
import {Companies, connections} from "../../../do-not-commit";

declare global {
    var _databaseConnectionPool: {[key: string]: Pool};
}

// TODO: Proper error handling
// TODO: Rename to something better
export async function execute(companyId: string | null , query: string, queryArguments?: Array<any>): Promise<QueryResult<any>> {

    // TODO: For test
    companyId = Companies.livpure;
    const databaseConnectionPool = await getDatabaseConnectionPool(companyId);

    // TODO: Confirm success, or log error
    const response = await databaseConnectionPool.query(query, queryArguments);

    return response;
}

async function getDatabaseConnectionPool(companyId: string): Promise<Pool> {
    // TODO: Proper error handling
    if (global._databaseConnectionPool.companyId == null) {
        global._databaseConnectionPool.companyId = await getNewDatabaseConnectionPool(companyId);
    }
    return global._databaseConnectionPool.companyId;
}

async function getNewDatabaseConnectionPool(companyId: string): Promise<Pool> {
    // const dbHost: string = process.env.DB_HOST;
    // const dbPort: number = parseInt(process.env.DB_PORT);
    // const dbName: string = process.env.DB_NAME;
    // const dbUsername: string = process.env.DB_USERNAME;
    // const dbPassword: string = process.env.DB_PASSWORD;

    const dbHost: string = connections[companyId].DB_HOST;
    const dbPort: number = parseInt(connections[companyId].DB_PORT);
    const dbName: string = connections[companyId].DB_NAME;
    const dbUsername: string = connections[companyId].DB_USERNAME;
    const dbPassword: string = connections[companyId].DB_PASSWORD;

    const databaseConnectionPool = new Pool({
        host: dbHost,
        port: dbPort,
        database: dbName,
        user: dbUsername,
        password: dbPassword,
    });

    return databaseConnectionPool;
}
