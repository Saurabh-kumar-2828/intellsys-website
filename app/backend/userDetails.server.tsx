import type {Company, User, Uuid} from "~/utilities/typeDefinitions";
import {getSingletonValue} from "~/global-common-typescript/utilities/utilities";
import {getSystemPostgresDatabaseManager} from "./utilities/connectors/common.server";

export async function getUser(userId: Uuid): Promise<User | Error> {
    const postgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const result = await postgresDatabaseManager.execute(
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

    if(result instanceof Error){
        return result;
    }

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

export async function getAccessibleCompanies(user: User): Promise<Array<Company> | Error> {
    // TODO: DO THIS PROPERLY
    const postgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const result = await postgresDatabaseManager.execute(
        `
            SELECT
                id,
                name,
                domain,
                database_credential_id
            FROM
                companies
            WHERE
                id IN ${`(${Object.keys(user.privileges)
                    .map((companyId) => `'${companyId}'`)
                    .join(", ")})`}
        `,
    );

    if(result instanceof Error){
        return result;
    }

    return result.rows.map((row) => rowToCompany(row));
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
