// import * as Tabs from "@radix-ui/react-tabs";
// import {json, LinksFunction, LoaderFunction, MetaFunction, redirect} from "@remix-run/node";
// import {useLoaderData} from "@remix-run/react";
// import {AgGridReact} from "ag-grid-react";
// import {ArcElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from "chart.js";
// import {DateTime} from "luxon";
// import {useState} from "react";
// import {Line} from "react-chartjs-2";
// import "ag-grid-enterprise";
// import {
//     AdsDataAggregatedRow,
//     FreshsalesData,
//     FreshsalesDataAggregatedRow,
//     getAdsData,
//     getFreshsalesData,
//     getShopifyData,
//     getTimeGranularityFromUnknown,
//     ShopifyDataAggregatedRow,
//     TimeGranularity,
// } from "~/backend/business-insights";
// import {CampaignInformation, getCampaignLibrary, getProductLibrary, ProductInformation} from "~/backend/common";
// import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
// import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
// import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
// import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
// import {DateFilterSection, FancySearchableMultiSelect, GenericCard, ValueDisplayingCard} from "~/components/scratchpad";
// import {Iso8601Date, QueryFilterType, Uuid, ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
// import {
//     aggregateByDate,
//     agGridDateComparator,
//     createGroupByReducer,
//     dateToMediumNoneEnFormat,
//     defaultColumnDefinitions,
//     distinct,
//     getColor,
//     getDates,
//     getNonEmptyStringOrNull,
//     kvpArrayToObjectReducer,
//     numberToHumanFriendlyString,
//     roundOffToTwoDigits,
// } from "~/utilities/utilities";

// export const meta: MetaFunction = () => {
//     return {
//         title: "Leads Report - Intellsys",
//     };
// };

// export const links: LinksFunction = () => {
//     return [
//         {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-grid.css"},
//         {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-theme-alpine.css"},
//     ];
// };

// type LoaderData = {
//     appliedMinDate: Iso8601Date;
//     appliedMaxDate: Iso8601Date;
//     appliedSelectedGranularity: TimeGranularity;
//     allProductInformation: Array<ProductInformation>;
//     allCampaignInformation: Array<CampaignInformation>;
//     freshsalesLeadsData: FreshsalesData;
//     adsData: {
//         metaQuery: string;
//         rows: Array<AdsDataAggregatedRow>;
//     };
//     shopifyData: {
//         metaQuery: string;
//         rows: Array<ShopifyDataAggregatedRow>;
//     };
//     companyId: Uuid;
// };

// export const loader: LoaderFunction = async ({request, params}) => {
//     const accessToken = await getAccessTokenFromCookies(request);

//     if (accessToken == null) {
//         // TODO: Add message in login page
//         return redirect(`/sign-in?redirectTo=${getUrlFromRequest(request)}`);
//     }

//     const companyId = params.companyId;
//     if (companyId == null) {
//         throw new Response(null, {status: 404});
//     }

//     const urlSearchParams = new URL(request.url).searchParams;

//     // TODO: Make a function for parsing this, including handling invalid values
//     const selectedGranularityRaw = getNonEmptyStringOrNull(urlSearchParams.get("selected_granularity"));
//     const selectedGranularity: TimeGranularity = selectedGranularityRaw == null ? TimeGranularity.daily : getTimeGranularityFromUnknown(selectedGranularityRaw);

//     const minDateRaw = urlSearchParams.get("min_date");
//     let minDate;
//     if (minDateRaw == null || minDateRaw.length == 0) {
//         minDate = DateTime.now().startOf("month").toISODate();
//     } else {
//         minDate = minDateRaw;
//     }

//     const maxDateRaw = urlSearchParams.get("max_date");
//     let maxDate;
//     if (maxDateRaw == null || maxDateRaw.length == 0) {
//         maxDate = DateTime.now().toISODate();
//     } else {
//         maxDate = maxDateRaw;
//     }

//     // TODO: Add filters
//     const loaderData: LoaderData = {
//         appliedSelectedGranularity: selectedGranularity,
//         appliedMinDate: minDate,
//         appliedMaxDate: maxDate,
//         allProductInformation: await getProductLibrary(companyId),
//         allCampaignInformation: await getCampaignLibrary(companyId),
//         freshsalesLeadsData: await getFreshsalesData(minDate, maxDate, selectedGranularity, companyId),
//         adsData: await getAdsData(minDate, maxDate, selectedGranularity, companyId),
//         shopifyData: await getShopifyData(minDate, maxDate, selectedGranularity, companyId),
//         companyId: companyId,
//     };

