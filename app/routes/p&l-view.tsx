import * as Tabs from "@radix-ui/react-tabs";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import { AgGridReact } from "ag-grid-react";
import {DateTime, Info} from "luxon";
import {useState} from "react";
import {AdsData, AdsDataAggregatedRow, FreshsalesData, getAdsData, getFreshsalesData, getShopifyData, ShopifyData, ShopifyDataAggregatedRow, TimeGranularity} from "~/backend/business-insights";
import {getCapturedUtmCampaignLibrary, getProductLibrary, ProductInformation, SourceInformation} from "~/backend/common";
import { aggregateByDate, doesAdsCampaignNameCorrespondToPerformanceLead, doesLeadCaptureSourceCorrespondToPerformanceLead } from "~/backend/utilities/utilities";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {DateFilterSection, GenericCard} from "~/components/scratchpad";
import {Iso8601Date} from "~/utilities/typeDefinitions";
import {getDates, getNonEmptyStringOrNull} from "~/utilities/utilities";

export const meta: MetaFunction = () => {
    return {
        title: "P&L summary Report - Intellsys",
    };
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
                    summaryRowFormat={summaryRowFormat.sleep}
                    dodRowFormat={dodRowFormat.sleep}
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
                    summaryRowFormat={summaryRowFormat.waterPurifier}
                    dodRowFormat={dodRowFormat.waterPurifier}
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
    summaryRowFormat,
    dodRowFormat,
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

    const dodFirstRow = ["","MTD"];
    dodFirstRow.push(dates.reduce(date => new Date(date).getDay));

    const dodSecondRow = ["",new Date(minDate).getMonth];
    dodSecondRow.push(dates.reduce((date) => new Intl.DateTimeFormat("en", {timeZone: "UTC", dateStyle: "medium", timeStyle: "short", hour12: true}).format(new Date(date))));

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
        filterShopifyData.filter((row) => row),
        "netQuantity",
        dates
    );

    const assistedMattressUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress" && row.isAssisted == true),
        "netQuantity",
        dates
    );

    const directMattressUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress" && row.isAssisted == false),
        "netQuantity",
        dates
    );

    const nonMattressUnitsDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Non Mattress"),
        "netQuantity",
        dates
    );

    const performanceMattressUnitDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress" && doesAdsCampaignNameCorrespondToPerformanceLead(row.leadGenerationSource)),
        "netQuantity",
        dates
    );

    const facebookmattressUnitDayWise = aggregateByDate(
        filterShopifyData.filter((row) => row.productCategory == "Mattress" && !doesAdsCampaignNameCorrespondToPerformanceLead(row.leadGenerationSource)),
        "netQuantity",
        dates
    );

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

    console.log("Filtered shopify data", filterFreshsalesData);
    console.log("shopify data", filterShopifyData);






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
                                    rowData={dodRowFormat.map((title, titleIndex) => ({
                                        title: title,
                                        firstRow: dodFirstRow,
                                    }))}
                                    columnDefs={[
                                        {headerName: "", field: "firstRow"},
                                        {headerName: "", field: "secondRow"},
                                        {headerName: "Performance Leads Count", field: "performanceLeads"},
                                        {headerName: "Performance Leads CPL", field: "performanceLeadsCpl"},
                                        {headerName: "Performance Leads SPL", field: "performanceLeadsSpl"},
                                        {headerName: "Performance Leads ACOS", field: "performanceLeadsAcos"},
                                        {headerName: "Performance Leads NetSales", field: "performanceLeadsnetSales"},
                                        {headerName: "Facebook Leads Count", field: "facebookLeads"},
                                        {headerName: "Facebook Leads CPL", field: "facebookLeadsCpl"},
                                        {headerName: "Facebook Leads SPL", field: "facebookLeadsSpl"},
                                        {headerName: "Facebook Leads ACOS", field: "facebookLeadsAcos"},
                                    ]}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                />
                            </div>
                        }
                        metaQuery={freshsalesLeadsData.metaQuery}
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
    summaryRowFormat,
    dodRowFormat,
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
