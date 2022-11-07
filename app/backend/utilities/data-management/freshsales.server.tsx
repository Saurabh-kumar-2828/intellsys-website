import {ColumnInfo} from "~/backend/data-management";
import {distinct} from "~/utilities/utilities";

const freshsalesApiBaseUrl = "https://livpuresmart.freshsales.io";

async function getLeadInformation(leadId: number) {
    const url = `${freshsalesApiBaseUrl}/api/leads/${leadId}?include=owner,creater,updater,source,lead_stage,lead_reason,territory,campaign,tasks,appointments,notes`;
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

async function getLeadsInformation(leadIds: Array<number>) {
    let allSingleLeadsInformation = [];

    try {
        for (const leadId of leadIds) {
            const leadInformation = await getLeadInformation(leadId);
            allSingleLeadsInformation.push(leadInformation);
        }
    } catch (e) {
        console.log(e);
    }

    return allSingleLeadsInformation;
}

async function getLeadsOfCurrentPage(sortBy: string, sortType: string, pageNumber: Number) {
    try {
        const allLeadsViewId = "15000010043";
        const urlToFetchLeads = `${freshsalesApiBaseUrl}/api/leads/view/${allLeadsViewId}?sort=${sortBy}&sort_type=${sortType}&page=${pageNumber}`;
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

// function filterLeadsOnDate(leadsOfCurrentPage: any, minDateThreshold: string) {
//     // TODO: Ensure lead.updated_at does not contain non-zero timezone offset
//     // TODO: Make sure the inclusive/exclusive bounds make sense here

//     const filterLeadIds = leadsOfCurrentPage.leads.filter((lead) => lead.updated_at > minDateThreshold).map((lead) => lead.id);

//     const dates = leadsOfCurrentPage.leads.map((lead) => lead.updated_at);
//     const minDate = dates.reduce((minDate, date) => (minDate == null || date < minDate ? date : minDate), null);
//     const maxDate = dates.reduce((maxDate, date) => (maxDate == null || date > maxDate ? date : maxDate), null);

//     return {
//         idsFilterByDate: filterLeadIds.reverse(),
//         minDate: minDate,
//         maxDate: maxDate,
//     };
// }

function filterLeadsOnDate(leadsOfCurrentPage: any, minDateThreshold: string, maxDateThreshold: string) {
    // TODO: Ensure lead.updated_at does not contain non-zero timezone offset
    // TODO: Make sure the inclusive/exclusive bounds make sense here

    const filterLeadIds = leadsOfCurrentPage.leads.filter((lead) => lead.updated_at > minDateThreshold && lead.updated_at < maxDateThreshold).map((lead) => lead.id);

    const dates = leadsOfCurrentPage.leads.map((lead) => lead.updated_at);
    const minDate = dates.reduce((minDate, date) => (minDate == null || date < minDate ? date : minDate), null);
    const maxDate = dates.reduce((maxDate, date) => (maxDate == null || date > maxDate ? date : maxDate), null);

    return {
        idsFilterByDate: filterLeadIds.reverse(),
        minDate: minDate,
        maxDate: maxDate,
    };
}

// Returns all leads after the given cutoff date, in reverse-chronological order
// For any lead that is updated more than once in the given time frame, only the last update is considered
async function getAllLeadIds(date: string): Promise<Array<number>> {
    const allLeadIds = [];

    try {
        for (let pageNo = 1; true; pageNo++) {
            const leadsOfCurrentPage = await getLeadsOfCurrentPage("updated_at", "desc", pageNo);

            const leads = filterLeadsOnDate(leadsOfCurrentPage, date, "9999-12-31T23:59:59Z");

            // console.log("count: %d", leads.idsFilterByDate.length);
            // console.log("max date: ", leads.maxDate);
            // console.log("min date: ", leads.minDate);
            // console.log(".........................");

            allLeadIds.push(...leads.idsFilterByDate!);
            if (leads.minDate < date) {
                break;
            }

            // TODO: Added for debugging, remove!
            break;

            // console.log(distinct(allLeadIds).length);
        }
    } catch (e) {
        console.log(e);
        throw e;
    }

    return distinct(allLeadIds);
}

// Returns all leads after the given cutoff date, in reverse-chronological order
// For any lead that is updated more than once in the given time frame, only the last update is considered
async function getAllLeadIdsForHistoricalData(date: string): Promise<Array<number>> {
    const allLeadIds = [];

    try {
        for (let pageNo = 1; true; pageNo++) {
            const leadsOfCurrentPage = await getLeadsOfCurrentPage("created_at", "desc", pageNo);

            const leads = filterLeadsOnDate(leadsOfCurrentPage, date);

            // console.log("count: %d", leads.idsFilterByDate.length);
            // console.log("max date: ", leads.maxDate);
            // console.log("min date: ", leads.minDate);
            // console.log(".........................");

            allLeadIds.push(...leads.idsFilterByDate!);
            if (leads.minDate < date) {
                break;
            }

            // TODO: Added for debugging, remove!
            break;

            // console.log(distinct(allLeadIds).length);
        }
    } catch (e) {
        console.log(e);
        throw e;
    }

    return distinct(allLeadIds);
}

export async function ingestDataFromFreshsalesApi(date: string) {
    // Get all lead IDs
    let leadIds = await getAllLeadIds(date);

    // Get lead information
    const leadsInformation = await getLeadsInformation(leadIds);

    console.log(JSON.stringify(leadsInformation));
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
