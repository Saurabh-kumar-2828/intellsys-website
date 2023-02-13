import {DateTime} from "luxon";
import {Iso8601Date} from "./typeDefinitions";

// export function getUrlForResource(resourceRelativePath) {
//     return `${process.env.NEXT_PUBLIC_FRONTEND_URL}/resources/${resourceRelativePath}`;
// }

export function getUrlForCdnResource(imageId, imageVariant) {
    // if (imageId == null || imageVariant == null) {
    //     throw new Exception("Incorrect usage of getUrlForCdnResource!");
    // }

    return `https://imagedelivery.net/${cloudflareImagesAccountHash}/${imageId}/${imageVariant}`;
}

export function getNonEmptyStringOrNull(str): string | null {
    if (str?.length == 0) {
        return null;
    }

    return str;
}

export async function postJson(url, data) {
    return await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}

export function concatenateNonNullStringsWithSpaces(...strs: Array<string | null | undefined>): string {
    // TODO: Do this properly
    return strs.join(" ");
}

export function concatenateNonNullStringsWithAmpersand(...strs: Array<string | null | undefined>): string {
    // TODO: Merge implementations
    let concatenatedString = null;

    for (const str of strs) {
        if (str == null) {
            continue;
        }

        if (concatenatedString == null) {
            concatenatedString = str;
        } else {
            concatenatedString = concatenatedString + "&" + str;
        }
    }

    return concatenatedString;
}

export function getHumanReadableMonth(month: number): string {
    return month == 1
        ? "January"
        : month == 2
        ? "February"
        : month == 3
        ? "March"
        : month == 4
        ? "April"
        : month == 5
        ? "May"
        : month == 6
        ? "June"
        : month == 7
        ? "July"
        : month == 8
        ? "August"
        : month == 9
        ? "September"
        : month == 10
        ? "October"
        : month == 11
        ? "November"
        : month == 12
        ? "December"
        : "";
}

export function getHumanReadableShortDay(day: number): string {
    return day == 0 ? "Sun" : day == 1 ? "Mon" : day == 2 ? "Tue" : day == 3 ? "Wed" : day == 4 ? "Thu" : day == 5 ? "Fri" : day == 6 ? "Sat" : "";
}

export function getHumanReadable12HourString(hours: number, minutes: number): string {
    let hours2 = hours % 12;
    hours2 = hours2 ? hours2 : 12; // the hour `0` should be `12`
    let minutes2 = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours2 + ":" + minutes2 + " " + (hours >= 12 ? "PM" : "AM");
    return strTime;
}

export function convertDateTimeToTimestamp(dateTime: DateTime) {
    return Math.trunc(dateTime.toMillis() / 1000);
}

export function coalesce(...args) {
    for (let i = 0; i < args.length; i++) {
        if (args[i] != null) {
            return args[i];
        }
    }
    return null;
}

export function distinct(arr) {
    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    return arr.filter(onlyUnique);
}

export function dateToMediumNoneEnFormat(date: string) {
    if (date == null) {
        return null;
    }

    return new Intl.DateTimeFormat("en", {timeZone: "Asia/Kolkata", dateStyle: "medium"}).format(new Date(date));
}

