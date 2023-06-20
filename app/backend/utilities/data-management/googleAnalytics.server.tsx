import {BetaAnalyticsDataClient} from "@google-analytics/data";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
import {ConnectorTableType, ConnectorType, dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
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
import {storeCredentials} from "./credentials.server";
import {createObjectFromKeyValueArray, toDateHourFormat} from "~/utilities/utilities";
import type {Integer} from "~/global-common-typescript/typeDefinitions";

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

    var formdata = new FormData();
    formdata.append("client_id", getRequiredEnvironmentVariableNew("GOOGLE_CLIENT_ID"));
    formdata.append("client_secret", getRequiredEnvironmentVariableNew("GOOGLE_CLIENT_SECRET"));
    formdata.append("refresh_token", refreshToken);

    var requestOptions = {
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

        console.log(1);
        const dataIngestionResponse = await ingestGoogleAnalyticsData(getUuidFromUnknown(connectorId), 45);
        if (dataIngestionResponse instanceof Error) {
            return dataIngestionResponse;
        }
        console.log(2)
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
        const url = `${getRequiredEnvironmentVariableNew("INTELLSYS_CONNECTOR_URL")}/googleAnalytics/historical`;

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

// export async function ingestDataFromRealTimeGoogleAnalyticsApi(startMinutesAgo: number, endMinutesAgo: 0) {
//     const analyticsDataClient = new BetaAnalyticsDataClient();

//     const [response] = await analyticsDataClient.runRealtimeReport({
//         property: `properties/${process.env.PROPERTY_ID}`,
//         minuteRanges: [
//             {
//                 startMinutesAgo: startMinutesAgo,
//                 endMinutesAgo: endMinutesAgo,
//             },
//         ],
//         dimensions: [
//             {
//                 name: realTimeReportDimensions.minutesAgo,
//             },
//             {
//                 name: realTimeReportDimensions.countryId,
//             },
//             {
//                 name: realTimeReportDimensions.country,
//             },
//             {
//                 name: realTimeReportDimensions.city,
//             },
//             //   {
//             //     "name":"deviceCategory"
//             //   },
//             //   {
//             //     "name":"platform"
//             //   },
//             //   {
//             //     "name":"streamId"
//             //   },
//             //   {
//             //     "name":"streamName"
//             //   },
//             //   {
//             //     "name":"unifiedScreenName"
//             //   },
//         ],
//         metrics: [
//             {
//                 name: "activeUsers",
//             },
//             {
//                 name: "conversions",
//             },
//             //   {
//             //     "name": 'eventCount',
//             //   },
//             //   {
//             //     "name": 'screenPageViews',
//             //   }
//         ],
//     });

//     let result: Array<Object> = [];
//     response.rows?.forEach((row) => {
//         let mintuesAgo = row.dimensionValues[0].value;
//         let countryID = row.dimensionValues[1].value;
//         let country = row.dimensionValues[2].value;
//         let city = row.dimensionValues[3].value;
//         let activeUsers = row.metricValues[0].value;
//         let conversions = row.metricValues[1].value;

//         result.push({
//             "Minutes Ago": mintuesAgo,
//             "Country ID": countryID,
//             country: country,
//             City: city,
//             "Active Users": activeUsers,
//             Conversions: conversions,
//         });
//     });

//     return result;
// }

type dimensionObject = {
    city: string;
    cityId: string;
    country: string;
    countryId: string;
    dateHour: Date;
    newVsReturning: string;
    operatingSystemWithVersion: string;
    platform: string;
    userGender: string;
};

type metricObject = {
    active1DayUsers: number;
    active28DayUsers: number;
    active7DayUsers: number;
    activeUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
    dauPerMau: number;
    dauPerWau: number;
    engagedSessions: number;
    engagementRate: number;
    screenPageViews: number;
    screenPageViewsPerSession: number;
    sessionConversionRate: number;
    sessions: number;
    sessionsPerUser: number;
    "sessionConversionRate:PurchaseDone": number;
    "sessionConversionRate:click": number;
    "sessionConversionRate:purchase": number;
};

interface fieldsUsedInGoogleAnalyticsApi extends dimensionObject, metricObject {}

const runReportDimensions = ["city", "cityId", "country", "countryId", "dateHour", "newVsReturning", "operatingSystemWithVersion", "platform", "userGender"];
const runReportMetrics = [
    "active1DayUsers",
    "active28DayUsers",
    "active7DayUsers",
    "activeUsers",
    "averageSessionDuration",
    "bounceRate",
    "dauPerMau",
    "dauPerWau",
    "engagedSessions",
    "engagementRate",
    "screenPageViews",
    "screenPageViewsPerSession",
    "sessionConversionRate",
    "sessions",
    "sessionsPerUser",
    "sessionConversionRate:PurchaseDone",
    "sessionConversionRate:click",
    "sessionConversionRate:purchase",
];

type googleAnalyticObject = {
    value: any;
    oneValue: any;
};

function getValues(input: Array<googleAnalyticObject>): Array<any> {
    return input.map((row) => row.value);
}

function mapDimensionValuesToHeaders(dimensionValues: Array<any>, dimensionHeaders: Array<string>): dimensionObject {
    const dimensionRow: dimensionObject = dimensionHeaders.reduce((result: any, currentValue: string, currentIndex: number) => {
        if (currentValue == "dateHour") {
            result[currentValue as keyof dimensionObject] = toDateHourFormat(dimensionValues[currentIndex]);
        } else {
            result[currentValue] = dimensionValues[currentIndex];
        }
        return result;
    }, {});
    return dimensionRow;
}

function flattenToPushIntoDatabase(data: {[key: string]: metricObject}, dimensionHeaders: Array<string>) {
    let databaseData: Array<fieldsUsedInGoogleAnalyticsApi> = [];
    Object.entries(data).forEach((currentRow) => {
        const dimensionArray: dimensionObject = mapDimensionValuesToHeaders(currentRow[0].split(","), dimensionHeaders);
        const metricArray: metricObject = currentRow[1];
        const keyAndMetricsArray: fieldsUsedInGoogleAnalyticsApi = {...dimensionArray, ...metricArray};
        databaseData.push(keyAndMetricsArray);
    });
    return databaseData;
}

// Initialize metricheaders with 0 value
function getInitalMetricsObject(metrics: Array<string>): metricObject {
    const output: metricObject = metrics.reduce((result: any, currentValue: string) => {
        result[currentValue as keyof metricObject] = 0;
        return result;
    }, {});
    return output;
}

/**
 * Updates the inital metric object values with the new metrics values obtained from Google Analytics API request
 * @param metricHeaders : Metric headers retrieved from Google Analytics API request
 * @param metricValues : Metric Values retrieved from Google Analytics API request
 * @param intialMetricObject : Initial metric Object
 */
function getMetricsRetrievedFromGoogleAnalytics(metricHeaders: Array<string>, metricValues: Array<googleAnalyticObject>, intialMetricObject: metricObject): metricObject {
    let metricsValues = getValues(metricValues);
    const retrievedMetricsObject = createObjectFromKeyValueArray(metricHeaders, metricsValues);

    Object.keys(intialMetricObject).map((currentMetric) => {
        if (currentMetric in retrievedMetricsObject) {
            intialMetricObject[currentMetric as keyof metricObject] = retrievedMetricsObject[currentMetric];
        }
    });

    const updatedMetricObject = intialMetricObject;
    return updatedMetricObject;
}

/**
 * Changes the data format to one that can be pushed to a database.
 * @param accumulatedData : Accumulated data of previous Google Analytics API requests
 * @param resultFromGoogleAnalyticsApi : Data fetched from Google Analytics API from current request
 */
function accumulateData(accumulatedData: {[dimensions: string]: metricObject}, resultFromGoogleAnalyticsApi: any, metrics: Array<string>): {[dimensions: string]: metricObject} {
    let metricHeaders = resultFromGoogleAnalyticsApi.metricHeaders.map((obj: {name: string; type: string}) => obj.name);
    resultFromGoogleAnalyticsApi.rows.forEach((row: {dimensionValues: Array<googleAnalyticObject>; metricValues: Array<googleAnalyticObject>}) => {
        const dimesionValuesAsKey = getValues(row.dimensionValues);

        let metricArray: metricObject;
        if (accumulatedData[dimesionValuesAsKey.toString()] === undefined) {
            let intialMetricObject = getInitalMetricsObject(metrics);
            metricArray = getMetricsRetrievedFromGoogleAnalytics(metricHeaders, row.metricValues, intialMetricObject);
        } else {
            metricArray = getMetricsRetrievedFromGoogleAnalytics(metricHeaders, row.metricValues, accumulatedData[dimesionValuesAsKey.toString()]);
        }
        accumulatedData[dimesionValuesAsKey.toString()] = metricArray;
    });
    return accumulatedData;
}

function getArrayAccordingToGoogleAnalyticsFormat(dimensions: Array<string>): Array<{[key: string]: string}> {
    const output: Array<{[key: string]: string}> = dimensions.reduce((result: Array<{[key: string]: string}>, currentDimension) => {
        result.push({
            name: currentDimension,
        });
        return result;
    }, []);
    return output;
}

/**
 * Fetch data from Google Analytics API
 */
export async function getDataFromGoogleAnalyticsApi(dimensions: Array<string>, metrics: Array<string>, startDate: Iso8601Date, endDate: Iso8601Date) {
    const analyticsDataClient = new BetaAnalyticsDataClient();

    const [response] = await analyticsDataClient.runReport({
        property: `properties/${process.env.PROPERTY_ID}`,
        dateRanges: [
            {
                startDate: startDate,
                endDate: endDate,
            },
        ],
        dimensions: getArrayAccordingToGoogleAnalyticsFormat(dimensions),
        metrics: getArrayAccordingToGoogleAnalyticsFormat(metrics),
        returnPropertyQuota: true,
    });

    return response;
}

export async function ingestDataFromGoogleAnalyticsApi(startDate: Iso8601Date, endDate: Iso8601Date, dimensions = runReportDimensions, metrics = runReportMetrics) {
    let accumulatedData: {[dimensions: string]: metricObject} = {};

    for (let i = 0; i < metrics.length; i++) {
        let currentResult;
        let iEnd = Math.min(i + 10, metrics.length);
        currentResult = await getDataFromGoogleAnalyticsApi(dimensions, metrics.slice(i, iEnd), startDate, endDate);
        i = iEnd;

        // Accumulate data
        accumulatedData = accumulateData(accumulatedData, currentResult, metrics);
    }

    const finalData = flattenToPushIntoDatabase(accumulatedData, dimensions);
    // console.log(finalData);
}
