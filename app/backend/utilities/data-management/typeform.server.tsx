// import {DateTime} from "luxon";
// import {insertIntoTable, processTruncate, Table} from "~/backend/data-management";
// import {GoogleSpreadsheet, GoogleSpreadsheetRow} from "google-spreadsheet";
// import {getNonEmptyStringOrNull} from "~/utilities/utilities";
// import {getDataFromGoogleSheet} from "~/backend/utilities/data-management/googleSheets.server";
// import {get_typeformResponsesWaterPurifierDataInformation} from "~/backend/data-source-information";

// function getTypeformRowsFilteredByTime(rows: any, filterTimestamp: Date) {
//     const timestampColumnIndex = typeformRawColumnInfos.filter(columnInfo => columnInfo.tableColumn == "submitted_at")[0].sheetColumnIndex;

//     const filteredRows = [];

//     for (const row of rows) {
//         const timestampStr = row._rawData[timestampColumnIndex];

//         if (timestampStr == "") {
//             continue;
//         }

//         const timestamp = DateTime.fromFormat(timestampStr, "dd/MM/yyyy HH:mm:ss", {zone: "utc"}).toJSDate();

//         if (timestamp > filterTimestamp) {
//             filteredRows.push(row);
//         }
//     }

//     return filteredRows;
// }

// function convertSpreadsheetRowToIngestionReadyArray(spreadsheetRows: Array<GoogleSpreadsheetRow>) {
//     // TODO: Reuse an existing function for this
//     const rows: Array<any> = spreadsheetRows.map((spreadsheetRow) => typeformRawColumnInfos.map((columnInfo) => getNonEmptyStringOrNull(spreadsheetRow._rawData[columnInfo.sheetColumnIndex])));
//     return rows;
// }

// export async function ingestDataFromTypeformMattressApi(date: string) {
//     const rows = await getDataFromGoogleSheet(process.env.TYPEFORM_MATTRESS_SPREADSHEET_ID!, process.env.TYPEFORM_MATTRESS_SHEET_TITLE!, date);

//     // TODO: Do this instead of passing through all rows
//     // const filteredRows = getTypeformRowsFilteredByTime(rows, (await get_typeformResponsesWaterPurifierDataInformation()).maxDate);

//     // TODO: Don't do this
//     const filteredRows = rows;

//     const sqlRows = convertSpreadsheetRowToIngestionReadyArray(filteredRows);

//     // TODO: Don't do this
//     await processTruncate(Table.typeformResponsesMattressRaw);

//     await insertIntoTable(
//         "typeform_responses_mattress_raw",
//         typeformRawColumnInfos.map((columnInfo) => columnInfo.tableColumn),
//         sqlRows,
//     );

// }

// export async function ingestDataFromTypeformWaterPurifierApi(date: string) {
//     const rows = await getDataFromGoogleSheet(process.env.TYPEFORM_WATER_PURIFIER_SPREADSHEET_ID!, process.env.TYPEFORM_WATER_PURIFIER_SHEET_TITLE!, date);

//     // TODO: Do this instead of passing through all rows
//     // const filteredRows = getTypeformRowsFilteredByTime(rows, (await get_typeformResponsesWaterPurifierDataInformation()).maxDate);

//     // TODO: Don't do this
//     const filteredRows = rows;

//     const sqlRows = convertSpreadsheetRowToIngestionReadyArray(filteredRows);

//     // TODO: Don't do this
//     await processTruncate(Table.typeformResponsesWaterPurifierRaw);

//     await insertIntoTable(
//         "typeform_responses_water_purifier_raw",
//         typeformRawColumnInfos.map((columnInfo) => columnInfo.tableColumn),
//         sqlRows,
//     );
// }

// const typeformRawColumnInfos = [
//     {tableColumn: "name", sheetColumnIndex: 0},
//     {tableColumn: "mobile_number", sheetColumnIndex: 1},
//     {tableColumn: "email_id", sheetColumnIndex: 3},
//     {tableColumn: "what_are_you_looking_for", sheetColumnIndex: 2},
//     {tableColumn: "would_you_like_to_explore_more_products", sheetColumnIndex: 4},
//     {tableColumn: "utm_term", sheetColumnIndex: 5},
//     {tableColumn: "utm_campaign", sheetColumnIndex: 6},
//     {tableColumn: "utm_content", sheetColumnIndex: 7},
//     {tableColumn: "utm_medium", sheetColumnIndex: 8},
//     {tableColumn: "utm_source", sheetColumnIndex: 9},
//     {tableColumn: "submitted_at", sheetColumnIndex: 10},
// ];
