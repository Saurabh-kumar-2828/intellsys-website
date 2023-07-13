import {getSystemConnectorsDatabaseManager} from "~/backend/utilities/connectors/common.server";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import type {Integer, Iso8601DateTime, Uuid} from "~/global-common-typescript/typeDefinitions";

export enum ConnectorType {
    Freshsales = "3ec459aa-ecbd-4829-a89a-9d4284887a1a",
    GoogleAds = "800c28ce-43ea-44b8-b6fc-077f44566296",
    FacebookAds = "d80731db-155e-4a24-bc58-158a57edabd7",
    GoogleAnalytics = "cc991d2b-dc83-458e-8e8d-9b47164c735f",
}

export type Connector = {
    id: Uuid;
    connectorType: Uuid;
    sourceCredentialsId: Uuid;
    destinationCredentialsId: Uuid;
};

// TODO: Rename to something sensible, and ensure the same thing is reflected in DB (connector_metadata) and DO_NOT_COMMIT (ConnectorTableType)
export type connectorMetadata = {
    connectorId: Uuid;
    connectorTableType: Iso8601DateTime;
    historicalCursor: Iso8601DateTime;
    futureCursor: Iso8601DateTime;
    historicalCursorThreshold: Iso8601DateTime;
};

/**
 * Store historical data in the company's database through intellsys-connectors.
 * @param connectorId: Unique id of the connector object.
 * @param duration: Duration to ingest data.
 * @returns : No. of rows deleted and inserted.
 */
export async function ingestHistoricalDataFromConnectorsApi(connectorId: Uuid, duration: Integer, connector: Uuid): Promise<void | Error> {
    const url = `${getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_URL")}/${connector}/historical`;

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
}

/**
 * Store future data in the company's database through intellsys-connectors.
 * @param connectorId: Unique id of the connector object.
 * @param duration: Duration to ingest data.
 * @returns : No. of rows deleted and inserted.
 */
export async function ingestFutureDataFromConnectorsApi(connectorId: Uuid, resyncDuration: Integer, connector: Uuid): Promise<void | Error> {
    const url = `${getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_URL")}/${connector}/future`;

    const body = new FormData();
    body.set("connectorId", connectorId);
    body.set("resyncDuration", resyncDuration.toString());

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
}

/**
 * Returns array of intellsys connectors.
 */
export async function getConnectors(): Promise<Array<Connector> | Error> {
    const databaseManager = await getSystemConnectorsDatabaseManager();
    if (databaseManager instanceof Error) {
        return databaseManager;
    }

    const result = await databaseManager.execute(
        `
            SELECT
                *
            FROM
                connectors
        `,
    );

    if (result instanceof Error) {
        return result;
    }

    return result.rows.map((row) => rowToConnector(row));
}

function rowToConnector(row: unknown): Connector {
    const connector = {
        id: row.id,
        connectorType: row.connector_type,
        sourceCredentialsId: row.source_credentials_id,
        destinationCredentialsId: row.destination_credentials_id,
    };

    return connector;
}
