import type {MetaFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {get_facebookAdsDataInformation, get_freshsalesLeadsDataInformation, get_googleAdsDataInformation, get_shopifySalesDataInformation, get_typeformResponsesDataInformation, get_websitePopupFormResponsesDataInformation} from "~/backend/data-source-information";
import {Card} from "~/components/scratchpad";
import {dateToMediumNoneEnFormat, numberToHumanFriendlyString} from "~/utilities/utilities";

export const meta: MetaFunction = () => {
    return {
        title: "Data Source Information - Intellsys",
    };
};

export const loader: LoaderFunction = async ({request}) => {
    return json({
        shopifySalesDataInformation: await get_shopifySalesDataInformation(),
        freshsalesLeadsDataInformation: await get_freshsalesLeadsDataInformation(),
        googleAdsDataInformation: await get_googleAdsDataInformation(),
        facebookAdsDataInformation: await get_facebookAdsDataInformation(),
        websitePopupFormResponsesDataInformation: await get_websitePopupFormResponsesDataInformation(),
        typeformResponsesDataInformation: await get_typeformResponsesDataInformation(),
    });
};

export default function () {
    const {
        shopifySalesDataInformation,
        freshsalesLeadsDataInformation,
        googleAdsDataInformation,
        facebookAdsDataInformation,
        websitePopupFormResponsesDataInformation,
        typeformResponsesDataInformation,
    } = useLoaderData();

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">
                Shopify Sales
            </div>

            <Card information={numberToHumanFriendlyString(shopifySalesDataInformation.count)} label="Count" metaQuery={shopifySalesDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(shopifySalesDataInformation.minDate)} label="Data Start" metaQuery={shopifySalesDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(shopifySalesDataInformation.maxDate)} label="Data End" metaQuery={shopifySalesDataInformation.metaQuery} className="tw-col-span-4" />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">
                Freshsales Leads
            </div>

            <Card information={numberToHumanFriendlyString(freshsalesLeadsDataInformation.count)} label="Count" metaQuery={freshsalesLeadsDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(freshsalesLeadsDataInformation.minDate)} label="Data Start" metaQuery={freshsalesLeadsDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(freshsalesLeadsDataInformation.maxDate)} label="Data End" metaQuery={freshsalesLeadsDataInformation.metaQuery} className="tw-col-span-4" />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">
                Google Ads
            </div>

            <Card information={numberToHumanFriendlyString(googleAdsDataInformation.count)} label="Count" metaQuery={googleAdsDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(googleAdsDataInformation.minDate)} label="Data Start" metaQuery={googleAdsDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(googleAdsDataInformation.maxDate)} label="Data End" metaQuery={googleAdsDataInformation.metaQuery} className="tw-col-span-4" />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">
                Facebook Ads
            </div>

            <Card information={numberToHumanFriendlyString(facebookAdsDataInformation.count)} label="Count" metaQuery={facebookAdsDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(facebookAdsDataInformation.minDate)} label="Data Start" metaQuery={facebookAdsDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(facebookAdsDataInformation.maxDate)} label="Data End" metaQuery={facebookAdsDataInformation.metaQuery} className="tw-col-span-4" />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">
                Website Popup Form Responses
            </div>

            <Card information={numberToHumanFriendlyString(websitePopupFormResponsesDataInformation.count)} label="Count" metaQuery={websitePopupFormResponsesDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(websitePopupFormResponsesDataInformation.minDate)} label="Data Start" metaQuery={websitePopupFormResponsesDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(websitePopupFormResponsesDataInformation.maxDate)} label="Data End" metaQuery={websitePopupFormResponsesDataInformation.metaQuery} className="tw-col-span-4" />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">
                Typeform Responses
            </div>

            <Card information={numberToHumanFriendlyString(typeformResponsesDataInformation.count)} label="Count" metaQuery={typeformResponsesDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(typeformResponsesDataInformation.minDate)} label="Data Start" metaQuery={typeformResponsesDataInformation.metaQuery} className="tw-col-span-4" />

            <Card information={dateToMediumNoneEnFormat(typeformResponsesDataInformation.maxDate)} label="Data End" metaQuery={typeformResponsesDataInformation.metaQuery} className="tw-col-span-4" />
        </div>
    );
}
