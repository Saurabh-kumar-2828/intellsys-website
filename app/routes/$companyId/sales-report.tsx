// import {LinksFunction, LoaderFunction, MetaFunction, redirect} from "@remix-run/node";
// import {json} from "@remix-run/node";
// import {useLoaderData} from "@remix-run/react";
// import {AgGridReact} from "ag-grid-react";
// import {ArcElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from "chart.js";
// import {DateTime} from "luxon";
// import {useCallback, useRef, useState} from "react";
// import {getElementsAtEvent, Line, Pie} from "react-chartjs-2";
// import {
//     AdsData,
//     AdsDataAggregatedRow,
//     FreshsalesData,
//     getAdsData,
//     getFreshsalesData,
//     getShopifyData,
//     getTimeGranularityFromUnknown,
//     ShopifyData,
//     ShopifyDataAggregatedRow,
//     TimeGranularity,
// } from "~/backend/business-insights";
// import {CampaignInformation, getCampaignLibrary, getProductLibrary, ProductInformation} from "~/backend/common";
// import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
// import {aggregateByDate, createGroupByReducer, sumReducer} from "~/utilities/utilities";
// import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
// import {DateFilterSection, FancySearchableSelect, GenericCard} from "~/components/scratchpad";
// import {Iso8601Date, Uuid} from "~/utilities/typeDefinitions";
// import {distinct, getColor, getDates, getNonEmptyStringOrNull, roundOffToTwoDigits} from "~/utilities/utilities";
// import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
// import "ag-grid-enterprise";

// export const meta: MetaFunction = () => {
//     return {
//         title: "Sales Report - Intellsys",
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
//     const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, allProductInformation, shopifyData, adsData, companyId} = useLoaderData();

//     const numberOfSelectedDays = DateTime.fromISO(appliedMaxDate).diff(DateTime.fromISO(appliedMinDate), "days").toObject().days! + 1;

//     const r5_marketingAcos = "?";
//     const r5_facebookAcos = "?";
//     const r5_agentAcos = "?";
//     const r5_googleAcos = "?";
//     const r5_highestAcos = "?";
//     const r5_lowestAcos = "?";
//     const r5_netAcos = "?";

//     const [selectedCategory, setSelectedCategory] = useState("Non Mattress");
//     const [selectedGranularity, setSelectedGranularity] = useState(appliedSelectedGranularity);
//     const [selectedMinDate, setSelectedMinDate] = useState(appliedMinDate ?? "");
//     const [selectedMaxDate, setSelectedMaxDate] = useState(appliedMaxDate ?? "");
//     const [selectedInsight, setSelectedInsight] = useState("netQuantity");

//     const businesses = distinct(allProductInformation.map((productInformation: ProductInformation) => productInformation.category));
//     const insights = ["netQuantity", "netSales"];

//     const [selectedProducts, setSelectedProducts] = useState<Array<string>>([]);

//     const granularities = ["Daily", "Weekly", "Monthly", "Yearly"];

//     return (
//         <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
//             <DateFilterSection
//                 granularities={granularities}
//                 selectedGranularity={selectedGranularity}
//                 setSelectedGranularity={setSelectedGranularity}
//                 selectedMinDate={selectedMinDate}
//                 setSelectedMinDate={setSelectedMinDate}
//                 selectedMaxDate={selectedMaxDate}
//                 setSelectedMaxDate={setSelectedMaxDate}
//                 page={`/${companyId}/sales-report`}
//             />

//             <div className="tw-col-span-12 tw-bg-dark-bg-400 tw-sticky tw-top-32 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
//                 <FancySearchableSelect label="Choose Category" options={businesses} selectedOption={selectedCategory} setSelectedOption={setSelectedCategory} />
//                 <FancySearchableSelect label="Insights On" options={insights} selectedOption={selectedInsight} setSelectedOption={setSelectedInsight} />
//             </div>

//             <CategorySection
//                 shopifyData={shopifyData}
//                 adsData={adsData}
//                 selectedCategory={selectedCategory}
//                 setSelectedCategory={setSelectedCategory}
//                 selectedInsight={selectedInsight}
//                 minDate={appliedMinDate}
//                 maxDate={appliedMaxDate}
//                 selectedProducts={selectedProducts}
//                 setSelectedProducts={setSelectedProducts}
//             />

