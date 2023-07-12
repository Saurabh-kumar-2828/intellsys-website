import {DateTime} from "luxon";
import type {Iso8601Date} from "~/utilities/typeDefinitions";

// export function getUrlForResource(resourceRelativePath) {
//     return `${process.env.NEXT_PUBLIC_FRONTEND_URL}/resources/${resourceRelativePath}`;
// }

/**
 * @deprecated
 */
export function getUrlForCdnResource(imageId, imageVariant) {
    // if (imageId == null || imageVariant == null) {
    //     throw new Exception("Incorrect usage of getUrlForCdnResource!");
    // }

    return `https://imagedelivery.net/${cloudflareImagesAccountHash}/${imageId}/${imageVariant}`;
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

export const defaultColumnDefinitions = {
    sortable: true,
    filter: true,
    resizable: true,
};

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

export function joinValues(values: Array<string>, separator: string, surroundWith: string = ""): string {
    return values
        .filter((value) => value != null)
        .map((value) => `${surroundWith}${value}${surroundWith}`)
        .join(separator);
}

export function createGroupByReducer(attribute: string) {
    return (result, item) => {
        let itemsForAttribute = result[item[attribute]] || [];
        itemsForAttribute.push(item);
        result[item[attribute]] = itemsForAttribute;
        return result;
    };
}

// TODO: Rename to something sensible
export function doesLeadCaptureSourceCorrespondToPerformanceLead(leadCaptureSource: string) {
    return leadCaptureSource != "Facebook Ads";
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

export enum Scale {
    normalizedScale = "0-1",
    dataDriven = "dataDriven",
    percentageScale = "1-100",
}

export enum YAxisDisplay {
    leftSide = "leftSide",
    rightSide = "rightSide",
    noDisplay = "noDisplay"
}

export const plotMargins = {
    top:90,
    right: 60,
    bottom: 90,
    left: 60,
};

const cloudflareImagesAccountHash = "QSJTsX8HH4EtEhHrJthznA";

// TODO: Find a better name for this
export function getTagFromEmail(email: string): string {
    if (email.indexOf("@") == -1 || email.indexOf("@") != email.lastIndexOf("@")) {
        throw new Error(`Invalid email: ${email}`);
    }

    return email.split("@")[0];
}

export function getDomainFromEmail(email: string): string {
    if (email.indexOf("@") == -1 || email.indexOf("@") != email.lastIndexOf("@")) {
        throw new Error(`Invalid email: ${email}`);
    }

    return email.split("@")[1];
}
