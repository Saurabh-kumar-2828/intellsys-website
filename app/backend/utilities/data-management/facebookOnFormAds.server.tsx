import {ColumnInfo} from "~/backend/data-management";
const facebookApiBaseUrl = "https://graph.facebook.com/";

function filterFbResponseOnDate(dataFromFacebookApi: any, date: string) {
    const data = dataFromFacebookApi.filter((campaign) => campaign.updated_time >= date);

    const dates = dataFromFacebookApi.map((campaign) => campaign.updated_time);
    const minDate = dates.reduce((minDate, date) => (minDate == null || date < minDate ? date : minDate), null);
    const maxDate = dates.reduce((maxDate, date) => (maxDate == null || date > maxDate ? date : maxDate), null);

    return {
        filterData: data.reverse(),
        minDate: minDate,
        maxDate: maxDate,
    };
}

async function getFacebookOnFormLeads(limit: number, endCursor: string | null) {
    const fields = "created_time,id,ad_id,form_id,field_data,campaign_name,adset_name,platform,ad_name";

    let url = `${facebookApiBaseUrl}${process.env.FACEBOOK_API_VERSION!}/${process.env.FACEBOOK_FORM_ID!}/insights?fields=${fields}&access_token=${process.env
        .FACEBOOK_ACCESS_TOKEN!}&sort=created_time_descending&limit=${limit}&after=${endCursor}`;
    const response = await fetch(url, {
        method: "GET",
    });

    const insightsFromFacebookApi = await response.json();
    return insightsFromFacebookApi;
}

export async function ingestDataFromFacebookOnFormsApi(date: string): Promise<Array<object>> {
    const allCampaigns: Array<object> = [];

    try {
        let onFormLeads = await getFacebookOnFormLeads(5, null);
        let filteredResponse = filterFbResponseOnDate(onFormLeads.data, date);

        allCampaigns.push(...filteredResponse.filterData!);
        while ("next" in onFormLeads.paging) {
            onFormLeads = await getFacebookOnFormLeads(5, onFormLeads.paging.cursors.after);
            filteredResponse = filterFbResponseOnDate(onFormLeads.data, date);
            allCampaigns.push(...filteredResponse.filterData!);

            if (filteredResponse.filterData.length < onFormLeads.length) {
                break;
            }
        }
        // console.log(JSON.stringify(allCampaigns));
        // console.log(allCampaigns.length);
    } catch (e) {
        console.log(e);
        throw e;
    }
    return allCampaigns;
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