//             <ProductsSection
//                 shopifyData={shopifyData}
//                 selectedCategory={selectedCategory}
//                 setSelectedCategory={setSelectedCategory}
//                 selectedInsight={selectedInsight}
//                 minDate={appliedMinDate}
//                 maxDate={appliedMaxDate}
//                 selectedProducts={selectedProducts}
//                 setSelectedProducts={setSelectedProducts}
//             />

//             <VariantSection
//                 shopifyData={shopifyData}
//                 selectedCategory={selectedCategory}
//                 setSelectedCategory={setSelectedCategory}
//                 selectedInsight={selectedInsight}
//                 minDate={appliedMinDate}
//                 maxDate={appliedMaxDate}
//                 selectedProducts={selectedProducts}
//                 setSelectedProducts={setSelectedProducts}
//             />
//         </div>
//     );
// }

// function CategorySection(props: {
//     shopifyData: ShopifyData;
//     adsData: AdsData;
//     selectedCategory: string;
//     setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
//     selectedInsight: string;
//     minDate: Iso8601Date;
//     maxDate: Iso8601Date;
//     selectedProducts: Array<string>;
//     setSelectedProducts: React.Dispatch<React.SetStateAction<Array<string>>>;
// }) {
//     const categoryRevenueRef = useRef();
//     const categoryOrderRef = useRef();
//     const categorySpendRef = useRef();
//     const [showNoOfUnitsSold, setShowNoOfUnitsSold] = useState(true);
//     const [showNetSales, setShowNetSales] = useState(false);
//     const [showAmountSpent, setShowAmountSpent] = useState(false);

//     const dates = getDates(props.minDate, props.maxDate);

//     const filteredShopifyData = props.shopifyData.rows.filter((row: ShopifyDataAggregatedRow) => row.productCategory == props.selectedCategory);
//     const filteredAdsData = props.adsData.rows.filter((row: AdsDataAggregatedRow) => row.category == props.selectedCategory);

//     ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

//     const categoryData = {
//         dayWiseNetSales: aggregateByDate(filteredShopifyData, "netSales", dates),
//         dayWiseAmountSpent: aggregateByDate(filteredAdsData, "amountSpent", dates),
//         dayWiseNoOfUnits: aggregateByDate(filteredShopifyData, "netQuantity", dates),
//     };

//     const labels = dates;
//     const noOfUnitsSoldDataset: Array<object> = [
//         {
//             label: props.selectedCategory,
//             data: categoryData.dayWiseNoOfUnits,
//             backgroundColor: getColor(props.selectedCategory),
//             borderColor: getColor(props.selectedCategory),
//         },
//     ];

//     const amountSpentDataset: Array<object> = [
//         {
//             label: props.selectedCategory,
//             data: categoryData.dayWiseAmountSpent,
//             backgroundColor: getColor(props.selectedCategory),
//             borderColor: getColor(props.selectedCategory),
//         },
//     ];

//     const netSalesDataset: Array<object> = [
//         {
//             label: props.selectedCategory,
//             data: categoryData.dayWiseNetSales,
//             backgroundColor: getColor(props.selectedCategory),
//             borderColor: getColor(props.selectedCategory),
//         },
//     ];

//     // product categories vs selectedInsight
//     const shopifyDataGroupByCategory = props.shopifyData.rows
//         .filter((row: ShopifyDataAggregatedRow) => row.date <= props.maxDate && row.date >= props.minDate)
//         .reduce(createGroupByReducer("productCategory"), {});

//     const adsDataGroupByCategory = props.adsData.rows
//         .filter((row: AdsDataAggregatedRow) => {
//             row.date <= props.maxDate && row.date >= props.minDate;
//         })
//         .reduce(createGroupByReducer("category"), {});

//     const categoryVsRevenue: Array<number> = [];
//     const categoryVsRevenueColor: Array<string> = [];
//     const categoryVsOrder: Array<number> = [];
//     const categoryVsOrderColor: Array<string> = [];
//     const categoryVsSpend: Array<number> = [];
//     const categoryVsSpendColor: Array<string> = [];

//     Object.keys(shopifyDataGroupByCategory).forEach((category) => {
//         categoryVsRevenue.push(shopifyDataGroupByCategory[category].reduce((total: number, item: ShopifyDataAggregatedRow) => total + item.netSales, 0));
//         categoryVsRevenueColor.push(getColor(category));
//     });

