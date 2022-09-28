export function joinValues(values: Array<string>, separator: string, surroundWith: string = ""): string {
    return values.filter(value => value != null).map(value => `${surroundWith}${value}${surroundWith}`).join(separator);
}

// export function buildQuery(...values, separator) {
//     return values.filter(value => value != null).join(`${separator} `);
// }

export function getGranularityQuery(selectedGranularity: string, columnName: string): string {
    return selectedGranularity == "Daily" ? `DATE_TRUNC('DAY', ${columnName})` : selectedGranularity == "Weekly" ? `DATE_TRUNC('WEEK', ${columnName})` : selectedGranularity == "Monthly" ? `DATE_TRUNC('MONTH', ${columnName})` : `DATE_TRUNC('YEAR', ${columnName})`;
}

