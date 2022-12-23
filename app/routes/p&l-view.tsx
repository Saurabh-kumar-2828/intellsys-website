import * as Tabs from "@radix-ui/react-tabs";
import {json, LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import { AgGridReact } from "ag-grid-react";
import {DateTime, DayNumbers, Info} from "luxon";
import {useState} from "react";
import {AdsData, AdsDataAggregatedRow, FreshsalesData, getAdsData, getFreshsalesData, getShopifyData, ShopifyData, ShopifyDataAggregatedRow, TimeGranularity} from "~/backend/business-insights";
import {getCapturedUtmCampaignLibrary, getProductLibrary, ProductInformation, SourceInformation} from "~/backend/common";
import { aggregateByDate, doesAdsCampaignNameCorrespondToPerformanceLead, doesLeadCaptureSourceCorrespondToPerformanceLead } from "~/backend/utilities/utilities";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {DateFilterSection, GenericCard} from "~/components/scratchpad";
import {Iso8601Date} from "~/utilities/typeDefinitions";
import {getDates, getNonEmptyStringOrNull, transposeData} from "~/utilities/utilities";

export const meta: MetaFunction = () => {
    return {
        title: "P&L summary Report - Intellsys",
    };
};

export const links: LinksFunction = () => {
    return [
        {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-grid.css"},
        {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-theme-alpine.css"},
    ];
};

type LoaderData = {
    appliedMinDate: Iso8601Date;
    appliedMaxDate: Iso8601Date;
    appliedSelectedGranularity: string;
    allProductInformation: Array<ProductInformation>;
    allSourceInformation: Array<SourceInformation>;
    freshsalesLeadsData: FreshsalesData;
    adsData: {
        metaQuery: string;
        rows: Array<AdsDataAggregatedRow>;
    };
    shopifyData: {
        metaQuery: string;
        rows: Array<ShopifyDataAggregatedRow>;
    };
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

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

    // TODO: Make a function for parsing this
    const selectedGranularityRaw = getNonEmptyStringOrNull(urlSearchParams.get("selected_granularity"));
    let selectedGranularity: TimeGranularity;
    if (selectedGranularityRaw == null || selectedGranularityRaw.length == 0) {
        selectedGranularity = TimeGranularity.daily;
    } else {
        selectedGranularity = selectedGranularityRaw;
    }

    const loaderData: LoaderData = {
        appliedMinDate: minDate,
        appliedMaxDate: maxDate,
        appliedSelectedGranularity: selectedGranularity,
        allProductInformation: await getProductLibrary(),
        allSourceInformation: await getCapturedUtmCampaignLibrary(),
        freshsalesLeadsData: await getFreshsalesData(minDate, maxDate, selectedGranularity),
        adsData: await getAdsData(minDate, maxDate, selectedGranularity),
        shopifyData: await getShopifyData(minDate, maxDate, selectedGranularity),
    };

    return json(loaderData);
};

export default function () {
    const {appliedMinDate, appliedMaxDate, allProductInformation, allSourceInformation, freshsalesLeadsData, adsData, shopifyData} = useLoaderData() as LoaderData;

    const granularities = [TimeGranularity.daily, TimeGranularity.monthly, TimeGranularity.yearly];
    const [selectedGranularity, setSelectedGranularity] = useState(TimeGranularity.daily);
    const [selectedMinDate, setSelectedMinDate] = useState(appliedMinDate ?? "");
    const [selectedMaxDate, setSelectedMaxDate] = useState(appliedMaxDate ?? "");

    const numberOfSelectedDays = DateTime.fromISO(appliedMaxDate).diff(DateTime.fromISO(appliedMinDate), "days").toObject().days! + 1;

    const categories = {
        sleep: ["Mattress", "Non Mattress"],
        waterPurifier: ["Water Purifier"],
    };

    const summaryRowFormat = {
        sleep: [
            "Total Leads",
            "Performance Lead",
            "Facebook Ads Lead",
            "CR%",
            "Performance CR%",
            "Facebook Ads CR%",
            "# Mattress (Units after cancellation)",
            "Direct Units (Mattress)",
            "Assisted Units (Mattress)",
            "Aov Mattress",
            "",
            "Net Revenue (Sleep)",
            "Cancellations",
            "Revenue after Tax (Sleep)",
            "Net Revenue after Tax & Return (Mattress)",
            "Net Revenue after Tax & Return (Non Mattress)",
            "Net Revenue after Tax & Return (Sleep)",
            "",
            "Total Spend",
            "Total Performance Marketing Spend (Sleep)",
            "Total Performance Marketing Spend (Mattress)",
            "Facebook Spend (Mattress)",
            "Google Spend (Mattress)",
            "Total Performance Marketing Spend (Non Mattress)",
            "Facebook Spend (Non Mattress)",
            "Google Spend (Non Mattress)",
            "Agent Cost",
            "Agency Cost",
            "No.of Agents",
            "",
            "Net Acos (Sleep)",
            "Net Acos (Mattress)",
            "Net Acos (Non Mattress)",
            "Acos (Marketing)",
            "Mattress Acos (Marketing)",
            "Performance CPL",
            "On Form CPL",
        ],
        waterPurifier: [
            "Total Leads",
            "Performance Lead",
            "Facebook Ads Lead",
            "CR%",
            "Performance CR%",
            "Facebook Ads CR%",
            "# Units",
            "Direct Units",
            "Assisted Units",
            "AOV",
            "Net Revenue",
            "Net Revenue Post Tax",
            "Net Revenue Post Return & Tax",
            "Total Spend",
            "Total Performance Marketing Spend",
            "Facebook on form Spend",
            "Performance Spend",
            "Agent Cost",
            "Agency Cost",
            "No.of Agents",
            "Net Acos",
            "Acos (Marketing)",
            "Performance CPL",
            "On Form CPL",
        ],
    };

    const dodRowFormat = {
        sleep: [
            "Total Leads",
            "Performance Leads (Mattress)",
            "Facebook Lead (Mattress)",
            "CR %",
            "Performance CR%",
            "Facebook CR%",
            "Units ( Performance Ads)",
            "Units (Facebook Ads)",
            "Units (Sleep)",
            "Mattress Units",
            "Direct Units (Mattress)",
            "Assisted Units (Mattress)",
            "Non Mattress Units",
            "AOV (Mattress) (excluding gst)",
            "AOV (Non Mattress) (excluding gst)",
            "Revenue (Sleep)",
            "Gross Revenue (Mattress)",
            "Cancellations (Mattress)",
            "Gross Revenue after Cancellations (Mattress)",
            "Gross Revenue (Non Mattress)",
            "Cancellations (Non Mattress)",
            "Revenue after Cancellations (Non Mattress)",
            "Net Revenue (after tax) Mattress",
            "Net Revenue (after tax) Non Mattress",
            "Return  Provision",
            "Net Revenue (after Tax & Return) Mattress",
            "Net Revenue (after Tax & Return) Non Mattress",
            "Mattress Spends",
            "Facebook spend (Matttress)",
            "Google spend (Mattress)",
            "Total Performance Marketing spend (Mattress)",
            "Non Mattress Spends",
            "Facebook spend (Non Matttress)",
            "Google spend (Non Mattress)",
            "Total Performance Marketing spend (Non Mattress)",
            "Agency cost",
            "Agent cost",
            "Total Mattress Spend (after agent & agency cost)",
            "Acos (Marketing)",
            "Marketing Acos (Mattress)",
            "Net Acos (sleep)",
            "Facebook CPL",
            "Net Acos (Mattress)",
            "Net Acos (Non Mattress)",
            "No. of Agents",
            "CPL",
            "Performance CPL",
        ],
        waterPurifier: [
            "Total Leads",
            "Performance Leads (Water Purifier)",
            "Facebook Lead (Water Purifier)",
            "CR %",
            "Performance CR%",
            "Facebook CR%",
            "Units (Performance)",
            "Units (Facebook ADs)",
            "Units  (WP)",
            "Direct Units (WP)",
            "Assissted Units (WP)",
            "Aov (WP)",
            "Net Revenue  (WP)",
            "Net Revenue (after tax) WP",
            "Return Provision",
            "Net Revenue (after tax and return) WP",
            "WP Spends",
            "Facebook spend (WP)",
            "Google spend (WP)",
            "Total Performance Marketing spend (WP)",
            "Agency cost",
            "AgenT Cost",
            "Total WP Spend (after agent & agency cost)",
            "Acos (Marketing)",
            "Net Acos (WP)",
            "No. of Agents",
            "CPL",
            "Performance CPL",
            "Facebook CPL",
        ],
    };

    return (
        <>
            <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8 tw-sticky">
                <DateFilterSection
                    granularities={granularities}
                    selectedGranularity={selectedGranularity}
                    setSelectedGranularity={setSelectedGranularity}
                    selectedMinDate={selectedMinDate}
                    setSelectedMinDate={setSelectedMinDate}
                    selectedMaxDate={selectedMaxDate}
                    setSelectedMaxDate={setSelectedMaxDate}
                    page={"P&l-view"}
                />
            </div>
            <div className="tw-p-8">
                <SleepSummaryAndDodSection
                    adsData={adsData}
                    freshsalesLeadsData={freshsalesLeadsData}
                    shopifyData={shopifyData}
                    minDate={appliedMinDate}
                    maxDate={appliedMaxDate}
                    numberOfSelectedDays={numberOfSelectedDays}
                    categories={categories.sleep}
                />
            </div>
            <div className="tw-p-8">
                <WpSummaryAndDodSection
                    adsData={adsData}
                    freshsalesLeadsData={freshsalesLeadsData}
                    shopifyData={shopifyData}
                    minDate={appliedMinDate}
                    maxDate={appliedMaxDate}
                    numberOfSelectedDays={numberOfSelectedDays}
                    categories={categories.waterPurifier}
                />
            </div>
        </>
    );
}

function SleepSummaryAndDodSection({
    freshsalesLeadsData,
    adsData,
    shopifyData,
    minDate,
    maxDate,
    numberOfSelectedDays,
    categories,
}: {
    freshsalesLeadsData: FreshsalesData;
    adsData: AdsData;
    shopifyData: ShopifyData;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    numberOfSelectedDays: number;
    categories: Array<string>;
    summaryRowFormat: Array<string>;
    dodRowFormat: Array<string>;
}) {
    const filterFreshsalesData = freshsalesLeadsData.rows.filter((row) => categories.length == 0 || categories.includes(row.category));

    const filterShopifyData = shopifyData.rows.filter((row) => categories.length == 0 || categories.includes(row.productCategory));

    const filterAdsData = adsData.rows.filter((row) => categories.length == 0 || categories.includes(row.category));

    const defaultColumnDefinitions = {
        sortable: true,
        filter: true,
    };

    const dates = getDates(minDate, maxDate);
    const weekDay = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = ["january","February","March","April","May","June","July","August","September","October","November","December"];

    const dodFirstRow = ["","MTD"];
    dates.forEach((date) => dodFirstRow.push(weekDay[new Date(date).getDay()]));

    const dodSecondRow = ["",months[new Date(minDate).getMonth()]];
    dates.forEach((date) => dodSecondRow.push(new Intl.DateTimeFormat("en", {timeZone: "UTC", dateStyle: "medium"}).format(new Date(date))));

    const leadsDayWise = aggregateByDate(
        filterFreshsalesData.filter((row) => row.category == "Mattress"),
        "count",
        dates
    );
    const totalLeads = ["Total Leads",leadsDayWise.reduce((sum, item) => sum + item, 0)];
    leadsDayWise.forEach((lead) => totalLeads.push(lead));

    const performaceLeadsMattressDayWise = aggregateByDate(
        filterFreshsalesData.filter((row) => doesLeadCaptureSourceCorrespondToPerformanceLead(row.leadCaptureSource) && row.category == "Mattress"),
        "count",
        dates
    );
    const performaceLeadsMattress = ["Performance Leads (Mattress)", performaceLeadsMattressDayWise.reduce((sum, item) => sum + item, 0)];
    performaceLeadsMattressDayWise.forEach((lead) => performaceLeadsMattress.push(lead));

    const facebookLeadsMattressDayWise = aggregateByDate(
        filterFreshsalesData.filter((row) => !doesLeadCaptureSourceCorrespondToPerformanceLead(row.leadCaptureSource) && row.category == "Mattress"),
        "count",
        dates
    );
    const facebookLeadsMattress = ["Performance Leads (Mattress)", facebookLeadsMattressDayWise.reduce((sum, item) => sum + item, 0)];
    facebookLeadsMattressDayWise.forEach((lead) => facebookLeadsMattress.push(lead));

    const mattressUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress"),
        "netQuantity",
        dates
    );
    const mattressUnits = ["Assissted Units (Mattress)", mattressUnitsDayWise.reduce((sum, item) => sum + item, 0)];
    mattressUnitsDayWise.forEach((units) => mattressUnits.push(units + ""));

    const assistedMattressUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress" && row.isAssisted == true),
        "netQuantity",
        dates
    );
    const assistedMattressUnits = ["Assissted Units (Mattress)", assistedMattressUnitsDayWise.reduce((sum, item) => sum + item, 0)];
    assistedMattressUnitsDayWise.forEach((units) => assistedMattressUnits.push(units + ""));

    const directMattressUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress" && row.isAssisted == false),
        "netQuantity",
        dates
    );
    const directMattressUnits = ["Direct Units (Mattress)", directMattressUnitsDayWise.reduce((sum, item) => sum + item, 0)];
    directMattressUnitsDayWise.forEach((units) => directMattressUnits.push(units + ""));

    const nonMattressUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Non Mattress"),
        "netQuantity",
        dates
    );
    const nonMattressUnits = ["Assissted Units (Mattress)", nonMattressUnitsDayWise.reduce((sum, item) => sum + item, 0)];
    nonMattressUnitsDayWise.forEach((units) => nonMattressUnits.push(units + ""));

    const performanceMattressUnitDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress" && doesAdsCampaignNameCorrespondToPerformanceLead(row.leadGenerationSource)),
        "netQuantity",
        dates
    );
    const unitsPerformanceAds = ["Units ( Performance Ads)", performanceMattressUnitDayWise.reduce((sum, item) => sum + item, 0)];
    performanceMattressUnitDayWise.forEach((units) => unitsPerformanceAds.push(units + ""));

    const facebookmattressUnitDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress" && !doesAdsCampaignNameCorrespondToPerformanceLead(row.leadGenerationSource)),
        "netQuantity",
        dates
    );
    const unitsFacebookAds = ["Units ( facebook Ads)", facebookmattressUnitDayWise.reduce((sum, item) => sum + item, 0)];
    facebookmattressUnitDayWise.forEach((units) => unitsFacebookAds.push(units + ""));

    const conversionRateDayWise = dates.map((date, dateIndex) => (mattressUnitsDayWise[dateIndex]/leadsDayWise[dateIndex])*100 + " %");
    const conversionRate = [
        "CR %",
        (mattressUnitsDayWise.reduce((sum, item) => sum + item, 0) / leadsDayWise.reduce((sum, item) => sum + item, 0))*100 + " %",
    ];
    conversionRateDayWise.forEach((conversion) => conversionRate.push(conversion));

    const performaceConversionRateDayWise = dates.map((date, dateIndex) => (performanceMattressUnitDayWise[dateIndex] / performaceLeadsMattressDayWise[dateIndex]) * 100 + " %");
    const performanceConversionRate = [
        "CR %",
        (performanceMattressUnitDayWise.reduce((sum, item) => sum + item, 0) / performaceLeadsMattressDayWise.reduce((sum, item) => sum + item, 0)) * 100 + " %",
    ];
    performaceConversionRateDayWise.forEach((conversion) => performanceConversionRate.push(conversion));

    const facebookConversionRateDayWise = dates.map((date, dateIndex) => (facebookmattressUnitDayWise[dateIndex] / facebookLeadsMattressDayWise[dateIndex]) * 100 + " %");
    const facebookConversionRate = ["CR %", (facebookmattressUnitDayWise.reduce((sum, item) => sum + item, 0) / facebookLeadsMattressDayWise.reduce((sum, item) => sum + item, 0)) * 100 + " %"];
    facebookConversionRateDayWise.forEach((conversion) => facebookConversionRate.push(conversion));

    const unitsSleep = ["Units (Sleep)", mattressUnitsDayWise.reduce((sum, item) => sum + item, 0) + nonMattressUnitsDayWise.reduce((sum, item) => sum + item, 0) + ""];
    dates.map((date, dateIndex) => unitsSleep.push(mattressUnitsDayWise[dateIndex] + nonMattressUnitsDayWise[dateIndex] + ""));



    const netSalesMattressDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress"),
        "netSales",
        dates
    );
    const netSalesMattress = ["Net Sales (Mattress)", netSalesMattressDayWise.reduce((sum, item) => sum + item, 0)];
    netSalesMattressDayWise.forEach((sale) => netSalesMattress.push(sale));

    const netSalesNonMattressDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Non Mattress"),
        "netSales",
        dates
    );
    const netSalesNonMattress = ["Net Sales (Mattress)", netSalesNonMattressDayWise.reduce((sum, item) => sum + item, 0)];
    netSalesNonMattressDayWise.forEach((sale) => netSalesNonMattress.push(sale));

    const revenueSleep = ["Revenue (Sleep)", netSalesMattressDayWise.reduce((sum, item) => sum + item, 0) + netSalesNonMattressDayWise.reduce((sum, item) => sum + item, 0) + ""];
    dates.map((date, dateIndex) => revenueSleep.push(netSalesMattressDayWise[dateIndex] + netSalesNonMattressDayWise[dateIndex] + ""));

    const cancellationsMattress = ["Cancellations (Mattress)","0"];
    dates.map((date, dateIndex) => cancellationsMattress.push("0"));

    const revenueMattressAfterCancellations = [
        "Revenue after Cancellations (Mattress)",
        netSalesMattressDayWise.reduce((sum, item) => sum + item, 0) + netSalesMattressDayWise.reduce((sum, item) => sum + item, 0) - Number(cancellationsMattress[1])
    ];
    dates.map((date, dateIndex) => revenueMattressAfterCancellations.push( netSalesMattressDayWise[dateIndex] - Number(cancellationsMattress[dateIndex+2]))+ "");

    const cancellationsNonMattress = ["Cancellations (Non Mattress)", "0"];
    dates.map((date, dateIndex) => cancellationsNonMattress.push("0"));

    const revenueNonMattressAfterCancellations = [
        "Revenue after Cancellations (Non Mattress)",
        netSalesNonMattressDayWise.reduce((sum, item) => sum + item, 0) + netSalesNonMattressDayWise.reduce((sum, item) => sum + item, 0) - Number(cancellationsNonMattress[1]),
    ];
    dates.map((date, dateIndex) => revenueNonMattressAfterCancellations.push(netSalesNonMattressDayWise[dateIndex] - Number(cancellationsNonMattress[dateIndex + 2])) + "");

    const netRevenueAfterTaxMattreess = [
        "Net Revenue (after tax) Mattress",
        Number(netSalesMattress[1]) / 1.18 + ""
    ];
    dates.map((date, dateIndex) => netRevenueAfterTaxMattreess.push(Number(netSalesMattress[dateIndex + 2]) / 1.18 + ""));

    const netRevenueAfterTaxNonMattreess = ["Net Revenue (after tax) Non Mattress", Number(netSalesNonMattress[1]) / 1.18 + ""];
    dates.map((date, dateIndex) => netRevenueAfterTaxNonMattreess.push(Number(netSalesNonMattress[dateIndex + 2]) / 1.18 + ""));

    const returnOnProvision = ["Return On Provision","8.50%"];
    dates.map((date, dateIndex) => returnOnProvision.push("8.50%"));

    const netRevenueAfterTaxAndReturnMattreess = [
        "Net Revenue (after Tax & Retuen) Mattress",
        Number(netRevenueAfterTaxMattreess[1]) - (Number(netRevenueAfterTaxMattreess[1]) / 8.5 * 100) + ""
    ];
    dates.map((date, dateIndex) =>
        netRevenueAfterTaxAndReturnMattreess.push(Number(netRevenueAfterTaxMattreess[dateIndex + 2]) - (Number(netRevenueAfterTaxMattreess[dateIndex + 2]) / 8.5 * 100) + "")
    );

    const netRevenueAfterTaxAndReturnNonMattreess = [
        "Net Revenue (after Tax & Retuen) Non Mattress",
        Number(netRevenueAfterTaxNonMattreess[1]) - (Number(netRevenueAfterTaxNonMattreess[1]) / 8.5) * 100 + "",
    ];
    dates.map((date, dateIndex) =>
        netRevenueAfterTaxAndReturnNonMattreess.push(Number(netRevenueAfterTaxNonMattreess[dateIndex + 2]) - (Number(netRevenueAfterTaxNonMattreess[dateIndex + 2]) / 8.5) * 100 + "")
    );

    const mattressSpend = ["Mattress Spends",""];
    dates.map((date, dateIndex) => mattressSpend.push(""));

    const facebookSpendMattressDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Facebook" && row.category == "Mattress"),
        "amountSpent",
        dates
    );
    const facebookSpendMattress = ["Facebook spend (Matttress)", facebookSpendMattressDayWise.reduce((sum, item) => sum + item, 0)];
    facebookSpendMattressDayWise.forEach((spend) => facebookSpendMattress.push(spend));

    const googleSpendMattressDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Google" && row.category == "Mattress" ),
        "amountSpent",
        dates
    );
    const googleSpendMattress = ["Google spend (Matttress)", googleSpendMattressDayWise.reduce((sum, item) => sum + item, 0)];
    googleSpendMattressDayWise.forEach((spend) => googleSpendMattress.push(spend));

    const totalPerformanceMarketingSpendMattress = ["Total Performance Marketing spend (Mattress)", Number(facebookSpendMattress[1]) + Number(googleSpendMattress[1]) + ""];
    dates.map((date, dateIndex) => totalPerformanceMarketingSpendMattress.push(Number(facebookSpendMattress[dateIndex+2]) + Number(googleSpendMattress[dateIndex=2]) + ""));

    const nonMattressSpend = ["Non Mattress Spends", ""];
    dates.map((date, dateIndex) => nonMattressSpend.push(""));

    const facebookSpendNonMattressDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Facebook" && row.category == "Non Mattress"),
        "amountSpent",
        dates
    );
    const facebookSpendNonMattress = ["Facebook spend (Matttress)", facebookSpendNonMattressDayWise.reduce((sum, item) => sum + item, 0)];
    facebookSpendNonMattressDayWise.forEach((spend) => facebookSpendNonMattress.push(spend));

    const googleSpendNonMattressDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Google" && row.category == "Non Mattress"),
        "amountSpent",
        dates
    );
    const googleSpendNonMattress = ["Google spend (Matttress)", googleSpendNonMattressDayWise.reduce((sum, item) => sum + item, 0)];
    googleSpendNonMattressDayWise.forEach((spend) => googleSpendNonMattress.push(spend));

    const totalPerformanceMarketingSpendNonMattress = ["Total Performance Marketing spend (Mattress)", Number(facebookSpendNonMattress[1]) + Number(googleSpendNonMattress[1]) + ""];
    dates.map((date, dateIndex) => totalPerformanceMarketingSpendNonMattress.push(Number(facebookSpendNonMattress[dateIndex + 2]) + Number(googleSpendNonMattress[(dateIndex = 2)]) + ""));

    const agentCostDayWise: Array<number> =[];
    dates.map((date, dateIndex) => agentCostDayWise.push(17806));

    const agentCost = ["Agent cost", agentCostDayWise.reduce((sum, item) => sum + item, 0)];
    dates.map((date, dateIndex) => agentCost.push(agentCostDayWise[dateIndex]+""));

    const agencyCostDayWise: Array<number> = [];
    dates.map((date, dateIndex) => agencyCostDayWise.push(2634));

    const agencyCost = ["Agency cost", agencyCostDayWise.reduce((sum, item) => sum + item, 0)];
    dates.map((date, dateIndex) => agencyCost.push(agencyCostDayWise[dateIndex] + ""));

    const totalMattressSpendAfterAgentAndAgencyCost = ["Total Mattress Spend (after agent & agency cost)", Number(totalPerformanceMarketingSpendMattress[1]) + Number(agentCost[1]) + Number(agencyCost[1]) + ""];
    dates.map((date, dateIndex) =>
        totalMattressSpendAfterAgentAndAgencyCost.push(Number(totalPerformanceMarketingSpendMattress[dateIndex + 2]) + Number(agentCost[dateIndex + 2]) + Number(agencyCost[dateIndex+2]) + "")
    );

    const acosMarketing = ["Acos (Marketing)", ""];
    dates.map((date, dateIndex) => acosMarketing.push(""));

    const marketingAcosMattress = [
        "Marketing Acos (Mattress)",
        Number(totalPerformanceMarketingSpendMattress[1])/Number(netRevenueAfterTaxAndReturnMattreess[1]) + ""
    ];
    dates.map((date, dateIndex) => marketingAcosMattress.push(Number(totalPerformanceMarketingSpendMattress[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnMattreess[dateIndex + 2]) + ""));

    const marketingAcosNonMattress = ["Marketing Acos (Non Mattress)", Number(totalPerformanceMarketingSpendNonMattress[1]) / Number(netRevenueAfterTaxAndReturnNonMattreess[1]) + ""];
    dates.map((date, dateIndex) => marketingAcosNonMattress.push(Number(totalPerformanceMarketingSpendNonMattress[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnNonMattreess[dateIndex + 2]) + ""));

    const netAcosSleep = [
        "Net Acos (sleep)",
        (Number(totalMattressSpendAfterAgentAndAgencyCost[1] + totalPerformanceMarketingSpendNonMattress[1])) / (Number(netRevenueAfterTaxAndReturnMattreess[1] + Number(netRevenueAfterTaxAndReturnNonMattreess[1]))) + ""
    ];
    dates.map((date, dateIndex) =>
        netAcosSleep.push(
            Number(totalMattressSpendAfterAgentAndAgencyCost[dateIndex + 2] + totalPerformanceMarketingSpendNonMattress[dateIndex + 2]) /
                Number(netRevenueAfterTaxAndReturnMattreess[dateIndex + 2] + Number(netRevenueAfterTaxAndReturnNonMattreess[dateIndex + 2])) +
                ""
        )
    );

    const netAcosMattress = [
        "Net Acos (Mattress)",
        Number(totalMattressSpendAfterAgentAndAgencyCost[1]) / Number(netRevenueAfterTaxAndReturnMattreess[1]) + ""
    ];
    dates.map((date, dateIndex) => netAcosMattress.push(Number(totalMattressSpendAfterAgentAndAgencyCost[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnMattreess[dateIndex + 2]) + ""));

    const netAcosNonMattress = ["Net Acos (Non Mattress)", Number(totalPerformanceMarketingSpendNonMattress[1]) / Number(netRevenueAfterTaxAndReturnNonMattreess[1]) + ""];
    dates.map((date, dateIndex) => netAcosNonMattress.push(Number(totalPerformanceMarketingSpendNonMattress[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnNonMattreess[dateIndex + 2]) + ""));

    const noOfAgents = ["No. of Agents","17"];
    dates.map((date, dateIndex) => noOfAgents.push("17"));

    const costPerLead = ["CPL", Number(totalPerformanceMarketingSpendMattress[1]) / Number(totalLeads[1]) + ""];
    dates.map((date, dateIndex) => costPerLead.push(Number(totalPerformanceMarketingSpendMattress[dateIndex + 2]) / Number(totalLeads[dateIndex + 2]) + ""));

    const aovMattress = ["AOV (Mattress)", Number(netRevenueAfterTaxMattreess[1]) / Number(mattressUnits[1]) + ""];
    dates.map((date, dateIndex) => aovMattress.push(Number(netRevenueAfterTaxMattreess[dateIndex + 2]) / Number(mattressUnits[dateIndex + 2]) + ""));

    const aovNonMattress = ["AOV (Non Mattress)", Number(netRevenueAfterTaxNonMattreess[1]) / Number(nonMattressUnits[1]) + ""];
    dates.map((date, dateIndex) => aovNonMattress.push(Number(netRevenueAfterTaxNonMattreess[dateIndex + 2]) / Number(nonMattressUnits[dateIndex + 2]) + ""));

    const dodColumnDefs = [
        {headerName: "", field: "firstRow"},
        {headerName: "", field: "secondRow"},
    ];

    const fieldsColumnsDefs = [
        "totalLeads",
        "performanceLeadMattress",
        "facebookLeadmattress",
        "conversionRate",
        "performanceConversionRate",
        "facebookConversionRate",
        "unitsPerformanceAds",
        "unitsFacebookAds",
        "unitsSleep",
        "mattressUnits",
        "directMattressUnits",
        "assistedMattressUnits",
        "nonMattressUnits",
        "aovMattress",
        "aovNonMattress",
        "revenueSleep",
        "netSalesMattress",
        "cancellationsMattress",
        "revenueMattressAfterCancellations",
        "netSalesNonMattress",
        "cancellationsNonMattress",
        "revenueNonMattressAfterCancellations",
        "netRevenueAfterTaxMattreess",
        "netRevenueAfterTaxNonMattreess:",
        "returnOnProvision",
        "netRevenueAfterTaxAndReturnMattreess",
        "netRevenueAfterTaxAndReturnNonMattreess",
        "mattressSpend",
        "facebookSpendMattress",
        "googleSpendMattress",
        "totalPerformanceMarketingSpendMattress",
        "nonMattressSpend",
        "facebookSpendNonMattress",
        "googleSpendNonMattress",
        "totalPerformanceMarketingSpendNonMattress",
        "agentCost",
        "agencyCost",
        "totalMattressSpendAfterAgentAndAgencyCost",
        "acosMarketing",
        "marketingAcosMattress",
        "marketingAcosNonMattress",
        "netAcosSleep",
        "netAcosMattress",
        "netAcosNonMattress",
        "noOfAgents",
        "costPerLead",
    ];

    fieldsColumnsDefs.map((columnDefField, index) =>
        dodColumnDefs.push({
            headerName: "",
            field: columnDefField,
        })
    );

    const rowData = totalLeads.map((leads, index) => ({
                                        firstRow: dodFirstRow[index],
                                        secondRow: dodSecondRow[index],
                                        totalLeads: totalLeads[index],
                                        performanceLeadMattress: performaceLeadsMattress[index],
                                        facebookLeadmattress: facebookLeadsMattress[index],
                                        conversionRate: conversionRate[index],
                                        performanceConversionRate: performanceConversionRate[index],
                                        facebookConversionRate: facebookConversionRate[index],
                                        unitsPerformanceAds: unitsPerformanceAds[index],
                                        unitsFacebookAds: unitsFacebookAds[index],
                                        unitsSleep: unitsSleep[index],
                                        mattressUnits: mattressUnits[index],
                                        directMattressUnits: directMattressUnits[index],
                                        assistedMattressUnits: assistedMattressUnits[index],
                                        nonMattressUnits: nonMattressUnits[index],
                                        aovMattress: aovMattress[index],
                                        aovNonMattress: aovNonMattress[index],
                                        revenueSleep: revenueSleep[index],
                                        netSalesMattress: netSalesMattress[index],
                                        cancellationsMattress: cancellationsMattress[index],
                                        revenueMattressAfterCancellations: revenueMattressAfterCancellations[index],
                                        netSalesNonMattress: netSalesNonMattress[index],
                                        cancellationsNonMattress: cancellationsNonMattress[index],
                                        revenueNonMattressAfterCancellations: revenueNonMattressAfterCancellations[index],
                                        netRevenueAfterTaxMattreess: netRevenueAfterTaxMattreess[index],
                                        netRevenueAfterTaxNonMattreess: netRevenueAfterTaxNonMattreess[index],
                                        returnOnProvision: returnOnProvision[index],
                                        netRevenueAfterTaxAndReturnMattreess: netRevenueAfterTaxAndReturnMattreess[index],
                                        netRevenueAfterTaxAndReturnNonMattreess: netRevenueAfterTaxAndReturnNonMattreess[index],
                                        mattressSpend: mattressSpend[index],
                                        facebookSpendMattress: facebookSpendMattress[index],
                                        googleSpendMattress: googleSpendMattress[index],
                                        totalPerformanceMarketingSpendMattress: totalPerformanceMarketingSpendMattress[index],
                                        nonMattressSpend: nonMattressSpend[index],
                                        facebookSpendNonMattress: facebookSpendNonMattress[index],
                                        googleSpendNonMattress: googleSpendNonMattress[index],
                                        totalPerformanceMarketingSpendNonMattress: totalPerformanceMarketingSpendNonMattress[index],
                                        agentCost: agentCost[index],
                                        agencyCost: agencyCost[index],
                                        totalMattressSpendAfterAgentAndAgencyCost: totalMattressSpendAfterAgentAndAgencyCost[index],
                                        acosMarketing: acosMarketing[index],
                                        marketingAcosMattress: marketingAcosMattress[index],
                                        marketingAcosNonMattress: marketingAcosNonMattress[index],
                                        netAcosSleep: netAcosSleep[index],
                                        netAcosMattress: netAcosMattress[index],
                                        netAcosNonMattress: netAcosNonMattress[index],
                                        noOfAgents: noOfAgents[index],
                                        costPerLead: costPerLead[index],
                                    }));


    console.log("first row", dodColumnDefs);
    console.log("first row", performanceConversionRate);
    console.log("first row", facebookConversionRate);

    return (
        <>
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Sleep</div>

            <VerticalSpacer className="tw-h-8" />

            <Tabs.Root defaultValue="1" className="tw-col-span-12">
                <Tabs.List className="">
                    <Tabs.Trigger value="1" className="lp-tab">
                        Sleep Summary
                    </Tabs.Trigger>
                    <Tabs.Trigger value="2" className="lp-tab">
                        Sleep DOD
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="1"></Tabs.Content>
                <Tabs.Content value="2">
                    <GenericCard
                        className="tw-col-span-12"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={transposeData(rowData)}
                                    columnDefs={dodColumnDefs}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                />
                            </div>
                        }
                    />
                </Tabs.Content>
            </Tabs.Root>
        </>
    );
}

function WpSummaryAndDodSection({
    freshsalesLeadsData,
    adsData,
    shopifyData,
    minDate,
    maxDate,
    numberOfSelectedDays,
    categories,
}: {
    freshsalesLeadsData: FreshsalesData;
    adsData: AdsData;
    shopifyData: ShopifyData;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    numberOfSelectedDays: number;
    categories: Array<string>;
}) {
    const filterFreshsalesData = freshsalesLeadsData.rows.filter((row) => categories.length == 0 || categories.includes(row.category));

    const filterShopifyData = shopifyData.rows.filter((row) => categories.length == 0 || categories.includes(row.productCategory));

    const filterAdsData = adsData.rows.filter((row) => categories.length == 0 || categories.includes(row.category));

    const defaultColumnDefinitions = {
        sortable: true,
        filter: true,
    };

    const dates = getDates(minDate, maxDate);

    return (
        <>
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Water Purifier</div>

            <VerticalSpacer className="tw-h-8" />

            <Tabs.Root defaultValue="1" className="tw-col-span-12">
                <Tabs.List className="">
                    <Tabs.Trigger value="1" className="lp-tab">
                        WP Summary
                    </Tabs.Trigger>
                    <Tabs.Trigger value="2" className="lp-tab">
                        WP DOD
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="1"></Tabs.Content>
                <Tabs.Content value="2"></Tabs.Content>
            </Tabs.Root>
        </>
    );
}
