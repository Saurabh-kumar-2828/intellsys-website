import {TimeGranularity} from "../business-insights";


export function joinValues(values: Array<string>, separator: string, surroundWith: string = ""): string {
    return values
        .filter((value) => value != null)
        .map((value) => `${surroundWith}${value}${surroundWith}`)
        .join(separator);
}

// export function buildQuery(...values, separator) {
//     return values.filter(value => value != null).join(`${separator} `);
// }

export function getGranularityQuery(granularity: TimeGranularity, columnName: string): string {
    switch (granularity) {
        case TimeGranularity.daily: {
            return `DATE_TRUNC('DAY', ${columnName})`;
        }
        case TimeGranularity.weekly: {
            return `DATE_TRUNC('WEEK', ${columnName})`;
        }
        case TimeGranularity.monthly: {
            return `DATE_TRUNC('MONTH', ${columnName})`;
        }
        case TimeGranularity.yearly: {
            return `DATE_TRUNC('YEAR', ${columnName})`;
        }
        default: {
            throw "";
        }
    }
}

export function createGroupByReducer(attribute: string) {
    return (result, item) => {
        let itemsForAttribute = result[item[attribute]] || [];
        itemsForAttribute.push(item);
        result[item[attribute]] = itemsForAttribute;
        return result;
    };
}

export function toDateHourFormat(dateHour: string){
    let y = Number(dateHour.substring(0, 4));
    let m = Number(dateHour.substring(4, 2));
    let d = Number(dateHour.substring(6, 2));
    let h = Number(dateHour.substring(8, 2));
    return new Date(y, m - 1, d, h);
}

// TODO: Rename to something sensible
export function doesLeadCaptureSourceCorrespondToPerformanceLead(leadCaptureSource: string) {
    return leadCaptureSource != "Facebook On Form Ads";
}

// TODO: Rename to something sensible
export function doesAdsCampaignNameCorrespondToPerformanceLead(campaignName: string) {
    return campaignName != "GJ_LeadGen_18May" && campaignName != "GJ_LeadGen_Mattress_10 May";
}

// TODO: {'nov 5' : 12, 'nov 6' : 12, 'nov 5' : 2}
// results in: {nov 5 : 14, nov 6 : 12}
export function aggregateByDate(arr: Array<object>, param: string, dates: Array<string>) {
    const counts = dates.map((date) => arr.filter((x) => x.date == date).reduce((total, x) => total + x[param], 0));

    const sum1 = arr.reduce((total, x) => total + x[param], 0);
    const sum2 = counts.reduce((total, x) => total + x, 0);
    if (Math.abs(sum1 - sum2) > 0.1) {
        console.log("SUMS DON'T ADD UP!", sum1, sum2);
    }

    return counts;
}

// summation of numbers
export function sumReducer(total: number, sum: number) {
    return total + sum;
}

export function createObjectFromKeyValueArray(keys, values){
    var output = keys.reduce((r, c, i) => {r[c] = values[i]; return r}, {})
    return output;
}

// Example:
// [[1, 2, 3]
//  [4, 5, 6]
//  [7, 8, 9]]
// becomes
// [12, 15, 18] ([1 + 4 + 7, 2 + 5 + 8, 3 + 6 + 9])
export function columnWiseSummationOfMatrix(arr: Array<Array<number>>) {
    const result = arr.reduce(function (r, a) {
        a.forEach(function (b, i) {
            r[i] = (r[i] || 0) + b;
        });
        return r;
    }, []);
    return result;
}

export enum scale {
    normalizedScale = "0-1",
    dataDriven = "dataDriven",
    percentageScale = "1-100",
}

export enum yAxisDisplay {
    leftSide = "leftSide",
    rightSide = "rightSide",
    noDisplay = "noDisplay"
}

export enum plotMargins {
    top = 90,
    right = 60,
    bottom = 90,
    left = 60,
};

// function createGroupByReducer(result, item, attribute) {
//     return (result, item) => {
//         let itemsForAttribute;
//         if (item[attribute] in result) {
//             itemsForAttribute = result[item[attribute]];
//         } else {
//             itemsForAttribute = [];
//             result[item[attribute]] = itemsForAttribute;
//         }

//         itemsForAttribute.push(item);

//         return result;
//     };
// }

export function getOptionalEnvironmentVariable(variable: string): string | null {
    const value = process.env[variable];

    // Handle undefined case as well
    if (value == null) {
        return null;
    }

    return variable;
}

export function getRequiredEnvironmentVariable(variable: string): string {
    const value = process.env[variable];

    if (value == null) {
        throw Error(`Required environment variable ${variable} not found!`);
    }

    return variable;
}
