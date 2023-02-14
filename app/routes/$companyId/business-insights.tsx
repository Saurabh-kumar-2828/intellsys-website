import * as Tabs from "@radix-ui/react-tabs";
import {LinksFunction, LoaderFunction, MetaFunction, redirect} from "@remix-run/node";
import {json} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import "ag-grid-enterprise";
import {AgGridReact} from "ag-grid-react";
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from "chart.js";
import { Companies } from "do-not-commit";
import {DateTime} from "luxon";
import {useEffect, useState} from "react";
import {Bar, Line} from "react-chartjs-2";
import {AdsData, AdsDataAggregatedRow, FreshsalesData, getAdsData, getFreshsalesData, getShopifyData, getTimeGranularityFromUnknown, ShopifyData, ShopifyDataAggregatedRow, TimeGranularity} from "~/backend/business-insights";
import {getCampaignLibrary, getProductLibrary, ProductInformation, CampaignInformation} from "~/backend/common";
import { getAccessTokenFromCookies } from "~/backend/utilities/cookieSessionsHelper.server";
import {createGroupByReducer, doesAdsCampaignNameCorrespondToPerformanceLead, doesLeadCaptureSourceCorrespondToPerformanceLead} from "~/utilities/utilities";
import {progressCellRenderer} from "~/components/progressCellRenderer";
import {HorizontalSpacer} from "~/components/reusableComponents/horizontalSpacer";
import {
    Card,
    DateFilterSection,
    FancySearchableMultiSelect,
    GenericCard,
    LargeValueDisplayingCardWithTarget,
    SectionHeader,
    SmallValueDisplayingCardWithTarget,
    ValueDisplayingCard,
} from "~/components/scratchpad";
import {Iso8601Date, QueryFilterType, ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
import {
    adsColorPalette,
    agGridDateComparator,
    dateToMediumNoneEnFormat,
    defaultColumnDefinitions,
    distinct,
    getDates,
    getNonEmptyStringOrNull,
    numberToHumanFriendlyString,
    roundOffToTwoDigits,
} from "~/utilities/utilities";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";

export const meta: MetaFunction = () => {
    return {
        title: "Business Insights - Intellsys",
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
    allCampaignInformation: Array<CampaignInformation>;
    freshsalesLeadsData: FreshsalesData;
    adsData: {
        metaQuery: string;
        rows: Array<AdsDataAggregatedRow>;
    };
    shopifyData: {
        metaQuery: string;
        rows: Array<ShopifyDataAggregatedRow>;
    };
    companyId: Uuid;
};

export const loader: LoaderFunction = async ({request, params}) => {

    const accessToken = await getAccessTokenFromCookies(request);

    if (accessToken == null) {
        // TODO: Add message in login page
        return redirect(`/sign-in?redirectTo=${getUrlFromRequest(request)}`);
    }

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const urlSearchParams = new URL(request.url).searchParams;

    const selectedGranularityRaw = getNonEmptyStringOrNull(urlSearchParams.get("selected_granularity"));
    const selectedGranularity: TimeGranularity = selectedGranularityRaw == null ? TimeGranularity.daily : getTimeGranularityFromUnknown(selectedGranularityRaw);

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


    const loaderData: LoaderData = {
        appliedMinDate: minDate,
        appliedMaxDate: maxDate,
        appliedSelectedGranularity: selectedGranularity,
        allProductInformation: await getProductLibrary(companyId),
        allCampaignInformation: await getCampaignLibrary(companyId),
        freshsalesLeadsData: await getFreshsalesData(minDate, maxDate, selectedGranularity, companyId),
        adsData: await getAdsData(minDate, maxDate, selectedGranularity, companyId),
        shopifyData: await getShopifyData(minDate, maxDate, selectedGranularity, companyId),
        companyId: companyId,
    };

    return json(loaderData);
};

export default function () {
    const {appliedMinDate, appliedMaxDate, allProductInformation, allCampaignInformation, freshsalesLeadsData, adsData, shopifyData, companyId} = useLoaderData() as LoaderData;

    // Default values of filters
    const businesses = distinct(allProductInformation.map((productInformation) => productInformation.category));
    let products = distinct(allProductInformation.map((productInformation) => productInformation.productName));
    let campaigns = distinct(allCampaignInformation.map((campaignInformation) => campaignInformation.campaignName));
    const platforms = distinct(allCampaignInformation.map((campaignInformation) => campaignInformation.platform));

    const [selectedCategories, setSelectedCategories] = useState<Array<string>>([]);
    const [selectedProducts, setSelectedProducts] = useState<Array<string>>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Array<string>>([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState<Array<string>>([]);
    const [selectedGranularity, setSelectedGranularity] = useState<TimeGranularity>(TimeGranularity.daily);
    const [selectedMinDate, setSelectedMinDate] = useState<Iso8601Date>(appliedMinDate);
    const [selectedMaxDate, setSelectedMaxDate] = useState<Iso8601Date>(appliedMaxDate);

    products = allProductInformation
        .filter((productInformation: ProductInformation) => selectedCategories.length == 0 || selectedCategories.includes(productInformation.category))
        .map((productInformation) => productInformation.productName);
    campaigns = distinct(
        allCampaignInformation
            .filter((campaignInformation) => selectedCategories.length == 0 || selectedCategories.includes(campaignInformation.category))
            .filter((campaignInformation) => selectedPlatforms.length == 0 || selectedPlatforms.includes(campaignInformation.platform))
            .map((campaignInformation) => campaignInformation.campaignName)
    );
    const granularities = [TimeGranularity.daily, TimeGranularity.monthly, TimeGranularity.yearly];

    useEffect(() => {
        setSelectedProducts([]);
        setSelectedPlatforms([]);
        setSelectedCampaigns([]);
    }, [selectedCategories]);

    useEffect(() => {
        setSelectedCampaigns([]);
    }, [selectedProducts]);

    const numberOfSelectedDays = DateTime.fromISO(appliedMaxDate).diff(DateTime.fromISO(appliedMinDate), "days").toObject().days! + 1;

    // TODO: Remove before push
    // const shopifyDataToExportAsCsv = {
    //     data: shopifyData.rows || [],
    //     filename: "shopifyData",
    //     delimiter: ",",
    // };

    // const adsDataToExportAsCsv = {
    //     data: adsData.rows || [],
    //     filename: "adsData",
    //     delimiter: ",",
    // };

    // const leadsDataToExportAsCsv = {
    //     data: freshsalesLeadsData.rows || [],
    //     filename: "leadsData",
    //     delimiter: ",",
    // };

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8 tw-sticky">
            <DateFilterSection
                granularities={granularities}
                selectedGranularity={selectedGranularity}
                setSelectedGranularity={setSelectedGranularity}
                selectedMinDate={selectedMinDate}
                setSelectedMinDate={setSelectedMinDate}
                selectedMaxDate={selectedMaxDate}
                setSelectedMaxDate={setSelectedMaxDate}
                page={`/${companyId}/business-insights`}
            />

            <div className="tw-col-span-12 tw-bg-dark-bg-400 tw-sticky tw-top-32 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                <FancySearchableMultiSelect
                    label="Choose Category"
                    options={businesses}
                    selectedOptions={selectedCategories}
                    setSelectedOptions={setSelectedCategories}
                    filterType={QueryFilterType.category}
                />
                <FancySearchableMultiSelect
                    label="Choose Products"
                    options={products}
                    selectedOptions={selectedProducts}
                    setSelectedOptions={setSelectedProducts}
                    filterType={QueryFilterType.product}
                />
                <FancySearchableMultiSelect
                    label="Choose Platforms"
                    options={platforms}
                    selectedOptions={selectedPlatforms}
                    setSelectedOptions={setSelectedPlatforms}
                    filterType={QueryFilterType.platform}
                />
                <FancySearchableMultiSelect
                    label="Choose Campaigns"
                    options={campaigns}
                    selectedOptions={selectedCampaigns}
                    setSelectedOptions={setSelectedCampaigns}
                    filterType={QueryFilterType.campaign}
                />
            </div>

            {/* <button type="button" onClick={() => csvDownload(shopifyDataToExportAsCsv)} className="tw-lp-button">
                Export shopify as CSV
            </button>

            <button type="button" onClick={() => csvDownload(adsDataToExportAsCsv)} className="tw-lp-button">
                Export ads as CSV
            </button>

            <button type="button" onClick={() => csvDownload(leadsDataToExportAsCsv)} className="tw-lp-button">
                Export freshsales leads as CSV
            </button> */}

            <LeadsSection
                adsData={adsData}
                freshsalesLeadsData={freshsalesLeadsData}
                shopifyData={shopifyData}
                minDate={appliedMinDate}
                maxDate={appliedMaxDate}
                selectedCategories={selectedCategories}
                selectedProducts={selectedProducts}
                selectedPlatforms={selectedPlatforms}
                selectedCampaigns={selectedCampaigns}
            />

            <OrdersSection
                adsData={adsData}
                freshsalesLeadsData={freshsalesLeadsData}
                shopifyData={shopifyData}
                minDate={appliedMinDate}
                maxDate={appliedMaxDate}
                selectedCategories={selectedCategories}
                selectedProducts={selectedProducts}
                selectedPlatforms={selectedPlatforms}
                selectedCampaigns={selectedCampaigns}
                numberOfSelectedDays={numberOfSelectedDays}
            />

            <RevenueSection
                adsData={adsData}
                freshsalesLeadsData={freshsalesLeadsData}
                shopifyData={shopifyData}
                minDate={appliedMinDate}
                maxDate={appliedMaxDate}
                selectedCategories={selectedCategories}
                selectedProducts={selectedProducts}
                selectedPlatforms={selectedPlatforms}
                selectedCampaigns={selectedCampaigns}
            />

            <SpendSection
                adsData={adsData}
                freshsalesLeadsData={freshsalesLeadsData}
                shopifyData={shopifyData}
                minDate={appliedMinDate}
                maxDate={appliedMaxDate}
                selectedCategories={selectedCategories}
                selectedProducts={selectedProducts}
                selectedPlatforms={selectedPlatforms}
                selectedCampaigns={selectedCampaigns}
                numberOfSelectedDays={numberOfSelectedDays}
            />
        </div>
    );
}

function LeadsSection({
    freshsalesLeadsData,
    adsData,
    shopifyData,
    minDate,
    maxDate,
    selectedCategories,
    selectedProducts,
    selectedPlatforms,
    selectedCampaigns,
}: {
    freshsalesLeadsData: FreshsalesData;
    adsData: AdsData;
    shopifyData: ShopifyData;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    selectedCategories: Array<string>;
    selectedProducts: Array<string>;
    selectedPlatforms: Array<string>;
    selectedCampaigns: Array<string>;
}) {
    // Metrics
    const [showAcos, setShowAcos] = useState(true);
    const [showCpl, setShowCpl] = useState(false);
    const [showSpl, setShowSpl] = useState(false);

    const filterFreshsalesData = freshsalesLeadsData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform))
        .filter((row) => selectedCampaigns.length == 0 || selectedCampaigns.includes(row.leadGenerationSourceCampaignName));

    const filterShopifyData = shopifyData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.productCategory))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform))
        .filter((row) => selectedCampaigns.length == 0 || selectedCampaigns.includes(row.leadGenerationSourceCampaignName))
        .filter((row) => selectedProducts.length == 0 || selectedProducts.includes(row.productTitle));

    const filterAdsData = adsData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.platform))
        .filter((row) => selectedCampaigns.length == 0 || selectedCampaigns.includes(row.campaignName));

    const dates = getDates(minDate, maxDate);

    // Performance Leads
    const performanceLeads = {
        countDayWise: aggregateByDate(
            filterFreshsalesData.filter((row) => doesLeadCaptureSourceCorrespondToPerformanceLead(row.leadCaptureSource)),
            "count",
            dates
        ),
        amountSpentDayWise: aggregateByDate(
            filterAdsData.filter((row) => doesAdsCampaignNameCorrespondToPerformanceLead(row.campaignName)),
            "amountSpent",
            dates
        ),
        netSalesDayWise: aggregateByDate(
            filterShopifyData.filter((row) => doesLeadCaptureSourceCorrespondToPerformanceLead(row.leadCaptureSource)),
            "netSales",
            dates
        ),
    };

    const performanceLeadsCount = {
        count: performanceLeads.countDayWise.reduce(sumReducer),
    };

    const performanceLeadsCpl = {
        // metaInformation: `Amount Spent / Leads Count | Performance = ${numberToHumanFriendlyString(performanceLeads.amountSpentDayWise.reduce(sumReducer, 0))} / ${numberToHumanFriendlyString(
        //     performanceLeadsCount.count
        // )}`,
        // metaQuery: adsData.metaQuery,
        cpl: numberToHumanFriendlyString(performanceLeads.amountSpentDayWise.reduce(sumReducer, 0) / performanceLeadsCount.count),
        dayWiseCpl: performanceLeads.amountSpentDayWise.map((value, index) => (performanceLeads.countDayWise[index] == 0 ? 0 : value / performanceLeads.countDayWise[index])),
    };

    const performanceLeadsSpl = {
        metaInformation: `Leads Sales / Leads Count | Performance = ${numberToHumanFriendlyString(performanceLeads.netSalesDayWise.reduce(sumReducer))} / ${numberToHumanFriendlyString(
            performanceLeadsCount.count
        )}`,
        spl: performanceLeads.netSalesDayWise.reduce(sumReducer) / performanceLeadsCount.count,
        dayWiseSpl: performanceLeads.netSalesDayWise.map((value, index) => (performanceLeads.countDayWise[index] == 0 ? 0 : value / performanceLeads.countDayWise[index])),
    };

    const performanceLeadsAcos = {
        metaInformation: `Amount Spent / Net Sales | Performance = ${numberToHumanFriendlyString(performanceLeads.amountSpentDayWise.reduce(sumReducer))} / ${numberToHumanFriendlyString(
            performanceLeads.netSalesDayWise.reduce(sumReducer)
        )}`,
        acos: performanceLeads.amountSpentDayWise.reduce(sumReducer) / performanceLeads.netSalesDayWise.reduce(sumReducer),
        dayWiseAcos: performanceLeads.amountSpentDayWise.map((value, index) => (performanceLeads.netSalesDayWise[index] == 0 ? 0 : value / performanceLeads.netSalesDayWise[index])),
    };

    const facebookLeads = {
        countDayWise: aggregateByDate(
            filterFreshsalesData.filter((row) => !doesLeadCaptureSourceCorrespondToPerformanceLead(row.leadCaptureSource)),
            "count",
            dates
        ),
        amountSpentDayWise: aggregateByDate(
            filterAdsData.filter((row) => !doesAdsCampaignNameCorrespondToPerformanceLead(row.campaignName)),
            "amountSpent",
            dates
        ),
        netSalesDayWise: aggregateByDate(
            filterShopifyData.filter((row) => !doesLeadCaptureSourceCorrespondToPerformanceLead(row.leadCaptureSource)),
            "netSales",
            dates
        ),
    };

    const facebookLeadsCount = {
        metaInformation: "Facebook Leads",
        count: facebookLeads.countDayWise.reduce(sumReducer, 0),
    };

    const facebookLeadsCpl = {
        metaInformation: `Amount Spent / Leads Count | Facebook = ${numberToHumanFriendlyString(facebookLeads.amountSpentDayWise.reduce(sumReducer, 0))} / ${numberToHumanFriendlyString(
            facebookLeadsCount.count
        )}`,
        metaQuery: adsData.metaQuery,
        cpl: facebookLeadsCount.count == 0 ? 0 : facebookLeads.amountSpentDayWise.reduce(sumReducer, 0) / facebookLeadsCount.count,
        dayWiseCpl: facebookLeads.amountSpentDayWise.map((value, index) => (facebookLeads.countDayWise[index] == 0 ? 0 : value / facebookLeads.countDayWise[index])),
    };

    const facebookLeadsSpl = {
        metaInformation: `Leads Sales / Leads Count | Facebook = ${numberToHumanFriendlyString(facebookLeads.netSalesDayWise.reduce(sumReducer, 0))} / ${numberToHumanFriendlyString(
            facebookLeadsCount.count
        )}`,
        spl: facebookLeadsCount.count == 0 ? 0 : facebookLeads.netSalesDayWise.reduce(sumReducer, 0) / facebookLeadsCount.count,
        dayWiseSpl: facebookLeads.netSalesDayWise.map((value, index) => (facebookLeads.countDayWise[index] == 0 ? 0 : value / facebookLeads.countDayWise[index])),
    };

    const facebookLeadsAcos = {
        metaInformation: `Amount Spent / Net Sales | Facebook = ${numberToHumanFriendlyString(facebookLeads.amountSpentDayWise.reduce(sumReducer, 0))} / ${numberToHumanFriendlyString(
            facebookLeads.netSalesDayWise.reduce(sumReducer, 0)
        )}`,
        acos: facebookLeads.amountSpentDayWise.reduce(sumReducer, 0) / facebookLeads.netSalesDayWise.reduce(sumReducer, 0),
        dayWiseAcos: facebookLeads.amountSpentDayWise.map((value, index) => (facebookLeads.netSalesDayWise[index] == 0 ? 0 : value / facebookLeads.netSalesDayWise[index])),
    };

    const totalLeadsCount = {
        metaInformation: `Performance Leads + Facebook Leads = ${numberToHumanFriendlyString(performanceLeadsCount.count)} + ${numberToHumanFriendlyString(facebookLeadsCount.count)}`,
        count: performanceLeadsCount.count + facebookLeadsCount.count,
    };

    const dataTableForLeadsDayWise = dates.reduce((result, curDate, index) => {
        result[curDate] = {
            performanceLeadsCount: roundOffToTwoDigits(performanceLeads.countDayWise[index]),
            performanceLeadsCpl: roundOffToTwoDigits(performanceLeadsCpl.dayWiseCpl[index]),
            performanceLeadsSpl: roundOffToTwoDigits(performanceLeadsSpl.dayWiseSpl[index]),
            performanceLeadsAcos: roundOffToTwoDigits(performanceLeadsAcos.dayWiseAcos[index]),
            performanceLeadsNetSales: roundOffToTwoDigits(performanceLeads.netSalesDayWise[index]),
            facebookLeadsCount: roundOffToTwoDigits(facebookLeads.countDayWise[index]),
            facebookLeadsCpl: roundOffToTwoDigits(facebookLeadsCpl.dayWiseCpl[index]),
            facebookLeadsSpl: roundOffToTwoDigits(facebookLeadsSpl.dayWiseSpl[index]),
            facebookLeadsAcos: roundOffToTwoDigits(facebookLeadsAcos.dayWiseAcos[index]),
            facebookLeadsNetSales: roundOffToTwoDigits(facebookLeads.netSalesDayWise[index]),
        };
        return result;
    }, {});

    const targetForLeadsDayWise = dates.reduce((result, curDate) => {
        result[curDate] = {
            performanceLeads: 700,
            performanceLeadsCpl: 70,
            performanceLeadsSpl: 800,
            performanceLeadsAcos: 1,
            performanceLeadsNetSales: 800000,
            facebookLeads: 60,
            facebookLeadsCpl: 1,
            facebookLeadsSpl: 300,
            facebookLeadsAcos: 1,
        };
        return result;
    }, {});

    //chartjs graphs
    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Day-wise distribution of total leads",
            },
        },
    };

    const labels = dates;
    const data = {
        labels,
        datasets: [
            {
                label: "Performance Leads",
                data: labels.map((date, index) => dataTableForLeadsDayWise[date].performanceLeadsCount),
                backgroundColor: adsColorPalette.performanceCount,
            },
            {
                label: "Facebook Leads",
                data: labels.map((date, index) => dataTableForLeadsDayWise[date].facebookLeadsCount),
                backgroundColor: adsColorPalette.facebookCount,
            },
        ],
    };

    const acosDayWiseOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Day-wise distribution",
            },
        },
    };

    const dayWiseAcos = {
        labels,
        datasets: [
            {
                label: "Performance Leads Acos",
                data: performanceLeadsAcos.dayWiseAcos,
                borderColor: "rgb(212, 172, 13)",
                backgroundColor: "rgb(212, 172, 13)",
            },
            {
                label: "Facebook Leads Acos",
                data: facebookLeadsAcos.dayWiseAcos,
                borderColor: "rgb(211, 84, 0)",
                backgroundColor: "rgb(211, 84, 0)",
            },
        ],
    };

    const cplDayWise = {
        labels,
        datasets: [
            {
                label: "Performance Leads Cpl",
                data: performanceLeadsCpl.dayWiseCpl,
                borderColor: "rgb(0, 102, 204)",
                backgroundColor: "rgb(0, 102, 204)",
            },
            {
                label: "Facebook Leads Cpl",
                data: facebookLeadsCpl.dayWiseCpl,
                borderColor: "rgb(211, 84, 100)",
                backgroundColor: "rgb(211, 84, 100)",
            },
        ],
    };

    const splDayWise = {
        labels,
        datasets: [
            {
                label: "Performance Leads Spl",
                data: performanceLeadsSpl.dayWiseSpl,
                borderColor: "rgb(179, 0, 179)",
                backgroundColor: "rgb(179, 0, 179)",
            },
            {
                label: "Facebook Leads Spl",
                data: facebookLeadsSpl.dayWiseSpl,
                borderColor: "rgb(51, 153, 102)",
                backgroundColor: "rgb(51, 153, 102)",
            },
        ],
    };

    return (
        <>
            <SectionHeader label="Leads" />

            <LargeValueDisplayingCardWithTarget
                label="Total Leads"
                value={totalLeadsCount.count}
                target={1 + totalLeadsCount.count * 1.3}
                explanation="Total number of leads recorded on Freshsales"
                type={ValueDisplayingCardInformationType.integer}
                equivalentQuery={`SELECT COUNT(*) FROM freshsales_leads_to_source_with_information WHERE DATE(lead_created_at)>=${minDate} AND DATE(lead_created_at)<=${maxDate}`}
            />

            <SmallValueDisplayingCardWithTarget
                label="Performance Leads"
                value={performanceLeadsCount.count}
                target={1 + performanceLeadsCount.count * 1.3}
                explanation="Number of leads recorded through performance campaigns"
                type={ValueDisplayingCardInformationType.integer}
                equivalentQuery={`SELECT COUNT(*) FROM freshsales_leads_to_source_with_information WHERE DATE(lead_created_at)>=${minDate} AND DATE(lead_created_at)<=${maxDate} AND lead_capture_source != Facebook On Form Ads`}
            />

            <SmallValueDisplayingCardWithTarget
                label="Performance Leads CPL"
                value={performanceLeadsCpl.cpl}
                target={1 + performanceLeadsCpl.cpl * 1.3}
                explanation={`(Amount Spent / Leads Count) | Performance = ${numberToHumanFriendlyString(performanceLeads.amountSpentDayWise.reduce(sumReducer, 0))} / ${numberToHumanFriendlyString(
                    performanceLeadsCount.count
                )}`}
                type={ValueDisplayingCardInformationType.float}
                equivalentQuery={``}
            />

            <SmallValueDisplayingCardWithTarget
                label="Performance Leads SPL"
                value={performanceLeadsSpl.spl}
                target={performanceLeadsSpl.spl * 1.3}
                explanation={`(Leads Sales / Leads Count) | Performance = ${numberToHumanFriendlyString(performanceLeads.netSalesDayWise.reduce(sumReducer, 0))} / ${numberToHumanFriendlyString(
                    performanceLeadsCount.count
                )}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="Performance Leads ACoS"
                value={performanceLeadsAcos.acos}
                target={1 + performanceLeadsAcos.acos * 1.3}
                explanation={`(Amount Spent / Net Sales) | Performance = ${numberToHumanFriendlyString(performanceLeads.amountSpentDayWise.reduce(sumReducer))} / ${numberToHumanFriendlyString(
                    performanceLeads.netSalesDayWise.reduce(sumReducer)
                )}`}
                type={ValueDisplayingCardInformationType.percentage}
            />

            <SmallValueDisplayingCardWithTarget
                label="Facebook Leads"
                value={facebookLeadsCount.count}
                target={1 + facebookLeadsCount.count * 1.3}
                explanation="Number of leads recorded through facebook campaigns"
                type={ValueDisplayingCardInformationType.integer}
                equivalentQuery={`SELECT COUNT(*) FROM freshsales_leads_to_source_with_information WHERE DATE(lead_created_at)>=${minDate} AND DATE(lead_created_at)<=${maxDate} AND lead_capture_source = 'Facebook On Form Ads'`}

            />

            <SmallValueDisplayingCardWithTarget
                label="Facebook Leads CPL"
                value={facebookLeadsCpl.cpl}
                target={1 + facebookLeadsCpl.cpl * 1.3}
                explanation={`(Amount Spent / Leads Count) | Facebook = ${numberToHumanFriendlyString(facebookLeads.amountSpentDayWise.reduce(sumReducer, 0))} / ${numberToHumanFriendlyString(
                    facebookLeadsCount.count
                )}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="Facebook Leads SPL"
                value={facebookLeadsSpl.spl}
                target={1 + facebookLeadsSpl.spl * 1.3}
                explanation={`(Leads Sales / Leads Count) | Facebook = ${numberToHumanFriendlyString(facebookLeads.netSalesDayWise.reduce(sumReducer, 0))} / ${numberToHumanFriendlyString(
                    facebookLeadsCount.count
                )}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="Facebook Leads ACoS"
                value={facebookLeadsAcos.acos}
                target={1 + facebookLeadsAcos.acos * 1.3}
                explanation={`(Amount Spent / Net Sales) | Facebook = ${numberToHumanFriendlyString(facebookLeads.amountSpentDayWise.reduce(sumReducer))} / ${numberToHumanFriendlyString(
                    facebookLeads.netSalesDayWise.reduce(sumReducer)
                )}`}
                type={ValueDisplayingCardInformationType.percentage}
            />

            <Tabs.Root defaultValue="1" className="tw-col-span-12">
                <Tabs.List>
                    <Tabs.Trigger value="1" className="lp-tab tw-rounded-tl-md">
                        Distribution
                    </Tabs.Trigger>
                    <Tabs.Trigger value="2" className="lp-tab tw-rounded-tr-md">
                        Raw Data
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="1">
                    <div className="tw-grid">
                        <GenericCard
                            className="tw-rounded-tl-none"
                            content={
                                <div className="tw-grid tw-grid-cols-4">
                                    <div className="tw-row-start-1 tw-col-start-2 tw-col-span-2 tw-grid">
                                        {showAcos && <Line options={options} data={dayWiseAcos} className="tw-row-start-1 tw-col-start-1" />}
                                        {showCpl && <Line options={acosDayWiseOptions} data={cplDayWise} className="tw-row-start-1 tw-col-start-1" />}
                                        {showSpl && <Line options={acosDayWiseOptions} data={splDayWise} className="tw-row-start-1 tw-col-start-1" />}

                                        <Bar options={options} data={data} className="tw-row-start-1 tw-col-start-1" />
                                    </div>

                                    <div className="tw-row-start-2 tw-col-start-1 tw-col-span-4 tw-flex tw-flex-row tw-justify-center">
                                        <input type="checkbox" id="acos" checked={showAcos} onChange={(e) => setShowAcos(e.target.checked)} />
                                        <label htmlFor="acos" className="tw-pl-2">
                                            ACoS
                                        </label>

                                        <HorizontalSpacer className="tw-w-8" />

                                        <input type="checkbox" id="cpl" checked={showCpl} onChange={(e) => setShowCpl(e.target.checked)} />
                                        <label htmlFor="cpl" className="tw-pl-2">
                                            CPL
                                        </label>

                                        <HorizontalSpacer className="tw-w-8" />

                                        <input type="checkbox" id="spl" checked={showSpl} onChange={(e) => setShowSpl(e.target.checked)} />
                                        <label htmlFor="spl" className="tw-pl-2">
                                            SPL
                                        </label>
                                    </div>
                                </div>
                            }
                            metaQuery={freshsalesLeadsData.metaQuery}
                        />
                    </div>
                </Tabs.Content>
                <Tabs.Content value="2">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={dates.map((date, dateIndex) => ({
                                        date: date,
                                        performanceLeads: dataTableForLeadsDayWise[date].performanceLeadsCount,
                                        performanceLeadsCpl: dataTableForLeadsDayWise[date].performanceLeadsCpl,
                                        performanceLeadsSpl: dataTableForLeadsDayWise[date].performanceLeadsSpl,
                                        performanceLeadsAcos: dataTableForLeadsDayWise[date].performanceLeadsAcos,
                                        performanceLeadsNetSales: dataTableForLeadsDayWise[date].performanceLeadsNetSales,
                                        facebookLeads: dataTableForLeadsDayWise[date].facebookLeadsCount,
                                        facebookLeadsCpl: dataTableForLeadsDayWise[date].facebookLeadsCpl,
                                        facebookLeadsSpl: dataTableForLeadsDayWise[date].facebookLeadsSpl,
                                        facebookLeadsAcos: dataTableForLeadsDayWise[date].facebookLeadsAcos,
                                        facebookLeadsNetSales: dataTableForLeadsDayWise[date].facebookLeadsNetSales,
                                    }))}
                                    columnDefs={[
                                        {
                                            headerName: "Lead Created At",
                                            valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date),
                                            filter: "agDateColumnFilter",
                                            comparator: agGridDateComparator,
                                        },
                                        {
                                            headerName: "Performance Leads Count",
                                            field: "performanceLeads",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.performanceCount},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Performance Leads CPL",
                                            field: "performanceLeadsCpl",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.performanceCpl},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Performance Leads SPL",
                                            field: "performanceLeadsSpl",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.performanceSpl},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Performance Leads ACoS",
                                            field: "performanceLeadsAcos",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.performanceAcos},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Performance Leads Net Sales",
                                            field: "performanceLeadsNetSales",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.netSales},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Facebook Leads Count",
                                            field: "facebookLeads",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.facebookCount},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Facebook Leads CPL",
                                            field: "facebookLeadsCpl",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.facebookCpl},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Facebook Leads SPL",
                                            field: "facebookLeadsSpl",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.facebookSpl},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Facebook Leads ACoS",
                                            field: "facebookLeadsAcos",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.facebookAcos},
                                            cellClass: "!tw-px-0",
                                        },
                                        {
                                            headerName: "Facebook Leads Net Sales",
                                            field: "facebookLeadsNetSales",
                                            cellRenderer: "progressCellRenderer",
                                            cellRendererParams: {target: targetForLeadsDayWise, color: adsColorPalette.netSales},
                                            cellClass: "!tw-px-0",
                                        },
                                    ]}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                    frameworkComponents={{
                                        progressCellRenderer,
                                    }}
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

function OrdersSection({
    freshsalesLeadsData,
    adsData,
    shopifyData,
    minDate,
    maxDate,
    selectedCategories,
    selectedProducts,
    selectedPlatforms,
    selectedCampaigns,
    numberOfSelectedDays,
}: {
    freshsalesLeadsData: FreshsalesData;
    adsData: AdsData;
    shopifyData: ShopifyData;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    selectedCategories: Array<string>;
    selectedProducts: Array<string>;
    selectedPlatforms: Array<string>;
    selectedCampaigns: Array<string>;
    numberOfSelectedDays: number;
}) {
    const filterShopifyData = shopifyData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.productCategory))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform))
        .filter((row) => selectedCampaigns.length == 0 || selectedCampaigns.includes(row.leadGenerationSourceCampaignName))
        .filter((row) => selectedProducts.length == 0 || selectedProducts.includes(row.productTitle));

    const dates = getDates(minDate, maxDate);

    // Direct Orders calculations
    const directOrdersRevenueGroupByDateAndCategory = getOrdersRevenue(filterShopifyData.filter((row) => row.isAssisted == false));
    const directOrders = {
        dayWiseCount: aggregateByDate(
            filterShopifyData.filter((row) => row.isAssisted == false),
            "netQuantity",
            dates
        ),
        dayWiseNetSales: aggregateByDate(directOrdersRevenueGroupByDateAndCategory, "netSales", dates),
    };

    const directOrdersTotalCount = directOrders.dayWiseCount.reduce(sumReducer, 0);
    const directOrdersNetSales = directOrders.dayWiseNetSales.reduce(sumReducer, 0);

    const directOrdersAov = {
        metaInformation: `Orders Revenue / Orders Count | Direct = ${numberToHumanFriendlyString(directOrdersNetSales)} / ${numberToHumanFriendlyString(directOrdersTotalCount)}`,
        aov: directOrdersNetSales / directOrdersTotalCount,
        dayWiseAov: directOrders.dayWiseNetSales.map((value, index) => (directOrders.dayWiseCount[index] == 0 ? 0 : value / directOrders.dayWiseCount[index])),
    };

    const directOrdersDrr = {
        metaInformation: `Total Direct Orders / Number of Days | Direct = ${numberToHumanFriendlyString(directOrdersTotalCount)} / ${numberToHumanFriendlyString(numberOfSelectedDays)}`,
        drr: directOrdersTotalCount / numberOfSelectedDays,
    };

    // Assisted Orders calculations
    const assistedOrdersRevenueGroupByDateAndCategory = getOrdersRevenue(filterShopifyData.filter((row) => row.isAssisted == true));

    const assistedOrders = {
        dayWiseCount: aggregateByDate(
            filterShopifyData.filter((row) => row.isAssisted == true),
            "netQuantity",
            dates
        ),
        dayWiseNetSales: aggregateByDate(assistedOrdersRevenueGroupByDateAndCategory, "netSales", dates),
    };

    const assistedOrdersTotalCount = assistedOrders.dayWiseCount.reduce(sumReducer, 0);
    const assistedOrdersNetSales = assistedOrders.dayWiseNetSales.reduce(sumReducer, 0);

    const assistedOrdersAov = {
        metaInformation: `Orders Revenue / Orders Count | Assisted = ${numberToHumanFriendlyString(assistedOrdersNetSales)} / ${numberToHumanFriendlyString(assistedOrdersTotalCount)}`,
        aov: assistedOrdersNetSales / assistedOrdersTotalCount,
        dayWiseAov: assistedOrders.dayWiseNetSales.map((value, index) => (assistedOrders.dayWiseCount[index] == 0 ? 0 : value / assistedOrders.dayWiseCount[index])),
    };

    const assistedOrdersDrr = {
        metaInformation: `Total Assisted Orders / Number of Days | Assisted = ${numberToHumanFriendlyString(assistedOrdersTotalCount)} / ${numberToHumanFriendlyString(numberOfSelectedDays)}`,
        drr: assistedOrdersTotalCount / numberOfSelectedDays,
    };

    const dataTableForOrdersDayWise = dates.reduce((result, curDate, index) => {
        result[curDate] = {
            directOrdersCount: roundOffToTwoDigits(directOrders.dayWiseCount[index]),
            directOrdersNetSales: roundOffToTwoDigits(directOrders.dayWiseNetSales[index]),
            directOrdersAov: roundOffToTwoDigits(directOrdersAov.dayWiseAov[index]),
            assistedOrdersCount: roundOffToTwoDigits(assistedOrders.dayWiseCount[index]),
            assistedOrdersNetSales: roundOffToTwoDigits(directOrders.dayWiseNetSales[index]),
            assistedOrdersAov: roundOffToTwoDigits(assistedOrdersAov.dayWiseAov[index]),
        };
        return result;
    }, {});

    // Total Orders
    const totalOrdersCount = {
        metaInformation: `Direct Orders + Assisted Orders = ${numberToHumanFriendlyString(directOrders.dayWiseCount.reduce(sumReducer, 0))} + ${numberToHumanFriendlyString(
            assistedOrders.dayWiseCount.reduce(sumReducer, 0)
        )}`,
        count: directOrdersTotalCount + assistedOrders.dayWiseCount.reduce(sumReducer, 0),
    };

    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Daywise distribution of Orders Count",
            },
        },
    };

    const labels = dates;
    const data = {
        labels,
        datasets: [
            {
                label: "Direct Orders",
                data: labels.map((date) => dataTableForOrdersDayWise[date].directOrdersCount),
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                borderColor: "rgba(255, 99, 132, 0.5)",
            },
            {
                label: "Assisted Orders",
                data: labels.map((date) => dataTableForOrdersDayWise[date].assistedOrdersCount),
                backgroundColor: "rgba(53, 162, 235, 0.5)",
                borderColor: "rgba(53, 162, 235, 0.5)",
            },
        ],
    };

    return (
        <>
            <SectionHeader label="Orders" />

            <LargeValueDisplayingCardWithTarget
                label="Total Orders"
                value={totalOrdersCount.count}
                target={1 + totalOrdersCount.count * 1.3}
                explanation="Total number of units orders recorded on Shopify"
                type={ValueDisplayingCardInformationType.integer}
            />

            <SmallValueDisplayingCardWithTarget
                label="Direct Orders"
                value={directOrdersTotalCount}
                target={1 + directOrdersTotalCount * 1.3}
                explanation="Number of orders placed that did not require human intervention"
                type={ValueDisplayingCardInformationType.integer}
            />

            <SmallValueDisplayingCardWithTarget
                label="AOV"
                value={directOrdersAov.aov}
                target={1 + directOrdersAov.aov * 1.3}
                explanation={`(Orders Revenue / Orders Count) | Direct = ${numberToHumanFriendlyString(directOrdersNetSales)} / ${numberToHumanFriendlyString(directOrdersTotalCount)}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="DRR"
                value={directOrdersDrr.drr}
                target={1 + directOrdersDrr.drr * 1.3}
                explanation={`(Total Orders / Number of Days) | Direct = ${numberToHumanFriendlyString(directOrdersTotalCount)} / ${numberToHumanFriendlyString(numberOfSelectedDays)}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <div className="tw-col-span-2" />

            <SmallValueDisplayingCardWithTarget
                label="Assisted Orders"
                value={assistedOrdersTotalCount}
                target={1 + assistedOrdersTotalCount * 1.3}
                explanation="Number of orders placed that did not require human intervention"
                type={ValueDisplayingCardInformationType.integer}
            />

            <SmallValueDisplayingCardWithTarget
                label="AOV"
                value={assistedOrdersAov.aov}
                target={1 + assistedOrdersAov.aov * 1.3}
                explanation={`(Orders Revenue / Orders Count) | Assisted = ${numberToHumanFriendlyString(assistedOrdersNetSales)} / ${numberToHumanFriendlyString(assistedOrdersTotalCount)}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="DRR"
                value={assistedOrdersDrr.drr}
                target={1 + assistedOrdersDrr.drr * 1.3}
                explanation={`(Total Orders / Number of Days) | Assisted = ${numberToHumanFriendlyString(assistedOrdersTotalCount)} / ${numberToHumanFriendlyString(numberOfSelectedDays)}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <div className="tw-col-span-2" />

            <Tabs.Root defaultValue="1" className="tw-col-span-12">
                <Tabs.List>
                    <Tabs.Trigger value="1" className="lp-tab tw-rounded-tl-md">
                        Distribution
                    </Tabs.Trigger>
                    <Tabs.Trigger value="2" className="lp-tab tw-rounded-tr-md">
                        Raw Data
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-grid tw-grid-cols-4">
                                <div className="tw-col-start-2 tw-col-span-2">
                                    <Line options={options} data={data} />
                                </div>
                            </div>
                        }
                        metaQuery={shopifyData.metaQuery}
                    />
                </Tabs.Content>
                <Tabs.Content value="2">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={dates.map((date, dateIndex) => ({
                                        date: date,
                                        directOrdersCount: dataTableForOrdersDayWise[date].directOrdersCount,
                                        directOrdersAov: dataTableForOrdersDayWise[date].directOrdersAov,
                                        assistedOrdersCount: dataTableForOrdersDayWise[date].assistedOrdersCount,
                                        assistedOrdersAov: dataTableForOrdersDayWise[date].assistedOrdersAov,
                                        directOrdersNetSales: dataTableForOrdersDayWise[date].directOrdersNetSales,
                                        assistedOrdersNetSales: dataTableForOrdersDayWise[date].assistedOrdersNetSales,
                                    }))}
                                    columnDefs={[
                                        {headerName: "Date", valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date), filter: "agDateColumnFilter", comparator: agGridDateComparator},
                                        {headerName: "Direct Orders Count", field: "directOrdersCount"},
                                        {headerName: "Direct Orders AOV", field: "directOrdersAov"},
                                        {headerName: "Direct Orders NetSales", field: "directOrdersNetSales"},
                                        {headerName: "Assisted Orders Count", field: "assistedOrdersCount"},
                                        {headerName: "Assisted Orders AOV", field: "assistedOrdersAov"},
                                        {headerName: "Assisted Orders NetSales", field: "assistedOrdersNetSales"},
                                    ]}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                />
                            </div>
                        }
                        metaQuery={shopifyData.metaQuery}
                    />
                </Tabs.Content>
            </Tabs.Root>
        </>
    );
}

function RevenueSection({
    freshsalesLeadsData,
    adsData,
    shopifyData,
    minDate,
    maxDate,
    selectedCategories,
    selectedProducts,
    selectedPlatforms,
    selectedCampaigns,
}: {
    freshsalesLeadsData: FreshsalesData;
    adsData: AdsData;
    shopifyData: ShopifyData;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    selectedCategories: Array<string>;
    selectedProducts: Array<string>;
    selectedPlatforms: Array<string>;
    selectedCampaigns: Array<string>;
}) {
    const filterShopifyData = shopifyData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.productCategory))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform))
        .filter((row) => selectedCampaigns.length == 0 || selectedCampaigns.includes(row.leadGenerationSourceCampaignName))
        .filter((row) => selectedProducts.length == 0 || selectedProducts.includes(row.productTitle));

    const directOrdersRevenue = getOrdersRevenue(filterShopifyData.filter((row) => row.isAssisted == false));

    const assistedOrdersRevenueGroupByDateAndCategory = getOrdersRevenue(filterShopifyData.filter((row) => row.isAssisted == true));

    const dates = getDates(minDate, maxDate);

    const directOrdersGrossRevenue = {
        grossRevenueDayWise: aggregateByDate(directOrdersRevenue, "netSales", dates),
    };

    const assistedOrdersGrossRevenue = {
        grossRevenueDayWise: aggregateByDate(assistedOrdersRevenueGroupByDateAndCategory, "netSales", dates),
    };

    const directOrdersNetRevenue = {
        metaInformation: "",
        netRevenueDayWise: aggregateByDate(
            directOrdersRevenue.map((row) => ({...row, netRevenue: getNetRevenue(row)})),
            "netRevenue",
            dates
        ),
    };

    const assistedOrdersNetRevenue = {
        metaInformation: "",
        netRevenueDayWise: aggregateByDate(
            assistedOrdersRevenueGroupByDateAndCategory.map((row) => ({...row, netRevenue: getNetRevenue(row)})),
            "netRevenue",
            dates
        ),
    };
    const totalNetRevenue = {
        metaInformation: "",
        netRevenue: directOrdersNetRevenue.netRevenueDayWise.reduce(sumReducer, 0) + assistedOrdersNetRevenue.netRevenueDayWise.reduce(sumReducer, 0),
    };

    const dataTableForRevenueDayWise = dates.reduce((result, curDate, index) => {
        result[curDate] = {
            directOrdersGrossRevenue: roundOffToTwoDigits(directOrdersGrossRevenue.grossRevenueDayWise[index]),
            directOrdersNetRevenue: roundOffToTwoDigits(directOrdersNetRevenue.netRevenueDayWise[index]),
            assistedOrdersGrossRevenue: roundOffToTwoDigits(assistedOrdersGrossRevenue.grossRevenueDayWise[index]),
            assistedOrdersNetRevenue: roundOffToTwoDigits(assistedOrdersNetRevenue.netRevenueDayWise[index]),
        };
        return result;
    }, {});

    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

    const ordersGrossRevenueOptions = {
        responsive: true,
        // maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Orders vs Gross Revenue Bar Graph",
            },
        },
    };

    const ordersNetRevenueOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Orders vs Net Revenue Bar Graph",
            },
        },
    };

    const labels = Object.keys(dataTableForRevenueDayWise);
    const ordersGrossRevenueData = {
        labels,
        datasets: [
            {
                label: "Direct Orders",
                data: labels.map((date) => dataTableForRevenueDayWise[date].directOrdersGrossRevenue),
                backgroundColor: "rgba(255, 99, 132, 0.5)",
            },
            {
                label: "Assisted Orders",
                data: labels.map((date) => dataTableForRevenueDayWise[date].assistedOrdersGrossRevenue),
                backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
        ],
    };

    const ordersNetRevenueData = {
        labels,
        datasets: [
            {
                label: "Direct Orders",
                data: labels.map((date) => dataTableForRevenueDayWise[date].directOrdersNetRevenue),
                backgroundColor: "rgba(255, 99, 132, 0.5)",
            },
            {
                label: "Assisted Orders",
                data: labels.map((date) => dataTableForRevenueDayWise[date].assistedOrdersNetRevenue),
                backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
        ],
    };

    return (
        <>
            <SectionHeader label="Revenue" />

            <LargeValueDisplayingCardWithTarget
                label="Net Revenue"
                value={totalNetRevenue.netRevenue}
                target={1 + totalNetRevenue.netRevenue * 1.3}
                explanation="Post-taxation revenue"
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="Gross Direct Revenue"
                value={directOrdersGrossRevenue.grossRevenueDayWise.reduce(sumReducer, 0)}
                target={1 + directOrdersGrossRevenue.grossRevenueDayWise.reduce(sumReducer, 0) * 1.3}
                explanation="Pre-taxation revenue from direct orders"
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="Net Gross Revenue"
                value={directOrdersNetRevenue.netRevenueDayWise.reduce(sumReducer, 0)}
                target={1 + directOrdersNetRevenue.netRevenueDayWise.reduce(sumReducer, 0) * 1.3}
                explanation="Post-taxation revenue from direct orders"
                type={ValueDisplayingCardInformationType.float}
            />

            <div className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <SmallValueDisplayingCardWithTarget
                label="Gross Assisted Revenue"
                value={assistedOrdersGrossRevenue.grossRevenueDayWise.reduce(sumReducer, 0)}
                target={1 + assistedOrdersGrossRevenue.grossRevenueDayWise.reduce(sumReducer, 0) * 1.3}
                explanation="Pre-taxation revenue from assisted orders"
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="Net Assisted Revenue"
                value={assistedOrdersNetRevenue.netRevenueDayWise.reduce(sumReducer, 0)}
                target={1 + assistedOrdersNetRevenue.netRevenueDayWise.reduce(sumReducer, 0) * 1.3}
                explanation="Post-taxation revenue from assisted orders"
                type={ValueDisplayingCardInformationType.float}
            />

            <div className="tw-col-span-2" />

            <div className="tw-col-span-2" />

            <Tabs.Root defaultValue="1" className="tw-col-span-12">
                <Tabs.List>
                    <Tabs.Trigger value="1" className="lp-tab tw-rounded-tl-md">
                        Gross Revenue
                    </Tabs.Trigger>
                    <Tabs.Trigger value="2" className="lp-tab">
                        Net Revenue
                    </Tabs.Trigger>
                    <Tabs.Trigger value="3" className="lp-tab tw-rounded-tr-md">
                        Raw Data
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-grid tw-grid-cols-4">
                                <div className="tw-col-start-2 tw-col-span-2">
                                    <Bar options={ordersGrossRevenueOptions} data={ordersGrossRevenueData} />
                                </div>
                            </div>
                        }
                        metaQuery={adsData.metaQuery}
                        label="Daywise distribution of Gross Revenue"
                    />
                </Tabs.Content>
                <Tabs.Content value="2">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-grid tw-grid-cols-4">
                                <div className="tw-col-start-2 tw-col-span-2">
                                    <Bar options={ordersNetRevenueOptions} data={ordersNetRevenueData} />
                                </div>
                            </div>
                        }
                        metaQuery={shopifyData.metaQuery}
                        label="Daywise distribution of Net Revenue"
                    />
                </Tabs.Content>
                <Tabs.Content value="3">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={dates.map((date, dateIndex) => ({
                                        date: date,
                                        directOrdersGrossRevenue: dataTableForRevenueDayWise[date].directOrdersGrossRevenue,
                                        directOrdersNetRevenue: dataTableForRevenueDayWise[date].directOrdersNetRevenue,
                                        assistedOrdersGrossRevenue: dataTableForRevenueDayWise[date].assistedOrdersGrossRevenue,
                                        assistedOrdersNetRevenue: dataTableForRevenueDayWise[date].assistedOrdersNetRevenue,
                                    }))}
                                    columnDefs={[
                                        {headerName: "Date", valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date), filter: "agDateColumnFilter", comparator: agGridDateComparator},
                                        {headerName: "Direct Orders Gross Revenue", field: "directOrdersGrossRevenue"},
                                        {headerName: "Direct Orders Net Revenue", field: "directOrdersNetRevenue"},
                                        {headerName: "Assisted Orders Gross Revenue", field: "assistedOrdersGrossRevenue"},
                                        {headerName: "Direct Orders Net Revenue", field: "assistedOrdersNetRevenue"},
                                    ]}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                />
                            </div>
                        }
                        metaQuery={shopifyData.metaQuery}
                    />
                </Tabs.Content>
            </Tabs.Root>
        </>
    );
}

function SpendSection({
    freshsalesLeadsData,
    adsData,
    shopifyData,
    minDate,
    maxDate,
    selectedCategories,
    selectedProducts,
    selectedPlatforms,
    selectedCampaigns,
    numberOfSelectedDays,
}: {
    freshsalesLeadsData: FreshsalesData;
    adsData: AdsData;
    shopifyData: ShopifyData;
    minDate: Iso8601Date;
    maxDate: Iso8601Date;
    selectedCategories: Array<string>;
    selectedProducts: Array<string>;
    selectedPlatforms: Array<string>;
    selectedCampaigns: Array<string>;
    numberOfSelectedDays: number;
}) {
    const filterShopifyData = shopifyData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.productCategory))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.leadGenerationSourceCampaignPlatform))
        .filter((row) => selectedCampaigns.length == 0 || selectedCampaigns.includes(row.leadGenerationSourceCampaignName))
        .filter((row) => selectedProducts.length == 0 || selectedProducts.includes(row.productTitle));

    const filterAdsData = adsData.rows
        .filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category))
        .filter((row) => selectedPlatforms.length == 0 || selectedPlatforms.includes(row.platform))
        .filter((row) => selectedCampaigns.length == 0 || selectedCampaigns.includes(row.campaignName));

    const dates = getDates(minDate, maxDate);

    // Google Ads
    const googleAds = {
        amountSpentDayWise: aggregateByDate(
            filterAdsData.filter((row) => row.platform == "Google"),
            "amountSpent",
            dates
        ),
        netSalesDayWise: aggregateByDate(
            filterShopifyData.filter((row) => row.leadGenerationSourceCampaignPlatform == "Google" && row.netSales > 0),
            "netSales",
            dates
        ),
    };

    const googleAdsNetSales = googleAds.netSalesDayWise.reduce(sumReducer, 0);

    const googleAdsAmountSpent = googleAds.amountSpentDayWise.reduce(sumReducer, 0);

    const googleAdsLiveCampaignsCount: number = distinct(filterAdsData.filter((row) => row.platform == "Google" && row.amountSpent > 0).map((row) => row.campaignName)).length;

    const googleAdsDailyAmountSpent = googleAdsAmountSpent / numberOfSelectedDays;

    const googleAdsAcos = {
        metaInformation: `Total Spend / Revenue | Google = ${googleAdsAmountSpent} / ${googleAdsNetSales}`,
        acos: googleAdsNetSales == 0 ? 0 : googleAdsAmountSpent / googleAdsNetSales,
        dayWiseAcos: googleAds.amountSpentDayWise.map((value, index) => (googleAds.netSalesDayWise[index] == 0 ? 0 : value / googleAds.netSalesDayWise[index])),
    };

    // Facebook Ads
    const facebookAds = {
        amountSpentDayWise: aggregateByDate(
            filterAdsData.filter((row) => row.platform == "Facebook"),
            "amountSpent",
            dates
        ),
        netSalesDayWise: aggregateByDate(
            filterShopifyData.filter((row) => row.leadGenerationSourceCampaignPlatform == "Facebook" && row.netSales > 0),
            "netSales",
            dates
        ),
    };

    const facebookAdsNetSales = facebookAds.netSalesDayWise.reduce(sumReducer, 0);

    const facebookAdsAmountSpent = facebookAds.amountSpentDayWise.reduce(sumReducer, 0);

    const facebookAdsLiveCampaignsCount: number = distinct(filterAdsData.filter((row) => row.platform == "Facebook" && row.amountSpent > 0).map((row) => row.campaignName)).length;

    const facebookAdsDailyAmountSpent = facebookAdsAmountSpent / numberOfSelectedDays;

    const facebookAdsAcos = {
        metaInformation: `Total Spend / Revenue | Facebook = ${facebookAdsAmountSpent} / ${facebookAdsNetSales}`,
        acos: facebookAdsAmountSpent / facebookAdsNetSales,
        dayWiseAcos: facebookAds.amountSpentDayWise.map((value, index) => (facebookAds.netSalesDayWise[index] == 0 ? 0 : value / facebookAds.netSalesDayWise[index])),
    };

    const facebookAdsDailySpend = {
        metaInformation: `Total Spend / Number of Days | Facebook = ${facebookAdsAmountSpent} / ${numberOfSelectedDays}`,
        amountSpent: facebookAdsAmountSpent / numberOfSelectedDays,
    };

    // Data Table for daywise distribution
    const dataTableForSpendsDayWise = dates.reduce((result, curDate, index) => {
        result[curDate] = {
            googleAdsAmountSpent: roundOffToTwoDigits(googleAds.amountSpentDayWise[index]),
            googleAdsNetSales: roundOffToTwoDigits(googleAds.netSalesDayWise[index]),
            googleAdsAcos: roundOffToTwoDigits(googleAdsAcos.dayWiseAcos[index]),
            facebookAdsAmountSpent: roundOffToTwoDigits(facebookAds.amountSpentDayWise[index]),
            facebookAdsNetSales: roundOffToTwoDigits(facebookAds.netSalesDayWise[index]),
            facebookAdsAcos: roundOffToTwoDigits(facebookAdsAcos.dayWiseAcos[index]),
        };
        return result;
    }, {});

    const netSpends = {
        metaInformation: `Facebook Ads Spends + Google Ads Spends = ${facebookAdsAmountSpent} + ${googleAdsAmountSpent}`,
        amountSpent: facebookAdsAmountSpent + googleAdsAmountSpent,
    };

    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

    const adsDataSpendsOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Daywise distribution of Amount Spent on advertisements",
            },
        },
    };

    const labels = dates;
    const adsDataSpendsData = {
        labels,
        datasets: [
            {
                label: "Google Ads Spend",
                data: labels.map((item, index) => googleAds.amountSpentDayWise[index]),
                backgroundColor: "rgba(255, 99, 132, 0.5)",
            },
            {
                label: "Facebook Ads Spend",
                data: labels.map((item, index) => facebookAds.amountSpentDayWise[index]),
                backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
        ],
    };

    return (
        <>
            <SectionHeader label="Spend" />

            <LargeValueDisplayingCardWithTarget
                label="Net Spend"
                value={netSpends.amountSpent}
                target={1 + netSpends.amountSpent * 1.3}
                explanation={`Facebook Ads Spends + Google Ads Spends = ${facebookAdsAmountSpent} + ${googleAdsAmountSpent}`}
                type={ValueDisplayingCardInformationType.integer}
            />

            <SmallValueDisplayingCardWithTarget
                label="Facebook Ads Amount Spent"
                value={facebookAdsAmountSpent}
                target={1 + facebookAdsAmountSpent * 1.3}
                explanation="Amount spent on Facebook ads"
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="Live Campaigns"
                value={facebookAdsLiveCampaignsCount}
                target={1 + facebookAdsLiveCampaignsCount * 1.3}
                explanation="Number of ads run on Facebook"
                type={ValueDisplayingCardInformationType.integer}
            />

            <SmallValueDisplayingCardWithTarget
                label="Daily Spend"
                value={facebookAdsDailyAmountSpent}
                target={1 + facebookAdsDailyAmountSpent * 1.3}
                explanation={`(Total Spend / Number of Days) | Facebook = ${facebookAdsAmountSpent} / ${numberOfSelectedDays}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="ACoS"
                value={facebookAdsAcos.acos}
                target={1 + facebookAdsAcos.acos * 1.3}
                explanation={`(Total Spend / Revenue) | Facebook = ${facebookAdsAmountSpent} / ${facebookAdsNetSales}`}
                type={ValueDisplayingCardInformationType.percentage}
            />

            <SmallValueDisplayingCardWithTarget
                label="Google Ads Amount Spent"
                value={googleAdsAmountSpent}
                target={1 + googleAdsAmountSpent * 1.3}
                explanation="Amount spent on Google ads"
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="Live Campaigns"
                value={googleAdsLiveCampaignsCount}
                target={1 + googleAdsLiveCampaignsCount * 1.3}
                explanation="Number of ads run on Google"
                type={ValueDisplayingCardInformationType.integer}
            />

            <SmallValueDisplayingCardWithTarget
                label="Daily Spend"
                value={googleAdsDailyAmountSpent}
                target={1 + googleAdsDailyAmountSpent * 1.3}
                explanation={`(Total Spend / Number of Days) | Google = ${googleAdsAmountSpent} / ${numberOfSelectedDays}`}
                type={ValueDisplayingCardInformationType.float}
            />

            <SmallValueDisplayingCardWithTarget
                label="ACoS"
                value={googleAdsAcos.acos}
                target={1 + googleAdsAcos.acos * 1.3}
                explanation={`(Total Spend / Revenue) | Google = ${googleAdsAmountSpent} / ${googleAdsNetSales}`}
                type={ValueDisplayingCardInformationType.percentage}
            />

            <Tabs.Root defaultValue="1" className="tw-col-span-12">
                <Tabs.List>
                    <Tabs.Trigger value="1" className="lp-tab tw-rounded-tl-md">
                        Distribution
                    </Tabs.Trigger>
                    <Tabs.Trigger value="2" className="lp-tab tw-rounded-tr-md">
                        Raw Data
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-grid tw-grid-cols-4">
                                <div className="tw-col-start-2 tw-col-span-2">
                                    <Bar options={adsDataSpendsOptions} data={adsDataSpendsData} />
                                </div>
                            </div>
                        }
                        metaQuery={adsData.metaQuery}
                    />
                </Tabs.Content>
                <Tabs.Content value="2">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
                                <AgGridReact
                                    rowData={dates.map((date, dateIndex) => ({
                                        date: date,
                                        googleAdsAmountSpent: dataTableForSpendsDayWise[date].googleAdsAmountSpent,
                                        googleAdsNetSales: dataTableForSpendsDayWise[date].googleAdsNetSales,
                                        googleAdsAcos: dataTableForSpendsDayWise[date].googleAdsAcos,
                                        facebookAdsAmountSpent: dataTableForSpendsDayWise[date].facebookAdsAmountSpent,
                                        facebookAdsNetSales: dataTableForSpendsDayWise[date].facebookAdsNetSales,
                                        facebookAdsAcos: dataTableForSpendsDayWise[date].facebookAdsAcos,
                                    }))}
                                    columnDefs={[
                                        {headerName: "Date", valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date), filter: "agDateColumnFilter", comparator: agGridDateComparator},
                                        {headerName: "Google Ads Amount Spent", field: "googleAdsAmountSpent"},
                                        {headerName: "Google Ads Net Sales", field: "googleAdsNetSales"},
                                        {headerName: "Google Ads ACoS", field: "googleAdsAcos"},
                                        {headerName: "Facebook Ads Amount Spent", field: "facebookAdsAmountSpent"},
                                        {headerName: "Facebook Ads Net Sales", field: "facebookAdsNetSales"},
                                        {headerName: "Facebook Ads ACoS", field: "facebookAdsAcos"},
                                    ]}
                                    defaultColDef={defaultColumnDefinitions}
                                    animateRows={true}
                                    enableRangeSelection={true}
                                />
                            </div>
                        }
                        metaQuery={shopifyData.metaQuery}
                    />
                </Tabs.Content>
            </Tabs.Root>
        </>
    );
}

