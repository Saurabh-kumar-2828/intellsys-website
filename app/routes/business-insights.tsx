import type {MetaFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Link, useLoaderData} from "@remix-run/react";
import {DateTime} from "luxon";
import {useState} from "react";
import {
    get_r1_facebookLeadsAmountSpent,
    get_r1_facebookLeadsCount,
    get_r1_facebookLeadsCountTrend,
    get_r1_facebookLeadsSales,
    get_r1_performanceLeadsAmountSpent,
    get_r1_performanceLeadsCount,
    get_r1_performanceLeadsCountTrend,
    get_r1_performanceLeadsSales,
    get_r2_assistedOrdersCount,
    get_r2_directOrdersCount,
    get_r2_r3_assistedOrdersGrossRevenue,
    get_r2_r3_directOrdersGrossRevenue,
    get_r4_facebookAdsLiveCampaignsCount,
    get_r4_facebookAdsRevenue,
    get_r4_facebookAdsSpends,
    get_r4_googleAdsLiveCampaignsCount,
    get_r4_googleAdsRevenue,
    get_r4_googleAdsSpends,
    r3_ordersRevenuePivotedByAssistAndBusiness,
} from "~/backend/business-insights";
import {getAllProductInformation, getAllSourceToInformation} from "~/backend/common";
import {joinValues} from "~/backend/utilities/utilities";
import {Card, FancyCalendar, FancySearchableMultiSelect, FancySearchableSelect, GenericCard, ValueDisplayingCard} from "~/components/scratchpad";
import { QueryFilterType, ValueDisplayingCardInformationType } from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithAmpersand, concatenateNonNullStringsWithSpaces, distinct, numberToHumanFriendlyString} from "~/utilities/utilities";
import {BarGraphComponent} from "./barGraphComponent";