//     return json(loaderData);
// };

// export default function () {
//     const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, allProductInformation, freshsalesLeadsData, shopifyData, adsData, companyId} = useLoaderData();

//     const numberOfSelectedDays = DateTime.fromISO(appliedMaxDate).diff(DateTime.fromISO(appliedMinDate), "days").toObject().days! + 1;

//     const r5_marketingAcos = "?";
//     const r5_facebookAcos = "?";
//     const r5_agentAcos = "?";
//     const r5_googleAcos = "?";
//     const r5_highestAcos = "?";
//     const r5_lowestAcos = "?";
//     const r5_netAcos = "?";

//     const [selectedCategories, setSelectedCategories] = useState([]);
//     const [selectedGranularity, setSelectedGranularity] = useState(appliedSelectedGranularity);
//     const [selectedMinDate, setSelectedMinDate] = useState<Iso8601Date>(appliedMinDate ?? "");
//     const [selectedMaxDate, setSelectedMaxDate] = useState<Iso8601Date>(appliedMaxDate ?? "");

//     const businesses = distinct(allProductInformation.map((productInformation: ProductInformation) => productInformation.category));

//     const [selectedProducts, setSelectedProducts] = useState<Array<string>>([]);

//     const granularities = ["Daily", "Weekly", "Monthly", "Yearly"];

//     return (
//         <>
//             <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
//                 <DateFilterSection
//                     granularities={granularities}
//                     selectedGranularity={selectedGranularity}
//                     setSelectedGranularity={setSelectedGranularity}
//                     selectedMinDate={selectedMinDate}
//                     setSelectedMinDate={setSelectedMinDate}
//                     selectedMaxDate={selectedMaxDate}
//                     setSelectedMaxDate={setSelectedMaxDate}
//                     page={`/${companyId}/leads-report`}
//                 />

//                 <div className="tw-col-span-12 tw-bg-dark-bg-400 tw-sticky tw-top-32 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
//                     <FancySearchableMultiSelect
//                         label="Choose Category"
//                         options={businesses}
//                         selectedOptions={selectedCategories}
//                         setSelectedOptions={setSelectedCategories}
//                         filterType={QueryFilterType.category}
//                     />
//                 </div>
//             </div>
//             <div className="tw-p-8">
//                 <LeadsSection freshsalesLeadsData={freshsalesLeadsData} minDate={appliedMinDate} maxDate={appliedMaxDate} selectedCategories={selectedCategories} />
//             </div>
//             <div className="tw-p-8">
//                 <DespositionsToCampaignsSection freshsalesLeadsData={freshsalesLeadsData} minDate={appliedMinDate} maxDate={appliedMaxDate} selectedCategories={selectedCategories} />
//             </div>
//         </>
//     );
// }

// function LeadsSection({
//     freshsalesLeadsData,
//     minDate,
//     maxDate,
//     selectedCategories,
// }: {
//     freshsalesLeadsData: FreshsalesData;
//     minDate: Iso8601Date;
//     maxDate: Iso8601Date;
//     selectedCategories: Array<string>;
// }) {
//     const filterFreshsalesLeadsData = freshsalesLeadsData.rows.filter((row) => selectedCategories.length == 0 || selectedCategories.includes(row.category));

//     const totalLeadsCount = {
//         //TODO: correct metaInformation
//         metaInformation: `Total Leads = ${numberToHumanFriendlyString(filterFreshsalesLeadsData.length)}`,
//         count: filterFreshsalesLeadsData
//             .filter((row: FreshsalesDataAggregatedRow) => row.date <= maxDate && row.date >= minDate)
//             .reduce((totalLeads, row: FreshsalesDataAggregatedRow) => {
//                 return totalLeads + row.count;
//             }, 0),
//     };

//     const dates = getDates(minDate, maxDate);
//     const FreshSalesLeadsDataGroupByLeadStatus = filterFreshsalesLeadsData
//         .filter((row: FreshsalesDataAggregatedRow) => row.date <= maxDate && row.date >= minDate)
//         .reduce(createGroupByReducer("leadStage"), {});

//     type LeadStatusTotalLeadsCount = {
//         name: string;
//         value: number;
//     };

