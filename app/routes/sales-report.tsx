import type {LoaderFunction, MetaFunction} from "@remix-run/node";
import * as Tabs from "@radix-ui/react-tabs";
import {json} from "@remix-run/node";
import {Link, useLoaderData} from "@remix-run/react";
import {DateTime} from "luxon";
import {useState} from "react";
import {get_shopifyInsights} from "~/backend/utilities/sales-report";
import {getAllProductInformation, getAllSourceToInformation} from "~/backend/common";
import {BarGraphComponent} from "~/components/reusableComponents/barGraphComponent";
import {Card, FancyCalendar, FancySearchableMultiSelect, FancySearchableSelect, GenericCard, ValueDisplayingCard} from "~/components/scratchpad";
import {QueryFilterType, ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithAmpersand, distinct, numberToHumanFriendlyString} from "~/utilities/utilities";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {LineGraphComponent} from "~/components/reusableComponents/lineGraphComponent";

export const meta: MetaFunction = () => {
    return {
        title: "Sales Report - Livpure Data Management",
    };
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    // const selectedCategoryRaw = urlSearchParams.get("selected_categories");
    // let selectedCategory;
    // if (selectedCategoryRaw == null || selectedCategoryRaw.length == 0) {
    //     selectedCategory = [];
    // } else {
    //     selectedCategory = JSON.parse(selectedCategoryRaw);
    // }

    // const selectedProductsRaw = urlSearchParams.get("selected_products");
    // let selectedProducts;
    // if (selectedProductsRaw == null || selectedProductsRaw.length == 0) {
    //     selectedProducts = [];
    // } else {
    //     selectedProducts = JSON.parse(selectedProductsRaw);
    // }

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
        // minDate = "2022-10-1";
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
        // appliedSelectedCategory: selectedCategory,
        // appliedSelectedProducts: selectedProducts,
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: minDate,
        appliedMaxDate: maxDate,
        allProductInformation: await getAllProductInformation(),
        allSourceInformation: await getAllSourceToInformation(),
        shopifyData: await get_shopifyInsights(selectedGranularity, minDate, maxDate),
    });
};

