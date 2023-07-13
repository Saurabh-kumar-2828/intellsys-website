import {TimeGranularity, getFacebookAdsData, getGoogleAdsData, getGoogleAnalyticsData} from "../business-insights";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import type {ConnectorConfig} from "./connectors/common.server";
import {getDestinationCredentialId} from "./connectors/common.server";
import {getCurrentIsoTimestamp, numberToHumanFriendlyString} from "~/global-common-typescript/utilities/utilities";

export async function getSummarizedViewOfGoogleAdsConnector(
    connector: ConnectorConfig,
    companyId: Uuid,
): Promise<
    | {
          spends: number;
          impressions: number;
          clicks: number;
      }
    | Error
> {
    const dateToday = getCurrentIsoTimestamp();

    const databaseCredentialId = await getDestinationCredentialId(companyId);
    if (databaseCredentialId instanceof Error) {
        return databaseCredentialId;
    }

    const data = await getGoogleAdsData("2023-06-27", "2023-06-27", TimeGranularity.daily, databaseCredentialId, connector.id);
    if (data instanceof Error) {
        return data;
    }

    const {spends, impressions, clicks} = data.rows.reduce(
        (totals, row) => {
            totals.spends += parseInt(row.costMicros);
            totals.impressions += parseInt(row.impressions);
            totals.clicks += parseInt(row.clicks);
            return totals;
        },
        {spends: 0, impressions: 0, clicks: 0},
    );

    return {
        spends: numberToHumanFriendlyString(spends / Math.pow(10, 6)),
        impressions: numberToHumanFriendlyString(impressions),
        clicks: numberToHumanFriendlyString(clicks),
    };
}

export async function getSummarizedViewOfFacebookAdsConnector(
    connector: ConnectorConfig,
    companyId: Uuid,
): Promise<
    | {
          spends: number;
          impressions: number;
          clicks: number;
      }
    | Error
> {

    const dateToday = getCurrentIsoTimestamp();

    const databaseCredentialId = await getDestinationCredentialId(companyId);
    if (databaseCredentialId instanceof Error) {
        return databaseCredentialId;
    }

    const data = await getFacebookAdsData("2023-06-27", "2023-06-27", TimeGranularity.daily, databaseCredentialId, connector.id);
    if (data instanceof Error) {
        return data;
    }

    const {spends, impressions, clicks} = data.rows.reduce(
        (totals, row) => {
            totals.spends += parseInt(row.spend);
            totals.impressions += parseInt(row.impressions);
            totals.clicks += parseInt(row.clicks);
            return totals;
        },
        {spends: 0, impressions: 0, clicks: 0},
    );

    return {
        spends: numberToHumanFriendlyString(spends),
        impressions: numberToHumanFriendlyString(impressions),
        clicks: numberToHumanFriendlyString(clicks),
    };
}

export async function getSummarizedViewOfGoogleAnalyticsConnector(
    connector: ConnectorConfig,
    companyId: Uuid,
): Promise<
    | {
          sessions: number;
          dauPerMau: number;
          wauPerMau: number;
      }
    | Error
> {
    const dateToday = getCurrentIsoTimestamp();

    const databaseCredentialId = await getDestinationCredentialId(companyId);
    if (databaseCredentialId instanceof Error) {
        return databaseCredentialId;
    }

    const data = await getGoogleAnalyticsData("2023-06-27", "2023-06-27", TimeGranularity.daily, databaseCredentialId, connector.id);
    if (data instanceof Error) {
        return data;
    }

    const {dauPerMau, wauPerMau, sessions} = data.rows.reduce(
        (totals, row) => {
            totals.dauPerMau += parseInt(row.dauPerMau);
            totals.wauPerMau += parseInt(row.wauPerMau);
            totals.sessions += parseInt(row.sessions);
            return totals;
        },
        {dauPerMau: 0, wauPerMau: 0, sessions: 0},
    );


    return {
        sessions: sessions,
        dauPerMau: dauPerMau,
        wauPerMau: wauPerMau
    };
}
