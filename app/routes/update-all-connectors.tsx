import type {ActionFunction} from "@remix-run/node";
import {getConnectors, ingestFutureDataFromConnectorsApi, ingestHistoricalDataFromConnectorsApi} from "~/backend/connectors.server";

// TODO: Test this E2E

export const action: ActionFunction = async ({request}) => {
    const resyncDuration = 15;
    const historicalDuration = 60;

    // Get array of connectors
    const connectors = await getConnectors();
    if (connectors instanceof Error) {
        return;
    }

    for (let i = 0; i < connectors.length; i++) {
        // Sync historical data.
        const historicalUpdate = await ingestHistoricalDataFromConnectorsApi(connectors[i].id, historicalDuration, connectors[i].connectorType);

        if (historicalUpdate instanceof Error) {
            console.log(`${connectors[i].id} - Historical - Failed`);
        } else {
            console.log(`${connectors[i].id} - Historical - Completed`);
        }

        // Sync future data.
        const futureUpdate = await ingestFutureDataFromConnectorsApi(connectors[i].id, resyncDuration, connectors[i].connectorType);

        if (futureUpdate instanceof Error) {
            console.log(`${connectors[i].id} - Future - Failed`);
        } else {
            console.log(`${connectors[i].id} - Future - Completed`);
        }
    }

    return null;
};
