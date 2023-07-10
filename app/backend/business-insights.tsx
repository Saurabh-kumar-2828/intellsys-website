import {getPostgresDatabaseManager} from "~/global-common-typescript/server/postgresDatabaseManager.server";
import type {Credentials} from "~/backend/utilities/data-management/credentials.server";
import {execute} from "~/backend/utilities/databaseManager.server";
import {getGranularityQuery} from "~/backend/utilities/utilities.server";
import type {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
import {ConnectorType, dataSourcesAbbreviations} from "~/utilities/typeDefinitions";
import {dateToIso8601Date, getSingletonValue} from "~/utilities/utilities";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import type {Integer} from "~/global-common-typescript/typeDefinitions";
import {Connector, getAccountIdForConnector} from "./utilities/connectors/common.server";

export enum TimeGranularity {
    daily = "Daily",
    weekly = "Weekly",
    monthly = "Monthly",
    // quarterly = "Quarterly",
    hourly = "Hourly",
    yearly = "Yearly",
}

export function getTimeGranularityFromUnknown(timeGranularity: unknown): TimeGranularity {
    if (!(typeof timeGranularity === "string")) {
        throw Error(`Unexpected TimeGranularity ${timeGranularity}`);
    }

    switch (timeGranularity) {
        case TimeGranularity.daily: {
            return TimeGranularity.daily;
        }
        case TimeGranularity.weekly: {
            return TimeGranularity.weekly;
        }
        case TimeGranularity.monthly: {
            return TimeGranularity.monthly;
        }
        case TimeGranularity.yearly: {
            return TimeGranularity.yearly;
        }
        default: {
            throw Error(`Unexpected TimeGranularity ${timeGranularity}`);
        }
    }
}

export type AdsData = {
    metaQuery: string;
    rows: Array<AdsDataAggregatedRow>;
};

export type GoogleAdsData = {
    metaQuery: string;
    rows: Array<GoogleAdsDataAggregatedRow>;
};

export type GoogleAnalyticsData = {
    metaQuery: string;
    rows: Array<GoogleAnalyticsDataAggregatedRow>;
};

export type FacebookAdsData = {
    metaQuery: string;
    rows: Array<FacebookAdsAggregatedRow>;
};

export type AdsDataAggregatedRow = {
    date: Iso8601Date;
    amountSpent: number;
    impressions: number;
    clicks: number;
    campaignName: string;
    platform: string;
    category: string;
};

export type GoogleAnalyticsDataAggregatedRow = {
    "date": Iso8601Date,
    "adSourceName": any,
    "adUnitName": any,
    "newVsReturning": any,
    "platform": any,
    "active1DayUsers": any,
    "active28DayUsers": any,
    "active7DayUsers": any,
    "activeUsers": any,
    "addToCarts": any,
    "adUnitExposure": any,
    "averagePurchaseRevenue": any,
    "averagePurchaseRevenuePerPayingUser": any,
    "averagePurchaseRevenuePerUser": any,
    "averageRevenuePerUser": any,
    "averageSessionDuration": any,
    "bounceRate": any,
    "cartToViewRate": any,
    "checkouts": any,
    "conversions": any,
    "conversionsTest_Ride": any,
    "conversionsTRD": any,
    "conversionsTRH_CYTR": any,
    "conversionsTRH_OTPverified": any,
    "conversionsPurchase": any,
    "crashAffectedUsers": any,
    "crashFreeUsersRate": any,
    "dauPerMau": any,
    "dauPerWau": any,
    "ecommercePurchases": any,
    "engagedSessions": any,
    "engagementRate": any,
    "eventCount": any,
    "eventCountPerUser": any,
    "eventsPerSession": any,
    "eventValue": any,
    "firstTimePurchaserConversionRate": any,
    "firstTimePurchasers": any,
    "firstTimePurchasersPerNewUser": any,
    "grossPurchaseRevenue": any,
    "itemListClickEvents": any,
    "itemListClickThroughRate": any,
    "itemListViewEvents": any,
    "itemPromotionClickThroughRate": any,
    "itemViewEvents": any,
    "newUsers": any,
    "promotionClicks": any,
    "promotionViews": any,
    "publisherAdClicks": any,
    "publisherAdImpressions": any,
    "purchaseRevenue": any,
    "purchaseToViewRate": any,
    "purchaserConversionRate": any,
    "refundAmount": any,
    "screenPageViews": any,
    "screenPageViewsPerSession": any,
    "screenPageViewsPerUser": any,
    "scrolledUsers": any,
    "sessionConversionRate": any,
    "sessionConversionRateTestRide": any,
    "sessionConversionRateTRD": any,
    "sessionConversionRateTRH_CYTR": any,
    "sessionConversionRateTRH_OTPverified": any,
    "sessionConversionRatePurchase": any,
    "sessions": any,
    "sessionsPerUser": any,
    "shippingAmount": any,
    "taxAmount": any,
    "totalAdRevenue": any,
    "totalPurchasers": any,
    "totalRevenue": any,
    "totalUsers": any,
    "transactions": any,
    "transactionsPerPurchaser": any,
    "userConversionRate": any,
    "userConversionRateTestRide": any,
    "userConversionRateTRD": any,
    "userConversionRateTRH_CYTR": any,
    "userConversionRateTRH_Otpverified": any,
    "userConversionRatePurchase": any,
    "userEngagementDuration": any,
    "wauPerMau": any,
}

export type GoogleAdsDataAggregatedRow = {
    date: Iso8601Date;
    hour: Integer;
    campaignId: string;
    campaignName: string;
    averageCost: any;
    impressions: any;
    clicks: any;
    interactionEventTypes: any;
    valuePerAllConversions: any;
    videoViewRate: any;
    videoViews: any;
    viewThroughConversions: any;
    conversionsFromInteractionsRate: any;
    conversionsValue: any;
    conversions: any;
    costMicros: any;
    costPerAllConversions: any;
    ctr: any;
    engagementRate: any;
    engagements: any;
    activeViewImpressions: any;
    activeViewMeasurability: any;
    activeViewMeasurableCostMicros: any;
    activeViewMeasurableImpressions: any;
    allConversionsFromInteractionsRate: any;
    allConversionsValue: any;
    allConversions: any;
    averageCpc: any;
    averageCpe: any;
    averageCpm: any;
    averageCpv: any;
    interactionRate: any;
    interactions: any;
    allConversionsByConversionDate: any;
    valuePerAllConversionsByConversionDate: any;
}


export type FacebookAdsAggregatedRow = {
    accountCurrency: string,
    accountId: string,
    accountName: string,
    clicks: string,
    createdTime: string,
    dateStart: string,
    dateStop: string,
    frequency: string,
    impressions: string,
    reach: string,
    spend: string,
    campaignId: string,
    campaignName: string,
}

// TODO: Remove? At the very least, refactor to use getGoogleAdsData and getFacebookAdsData.
// Metrics: amountSpent, impressions, clicks
// Dependent column: platform, category
// pivots: date, campaign name
export async function getAdsData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<AdsData> {
    const googleAdsData = await getGoogleAdsData(minDate, maxDate, granularity, companyId);
    const facebookAdsData = await getFacebookAdsData(minDate, maxDate, granularity, companyId);

    const result = {
        metaQuery: googleAdsData.metaQuery + "\n" + facebookAdsData.metaQuery,
        rows: [...googleAdsData.rows, ...facebookAdsData.rows],
    };

    return result;
}

function rowToAdsDataAggregatedRow(row: unknown): AdsDataAggregatedRow {
    const adsDataAggregatedRow: AdsDataAggregatedRow = {
        date: row.date.toISOString().slice(0, 10),
        amountSpent: parseFloat(row.amount_spent),
        impressions: parseInt(row.impressions),
        clicks: parseInt(row.clicks),
        platform: row.platform,
        campaignName: row.campaign_name,
        category: row.category,
    };

    return adsDataAggregatedRow;
}

function rowToGoogleAdsDataAggregatedRow(row: unknown): GoogleAdsDataAggregatedRow {
    const adsDataAggregatedRow: GoogleAdsDataAggregatedRow = {
        date: row.date,
        hour: row.hour,
        campaignId: row.campaignid,
        campaignName: row.campaignname,
        averageCost: row.averagecost,
        impressions: row.impressions,
        clicks: row.clicks,
        interactionEventTypes: row.interactioneventtypes,
        valuePerAllConversions: row.valueperallconversions,
        videoViewRate: row.videoviewrate,
        videoViews: row.videoviews,
        viewThroughConversions: row.viewthroughconversions,
        conversionsFromInteractionsRate: row.conversionsfrominteractionsrate,
        conversionsValue: row.conversionsvalue,
        conversions: row.conversions,
        costMicros: row.costmicros,
        costPerAllConversions: row.costperallconversions,
        ctr: row.ctr,
        engagementRate: row.engagementrate,
        engagements: row.engagements,
        activeViewImpressions: row.activeviewimpressions,
        activeViewMeasurability: row.activeviewmeasurability,
        activeViewMeasurableCostMicros: row.activeviewmeasurablecostmicros,
        activeViewMeasurableImpressions: row.activeviewmeasurableimpressions,
        allConversionsFromInteractionsRate: row.allconversionsfrominteractionsrate,
        allConversionsValue: row.allconversionsvalue,
        allConversions: row.allconversions,
        averageCpc: row.averagecpc,
        averageCpe: row.averagecpe,
        averageCpm: row.averagecpm,
        averageCpv: row.averagecpv,
        interactionRate: row.interactionrate,
        interactions: row.interactions,
        allConversionsByConversionDate: row.allconversionsbyconversiondate,
        valuePerAllConversionsByConversionDate: row.valueperallconversionsbyconversiondate,
    };

    return adsDataAggregatedRow;
}

function rowToFacebookAdsDataAggregatedRow(row: Credentials): FacebookAdsAggregatedRow {
    const facebookAdsAggregatedRow: FacebookAdsAggregatedRow = {
        accountCurrency: row.accountcurrency as string,
        accountId: row.accountid as string,
        accountName: row.accountname as string,
        clicks: row.clicks as string,
        createdTime: row.createdtime as string,
        dateStart: row.datestart as string,
        dateStop: row.datestop as string,
        frequency: row.frequency as string,
        impressions: row.impressions as string,
        reach: row.reach as string,
        spend: row.spend as string,
        campaignId: row.campaignid as string,
        campaignName: row.campaignname as string
    }
    return facebookAdsAggregatedRow
}

function rowToGoogleAnalyticsDataAggregatedRow(row: unknown): GoogleAnalyticsDataAggregatedRow {
    console.log(row);
    const analyticsDataAggregatedRow: GoogleAnalyticsDataAggregatedRow = {
        "date": row.date,
        "adSourceName": row.adsourcename,
        "adUnitName": row.adunitname,
        "newVsReturning": row.newvsreturning,
        "platform": row.platform,
        "active1DayUsers": row.active1dayusers,
        "active28DayUsers": row.active28dayusers,
        "active7DayUsers": row.active7dayusers,
        "activeUsers": row.activeusers,
        "addToCarts": row.addtocarts,
        "adUnitExposure": row.adunitexposure,
        "averagePurchaseRevenue": row.averagepurchaserevenue,
        "averagePurchaseRevenuePerPayingUser": row.averagepurchaserevenueperpayinguser,
        "averagePurchaseRevenuePerUser": row.averagepurchaserevenueperuser,
        "averageRevenuePerUser": row.averagerevenueperuser,
        "averageSessionDuration": row.averagesessionduration,
        "bounceRate": row.bouncerate,
        "cartToViewRate": row.carttoviewrate,
        "checkouts": row.checkouts,
        "conversions": row.conversions,
        "conversionsTest_Ride": row.conversionstest_ride,
        "conversionsTRD": row.conversionstrd,
        "conversionsTRH_CYTR": row.conversionstrh_cytr,
        "conversionsTRH_OTPverified": row.conversionstrh_otpverified,
        "conversionsPurchase": row.conversionspurchase,
        "crashAffectedUsers": row.crashaffectedusers,
        "crashFreeUsersRate": row.crashfreeusersrate,
        "dauPerMau": row.daupermau,
        "dauPerWau": row.dauperwau,
        "ecommercePurchases": row.ecommercepurchases,
        "engagedSessions": row.engagedsessions,
        "engagementRate": row.engagementrate,
        "eventCount": row.eventcount,
        "eventCountPerUser": row.eventcountperuser,
        "eventsPerSession": row.eventspersession,
        "eventValue": row.eventvalue,
        "firstTimePurchaserConversionRate": row.firsttimepurchaserconversionrate,
        "firstTimePurchasers": row.firsttimepurchasers,
        "firstTimePurchasersPerNewUser": row.firsttimepurchaserspernewuser,
        "grossPurchaseRevenue": row.grosspurchaserevenue,
        "itemListClickEvents": row.itemlistclickevents,
        "itemListClickThroughRate": row.itemlistclickthroughrate,
        "itemListViewEvents": row.itemlistviewevents,
        "itemPromotionClickThroughRate": row.itempromotionclickthroughrate,
        "itemViewEvents": row.itemviewevents,
        "newUsers": row.newusers,
        "promotionClicks": row.promotionclicks,
        "promotionViews": row.promotionviews,
        "publisherAdClicks": row.publisheradclicks,
        "publisherAdImpressions": row.publisheradimpressions,
        "purchaseRevenue": row.purchaserevenue,
        "purchaseToViewRate": row.purchasetoviewrate,
        "purchaserConversionRate": row.purchaserconversionrate,
        "refundAmount": row.refundamount,
        "screenPageViews": row.screenpageviews,
        "screenPageViewsPerSession": row.screenpageviewspersession,
        "screenPageViewsPerUser": row.screenpageviewsperuser,
        "scrolledUsers": row.scrolledusers,
        "sessionConversionRate": row.sessionconversionrate,
        "sessionConversionRateTestRide": row.sessionconversionratetestride,
        "sessionConversionRateTRD": row.sessionconversionratetrd,
        "sessionConversionRateTRH_CYTR": row.sessionconversionratetrh_cytr,
        "sessionConversionRateTRH_OTPverified": row.sessionconversionratetrh_otpverified,
        "sessionConversionRatePurchase": row.sessionconversionratepurchase,
        "sessions": row.sessions,
        "sessionsPerUser": row.sessionsperuser,
        "shippingAmount": row.shippingamount,
        "taxAmount": row.taxamount,
        "totalAdRevenue": row.totaladrevenue,
        "totalPurchasers": row.totalpurchasers,
        "totalRevenue": row.totalrevenue,
        "totalUsers": row.totalusers,
        "transactions": row.transactions,
        "transactionsPerPurchaser": row.transactionsperpurchaser,
        "userConversionRate": row.userconversionrate,
        "userConversionRateTestRide": row.userronversionratetestride,
        "userConversionRateTRD": row.userconversionratetrd,
        "userConversionRateTRH_CYTR": row.userconversionratetrh_cytr,
        "userConversionRateTRH_Otpverified": row.userconversionratetrh_otpverified,
        "userConversionRatePurchase": row.userconversionratepurchase,
        "userEngagementDuration": row.userengagementduration,
        "wauPerMau": row.waupermau,
    };

    return analyticsDataAggregatedRow;
}

export async function getGoogleAdsData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<AdsData> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "date")} AS date,
            campaign_name,
            spend AS amount_spent,
            impressions,
            clicks,
            campaign_category AS category,
            'Google' AS platform
        FROM
            google_ads_with_information
        WHERE
            DATE(date) >= '${minDate}'
            AND DATE(date) <= '${maxDate}'
        ORDER BY
            date
    `;

    const result = await execute(companyId, query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToAdsDataAggregatedRow(row)),
    };
}

export async function getGoogleAdsLectrixData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, destinationDatabaseId: Uuid, connectorId: Uuid): Promise<GoogleAdsData | Error> {

    console.log(destinationDatabaseId);
    const postgresDatabaseManager = await getPostgresDatabaseManager(destinationDatabaseId);

    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const connector = await getAccountIdForConnector(connectorId);

    if (connector instanceof Error) {
        return Error("Google account undefined!");
    }

    const tableName = `${dataSourcesAbbreviations.googleAds}_${connector.accountId}`;

    const query = `
        SELECT
            data->'campaign'->>'id' as campaignId,
            data->'campaign'->>'name' as campaignName,
            data->'campaign'->>'resourceName' as resourceName,
            data->'metrics'->>'interactionEventTypes' as interactionEventTypes,
            data->'metrics'->>'valuePerAllConversions' as valuePerAllConversions,
            data->'metrics'->>'videoViewRate' as videoViewRate,
            data->'metrics'->>'videoViews' as videoViews,
            data->'metrics'->>'viewThroughConversions' as viewThroughConversions,
            data->'metrics'->>'conversionsFromInteractionsRate' as conversionsFromInteractionsRate,
            data->'metrics'->>'conversionsValue' as conversionsValue,
            data->'metrics'->>'conversions' as conversions,
            data->'metrics'->>'costMicros' as costMicros,
            data->'metrics'->>'costPerAllConversions' as costPerAllConversions,
            data->'metrics'->>'ctr' as ctr,
            data->'metrics'->>'engagementRate' as engagementRate,
            data->'metrics'->>'engagements' as engagements,
            data->'metrics'->>'activeViewImpressions' as activeViewImpressions,
            data->'metrics'->>'activeViewMeasurability' as activeViewMeasurability,
            data->'metrics'->>'activeViewMeasurableCostMicros' as activeViewMeasurableCostMicros,
            data->'metrics'->>'activeViewMeasurableImpressions' as activeViewMeasurableImpressions,
            data->'metrics'->>'allConversionsFromInteractionsRate' as allConversionsFromInteractionsRate,
            data->'metrics'->>'allConversionsValue' as allConversionsValue,
            data->'metrics'->>'allConversions' as allConversions,
            data->'metrics'->>'averageCpc' as averageCpc,
            data->'metrics'->>'averageCpe' as averageCpe,
            data->'metrics'->>'averageCpm' as averageCpm,
            data->'metrics'->>'averageCpv' as averageCpv,
            data->'metrics'->>'interactionRate' as interactionRate,
            data->'metrics'->>'interactions' as interactions,
            data->'metrics'->>'allConversionsByConversionDate' as allConversionsByConversionDate,
            data->'metrics'->>'valuePerAllConversionsByConversionDate' as valuePerAllConversionsByConversionDate,
            DATE((data->'segments'->>'date')) AS date,
            data->'segments'->>'hour' AS hour,
            'Google' AS platform,
            data->'metrics'->>'clicks' as clicks,
            data->'metrics'->>'impressions' as impressions,
            data->'metrics'->>'averageCost' as averageCost
        FROM
            ${tableName}
        WHERE
            DATE((data->'segments'->>'date')) >= '${minDate}'
            AND DATE((data->'segments'->>'date')) <= '${maxDate}'
        ORDER BY
            date
    `;

    const result = await postgresDatabaseManager.execute(query);

    if (result instanceof Error) {
        return result;
    }

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToGoogleAdsDataAggregatedRow(row)),
    };
}

export async function getGoogleAnalyticsLectrixData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, destinationDatabaseId: Uuid, connectorId: Uuid): Promise<GoogleAnalyticsData | Error> {

    console.log("destination credential id", destinationDatabaseId);
    const postgresDatabaseManager = await getPostgresDatabaseManager(destinationDatabaseId);

    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const connector = await getAccountIdForConnector(connectorId);

    if (connector instanceof Error) {
        return Error("Google account undefined!");
    }

    const tableName = `${dataSourcesAbbreviations.googleAnalytics}_${connector.accountId}`;

    const query = `
        SELECT
	        data->'dimensionValues'->>'date' AS date,
	        data->'dimensionValues'->>'adSourceName' AS adSourceName,
	        data->'dimensionValues'->>'adUnitName' AS adUnitName,
	        data->'dimensionValues'->>'newVsReturning' AS newVsReturning,
	        data->'dimensionValues'->>'platform' AS platform,
	        data->'metricValues'->>'active1DayUsers' AS active1DayUsers,
	        data->'metricValues'->>'active28DayUsers' AS active28DayUsers,
	        data->'metricValues'->>'active7DayUsers' AS active7DayUsers,
	        data->'metricValues'->>'activeUsers' AS activeUsers,
	        data->'metricValues'->>'addToCarts' AS addToCarts,
	        data->'metricValues'->>'adUnitExposure' AS adUnitExposure,
	        data->'metricValues'->>'averagePurchaseRevenue' AS averagePurchaseRevenue,
	        data->'metricValues'->>'averagePurchaseRevenuePerPayingUser' AS averagePurchaseRevenuePerPayingUser,
	        data->'metricValues'->>'averagePurchaseRevenuePerUser' AS averagePurchaseRevenuePerUser,
	        data->'metricValues'->>'averageRevenuePerUser' AS averageRevenuePerUser,
	        data->'metricValues'->>'averageSessionDuration' AS averageSessionDuration,
	        data->'metricValues'->>'bounceRate' AS bounceRate,
	        data->'metricValues'->>'cartToViewRate' AS cartToViewRate,
	        data->'metricValues'->>'checkouts' AS checkouts,
	        data->'metricValues'->>'conversions' AS conversions,
	        data->'metricValues'->>'conversions:Test_Ride' AS conversionsTest_Ride,
	        data->'metricValues'->>'conversions:TRD' AS conversionsTRD,
	        data->'metricValues'->>'conversions:TRH_CYTR' AS conversionsTRH_CYTR,
	        data->'metricValues'->>'conversions:TRH_OTPverified' AS conversionsTRH_OTPverified,
	        data->'metricValues'->>'conversions:purchase' AS conversionsPurchase,
	        data->'metricValues'->>'crashAffectedUsers' AS crashAffectedUsers,
	        data->'metricValues'->>'crashFreeUsersRate' AS crashFreeUsersRate,
	        data->'metricValues'->>'dauPerMau' AS dauPerMau,
	        data->'metricValues'->>'dauPerWau' AS dauPerWau,
	        data->'metricValues'->>'ecommercePurchases' AS ecommercePurchases,
	        data->'metricValues'->>'engagedSessions' AS engagedSessions,
	        data->'metricValues'->>'engagementRate' AS engagementRate,
	        data->'metricValues'->>'eventCount' AS eventCount,
	        data->'metricValues'->>'eventCountPerUser' AS eventCountPerUser,
	        data->'metricValues'->>'eventsPerSession' AS eventsPerSession,
	        data->'metricValues'->>'eventValue' AS eventValue,
	        data->'metricValues'->>'firstTimePurchaserConversionRate' AS firstTimePurchaserConversionRate,
	        data->'metricValues'->>'firstTimePurchasers' AS firstTimePurchasers,
	        data->'metricValues'->>'firstTimePurchasersPerNewUser' AS firstTimePurchasersPerNewUser,
	        data->'metricValues'->>'grossPurchaseRevenue' AS grossPurchaseRevenue,
	        data->'metricValues'->>'itemListClickEvents' AS itemListClickEvents,
	        data->'metricValues'->>'itemListClickThroughRate' AS itemListClickThroughRate,
	        data->'metricValues'->>'itemListViewEvents' AS itemListViewEvents,
	        data->'metricValues'->>'itemPromotionClickThroughRate' AS itemPromotionClickThroughRate,
	        data->'metricValues'->>'itemViewEvents' AS itemViewEvents,
	        data->'metricValues'->>'newUsers' AS newUsers,
	        data->'metricValues'->>'promotionClicks' AS promotionClicks,
	        data->'metricValues'->>'promotionViews' AS promotionViews,
	        data->'metricValues'->>'publisherAdClicks' AS publisherAdClicks,
	        data->'metricValues'->>'publisherAdImpressions' AS publisherAdImpressions,
	        data->'metricValues'->>'purchaseRevenue' AS purchaseRevenue,
	        data->'metricValues'->>'purchaseToViewRate' AS purchaseToViewRate,
	        data->'metricValues'->>'purchaserConversionRate' AS purchaserConversionRate,
	        data->'metricValues'->>'refundAmount' AS refundAmount,
	        data->'metricValues'->>'screenPageViews' AS screenPageViews,
	        data->'metricValues'->>'screenPageViewsPerSession' AS screenPageViewsPerSession,
	        data->'metricValues'->>'screenPageViewsPerUser' AS screenPageViewsPerUser,
	        data->'metricValues'->>'scrolledUsers' AS scrolledUsers,
	        data->'metricValues'->>'sessionConversionRate' AS sessionConversionRate,
	        data->'metricValues'->>'sessionConversionRate:Test_Ride' AS sessionConversionRateTestRide,
	        data->'metricValues'->>'sessionConversionRate:TRD' AS sessionConversionRateTRD,
	        data->'metricValues'->>'sessionConversionRate:TRH_CYTR' AS sessionConversionRateTRH_CYTR,
	        data->'metricValues'->>'sessionConversionRate:TRH_OTPverified' AS sessionConversionRateTRH_OTPverified,
	        data->'metricValues'->>'sessionConversionRate:purchase' AS sessionConversionRatePurchase,
	        data->'metricValues'->>'sessions' AS sessions,
	        data->'metricValues'->>'sessionsPerUser' AS sessionsPerUser,
	        data->'metricValues'->>'shippingAmount' AS shippingAmount,
	        data->'metricValues'->>'taxAmount' AS taxAmount,
	        data->'metricValues'->>'totalAdRevenue' AS totalAdRevenue,
	        data->'metricValues'->>'totalPurchasers' AS totalPurchasers,
	        data->'metricValues'->>'totalRevenue' AS totalRevenue,
	        data->'metricValues'->>'totalUsers' AS totalUsers,
	        data->'metricValues'->>'transactions' AS transactions,
	        data->'metricValues'->>'transactionsPerPurchaser' AS transactionsPerPurchaser,
	        data->'metricValues'->>'userConversionRate' AS userConversionRate,
	        data->'metricValues'->>'userConversionRate:Test_Ride' AS userConversionRateTestRide,
	        data->'metricValues'->>'userConversionRate:TRD' AS userConversionRateTRD,
	        data->'metricValues'->>'userConversionRate:TRH_CYTR' AS userConversionRateTRH_CYTR,
	        data->'metricValues'->>'userConversionRate:TRH_OTPverified' AS userConversionRateTRH_Otpverified,
	        data->'metricValues'->>'userConversionRate:purchase' AS userConversionRatePurchase,
	        data->'metricValues'->>'userEngagementDuration' AS userEngagementDuration,
	        data->'metricValues'->>'wauPerMau' AS wauPerMau
        FROM
            ${tableName}
        WHERE
            DATE((data->'dimensionValues'->>'date')) >= '${minDate}'
            AND DATE((data->'dimensionValues'->>'date')) <= '${maxDate}'
        ORDER BY
            date
    `;

    const result = await postgresDatabaseManager.execute(query);

    if (result instanceof Error) {
        return result;
    }
    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToGoogleAnalyticsDataAggregatedRow(row)),
    };
}

export async function getFacebookAdsLectrixData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, destinationDatabaseId: Uuid, connectorId: Uuid): Promise<FacebookAdsData | Error> {

    // FacebookAdsData | Error

    const postgresDatabaseManager = await getPostgresDatabaseManager(destinationDatabaseId);

    if (postgresDatabaseManager instanceof Error) {
        return postgresDatabaseManager;
    }

    const connector = await getAccountIdForConnector(connectorId);
    if (connector instanceof Error) {
        return Error("Facebook account undefined!");
    }

    const tableName = `${dataSourcesAbbreviations.facebookAds}_${connector.accountId}`;

    const query = `
        SELECT
            data->>'account_currency' as accountCurrency,
            data->>'account_id' as accountId,
            data->>'account_name' as accountName,
            data->>'clicks' as clicks,
            data->>'created_time' as createdTime,
            DATE((data->>'date_start')::date) as dateStart,
            data->>'date_stop' as dateStop,
            data->>'frequency' as frequency,
            data->>'impressions' as impressions,
            data->>'reach' as reach,
            data->>'spend' as spend,
            data->>'campaign_id' as campaignId,
            data->>'campaign_name' as campaignName
        FROM
            ${tableName}
        WHERE
            DATE((data->>'date_start')::date) >= '${minDate}'
            AND DATE((data->>'date_stop')::date) <= '${maxDate}'
        ORDER BY
            dateStart
    `;

    const result = await postgresDatabaseManager.execute(query);

    if (result instanceof Error) {
        return result;
    }

    return {
        metaQuery: "",
        rows: result.rows.map((row) => rowToFacebookAdsDataAggregatedRow(row)),
    };


}

export async function getFacebookAdsData(minDate: Iso8601Date, maxDate: Iso8601Date, granularity: TimeGranularity, companyId: Uuid): Promise<AdsData> {
    const query = `
        SELECT
            ${getGranularityQuery(granularity, "date")} AS date,
            campaign_name,
            spend AS amount_spent,
            impressions,
            clicks,
            campaign_category AS category,
            'Facebook' AS platform
        FROM
            facebook_ads_with_information
        WHERE
            DATE(date) >= '${minDate}'
            AND DATE(date) <= '${maxDate}'
        ORDER BY
            date
    `;

    const result = await execute(companyId, query);

    return {
        metaQuery: query,
        rows: result.rows.map((row) => rowToAdsDataAggregatedRow(row)),
    };
}
