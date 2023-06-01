import {BetaAnalyticsDataClient} from "@google-analytics/data";
import {Iso8601Date} from "~/utilities/typeDefinitions";
import {createObjectFromKeyValueArray, toDateHourFormat} from "../utilities";

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
        returnPropertyQuota: true
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
