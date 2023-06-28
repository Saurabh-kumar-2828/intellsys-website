import {Companies} from "~/utilities/typeDefinitions";
import type {Jwt} from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type {AccessToken} from "~/backend/utilities/cookieSessionsHelper.server";
import {execute, getErrorFromUnknown} from "~/backend/utilities/databaseManager.server";
import {getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";
import type {Uuid} from "~/utilities/typeDefinitions";
import {getSingletonValueOrNull} from "~/utilities/utilities";
import {generateUuid, getSingletonValue, getUnixTimeInSeconds, safeExecute} from "~/global-common-typescript/utilities/utilities";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import {getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getSystemPostgresDatabaseManager} from "~/backend/utilities/data-management/common.server";
import {getUuidFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";

// TODO: Remove this, and store the OTPs in database instead
declare global {
    var _activeOtps: {[phoneNumber: string]: {otp: string; issuedAt: number}};
}

export async function sendOtp(email: string): Promise<void | Error> {
    const activeOtps = getActiveOtps();
    const currentTimestamp = getUnixTimeInSeconds();

    const otp = Math.floor(Math.random() * 10 ** 6)
        .toString()
        .padStart(6, "0");
    activeOtps[email] = {
        otp: otp,
        issuedAt: currentTimestamp,
    };

    console.log(otp);
}

export async function verifyOtp(email: string, otp: string): Promise<{success: boolean}> {
    const activeOtps = getActiveOtps();

    try {
        if ((email in activeOtps && activeOtps[email].otp == otp)) {
            delete activeOtps[email];

            // const normalizedemail = `+91${email}`;
            // const [userId, isNewUser] = await createUserIfRequiredAndReturnId(normalizedemail);

            // await createUserInLms(email, userId, searchParameters);

            // const accessToken = jwt.sign({userId: userId, schemaVersion: process.env.COOKIE_SCHEMA_VERSION}, process.env.JWT_SECRET);

            // TODO: Create entry in database if we want to store tokens

            // logSignIn(normalizedemail, searchParameters);

            return {
                success: true,
            };
        } else {
            return {
                success: false,
            };
        }
    } catch (error_: unknown) {
        const error = getErrorFromUnknown(error_);
        // TODO: Log the error properly
        console.log(error);
        return {success: false};
    }
}

// async function logOtpSent(email: string, searchParameters: {[searchParameter: string]: string} | null) {
//     // TODO: Authentication
//     await execute("INSERT INTO otps_sent(phone_number, timestamp, search_parameters) VALUES($1, $2, $3)", [email, getCurrentIsoTimestamp(), JSON.stringify(searchParameters)]);
// }

// async function logSignIn(email: string, searchParameters: {[searchParameter: string]: string} | null) {
//     // TODO: Authentication
//     await execute("INSERT INTO sign_ins(phone_number, timestamp, search_parameters) VALUES($1, $2, $3)", [email, getCurrentIsoTimestamp(), JSON.stringify(searchParameters)]);
// }

// export async function trackSignInemailToLandingPageUrl(email: string, landingPageUrl: string) {
//     // TODO: Authentication
//     await execute("INSERT INTO sign_in_phone_number_for_to_landing_page_urls(phone_number, timestamp, landing_page_url) VALUES($1, TO_TIMESTAMP($2), $3)", [
//         email,
//         getCurrentTimestamp(),
//         landingPageUrl,
//     ]);
// }

function getActiveOtps() {
    if (global._activeOtps == null) {
        global._activeOtps = {};
    }

    const activeOtps = global._activeOtps;
    const unixEpochInSeconds = getUnixTimeInSeconds();

    for (const phoneNumber of Object.keys(activeOtps)) {
        const otpInformation = activeOtps[phoneNumber];
        if (unixEpochInSeconds - otpInformation.issuedAt >= 3600) {
            delete activeOtps[phoneNumber];
        }
    }

    return activeOtps;
}

export async function validateUser(username: string, password: string): Promise<{accessTokenJwt: Jwt; userId: Uuid} | null> {
    const result = await execute(
        Companies.Intellsys,
        `
            SELECT
                id
            FROM
                users
            WHERE
                username = $1 AND
                hashed_password = crypt($2, hashed_password)
        `,
        [username, password],
    );

    const row = getSingletonValueOrNull(result.rows);

    if (row == null) {
        return null;
    }

    const userId = row.id;

    const accessToken: AccessToken = {
        userId: userId,
        schemaVersion: getRequiredEnvironmentVariable("COOKIE_SCHEMA_VERSION"),
    };

    return {
        // TODO: Use createAuthenticationToken instead
        accessTokenJwt: jwt.sign(accessToken, getRequiredEnvironmentVariable("JWT_SECRET")) as any as Jwt,
        userId: userId,
    };
}

// TODO: Anything and everything below this is experimental
export async function getAccessTokenForUser(userId: string) {
    const accessToken: AccessToken = {
        userId: userId,
        schemaVersion: getRequiredEnvironmentVariableNew("COOKIE_SCHEMA_VERSION"),
    };

    return {
        // TODO: Use createAuthenticationToken instead
        accessTokenJwt: jwt.sign(accessToken, getRequiredEnvironmentVariableNew("JWT_SECRET")) as unknown as Jwt,
        userId: userId,
    };
}

export async function getCompanyIdForDomain(domain: string): Promise<Uuid | null | Error> {
    const postgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const result = await postgresDatabaseManager.execute(
        `
            SELECT
                id
            FROM
                companies
            WHERE
                domain = $1
        `,
        [domain],
    );

    if (result instanceof Error) {
        return result;
    }

    if (result.rows.length == 0) {
        return null;
    }

    const row = getSingletonValue(result.rows);
    return row.id;
}

export async function createCompany(domain: string): Promise<void | Error> {
    const postgresDatabaseManager = await getPostgresDatabaseManager(getUuidFromUnknown(getRequiredEnvironmentVariableNew("INTELLSYS_STORAGE_1_CREDENTIAL_ID")));
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const id = generateUuid();

    const result = await postgresDatabaseManager.execute(
        `
            CREATE DATABASE
                "$1"
        `,
        [domain],
    );

    if (result instanceof Error) {
        return result;
    }

    const row = getSingletonValue(result.rows);
    return row.id;
}
