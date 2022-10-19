import {DateTime} from "luxon";
import {insertIntoTable} from "~/backend/data-management";

async function getTypeformRowsFilteredByTime(rows: any, filterTimestamp: Date) {
    const timestampColumnIndex = typeformRawColumnInfos.filter(columnInfo => columnInfo.tableColumn == "submitted_at")[0].sheetColumnIndex;

    const filteredRows = [];

    for (const row of rows) {
        const timestampStr = row._rawData[timestampColumnIndex];

        if (timestampStr == "") {
            continue;
        }

        const timestamp = DateTime.fromFormat(timestampStr, "dd/MM/yyyy HH:mm:ss", {zone: "utc"}).toJSDate();

        if (timestamp > filterTimestamp) {
            filteredRows.push(row);
        }
    }

    return filteredRows;
}

export async function ingestDataFromTypeformWaterPurifierApi(date: string) {
    const rows = await dataFromGoogleSheet(process.env.TYPEFORM_WATER_PURIFIER_SPREADSHEET_ID!, process.env.TYPEFORM_WATER_PURIFIER_SHEET_TITLE!, date);

    await insertIntoTable(
        "typeform_responses_water_purifier_raw",
        typeformRawColumnInfos.map((columnInfo) => columnInfo.tableColumn),
        rows
    );
}

export async function ingestDataFromTypeformMattressApi(date: string) {
    const rows = await dataFromGoogleSheet(process.env.TYPEFORM_MATTRESS_SPREADSHEET_ID!, process.env.TYPEFORM_MATTRESS_SHEET_TITLE!, date);

    await insertIntoTable(
        "typeform_responses_water_purifier_raw",
        typeformRawColumnInfos.map((columnInfo) => columnInfo.tableColumn),
        rows
    );
}

const typeformRawColumnInfos = [
    {tableColumn: "name", sheetColumnIndex: 0},
    {tableColumn: "mobile_number", sheetColumnIndex: 1},
    {tableColumn: "email_id", sheetColumnIndex: 3},
    {tableColumn: "what_are_you_looking_for", sheetColumnIndex: 2},
    {tableColumn: "would_you_like_to_explore_more_products", sheetColumnIndex: 4},
    {tableColumn: "utm_term", sheetColumnIndex: 5},
    {tableColumn: "utm_campaign", sheetColumnIndex: 6},
    {tableColumn: "utm_content", sheetColumnIndex: 7},
    {tableColumn: "utm_medium", sheetColumnIndex: 8},
    {tableColumn: "utm_source", sheetColumnIndex: 9},
    {tableColumn: "submitted_at", sheetColumnIndex: 10},
];
