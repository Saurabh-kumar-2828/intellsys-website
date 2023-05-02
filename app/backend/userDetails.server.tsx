import {Companies} from "~/utilities/typeDefinitions";
import {execute} from "~/backend/utilities/databaseManager.server";
import {Company, User, Uuid} from "~/utilities/typeDefinitions";
import {getSingletonValue} from "~/utilities/utilities";

export async function getNameAndPrivilegesForUser(userId: Uuid): Promise<User> {
    const result = await execute(
        Companies.Intellsys,
        `
            SELECT
                *
            FROM
                user_details
            WHERE
                user_id = $1
        `,
        [userId],
    );

    return rowToUser(getSingletonValue(result.rows));
}

function rowToUser(row: unknown): User {
    const user: User = {
        id: row.user_id,
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
                *
            FROM
                companies
            WHERE
                id IN ${`(${user.privileges.map(companyId => `'${companyId}'`).join(", ")})`}
        `,
    );

    return result.rows.map(row => rowToCompany(row));
}

function rowToCompany(row: unknown): Company {
    const company: Company = {
        id: row.id,
        name: row.name,
        pages: null,
    };

    return company;
}