//     let leadStatusTotalLeadsCount: Array<LeadStatusTotalLeadsCount> = [];

//     Object.keys(FreshSalesLeadsDataGroupByLeadStatus).forEach((leadStatus) => {
//         leadStatusTotalLeadsCount.push({
//             name: leadStatus,
//             value: FreshSalesLeadsDataGroupByLeadStatus[leadStatus].reduce((total: number, item: FreshsalesDataAggregatedRow) => total + item.count, 0),
//         });
//     });

//     const dayWiseLeadsStatusDistribution: {[key: string]: Array<number>} = {};

//     for (const leadStatus in FreshSalesLeadsDataGroupByLeadStatus) {
//         const dataGroupByDate = aggregateByDate(FreshSalesLeadsDataGroupByLeadStatus[leadStatus], "count", dates);
//         dayWiseLeadsStatusDistribution[leadStatus] = dataGroupByDate;
//     }

//     const leadStatusForSelectedDates = Object.keys(dayWiseLeadsStatusDistribution);

//     const dataTableForDayWiseLeadsStatusDistribution = dates.reduce((result, curDate, index) => {
//         result[curDate] = {
//             appointmentTaken: leadStatusForSelectedDates.includes("Appointment Taken") ? roundOffToTwoDigits(dayWiseLeadsStatusDistribution["Appointment Taken"][index]) : 0,
//             qualified: leadStatusForSelectedDates.includes("Qualified") ? roundOffToTwoDigits(dayWiseLeadsStatusDistribution["Qualified"][index]) : 0,
//             new: leadStatusForSelectedDates.includes("New") ? roundOffToTwoDigits(dayWiseLeadsStatusDistribution["New"][index]) : 0,
//             disqualified: leadStatusForSelectedDates.includes("Disqualified") ? roundOffToTwoDigits(dayWiseLeadsStatusDistribution["Disqualified"][index]) : 0,
//             nonContactable: leadStatusForSelectedDates.includes("Non Contactable") ? roundOffToTwoDigits(dayWiseLeadsStatusDistribution["Non Contactable"][index]) : 0,
//             requirementReceived: leadStatusForSelectedDates.includes("Requirement Received") ? roundOffToTwoDigits(dayWiseLeadsStatusDistribution["Requirement Received"][index]) : 0,
//             notResponding: leadStatusForSelectedDates.includes("Not Responding") ? roundOffToTwoDigits(dayWiseLeadsStatusDistribution["Not Responding"][index]) : 0,
//         };
//         return result;
//     }, {});

//     // Line Chart
//     ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);
//     const labels = dates;
//     const noOfLeadsGeneratedDataset: Array<object> = [];
//     const noOfLeadsGeneratedOptions = {
//         responsive: true,
//         plugins: {
//             legend: {
//                 position: "top" as const,
//             },
//             title: {
//                 display: true,
//                 // TODO: Highlight the arrow to Ambika
//                 text: "Day-wise distribution → Total Leads per status",
//             },
//         },
//     };

//     Object.keys(FreshSalesLeadsDataGroupByLeadStatus).map((leadStatus) => {
//         const lineColor = getColor(leadStatus);
//         const result = {
//             label: leadStatus,
//             data: dayWiseLeadsStatusDistribution[leadStatus],
//             borderColor: lineColor,
//             backgroundColor: lineColor,
//         };
//         noOfLeadsGeneratedDataset.push(result);
//     });

//     return (
//         <div>
//             <div className="tw-grid tw-content-center tw-grid-cols-4 tw-gap-4">
//                 <ValueDisplayingCard
//                     queryInformation={totalLeadsCount}
//                     contentExtractor={(totalLeadsCount: any) => totalLeadsCount.count}
//                     label="Total Leads"
//                     className="tw-row-start-1 tw-col-start-1"
//                     type={ValueDisplayingCardInformationType.integer}
//                 />
//                 <ItemBuilder
//                     items={leadStatusTotalLeadsCount}
//                     itemBuilder={(item, itemIndex) => (
//                         <ValueDisplayingCard
//                             queryInformation={item}
//                             contentExtractor={(item) => item.value}
//                             label={item.name}
//                             className="tw-row-span-1"
//                             type={ValueDisplayingCardInformationType.integer}
//                             key={itemIndex}
//                         />
//                     )}
//                 />
//             </div>