//     Object.keys(shopifyDataGroupByCategory).forEach((category) => {
//         categoryVsOrder.push(shopifyDataGroupByCategory[category].reduce((total: number, item: ShopifyDataAggregatedRow) => total + item.netQuantity, 0));
//         categoryVsOrderColor.push(getColor(category));
//     });

//     Object.keys(adsDataGroupByCategory).forEach((category) => {
//         categoryVsSpend.push(adsDataGroupByCategory[category].reduce((total: number, item: ShopifyDataAggregatedRow) => total + item.amountSpent, 0));
//         categoryVsSpendColor.push(getColor(category));
//     });

//     const categoryRevenueOptions = {
//         responsive: true,
//         plugins: {
//             legend: {
//                 position: "top" as const,
//             },
//             title: {
//                 display: true,
//                 text: "Net sales of each category",
//             },
//         },
//     };

//     const categoryUnitsOptions = {
//         responsive: true,
//         plugins: {
//             legend: {
//                 position: "top" as const,
//             },
//             title: {
//                 display: true,
//                 text: "Units sold per category",
//             },
//         },
//     };

//     const categorySpendOptions = {
//         responsive: true,
//         plugins: {
//             legend: {
//                 position: "top" as const,
//             },
//             title: {
//                 display: true,
//                 text: "Advertising expenditure on each category",
//             },
//         },
//     };

//     // TO DO: rename to something sensible
//     const dataForCategoryVsRevenueLineChart = {
//         labels: Object.keys(shopifyDataGroupByCategory),
//         datasets: [
//             {
//                 label: "Net sales per category",
//                 data: categoryVsRevenue,
//                 backgroundColor: categoryVsRevenueColor,
//                 borderColor: categoryVsRevenueColor,
//                 borderWidth: 1,
//                 weight: 100,
//             },
//         ],
//     };

//     const dataForCategoryVsOrdersLineChart = {
//         labels: Object.keys(shopifyDataGroupByCategory),
//         datasets: [
//             {
//                 label: "Units sold per category",
//                 data: categoryVsOrder,
//                 backgroundColor: categoryVsOrderColor,
//                 borderColor: categoryVsOrderColor,
//                 borderWidth: 1,
//                 weight: 100,
//             },
//         ],
//     };

//     const dataForCategoryVsSpendsLineChart = {
//         labels: Object.keys(adsDataGroupByCategory),
//         datasets: [
//             {
//                 label: "Advertising expenditure on each category",
//                 data: categoryVsSpend,
//                 backgroundColor: categoryVsSpendColor,
//                 borderColor: categoryVsSpendColor,
//                 borderWidth: 1,
//                 weight: 100,
//             },
//         ],
//     };

//     return (
//         <>
//             <div className="tw-grid tw-grid-cols-12 tw-col-span-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
//                 <GenericCard
//                     className="tw-col-span-4"
//                     content={
//                         <Pie
//                             data={dataForCategoryVsRevenueLineChart}
//                             options={categoryRevenueOptions}
//                             ref={categoryRevenueRef}
//                             onClick={(event) => props.setSelectedCategory(dataForCategoryVsRevenueLineChart["labels"][getElementsAtEvent(categoryRevenueRef.current, event)[0]["index"]])}
//                         />
//                     }
//                     metaQuery={props.shopifyData.metaQuery}
//                 />
//                 <GenericCard
//                     className="tw-col-span-4"
//                     content={
//                         <Pie
//                             data={dataForCategoryVsOrdersLineChart}
//                             options={categoryUnitsOptions}
//                             ref={categoryOrderRef}
//                             onClick={(event) => props.setSelectedCategory(dataForCategoryVsOrdersLineChart["labels"][getElementsAtEvent(categoryOrderRef.current, event)[0]["index"]])}
//                         />
//                     }
//                     metaQuery={props.shopifyData.metaQuery}
//                 />
//                 <GenericCard
//                     className="tw-col-span-4"
//                     content={
//                         <Pie
//                             data={dataForCategoryVsSpendsLineChart}
//                             options={categorySpendOptions}
//                             ref={categorySpendRef}
//                             onClick={(event) => props.setSelectedCategory(dataForCategoryVsSpendsLineChart["labels"][getElementsAtEvent(categorySpendRef.current, event)[0]["index"]])}
//                         />
//                     }
//                     metaQuery={props.shopifyData.metaQuery}
//                 />
//             </div>
//             <div className="tw-grid tw-grid-cols-12 tw-col-span-12 tw-gap-x-6 tw-gap-y-4 tw-p-8">
//                 <GenericCard
//                     className="tw-col-span-12"
//                     content={
//                         <div className="tw-grid tw-grid-cols-4">
//                             <div className="tw-row-start-1 tw-col-start-2 tw-col-span-2 tw-grid">
//                                 {showNoOfUnitsSold && <Line options={categoryUnitsOptions} data={{labels, datasets: noOfUnitsSoldDataset}} className="tw-row-start-1 tw-col-start-1" />}
//                                 {showNetSales && <Line options={categoryRevenueOptions} data={{labels, datasets: netSalesDataset}} className="tw-row-start-1 tw-col-start-1" />}
//                                 {showAmountSpent && <Line options={categorySpendOptions} data={{labels, datasets: amountSpentDataset}} className="tw-row-start-1 tw-col-start-1" />}
//                             </div>
//                             <div className="tw-row-start-2 tw-col-start-1 tw-col-span-4 tw-flex tw-flex-row tw-justify-center">
//                                 <input type="checkbox" id="units" checked={showNoOfUnitsSold} onChange={(e) => setShowNoOfUnitsSold(e.target.checked)} />
//                                 <label htmlFor="units" className="tw-pl-2">
//                                     Units Sold
//                                 </label>

