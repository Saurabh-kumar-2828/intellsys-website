import type {Credentials} from "~/backend/utilities/data-management/credentials.server";
import {getCredentialId} from "~/backend/utilities/data-management/credentials.server";
import {storeCredentials} from "~/backend/utilities/data-management/credentials.server";
import {getErrorFromUnknown} from "~/backend/utilities/databaseManager.server";
import type {Uuid} from "~/utilities/typeDefinitions";
import {ConnectorTableType, ConnectorType} from "~/utilities/typeDefinitions";
import {CredentialType} from "~/utilities/typeDefinitions";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {deleteCompanyIdToConnectorIdMapping, deleteCompanyIdToCredentialIdMapping, deleteConnectorAndSubconnector, getConnectorId, getDestinationCredentialId, getRedirectUri, getSystemConnectorsDatabaseManager, getSystemPostgresDatabaseManager, initializeConnectorAndSubConnector, mapCompanyIdToConnectorId} from "~/backend/utilities/data-management/common.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import type {Integer} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {TransactionCommand, getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {deleteCredentialFromKms} from "~/global-common-typescript/server/kms.server";

// TODO: Fix timezone in database

export const googleAdsScope = "https://www.googleapis.com/auth/adwords";

type GoogleAdsCredentials = {
    refreshToken: string;
};

/**
 * Sends a request to the Google Ads OAuth2 API to refresh an access token.
 */
function convertTokenToGoogleCredentialsType(credentials: Credentials): GoogleAdsCredentials | Error {

    try {
        if (credentials.access_token == undefined || credentials.expires_in == undefined) {
            return Error("Google credentials not valid");
        }

        let result: GoogleAdsCredentials = {
            refreshToken: credentials.refresh_token != undefined ? (credentials.refresh_token as string) : "",
        };

        return result;
    } catch (error_: unknown) {
        const error = getErrorFromUnknown(error_);
        return error;
    }
}


/**
 *  Handles the OAuth2 flow to authorize the Google Ads API for the given companyId and stores the credentials in KMS table, connectors table, subconnecter table and companyToConnectorTable
 */
export async function googleOAuthFlow(authorizationCode: string, companyId: Uuid): Promise<void | Error> {

    try {
        const redirectUri = getRedirectUri(companyId, CredentialType.GoogleAds);
        if (redirectUri instanceof Error) {
            return redirectUri;
        }

        // Post api to retrieve access token by giving authorization code.
        const url = `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_CLIENT_ID!}&client_secret=${process.env
            .GOOGLE_CLIENT_SECRET!}&redirect_uri=${redirectUri}&code=${authorizationCode}&grant_type=authorization_code`;

        const response = await fetch(url, {
            method: "POST",
        });
        const rawResponse = await response.json();

        const token = convertTokenToGoogleCredentialsType(rawResponse);

        if (token instanceof Error) {
            return token;
        }

        if (companyId != "undefined") {

            const sourceCredentialId = generateUuid();

            const connectorId = generateUuid();

            // Destination = Company's Database.
            const destinationCredentialId = await getDestinationCredentialId(companyId);
            if (destinationCredentialId instanceof Error) {
                return destinationCredentialId;
            }

            const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();
            if (systemConnectorsDatabaseManager instanceof Error) {
                return systemConnectorsDatabaseManager;
            }

            const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
            if (systemPostgresDatabaseManager instanceof Error) {
                return systemPostgresDatabaseManager;
            }

            // Store credentials in KMS.
            const response = await storeCredentials(
                getUuidFromUnknown(sourceCredentialId),
                {
                    refresh_token: token.refreshToken,
                },
                companyId,
                CredentialType.GoogleAds
            );
            if (response instanceof Error) {
                return response;
            }

            await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);
            await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);

            const connectorInitializationResponse = await initializeConnectorAndSubConnector(systemConnectorsDatabaseManager, connectorId, sourceCredentialId, destinationCredentialId, "Google Ads", ConnectorTableType.GoogleAds, ConnectorType.GoogleAds, CredentialType.GoogleAds);

            const mapCompanyIdToConnectorIdResponse = await mapCompanyIdToConnectorId(systemPostgresDatabaseManager, companyId, connectorId, ConnectorType.GoogleAds, "Google Ads");

            if (connectorInitializationResponse instanceof Error || mapCompanyIdToConnectorIdResponse instanceof Error) {
                await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);
                await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);

                console.log("All transactions rollbacked");
                return connectorInitializationResponse;
            }

            await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);
            await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);

            const dataIngestionResponse = await ingestGoogleAdsData(getUuidFromUnknown(connectorId), 15);
            if (dataIngestionResponse instanceof Error) {
                return dataIngestionResponse;
            }

        }
    } catch (e) {
        console.log(e);
    }
}

export async function ingestGoogleAdsData(connectorId: Uuid, duration: Integer): Promise<void | Error> {

    const url = `${getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_URL")}/googleads/historical`;

    const body = new FormData();
    body.set("connectorId", connectorId);
    body.set("duration", duration.toString());

    const headers = new Headers();
    headers.append("Authorization", getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_TOKEN"))

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
        redirect: 'follow'
    });

    if (!response.ok) {
        return Error(await response.text());
    }

    const ingestionResult = await response.json();
    console.log(ingestionResult);
}

export async function deleteCredentialsFromSources(companyId: Uuid, credentialType: Uuid, connectorType: ConnectorType) {

    // TODO: Add transactions

    const systemPostgresDatabaseManager = getSystemPostgresDatabaseManager();
    if(systemPostgresDatabaseManager instanceof Error) {
        return systemPostgresDatabaseManager;
    }

    // Delete Credential and its details
    const credentialId = await getCredentialId(companyId, credentialType);
    if(credentialId instanceof Error){
        return credentialId;
    }

    await deleteCompanyIdToCredentialIdMapping(credentialId);

    await deleteCredentialFromKms(credentialId);

    // Delete Connector and its details
    const connectorId = await getConnectorId(companyId, connectorType);
    if(connectorId instanceof Error){
        return connectorId;
    }

    await deleteCompanyIdToConnectorIdMapping(connectorId);
    await deleteConnectorAndSubconnector(connectorId);

    // Delete data from google ads data
    await dropGoogleAdsTable(companyId);
}

export async function dropGoogleAdsTable(companyId: Uuid){
    const destinationCredentialId = await getDestinationCredentialId(companyId);
    if (destinationCredentialId instanceof Error) {
        return destinationCredentialId;
    }

    const databaseManager = await getPostgresDatabaseManager(destinationCredentialId);
    if (databaseManager instanceof Error) {
        return databaseManager;
    }

    // Change it to DROP
    const query = `
        DELETE FROM google_ads_insights
    `

    const response = await databaseManager.execute(query);

    if (response instanceof Error) {
        return response;
    }
}