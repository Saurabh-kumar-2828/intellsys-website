import {ColumnInfo} from "~/backend/data-management";
import {execute} from "../databaseManager.server";
import {pushIntoDatabase} from "./facebookOnFormAds.server";

const facebookApiBaseUrl = "https://graph.facebook.com/";

// function filterFbResponseOnDate(dataFromFacebookApi: Array<facebookOnFormAdObject>, startDate: string, endDate: string) {
//     const data = dataFromFacebookApi.filter((campaign) => campaign.created_time >= startDate && campaign.created_time <= endDate);

//     const dates = data.map((campaign) => campaign.created_time);
//     const minDate = dates.reduce((minDate, date) => (minDate == "" || date < minDate ? date : minDate), "");
//     const maxDate = dates.reduce((maxDate, date) => (maxDate == "" || date > maxDate ? date : maxDate), "");

//     return {
//         filterData: data.reverse(),
//         minDate: minDate,
//         maxDate: maxDate,
//     };
// }

// async function getFacebookOnFormLeads(limit: number, endCursor: string) {
//     const fields = "id,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,custom_disclaimer_responses,field_data,created_time,form_id,is_organic,platform";

//     let url = `${facebookApiBaseUrl}${process.env.FACEBOOK_API_VERSION!}/${process.env.FACEBOOK_FORM_ID!}/leads?fields=${fields}&access_token=${process.env
//         .FACEBOOK_ONFORMS_ACCESS_TOKEN!}&sort=created_time_descending&limit=${limit}&after=${endCursor}`;

//     const response = await fetch(url, {
//         method: "GET",
//     });

//     const insightsFromFacebookApi = await response.json();
//     return insightsFromFacebookApi;
// }

// async function databaseInitialized() {
//     try {
//         const query = `SELECT COUNT(*) FROM facebook_onform_lectrix`;
//         const result = await execute(query);

//         if (result.rows.count > 0) {
//             return true;
//         } else {
//             return false;
//         }
//     } catch (e) {}
// }

// export async function initializeDataFromFacebookOnFormsApi(startDate: string, endDate: string): Promise<Array<facebookOnFormAdObject>> {
//     const allLeads: Array<facebookOnFormAdObject> = [];
//     try {
//         // Check if database is intialized
//         if (await databaseInitialized()) {
//             throw new Error("Database has been already initialized");
//         }

//         let onFormLeads = await getFacebookOnFormLeads(5, "");
//         let filteredResponse = filterFbResponseOnDate(onFormLeads.data, startDate, endDate);

//         if (filteredResponse.filterData.length <= 0) {
//             return allLeads;
//         }
//         allLeads.push(...filteredResponse.filterData!);
//         while ("next" in onFormLeads.paging) {
//             onFormLeads = await getFacebookOnFormLeads(5, onFormLeads.paging.cursors.after);
//             filteredResponse = filterFbResponseOnDate(onFormLeads.data, startDate, endDate);
//             allLeads.push(...filteredResponse.filterData!);

//             if (filteredResponse.filterData.length < onFormLeads.length || filteredResponse.filterData.length <= 0) {
//                 break;
//             }
//         }

//         if (allLeads.length > 0) {
//             await pushIntoDatabase(allLeads);
//         }
//         // console.log(JSON.stringify(allLeads));
//         // console.log(allLeads.length);
//     } catch (e) {
//         console.log(e);
//         throw e;
//     }
//     return allLeads;
// }
