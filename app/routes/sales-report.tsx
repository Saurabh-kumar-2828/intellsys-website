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
import {concatenateNonNullStringsWithAmpersand, distinct, getDates, numberToHumanFriendlyString} from "~/utilities/utilities";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {LineGraphComponent} from "~/components/reusableComponents/lineGraphComponent";

export const meta: MetaFunction = () => {
    return {
        title: "Sales Report - Livpure Data Management",
    };
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

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
        appliedSelectedGranularity: selectedGranularity,
        appliedMinDate: minDate,
        appliedMaxDate: maxDate,
        allProductInformation: await getAllProductInformation(),
        allSourceInformation: await getAllSourceToInformation(),
        shopifyData: await get_shopifyInsights(selectedGranularity, minDate, maxDate),
    });
};

export default function () {
    const {appliedSelectedGranularity, appliedMinDate, appliedMaxDate, allProductInformation, shopifyData} = useLoaderData();

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
    const [selectedInsight, setSelectedInsight] = useState("netQuantity");
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

    const resultAggregateBySubcategory = helperAggregate(
        shopifyData.rows.filter((row) => row.category == selectedCategory),
        "subCategory"
    );

    for (const subCategory in resultAggregateBySubcategory) {
        const aggregateByDate = aggregate(resultAggregateBySubcategory[subCategory], "date", selectedInsight);
        resultAggregateBySubcategory[subCategory] = aggregateByDate;
    }

    let colorIndex = 0;
    const subCategoryDate = getDates(appliedMinDate, appliedMaxDate);
    for (const subCategory in resultAggregateBySubcategory) {
        const result = {
            data: resultAggregateBySubcategory[subCategory].map((row) => row.param),
            pointClassName: fillColors[colorIndex],
            lineClassName: strokeColors[colorIndex],
        };
        resultAggregateBySubcategory[subCategory] = result;
        colorIndex++;
    }

    // Product vs quantity

    const resultAggregateByProductQuantity = helperAggregate(
        shopifyData.rows.filter((row) => row.category == selectedCategory),
        "productTitle"
    );
    for (const product in resultAggregateByProductQuantity) {
        const aggregateByDate = aggregate(resultAggregateByProductQuantity[product], "date", selectedInsight);
        resultAggregateByProductQuantity[product] = aggregateByDate;
    }

    const dates = getDates(appliedMinDate, appliedMaxDate);

    colorIndex = 0;
    for (const product in resultAggregateByProductQuantity) {
        const result = {
            data: resultAggregateByProductQuantity[product].map((row) => row.param),
            pointClassName: fillColors[colorIndex],
            lineClassName: strokeColors[colorIndex],
        };
        resultAggregateByProductQuantity[product] = result;
        colorIndex++;
    }

    // Variant vs Quantity
    const resultAggregateByVariantQuantity = helperAggregate(
        shopifyData.rows.filter((row) => row.category == selectedCategory && row.productTitle == selectedProduct),
        "variantTitle"
    );
    for (const variant in resultAggregateByVariantQuantity) {
        const aggregateByDate = aggregate(resultAggregateByVariantQuantity[variant], "date", selectedInsight);
        resultAggregateByVariantQuantity[variant] = aggregateByDate;
    }
    colorIndex = 0;
    for (const variant in resultAggregateByVariantQuantity) {
        const result = {
            data: resultAggregateByVariantQuantity[variant].map((row) => row.param),
            pointClassName: fillColors[colorIndex],
            lineClassName: strokeColors[colorIndex],
        };
        resultAggregateByVariantQuantity[variant] = result;
        colorIndex++;
    }

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
                        selectedCategory.length == 0 ? null : `selected_categories=${JSON.stringify(selectedCategory)}`
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

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Product sub-categories vs {selectedInsight}</div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: dates,
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
                            x: dates,
                            y: resultAggregateByProductQuantity,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            />

            <div className="tw-col-span-12 tw-text-[3rem] tw-text-center"> Variant vs {selectedInsight}</div>
            <div className="tw-col-span-12 tw-bg-[#2c1f54] tw-sticky tw-top-16 -tw-m-8 tw-mb-0 tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900 tw-z-30 tw-p-4 tw-grid tw-grid-cols-[auto_auto_auto_auto_auto_auto_auto_1fr_auto] tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                <FancySearchableSelect label="Product" options={products} selectedOption={selectedProduct} setSelectedOption={setSelectedProduct} />
            </div>
            <GenericCard
                className="tw-col-span-12"
                content={
                    <LineGraphComponent
                        data={{
                            x: dates,
                            y: resultAggregateByVariantQuantity,
                        }}
                        barWidth={80}
                        height={700}
                    />
                }
                metaQuery={shopifyData.metaQuery}
            />
        </div>
    );
}