//                                 <VerticalSpacer className="tw-w-8" />

//                                 <input type="checkbox" id="netsales" checked={showNetSales} onChange={(e) => setShowNetSales(e.target.checked)} />
//                                 <label htmlFor="netsales" className="tw-pl-2">
//                                     Net Sales
//                                 </label>
//                                 <VerticalSpacer className="tw-w-8" />

//                                 <input type="checkbox" id="amountspent" checked={showAmountSpent} onChange={(e) => setShowAmountSpent(e.target.checked)} />
//                                 <label htmlFor="amountspent" className="tw-pl-2">
//                                     Amount Spent
//                                 </label>
//                             </div>
//                         </div>
//                     }
//                     metaQuery={props.shopifyData.metaQuery}
//                 />
//             </div>
//         </>
//     );
// }

// function ProductsSection(props: {
//     shopifyData: ShopifyData;
//     selectedCategory: string;
//     setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
//     selectedInsight: string;
//     minDate: Iso8601Date;
//     maxDate: Iso8601Date;
//     selectedProducts: Array<string>;
//     setSelectedProducts: React.Dispatch<React.SetStateAction<Array<string>>>;
// }) {
//     const gridRef = useRef();

//     const [showNoOfUnitsSold, setShowNoOfUnitsSold] = useState(true);
//     const [showNetSales, setShowNetSales] = useState(false);

//     const dates = getDates(props.minDate, props.maxDate);

//     const filteredShopifyData = props.shopifyData.rows.filter((row: ShopifyDataAggregatedRow) => row.productCategory == props.selectedCategory);

//     const filteredShopifyDataGroupByProduct = filteredShopifyData.reduce(createGroupByReducer("productTitle"), {});

//     const dayWiseUnitsSoldForEachProduct: {[key: string]: Array<number>} = {};
//     const dayWiseNetSalesGeneratedByEachProduct: {[key: string]: Array<number>} = {};

//     for (const product in filteredShopifyDataGroupByProduct) {
//         const dataGroupByDate = aggregateByDate(filteredShopifyDataGroupByProduct[product], "netQuantity", dates);
//         dayWiseUnitsSoldForEachProduct[product] = dataGroupByDate;
//     }

//     for (const product in filteredShopifyDataGroupByProduct) {
//         const dataGroupByDate = aggregateByDate(filteredShopifyDataGroupByProduct[product], "netSales", dates);
//         dayWiseNetSalesGeneratedByEachProduct[product] = dataGroupByDate;
//     }

//     const products = Object.keys(dayWiseUnitsSoldForEachProduct);
//     const noOfUnitsSoldForEachProduct = products.map((product) => ({productName: product, noOfUnits: roundOffToTwoDigits(dayWiseUnitsSoldForEachProduct[product].reduce(sumReducer, 0))}));
//     const netSalesForEachProduct = products.map((product) => ({productName: product, netSales: roundOffToTwoDigits(dayWiseNetSalesGeneratedByEachProduct[product].reduce(sumReducer, 0))}));

//     const onSelectionChanged = useCallback(() => {
//         var selectedRows = gridRef.current.api.getSelectedRows();
//         const products = selectedRows.map((row) => row.productName);
//         props.setSelectedProducts(products);
//     }, []);

