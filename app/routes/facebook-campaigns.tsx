import type {MetaFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Link, useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {get_r1_facebookLeadsAmountSpent, get_r1_facebookLeadsCount, get_r1_facebookLeadsCountTrend, get_r1_facebookLeadsSales, get_r1_performanceLeadsAmountSpent, get_r1_performanceLeadsCount, get_r1_performanceLeadsCountTrend, get_r1_performanceLeadsSales, get_r2_assistedOrdersCount, get_r2_directOrdersCount, get_r2_r3_assistedOrdersRevenue, get_r2_r3_directOrdersRevenue, get_r4_facebookAdsLiveCampaignsCount, get_r4_facebookAdsSpends, get_r4_googleAdsLiveCampaignsCount, get_r4_googleAdsSpends} from "~/backend/business-insights";
import {getAllProductInformation, getAllSourceToInformation} from "~/backend/common";
import { getCampaignsInformation, getLeads, getSales } from "~/backend/facebook-campaigns";
import { joinValues } from "~/backend/utilities/utilities";
import {Card, FancyCalendar, FancySearchableMultiSelect, FancySearchableSelect} from "~/components/scratchpad";
import {concatenateNonNullStringsWithAmpersand, distinct, numberToHumanFriendlyString} from "~/utilities/utilities";
import {BarGraphComponent} from "./barGraphComponent";

export const meta: MetaFunction = () => {
    return {
        title: "Facebook Campaigns - Livpure Data Management",
    };
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const selectedCategoriesRaw = urlSearchParams.get("selected_categories");
    let selectedCategories;
    if (selectedCategoriesRaw == null || selectedCategoriesRaw.length == 0) {
        selectedCategories = [];
    } else {
        selectedCategories = JSON.parse(selectedCategoriesRaw);
    }

    const selectedProductsRaw = urlSearchParams.get("selected_products");
    let selectedProducts;
    if (selectedProductsRaw == null || selectedProductsRaw.length == 0) {
        selectedProducts = [];
    } else {
        selectedProducts = JSON.parse(selectedProductsRaw);
    }

    const selectedPlatformsRaw = urlSearchParams.get("selected_platforms");
    let selectedPlatforms;
    if (selectedPlatformsRaw == null || selectedPlatformsRaw.length == 0) {
        selectedPlatforms = [];
    } else {
        selectedPlatforms = JSON.parse(selectedPlatformsRaw);
    }

    const selectedCampaignsRaw = urlSearchParams.get("selected_campaigns");
    let selectedCampaigns;
    if (selectedCampaignsRaw == null || selectedCampaignsRaw.length == 0) {
        selectedCampaigns = [];
    } else {
        selectedCampaigns = JSON.parse(selectedCampaignsRaw);
    }

    const selectedGranularityRaw = urlSearchParams.get("selected_granularity");
    let selectedGranularity;
    if (selectedGranularityRaw == null || selectedGranularityRaw.length == 0) {
        selectedGranularity = "Daily";
    } else {
        selectedGranularity = selectedGranularityRaw;
    }

    const minDateRaw = urlSearchParams.get("min_date");
    let minDate;
    if (minDateRaw == null || minDateRaw.length == 0) {
        minDate = null;
    } else {
        minDate = minDateRaw;
    }

    const maxDateRaw = urlSearchParams.get("max_date");
    let maxDate;
    if (maxDateRaw == null || maxDateRaw.length == 0) {
        maxDate = null;
    } else {
        maxDate = maxDateRaw;
    }

    // TODO: Add filters

    return json({
        appliedSelectedCategories: selectedCategories,
        appliedSelectedProducts: selectedProducts,
        appliedSelectedPlatforms: selectedPlatforms,
        appliedSelectedCampaigns: selectedCampaigns,
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: minDate,
        appliedMaxDate: maxDate,
        allProductInformation: await getAllProductInformation(),
        allSourceInformation: await getAllSourceToInformation(),
        campaignsInformation: await getCampaignsInformation(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        leads: await getLeads(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        sales: await getSales(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
    });
};

export default function () {
    const {
        appliedSelectedCategories,
        appliedSelectedProducts,
        appliedSelectedPlatforms,
        appliedSelectedCampaigns,
        appliedSelectedGranularity,
        appliedMinDate,
        appliedMaxDate,
        allProductInformation,
        allSourceInformation,
        campaignsInformation,
        leads,
        sales,
    } = useLoaderData();

    // TODO: Add additional filtering to ensure this only shows facebook campaigns
    // TODO: Add additional filtering to remove on form fb leads

    const [selectedCategories, setSelectedCategories] = useState(appliedSelectedCategories);
    const [selectedProducts, setSelectedProducts] = useState(appliedSelectedProducts);
    const [selectedPlatforms, setSelectedPlatforms] = useState(appliedSelectedPlatforms);
    const [selectedCampaigns, setSelectedCampaigns] = useState(appliedSelectedCampaigns);
    const [selectedGranularity, setSelectedGranularity] = useState(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState(appliedMinDate ?? "");
    const [selectedMaxDate, setSelectedMaxDate] = useState(appliedMaxDate ?? "");

    // TODO: Update filters when changing another one

    const businesses = distinct(allProductInformation.map((productInformation) => productInformation.category));
    const products = allProductInformation
        .filter((productInformation) => selectedCategories.length == 0 || selectedCategories.includes(productInformation.category))
        .map((productInformation) => productInformation.productName);
    const platforms = distinct(allSourceInformation.map((sourceInformation) => sourceInformation.platform));
    const campaigns = distinct(
        allSourceInformation
            .filter((sourceInformation) => selectedPlatforms.length == 0 || selectedPlatforms.includes(sourceInformation.platform))
            .map((sourceInformation) => sourceInformation.campaignName)
    );
    const granularities = ["Daily", "Monthly", "Yearly"];

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-bg-[#2c1f54] tw-sticky tw-top-16 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                <FancySearchableMultiSelect label="Business" options={businesses} selectedOptions={selectedCategories} setSelectedOptions={setSelectedCategories} />

                <FancySearchableMultiSelect label="Product" options={products} selectedOptions={selectedProducts} setSelectedOptions={setSelectedProducts} />

                <FancySearchableMultiSelect label="Platform" options={platforms} selectedOptions={selectedPlatforms} setSelectedOptions={setSelectedPlatforms} />

                <FancySearchableMultiSelect label="Campaign" options={campaigns} selectedOptions={selectedCampaigns} setSelectedOptions={setSelectedCampaigns} />

                <FancySearchableSelect label="Granularity" options={granularities} selectedOption={selectedGranularity} setSelectedOption={setSelectedGranularity} />

                <FancyCalendar label="Start Date" value={selectedMinDate} setValue={setSelectedMinDate} />

                <FancyCalendar label="End Date" value={selectedMaxDate} setValue={setSelectedMaxDate} />

                <div />

                <Link
                    to={concatenateNonNullStringsWithAmpersand(
                        `/facebook-campaigns?selected_granularity=${selectedGranularity}`,
                        `min_date=${selectedMinDate}`,
                        `max_date=${selectedMaxDate}`,
                        selectedCampaigns.length == 0 ? null : `selected_campaigns=${JSON.stringify(selectedCampaigns)}`,
                        selectedCategories.length == 0 ? null : `selected_categories=${JSON.stringify(selectedCategories)}`,
                        selectedProducts.length == 0 ? null : `selected_products=${JSON.stringify(selectedProducts)}`,
                        selectedPlatforms.length == 0 ? null : `selected_platforms=${JSON.stringify(selectedPlatforms)}`
                    )}
                    className="-tw-col-end-1 tw-bg-lp tw-p-2 tw-rounded-md"
                >
                    Update Filters
                </Link>
            </div>

            <div className="tw-col-span-6 tw-grid tw-grid-cols-[1fr_2fr] tw-items-stretch tw-gap-x-4">
                <Card information={numberToHumanFriendlyString(campaignsInformation.amountSpent)} label="Spends" metaInformation={campaignsInformation.metaInformation} className="tw-row-start-1" />

                <Card information={numberToHumanFriendlyString(campaignsInformation.impressions)} label="Impressions" metaInformation={campaignsInformation.metaInformation} className="tw-row-start-2" />

                <Card information={numberToHumanFriendlyString(campaignsInformation.clicks)} label="Clicks" metaInformation={campaignsInformation.metaInformation} className="tw-row-start-3" />

                <Card information={numberToHumanFriendlyString(leads.count)} label="Leads" metaInformation={leads.metaInformation} className="tw-row-start-4" />

                <Card information={numberToHumanFriendlyString(sales.count)} label="Orders" metaInformation={sales.metaInformation} className="tw-row-start-5" />

                <div className="tw-row-start-1 tw-col-start-2 tw-bg-violet-700" />
                <div className="tw-row-start-1 tw-col-start-2 tw-text-white tw-grid tw-place-content-center tw-z-10">
                    <div>Amount Spent: ₹{numberToHumanFriendlyString(campaignsInformation.amountSpent)}</div>
                </div>

                <div className="tw-row-start-2 tw-col-start-2 tw-bg-blue-700" style={{clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)"}} />
                <div className="tw-row-start-2 tw-col-start-2 tw-text-white tw-z-10 tw-grid tw-place-content-center tw-text-center">
                    <div>Impressions: {numberToHumanFriendlyString(campaignsInformation.impressions)}</div>
                    <div>(CPI = ₹{numberToHumanFriendlyString(campaignsInformation.amountSpent / campaignsInformation.impressions, true)})</div>
                </div>

                <div className="tw-row-start-3 tw-col-start-2 tw-bg-cyan-600" style={{clipPath: "polygon(15% 0, 85% 0, 70% 100%, 30% 100%)"}} />
                <div className="tw-row-start-3 tw-col-start-2 tw-text-white tw-z-10 tw-grid tw-place-content-center tw-text-center">
                    <div>Clicks: {numberToHumanFriendlyString(campaignsInformation.clicks)}</div>
                    <div>(CTR = {numberToHumanFriendlyString(campaignsInformation.clicks / campaignsInformation.impressions, true, true, true)})</div>
                    <div>(CPC = ₹{numberToHumanFriendlyString(campaignsInformation.amountSpent / campaignsInformation.clicks, true)})</div>
                </div>

                <div className="tw-row-start-4 tw-col-start-2 tw-bg-emerald-600" style={{clipPath: "polygon(30% 0, 70% 0, 55% 100%, 45% 100%)"}} />
                <div className="tw-row-start-4 tw-col-start-2 tw-text-white tw-z-10 tw-grid tw-place-content-center tw-text-center">
                    <div>Leads: {numberToHumanFriendlyString(leads.count)}</div>
                    <div>(CPL = ₹{numberToHumanFriendlyString(campaignsInformation.amountSpent / leads.count, true)})</div>
                </div>

                <div className="tw-row-start-5 tw-col-start-2 tw-bg-lime-600" style={{clipPath: "polygon(45% 0, 55% 0, 55% 100%, 45% 100%)"}} />
                <div className="tw-row-start-5 tw-col-start-2 tw-text-white tw-z-10 tw-grid tw-place-content-center tw-text-center">
                    <div>Sales: {numberToHumanFriendlyString(sales.count)}</div>
                    <div>(CR = {numberToHumanFriendlyString(sales.count / leads.count, true, true, true)})</div>
                </div>
            </div>

            {/* <div className="tw-col-start-1 tw-col-span-12 tw-overflow-auto tw-bg-bg-100 tw-grid tw-items-center tw-h-[40rem]">
                <BarGraphComponent
                    data={{
                        x: r1_performanceLeadsCountTrend.rows.map((item) => item.date),
                        y: {
                            "Performance Leads": r1_performanceLeadsCountTrend.rows.map((item) => item.count),
                            "Facebook Leads": r1_facebookLeadsCountTrend.rows.map((item) => item.count),
                        },
                    }}
                    yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                    barWidth={20}
                    height={640}
                />
            </div> */}
        </div>
    );
}
