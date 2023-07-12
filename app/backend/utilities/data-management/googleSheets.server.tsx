// import {GoogleSpreadsheet} from "google-spreadsheet";

// // async function getRowsFilteredByTime(rows: any, filterTimestamp: Date) {
// //     return rows.filter(row => {
// //         const timestampStr = row["Submitted At"];

// //         if (timestampStr == "") {
// //             return false;
// //         }

// //         const timestamp = DateTime.fromFormat(timestampStr, "DD/MM/YYYY HH:MM:SS").toJSDate();

// //         if (timestamp <= filterTimestamp) {
// //             return false;
// //         }

// //         return true;
// //     });
// // }

// export async function getDataFromGoogleSheet(sheetId: string, sheetTitle: string, timestamp: string) {
//     const document = new GoogleSpreadsheet(sheetId);

//     await document.useServiceAccountAuth({
//         client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
//         private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!,
//     });

//     await document.loadInfo();

//     const sheet = document.sheetsByTitle[sheetTitle];

//     // Get all non-empty rows
//     const spreadsheetRows = (await sheet.getRows()).filter((spreadsheetRow) => spreadsheetRow._rawData.some((cellValue) => cellValue != null && cellValue != ""));

//     return spreadsheetRows;
// }

// //     const filteredSpreadsheetRows = await getTypeformRowsFilteredByTime(spreadsheetRows, new Date(timestamp));

// // return filteredSpreadsheetRows.map((spreadsheetRow) => typeformRawColumnInfos.map((columnInfo) => getNonEmptyStringOrNull(spreadsheetRow._rawData[columnInfo.sheetColumnIndex])));