export function dateToMediumEnFormat(date: string) {
    if (date == null) {
        return null;
    }

    return new Intl.DateTimeFormat("en", {timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short", hour12: true}).format(new Date(date));
}

export function dateToNoneMediumEnFormat(date: string) {
    if (date == null) {
        return null;
    }

    return new Intl.DateTimeFormat("en", {timeZone: "Asia/Kolkata", timeStyle: "short", hour12: true}).format(new Date(date));
}

export function dateToIso8601Date(a: any): Iso8601Date {
    return a.toISOString().slice(0, 10);
}

export function kvpArrayToObjectReducer(kvpArray: Array<any>) {
    return kvpArray.reduce((obj, kvp) => ({...obj, [kvp[0]]: kvp[1]}), {});
}

export function agGridDateComparator(a: string, b: string) {
    const aa = new Date(a);
    const bb = new Date(b);
    if (aa > bb) {
        return 1;
    } else if (aa < bb) {
        return -1;
    } else {
        return 0;
    }
}

// export function agGridFloatComparator(a: string, b: string) {
//     const aFloat = parseFloat(a);
//     const bFloat = parseFloat(b);

//     if (a > b) {
//         return 1;
//     } else if (a < b) {
//         return -1;
//     } else {
//         return 0;
//     }
// }

export function numberToHumanFriendlyString(n, isFloat = false, shorten = true, isPercentage = false) {
    if (n == null || isNaN(n)) {
        return "?";
    }

    if (isPercentage) {
        if (isFloat) {
            return `${(n * 100).toFixed(2)}%`;
        } else {
            return `${n * 100}%`;
        }
    }

    if (!shorten || n < 10 ** 3) {
        if (isFloat) {
            return n.toFixed(2);
        } else {
            return n;
        }
    } else if (n < 10 ** 5) {
        return `${(n / 10 ** 3).toFixed(2)}K`;
    } else if (n < 10 ** 7) {
        return `${(n / 10 ** 5).toFixed(2)}L`;
    } else {
        return `${(n / 10 ** 7).toFixed(2)}Cr`;
    }
}

export function roundOffToTwoDigits(n) {
    return Number(n).toFixed(2);
}

export const defaultColumnDefinitions = {
    sortable: true,
    filter: true,
};

export function getIntegerArrayOfLength(n: number) {
    return Array(n).map((_, i) => i);
}

export async function delay(ms: number) {
    await new Promise((_) => setTimeout(_, ms));
}

// TODO: Only works for "Daily" granularity, extend to support other granularities as well
// TODO: Rename to something more descriptive
export function getDates(minDate: any, maxDate: any) {
    const dates = [];

    let date = minDate;
    while (date <= maxDate) {
        dates.push(date);
        date = DateTime.fromISO(date).plus({days: 1}).toISODate();
    }

    return dates;
}

export function getSingletonValue<T>(arr: Array<T>): T {
    if (arr.length == 0) {
        throw Error(`Zero values received, when one and only one was expected: ${JSON.stringify(arr)}`);
    }

    if (arr.length > 1) {
        throw Error(`More than one value received, when one and only one was expected: ${JSON.stringify(arr)}`);
    }

    return arr[0];
}

export function getSingletonValueOrNull<T>(arr: Array<T>): T | null {
    if (arr.length == 0) {
        return null;
    }

    if (arr.length > 1) {
        throw Error(`More than one value received, when one and only one was expected: ${JSON.stringify(arr)}`);
    }

    return arr[0];
}

export const adsColorPalette = {
    performenceAds: "#ffa500",
    facebookAds: "#00a2ed",
    performanceCount: "rgba(255, 165, 0, 0.4)",
    facebookCount: "rgba(0, 162, 237, 0.4)",
    performanceCpl: "#1B671B",
    facebookCpl: "#008000",
    performanceSpl: "#FFFF00",
    facebookSpl: "#FFCC00",
    performanceAcos: "#FF0000",
    facebookAcos: "#B30000",
    netSales:"#FFFF00"


};

export const campaignsColorPalette = {
    impressions : "#1F40CB",
    clicks : "#3B82F6",
    amountSpent : "#6D28D9",
    leads : "#22C55E",
    orders : "#65A30D",

};

export const colorPalette = {
    Mattress: "rgb(255,182,193)",
    "Non Mattress": "rgb(255,139,34)",
    Appliances: "rgb(200,10,0)",
    "Water Purifier": "rgb(255,251,55)",
};

export const fillColors = [
    "rgb(255,0,222)",
    "rgb(95,158,160)",
    "rgb(100,149,237)",
    "rgb(0,191,255)",
    "rgb(30,144,255)",
    "rgb(173,216,230)",
    "rgb(138,43,226)",
    "rgb(218,112,214)",
    "rgb(199,21,133)",
    "rgb(219,112,147)",
    "rgb(255,105,180)",
    "rgb(244,164,96)",
    "rgb(176,196,222)",
    "rgb(176,196,222)",
    "rgb(25, 0, 222)",
    "rgb(255, 250, 22)",
    "rgb(25, 250, 22)",
    "rgb(25, 20, 222)",
    "rgb(255, 20, 212)",
    "rgb(255, 240, 22)",
    "rgb(198, 250, 222)",
];

export function getColor(key: string) {
    if (colorPalette[key!]) {
        return colorPalette[key];
    } else {
        colorPalette[key] = fillColors[Math.floor(Math.random() * 100) % 20];
        return colorPalette[key];
    }
}

export function transposeData(data : Array<any>){
    return data[0].map((_, colIndex) => data.map((row) => row[colIndex]));
}

const cloudflareImagesAccountHash = "QSJTsX8HH4EtEhHrJthznA";
