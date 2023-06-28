import {TransactionCommand, getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import type {Integer} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import type {Uuid} from "~/utilities/typeDefinitions";
import {ConnectorTableType, ConnectorType, dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {
    createTable,
    getDestinationCredentialId,
    getSystemConnectorsDatabaseManager,
    getSystemPostgresDatabaseManager,
    initializeConnectorAndSubConnector,
    mapCompanyIdToConnectorId,
} from "./common.server";

export type GoogleAnalyticsCredentials = {
    propertyId: string;
    refreshToken: string;
};

export type GoogleAnalyticsAccessiblePropertyIds = {
    displayName: string;
    propertyId: string;
};

/**
 * Retrieves a list of all Google Ads accounts that you are able to act upon directly given your current credentials.
 */
export async function getAccessiblePropertyIds(refreshToken: string): Promise<Array<GoogleAnalyticsAccessiblePropertyIds> | Error> {
    const googleAdsHelperUrl = getRequiredEnvironmentVariableNew("INTELLSYS_GOOGLE_ADS_HELPER_URL");

    const formdata = new FormData();
    formdata.append("client_id", getRequiredEnvironmentVariableNew("GOOGLE_CLIENT_ID"));
    formdata.append("client_secret", getRequiredEnvironmentVariableNew("GOOGLE_CLIENT_SECRET"));
    formdata.append("refresh_token", refreshToken);

    const requestOptions = {
        method: "POST",
        body: formdata,
    };

    const rawResponse = await fetch(`${googleAdsHelperUrl}/get_google_analytics_property_ids`, requestOptions);

    if (!rawResponse.ok) {
        return Error("Request to get accessible account failed");
    }

    const response = await rawResponse.json();

    const accessbileAccounts: Array<GoogleAnalyticsAccessiblePropertyIds> = response.map((row) => convertToAccessbilePropertyIds(row));

    return accessbileAccounts;
}

export async function ingestAndStoreGoogleAnalyticsData(credentials: GoogleAnalyticsCredentials, companyId: Uuid, connectorId: Uuid): Promise<void | Error> {
    const response = await storeGoogleAnalyticsOAuthDetails(credentials, companyId, connectorId);
    if (response instanceof Error) {
        return response;
    }
}

/**
 *  Handles the OAuth2 flow to authorize the Google Ads API for the given companyId and stores the credentials in KMS table, connectors table, subconnecter table and companyToConnectorTable.
 */
export async function storeGoogleAnalyticsOAuthDetails(credentials: GoogleAnalyticsCredentials, companyId: Uuid, connectorId: Uuid): Promise<void | Error> {
    try {
        const sourceCredentialId = generateUuid();

        // Destination = Company's Database.
        const companyDatabaseCredentialId = await getDestinationCredentialId(companyId);
        if (companyDatabaseCredentialId instanceof Error) {
            return companyDatabaseCredentialId;
        }

        const companyDatabaseManager = await getPostgresDatabaseManager(companyDatabaseCredentialId);
        if (companyDatabaseManager instanceof Error) {
            return companyDatabaseManager;
        }

        // System Database
        const systemConnectorsDatabaseManager = await getSystemConnectorsDatabaseManager();
        if (systemConnectorsDatabaseManager instanceof Error) {
            return systemConnectorsDatabaseManager;
        }

        const systemPostgresDatabaseManager = await getSystemPostgresDatabaseManager();
        if (systemPostgresDatabaseManager instanceof Error) {
            return systemPostgresDatabaseManager;
        }

        // Store source credentials in KMS.
        const response = await storeCredentials(getUuidFromUnknown(sourceCredentialId), credentials, companyId, getUuidFromUnknown(ConnectorType.GoogleAnalytics));
        if (response instanceof Error) {
            return response;
        }

        await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);
        await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);

        const connectorInitializationResponse = await initializeConnectorAndSubConnector(
            systemConnectorsDatabaseManager,
            connectorId,
            sourceCredentialId,
            companyDatabaseCredentialId,
            "Google Analytics",
            ConnectorTableType.GoogleAnalytics,
            ConnectorType.GoogleAnalytics,
            `{"accountId": "${credentials.propertyId}"}`,
        );

        const mapCompanyIdToConnectorIdResponse = await mapCompanyIdToConnectorId(systemPostgresDatabaseManager, companyId, connectorId, ConnectorType.GoogleAnalytics, "Google Analytics");

        if (connectorInitializationResponse instanceof Error || mapCompanyIdToConnectorIdResponse instanceof Error) {
            await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);
            await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);

            console.log("All transactions rollbacked");
            return connectorInitializationResponse;
        }

        await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);
        await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);

        // Creates a source table in company's database.
        const tableName = `${dataSourcesAbbreviations.googleAnalytics}_${credentials.propertyId}`;
        const createTableResponse = await createTable(companyDatabaseManager, tableName);
        if (createTableResponse instanceof Error) {
            return createTableResponse;
        }

        const dataIngestionResponse = await ingestGoogleAnalyticsData(getUuidFromUnknown(connectorId), 45);
        if (dataIngestionResponse instanceof Error) {
            return dataIngestionResponse;
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * Store the Google Analytics data in the company's database through intellsys-connectors.
 * @param connectorId: Unique id of the connector object.
 * @param duration: Duration to ingest data.
 * @returns : No. of rows deleted and inserted.
 */
export async function ingestGoogleAnalyticsData(connectorId: Uuid, duration: Integer, connector?: string): Promise<void | Error> {
    try {
        const url = `${getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_URL")}/${ConnectorType.GoogleAnalytics}/historical`;

        const body = new FormData();
        body.set("connectorId", connectorId);
        body.set("duration", duration.toString());

        const headers = new Headers();
        headers.append("Authorization", getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_TOKEN"));

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: body,
            redirect: "follow",
        });

        if (!response.ok) {
            return Error(await response.text());
        }

        const ingestionResult = await response.json();
        console.log(ingestionResult);
    } catch (e) {
        console.log(e);
    }
}

function convertToAccessbilePropertyIds(row: any) {
    const result: GoogleAnalyticsAccessiblePropertyIds = {
        propertyId: row.property_id as string,
        displayName: row.display_name as string,
    };

    return result;
}
