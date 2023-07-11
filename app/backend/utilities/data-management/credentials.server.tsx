import {Companies} from "~/utilities/typeDefinitions";
import {execute} from "~/backend/utilities/databaseManager.server";
import type {Uuid} from "~/utilities/typeDefinitions";
import {getSingletonValue} from "~/utilities/utilities";
import {addCredentialToKms, getCredentialFromKms, updateCredentialInKms} from "~/global-common-typescript/server/kms.server";
import {getSystemPostgresDatabaseManager} from "~/backend/utilities/connectors/common.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";

export interface Credentials {
    [x: string]: string | number | boolean;
}

export enum Response {
    Success = "success",
}

export type CredentialId = Uuid;

export async function writeInCredentialsStoreTable(companyId: Uuid, credentialType: Uuid, credentialId: Uuid): Promise<void | Error> {
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

}

export async function writeInCredentialsTable(credentials: Credentials, credentialId: Uuid): Promise<void | Error> {

}

export async function getCredentialId(companyId: Uuid, credentialType: Uuid): Promise<Uuid | Error> {
    // Returns the credential ID associated with a given company Id and credential type.

    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if(systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

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

    const credentialIdRaw = await systemPostgresDatabaseManager.execute(query1, [companyId, credentialType]);

    if (credentialIdRaw instanceof Error) {
        return credentialIdRaw;
    }

    const row = getSingletonValue(credentialIdRaw.rows);

    return rowToCredentialId(row);

}

function rowToCredentialId(row: {credential_id: Uuid}): CredentialId {
    const id: CredentialId = getUuidFromUnknown(row.credential_id);

    return id;
}

async function getCredentialsById(credentialId: Uuid): Promise<Credentials | Error> {
    // Returns the credentials associated with a given credential ID.

    const credentialsRaw = await getCredentialFromKms(credentialId);

    if (credentialsRaw instanceof Error) {
        return credentialsRaw;
    }

    const credential = JSON.parse(credentialsRaw);
    const credentialsResponse = {
        access_token: credential.access_token,
        expiry_date: credential.expiry_date,
    };

    return credentialsResponse as Credentials;
}

export async function getCredentials(companyId: Uuid, credentialType: Uuid): Promise<Credentials | Error> {

    // 1. Get credential id associated with given company and data source.
    const credentialId = await getCredentialId(companyId, credentialType);
    if (credentialId instanceof Error) {
        return credentialId;
    }

    // 2. Get credentials associated with given credential id.
    const credentials = await getCredentialsById(credentialId);
    return credentials;
}

async function updateCredentialsById(credentialsId: Uuid, credentials: Credentials): Promise<void | Error> {
    const response = await updateCredentialInKms(credentialsId, credentials);

    if (response instanceof Error) {
        return response
    }
}

/**
 * Store the credentials of a company's data source.
 * @param  {Credentials} credentials credentials of a company's data source.
 * @param  {Uuid} companyId Unique Id of the company
 * @param  {Uuid} credentialType Unique Id of the data source
 * @returns  This function does not return anything
 */
export async function storeCredentials(credentialId: Uuid, credentials: Credentials, companyId: Uuid, credentialType: Uuid): Promise<void | Error> {
    try {
        // 1. Store credentials in kms.
        const response = await addCredentialToKms(credentialId, JSON.stringify(credentials));
        if (response instanceof Error) {
            return response;
        }

        // // 2. Writes a mapping of company ID, credential type, and credential ID to the `credentials_store` table.
        // const response1 = await writeInCredentialsStoreTable(companyId, credentialType, credentialId);
        // if (response1 instanceof Error) {
        //     return response1;
        // }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export async function updateCredentials(credentials: Credentials, companyId: Uuid, credentialType: Uuid): Promise<void | Error> {
    const credentialsId = await getCredentialId(companyId, credentialType);
    if (credentialsId instanceof Error) {
        return credentialsId;
    }

    const response = await updateCredentialsById(credentialsId, credentials);

    if (response instanceof Error) {
        return response;
    }
}
