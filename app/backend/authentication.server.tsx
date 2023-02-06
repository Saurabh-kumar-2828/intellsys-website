import jwt, {Jwt} from "jsonwebtoken";
import {AccessToken} from "~/backend/utilities/cookieSessionsHelper.server";
import {execute} from "~/backend/utilities/databaseManager.server";
import {Uuid} from "~/utilities/typeDefinitions";
import {getSingletonValueOrNull} from "~/utilities/utilities";

export async function validateUser(username: string, password: string): Promise<{accessTokenJwt: Jwt; userId: Uuid} | null> {
    const result = await execute(
        `
            SELECT
                id
            FROM
                users
            WHERE
                username = $1 AND
                hashed_password = crypt($2, hashed_password)
        `,
        [username, password]
    );

    const row = getSingletonValueOrNull(result.rows);

    if (row == null) {
        return null;
    }

    const userId = row.id;

    const accessToken: AccessToken = {
        userId: userId,
        schemaVersion: process.env.COOKIE_SCHEMA_VERSION,
    };

    return {
        accessTokenJwt: jwt.sign(accessToken, process.env.JWT_SECRET),
        userId: userId,
    };
}
