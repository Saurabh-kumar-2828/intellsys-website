

export function joinValues(values: Array<string>, separator: string, surroundWith: string = ""): string {
    return values
        .filter((value) => value != null)
        .map((value) => `${surroundWith}${value}${surroundWith}`)
        .join(separator);
}

// export function buildQuery(...values, separator) {
//     return values.filter(value => value != null).join(`${separator} `);
// }

export function getGranularityQuery(selectedGranularity: string, columnName: string): string {
    return selectedGranularity == "Daily"
        ? `DATE_TRUNC('DAY', ${columnName})`
        : selectedGranularity == "Weekly"
        ? `DATE_TRUNC('WEEK', ${columnName})`
        : selectedGranularity == "Monthly"
        ? `DATE_TRUNC('MONTH', ${columnName})`
        : `DATE_TRUNC('YEAR', ${columnName})`;
}

export function createGroupByReducer(attribute) {
    return (result, item) => {
        let itemsForAttribute = result[item[attribute]] || [];
        itemsForAttribute.push(item);
        result[item[attribute]] = itemsForAttribute;
        return result;
    };
}

// TODO: Rename to something sensible
export function doesFreshsalesLeadsToSourceWithInformationSourceCorrespondToPerformanceLead(source: string) {
    return source != "Facebook Ads";
}

// TODO: Rename to something sensible
export function doesShopifySalesToSourceWithInformationSourceCorrespondToPerformanceLead(source: string) {
    return source != "GJ_LeadGen_18May" && source != "GJ_LeadGen_Mattress_10 May" && source.match("^Freshsales - .+ - Facebook Ads$");
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