//     const defaultColumnDefinitions = {
//         sortable: true,
//         filter: true,
//     };

//     const links: LinksFunction = () => {
//         return [
//             {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-grid.css"},
//             {rel: "stylesheet", href: "https://unpkg.com/ag-grid-community/styles/ag-theme-alpine.css"},
//         ];
//     };

//     ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

//     const noOfUnitsSoldOptions = {
//         responsive: true,
//         plugins: {
//             legend: {
//                 position: "top" as const,
//             },
//             title: {
//                 display: true,
//                 text: "Day-wise distribution -> Units sold per product",
//             },
//         },
//     };

//     const netSalesOptions = {
//         responsive: true,
//         plugins: {
//             legend: {
//                 position: "top" as const,
//             },
//             title: {
//                 display: true,
//                 text: "Day-wise distribution -> Net sales per product",
//             },
//         },
//     };

//     const labels = dates;
//     const noOfUnitsSoldDataset: Array<object> = [];
//     props.selectedProducts.map((product) => {
//         const lineColor = getColor(product);
//         const result = {
//             label: product,
//             data: dayWiseUnitsSoldForEachProduct[product as keyof typeof dayWiseUnitsSoldForEachProduct],
//             borderColor: lineColor,
//             backgroundColor: lineColor,
//         };
//         noOfUnitsSoldDataset.push(result);
//     });

//     const netSalesDataset: Array<object> = [];
//     props.selectedProducts.map((product) => {
//         const lineColor = getColor(product);
//         const result = {
//             label: product,
//             data: dayWiseNetSalesGeneratedByEachProduct[product as keyof typeof dayWiseNetSalesGeneratedByEachProduct],
//             borderColor: lineColor,
//             backgroundColor: lineColor,
//         };
//         netSalesDataset.push(result);
//     });

//     return (
//         <>
//             <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> {props.selectedCategory} </div>
//             <div className="tw-col-span-6 tw-h-[640px] ag-theme-alpine-dark">
//                 <AgGridReact
//                     ref={gridRef}
//                     rowData={products.map((product, index) => ({
//                         productName: product,
//                         noOfUnitsSoldForEachProduct: noOfUnitsSoldForEachProduct[index].noOfUnits,
//                         netSalesForEachProduct: netSalesForEachProduct[index].netSales,
//                     }))}
//                     columnDefs={[
//                         {
//                             headerName: "Product",
//                             field: "productName",
//                             headerCheckboxSelection: true,
//                             showDisabledCheckboxes: true,
//                             checkboxSelection: (params) => {
//                                 return !!params.data;
//                             },
//                             minWidth: 500,
//                         },
//                         {headerName: "No. of Units Sold", field: "noOfUnitsSoldForEachProduct", sort: "desc"},
//                         {headerName: "Net Sales", field: "netSalesForEachProduct"},
//                     ]}
//                     defaultColDef={defaultColumnDefinitions}
//                     animateRows={true}
//                     rowSelection={"multiple"}
//                     suppressRowClickSelection={true}
//                     onSelectionChanged={onSelectionChanged}
//                 />
//             </div>
//             <GenericCard
//                 className="tw-grid tw-content-center tw-col-span-6"
//                 content={
//                     <>
//                         <div className="tw-h-fit tw-flex tw-flex-row tw-justify-center">
//                             <input type="checkbox" id="units" checked={showNoOfUnitsSold} onChange={(e) => setShowNoOfUnitsSold(e.target.checked)} />
//                             <label htmlFor="units" className="tw-pl-2">
//                                 Units Sold
//                             </label>

//                             <VerticalSpacer className="tw-w-8" />

//                             <input type="checkbox" id="netsales" checked={showNetSales} onChange={(e) => setShowNetSales(e.target.checked)} />
//                             <label htmlFor="netsales" className="tw-pl-2">
//                                 Net Sales
//                             </label>

//                             <VerticalSpacer className="tw-w-8" />
//                         </div>

//                         {showNoOfUnitsSold && <Line options={noOfUnitsSoldOptions} data={{labels, datasets: noOfUnitsSoldDataset}} className="tw-row-start-1 tw-col-start-1" />}
//                         {showNetSales && <Line options={netSalesOptions} data={{labels, datasets: netSalesDataset}} className="tw-row-start-1 tw-col-start-1" />}
//                     </>
//                 }
//                 metaQuery={props.shopifyData.metaQuery}
//             />
//         </>
//     );
// }

