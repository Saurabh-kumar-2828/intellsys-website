import type {Credentials} from "~/backend/utilities/data-management/credentials.server";
import {storeCredentials} from "~/backend/utilities/data-management/credentials.server";
import {getErrorFromUnknown} from "~/backend/utilities/databaseManager.server";
import type {Uuid, Iso8601DateTime} from "~/utilities/typeDefinitions";
import {ConnectorTableType, ConnectorType} from "~/utilities/typeDefinitions";
import {CredentialType} from "~/utilities/typeDefinitions";
import {generateUuid, getCurrentIsoTimestamp} from "~/global-common-typescript/utilities/utilities";
import type {PostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {TransactionCommand} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getDestinationCredentialId, getRedirectUri, getSystemConnectorsDatabaseManager, getSystemPostgresDatabaseManager} from "~/backend/utilities/data-management/common.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import type {Integer} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {DateTime} from "luxon";

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
        const redirectUri = getRedirectUri(companyId, CredentialType.googleAds);
        if (redirectUri instanceof Error) {
            return redirectUri;
        }

        // // Post api to retrieve access token by giving authorization code.
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
                CredentialType.googleAds
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

                return connectorInitializationResponse;
            }

            await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);
            await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);

            const dataIngestionResponse = await ingestGoogleAdsData(getUuidFromUnknown("4d0f1aa7-f53f-4499-a022-651ced5e6138"), 15, "googleads");
            if (dataIngestionResponse instanceof Error) {
                return dataIngestionResponse;
            }

        }
    } catch (e) {
        console.log(e);
    }
}

export async function mapCompanyIdToConnectorId(systemPostgresDatabaseManager: PostgresDatabaseManager, companyId: Uuid, connectorId: Uuid, connectorType: ConnectorType, comments?: string): Promise<void | Error> {
    const response = await systemPostgresDatabaseManager.execute(
        `
            INSERT INTO
                company_to_connector_mapping
            VALUES (
                $1,
                $2,
                $3,
                $4
            )
        `,
        [companyId, connectorId, connectorType, comments]
    )

    if (response instanceof Error) {
        return response;
    }
}

async function initializeConnectorAndSubConnector(systemConnectorsDatabaseManager: PostgresDatabaseManager, connectorId: Uuid, sourceCredentialId: Uuid, destinationCredentialId: Uuid, comments: string, connectorTableType: ConnectorTableType, connectorType: ConnectorType, credentialType: Uuid): Promise<void | Error> {

    const currentTimestamp = getCurrentIsoTimestamp();

    const historicalCursorThreshold = DateTime.fromISO(currentTimestamp).minus({days: 15}).toJSDate().toISOString() as Iso8601DateTime;

    const connectorResponse = await systemConnectorsDatabaseManager.execute(
        `
            INSERT INTO
                connectors
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
        `,
        [connectorId, currentTimestamp, currentTimestamp, connectorType, sourceCredentialId, destinationCredentialId, comments]
    );

    if (connectorResponse instanceof Error) {
        return connectorResponse;
    }

    const subConnectorResponse = await systemConnectorsDatabaseManager.execute(
        `
            INSERT INTO
                connector_metadata
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
        `,
        [connectorId, connectorTableType, currentTimestamp, currentTimestamp, currentTimestamp, historicalCursorThreshold, comments]
    );

    if (subConnectorResponse instanceof Error) {
        return subConnectorResponse;
    }

}

async function ingestGoogleAdsData(connectorId: Uuid, duration: Integer, dataSource: string): Promise<void | Error> {
    console.log("Ingesting Google Ads data");
    console.log(connectorId);

    console.log(getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_TOKEN"));
    const url = `${getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_URL")}/${dataSource}/historical`;

    const body = new FormData();
    body.append("connectorId", connectorId);
    body.append("duration", `${duration}`);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_TOKEN"),
        },
        body: body,
    });

    if (!response.ok) {
        return Error(await response.text());
    }

    console.log(response);

}