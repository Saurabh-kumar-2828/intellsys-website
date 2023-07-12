import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import type {GoogleAdsCredentials} from "./googleOAuth.server";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {
    createTable,
    getDestinationCredentialId,
    getSystemConnectorsDatabaseManager,
    getSystemPostgresDatabaseManager,
    initializeConnectorAndSubConnector,
    mapCompanyIdToConnectorId,
} from "./common.server";
import {TransactionCommand, getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {ConnectorTableType, ConnectorType, dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {addCredentialToKms, deleteCredentialFromKms} from "~/global-common-typescript/server/kms.server";
import {ingestHistoricalDataFromConnectorsApi} from "~/backend/connectors.server";

export async function ingestAndStoreGoogleAdsData(credentials: GoogleAdsCredentials, companyId: Uuid, connectorId: Uuid, extraInformation: {[key: string]: any}): Promise<void | Error> {
    const response = await storeGoogleAdsOAuthDetails(credentials, companyId, connectorId, extraInformation);
    if (response instanceof Error) {
        return response;
    }
}

/**
 *  Handles the OAuth2 flow to authorize the Google Ads API for the given companyId and stores the credentials in KMS table, connectors table, subconnecter table and companyToConnectorTable.
 */
export async function storeGoogleAdsOAuthDetails(credentials: GoogleAdsCredentials, companyId: Uuid, connectorId: Uuid, extraInformation: {[key: string]: any}): Promise<void | Error> {
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

    await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);
    await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Begin);

    // Store source credentials in KMS.
    const response = await addCredentialToKms(getUuidFromUnknown(sourceCredentialId), JSON.stringify(credentials), `${companyId} - Google Ads `);
    if (response instanceof Error) {
        return response;
    }

    const connectorInitializationResponse = await initializeConnectorAndSubConnector(
        systemConnectorsDatabaseManager,
        connectorId,
        sourceCredentialId,
        companyDatabaseCredentialId,
        "Google Ads",
        ConnectorTableType.GoogleAds,
        ConnectorType.GoogleAds,
    );

    const mapCompanyIdToConnectorIdResponse = await mapCompanyIdToConnectorId(
        systemPostgresDatabaseManager,
        companyId,
        connectorId,
        ConnectorType.GoogleAds,
        "Google Ads",
        JSON.stringify(extraInformation),
    );

    if (connectorInitializationResponse instanceof Error || mapCompanyIdToConnectorIdResponse instanceof Error) {
        await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);
        await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Rollback);

        const response = await deleteCredentialFromKms(sourceCredentialId);

        console.log("All transactions rollbacked");
        return connectorInitializationResponse;
    }

    await systemConnectorsDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);
    await systemPostgresDatabaseManager.executeTransactionCommand(TransactionCommand.Commit);

    // Creates a source table in company's database.
    const tableName = `${dataSourcesAbbreviations.googleAds}_${credentials.googleAccountId}`;

    const createTableResponse = await createTable(companyDatabaseManager, tableName);
    if (createTableResponse instanceof Error) {
        return createTableResponse;
    }

    const dataIngestionResponse = await ingestHistoricalDataFromConnectorsApi(getUuidFromUnknown(connectorId), 45, getUuidFromUnknown(ConnectorType.GoogleAds));
    if (dataIngestionResponse instanceof Error) {
        return dataIngestionResponse;
    }
}
