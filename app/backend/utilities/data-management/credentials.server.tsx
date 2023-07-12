import type {Uuid} from "~/utilities/typeDefinitions";
import {getCredentialFromKms, updateCredentialInKms} from "~/global-common-typescript/server/kms.server";
import {getSystemPostgresDatabaseManager} from "~/backend/utilities/connectors/common.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getSingletonValue} from "~/global-common-typescript/utilities/utilities";

export interface Credentials {
    [x: string]: string | number | boolean;
}

export enum Response {
    Success = "success",
}

export type CredentialId = Uuid;

export async function getCredentialId(companyId: Uuid, credentialType: Uuid): Promise<Uuid | Error> {
    // Returns the credential ID associated with a given company Id and credential type.

    const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
    if (systemPostgresDatabaseManager instanceof Error) {
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
    const credentialsResponse: Credentials = {
        access_token: credential.access_token,
        expiry_date: credential.expiry_date,
    };

    return credentialsResponse;
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

async function updateCredentialsById(credentialsId: Uuid, credentials: string): Promise<void | Error> {
    const response = await updateCredentialInKms(credentialsId, credentials);

    if (response instanceof Error) {
        return response;
    }
}

export async function updateCredentials(credentials: Credentials, companyId: Uuid, credentialType: Uuid): Promise<void | Error> {
    const credentialsId = await getCredentialId(companyId, credentialType);
    if (credentialsId instanceof Error) {
        return credentialsId;
    }

    const response = await updateCredentialsById(credentialsId, JSON.stringify(credentials));

    if (response instanceof Error) {
        return response;
    }
}
