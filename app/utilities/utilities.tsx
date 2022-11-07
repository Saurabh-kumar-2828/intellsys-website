import {DateTime} from "luxon";

// export function getUrlForResource(resourceRelativePath) {
//     return `${process.env.NEXT_PUBLIC_FRONTEND_URL}/resources/${resourceRelativePath}`;
// }

export function getUrlForCdnResource(imageId, imageVariant) {
    // if (imageId == null || imageVariant == null) {
    //     throw new Exception("Incorrect usage of getUrlForCdnResource!");
    // }

    return `https://imagedelivery.net/${cloudflareImagesAccountHash}/${imageId}/${imageVariant}`;
}

export function getNonEmptyStringOrNull(str) {
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

export function concatenateNonNullStringsWithSpaces(...strs: Array<string | null>): string {
    // TODO: Do this properly
    return strs.join(" ");
}

export function concatenateNonNullStringsWithAmpersand(...strs: Array<string | null>): string {
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
};

export function dateToMediumNoneEnFormat(date: string) {
    if (date == null) {
        return null;
    }

    return new Intl.DateTimeFormat("en", {timeZone: "Asia/Kolkata", dateStyle: "medium"}).format(new Date(date));
}

export function dateToMediumMediumEnFormat(date: string) {
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

    if (!shorten || n < 10**3) {
        if (isFloat) {
            return n.toFixed(2);
        } else {
            return n;
        }
    } else if (n < 10**5) {
        return `${(n / 10**3).toFixed(2)}K`;
    } else if (n < 10**7) {
        return `${(n / 10**5).toFixed(2)}L`;
    } else {
        return `${(n / 10**7).toFixed(2)}Cr`;
    }
}

export function getIntegerArrayOfLength(n: number) {
    return Array(n).fill(null).map((_, i) => i);
}

export async function delay(ms: number) {
    await new Promise(_ => setTimeout(_, ms));
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

const cloudflareImagesAccountHash = "QSJTsX8HH4EtEhHrJthznA";
