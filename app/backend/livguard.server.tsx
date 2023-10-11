// TODO: DELETE THIS FILE!

import {logBackendError} from "~/global-common-typescript/server/logging.server";
import {getRequiredEnvironmentVariable} from "~/common-remix--utilities/utilities.server";
import {getErrorFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import type {ContactUsLead} from "~/routes/livguard/contact-us-leads";
import type {TermFrequency} from "~/routes/livguard/search-queries";

export async function getContactUsLeadsWithInfo(startDate: string, endDate: string, limit: number, offset: number): Promise<{nRows: number; rows: Array<ContactUsLead>} | Error> {
    try {
        const response = await fetch(`${getRequiredEnvironmentVariable("LIVGUARD_BASE_URL")}/api/v1/contact-us-leads?startDate=${startDate}&endDate=${endDate}&limit=${limit}&offset=${offset}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${getRequiredEnvironmentVariable("LIVGUARD_AUTHENTICATION_TOKEN")}`,
            },
        });

        if (!response.ok) {
            return Error(await response.text());
        }

        return await response.json();
    } catch (error_) {
        const error = getErrorFromUnknown(error_);
        logBackendError(error);
        return error;
    }
}

export async function getSearchQueriesWithInfo(startDate: string, endDate: string, limit: number, offset: number): Promise<{nRows: number; rows: Array<TermFrequency>} | Error> {
    try {
        const response = await fetch(`${getRequiredEnvironmentVariable("LIVGUARD_BASE_URL")}/api/v1/search-queries?startDate=${startDate}&endDate=${endDate}&limit=${limit}&offset=${offset}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${getRequiredEnvironmentVariable("LIVGUARD_AUTHENTICATION_TOKEN")}`,
            },
        });

        if (!response.ok) {
            return Error(await response.text());
        }

        return await response.json();
    } catch (error_) {
        const error = getErrorFromUnknown(error_);
        logBackendError(error);
        return error;
    }
}
