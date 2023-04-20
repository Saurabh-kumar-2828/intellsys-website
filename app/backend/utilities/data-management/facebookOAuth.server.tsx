import {Companies, Sources} from "do-not-commit";
import {DateTime} from "luxon";
import {execute, getErrorFromUnknown} from "~/backend/utilities/databaseManager.server";
import {Uuid} from "~/utilities/typeDefinitions";
import {v4 as uuidv4} from "uuid";
import Cryptr from "cryptr";
import {getSingletonValueOrNull} from "~/utilities/utilities";

type FacebookAdsCredentials = {
    accessToken: string;
    expiryDate: string;
    tokenType?: string;
};

export interface Credentials {
    [x: string]: string | number | boolean;
}

const cryptr = new Cryptr(process.env.ENCRYPTION_KEY!);

export const baseUrl = "http://localhost:3000";

export function getRedirectUri(companyId: Uuid): string{
    return `${baseUrl}/${companyId}/capture-authorization-code`;
}

export async function writeInCredentialsStoreTable(companyId: Uuid, credentialType: Uuid, credentialId: Uuid){
    await execute(
        Companies.Intellsys,
        `
          INSERT INTO
            credentials_store (
              company_id,
              credential_type,
              credential_id
            )
          VALUES (
              $1,
              $2,
              $3
          )
      `,
        [companyId, credentialType, credentialId],
    );
}

export async function writeInCredentialsTable(credentials: Credentials, credentialId: Uuid){
    await execute(
        Companies.Intellsys,
        `
            INSERT INTO
              credentials (
                credential_id,
                created_at,
                updated_at,
                credentials
              )
            VALUES (
                $1,
                $2,
                $3,
                $4
            )
        `,
        [credentialId, DateTime.now().toISO(), DateTime.now().toISO(), credentials],
    );
}

async function getCredentialsId(companyId: Uuid, credentialType: Uuid): Promise<Uuid | Error> {
    // Returns the credential ID associated with a given company Id and credential type.
    const query1 = `
            SELECT
                credential_id
            FROM
                credentials_store
            WHERE
                company_id = $1
            AND
                credential_type = $2
        `;

    const credentialIdRaw = await execute(Companies.Intellsys, query1, [companyId, credentialType]);

    if (credentialIdRaw instanceof Error) {
        return credentialIdRaw;
    }
    const credentialIdObject = getSingletonValueOrNull(credentialIdRaw.rows);

    if (credentialIdObject.credential_id == null) {
        return Error("No credentials found!");
    } else{
        return credentialIdObject.credential_id;
    }
}

async function getCredentialsById(credentialId: Uuid): Promise<Credentials | Error> {
    // Returns the credentials associated with a given credential ID.
    const query2 = `
            SELECT
                credentials
            FROM
                credentials
            WHERE
                credential_id = $1
        `;

    const credentialsRaw = await execute(Companies.Intellsys, query2, [credentialId]);

    if (credentialsRaw instanceof Error) {
        return credentialsRaw;
    }

    const credentialsObject = getSingletonValueOrNull(credentialsRaw.rows);

    if (credentialsObject.credentials == null) {
        throw Error("No credentials found!");
    }

    const credentialsResponse = {
        access_token: cryptr.decrypt(credentialsObject.credentials.access_token),
        expiry_date: credentialsObject.credentials.expiry_date
    };

    return credentialsResponse as Credentials;
}

export async function getCredentials(companyId: Uuid, credentialType: Uuid): Promise<Credentials | Error> {
    // 1. Get credential id associated with given company and data source.
    const credentialId = await getCredentialsId(companyId, credentialType);
    if(credentialId instanceof Error){
        return credentialId;
    }

    // 2. Get credentials associated with given credential id.
    const credentials = await getCredentialsById(credentialId);
    return credentials;

}

async function updateCredentialsById(credentialsId: Uuid, credentials: Credentials){
    const response = await execute(
        Companies.Intellsys,
        `
          UPDATE
            credentials
          SET
            credentials=$1,
            updated_at=$2
          WHERE
            credential_id=$3
        `,
        [credentials, DateTime.now(), credentialsId]
    );
}

export async function storeCredentials(credentials: Credentials, companyId: Uuid, credentialType: Uuid) {
    /**
     * Store the credentials of a company's data source.
     * @param  {Credentials} credentials credentials of a company's data source.
     * @param  {Uuid} companyId Unique Id of the company
     * @param  {Uuid} credentialType Unique Id of the data source
     * @returns  This function does not return anything
     */

    try {
        const credentialId = uuidv4();

        // 1. Store credentials in credentials table.
        await writeInCredentialsTable(credentials, credentialId);

        // 2. Store mapping of company id, credential type to credential id in credential_store table.
        await writeInCredentialsStoreTable(companyId, credentialType, credentialId);

    } catch (e) {
        console.log(e);
        throw e;
    }
}