export default function () {
    const {
        appliedSelectedGranularity,
        appliedMinDate,
        appliedMaxDate,
        allProductInformation,
        shopifyData,
    } = useLoaderData();


    const numberOfSelectedDays = DateTime.fromISO(appliedMaxDate).diff(DateTime.fromISO(appliedMinDate), "days").toObject().days! + 1;

    const r5_marketingAcos = "?";
    const r5_facebookAcos = "?";
    const r5_agentAcos = "?";
    const r5_googleAcos = "?";
    const r5_highestAcos = "?";
    const r5_lowestAcos = "?";
    const r5_netAcos = "?";


    const [selectedCategory, setSelectedCategory] = useState("Non Mattress");
    const [selectedGranularity, setSelectedGranularity] = useState(appliedSelectedGranularity);
    const [selectedMinDate, setSelectedMinDate] = useState(appliedMinDate ?? "");
    const [selectedMaxDate, setSelectedMaxDate] = useState(appliedMaxDate ?? "");
    const [selectedInsight, setSelectedInsight] = useState("netQuantity")
    // TODO: Update filters when changing another one

    const businesses = distinct(allProductInformation.map((productInformation) => productInformation.category));
    const products = allProductInformation
        .filter((productInformation) => selectedCategory.length == 0 || selectedCategory.includes(productInformation.category))
        .map((productInformation) => productInformation.productName);
    const insights = ["netQuantity", "netSales"];


    const [selectedProduct, setSelectedProduct] = useState([]);


    const granularities = ["Daily", "Weekly", "Monthly", "Yearly"];

    const fillColors = [
        "tw-fill-blue-500",
        "tw-fill-red-500",
        "tw-fill-yellow-400",
        "tw-fill-pink-400",
        "tw-fill-purple-400",
        "tw-fill-white",
        "tw-fill-teal-400",
        "tw-fill-orange-400",
        "tw-fill-indigo-400",
        "tw-fill-amber-400",
        "tw-fill-lime-400",
        "tw-fill-sky-400",
        "tw-fill-fuchsia-400",
        "tw-fill-rose-400",
        "tw-fill-Emerald-400",
        "tw-fill-Emerald-100",
        "tw-fill-Emerald-200",
        "tw-fill-Emerald-300",
        "tw-fill-Fuchsia-300",
        "tw-fill-Fuchsia-400",
        "tw-fill-Fuchsia-500",
        "tw-fill-Fuchsia-600",
        "tw-fill-Fuchsia-800",
    ];
    const strokeColors = [
        "tw-stroke-blue-500",
        "tw-stroke-red-500",
        "tw-stroke-yellow-400",
        "tw-stroke-pink-400",
        "tw-stroke-purple-400",
        "tw-stroke-white",
        "tw-stroke-teal-400",
        "tw-stroke-orange-400",
        "tw-stroke-indigo-400",
        "tw-stroke-amber-400",
        "tw-stroke-lime-400",
        "tw-stroke-sky-400",
        "tw-stroke-fuchsia-400",
        "tw-stroke-rose-400",
        "tw-stroke-Emerald-400",
        "tw-stroke-Emerald-100",
        "tw-stroke-Emerald-200",
        "tw-stroke-Emerald-300",
        "tw-stroke-Fuchsia-300",
        "tw-stroke-Fuchsia-400",
        "tw-stroke-Fuchsia-500",
        "tw-stroke-Fuchsia-600",
        "tw-stroke-Fuchsia-800",
    ];

    function getDates(minDate: any, maxDate: any){
        const dates = [];
        dates.push(minDate);

        let tempDate = minDate;
        while(tempDate <= maxDate){
            tempDate = DateTime.fromISO(tempDate).plus({ days: 1 }).toISODate();
            dates.push(tempDate);
        }
        return dates;
    }

    function helperAggregate(array: Array<object>, groupBy: string) {
        let arrayAggregate: any = array.reduce((result, item) => {
            let groupby = result[item[`${groupBy}`]] || [];
            groupby.push(item);
            result[item[`${groupBy}`]] = groupby;
            return result;
        }, {});
        return arrayAggregate;
    }

    function aggregate(array: Array<object>, groupBy: string, param: string) {
        const result = [];
        let aggregateResult: any = helperAggregate(array, groupBy);

        for (const item in aggregateResult) {
            let paramValue = aggregateResult[item].reduce((total, sum) => total + sum[`${param}`], 0);
            let date = item;

            result.push({
                param: paramValue,
                groupBy: date,
            });
        }
        return result;
    }

    // function getDataCategoryVsParam(array: Array<object>, column: string, columnValue: string, param: string) {
    //     const dataCorrespondingToCategory = array.filter((row) => row[`${column}`] == columnValue);
    //     const dataCorrespondingToCategoryAggregateByDate = aggregate(dataCorrespondingToCategory, "date", param);
    //     return dataCorrespondingToCategoryAggregateByDate;
    // }

    // aggregate product category vs quantity
    // const resultAggregateByCategoryVsQuantity = helperAggregate(shopifyData.rows, "category");
    // for (const category in resultAggregateByCategoryVsQuantity) {
    //     const aggregateByDate = aggregate(resultAggregateByCategoryVsQuantity[category], "date", "netQuantity");
    //     resultAggregateByCategoryVsQuantity[category] = aggregateByDate;
    // }

    // let colorIndex = 0;
    // const categoryDate = resultAggregateByCategoryVsQuantity["Non Mattress"].map((row) => row.groupBy);
    // for (const category in resultAggregateByCategoryVsQuantity) {
    //     const result = {
    //         data: resultAggregateByCategoryVsQuantity[category].map((row) => row.param),
    //         pointClassName: fillColors[colorIndex],
    //         lineClassName: strokeColors[colorIndex],
    //     };
    //     resultAggregateByCategoryVsQuantity[category] = result;
    //     colorIndex++;
    // }

    // // aggregate product category vs revenue
    // const resultAggregateByCategoryVsRevenue = helperAggregate(shopifyData.rows, "category");
    // for (const category in resultAggregateByCategoryVsRevenue) {
    //     const aggregateByDate = aggregate(resultAggregateByCategoryVsRevenue[category], "date", "netSales");
    //     resultAggregateByCategoryVsRevenue[category] = aggregateByDate;
    // }

    // colorIndex = 0;
    // const categoryRevenueDate = resultAggregateByCategoryVsRevenue["Non Mattress"].map((row) => row.groupBy);
    // for (const category in resultAggregateByCategoryVsRevenue) {
    //     const result = {
    //         data: resultAggregateByCategoryVsRevenue[category].map((row) => row.param),
    //         pointClassName: fillColors[colorIndex],
    //         lineClassName: strokeColors[colorIndex],
    //     };
    //     resultAggregateByCategoryVsRevenue[category] = result;
    //     colorIndex++;
    // }

    // // product sub category vs quantity

    const resultAggregateBySubcategory = helperAggregate(shopifyData.rows.filter((row) => row.category == selectedCategory), "subCategory");

    for (const subCategory in resultAggregateBySubcategory) {
        const aggregateByDate = aggregate(resultAggregateBySubcategory[subCategory], "date", selectedInsight);
        resultAggregateBySubcategory[subCategory] = aggregateByDate;
    }

    let colorIndex = 0;
    const subCategoryDate = getDates(appliedMinDate, appliedMaxDate);
    console.log(subCategoryDate);
    for (const subCategory in resultAggregateBySubcategory) {
        const result = {
            data: resultAggregateBySubcategory[subCategory].map((row) => row.param),
            pointClassName: fillColors[colorIndex],
            lineClassName: strokeColors[colorIndex],
        };
        resultAggregateBySubcategory[subCategory] = result;
        colorIndex++;
    }


    // // product vs quantity

    const resultAggregateByProductQuantity = helperAggregate(shopifyData.rows.filter((row) => row.category == selectedCategory), "productTitle");
    for (const product in resultAggregateByProductQuantity) {
        const aggregateByDate = aggregate(resultAggregateByProductQuantity[product], "date", selectedInsight);
        resultAggregateByProductQuantity[product] = aggregateByDate;
    }

    colorIndex = 0;
    const productQuantityDate = getDates(appliedMinDate, appliedMaxDate);
    for (const product in resultAggregateByProductQuantity) {
        const result = {
            data: resultAggregateByProductQuantity[product].map((row) => row.param),
            pointClassName: fillColors[colorIndex],
            lineClassName: strokeColors[colorIndex],
        };
        resultAggregateByProductQuantity[product] = result;
        colorIndex++;
    }

    // // product vs revenue
    // const resultAggregateByProductRevenue = helperAggregate(shopifyData.rows, "productTitle");
    // for (const product in resultAggregateByProductRevenue) {
    //     const aggregateByDate = aggregate(resultAggregateByProductRevenue[product], "date", "netSales");
    //     resultAggregateByProductRevenue[product] = aggregateByDate;
    // }

    // colorIndex = 0;
    // const productRevenueDate = resultAggregateByProductRevenue["All Weather Comforter"].map((row) => row.groupBy);
    // for (const product in resultAggregateByProductRevenue) {
    //     const result = {
    //         data: resultAggregateByProductRevenue[product].map((row) => row.param),
    //         pointClassName: fillColors[colorIndex],
    //         lineClassName: strokeColors[colorIndex],
    //     };
    //     resultAggregateByProductRevenue[product] = result;
    //     colorIndex++;
    // }

    // // variant vs quQuantity
    const resultAggregateByVariantQuantity = helperAggregate(shopifyData.rows.filter((row) => row.category == selectedCategory && row.productTitle == selectedProduct), "variantTitle");
    for (const variant in resultAggregateByVariantQuantity) {
        const aggregateByDate = aggregate(resultAggregateByVariantQuantity[variant], "date", selectedInsight);
        resultAggregateByVariantQuantity[variant] = aggregateByDate;
    }
    colorIndex = 0;
    const variantQuantityDate = getDates(appliedMinDate, appliedMaxDate);
    for (const variant in resultAggregateByVariantQuantity) {
        const result = {
            data: resultAggregateByVariantQuantity[variant].map((row) => row.param),
            pointClassName: fillColors[colorIndex],
            lineClassName: strokeColors[colorIndex],
        };
        resultAggregateByVariantQuantity[variant] = result;
        colorIndex++;
    }

    // // variant vs revenue

    // const resultAggregateByVariantRevenue = helperAggregate(shopifyData.rows, "variantTitle");
    // for (const variant in resultAggregateByVariantRevenue) {
    //     const aggregateByDate = aggregate(resultAggregateByVariantRevenue[variant], "date", "netSales");
    //     resultAggregateByVariantRevenue[variant] = aggregateByDate;
    // }
    // colorIndex = 0;
    // const variantRevenueDate = resultAggregateByVariantRevenue["Double / Navy Blue"].map((row) => row.groupBy);
    // for (const variant in resultAggregateByVariantRevenue) {
    //     const result = {
    //         data: resultAggregateByVariantRevenue[variant].map((row) => row.param),
    //         pointClassName: fillColors[colorIndex],
    //         lineClassName: strokeColors[colorIndex],
    //     };
    //     resultAggregateByVariantRevenue[variant] = result;
    //     colorIndex++;
    // }

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-bg-[#2c1f54] tw-sticky tw-top-16 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">

                <FancySearchableSelect label="Granularity" options={granularities} selectedOption={selectedGranularity} setSelectedOption={setSelectedGranularity} />

                <FancyCalendar label="Start Date" value={selectedMinDate} setValue={setSelectedMinDate} />

                <FancyCalendar label="End Date" value={selectedMaxDate} setValue={setSelectedMaxDate} />



                <Link
                    to={concatenateNonNullStringsWithAmpersand(
                        `/sales-report?selected_granularity=${selectedGranularity}`,
                        `min_date=${selectedMinDate}`,
                        `max_date=${selectedMaxDate}`,
                        // selectedCampaigns.length == 0 ? null : `selected_campaigns=${JSON.stringify(selectedCampaigns)}`,
                        selectedCategory.length == 0 ? null : `selected_categories=${JSON.stringify(selectedCategory)}`,
                        // selectedProducts.length == 0 ? null : `selected_products=${JSON.stringify(selectedProducts)}`,
                        // selectedPlatforms.length == 0 ? null : `selected_platforms=${JSON.stringify(selectedPlatforms)}`
                    )}
                    className="-tw-col-end-1 tw-bg-lp tw-p-2 tw-rounded-md"
                >
                    Update Filters
                </Link>
            </div>

            <div className="tw-col-span-12 tw-bg-[#2c1f54] tw-sticky tw-top-16 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                <FancySearchableSelect label="Choose Category" options={businesses} selectedOption={selectedCategory} setSelectedOption={setSelectedCategory} />
                <FancySearchableSelect label="Insights On" options={insights} selectedOption={selectedInsight} setSelectedOption={setSelectedInsight} />
            </div>


            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">{selectedCategory}</div>

            {/* <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Leads</div>

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
            /> */}

            {/* {/* <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Product categories vs quantity sold</div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: categoryDate,
                            y: resultAggregateByCategoryVsQuantity,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Product categories vs Sales</div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: categoryRevenueDate,
                            y: resultAggregateByCategoryVsRevenue,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            /> */}

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Product sub-categories vs {selectedInsight}</div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: subCategoryDate,
                            y: resultAggregateBySubcategory,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Product vs {selectedInsight}</div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: productQuantityDate,
                            y: resultAggregateByProductQuantity,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            />

            <div className="tw-col-span-12 tw-bg-[#2c1f54] tw-sticky tw-top-16 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                <FancySearchableSelect label="Product" options={products} selectedOption={selectedProduct} setSelectedOption={setSelectedProduct} />
            </div>


            {/* <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Product vs Revenue sold</div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: productRevenueDate,
                            y: resultAggregateByProductRevenue,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            /> */}

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Variant vs {selectedInsight}</div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: variantQuantityDate,
                            y: resultAggregateByVariantQuantity,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            />

            {/*<div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Variant vs Revenue sold</div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: variantRevenueDate,
                            y: resultAggregateByVariantRevenue,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            /> */}

            {/* <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Orders</div>

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

            <div className="tw-col-span-2" /> */}

            {/* <GenericCard
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
            /> */}

            {/* {/* <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Revenue</div>

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

            <div className="tw-col-span-2" /> */}

            {/* <Tabs.Root defaultValue="1" className="tw-col-span-6">
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
            /> */}

            {/* <GenericCard
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
            /> */}

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
