import * as Tabs from "@radix-ui/react-tabs";
import {json, LinksFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {AgGridReact} from "ag-grid-react";
import {DateTime, DayNumbers, Info} from "luxon";
import {useState} from "react";
import {AdsData, AdsDataAggregatedRow, FreshsalesData, getAdsData, getFreshsalesData, getShopifyData, ShopifyData, ShopifyDataAggregatedRow, TimeGranularity} from "~/backend/business-insights";
import {getCapturedUtmCampaignLibrary, getProductLibrary, ProductInformation, SourceInformation} from "~/backend/common";
import {aggregateByDate, doesAdsCampaignNameCorrespondToPerformanceLead, doesLeadCaptureSourceCorrespondToPerformanceLead} from "~/backend/utilities/utilities";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {DateFilterSection, GenericCard} from "~/components/scratchpad";
import {Iso8601Date} from "~/utilities/typeDefinitions";
import {getDates, getNonEmptyStringOrNull, roundOffToTwoDigits, transposeData} from "~/utilities/utilities";

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
                    page="pnl-view"
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
}) {
    const filterFreshsalesData = freshsalesLeadsData.rows.filter((row) => categories.length == 0 || categories.includes(row.category));

    const filterShopifyData = shopifyData.rows.filter((row) => categories.length == 0 || categories.includes(row.productCategory));

    const filterAdsData = adsData.rows.filter((row) => categories.length == 0 || categories.includes(row.category));

    const defaultColumnDefinitions = {
        sortable: true,
        filter: true,
    };

    const dates = getDates(minDate, maxDate);
    const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["january", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const dodFirstRow = ["", "MTD"];
    dates.forEach((date) => dodFirstRow.push(weekDay[new Date(date).getDay()]));

    const dodSecondRow = ["", months[new Date(minDate).getMonth()]];
    dates.forEach((date) => dodSecondRow.push(new Intl.DateTimeFormat("en", {timeZone: "UTC", dateStyle: "medium"}).format(new Date(date))));

    const leadsDayWise = aggregateByDate(
        filterFreshsalesData.filter((row) => row.category == "Mattress"),
        "count",
        dates
    );
    const totalLeads = ["Total Leads", leadsDayWise.reduce((sum, item) => sum + item, 0)];
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
    const mattressUnits = ["Units (Mattress)", mattressUnitsDayWise.reduce((sum, item) => sum + item, 0)];
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

    const conversionRateDayWise = dates.map((date, dateIndex) => roundOffToTwoDigits((mattressUnitsDayWise[dateIndex] / leadsDayWise[dateIndex]) * 100) + " %");
    const conversionRate = ["CR %", roundOffToTwoDigits((mattressUnitsDayWise.reduce((sum, item) => sum + item, 0) / leadsDayWise.reduce((sum, item) => sum + item, 0)) * 100) + " %"];
    conversionRateDayWise.forEach((conversion) => conversionRate.push(conversion));

    const performaceConversionRateDayWise = dates.map((date, dateIndex) => roundOffToTwoDigits((performanceMattressUnitDayWise[dateIndex] / performaceLeadsMattressDayWise[dateIndex]) * 100) + " %");
    const performanceConversionRate = [
        "Performance CR %",
        roundOffToTwoDigits((performanceMattressUnitDayWise.reduce((sum, item) => sum + item, 0) / performaceLeadsMattressDayWise.reduce((sum, item) => sum + item, 0)) * 100) + " %",
    ];
    performaceConversionRateDayWise.forEach((conversion) => performanceConversionRate.push(conversion));

    const facebookConversionRateDayWise = dates.map((date, dateIndex) => roundOffToTwoDigits((facebookmattressUnitDayWise[dateIndex] / facebookLeadsMattressDayWise[dateIndex]) * 100) + " %");
    const facebookConversionRate = ["Facebook CR %", roundOffToTwoDigits((facebookmattressUnitDayWise.reduce((sum, item) => sum + item, 0) / facebookLeadsMattressDayWise.reduce((sum, item) => sum + item, 0)) * 100) + " %"];
    facebookConversionRateDayWise.forEach((conversion) => facebookConversionRate.push(conversion));

    const unitsSleep = ["Units (Sleep)", mattressUnitsDayWise.reduce((sum, item) => sum + item, 0) + nonMattressUnitsDayWise.reduce((sum, item) => sum + item, 0) + ""];
    dates.map((date, dateIndex) => unitsSleep.push(mattressUnitsDayWise[dateIndex] + nonMattressUnitsDayWise[dateIndex] + ""));

    const netSalesMattressDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress"),
        "netSales",
        dates
    );
    const netSalesMattress = ["Net Sales (Mattress)", roundOffToTwoDigits(netSalesMattressDayWise.reduce((sum, item) => sum + item, 0))];
    netSalesMattressDayWise.forEach((sale) => netSalesMattress.push(roundOffToTwoDigits(sale)));

    const netSalesNonMattressDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Non Mattress"),
        "netSales",
        dates
    );
    const netSalesNonMattress = ["Net Sales (Mattress)", roundOffToTwoDigits(netSalesNonMattressDayWise.reduce((sum, item) => sum + item, 0))];
    netSalesNonMattressDayWise.forEach((sale) => netSalesNonMattress.push(roundOffToTwoDigits(sale)));

    const revenueSleep = ["Revenue (Sleep)", roundOffToTwoDigits(netSalesMattressDayWise.reduce((sum, item) => sum + item, 0) + netSalesNonMattressDayWise.reduce((sum, item) => sum + item, 0)) + ""];
    dates.map((date, dateIndex) => revenueSleep.push(roundOffToTwoDigits(netSalesMattressDayWise[dateIndex] + netSalesNonMattressDayWise[dateIndex]) + ""));

    const cancellationsMattress = ["Cancellations (Mattress)", "0"];
    dates.map((date, dateIndex) => cancellationsMattress.push("0"));

    const revenueMattressAfterCancellations = [
        "Revenue after Cancellations (Mattress)",
        roundOffToTwoDigits(netSalesMattressDayWise.reduce((sum, item) => sum + item, 0) - Number(cancellationsMattress[1])),
    ];
    dates.map((date, dateIndex) => revenueMattressAfterCancellations.push(roundOffToTwoDigits(netSalesMattressDayWise[dateIndex] - Number(cancellationsMattress[dateIndex + 2]))) + "");

    const cancellationsNonMattress = ["Cancellations (Non Mattress)", "0"];
    dates.map((date, dateIndex) => cancellationsNonMattress.push("0"));

    const revenueNonMattressAfterCancellations = [
        "Revenue after Cancellations (Non Mattress)",
        roundOffToTwoDigits(netSalesNonMattressDayWise.reduce((sum, item) => sum + item, 0) - Number(cancellationsNonMattress[1])),
    ];
    dates.map((date, dateIndex) => revenueNonMattressAfterCancellations.push(roundOffToTwoDigits(netSalesNonMattressDayWise[dateIndex] - Number(cancellationsNonMattress[dateIndex + 2]))) + "");

    const netRevenueAfterTaxMattreess = ["Net Revenue (after tax) Mattress", roundOffToTwoDigits(Number(netSalesMattress[1]) / 1.18) + ""];
    dates.map((date, dateIndex) => netRevenueAfterTaxMattreess.push(roundOffToTwoDigits(Number(netSalesMattress[dateIndex + 2]) / 1.18) + ""));

    const netRevenueAfterTaxNonMattreess = ["Net Revenue (after tax) Non Mattress", roundOffToTwoDigits(Number(netSalesNonMattress[1]) / 1.18) + ""];
    dates.map((date, dateIndex) => netRevenueAfterTaxNonMattreess.push(roundOffToTwoDigits(Number(netSalesNonMattress[dateIndex + 2]) / 1.18) + ""));

    const returnOnProvision = ["Return On Provision", "8.50%"];
    dates.map((date, dateIndex) => returnOnProvision.push("8.50%"));

    const netRevenueAfterTaxAndReturnMattreess = [
        "Net Revenue (after Tax & Retuen) Mattress",
        roundOffToTwoDigits(Number(netRevenueAfterTaxMattreess[1]) - (Number(netRevenueAfterTaxMattreess[1]) * 8.5) / 100) + "",
    ];
    dates.map((date, dateIndex) =>
        netRevenueAfterTaxAndReturnMattreess.push(roundOffToTwoDigits(Number(netRevenueAfterTaxMattreess[dateIndex + 2]) - (Number(netRevenueAfterTaxMattreess[dateIndex + 2]) * 8.5) / 100) + "")
    );

    const netRevenueAfterTaxAndReturnNonMattreess = [
        "Net Revenue (after Tax & Retuen) Non Mattress",
        roundOffToTwoDigits(Number(netRevenueAfterTaxNonMattreess[1]) - (Number(netRevenueAfterTaxNonMattreess[1]) * 8.5) / 100) + "",
    ];
    dates.map((date, dateIndex) =>
        netRevenueAfterTaxAndReturnNonMattreess.push(roundOffToTwoDigits(Number(netRevenueAfterTaxNonMattreess[dateIndex + 2]) - (Number(netRevenueAfterTaxNonMattreess[dateIndex + 2]) * 8.5) / 100) + "")
    );

    const mattressSpend = ["Mattress Spends", ""];
    dates.map((date, dateIndex) => mattressSpend.push(""));

    const facebookSpendMattressDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Facebook" && row.category == "Mattress"),
        "amountSpent",
        dates
    );
    const facebookSpendMattress = ["Facebook spend (Matttress)", roundOffToTwoDigits(facebookSpendMattressDayWise.reduce((sum, item) => sum + item, 0))];
    facebookSpendMattressDayWise.forEach((spend) => facebookSpendMattress.push(roundOffToTwoDigits(spend)));

    const googleSpendMattressDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Google" && row.category == "Mattress"),
        "amountSpent",
        dates
    );
    const googleSpendMattress = ["Google spend (Matttress)", googleSpendMattressDayWise.reduce((sum, item) => sum + item, 0)];
    googleSpendMattressDayWise.forEach((spend) => googleSpendMattress.push(roundOffToTwoDigits(spend)));

    const totalPerformanceMarketingSpendMattress = ["Total Performance Marketing spend (Mattress)", roundOffToTwoDigits(Number(facebookSpendMattress[1]) + Number(googleSpendMattress[1])) + ""];
    dates.map((date, dateIndex) => totalPerformanceMarketingSpendMattress.push(roundOffToTwoDigits(Number(facebookSpendMattress[dateIndex + 2]) + Number(googleSpendMattress[(dateIndex = 2)])) + ""));

    const nonMattressSpend = ["Non Mattress Spends", ""];
    dates.map((date, dateIndex) => nonMattressSpend.push(""));

    const facebookSpendNonMattressDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Facebook" && row.category == "Non Mattress"),
        "amountSpent",
        dates
    );
    const facebookSpendNonMattress = ["Facebook spend (Matttress)", roundOffToTwoDigits(facebookSpendNonMattressDayWise.reduce((sum, item) => sum + item, 0))];
    facebookSpendNonMattressDayWise.forEach((spend) => facebookSpendNonMattress.push(roundOffToTwoDigits(spend)));

    const googleSpendNonMattressDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Google" && row.category == "Non Mattress"),
        "amountSpent",
        dates
    );
    const googleSpendNonMattress = ["Google spend (Matttress)", roundOffToTwoDigits(googleSpendNonMattressDayWise.reduce((sum, item) => sum + item, 0))];
    googleSpendNonMattressDayWise.forEach((spend) => googleSpendNonMattress.push(roundOffToTwoDigits(spend)));

    const totalPerformanceMarketingSpendNonMattress = ["Total Performance Marketing spend (Mattress)", roundOffToTwoDigits(Number(facebookSpendNonMattress[1]) + Number(googleSpendNonMattress[1])) + ""];
    dates.map((date, dateIndex) =>
        totalPerformanceMarketingSpendNonMattress.push(roundOffToTwoDigits(Number(facebookSpendNonMattress[dateIndex + 2]) + Number(googleSpendNonMattress[(dateIndex = 2)])) + "")
    );

    const agentCostDayWise: Array<number> = [];
    dates.map((date, dateIndex) => agentCostDayWise.push(17806));

    const agentCost = ["Agent cost", agentCostDayWise.reduce((sum, item) => sum + item, 0)];
    dates.map((date, dateIndex) => agentCost.push(agentCostDayWise[dateIndex] + ""));

    const agencyCostDayWise: Array<number> = [];
    dates.map((date, dateIndex) => agencyCostDayWise.push(2634));

    const agencyCost = ["Agency cost", agencyCostDayWise.reduce((sum, item) => sum + item, 0)];
    dates.map((date, dateIndex) => agencyCost.push(agencyCostDayWise[dateIndex] + ""));

    const totalMattressSpendAfterAgentAndAgencyCost = [
        "Total Mattress Spend (after agent & agency cost)",
        roundOffToTwoDigits(Number(totalPerformanceMarketingSpendMattress[1]) + Number(agentCost[1]) + Number(agencyCost[1])) + "",
    ];
    dates.map((date, dateIndex) =>
        totalMattressSpendAfterAgentAndAgencyCost.push(roundOffToTwoDigits(Number(totalPerformanceMarketingSpendMattress[dateIndex + 2]) + Number(agentCost[dateIndex + 2]) + Number(agencyCost[dateIndex + 2])) + "")
    );

    const acosMarketing = ["Acos (Marketing)", ""];
    dates.map((date, dateIndex) => acosMarketing.push(""));

    const marketingAcosMattress = ["Marketing Acos (Mattress)", roundOffToTwoDigits(Number(totalPerformanceMarketingSpendMattress[1]) / Number(netRevenueAfterTaxAndReturnMattreess[1]) * 100) + ""];
    dates.map((date, dateIndex) => marketingAcosMattress.push(roundOffToTwoDigits(Number(totalPerformanceMarketingSpendMattress[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnMattreess[dateIndex + 2]) * 100) + ""));

    const marketingAcosNonMattress = [
        "Marketing Acos (Non Mattress)",
        roundOffToTwoDigits((Number(totalPerformanceMarketingSpendNonMattress[1]) / Number(netRevenueAfterTaxAndReturnNonMattreess[1])) * 100) + "",
    ];
    dates.map((date, dateIndex) =>
        marketingAcosNonMattress.push(roundOffToTwoDigits(Number(totalPerformanceMarketingSpendNonMattress[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnNonMattreess[dateIndex + 2]) * 100) + "")
    );

    const netAcosSleep = [
        "Net Acos (sleep)",
        roundOffToTwoDigits((Number(totalMattressSpendAfterAgentAndAgencyCost[1]) + Number(totalPerformanceMarketingSpendNonMattress[1])) /
            (Number(netRevenueAfterTaxAndReturnMattreess[1]) + Number(netRevenueAfterTaxAndReturnNonMattreess[1])) * 100) +
            "",
    ];
    dates.map((date, dateIndex) =>
        netAcosSleep.push(roundOffToTwoDigits(
            (Number(totalMattressSpendAfterAgentAndAgencyCost[dateIndex + 2]) + Number(totalPerformanceMarketingSpendNonMattress[dateIndex + 2])) /
                (Number(netRevenueAfterTaxAndReturnMattreess[dateIndex + 2]) + Number(netRevenueAfterTaxAndReturnNonMattreess[dateIndex + 2])) * 100) +
                ""
        )
    );

    const netAcosMattress = ["Net Acos (Mattress)", roundOffToTwoDigits(Number(totalMattressSpendAfterAgentAndAgencyCost[1]) / Number(netRevenueAfterTaxAndReturnMattreess[1]) * 100) + ""];
    dates.map((date, dateIndex) =>
        netAcosMattress.push(roundOffToTwoDigits((Number(totalMattressSpendAfterAgentAndAgencyCost[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnMattreess[dateIndex + 2])) * 100) + "")
    );

    const netAcosNonMattress = ["Net Acos (Non Mattress)", roundOffToTwoDigits((Number(totalPerformanceMarketingSpendNonMattress[1]) / Number(netRevenueAfterTaxAndReturnNonMattreess[1])) * 100) + ""];
    dates.map((date, dateIndex) =>
        netAcosNonMattress.push(roundOffToTwoDigits((Number(totalPerformanceMarketingSpendNonMattress[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnNonMattreess[dateIndex + 2])) * 100) + "")
    );

    const noOfAgents = ["No. of Agents", "17"];
    dates.map((date, dateIndex) => noOfAgents.push("17"));

    const costPerLead = ["CPL", roundOffToTwoDigits(Number(totalPerformanceMarketingSpendMattress[1]) / Number(totalLeads[1])) + ""];
    dates.map((date, dateIndex) => costPerLead.push(roundOffToTwoDigits(Number(totalPerformanceMarketingSpendMattress[dateIndex + 2]) / Number(totalLeads[dateIndex + 2])) + ""));

    const aovMattress = ["AOV (Mattress)", roundOffToTwoDigits(Number(netRevenueAfterTaxMattreess[1]) / Number(mattressUnits[1])) + ""];
    dates.map((date, dateIndex) => aovMattress.push(roundOffToTwoDigits(Number(netRevenueAfterTaxMattreess[dateIndex + 2]) / Number(mattressUnits[dateIndex + 2])) + ""));

    const aovNonMattress = ["AOV (Non Mattress)", roundOffToTwoDigits(Number(netRevenueAfterTaxNonMattreess[1]) / Number(nonMattressUnits[1])) + ""];
    dates.map((date, dateIndex) => aovNonMattress.push(roundOffToTwoDigits(Number(netRevenueAfterTaxNonMattreess[dateIndex + 2]) / Number(nonMattressUnits[dateIndex + 2])) + ""));

    const dodColumnDefs: Array<{headerName: string; field: string; width?:string}> = [
        {headerName: "", field: "0" , width:"400"},
        {headerName: "", field: "1"},
    ];

    dates.map((date, index) =>
        dodColumnDefs.push({
            headerName: "",
            field: index+2+"",
        })
    );

    const rowData = totalLeads.map((leads, index) => [
        dodFirstRow[index],
        dodSecondRow[index],
        totalLeads[index],
        performaceLeadsMattress[index],
        facebookLeadsMattress[index],
        conversionRate[index],
        performanceConversionRate[index],
        facebookConversionRate[index],
        unitsPerformanceAds[index],
        unitsFacebookAds[index],
        unitsSleep[index],
        mattressUnits[index],
        directMattressUnits[index],
        assistedMattressUnits[index],
        nonMattressUnits[index],
        aovMattress[index],
        aovNonMattress[index],
        revenueSleep[index],
        netSalesMattress[index],
        cancellationsMattress[index],
        revenueMattressAfterCancellations[index],
        netSalesNonMattress[index],
        cancellationsNonMattress[index],
        revenueNonMattressAfterCancellations[index],
        netRevenueAfterTaxMattreess[index],
        netRevenueAfterTaxNonMattreess[index],
        returnOnProvision[index],
        netRevenueAfterTaxAndReturnMattreess[index],
        netRevenueAfterTaxAndReturnNonMattreess[index],
        mattressSpend[index],
        facebookSpendMattress[index],
        googleSpendMattress[index],
        totalPerformanceMarketingSpendMattress[index],
        nonMattressSpend[index],
        facebookSpendNonMattress[index],
        googleSpendNonMattress[index],
        totalPerformanceMarketingSpendNonMattress[index],
        agentCost[index],
        agencyCost[index],
        totalMattressSpendAfterAgentAndAgencyCost[index],
        acosMarketing[index],
        marketingAcosMattress[index],
        marketingAcosNonMattress[index],
        netAcosSleep[index],
        netAcosMattress[index],
        netAcosNonMattress[index],
        noOfAgents[index],
        costPerLead[index],
    ]);

    return (
        <>
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Sleep</div>

            <VerticalSpacer className="tw-h-8" />

            <Tabs.Root defaultValue="2" className="tw-col-span-12">
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
                                    // columnDefs={dodColumnDefs}
                                    columnDefs={dodColumnDefs}
                                    defaultColDef={defaultColumnDefinitions} animateRows={true} enableRangeSelection={true} />
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

    const weekDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["january", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const dodFirstRow = ["", "MTD"];
    dates.forEach((date) => dodFirstRow.push(weekDay[new Date(date).getDay()]));

    const dodSecondRow = ["", months[new Date(minDate).getMonth()]];
    dates.forEach((date) => dodSecondRow.push(new Intl.DateTimeFormat("en", {timeZone: "UTC", dateStyle: "medium"}).format(new Date(date))));

    const leadsDayWise = aggregateByDate(
        filterFreshsalesData.filter((row) => row.category == "Water Purifier"),
        "count",
        dates
    );
    const totalLeads = ["Total Leads", leadsDayWise.reduce((sum, item) => sum + item, 0)];
    leadsDayWise.forEach((lead) => totalLeads.push(lead));

    const performaceLeadsDayWise = aggregateByDate(
        filterFreshsalesData.filter((row) => doesLeadCaptureSourceCorrespondToPerformanceLead(row.leadCaptureSource) && row.category == "Water Purifier"),
        "count",
        dates
    );
    const performaceLeadsWP = ["Performance Leads(Water Purifier)", performaceLeadsDayWise.reduce((sum, item) => sum + item, 0)];
    performaceLeadsDayWise.forEach((lead) => performaceLeadsWP.push(lead));

    const facebookLeadsDayWise = aggregateByDate(
        filterFreshsalesData.filter((row) => !doesLeadCaptureSourceCorrespondToPerformanceLead(row.leadCaptureSource) && row.category == "Water Purifier"),
        "count",
        dates
    );
    const facebookLeadsWP = ["Performance Leads(Water Purifier)", facebookLeadsDayWise.reduce((sum, item) => sum + item, 0)];
    facebookLeadsDayWise.forEach((lead) => facebookLeadsWP.push(lead));

    const wpUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Water Purifier"),
        "netQuantity",
        dates
    );
    const wpUnits = ["Units (WP)", wpUnitsDayWise.reduce((sum, item) => sum + item, 0)];
    wpUnitsDayWise.forEach((units) => wpUnits.push(units + ""));

    const assistedWPUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Water Purifier" && row.isAssisted == true),
        "netQuantity",
        dates
    );
    const assistedWPUnits = ["Assissted Units (WP)", assistedWPUnitsDayWise.reduce((sum, item) => sum + item, 0)];
    assistedWPUnitsDayWise.forEach((units) => assistedWPUnits.push(units + ""));

    const directWPUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Water Purifier" && row.isAssisted == false),
        "netQuantity",
        dates
    );
    const directWPUnits = ["Direct Units (WP)", directWPUnitsDayWise.reduce((sum, item) => sum + item, 0)];
    directWPUnitsDayWise.forEach((units) => directWPUnits.push(units + ""));

    const performanceWPUnitDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Water Purifier" && doesAdsCampaignNameCorrespondToPerformanceLead(row.leadGenerationSource)),
        "netQuantity",
        dates
    );
    const unitsPerformanceAds = ["Units ( Performance)", performanceWPUnitDayWise.reduce((sum, item) => sum + item, 0)];
    performanceWPUnitDayWise.forEach((units) => unitsPerformanceAds.push(units + ""));

    const facebookWPUnitDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Water Purifier" && !doesAdsCampaignNameCorrespondToPerformanceLead(row.leadGenerationSource)),
        "netQuantity",
        dates
    );
    const unitsFacebookAds = ["Units ( facebook Ads)", facebookWPUnitDayWise.reduce((sum, item) => sum + item, 0)];
    facebookWPUnitDayWise.forEach((units) => unitsFacebookAds.push(units + ""));

    const conversionRateDayWise = dates.map((date, dateIndex) => roundOffToTwoDigits((wpUnitsDayWise[dateIndex] / leadsDayWise[dateIndex]) * 100) + " %");
    const conversionRate = ["CR %", roundOffToTwoDigits((wpUnitsDayWise.reduce((sum, item) => sum + item, 0) / leadsDayWise.reduce((sum, item) => sum + item, 0)) * 100) + " %"];
    conversionRateDayWise.forEach((conversion) => conversionRate.push(conversion));

    const performaceConversionRateDayWise = dates.map((date, dateIndex) => roundOffToTwoDigits((performanceWPUnitDayWise[dateIndex] / performaceLeadsDayWise[dateIndex]) * 100) + " %");
    const performanceConversionRate = [
        "Performance CR %",
        roundOffToTwoDigits((performanceWPUnitDayWise.reduce((sum, item) => sum + item, 0) / performaceLeadsDayWise.reduce((sum, item) => sum + item, 0)) * 100) + " %",
    ];
    performaceConversionRateDayWise.forEach((conversion) => performanceConversionRate.push(conversion));

    const facebookConversionRateDayWise = dates.map((date, dateIndex) => roundOffToTwoDigits((facebookWPUnitDayWise[dateIndex] / facebookLeadsDayWise[dateIndex]) * 100) + " %");
    const facebookConversionRate = [
        "Facebook CR %",
        roundOffToTwoDigits((facebookWPUnitDayWise.reduce((sum, item) => sum + item, 0) / facebookLeadsDayWise.reduce((sum, item) => sum + item, 0)) * 100) + " %",
    ];
    facebookConversionRateDayWise.forEach((conversion) => facebookConversionRate.push(conversion));


    const netRevenueWPDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Water Purifier"),
        "netSales",
        dates
    );
    const netRevenueWP = ["Net Revenue (WP)", roundOffToTwoDigits(netRevenueWPDayWise.reduce((sum, item) => sum + item, 0))];
    netRevenueWPDayWise.forEach((sale) => netRevenueWP.push(roundOffToTwoDigits(sale)));

    const netRevenueAfterTaxWP = ["Net Revenue (after tax) WP", roundOffToTwoDigits(Number(netRevenueWP[1]) / 1.18) + ""];
    dates.map((date, dateIndex) => netRevenueAfterTaxWP.push(roundOffToTwoDigits(Number(netRevenueWP[dateIndex + 2]) / 1.18) + ""));

    const returnOnProvision = ["Return On Provision", "5.0%"];
    dates.map((date, dateIndex) => returnOnProvision.push("5.0%"));

    const netRevenueAfterTaxAndReturnWP = ["Net Revenue (after Tax & Retuen) Mattress", roundOffToTwoDigits(Number(netRevenueAfterTaxWP[1]) - (Number(netRevenueAfterTaxWP[1]) * 5) / 100) + ""];
    dates.map((date, dateIndex) => netRevenueAfterTaxAndReturnWP.push(roundOffToTwoDigits(Number(netRevenueAfterTaxWP[dateIndex + 2]) - (Number(netRevenueAfterTaxWP[dateIndex + 2]) * 5) / 100) + ""));

    const wpSpend = ["WP Spends", ""];
    dates.map((date, dateIndex) => wpSpend.push(""));

    const facebookSpendWPDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Facebook" && row.category == "Water Purifier"),
        "amountSpent",
        dates
    );
    const facebookSpendWP = ["Facebook spend (WP)", roundOffToTwoDigits(facebookSpendWPDayWise.reduce((sum, item) => sum + item, 0))];
    facebookSpendWPDayWise.forEach((spend) => facebookSpendWP.push(roundOffToTwoDigits(spend)));

    const googleSpendWPDayWise = aggregateByDate(
        filterAdsData.filter((row) => row.platform == "Google" && row.category == "Water Purifier"),
        "amountSpent",
        dates
    );
    const googleSpendWP = ["Google spend (WP)", googleSpendWPDayWise.reduce((sum, item) => sum + item, 0)];
    googleSpendWPDayWise.forEach((spend) => googleSpendWP.push(roundOffToTwoDigits(spend)));

    const totalPerformanceMarketingSpendWP = ["Total Performance Marketing spend (WP)", roundOffToTwoDigits(Number(facebookSpendWP[1]) + Number(googleSpendWP[1])) + ""];
    dates.map((date, dateIndex) => totalPerformanceMarketingSpendWP.push(roundOffToTwoDigits(Number(facebookSpendWP[dateIndex + 2]) + Number(googleSpendWP[(dateIndex = 2)])) + ""));


    const agentCostDayWise: Array<number> = [];
    dates.map((date, dateIndex) => agentCostDayWise.push(23694));

    const agentCost = ["Agent cost", agentCostDayWise.reduce((sum, item) => sum + item, 0)];
    dates.map((date, dateIndex) => agentCost.push(agentCostDayWise[dateIndex] + ""));

    const agencyCostDayWise: Array<number> = [];
    dates.map((date, dateIndex) => agencyCostDayWise.push(2634));

    const agencyCost = ["Agency cost", agencyCostDayWise.reduce((sum, item) => sum + item, 0)];
    dates.map((date, dateIndex) => agencyCost.push(agencyCostDayWise[dateIndex] + ""));

    const totalWPSpendAfterAgentAndAgencyCost = [
        "Total WP Spend (after agent & agency cost)",
        roundOffToTwoDigits(Number(totalPerformanceMarketingSpendWP[1]) + Number(agentCost[1]) + Number(agencyCost[1])) + "",
    ];
    dates.map((date, dateIndex) =>
        totalWPSpendAfterAgentAndAgencyCost.push(
            roundOffToTwoDigits(Number(totalPerformanceMarketingSpendWP[dateIndex + 2]) + Number(agentCost[dateIndex + 2]) + Number(agencyCost[dateIndex + 2])) + ""
        )
    );

    const marketingAcos = ["Acos (Marketing)", roundOffToTwoDigits((Number(totalPerformanceMarketingSpendWP[1]) / Number(netRevenueAfterTaxAndReturnWP[1])) * 100) + ""];
    dates.map((date, dateIndex) =>
        marketingAcos.push(roundOffToTwoDigits((Number(totalPerformanceMarketingSpendWP[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnWP[dateIndex + 2])) * 100) + "")
    );

    const netAcosWP = [
        "Net Acos (WP)",
        roundOffToTwoDigits(
            (Number(totalWPSpendAfterAgentAndAgencyCost[1]) / Number(netRevenueAfterTaxAndReturnWP[1])) * 100
        ) + "",
    ];
    dates.map((date, dateIndex) => netAcosWP.push(roundOffToTwoDigits((Number(totalWPSpendAfterAgentAndAgencyCost[dateIndex + 2]) / Number(netRevenueAfterTaxAndReturnWP[dateIndex + 2])) * 100) + ""));


    const noOfAgents = ["No. of Agents", "23"];
    dates.map((date, dateIndex) => noOfAgents.push("23"));

    const costPerLead = ["CPL", roundOffToTwoDigits(Number(totalPerformanceMarketingSpendWP[1]) / Number(totalLeads[1])) + ""];
    dates.map((date, dateIndex) => costPerLead.push(roundOffToTwoDigits(Number(totalPerformanceMarketingSpendWP[dateIndex + 2]) / Number(totalLeads[dateIndex + 2])) + ""));

    const aovWP = ["AOV (WP)", roundOffToTwoDigits(Number(netRevenueAfterTaxWP[1]) / Number(wpUnits[1])) + ""];
    dates.map((date, dateIndex) => aovWP.push(roundOffToTwoDigits(Number(netRevenueAfterTaxWP[dateIndex + 2]) / Number(wpUnits[dateIndex + 2])) + ""));

    const dodColumnDefs: Array<{headerName: string; field: string; width?: string}> = [
        {headerName: "", field: "0", width: "400"},
        {headerName: "", field: "1"},
    ];

    dates.map((date, index) =>
        dodColumnDefs.push({
            headerName: "",
            field: index + 2 + "",
        })
    );

    const rowData = totalLeads.map((leads, index) => [
        dodFirstRow[index],
        dodSecondRow[index],
        totalLeads[index],
        performaceLeadsWP[index],
        facebookLeadsWP[index],
        conversionRate[index],
        performanceConversionRate[index],
        facebookConversionRate[index],
        unitsPerformanceAds[index],
        unitsFacebookAds[index],
        wpUnits[index],
        directWPUnits[index],
        assistedWPUnits[index],
        aovWP[index],
        netRevenueWP[index],
        netRevenueAfterTaxWP[index],
        returnOnProvision[index],
        netRevenueAfterTaxAndReturnWP[index],
        wpSpend[index],
        facebookSpendWP[index],
        googleSpendWP[index],
        totalPerformanceMarketingSpendWP[index],
        agentCost[index],
        agencyCost[index],
        totalWPSpendAfterAgentAndAgencyCost[index],
        marketingAcos[index],
        netAcosWP[index],
        noOfAgents[index],
        costPerLead[index],
    ]);

    return (
        <>
            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Water Purifier</div>

            <VerticalSpacer className="tw-h-8" />

            <Tabs.Root defaultValue="2" className="tw-col-span-12">
                <Tabs.List className="">
                    <Tabs.Trigger value="1" className="lp-tab">
                        WP Summary
                    </Tabs.Trigger>
                    <Tabs.Trigger value="2" className="lp-tab" se>
                        WP DOD
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
                                    // columnDefs={dodColumnDefs}
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
