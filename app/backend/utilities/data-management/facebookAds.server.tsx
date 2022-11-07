import {ColumnInfo} from "~/backend/data-management";

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
