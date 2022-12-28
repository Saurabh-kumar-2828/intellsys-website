import {BetaAnalyticsDataClient} from "@google-analytics/data";
import {Dimension} from "google-spreadsheet";
import {Iso8601Date} from "~/utilities/typeDefinitions";
import {kvpArrayToObjectReducer} from "~/utilities/utilities";
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

type fieldsUsedInGoogleAnalyticsAPI = {
    city: string;
    cityId: string;
    country: string;
    countryId: string;
    dateHour: Date;
    newVsReturning: string;
    operatingSystemWithVersion: string;
    platform: string;
    userGender: string;
    //metrics
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
}

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

const metrics = [
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


function getValues(input: Array<{value: any; oneValue: any}>): Array<any> {
    return input.map((row) => row.value);
}

function getRowOfDatabaseData(dimensionValues: Array<any>, dimensions: Array<string>) {
    const dimensionRow = dimensions.reduce((result , curValue:string, curIndex:number)=>{
        if(curValue == 'dateHour'){
            result[curValue] = toDateHourFormat(dimensionValues[curIndex]);
        }
        else{
            result[curValue] = dimensionValues[curIndex];
        }
        return result;
    }, {});
    return dimensionRow;
}

function flattenToPushIntoDatabase(data: {[key: string]: {metricObject: number}}, dimensions: Array<string>) {
    let databaseData: Array<fieldsUsedInGoogleAnalyticsAPI> = [];
    Object.entries(data).forEach((curRow) => {
        let dimensionArray = getRowOfDatabaseData(curRow[0].split(","), dimensions);
        let metricArray = curRow[1];
        const keyAndMetricsArray : fieldsUsedInGoogleAnalyticsAPI = {...dimensionArray, ...metricArray};
        databaseData.push(keyAndMetricsArray);
    });
    return databaseData;
}

function getInitalMetricsObject(){
    return metrics.reduce((result, curValue) => {
        result[curValue] = 0;
        return result;
    }, {});
}

function getMetricsRetrievedFromGA(resultFromGoogleAnalyticsApi: any, metricValues: Array<{value: any; oneValue: any}>, intialMetricObject: {metricObject: number}): {metricObject: number} {
    let metrics = resultFromGoogleAnalyticsApi.metricHeaders.map((obj: {name: string; type: string}) => obj.name);
    let metricsValues = getValues(metricValues);

    const retrievedMetricsObject = createObjectFromKeyValueArray(metrics, metricsValues);

    Object.keys(intialMetricObject).map((curMetric) => {
        if (curMetric in retrievedMetricsObject) {
            intialMetricObject[curMetric] = retrievedMetricsObject[curMetric];
        }
    });

    const updatedMetricObject = intialMetricObject;
    return updatedMetricObject;
}
function getDataToDbFormat(accumulatedDatabaseData: {[dimensions: string]: {metricObject: number}}, resultFromGoogleAnalyticsApi: any): {[dimensions: string]: {metricObject: number}} {
    let result: {[dimensions: string]: {metricObject: number}} = {};

    resultFromGoogleAnalyticsApi.rows.forEach((row: {dimensionValues: Array<{value: any; oneValue: any}>; metricValues: Array<{value: any; oneValue: any}>}) => {
        const dimesionValuesAsKey = getValues(row.dimensionValues);

        let metricArray: {metricObject: number};
        if (accumulatedDatabaseData[dimesionValuesAsKey.toString()] === undefined) {
            let intialMetricObject = getInitalMetricsObject();
            metricArray = getMetricsRetrievedFromGA(resultFromGoogleAnalyticsApi, row.metricValues, intialMetricObject);

        } else {
            metricArray = getMetricsRetrievedFromGA(resultFromGoogleAnalyticsApi, row.metricValues, accumulatedDatabaseData[dimesionValuesAsKey.toString()]);

        }
        accumulatedDatabaseData[dimesionValuesAsKey.toString()] = metricArray;
    });
    return accumulatedDatabaseData;
}

function getArrayAccordingToGoogleAnalyticsFormat(dimensions: Array<string>): Array<{[key: string]: string}> {
    const output: Array<{[key: string]: string}> = dimensions.reduce((result: Array<{[key: string]: string}>, dimension) => {
        result.push({
            name: dimension,
        });
        return result;
    }, []);
    return output;
}

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
    });

    return response;
}

export async function ingestDataFromGoogleAnalyticsApi(startDate: Iso8601Date, endDate: Iso8601Date, dimensions = runReportDimensions, metrics = runReportMetrics) {
    let accumulatedDataFromGoogeAnalyticsAPI: {[dimensions: string]: {metricObject: number}} = {};

    for (let i = 0; i < metrics.length; i++) {
        let curResult;
        if (i + 10 < metrics.length) {
            curResult = await getDataFromGoogleAnalyticsApi(dimensions, metrics.slice(i, i + 10), startDate, endDate);
            i = i + 10;
        } else {
            curResult = await getDataFromGoogleAnalyticsApi(dimensions, metrics.slice(i), startDate, endDate);
            i = metrics.length;
        }

        //accumulating data
        accumulatedDataFromGoogeAnalyticsAPI = getDataToDbFormat(accumulatedDataFromGoogeAnalyticsAPI, curResult);
    }

    const finalDataOfGoogleAnalyticsApi = flattenToPushIntoDatabase(accumulatedDataFromGoogeAnalyticsAPI, dimensions);
    console.log(finalDataOfGoogleAnalyticsApi);
}
