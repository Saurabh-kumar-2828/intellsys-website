import type {LoaderFunction, MetaFunction} from "@remix-run/node";
import * as Tabs from "@radix-ui/react-tabs";
import {json} from "@remix-run/node";
import {Link, useLoaderData} from "@remix-run/react";
import {DateTime} from "luxon";
import {useState} from "react";
import {
    get_shopifyData,
    get_freshSalesData,
    get_adsData,
    getOrdersRevenue,
} from "~/backend/business-insights";
import {getAllProductInformation, getAllSourceToInformation} from "~/backend/common";
import {BarGraphComponent} from "~/components/reusableComponents/barGraphComponent";
import {Card, FancyCalendar, FancySearchableMultiSelect, FancySearchableSelect, GenericCard, ValueDisplayingCard} from "~/components/scratchpad";
import {QueryFilterType, ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithAmpersand, distinct, numberToHumanFriendlyString} from "~/utilities/utilities";

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
        freshSalesLeadsData: await get_freshSalesData(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        r3_ordersRevenue: await getOrdersRevenue(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        adsData: await get_adsData(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
        shopifyData: await get_shopifyData(selectedCategories, selectedProducts, selectedPlatforms, selectedCampaigns, selectedGranularity, minDate, maxDate),
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
        freshSalesLeadsData,
        r3_ordersRevenue,
        adsData,
        shopifyData,
    } = useLoaderData();

    function helperAggregateByDate(result, item){
        let date= (result[item.date] || []);
        date.push(item);
        result[item.date] = date;
        return result;
    }

    function aggregateByDate(array: Array<object>, param:string){
        const result=[]
        let arrayAggregateByDate : any = array.reduce(helperAggregateByDate,{});
        for(const item in arrayAggregateByDate){
            let paramValue = arrayAggregateByDate[item].reduce((total, sum) => total+ sum[`${param}`], 0);
            let date = item;

            result.push({
                param: paramValue,
                "date": date
            });
        }
        return result;
    }

    //TO DO: correct its implementation
    function match2(input: string, pattern: string){
        return input.match(pattern)? null: pattern;
    }

    const adsDataGoogleSpends= aggregateByDate(adsData.rows.filter((row) => row.platform=='Google'), "amountSpent");
    const adsDataFacebookSpends= aggregateByDate(adsData.rows.filter((row) => row.platform=='Facebook'), "amountSpent");

    const numberOfSelectedDays = DateTime.fromISO(appliedMaxDate).diff(DateTime.fromISO(appliedMinDate), "days").toObject().days! + 1;
    const performanceLeadsCount = {
        count: aggregateByDate(freshSalesLeadsData.rows.filter((row) => row.source!='Facebook Ads'), "count").reduce((sum, item) => sum + item.param, 0),
        metaInformation: "performance leads",
    };



    const facebookLeadsCount = {
        count: freshSalesLeadsData.rows.filter((row) => row.source=='Facebook Ads').reduce((sum, item) => sum + item.count, 0),
        metaInformation: "facebook leads",
    };

    const totalLeadsCount = {
        metaInformation: `Performance Leads + Facebook Leads = ${numberToHumanFriendlyString(performanceLeadsCount.count)} + ${numberToHumanFriendlyString(facebookLeadsCount.count)}`,
        count: performanceLeadsCount.count + facebookLeadsCount.count,
    };

    const directOrders = aggregateByDate(shopifyData.rows.filter((row) => row.isAssisted == false), "count");
    const assistedOrders = aggregateByDate(shopifyData.rows.filter((row) => row.isAssisted == true), "count");
    const directOrdersTotalCount = {
        count: directOrders.reduce((sum, item) => sum + item.param, 0),
    };

    const assistedOrdersTotalCount = {
        count: assistedOrders.reduce((sum, item) => sum + item.param, 0),
    };

    const r4_facebookAdsRevenue = {
        netSales: shopifyData.rows.filter((row) => row.sourcePlatform=='Facebook' && row.netSales>0).reduce((sum, item) => sum + item.netSales, 0),
    };

    const r4_googleAdsRevenue = {
        netSales: shopifyData.rows.filter((row) => row.sourcePlatform=='Google' && row.netSales>0).reduce((sum, item) => sum + item.netSales, 0),
    };

    const r1_performanceLeadsSales = {
        netSales: shopifyData.rows.filter((row) => row.source !='GJ_LeadGen_18May' && row.source != 'GJ_LeadGen_Mattress_10 May' && row.source != match2(row.source, "/^Freshsales - .* - Facebook Ads$/")).reduce((sum, item) => sum + item.netSales, 0),

    };

    const r1_facebookLeadsSales = {
        netSales: shopifyData.rows.filter((row) => row.source =='GJ_LeadGen_18May' || row.source == 'GJ_LeadGen_Mattress_10 May' || row.source == match2(row.source, "/^Freshsales - .* - Facebook Ads$/")).reduce((sum, item) => sum + item.netSales, 0),
    };

    const googleAdsSpends = {
        amountSpent: adsDataGoogleSpends.reduce((sum, item) => sum + item.param, 0),
    };

    const facebookAdsSpends = {
        amountSpent: adsDataFacebookSpends.reduce((sum, item) => sum + item.param, 0),
    };

    const r1_performanceLeadsAmountSpent = {
        amountSpent: adsData.rows.filter((row) => row.campaignName != 'GJ_LeadGen_18May' && row.campaignName != 'GJ_LeadGen_Mattress_10 May').reduce((sum, item) => sum + item.amountSpent, 0),
    }

    const r1_facebookLeadsAmountSpent = {
        amountSpent: adsData.rows.filter((row) => row.campaignName == 'GJ_LeadGen_18May' || row.campaignName == 'GJ_LeadGen_Mattress_10 May').reduce((sum, item) => sum + item.amountSpent, 0),
    }

    const r4_facebookAdsLiveCampaignsCount = {
        count: distinct(adsData.rows.filter((row) => row.platform == 'Facebook' && row.amountSpent>0).map((row) => row.campaignName)).length,
    }

    const r4_googleAdsLiveCampaignsCount = {
        count: distinct(adsData.rows.filter((row) => row.platform == 'Google' && row.amountSpent>0).map((row) => row.campaignName)).length,
    }

    const directOrdersGrossRevenue = {
        netSales: r3_ordersRevenue.rows.filter((row) => row.isAssisted == false).reduce((sum, item) => sum + item.netSales, 0),
    };

    const assistedOrdersGrossRevenue = {
        netSales: r3_ordersRevenue.rows.filter((row) => row.isAssisted == true).reduce((sum, item) => sum + item.netSales, 0),
    };

    const r1_performanceLeadsCpl = {
        metaInformation: `Amount Spent / Leads Count | Performance = ${numberToHumanFriendlyString(r1_performanceLeadsAmountSpent.amountSpent)} / ${numberToHumanFriendlyString(
            performanceLeadsCount.count
        )}`,
        metaQuery: adsData.metaQuery,
        cpl: r1_performanceLeadsAmountSpent.amountSpent / performanceLeadsCount.count,
    };
    const r1_facebookLeadsCpl = {
        metaInformation: `Amount Spent / Leads Count | Facebook = ${numberToHumanFriendlyString(r1_facebookLeadsAmountSpent.amountSpent)} / ${numberToHumanFriendlyString(facebookLeadsCount.count)}`,
        metaQuery: adsData.metaQuery,
        cpl: r1_facebookLeadsAmountSpent.amountSpent / facebookLeadsCount.count,
    };
    const r1_performanceLeadsSpl = {
        metaInformation: `Leads Sales / Leads Count | Performance = ${numberToHumanFriendlyString(r1_performanceLeadsSales.netSales)} / ${numberToHumanFriendlyString(performanceLeadsCount.count)}`,
        spl: r1_performanceLeadsSales.netSales / performanceLeadsCount.count,
    };
    const r1_facebookLeadsSpl = {
        metaInformation: `Leads Sales / Leads Count | Facebook = ${numberToHumanFriendlyString(r1_facebookLeadsSales.netSales)} / ${numberToHumanFriendlyString(facebookLeadsCount.count)}`,
        spl: r1_facebookLeadsSales.netSales / facebookLeadsCount.count,
    };
    const r1_performanceLeadsAcos = {
        metaInformation: `Amount Spent / Net Sales | Performance = ${numberToHumanFriendlyString(r1_performanceLeadsAmountSpent.amountSpent)} / ${numberToHumanFriendlyString(
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
        metaInformation: `Direct Orders + Assisted Orders = ${numberToHumanFriendlyString(directOrdersTotalCount.count)} + ${numberToHumanFriendlyString(assistedOrdersTotalCount.count)}`,
        count: directOrdersTotalCount.count + assistedOrdersTotalCount.count,
    };
    const r2_directOrdersAov = {
        metaInformation: `Orders Revenue / Orders Count | Direct = ${numberToHumanFriendlyString(directOrdersGrossRevenue.netSales)} / ${numberToHumanFriendlyString(directOrdersTotalCount.count)}`,
        aov: directOrdersGrossRevenue.netSales / directOrdersTotalCount.count,
    };
    const r2_assistedOrdersAov = {
        metaInformation: `Orders Revenue / Orders Count | Assisted = ${numberToHumanFriendlyString(assistedOrdersGrossRevenue.netSales)} / ${numberToHumanFriendlyString(assistedOrdersTotalCount.count)}`,
        aov: assistedOrdersGrossRevenue.netSales / assistedOrdersTotalCount.count,
    };
    const r2_directOrdersDrr = {
        metaInformation: `Orders Revenue / Number of Days | Direct = ${numberToHumanFriendlyString(directOrdersGrossRevenue.netSales)} / ${numberToHumanFriendlyString(numberOfSelectedDays)}`,
        drr: directOrdersGrossRevenue.netSales / numberOfSelectedDays,
    };
    const r2_assistedOrdersDrr = {
        metaInformation: `Orders Revenue / Number of Days | Assisted = ${numberToHumanFriendlyString(assistedOrdersGrossRevenue.netSales)} / ${numberToHumanFriendlyString(numberOfSelectedDays)}`,
        drr: assistedOrdersGrossRevenue.netSales / numberOfSelectedDays,
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
        netRevenue: r3_ordersRevenue.rows.filter((row) => row.isAssisted == false).reduce((partialSum: number, row) => partialSum + getNetRevenue(row), 0),
    };
    const r3_assistedOrdersNetRevenue = {
        metaInformation: "",
        netRevenue: r3_ordersRevenue.rows.filter((row) => row.isAssisted == true).reduce((partialSum: number, row) => partialSum + getNetRevenue(row), 0),
    };
    const r3_totalNetRevenue = {
        metaInformation: "",
        netRevenue: r3_directOrdersNetRevenue.netRevenue + r3_assistedOrdersNetRevenue.netRevenue,
    };

    const r4_netSpends = {
        metaInformation: `Facebook Ads Spends + Google Ads Spends = ${facebookAdsSpends.amountSpent} + ${googleAdsSpends.amountSpent}`,
        amountSpent: facebookAdsSpends.amountSpent + googleAdsSpends.amountSpent,
    };
    const r4_facebookAdsDailySpend = {
        metaInformation: `Total Spend / Number of Days | Facebook = ${facebookAdsSpends.amountSpent} / ${numberOfSelectedDays}`,
        amountSpent: facebookAdsSpends.amountSpent / numberOfSelectedDays,
    };
    const r4_googleAdsDailySpend = {
        metaInformation: `Total Spend / Number of Days | Google = ${googleAdsSpends.amountSpent} / ${numberOfSelectedDays}`,
        amountSpent: googleAdsSpends.amountSpent / numberOfSelectedDays,
    };
    const r4_facebookAdsAcos = {
        metaInformation: `Total Spend / Revenue | Facebook = ${facebookAdsSpends.amountSpent} / ${r4_facebookAdsRevenue.netSales}`,
        acos: facebookAdsSpends.amountSpent / r4_facebookAdsRevenue.netSales,
    };
    const r4_googleAdsAcos = {
        metaInformation: `Total Spend / Revenue | Google = ${googleAdsSpends.amountSpent} / ${r4_googleAdsRevenue.netSales}`,
        acos: googleAdsSpends.amountSpent / r4_googleAdsRevenue.netSales,
    };

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
                <FancySearchableMultiSelect
                    label="Business"
                    options={businesses}
                    selectedOptions={selectedCategories}
                    setSelectedOptions={setSelectedCategories}
                    filterType={QueryFilterType.category}
                />

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

            <Card information={numberToHumanFriendlyString(totalLeadsCount.count)} label="Total Leads" metaInformation={totalLeadsCount.metaInformation} className="tw-row-span-2 tw-col-span-4" />

            <Card information={numberToHumanFriendlyString(performanceLeadsCount.count)} label="Performance Leads" metaInformation={performanceLeadsCount.metaInformation} className="tw-col-span-2" />

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

            <Card information={numberToHumanFriendlyString(facebookLeadsCount.count)} label="Facebook Leads" metaInformation={facebookLeadsCount.metaInformation} className="tw-col-span-2" />

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

            <GenericCard
                className="tw-col-span-12"
                content={
                    <BarGraphComponent
                        data={{
                            x: freshSalesLeadsData.rows.filter((row) => row.source=='Facebook Ads').map((item) => item.date),
                            y: {
                                "Performance Leads": aggregateByDate(freshSalesLeadsData.rows.filter((row) => row.source!='Facebook Ads'), "count").map((item) => item.param),
                                "Facebook Leads": freshSalesLeadsData.rows.filter((row) => row.source=='Facebook Ads').map((item) => item.count),
                            },
                        }}
                        yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                        barWidth={20}
                        height={640}
                    />
                }
                metaQuery={freshSalesLeadsData.metaQuery}
            />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Orders</div>

            <Card
                information={numberToHumanFriendlyString(r2_totalOrdersCount.count)}
                label="Total Orders"
                metaInformation={r2_totalOrdersCount.metaInformation}
                className="tw-row-span-2 tw-col-span-4"
            />

            <Card information={numberToHumanFriendlyString(directOrdersTotalCount.count)} label="Direct Orders" metaQuery={shopifyData.metaQuery} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_directOrdersAov.aov, true)} label="AOV" metaInformation={r2_directOrdersAov.metaInformation} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_directOrdersDrr.drr, true)} label="DRR" metaInformation={r2_directOrdersDrr.metaInformation} className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(assistedOrdersTotalCount.count)} label="Assisted Orders" metaQuery={shopifyData.metaQuery} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_assistedOrdersAov.aov, true)} label="AOV" metaInformation={r2_assistedOrdersAov.metaInformation} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(r2_assistedOrdersDrr.drr, true)} label="DRR" metaInformation={r2_assistedOrdersDrr.metaInformation} className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <GenericCard
                className="tw-col-span-12"
                content={
                    <BarGraphComponent
                        data={{
                            x: directOrders.map((item) => item.date, 0),
                            y: {
                                "Direct Orders": directOrders.map((item) => item.param),
                                "Assisted Orders": assistedOrders.map((item) => item.param),
                            },
                        }}
                        yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                        barWidth={20}
                        height={640}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Revenue</div>

            <Card
                information={numberToHumanFriendlyString(r3_totalNetRevenue.netRevenue)}
                label="Total Net Revenue"
                metaInformation={r3_totalNetRevenue.metaInformation}
                className="tw-row-span-2 tw-col-span-4"
            />

            <Card information={numberToHumanFriendlyString(directOrdersGrossRevenue.netSales, true)} label="Direct Gross Revenue" metaQuery={r3_ordersRevenue.metaQuery} className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(r3_directOrdersNetRevenue.netRevenue, true)}
                label="Net Direct Revenue"
                metaInformation={r3_directOrdersNetRevenue.metaInformation}
                className="tw-col-span-2"
            />

            <div className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(assistedOrdersGrossRevenue.netSales, true)}
                label="Assisted Gross Revenue"
                metaQuery={r3_ordersRevenue.metaQuery}
                className="tw-col-span-2"
            />

            <Card
                information={numberToHumanFriendlyString(r3_assistedOrdersNetRevenue.netRevenue, true)}
                label="Net Assisted Revenue"
                metaInformation={r3_assistedOrdersNetRevenue.metaInformation}
                className="tw-col-span-2"
            />

            <div className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <Tabs.Root defaultValue="1" className="tw-col-span-6">
                <Tabs.List className="">
                    <Tabs.Trigger value="1" className="tw-p-4 tw-bg-bg+1 radix-tab-active:tw-bg-lp zzz">
                        Gross Revenue
                    </Tabs.Trigger>
                    <Tabs.Trigger value="2" className="tw-p-4 tw-bg-bg+1 radix-tab-active:tw-bg-lp zzz">
                        Net Revenue
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-col-span-12"
                        content={
                            <BarGraphComponent
                                data={{
                                    x: r3_ordersRevenue.rows.filter((row) => row.isAssisted == false).map((item) => item.date),

                                    y: {
                                        "Direct Revenue": r3_ordersRevenue.rows.filter((row) => row.isAssisted == false).map((item) => item.netSales),
                                        "Assisted Revenue": r3_ordersRevenue.rows.filter((row) => row.isAssisted == true).map((item) => item.netSales),
                                    },
                                }}
                                yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                                barWidth={20}
                                height={640}
                            />
                        }
                        metaQuery={adsData.metaQuery}
                    />
                </Tabs.Content>
                <Tabs.Content value="2">
                    <GenericCard
                        className="tw-col-span-6"
                        content={
                            <BarGraphComponent
                                data={{
                                    x: r3_ordersRevenue.rows.filter((row) => row.isAssisted == true).map((item) => item.date),
                                    y: {
                                        "Direct Revenue": r3_ordersRevenue.rows.filter((row) => row.isAssisted == false).map((item) => getNetRevenue(item)),
                                        "Assisted Revenue": r3_ordersRevenue.rows.filter((row) => row.isAssisted == true).map((item) => getNetRevenue(item)),
                                    },
                                }}
                                yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                                barWidth={20}
                                height={640}
                            />
                        }
                        metaQuery={r3_ordersRevenue.metaQuery}
                        label="Clicks per Campaign"
                    />
                </Tabs.Content>
            </Tabs.Root>

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Spend</div>

            <Card information={numberToHumanFriendlyString(r4_netSpends.amountSpent)} label="Net Spend" metaInformation={r4_netSpends.metaInformation} className="tw-row-span-2 tw-col-span-4" />

            <Card information={numberToHumanFriendlyString(facebookAdsSpends.amountSpent)} label="Facebook Ads" metaQuery={adsData.metaQuery} className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(r4_facebookAdsLiveCampaignsCount.count)}
                label="Live Campaigns"
                metaQuery={adsData.metaQuery}
                className="tw-col-span-2"
            />

            <Card
                information={numberToHumanFriendlyString(r4_facebookAdsDailySpend.amountSpent, true)}
                label="Daily Spend"
                metaInformation={r4_facebookAdsDailySpend.metaInformation}
                className="tw-col-span-2"
            />

            <Card information={numberToHumanFriendlyString(r4_facebookAdsAcos.acos, true, true, true)} label="ACoS" metaInformation={r4_facebookAdsAcos.metaInformation} className="tw-col-span-2" />

            <Card information={numberToHumanFriendlyString(googleAdsSpends.amountSpent)} label="Google Ads" metaQuery={adsData.metaQuery} className="tw-col-span-2" />

            <Card
                information={numberToHumanFriendlyString(r4_googleAdsLiveCampaignsCount.count)}
                label="Live Campaigns"
                metaQuery={adsData.metaQuery}
                className="tw-col-span-2"
            />

            <Card
                information={numberToHumanFriendlyString(r4_googleAdsDailySpend.amountSpent, true)}
                label="Daily Spend"
                metaInformation={r4_googleAdsDailySpend.metaInformation}
                className="tw-col-span-2"
            />

            <Card information={numberToHumanFriendlyString(r4_googleAdsAcos.acos, true, true, true)} label="ACoS" metaInformation={r4_googleAdsAcos.metaInformation} className="tw-col-span-2" />

            <GenericCard
                className="tw-col-span-12"
                content={
                    <BarGraphComponent
                        data={{
                            x: adsDataGoogleSpends.map((item) => item.date),
                            y: {
                                "GoogleAds Spends": adsDataGoogleSpends.map((item) => item.param,),
                                "FacebookAds Spends": adsDataFacebookSpends.map((item) => item.param),
                            },
                        }}
                        yClasses={["tw-fill-blue-500", "tw-fill-red-500"]}
                        barWidth={20}
                        height={640}
                    />
                }
                metaQuery={adsData.metaQuery}
            />

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

            {/* <div className="tw-col-start-1 tw-col-span-12 tw-overflow-auto tw-bg-bg+1 tw-grid tw-items-center tw-h-[40rem]">
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