function getOrdersRevenue(shopifyData: Array<ShopifyDataAggregatedRow>) {
    let aggregateByDate = shopifyData.reduce(createGroupByReducer("date"), {});

    for (const date in aggregateByDate) {
        let result = aggregateByDate[date].reduce(createGroupByReducer("productCategory"), {});
        aggregateByDate[date] = result;
    }

    let result = [];
    for (const date in aggregateByDate) {
        for (const category in aggregateByDate[date]) {
            const totalNetSales = aggregateByDate[date][category].reduce((total: number, item: ShopifyDataAggregatedRow) => total + item.netSales, 0);
            result.push({
                date: date,
                category: category,
                netSales: totalNetSales,
            });
        }
    }
    return result;
}

function aggregateByDate(arr: Array<object>, param: string, dates: Array<string>) {
    const counts = dates.map((date) => arr.filter((x) => x.date == date).reduce((total, x) => total + x[param], 0));

    const sum1 = arr.reduce((total, x) => total + x[param], 0);
    const sum2 = counts.reduce((total, x) => total + x, 0);
    if (Math.abs(sum1 - sum2) > 0.1) {
        console.log("SUMS DON'T ADD UP!", sum1, sum2);
    }

    return counts;
}

function getNetRevenue(row: ShopifyDataAggregatedRow): number {
    let returnProvision;

    if (row.productCategory == "Mattress" || row.productCategory == "Non Mattress") {
        returnProvision = 8.5;
    } else if (row.productCategory == "Water Purifier") {
        returnProvision = 10;
    } else if (row.productCategory == "Appliances") {
        returnProvision = 1.18;
    } else if (row.productCategory == null) {
        // TODO: Remove
        returnProvision = 0;
    } else if (row.productCategory == "null") {
        // TODO: Remove
        returnProvision = 0;
    } else {
        throw new Error(`returnProvision for category ${row.productCategory} not specified!`);
    }

    return (row.netSales / 1.18) * (1 - returnProvision / 100);
}

function sumReducer(total: number, sum: number) {
    return total + sum;
}
