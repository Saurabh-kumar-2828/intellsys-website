import Cryptr from "cryptr";
import {Companies} from "~/utilities/typeDefinitions";
import {DateTime} from "luxon";
import {execute} from "~/backend/utilities/databaseManager.server";
import {Uuid} from "~/utilities/typeDefinitions";
import {getSingletonValueOrNull} from "~/utilities/utilities";
import {v4 as uuidv4} from "uuid";
import {addCredentialToKms, getCredentialFromKms, updateCredentialInKms} from "~/global-common-typescript/server/kms.server";

export interface Credentials {
    [x: string]: string | number | boolean;
}

export enum Response {
    Success = "success",
}
const cryptr = new Cryptr(process.env.ENCRYPTION_KEY!);

export async function writeInCredentialsStoreTable(companyId: Uuid, credentialType: Uuid, credentialId: Uuid): Promise<string | Error> {
    const response = await execute(
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

    if (response instanceof Error) {
        return response;
    }

    return Response.Success;
}

export async function writeInCredentialsTable(credentials: Credentials, credentialId: Uuid): Promise<string | Error> {
    const response = addCredentialToKms(credentialId, credentials);
    if (response instanceof Error) {
        return response;
    }
    return response;
}

export async function getCredentialsId(companyId: Uuid, credentialType: Uuid): Promise<Uuid | Error> {
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
    } else {
        return credentialIdObject.credential_id;
    }
}

async function getCredentialsById(credentialId: Uuid): Promise<Credentials | Error> {
    // Returns the credentials associated with a given credential ID.

    const credentialsRaw = await getCredentialFromKms(credentialId);

    if (credentialsRaw instanceof Error) {
        return credentialsRaw;
    }

    const credential = JSON.parse(credentialsRaw);
    const credentialsResponse = {
        access_token: cryptr.decrypt(credential.access_token),
        expiry_date: credential.expiry_date,
    };

    return credentialsResponse as Credentials;
}

export async function getCredentials(companyId: Uuid, credentialType: Uuid): Promise<Credentials | Error> {

    // 1. Get credential id associated with given company and data source.
    const credentialId = await getCredentialsId(companyId, credentialType);
    if (credentialId instanceof Error) {
        return credentialId;
    }

    // 2. Get credentials associated with given credential id.
    const credentials = await getCredentialsById(credentialId);
    return credentials;
}

async function updateCredentialsById(credentialsId: Uuid, credentials: Credentials) {
    updateCredentialInKms(credentialsId, credentials);
}

export async function storeCredentials(credentials: Credentials, companyId: Uuid, credentialType: Uuid): Promise<string | Error> {
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
        const response = await writeInCredentialsTable(credentials, credentialId);
        if (response instanceof Error) {
            return response;
        }

        // 2. Writes a mapping of company ID, credential type, and credential ID to the `credentials_store` table.
        const response1 = await writeInCredentialsStoreTable(companyId, credentialType, credentialId);

        if (response1 instanceof Error) {
            return response1;
        }

        return Response.Success;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export async function updateCredentials(credentials: Credentials, companyId: Uuid, credentialType: Uuid) {
    const credentialsId = await getCredentialsId(companyId, credentialType);
    if (credentialsId instanceof Error) {
        return credentialsId;
    }

    await updateCredentialsById(credentialsId, credentials);
}
