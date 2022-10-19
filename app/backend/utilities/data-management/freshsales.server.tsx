import {ColumnInfo} from "~/backend/data-management";
import {distinct} from "~/utilities/utilities";

const freshSalesApiBaseUrl = "https://livpuresmart.freshsales.io/api/leads/";

async function getLeadInformation(leadId: number) {
    const url = freshSalesApiBaseUrl + leadId + "?include=owner&include=source&include=lead_stage";
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: process.env.FRESHSALES_API_TOKEN!,
        },
    });
    const leadInformation = await response.json();
    return leadInformation;
}

async function getSingleLeadsInformation(leadIds: Array<number>) {
    try {
        let allSingleLeadsInformation = await Promise.all(
            leadIds.map(async (leadId) => {
                const leadInformation = await getLeadInformation(leadId);
                return leadInformation;
            })
        );
        return allSingleLeadsInformation;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function getLeadsOfCurrentPage(pageNumber: Number) {
    try {
        const urlToFetchLeads = freshSalesApiBaseUrl + "view/15000010043" + "?page=" + pageNumber + "&sort=updated_at&sort_type=desc";
        const response = await fetch(urlToFetchLeads, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: process.env.FRESHSALES_API_TOKEN!,
            },
        });
        const leadsData = await response.json();
        return leadsData;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

function filterLeadsOnDate(leadsOfCurrentPage: any, date: string) {
    const filterLeadIds = leadsOfCurrentPage.leads.filter(lead => lead.updated_at >= date).map(lead => lead.id);

    const dates = leadsOfCurrentPage.leads.map(lead => lead.updated_at);
    const minDate = dates.reduce((minDate, date) => minDate == null || date < minDate ? date : minDate, null);
    const maxDate = dates.reduce((maxDate, date) => maxDate == null || date > maxDate ? date : maxDate, null);

    return {
        idsFilterByDate: filterLeadIds,
        minDate: minDate,
        maxDate: maxDate,
    };
}

async function getAllLeadIds(date: string): Promise<Array<number>> {
    const allLeadIds = [];

    try {
        for (let pageNo = 1; true; pageNo++) {
            const leadsOfCurrentPage = await getLeadsOfCurrentPage(pageNo);

            const leads = filterLeadsOnDate(leadsOfCurrentPage, date);

            console.log("count: %d", leads.idsFilterByDate.length);
            console.log("max date: ", leads.maxDate);
            console.log("min date: ", leads.minDate);
            console.log(".........................");

            allLeadIds.push(...leads.idsFilterByDate!);
            if (leads.minDate < date) {
                break;
            }

            console.log(distinct(allLeadIds).length);
        }
    } catch (e) {
        console.log(e);
        throw e;
    }

    return allLeadIds;
}

export async function ingestDataFromFreshsalesApi(date: string) {
    // Get all lead IDs
    const leadIds = await getAllLeadIds(date);

    // TODO: Convert to unique

    // Get lead information
    // const leadsInformation = await getSingleLeadsInformation(leadIds);

    // console.log(JSON.stringify(leadsInformation));
}

export const freshsalesColumnInfos: Array<ColumnInfo> = [
    {tableColumn: "lead_id", csvColumn: "Lead : id"},
    {tableColumn: "lead_first_name", csvColumn: "Lead : First name"},
    {tableColumn: "lead_last_name", csvColumn: "Lead : Last name"},
    {tableColumn: "lead_emails", csvColumn: "Lead : Emails"},
    {tableColumn: "lead_job_title", csvColumn: "Lead : Job title"},
    {tableColumn: "lead_sales_owner", csvColumn: "Lead : Sales owner"},
    {tableColumn: "lead_sales_owner_email", csvColumn: "Lead : Sales owner email"},
    {tableColumn: "lead_created_at", csvColumn: "Lead : Created at"},
    {tableColumn: "lead_lead_stage", csvColumn: "Lead : Lead stage"},
    {tableColumn: "lead_last_contacted_time", csvColumn: "Lead : Last contacted time"},
    {tableColumn: "lead_converted_leads", csvColumn: "Lead : Converted Leads"},
    {tableColumn: "lead_source", csvColumn: "Lead : Source"},
    {tableColumn: "lead_phone_number", csvColumn: "Lead : Phone_Number"},
    {tableColumn: "lead_updated_at", csvColumn: "Lead : Updated at"},
];
