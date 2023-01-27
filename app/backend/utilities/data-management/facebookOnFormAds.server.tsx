import {ColumnInfo} from "~/backend/data-management";
import {dateToMediumEnFormat, distinct} from "~/utilities/utilities";
import {execute} from "../databaseManager.server";
const facebookApiBaseUrl = "https://graph.facebook.com/";

export type fieldDataObject = {
    name: string;
    values: Array<string>;
};

export type facebookOnFormAdObject = {
    id: string;
    ad_id: string;
    ad_name: string;
    adset_id: string;
    adset_name: string;
    campaign_id: string;
    campaign_name: string;
    field_data: Array<fieldDataObject>;
    created_time: string;
    form_id: string;
    is_organic: boolean;
    platform: string;
};

export type leadObject = {
    full_name: string | null;
    city: string | null;
    phone_number: string | null;
    state: string | null;
    email: string | null;
};

function filterFbResponseOnDate(dataFromFacebookApi: Array<facebookOnFormAdObject>, startDate: string | null, endDate: string | null) {
    const data = dataFromFacebookApi.filter((campaign) => {
        if (startDate != null && endDate != null) {
            return campaign.created_time >= startDate && campaign.created_time <= endDate;
        } else {
            return true;
        }
    });

    const dates = data.map((campaign) => campaign.created_time);
    const minDate = dates.reduce((minDate, date) => (minDate == "" || date < minDate ? date : minDate), "");
    const maxDate = dates.reduce((maxDate, date) => (maxDate == "" || date > maxDate ? date : maxDate), "");

    return {
        filterData: data.reverse(),
        minDate: minDate,
        maxDate: maxDate,
    };
}

async function getFacebookOnFormLeads(limit: number, endCursor: string, formId: string) {
    const fields = "id,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,custom_disclaimer_responses,field_data,created_time,form_id,is_organic,platform";

    let url = `${facebookApiBaseUrl}${process.env.FACEBOOK_API_VERSION!}/${formId}/leads?fields=${fields}&access_token=${process.env
        .FACEBOOK_ONFORMS_ACCESS_TOKEN!}&sort=created_time_descending&limit=${limit}&after=${endCursor}`;

    const response = await fetch(url, {
        method: "GET",
    });

    const insightsFromFacebookApi = await response.json();
    return insightsFromFacebookApi;
}

export async function ingestDataFromFacebookOnFormsApi(startDate: string | null, endDate: string | null, formId: string): Promise<Array<facebookOnFormAdObject>> {
    const allLeads: Array<facebookOnFormAdObject> = [];
    try {
        let onFormLeads = await getFacebookOnFormLeads(5, "", formId);
        let filteredResponse = filterFbResponseOnDate(onFormLeads.data, startDate, endDate);

        if (filteredResponse.filterData.length <= 0) {
            return allLeads;
        }
        allLeads.push(...filteredResponse.filterData!);
        while ("next" in onFormLeads.paging) {
            onFormLeads = await getFacebookOnFormLeads(5, onFormLeads.paging.cursors.after, formId);
            filteredResponse = filterFbResponseOnDate(onFormLeads.data, startDate, endDate);
            allLeads.push(...filteredResponse.filterData!);

            if (filteredResponse.filterData.length < onFormLeads.length || filteredResponse.filterData.length <= 0) {
                break;
            }
        }

        if (allLeads.length > 0) {
            await pushIntoDatabase(allLeads);
        }
        // console.log(JSON.stringify(allLeads));
        // console.log(allLeads.length);
    } catch (e) {
        console.log(e);
        throw e;
    }
    return allLeads;
}

function getAllFormIds() {
    return ["2995134520792726", "2995134520792726"];
}

async function getLastUpdatedDate(formId: string): Promise<string> {
    try {
        const query = `SELECT
                        MAX(created_at) as latest_date
                    FROM
                        facebook_onform_lectrix
                    WHERE
                        form_id=$1
                    `;
        const result = await execute(query, [formId]);
        return result.rows[0].latest_date;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export async function pushIntoDatabase(newLeads: Array<facebookOnFormAdObject>) {
    try {
        const query = `INSERT INTO facebook_onform_lectrix VALUES ($1, $2, $3, $4)`;

        for (const lead of newLeads) {
            await execute(query, [lead.id, lead.created_time, lead.form_id, lead]);
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export async function updateDataFromFacebookOnFormsApi() {
    try {
        const formIds = getAllFormIds();
        for (const formId of distinct(formIds)) {
            const startDate = await getLastUpdatedDate(formId);
            const endDate = new Date().toDateString();

            var newLeads: Array<facebookOnFormAdObject> = [];
            newLeads = await ingestDataFromFacebookOnFormsApi(startDate, endDate, formId);

            if (newLeads.length > 0) {
                pushIntoDatabase(newLeads);
            }
            sendDataToLmsEvents(newLeads);
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
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

function extractLeadInformation(lead: facebookOnFormAdObject) {
    const result: leadObject = {
        full_name: null,
        city: null,
        phone_number: null,
        state: null,
        email: null,
    };
    for (const field of lead.field_data) {
        if (field.name == "full_name") {
            result["full_name"] = field.values[0];
        } else if (field.name == "city") {
            result["city"] = field.values[0];
        } else if (field.name == "phone_number") {
            result["phone_number"] = field.values[0];
        } else if (field.name == "state") {
            result["state"] = field.values[0];
        } else if (field.name == "email") {
            result["email"] = field.values[0];
        }
    }
    return result;
}

async function sendDataToLmsEvents(leadsData: Array<facebookOnFormAdObject>) {
    for (const lead of leadsData) {
        const leadFieldData: leadObject = extractLeadInformation(lead);
        const lmsData = {
            date_created: dateToMediumEnFormat(lead.created_time),
            date_modified: "",
            name: leadFieldData.full_name,
            mobile_no: leadFieldData.phone_number,
            alt_no: null,
            referral_code: null,
            referral_phone: null,
            referral_name: null,
            email: leadFieldData.email,
            city: leadFieldData.city,
            district: "",
            state: leadFieldData.state,
            lead_id: lead.id,
            action_id: lead.campaign_id,
            action_type: "try_at_home_test_ride",
            pincode: "",
            address: "",
            source_of_enquiry: "Website",
            utm_source: "",
            utm_medium: lead.campaign_name,
            current_source_of_water: "",
            current_plan_selected: "",
            lead_created_page: "Campaign Try At Home",
            current_lead_page: "Campaign Try At Home",
            business_id: "1",
            user_id: "",
            test_ride_date: "",
            test_ride_timeSlot: "",
        };
        const response = await sendDataToLms(lmsData);
        const result = await response?.json();
        console.log(result);
    }
}

export async function sendDataToLms(searchParameters) {
    let lmsResponse;
    try {
        lmsResponse = await fetch(process.env.LMS_BASE_URL + "/api/new_lead_v2.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: process.env.LMS_AUTHORIZATION_TOKEN!,
            },
            body: JSON.stringify(searchParameters),
        });
        return lmsResponse;
    } catch (e) {
        console.log("LMS Exception");
        console.log(e);
    }
}
