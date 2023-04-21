import Cryptr from "cryptr";
import { Companies } from "do-not-commit";
import { DateTime } from "luxon";
import { Credentials } from "~/backend/utilities/data-management/facebookOAuth.server";
import { execute } from "~/backend/utilities/databaseManager.server";
import { Uuid } from "~/utilities/typeDefinitions";
import { getSingletonValueOrNull } from "~/utilities/utilities";
import {v4 as uuidv4} from "uuid";

const cryptr = new Cryptr(process.env.ENCRYPTION_KEY!);

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

        // 2. Writes a mapping of company ID, credential type, and credential ID to the `credentials_store` table.
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
