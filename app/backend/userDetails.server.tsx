import {Companies} from "~/utilities/typeDefinitions";
import {execute} from "~/backend/utilities/databaseManager.server";
import type {Company, User, Uuid} from "~/utilities/typeDefinitions";
import {getSingletonValue} from "~/utilities/utilities";

export async function getUser(userId: Uuid): Promise<User> {
    const result = await execute(
        Companies.Intellsys,
        `
            SELECT
                id,
                email,
                name,
                privileges
            FROM
                users
            WHERE
                id = $1
        `,
        [userId],
    );

    return rowToUser(getSingletonValue(result.rows));
}

function rowToUser(row: unknown): User {
    const user: User = {
        id: row.id,
        email: row.email,
        name: row.name,
        privileges: row.privileges,
    };

    return user;
}

export async function getAccessibleCompanies(user: User): Promise<Array<Company>> {
    // TODO: DO THIS PROPERLY
    const result = await execute(
        Companies.Intellsys,
        `
            SELECT
                id,
                name,
                domain,
                database_credential_id
            FROM
                companies
            WHERE
                id IN ${`(${Object.keys(user.privileges).map(companyId => `'${companyId}'`).join(", ")})`}
        `,
    );

    return result.rows.map(row => rowToCompany(row));
}

function rowToCompany(row: unknown): Company {
    const company: Company = {
        id: row.id,
        domain: row.domain,
        name: row.name,
        databaseCredentialId: row.database_credential_id,
    };

    return company;
}
