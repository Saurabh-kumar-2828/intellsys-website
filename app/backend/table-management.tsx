import { execute } from "~/backend/utilities/databaseManager.server";
var format = require("pg-format");

export async function doesTableExist(tableName: string): Promise<boolean> {
    try {
        const query = format(
            `
                SELECT
                    COUNT(*) > 0 AS exists
                FROM
                    pg_class
                WHERE
                    relname = 'freshsales_leads_mattress_raw' AND
                    relkind IN ('r', 'v', 'm', 'p')
            `
        );

        await execute(query);

        const result = await execute(query);

        if (result.rows.length != 1) {
            throw "";
        }

        const row = result.rows[0];

        return row.exists;
    } catch (e) {
        console.log("Error executing function");
        console.log(e);
        console.trace();
    }
}
