import {ColumnInfo} from "~/backend/data-management";
const facebookApiBaseUrl = "https://graph.facebook.com/";

function filterFbResponseOnDate(dataFromFacebookApi: any, date: string) {

    const data = dataFromFacebookApi.filter((campaign) => campaign.created_time >= date);

    const dates = dataFromFacebookApi.map((campaign) => campaign.created_time);
    const minDate = dates.reduce((minDate, date) => (minDate == null || date < minDate ? date : minDate), null);
    const maxDate = dates.reduce((maxDate, date) => (maxDate == null || date > maxDate ? date : maxDate), null);

    return {
        filterData: data.reverse(),
        minDate: minDate,
        maxDate: maxDate,
    };
}

async function getFacebookOnFormLeads(limit: number, endCursor: string) {
    const fields = "id,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,custom_disclaimer_responses,field_data,created_time,form_id,is_organic,platform";

    let url = `${facebookApiBaseUrl}${process.env.FACEBOOK_API_VERSION!}/${process.env.FACEBOOK_FORM_ID!}/leads?fields=${fields}&access_token=${process.env
        .FACEBOOK_ACCESS_TOKEN!}&sort=created_time_descending&limit=${limit}&after=${endCursor}`;
    const response = await fetch(url, {
        method: "GET",
    });

    const insightsFromFacebookApi = await response.json();
    return insightsFromFacebookApi;
}

export async function ingestDataFromFacebookOnFormsApi(date: string): Promise<Array<object>> {
    const allLeads: Array<object> = [];

    try {
        let onFormLeads = await getFacebookOnFormLeads(5, "");
        let filteredResponse = filterFbResponseOnDate(onFormLeads.data, date);

        allLeads.push(...filteredResponse.filterData!);
        while ("next" in onFormLeads.paging) {
            onFormLeads = await getFacebookOnFormLeads(5, onFormLeads.paging.cursors.after);
            filteredResponse = filterFbResponseOnDate(onFormLeads.data, date);
            allLeads.push(...filteredResponse.filterData!);

            if (filteredResponse.filterData.length < onFormLeads.length) {
                break;
            }
        }

        console.log(JSON.stringify(allLeads));
        console.log(allLeads.length);
    } catch (e) {
        console.log(e);
        throw e;
    }
    return allLeads;
}

// export const facebookAdsRawColumnInfos: Array<ColumnInfo> = [
//     {tableColumn: "campaign_name", csvColumn: "Campaign name"},
//     {tableColumn: "ad_set_name", csvColumn: "Ad set name"},
//     {tableColumn: "ad_name", csvColumn: "Ad name"},
//     {tableColumn: "day", csvColumn: "Day"},
//     {tableColumn: "impressions", csvColumn: "Impressions"},
//     {tableColumn: "currency", csvColumn: "Currency"},
//     {tableColumn: "amount_spent", csvColumn: "Amount spent (INR)"},
//     {tableColumn: "leads", csvColumn: "Leads"},
//     {tableColumn: "link_clicks", csvColumn: "Link clicks"},
//     {tableColumn: "ctr", csvColumn: "CTR (link click-through rate)"},
//     {tableColumn: "cpc", csvColumn: "CPC (cost per link click)"},
//     {tableColumn: "cpi", csvColumn: "CPI"},
// ];
