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

async function getFacebookData(limit: number, endCursor: string | null) {
    const fields =
        "account_currency,updated_time,account_id,account_name,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,clicks,conversions,cpc,cpm,cpp,ctr,date_start,date_stop,impressions,spend,social_spend";
        // "account_currency,actions,action_values,attribution_setting,canvas_avg_view_percent,canvas_avg_view_time"
    const level = "campaign";
    let url = `${facebookApiBaseUrl}${process.env.FACEBOOK_API_VERSION!}/act_${process.env.FACEBOOK_ACCOUNT_ID!}/insights?fields=${fields}&level=${level}&access_token=${process.env
        .FACEBOOK_ACCESS_TOKEN!}&sort=updated_time_descending&limit=${limit}&after=${endCursor}`;
    const response = await fetch(url, {
        method: "GET",
    });

    const insightsFromFacebookApi = await response.json();
    return insightsFromFacebookApi;
}

export async function ingestDataFromFacebookApi(date: string):Promise<Array<object>> {
    const allCampaigns: Array<object> = [];

    try {
        let campaignInfo = await getFacebookData(5, null);
        console.log(campaignInfo);
        // let filteredResponse = filterFbResponseOnDate(campaignInfo.data, date);

        // allCampaigns.push(...filteredResponse.filterData!);
        // while ("next" in campaignInfo.paging) {
        //     campaignInfo = await getFacebookData(5, campaignInfo.paging.cursors.after);
        //     filteredResponse = filterFbResponseOnDate(campaignInfo.data, date);
        //     allCampaigns.push(...filteredResponse.filterData!);

        //     if (filteredResponse.filterData.length < campaignInfo.length) {
        //         break;
        //     }
        // }

    } catch (e) {
        console.log(e);
        throw e;
    }
    return allCampaigns;
}

export const facebookAdsRawColumnInfos: Array<ColumnInfo> = [
    {tableColumn: "campaign_name", csvColumn: "Campaign name"},
    {tableColumn: "ad_set_name", csvColumn: "Ad set name"},
    {tableColumn: "ad_name", csvColumn: "Ad name"},
    {tableColumn: "day", csvColumn: "Day"},
    {tableColumn: "impressions", csvColumn: "Impressions"},
    {tableColumn: "currency", csvColumn: "Currency"},
    {tableColumn: "amount_spent", csvColumn: "Amount spent (INR)"},
    {tableColumn: "leads", csvColumn: "Leads"},
    {tableColumn: "link_clicks", csvColumn: "Link clicks"},
    {tableColumn: "ctr", csvColumn: "CTR (link click-through rate)"},
    {tableColumn: "cpc", csvColumn: "CPC (cost per link click)"},
    {tableColumn: "cpi", csvColumn: "CPI"},
];