//             <VerticalSpacer className="tw-h-8" />

//             <Tabs.Root defaultValue="1" className="tw-col-span-12">
//                 <Tabs.List className="">
//                     <Tabs.Trigger value="1" className="lp-tab">
//                         Daily distribution of lead status
//                     </Tabs.Trigger>
//                     <Tabs.Trigger value="2" className="lp-tab">
//                         Raw data
//                     </Tabs.Trigger>
//                 </Tabs.List>
//                 <Tabs.Content value="1">
//                     <div className="tw-grid">
//                         <GenericCard
//                             className="tw-col-span-6"
//                             content={
//                                 <div className="tw-grid tw-grid-cols-6">
//                                     <div className="tw-col-start-2 tw-col-span-4">
//                                         <Line options={noOfLeadsGeneratedOptions} data={{labels, datasets: noOfLeadsGeneratedDataset}} />
//                                     </div>
//                                 </div>
//                             }
//                             metaQuery={freshsalesLeadsData.metaQuery}
//                         />
//                     </div>
//                 </Tabs.Content>
//                 <Tabs.Content value="2">
//                     <GenericCard
//                         className="tw-col-span-12"
//                         content={
//                             <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
//                                 <AgGridReact
//                                     rowData={dates.map((date, dateIndex) => ({
//                                         date: date,
//                                         appointmentTaken: dataTableForDayWiseLeadsStatusDistribution[date].appointmentTaken,
//                                         qualified: dataTableForDayWiseLeadsStatusDistribution[date].qualified,
//                                         new: dataTableForDayWiseLeadsStatusDistribution[date].new,
//                                         disqualified: dataTableForDayWiseLeadsStatusDistribution[date].disqualified,
//                                         nonContactable: dataTableForDayWiseLeadsStatusDistribution[date].nonContactable,
//                                         requirementReceived: dataTableForDayWiseLeadsStatusDistribution[date].requirementReceived,
//                                         notResponding: dataTableForDayWiseLeadsStatusDistribution[date].notResponding,
//                                     }))}
//                                     columnDefs={[
//                                         {
//                                             headerName: "Date",
//                                             valueGetter: (params) => dateToMediumNoneEnFormat(params.data.date),
//                                             filter: "agDateColumnFilter",
//                                             comparator: agGridDateComparator,
//                                         },
//                                         {headerName: "Appointment Taken", field: "appointmentTaken"},
//                                         {headerName: "Qualified", field: "qualified"},
//                                         {headerName: "New", field: "new"},
//                                         {headerName: "Disqualified", field: "disqualified"},
//                                         {headerName: "Non Contactable", field: "nonContactable"},
//                                         {headerName: "Requirement Received", field: "requirementReceived"},
//                                         {headerName: "Not Responding", field: "notResponding"},
//                                     ]}
//                                     defaultColDef={defaultColumnDefinitions}
//                                     animateRows={true}
//                                     enableRangeSelection={true}
//                                 />
//                             </div>
//                         }
//                         metaQuery={freshsalesLeadsData.metaQuery}
//                     />
//                 </Tabs.Content>
//             </Tabs.Root>
//         </div>
//     );
// }

// function DespositionsToCampaignsSection({
//     freshsalesLeadsData,
//     minDate,
//     maxDate,
//     selectedCategories,
// }: {
//     freshsalesLeadsData: FreshsalesData;
//     minDate: Iso8601Date;
//     maxDate: Iso8601Date;
//     selectedCategories: Array<string>;
// }) {

//     const filterFreshsalesLeadsData = freshsalesLeadsData.rows.filter((row: FreshsalesDataAggregatedRow) => selectedCategories.length == 0 || selectedCategories.includes(row.category));

//     const freshsalesLeadsDataGroupByCampaigns = filterFreshsalesLeadsData.reduce(createGroupByReducer("leadGenerationSourceCampaignName"), {});

//     // {"campaign": {"leadStatus1": 12, "leadStatus2": 12}, ....}
//     const leadCountGroupByCampaignAndLeadStatus = kvpArrayToObjectReducer(
//         Object.entries(freshsalesLeadsDataGroupByCampaigns)
//             .map(([campaignName, rowsGroupByCampaigns]) => [
//                 campaignName,
//                 Object.entries(rowsGroupByCampaigns.reduce(createGroupByReducer("leadStage"), {})).map(([leadStage, rowsGroupByCampaignsAndLeadStage]) => [
//                     leadStage,
//                     rowsGroupByCampaignsAndLeadStage.reduce((total: number, current: FreshsalesDataAggregatedRow) => total + current.count, 0),
//                 ]),
//             ])
//             .map(([key, value]) => [key, kvpArrayToObjectReducer(value)])
//     );

