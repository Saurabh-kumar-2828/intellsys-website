import {ColumnInfo} from "~/backend/data-management";
import {Iso8601DateTime, PhoneNumberWithCountryCode} from "~/utilities/typeDefinitions";
const facebookApiBaseUrl = "https://graph.facebook.com/";

export type FieldDataObject = {
    name: string;
    values: Array<string>;
};

export type FacebookOnFormAdObject = {
    id: string;
    ad_id: string;
    ad_name: string;
    adset_id: string;
    adset_name: string;
    campaign_id: string;
    campaign_name: string;
    field_data: Array<FieldDataObject>;
    created_time: string;
    form_id: string;
    is_organic: boolean;
    platform: string;
};

function filterFbResponseOnDate(dataFromFacebookApi: Array<FacebookOnFormAdObject>, startDate: string | null, endDate: string | null): Array<FacebookOnFormAdObject> {
    const data = dataFromFacebookApi.filter((campaign) => {
        if (startDate != null && new Date(campaign.created_time) <= new Date(startDate)) {
            return false;
        }

        if (endDate != null && new Date(campaign.created_time) >= new Date(endDate)) {
            return false;
        }

        return true;
    });

    return data.reverse();
}

async function getFacebookOnFormLeads(formId: string, limit: number, endCursor: string | null) {
    const fields = "id,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,custom_disclaimer_responses,field_data,created_time,form_id,is_organic,platform";

    let url = `${facebookApiBaseUrl}${process.env.FACEBOOK_API_VERSION!}/${formId}/leads?fields=${fields}&access_token=${process.env
        .FACEBOOK_ONFORMS_ACCESS_TOKEN!}&sort=created_time_descending&limit=${limit}${endCursor == null ? "" : `&after=${endCursor}`}`;

    const response = await fetch(url, {
        method: "GET",
    });

    const formResponses = await response.json();
    return formResponses;
}

export async function ingestDataFromFacebookOnFormsApi(formId: string, startDate: string | null, endDate: string | null): Promise<Array<FacebookOnFormAdObject>> {
    const responseLimit = 5;

    const allLeads: Array<FacebookOnFormAdObject> = [];

    try {
        let endCursor = null;
        while (true) {
            const onFormLeads = await getFacebookOnFormLeads(formId, responseLimit, endCursor);
            // TODO: Add time-based filtering in the above function, and remove the following function
            const filteredResponses = filterFbResponseOnDate(onFormLeads.data, startDate, endDate);
            allLeads.push(...filteredResponses);

            // Break when we run out of responses, or when data starts getting filtered (due to being older than startDate)
            if (filteredResponses.length == 0 || filteredResponses.length < onFormLeads.data.length) {
                break;
            }

            if (!("next" in onFormLeads.paging)) {
                break;
            }

            endCursor = onFormLeads.paging.cursors.after;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }

    return allLeads;
}

function getAllFormIds() {
    return ["2995134520792726", "868223280887849", "1512895339218745", "557293623119394"];
}

async function getLastUpdatedDate(formId: string): Promise<Iso8601DateTime> {
    try {
        const result = await execute(
            `
                SELECT
                    MAX(created_at) AS latest_date
                FROM
                    facebook_onform_lectrix
                WHERE
                    form_id = $1
            `,
            [formId]
        );
        return result.rows[0].latest_date;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export async function pushIntoDatabase(newLeads: Array<FacebookOnFormAdObject>) {
    try {
        for (const lead of newLeads) {
            await execute(
                `
                    INSERT INTO
                        facebook_onform_lectrix
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4
                    )
                `,
                [lead.id, lead.created_time, lead.form_id, lead]
            );
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export async function updateDataFromFacebookOnFormsApi(): Promise<{[formId: string]: number} | null> {
    try {
        const idToCountOfLeads: {[formId: string]: number} = {};

        const formIds = getAllFormIds();
        for (const formId of formIds) {
            const startDate = await getLastUpdatedDate(formId);

            const newLeads = await ingestDataFromFacebookOnFormsApi(formId, startDate, null);

            pushIntoDatabase(newLeads);
            sendDataToLmsEvents(newLeads);

            idToCountOfLeads[formId] = newLeads.length;
        }

        return idToCountOfLeads;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

function extractLeadInformation(lead: FacebookOnFormAdObject) {
    if (lead.form_id == "2995134520792726") {
        // TODO: Figure out a better way to handle form version changes, and enable this again
        // const full_name = getSingletonValue(getSingletonValue(lead.field_data.filter(field => field.name == "full_name")).values);
        // const city = getSingletonValue(getSingletonValue(lead.field_data.filter(field => field.name == "city")).values);
        // const phone_number = getSingletonValue(getSingletonValue(lead.field_data.filter(field => field.name == "phone_number")).values);
        // const state = getSingletonValue(getSingletonValue(lead.field_data.filter(field => field.name == "state")).values);
        // const email = getSingletonValue(getSingletonValue(lead.field_data.filter(field => field.name == "email")).values);

        const full_name = lead.field_data.filter(field => field.name == "full_name")[0]?.values[0];
        const city = lead.field_data.filter(field => field.name == "city")[0]?.values[0];
        const phone_number = lead.field_data.filter(field => field.name == "phone_number")[0]?.values[0];
        const state = lead.field_data.filter(field => field.name == "state")[0]?.values[0];
        const email = lead.field_data.filter(field => field.name == "email")[0]?.values[0];

        const lmsData = {
            date_created: dateToMediumEnFormat(lead.created_time),
            date_modified: "",
            name: full_name,
            mobile_no: phone_number.slice(-10),
            alt_no: null,
            referral_code: null,
            referral_phone: null,
            referral_name: null,
            email: email,
            city: city,
            district: "",
            state: state,
            lead_id: lead.id,
            pincode: "",
            address: "",
            source_of_enquiry: "Facebook On-Form",
            utm_source: "facebook",
            utm_medium: lead.campaign_name,
            current_source_of_water: "",
            current_plan_selected: "",
            lead_created_page: "",
            current_lead_page: "",
            business_id: "1",
            user_id: "",
            test_ride_date: "",
            test_ride_timeSlot: "",
        };

        return lmsData;
    } else {
        throw `Unsupported LMS Data format: ${JSON.stringify(lead)}`;
    }
}

async function sendDataToLmsEvents(leadsData: Array<FacebookOnFormAdObject>) {
    for (const lead of leadsData) {
        const lmsData = extractLeadInformation(lead);
        await sendDataToLms(lmsData);
    }
}

export async function sendDataToLms(lmsData) {
    try {
        const response = await fetch(process.env.LMS_BASE_URL + "/api/new_lead_v2.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: process.env.LMS_AUTHORIZATION_TOKEN!,
            },
            body: JSON.stringify(lmsData),
        });

        if (!response.ok) {
            console.log(await response.json());
        }
        // TODO: Check for failures here?
    } catch (e) {
        console.log("LMS Exception");
        console.log(e);
    }
}
