import {Pool} from "pg";

declare global {
    var _databaseConnectionPool;
}

// TODO: Proper error handling
// TODO: Rename to something better
export async function execute(query: string, queryArguments?: Array<any>) {
    const databaseConnectionPool = await getDatabaseConnectionPool();

    // TODO: Confirm success, or log error
    let response;
    try {
        response = await databaseConnectionPool.query(query, queryArguments);
    } catch (e) {
        console.log("Encountered error while running SQL query:");
        console.log(query);
        console.log(queryArguments);
        console.log(e);
    }

    return response;
}

async function getDatabaseConnectionPool(): Promise<Pool> {
    // TODO: Proper error handling
    if (global._databaseConnectionPool == null) {
        global._databaseConnectionPool = await getNewDatabaseConnectionPool();
    }
    return global._databaseConnectionPool;
}

async function getNewDatabaseConnectionPool(): Promise<Pool> {
    const dbHost: string = process.env.DB_HOST;
    const dbPort: number = parseInt(process.env.DB_PORT);
    const dbName: string = process.env.DB_NAME;
    const dbUsername: string = process.env.DB_USERNAME;
    const dbPassword: string = process.env.DB_PASSWORD;

    const databaseConnectionPool = new Pool({
        host: dbHost,
        port: dbPort,
        database: dbName,
        user: dbUsername,
        password: dbPassword,
    });

    return databaseConnectionPool;
}