export async function updateCredentials(credentials: Credentials, companyId: Uuid, credentialType: Uuid) {
    const credentialsId = await getCredentialsId(companyId, credentialType);
    if(credentialsId instanceof Error){
        return credentialsId
    }

    await updateCredentialsById(credentialsId, credentials);

}

const facebookApiBaseUrl = "https://graph.facebook.com";
export async function facebookOAuthFlow(authorizationCode: string, companyId: string): Promise<void | Error> {
    const redirectUri = getRedirectUri(companyId);

    try {
        // Post api to retrieve access token by giving authorization code.
        const url = `
            ${facebookApiBaseUrl}/${process.env.FACEBOOK_API_VERSION!}/oauth/access_token?
            client_id=${process.env.FACEBOOK_CLIENT_ID!}&
            client_secret=${process.env.FACEBOOK_CLIENT_SECRET!}&
            redirect_uri=${redirectUri}&
            code=${authorizationCode}
        `;

        const response = await fetch(url, {
            method: "POST",
        });
        var token = await response.json();
        token = convertTokenToFacebookCredentialsType(token);

        if(token instanceof Error){
            return token;
        }

        if (companyId != "undefined") {
            // Store credentials in database.
            storeCredentials(
                {
                    access_token: cryptr.encrypt(token.accessToken),
                    expiry_date: DateTime.now()
                        .plus({seconds: parseInt(token.expiryDate)})
                        .toISO(),
                },
                companyId,
                Sources.FacebookAds,
            );
        }
    } catch (e) {
        console.log(e);
    }
}

function convertTokenToFacebookCredentialsType(token: any): FacebookAdsCredentials | Error {
    try {
        let result: FacebookAdsCredentials = {
            accessToken: token.access_token,
            expiryDate: token.expires_in,
            tokenType: token.token_type,
        };

        return result;
    } catch (error_: unknown) {
        const error = getErrorFromUnknown(error_);
        return error;
    }
}

export async function getFacebookCredentials(companyId: string): Promise<Credentials | Error> {
    const credentialsRaw = await getCredentials(companyId, Sources.FacebookAds);
    if(credentialsRaw instanceof Error){
        return credentialsRaw;
    } else {
        const credentials: FacebookAdsCredentials = {
            accessToken: credentialsRaw["access_token"] as string,
            expiryDate: credentialsRaw["expiry_date"] as string
        }

        return credentials;
    }
}

export async function refreshAccessToken(expiredAccessToken: Uuid, companyId: Uuid): Promise<Uuid | Error> {
        // Retrieves a new access token from the API.
        const url = `
            ${facebookApiBaseUrl}/${process.env.FACEBOOK_API_VERSION!}/oauth/access_token?
            client_id=${process.env.FACEBOOK_CLIENT_ID!}&
            client_secret=${process.env.FACEBOOK_CLIENT_SECRET!}&
            grant_type=fb_exchange_token&
            fb_exchange_token=${expiredAccessToken}
        `;
        const response = await fetch(url, {
            method: "GET",
        });
        var token = await response.json();
        token = convertTokenToFacebookCredentialsType(token);

        if(token instanceof Error){
            return token;
        }

        if (companyId != "undefined") {
            // Update credentials in database.
            updateCredentials(
                {
                    // TODO: Hash the token.
                    access_token: cryptr.encrypt(token.access_token),
                    expiry_date: DateTime.now()
                        .plus({seconds: parseInt(token.expiryDate)})
                        .toISO(),
                },
                companyId,
                Sources.FacebookAds,
            );
            return token.accessToken;
        } else {
            return Error("Company undefined!")
        }
}

export async function getFacebookData(companyId: Uuid) {
    try {
        // 1. Retrieve Facebook credentials stored in database.
        const credentials = await getFacebookCredentials(companyId);
        if(credentials instanceof Error){
            return credentials
        }

        let accessToken = credentials.accessToken as string;

        // 2. If access token is expired, refresh the token.
        if(credentials.expiryDate < DateTime.now().toISO()){

            const newAccessToken = await refreshAccessToken(credentials.accessToken as string, companyId);
            if(newAccessToken instanceof Error){
                return newAccessToken;
            }

            accessToken = newAccessToken as string;
        }

        // 3. Get data from the facebook ads source.
        const data = await callFacbookAdsApi(accessToken);
        console.log("data: ", data);

    } catch (e) {
        console.log(e);
    }
}

async function callFacbookAdsApi(accessToken: string) {
    try {
        const fields = "campaign_id,campaign_name";
        const level = "campaign";
        let url = `
            ${facebookApiBaseUrl}/${process.env.FACEBOOK_API_VERSION!}/act_${process.env.FACEBOOK_ACCOUNT_ID!}/insights?
            fields=${fields}&
            level=${level}&
            access_token=${accessToken}
        `;
        const response = await fetch(url, {
            method: "GET",
        });

        const insights = await response.json();
        return insights;

    } catch (e) {
        console.log(e);
    }
}