//     const timeToCloseGroupByCampaign = kvpArrayToObjectReducer(
//         Object.entries(freshsalesLeadsDataGroupByCampaigns).map(([campaignName, rowsGroupByCampaigns]) => [campaignName, rowsGroupByCampaigns.reduce((total: number, current: FreshsalesDataAggregatedRow) => total + current.timeToClose, 0)])
//     );

//     const campaigns = Object.keys(leadCountGroupByCampaignAndLeadStatus);

//     return (
//         <div>
//             <Tabs.Root defaultValue="1" className="tw-col-span-12">
//                 <Tabs.List className="">
//                     <Tabs.Trigger value="1" className="lp-tab">
//                         Campaign wise distribution of lead status
//                     </Tabs.Trigger>
//                     <Tabs.Trigger value="2" className="lp-tab">
//                         Time to close lead converstion
//                     </Tabs.Trigger>
//                 </Tabs.List>
//                 <Tabs.Content value="1">
//                     <div className="tw-grid">
//                         <GenericCard
//                             className="tw-col-span-12"
//                             content={
//                                 <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
//                                     <AgGridReact
//                                         rowData={campaigns.map((campaignName, index) => ({
//                                             campaign: campaignName,
//                                             appointmentTaken: leadCountGroupByCampaignAndLeadStatus[campaignName]["Appointment Taken"],
//                                             qualified: leadCountGroupByCampaignAndLeadStatus[campaignName]["Qualified"],
//                                             new: leadCountGroupByCampaignAndLeadStatus[campaignName]["New"],
//                                             disqualified: leadCountGroupByCampaignAndLeadStatus[campaignName]["Disqualified"],
//                                             nonContactable: leadCountGroupByCampaignAndLeadStatus[campaignName]["Non Contactable"],
//                                             requirementsReceived: leadCountGroupByCampaignAndLeadStatus[campaignName]["Requirements Received"],
//                                             notResponding: leadCountGroupByCampaignAndLeadStatus[campaignName]["Not Responding"],
//                                         }))}
//                                         columnDefs={[
//                                             {
//                                                 headerName: "Campaign",
//                                                 field: "campaign",
//                                             },
//                                             {headerName: "Appointment Taken", field: "appointmentTaken"},
//                                             {headerName: "Qualified", field: "qualified"},
//                                             {headerName: "New", field: "new"},
//                                             {headerName: "Disqualified", field: "disqualified"},
//                                             {headerName: "Non Contactable", field: "nonContactable"},
//                                             {headerName: "Requirements Received", field: "requirementsReceived"},
//                                             {headerName: "Not Responding", field: "notResponding"},
//                                         ]}
//                                         defaultColDef={defaultColumnDefinitions}
//                                         animateRows={true}
//                                         enableRangeSelection={true}
//                                     />
//                                 </div>
//                             }
//                             metaQuery={freshsalesLeadsData.metaQuery}
//                         />
//                     </div>
//                 </Tabs.Content>
//                 <Tabs.Content value="2">
//                     <GenericCard
//                         className="tw-col-span-12"
//                         content={
//                             <div className="tw-col-span-12 tw-h-[640px] ag-theme-alpine-dark">
//                                 <AgGridReact
//                                     rowData={campaigns.map((campaignName, index) => ({
//                                         campaign: campaignName,
//                                         timeToClose: roundOffToTwoDigits(timeToCloseGroupByCampaign[campaignName]),
//                                     }))}
//                                     columnDefs={[
//                                         {
//                                             headerName: "Campaign",
//                                             field: "campaign",
//                                         },
//                                         {headerName: "Time To Close", field: "timeToClose"},
//                                     ]}
//                                     defaultColDef={defaultColumnDefinitions}
//                                     animateRows={true}
//                                     enableRangeSelection={true}
//                                 />
//                             </div>
//                         }
//                         metaQuery={freshsalesLeadsData.metaQuery}
//                     />
//                 </Tabs.Content>
//             </Tabs.Root>
//         </div>
//     );
// }
