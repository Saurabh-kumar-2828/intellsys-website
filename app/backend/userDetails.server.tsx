import {execute} from "~/backend/utilities/databaseManager.server";
import {Company, User, Uuid} from "~/utilities/typeDefinitions";
import {getSingletonValue} from "~/utilities/utilities";

export async function getNameAndPrivilegesForUser(userId: Uuid): Promise<User> {
    const result = await execute(
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

function rowToUser(row: any): User {
    const user: User = {
        id: row.user_id,
        name: row.name,
        privileges: row.privileges,
    };

    return user;
}

export async function getAccessibleCompanies(user: User): Promise<Array<Company>> {
    // TODO: TO THIS PROPERLY
    const result = await execute(
        `
            SELECT
                *
            FROM
                companies
            WHERE
                id::TEXT IN ($1)
        `,
        [`[${user.privileges.map(companyId => `'${companyId}'`).join(", ")}]`],
    );

    return result.rows.map(row => rowToCompany(row));
}

function rowToCompany(row: any): Company {
    const company: Company = {
        id: row.id,
        name: row.name,
        pages: null,
    };

    return company;
}
