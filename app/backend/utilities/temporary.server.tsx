import type {Connector} from "~/backend/utilities/connectors/googleOAuth.server";

export async function getSummarizedViewOfGoogleAdsConnector(connector: Connector): Promise<{
    spends: number;
    impressions: number;
    clicks: number;
} | Error> {
    return {
        spends: -1,
        impressions: -2,
        clicks: -3,
    };
}

export async function getSummarizedViewOfFacebookAdsConnector(connector: Connector): Promise<{
    spends: number;
    impressions: number;
    clicks: number;
} | Error> {
    return {
        spends: -1,
        impressions: -2,
        clicks: -3,
    };
}

export async function getSummarizedViewOfGoogleAnalyticsConnector(connector: Connector): Promise<{
    sessions: number;
} | Error> {
    return {
        sessions: -1,
    };
}