export const meta: MetaFunction = () => {
    return {
        title: "Business Insights - Livpure Data Management",
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
        minDate = DateTime.now().startOf("month").toISODate();
    } else {
        minDate = minDateRaw;
    }

    const maxDateRaw = urlSearchParams.get("max_date");
    let maxDate;
    if (maxDateRaw == null || maxDateRaw.length == 0) {
        maxDate = DateTime.now().toISODate();
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
        r1_performanceLeadsCount: await get_r1_performanceLeadsCount(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r1_facebookLeadsCount: await get_r1_facebookLeadsCount(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r1_performanceLeadsAmountSpent: await get_r1_performanceLeadsAmountSpent(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r1_facebookLeadsAmountSpent: await get_r1_facebookLeadsAmountSpent(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r1_performanceLeadsSales: await get_r1_performanceLeadsSales(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r1_facebookLeadsSales: await get_r1_facebookLeadsSales(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r1_performanceLeadsCountTrend: await get_r1_performanceLeadsCountTrend(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r1_facebookLeadsCountTrend: await get_r1_facebookLeadsCountTrend(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r2_directOrdersCount: await get_r2_directOrdersCount(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r2_assistedOrdersCount: await get_r2_assistedOrdersCount(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r2_r3_directOrdersGrossRevenue: await get_r2_r3_directOrdersGrossRevenue(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r2_r3_assistedOrdersGrossRevenue: await get_r2_r3_assistedOrdersGrossRevenue(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r3_ordersRevenuePivotedByAssistAndBusiness: await r3_ordersRevenuePivotedByAssistAndBusiness(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r4_facebookAdsSpends: await get_r4_facebookAdsSpends(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r4_googleAdsSpends: await get_r4_googleAdsSpends(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r4_facebookAdsLiveCampaignsCount: await get_r4_facebookAdsLiveCampaignsCount(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r4_googleAdsLiveCampaignsCount: await get_r4_googleAdsLiveCampaignsCount(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r4_facebookAdsRevenue: await get_r4_facebookAdsRevenue(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r4_googleAdsRevenue: await get_r4_googleAdsRevenue(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
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
        r1_performanceLeadsCount,
        r1_facebookLeadsCount,
        r1_performanceLeadsAmountSpent,
        r1_facebookLeadsAmountSpent,
        r1_performanceLeadsSales,
        r1_facebookLeadsSales,
        r1_performanceLeadsCountTrend,
        r1_facebookLeadsCountTrend,
        r2_directOrdersCount,
        r2_assistedOrdersCount,
        r2_r3_directOrdersGrossRevenue,
        r2_r3_assistedOrdersGrossRevenue,
        r3_ordersRevenuePivotedByAssistAndBusiness,
        r4_facebookAdsSpends,
        r4_googleAdsSpends,
        r4_facebookAdsLiveCampaignsCount,
        r4_googleAdsLiveCampaignsCount,
        r4_facebookAdsRevenue,
        r4_googleAdsRevenue,
    } = useLoaderData();

    const numberOfSelectedDays = DateTime.fromISO(appliedMaxDate).diff(DateTime.fromISO(appliedMinDate), "days").toObject().days! + 1;

    const r1_totalLeadsCount = {
        metaInformation: `Performance Leads + Facebook Leads = ${numberToHumanFriendlyString(r1_performanceLeadsCount.count)} + ${numberToHumanFriendlyString(r1_facebookLeadsCount.count)}`,
        count: r1_performanceLeadsCount.count + r1_facebookLeadsCount.count,
    };
    const r1_performanceLeadsCpl = {
        metaInformation: `Amount Spent / Leads Count | Performance = ${numberToHumanFriendlyString(r1_performanceLeadsAmountSpent.amountSpent)} / ${numberToHumanFriendlyString(
            r1_performanceLeadsCount.count
        )}`,
        metaQuery: r1_performanceLeadsAmountSpent.metaQuery,
        cpl: r1_performanceLeadsAmountSpent.amountSpent / r1_performanceLeadsCount.count,
    };
    const r1_facebookLeadsCpl = {
        metaInformation: `Amount Spent / Leads Count | Facebook = ${numberToHumanFriendlyString(r1_facebookLeadsAmountSpent.amountSpent)} / ${numberToHumanFriendlyString(
            r1_facebookLeadsCount.count
        )}`,
        metaQuery: r1_facebookLeadsAmountSpent.metaQuery,
        cpl: r1_facebookLeadsAmountSpent.amountSpent / r1_facebookLeadsCount.count,
    };
    const r1_performanceLeadsSpl = {
        metaInformation: `Leads Sales / Leads Count | Performance = ${numberToHumanFriendlyString(r1_performanceLeadsSales.netSales)} / ${numberToHumanFriendlyString(r1_performanceLeadsCount.count)}`,
        spl: r1_performanceLeadsSales.netSales / r1_performanceLeadsCount.count,
    };
    const r1_facebookLeadsSpl = {
        metaInformation: `Leads Sales / Leads Count | Facebook = ${numberToHumanFriendlyString(r1_facebookLeadsSales.netSales)} / ${numberToHumanFriendlyString(r1_facebookLeadsCount.count)}`,
        spl: r1_facebookLeadsSales.netSales / r1_facebookLeadsCount.count,
    };
    const r1_performanceLeadsAcos = {
        metaInformation: `Amount Spent / Net Sales | Facebook = ${numberToHumanFriendlyString(r1_performanceLeadsAmountSpent.amountSpent)} / ${numberToHumanFriendlyString(
            r1_performanceLeadsSales.netSales
        )}`,
        acos: r1_performanceLeadsAmountSpent.amountSpent / r1_performanceLeadsSales.netSales,
    };
    const r1_facebookLeadsAcos = {
        metaInformation: `Amount Spent / Net Sales | Facebook = ${numberToHumanFriendlyString(r1_facebookLeadsAmountSpent.amountSpent)} / ${numberToHumanFriendlyString(
            r1_facebookLeadsSales.netSales
        )}`,
        acos: r1_facebookLeadsAmountSpent.amountSpent / r1_facebookLeadsSales.netSales,
    };

    const r2_totalOrdersCount = {
        metaInformation: `Direct Orders + Assisted Orders = ${numberToHumanFriendlyString(r2_directOrdersCount.count)} + ${numberToHumanFriendlyString(r2_assistedOrdersCount.count)}`,
        count: r2_directOrdersCount.count + r2_assistedOrdersCount.count,
    };
    const r2_directOrdersAov = {
        metaInformation: `Orders Revenue / Orders Count | Direct = ${numberToHumanFriendlyString(r2_r3_directOrdersGrossRevenue.netSales)} / ${numberToHumanFriendlyString(r2_directOrdersCount.count)}`,
        aov: r2_r3_directOrdersGrossRevenue.netSales / r2_directOrdersCount.count,
    };
    const r2_assistedOrdersAov = {
        metaInformation: `Orders Revenue / Orders Count | Assisted = ${numberToHumanFriendlyString(r2_r3_assistedOrdersGrossRevenue.netSales)} / ${numberToHumanFriendlyString(
            r2_assistedOrdersCount.count
        )}`,
        aov: r2_r3_assistedOrdersGrossRevenue.netSales / r2_assistedOrdersCount.count,
    };
    const r2_directOrdersDrr = {
        metaInformation: `Orders Revenue / Number of Days | Direct = ${numberToHumanFriendlyString(r2_r3_directOrdersGrossRevenue.netSales)} / ${numberToHumanFriendlyString(
            numberOfSelectedDays
        )}`,
        drr: r2_r3_directOrdersGrossRevenue.netSales / numberOfSelectedDays,
    };
    const r2_assistedOrdersDrr = {
        metaInformation: `Orders Revenue / Number of Days | Assisted = ${numberToHumanFriendlyString(r2_r3_assistedOrdersGrossRevenue.netSales)} / ${numberToHumanFriendlyString(
            numberOfSelectedDays
        )}`,
        drr: r2_r3_assistedOrdersGrossRevenue.netSales / numberOfSelectedDays,
    };

    function getNetRevenue(row): number {
        let multiplier;

        if (row.category == "Mattress" || row.category == "Non Mattress") {
            multiplier = 8.5;
        } else if (row.category == "Water Purifier") {
            multiplier = 5;
        } else if (row.category == "Appliances") {
            // TODO: Replace with correct value
            multiplier = 0;
        } else if (row.category == null) {
            // TODO: Remove
            multiplier = 0;
        } else {
            throw new Error(`Multiplier for category ${row.category} not specified!`);
        }

        return (row.netSales / 1.18) * (1 - multiplier / 100);
    }

    // const r3_directOrdersNetRevenue = r2_r3_directOrdersGrossRevenue / r2_directOrdersCount.count;
    // const r3_assistedOrdersNetRevenue = r2_r3_assistedOrdersGrossRevenue / r2_assistedOrdersCount;
    const r3_directOrdersNetRevenue = {
        metaInformation: "",
        netRevenue: r3_ordersRevenuePivotedByAssistAndBusiness.rows.filter(row => row.isAssisted == false).reduce((partialSum: number, row) => partialSum + getNetRevenue(row), 0),
    };
    const r3_assistedOrdersNetRevenue = {
        metaInformation: "",
        netRevenue: r3_ordersRevenuePivotedByAssistAndBusiness.rows.filter(row => row.isAssisted == true).reduce((partialSum: number, row) => partialSum + getNetRevenue(row), 0),
    };
    const r3_totalNetRevenue = {
        metaInformation: "",
        netRevenue: r3_directOrdersNetRevenue.netRevenue + r3_assistedOrdersNetRevenue.netRevenue,
    };

    const r4_netSpends = {
        metaInformation: `Facebook Ads Spends + Google Ads Spends = ${r4_facebookAdsSpends.amountSpent} + ${r4_googleAdsSpends.amountSpent}`,
        amountSpent: r4_facebookAdsSpends.amountSpent + r4_googleAdsSpends.amountSpent,
    };
    const r4_facebookAdsDailySpend = {
        metaInformation: `Total Spend / Number of Days | Facebook = ${r4_facebookAdsSpends.amountSpent} / ${numberOfSelectedDays}`,
        amountSpent: r4_facebookAdsSpends.amountSpent / numberOfSelectedDays,
    };
    const r4_googleAdsDailySpend = {
        metaInformation: `Total Spend / Number of Days | Google = ${r4_googleAdsSpends.amountSpent} / ${numberOfSelectedDays}`,
        amountSpent: r4_googleAdsSpends.amountSpent / numberOfSelectedDays,
    };
    const r4_facebookAdsAcos = {
        metaInformation: `Total Spend / Revenue | Facebook = ${r4_facebookAdsSpends.amountSpent} / ${r4_facebookAdsRevenue.netSales}`,
        acos: r4_facebookAdsSpends.amountSpent / r4_facebookAdsRevenue.netSales,
    };
    const r4_googleAdsAcos = {
        metaInformation: `Total Spend / Revenue | Google = ${r4_googleAdsSpends.amountSpent} / ${r4_googleAdsRevenue.netSales}`,
        acos: r4_googleAdsSpends.amountSpent / r4_googleAdsRevenue.netSales,
    };;

    const r5_marketingAcos = "?";
    const r5_facebookAcos = "?";
    const r5_agentAcos = "?";
    const r5_googleAcos = "?";
    const r5_highestAcos = "?";
    const r5_lowestAcos = "?";
    const r5_netAcos = "?";

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
            .filter((sourceInformation) => selectedCategories.length == 0 || selectedCategories.includes(sourceInformation.category))
            .filter((sourceInformation) => selectedPlatforms.length == 0 || selectedPlatforms.includes(sourceInformation.platform))
            .map((sourceInformation) => sourceInformation.campaignName)
    );
    const granularities = ["Daily", "Weekly", "Monthly", "Yearly"];

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-bg-[#2c1f54] tw-sticky tw-top-16 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                <FancySearchableMultiSelect label="Business" options={businesses} selectedOptions={selectedCategories} setSelectedOptions={setSelectedCategories} filterType={QueryFilterType.category} />

                <FancySearchableMultiSelect label="Product" options={products} selectedOptions={selectedProducts} setSelectedOptions={setSelectedProducts} filterType={QueryFilterType.product} />

                <FancySearchableMultiSelect label="Platform" options={platforms} selectedOptions={selectedPlatforms} setSelectedOptions={setSelectedPlatforms} filterType={QueryFilterType.platform} />

                <FancySearchableMultiSelect label="Campaign" options={campaigns} selectedOptions={selectedCampaigns} setSelectedOptions={setSelectedCampaigns} filterType={QueryFilterType.campaign} />

                <FancySearchableSelect label="Granularity" options={granularities} selectedOption={selectedGranularity} setSelectedOption={setSelectedGranularity} />

                <FancyCalendar label="Start Date" value={selectedMinDate} setValue={setSelectedMinDate} />

                <FancyCalendar label="End Date" value={selectedMaxDate} setValue={setSelectedMaxDate} />

                <div />

                <Link
                    to={concatenateNonNullStringsWithAmpersand(
                        `/business-insights?selected_granularity=${selectedGranularity}`,
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

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Leads</div>

            <Card
                information={numberToHumanFriendlyString(r1_totalLeadsCount.count)}
                label="Total Leads"
                metaInformation={r1_totalLeadsCount.metaInformation}
                className="tw-row-span-2 tw-col-span-4"
            />

            <ValueDisplayingCard
                queryInformation={r1_performanceLeadsCount}
                contentExtractor={queryInformation => queryInformation.count}
                type={ValueDisplayingCardInformationType.integer}
                label="Performance Leads"
                className="tw-col-span-2"
            />

            <Card
                information={numberToHumanFriendlyString(r1_performanceLeadsCpl.cpl, true)}
                label="Performance Leads CPL"
                metaInformation={r1_performanceLeadsCpl.metaInformation}
                metaQuery={r1_performanceLeadsCpl.metaQuery}
                className="tw-col-span-2"
            />

            <Card
                information={numberToHumanFriendlyString(r1_performanceLeadsSpl.spl, true)}
                label="Performance Leads SPL"
                metaInformation={r1_performanceLeadsSpl.metaInformation}
                className="tw-col-span-2"
            />

            <Card
                information={numberToHumanFriendlyString(r1_performanceLeadsAcos.acos, true, true, true)}
                label="Performance Leads ACoS"
                metaInformation={r1_performanceLeadsAcos.metaInformation}
                className="tw-col-span-2"
            />

            <Card information={numberToHumanFriendlyString(r1_facebookLeadsCount.count)} label="Facebook Leads" metaQuery={r1_facebookLeadsCount.metaQuery} className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(r1_facebookLeadsCpl.cpl, true)}
                label="Facebook Leads CPL"
                metaInformation={r1_facebookLeadsCpl.metaInformation}
                metaQuery={r1_facebookLeadsCpl.metaQuery}
                className="tw-col-span-2"
            />

            <Card information={numberToHumanFriendlyString(r1_facebookLeadsSpl.spl, true)} label="Facebook Leads SPL" metaInformation={r1_facebookLeadsSpl.metaInformation} className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(r1_facebookLeadsAcos.acos, true, true, true)}
                label="Facebook Leads ACoS"
                metaInformation={r1_facebookLeadsAcos.metaInformation}
                className="tw-col-span-2"
            />

            {/* <div className="tw-col-start-1 tw-col-span-12 tw-overflow-auto tw-bg-bg-100 tw-grid tw-items-center tw-h-[40rem]">
                <BarGraphComponent
                    data={{
                        x: r1_performanceLeadsCountTrend.rows.map(row => item.date),
                        y: {
                            "Performance Leads": r1_performanceLeadsCountTrend.rows.map(row => row.count),
                            "Facebook Leads": r1_facebookLeadsCountTrend.rows.map(row => row.count),
                        },
                    }}
                    yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                    barWidth={20}
                    height={640}
                />
            </div> */}

            <GenericCard
                className="tw-col-span-12"
                content={
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
                }
                metaQuery={r1_performanceLeadsCountTrend.metaQuery}
            />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Orders</div>

            <Card
                information={numberToHumanFriendlyString(r2_totalOrdersCount.count)}
                label="Total Orders"
                metaInformation={r2_totalOrdersCount.metaInformation}
                className="tw-row-span-2 tw-col-span-4"
            />

            <Card information={numberToHumanFriendlyString(r2_directOrdersCount.count)} label="Direct Orders" metaQuery={r2_directOrdersCount.metaQuery} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_directOrdersAov.aov, true)} label="AOV" metaInformation={r2_directOrdersAov.metaInformation} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_directOrdersDrr.drr, true)} label="DRR" metaInformation={r2_directOrdersDrr.metaInformation} className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_assistedOrdersCount.count)} label="Assisted Orders" metaQuery={r2_assistedOrdersCount.metaQuery} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_assistedOrdersAov.aov, true)} label="AOV" metaInformation={r2_assistedOrdersAov.metaInformation} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_assistedOrdersDrr.drr, true)} label="DRR" metaInformation={r2_assistedOrdersDrr.metaInformation} className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            {/* <div className="tw-col-start-1 tw-col-span-12 tw-overflow-auto tw-bg-bg-100 tw-grid tw-items-center tw-h-[40rem]">
                <BarGraphComponent
                    data={{
                        x: r1_performanceLeadsCountTrend.map(row => row.date),
                        y: {
                            "Dummy 1": r1_performanceLeadsCountTrend.map((row, rowIndex) => 0.5 + 0.25 * Math.sin(rowIndex * 2 * 3.141 / 20)),
                            "Dummy 2": r1_performanceLeadsCountTrend.map((row, rowIndex) => 0.5 + 0.25 * Math.sin(0.5 + rowIndex * 2 * 3.141 / 20)),
                        },
                    }}
                    yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                    barWidth={40}
                    height={640}
                />
            </div> */}

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Revenue</div>

            <Card information={numberToHumanFriendlyString(r3_totalNetRevenue.netRevenue)} label="Total Net Revenue" metaInformation={r3_totalNetRevenue.metaInformation} className="tw-row-span-2 tw-col-span-4" />

            <Card
                information={numberToHumanFriendlyString(r2_r3_directOrdersGrossRevenue.netSales, true)}
                label="Direct Gross Revenue"
                metaQuery={r2_r3_directOrdersGrossRevenue.metaQuery}
                className="tw-col-span-2"
            />

            <Card information={numberToHumanFriendlyString(r3_directOrdersNetRevenue.netRevenue, true)} label="Net Direct Revenue" metaInformation={r3_directOrdersNetRevenue.metaInformation} className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(r2_r3_assistedOrdersGrossRevenue.netSales, true)}
                label="Assisted Gross Revenue"
                metaQuery={r2_r3_assistedOrdersGrossRevenue.metaQuery}
                className="tw-col-span-2"
            />

            <Card information={numberToHumanFriendlyString(r3_assistedOrdersNetRevenue.netRevenue, true)} label="Net Assisted Revenue" metaInformation={r3_assistedOrdersNetRevenue.metaInformation} className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            {/* <div className="tw-col-start-1 tw-col-span-12 tw-overflow-auto tw-bg-bg-100 tw-grid tw-items-center tw-h-[40rem]">
                <BarGraphComponent
                    data={{
                        x: r1_performanceLeadsCountTrend.map(row => row.date),
                        y: {
                            "Dummy 1": r1_performanceLeadsCountTrend.map((row, rowIndex) => 0.5 + 0.25 * Math.sin(rowIndex * 2 * 3.141 / 20)),
                            "Dummy 2": r1_performanceLeadsCountTrend.map((row, rowIndex) => 0.5 + 0.25 * Math.sin(0.5 + rowIndex * 2 * 3.141 / 20)),
                       },
                    }}
                    yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                    barWidth={40}
                    height={640}
                />
            </div> */}

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Spend</div>

            <Card information={numberToHumanFriendlyString(r4_netSpends.amountSpent)} label="Net Spend" metaInformation={r4_netSpends.metaInformation} className="tw-row-span-2 tw-col-span-4" />

            <Card information={numberToHumanFriendlyString(r4_facebookAdsSpends.amountSpent)} label="Facebook Ads" metaQuery={r4_facebookAdsSpends.metaQuery} className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(r4_facebookAdsLiveCampaignsCount.count)}
                label="Live Campaigns"
                metaQuery={r4_facebookAdsLiveCampaignsCount.metaQuery}
                className="tw-col-span-2"
            />

            <Card information={numberToHumanFriendlyString(r4_facebookAdsDailySpend.amountSpent, true)} label="Daily Spend" metaInformation={r4_facebookAdsDailySpend.metaInformation} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r4_facebookAdsAcos.acos, true, true, true)} label="ACoS" metaInformation={r4_facebookAdsAcos.metaInformation} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r4_googleAdsSpends.amountSpent)} label="Google Ads" metaQuery={r4_googleAdsSpends.metaQuery} className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(r4_googleAdsLiveCampaignsCount.count)}
                label="Live Campaigns"
                metaQuery={r4_googleAdsLiveCampaignsCount.metaQuery}
                className="tw-col-span-2"
            />

            <Card information={numberToHumanFriendlyString(r4_googleAdsDailySpend.amountSpent, true)} label="Daily Spend" metaInformation={r4_googleAdsDailySpend.metaInformation} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r4_googleAdsAcos.acos, true, true, true)} label="ACoS" metaInformation={r4_googleAdsAcos.metaInformation} className="tw-col-span-2" />

            {/* <div className="tw-col-start-1 tw-col-span-12 tw-overflow-auto tw-bg-bg-100 tw-grid tw-items-center tw-h-[40rem]">
                <BarGraphComponent
                    data={{
                        x: r1_performanceLeadsCountTrend.map(row => row.date),
                        y: {
                            "Dummy 1": r1_performanceLeadsCountTrend.map((row, rowIndex) => 0.5 + 0.25 * Math.sin(rowIndex * 2 * 3.141 / 20)),
                            "Dummy 2": r1_performanceLeadsCountTrend.map((row, rowIndex) => 0.5 + 0.25 * Math.sin(0.5 + rowIndex * 2 * 3.141 / 20)),
                        },
                    }}
                    yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                    barWidth={40}
                    height={640}
                />
            </div> */}

            {/* <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">ACoS</div>

            <Card information={numberToHumanFriendlyString(r5_netAcos)} label="Net ACoS" className="tw-row-span-2 tw-col-span-4" />

            <Card information={numberToHumanFriendlyString(r5_marketingAcos)} label="Marketing ACoS" className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r5_agentAcos, true)} label="Agent ACoS" className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r5_highestAcos, true)} label="Highest ACoS" className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r5_facebookAcos)} label="Facebook ACoS" className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r5_googleAcos, true)} label="Google ACoS" className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r5_lowestAcos, true)} label="Lowest ACoS" className="tw-col-span-2" />

            <div className="tw-col-span-2" /> */}

            {/* <div className="tw-col-start-1 tw-col-span-12 tw-overflow-auto tw-bg-bg-100 tw-grid tw-items-center tw-h-[40rem]">
                <BarGraphComponent
                    data={{
                        x: r1_performanceLeadsCountTrend.map(row => item.date),
                        y: {
                            "Dummy 1": r1_performanceLeadsCountTrend.map((row, rowIndex) => 0.5 + 0.25 * Math.sin(rowIndex * 2 * 3.141 / 20)),
                            "Dummy 2": r1_performanceLeadsCountTrend.map((row, rowIndex) => 0.5 + 0.25 * Math.sin(0.5 + rowIndex * 2 * 3.141 / 20)),
                        },
                    }}
                    yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                    barWidth={40}
                    height={640}
                />
            </div> */}
        </div>
    );
}
