import type {Jwt} from "jsonwebtoken";
import jwt from "jsonwebtoken";
import {getSystemPostgresDatabaseManager} from "~/backend/utilities/connectors/common.server";
import type {AccessToken} from "~/backend/utilities/cookieSessionsHelper.server";
import {addCredentialToKms, getCredentialFromKms} from "~/global-common-typescript/server/kms.server";
import type {PostgresDatabaseCredentials} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid, getSingletonValue, getUnixTimeInSeconds} from "~/global-common-typescript/utilities/utilities";
import type {Company, User, Uuid} from "~/utilities/typeDefinitions";
import {getTagFromEmail} from "~/utilities/utilities";

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

    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${getRequiredEnvironmentVariableNew("INTELLSYS_MAILER_TOKEN")}`);

    var body = JSON.stringify({
        template_path: "https://intellsys-optimizer.b-cdn.net/intellsys-mailer/intellsys_otp_template.txt",
        email_content_dict: {
            "~!NAME!~": getTagFromEmail(email),
            "~!OTP!~": otp,
        },
        email_to: JSON.stringify([email]),
        email_subject: "Intellsys Login",
    });

    var requestOptions = {
        method: "POST",
        headers: headers,
        body: body,
    };

    const response = await fetch("https://mailer.intellsys.ai/values_from_json", requestOptions);

    if (!response.ok) {
        console.log(response.status);
        console.log(response.text());
        return new Error("Failed to send email");
    }
}

export async function verifyOtp(email: string, otp: string): Promise<{success: boolean}> {
    const activeOtps = getActiveOtps();

    try {
        if (email in activeOtps && activeOtps[email].otp == otp) {
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

// TODO: Anything and everything below this is experimental
export async function getAccessTokenForUser(userId: string) {
    const accessToken: AccessToken = {
        userId: userId,
        schemaVersion: getRequiredEnvironmentVariableNew("COOKIE_SCHEMA_VERSION"),
    };

    return {
        // TODO: Use createAuthenticationToken instead
        // TODO: Figure out a better return type here?
        accessTokenJwt: jwt.sign(accessToken, getRequiredEnvironmentVariableNew("JWT_SECRET")) as unknown as Jwt,
        userId: userId,
    };
}

export async function getCompanyForDomain(domain: string): Promise<Company | null | Error> {
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

    return rowToCompany(getSingletonValue(result.rows));
}

function rowToCompany(row: unknown): Company {
    const company: Company = {
        id: row.id,
        name: row.name,
        domain: row.domain,
        databaseCredentialId: row.database_credential_id,
    };

    return company;
}

export async function createCompany(domain: string): Promise<Company | Error> {
    // TODO: Run a transaction for both databases here?

    const companyId = generateUuid();
    const result1 = await createDatabaseForCompany(companyId);
    if (result1 instanceof Error) {
        return result1;
    }
    console.log("Company's database initialized");

    const intellsysStorage1CredentialStr = await getCredentialFromKms(getUuidFromUnknown(getRequiredEnvironmentVariableNew("INTELLSYS_STORAGE_1_CREDENTIAL_ID")));

    if (intellsysStorage1CredentialStr instanceof Error) {
        return intellsysStorage1CredentialStr;
    }

    const intellsysStorage1Credential = JSON.parse(intellsysStorage1CredentialStr);
    const databaseCredential: PostgresDatabaseCredentials = {
        DB_HOST: intellsysStorage1Credential.DB_HOST,
        DB_PORT: intellsysStorage1Credential.DB_PORT,
        DB_USERNAME: intellsysStorage1Credential.DB_USERNAME,
        DB_PASSWORD: intellsysStorage1Credential.DB_PASSWORD,
        DB_NAME: companyId,
    };

    const databaseCredentialId = generateUuid();
    const result2 = await addCredentialToKms(databaseCredentialId,
         JSON.stringify(databaseCredential), `Intellsys - Company database - ${companyId}`);
    if (result2 instanceof Error) {
        return result2;
    }

    const result3 = await addCompanyEntryToIntellsys(companyId, domain, databaseCredentialId);
    if (result3 instanceof Error) {
        return result3;
    }

    const company: Company = {
        id: companyId,
        name: null,
        domain: domain,
        databaseCredentialId: databaseCredentialId,
    };

    return company;
}

async function addCompanyEntryToIntellsys(id: Uuid, domain: string, databaseCredentialId: Uuid): Promise<void | Error> {
    const postgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const result = await postgresDatabaseManager.execute(
        `
            INSERT INTO companies (
                id,
                name,
                domain,
                database_credential_id
            )
            VALUES (
                $1,
                NULL,
                $2,
                $3
            )
        `,
        [id, domain, databaseCredentialId],
    );

    if (result instanceof Error) {
        return result;
    }
}

async function createDatabaseForCompany(id: Uuid): Promise<void | Error> {
    const postgresDatabaseManager = await getPostgresDatabaseManager(getUuidFromUnknown(getRequiredEnvironmentVariableNew("INTELLSYS_STORAGE_1_CREDENTIAL_ID")));

    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    // TODO: Escape this properly
    const result = await postgresDatabaseManager.execute(
        `
            CREATE DATABASE
                "${id}"
        `,
    );

    if (result instanceof Error) {
        return result;
    }
}

export async function getUserForEmail(email: string): Promise<User | null | Error> {
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
                email = $1
        `,
        [email],
    );

    if (result instanceof Error) {
        return result;
    }

    if (result.rows.length == 0) {
        return null;
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

// Company: The company that the user belongs to
export async function createUser(email: string, company: Company): Promise<User | Error> {
    const userId = generateUuid();

    const privileges: {[companyId: Uuid]: Array<Uuid>} = {
        [company.id]: [],
    };

    const result = await addUserEntryToIntellsys(userId, email, privileges);
    if (result instanceof Error) {
        return result;
    }

    const user: User = {
        id: userId,
        email: email,
        name: null,
        privileges: privileges,
    };

    return user;
}

async function addUserEntryToIntellsys(id: Uuid, email: string, privileges: {[companyId: Uuid]: Array<Uuid>}): Promise<void | Error> {
    const postgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const result = await postgresDatabaseManager.execute(
        `
            INSERT INTO users (
                id,
                email,
                name,
                privileges
            )
            VALUES (
                $1,
                $2,
                NULL,
                $3
            )
        `,
        [id, email, privileges],
    );

    if (result instanceof Error) {
        return result;
    }
}
