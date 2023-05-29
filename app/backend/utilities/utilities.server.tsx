import {TimeGranularity} from "~/backend/business-insights";
import {getRequiredEnvironmentVariableNew} from "~/global-common-typescript/server/utilities.server";
import jwt from "jsonwebtoken";

export function getGranularityQuery(timeGranularity: TimeGranularity, columnName: string): string {
    switch (timeGranularity) {
        case TimeGranularity.daily: {
            return `DATE_TRUNC('DAY', ${columnName})`;
        }
        case TimeGranularity.weekly: {
            return `DATE_TRUNC('WEEK', ${columnName})`;
        }
        case TimeGranularity.monthly: {
            return `DATE_TRUNC('MONTH', ${columnName})`;
        }
        case TimeGranularity.yearly: {
            return `DATE_TRUNC('YEAR', ${columnName})`;
        }
        default: {
            throw Error(`Unexpected TimeGranularity ${timeGranularity}`);
        }
    }
}

export function getOptionalEnvironmentVariable(variable: string): string | null {
    const value = process.env[variable];

    // Handle undefined case as well
    if (value == null) {
        return null;
    }

    return value;
}

export function getRequiredEnvironmentVariable(variable: string): string {
    const value = process.env[variable];

    if (value == null) {
        throw Error(`Required environment variable ${variable} not found!`);
    }

    return value;
}

// TODO: replace this with production url correctly
export function getUrlFromRequest(request: Request) {
    if (process.env.NODE_ENV == "production") {
        return request.url.replace(`http://localhost:${process.env.PORT}`, `${process.env.WEBSITE_BASE_URL}`);
    } else {
        return request.url;
    }
}

export function encrypt(data: string): CryptoJS.lib.CipherParams {
    const encryptedData = CryptoJS.AES.encrypt(data, getRequiredEnvironmentVariableNew("JWT_TOKEN"));
    console.log(encryptedData);
    return encryptedData;
};

export function decrypt(data: string): unknown{
    const decryptedData = CryptoJS.AES.decrypt(data, getRequiredEnvironmentVariableNew("JWT_TOKEN"));
    return decryptedData;
};