// function VariantSection(props: {
//     shopifyData: ShopifyData;
//     selectedCategory: string;
//     setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
//     selectedInsight: string;
//     minDate: Iso8601Date;
//     maxDate: Iso8601Date;
//     selectedProducts: Array<string>;
//     setSelectedProducts: React.Dispatch<React.SetStateAction<Array<string>>>;
// }) {
//     const filteredShopifyData = props.shopifyData.rows.filter((row: ShopifyDataAggregatedRow) => row.productCategory == props.selectedCategory);

//     return (
//         <>
//             <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Variant of selected products </div>
//             <div className="tw-col-span-4 tw-h-[640px] ag-theme-alpine-dark">
//                 <VariantTable shopifyData={filteredShopifyData} product={props.selectedProducts.length > 0 ? props.selectedProducts[0] : null} minDate={props.minDate} maxDate={props.maxDate} />
//             </div>
//             <div className="tw-col-span-4 tw-h-[640px] ag-theme-alpine-dark">
//                 <VariantTable shopifyData={filteredShopifyData} product={props.selectedProducts.length > 1 ? props.selectedProducts[1] : null} minDate={props.minDate} maxDate={props.maxDate} />
//             </div>
//             <div className="tw-col-span-4 tw-h-[640px] ag-theme-alpine-dark">
//                 <VariantTable shopifyData={filteredShopifyData} product={props.selectedProducts.length > 2 ? props.selectedProducts[2] : null} minDate={props.minDate} maxDate={props.maxDate} />
//             </div>
//         </>
//     );
// }

// function VariantTable(props: {shopifyData: Array<ShopifyDataAggregatedRow>; product: string | null; minDate: Iso8601Date; maxDate: Iso8601Date}) {
//     const dates = getDates(props.minDate, props.maxDate);
//     const shopifyDataGroupByVariantQuantity = props.shopifyData
//         .filter((row: ShopifyDataAggregatedRow) => props.product != null && row.productTitle == props.product)
//         .reduce(createGroupByReducer("variantTitle"), {});

//     const dayWiseUnitsSoldForEachVariant: {[key: string]: Array<number>} = {};
//     const dayWiseNetSalesGeneratedByEachVariant: {[key: string]: Array<number>} = {};

//     for (const variant in shopifyDataGroupByVariantQuantity) {
//         const dataGroupByDate = aggregateByDate(shopifyDataGroupByVariantQuantity[variant], "netQuantity", dates);
//         dayWiseUnitsSoldForEachVariant[variant] = dataGroupByDate;
//     }

//     for (const variant in shopifyDataGroupByVariantQuantity) {
//         const dataGroupByDate = aggregateByDate(shopifyDataGroupByVariantQuantity[variant], "netSales", dates);
//         dayWiseNetSalesGeneratedByEachVariant[variant] = dataGroupByDate;
//     }

//     const variants = Object.keys(dayWiseUnitsSoldForEachVariant);
//     const noOfUnitsSoldForEachVariant = variants.map((variant) => ({variantName: variant, noOfUnits: roundOffToTwoDigits(dayWiseUnitsSoldForEachVariant[variant].reduce(sumReducer, 0))}));
//     const netSalesForEachVariant = variants.map((variant) => ({variantName: variant, netSales: roundOffToTwoDigits(dayWiseNetSalesGeneratedByEachVariant[variant].reduce(sumReducer, 0))}));

//     const defaultColumnDefinitions = {
//         sortable: true,
//         filter: true,
//     };

//     return (
//         <AgGridReact
//             rowData={variants.map((variant, index) => ({
//                 variantName: variant,
//                 noOfUnitsSoldForEachVariant: noOfUnitsSoldForEachVariant[index].noOfUnits,
//                 netSalesForEachVariant: netSalesForEachVariant[index].netSales,
//             }))}
//             columnDefs={[
//                 {
//                     headerName: `Variant of ${props.product}`,
//                     field: "variantName",

//                     minWidth: 250,
//                 },
//                 {headerName: "No. of Units Sold", field: "noOfUnitsSoldForEachVariant", sortingOrder: ["desc"]},
//                 {headerName: "Net Sales", field: "netSalesForEachVariant"},
//             ]}
//             defaultColDef={defaultColumnDefinitions}
//             animateRows={true}
//         />
//     );
// }
