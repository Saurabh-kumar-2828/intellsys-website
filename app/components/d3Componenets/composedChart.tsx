import {axisBottom, axisLeft, axisRight} from "d3-axis";
import type {ScaleLinear} from "d3-scale";
import {scaleBand, scaleLinear} from "d3-scale";
import {select} from "d3-selection";
import React, {useEffect, useRef} from "react";
import BarGraphComponent from "~/components/d3Componenets/barGraphComponent";
import {legend} from "~/components/d3Componenets/legend";
import {plotMargins, Scale} from "~/utilities/utilities";
import LineGraphComponent from "./lineGraphComponent";

interface IProps {
    data?: number[];
    height: number;
    xValues: Array<string>;
    children: any;
    className: string
    title: string
}

export type legendObject = {
    color: string;
    name: string;
};

type scaleObject = {
    type: string;
    min: number;
    max: number;
    yScale: ScaleLinear<number, number, never>;
    legends: Array<legendObject>;
};

export function ComposedChart(props: IProps) {
    const d3Container = useRef(null);

    const height = props.height;
    const padding = 0.2;
    const innerHeight = height - plotMargins.top - plotMargins.bottom;
    const innerWidth = 30 * props.xValues.length; // TODO: Fix 60
    const width = innerWidth + plotMargins.left + plotMargins.right;
    const legendBoxTopMargin = 20;
    const legendBoxLeftMargin = 25;

    // Common x-scale
    const xScale = scaleBand()
        .domain(props.xValues.map((d: string) => d))
        .range([0, innerWidth])
        .padding(padding)
        .round(true);

    useEffect(() => {
        const svg = select(d3Container.current);

        svg.select(".xAxis").remove();
        svg.select(".yAxis").remove();
        svg.select(".grid-lines").remove();

        svg.append("g")
            .attr("transform", `translate(${plotMargins.left},${height - plotMargins.bottom})`)
            .attr("class", "xAxis")
            .call(axisBottom(xScale));

        // Enter new D3 elements
        svg.selectAll(".tick")
            .selectAll("text")
            .style("text-anchor", "end")
            .style("font-weight", 500)
            .style("font-size", 12)
            .style("color", "#CCC0C0")
            .style("font-family", "Poppins")
            .style("font-style", "normal")
            .attr("dx", "-.18em")
            .attr("transform", "rotate(-35)");

        const yAxisScales = getAllYAxisScales(props.children, innerHeight);

        if (yAxisScales.length <= 2) {
            // Left-axis
            svg.append("g")
                .attr("transform", `translate( ${plotMargins.left}, ${plotMargins.top})`)
                .attr("class", "yAxis")
                .style("font-weight", 400)
                .style("font-size", 12)
                .style("color", "#CCC0C0")
                .style("font-family", "Poppins")
                .style("font-style", "normal")
                .call(axisLeft(yAxisScales[0].yScale));

            // Left-axis Legend
            svg.call(legend, {data: yAxisScales[0].legends, x: plotMargins.left / 2, y: legendBoxTopMargin});

            // Right-axis
            if (yAxisScales.length == 2) {
                svg.append("g")
                    .attr("transform", `translate(${plotMargins.left + innerWidth}, ${plotMargins.top})`)
                    .attr("class", "yAxis")
                    .call(axisRight(yAxisScales[1].yScale));

                // Right-axis Legend
                svg.call(legend, {data: yAxisScales[1].legends, x: innerWidth - plotMargins.left, y: legendBoxTopMargin});
            }

            svg.selectAll(".tick").selectAll("text").style("font-weight", 400).style("color", "#CCC0C0").style("font-size", 12).style("font-family", "Poppins").style("font-style", "normal");

        } else {
            let legendsFromAllScales: Array<legendObject> = [];
            yAxisScales.map((value: scaleObject) => {
                legendsFromAllScales = legendsFromAllScales.concat(value.legends);
            });
            svg.call(legend, {data: legendsFromAllScales, x: plotMargins.left / 2, y: legendBoxTopMargin});

        }

        // Grid lines
        svg.append("g")
            .attr("class", "grid-lines")
            .attr("transform", `translate(${plotMargins.left}, ${plotMargins.top})`)
            .selectAll("line")
            .data(yAxisScales[0].yScale.ticks())
            .join("line")
            .attr("x1", xScale.bandwidth())
            .attr("x2", innerWidth)
            .attr("y1", (d) => yAxisScales[0].yScale(d))
            .attr("y2", (d) => yAxisScales[0].yScale(d))
            .style("stroke", "#CCC0C0")
            .style("opacity", 0.3)
            .style("stroke-dasharray", 10)
            .style("fill", "none");

    }, [height, innerHeight, props.children, xScale, props.data, innerWidth, props.title, width, props.className]);


    return (
        <>
            <svg
                className="d3-component"
                width={width}
                height={height}
                ref={d3Container}
            >
            </svg>
            {React.Children.map(props.children, (child) => {
                if (child == null) {
                    return null;
                }
                if (child.key == "BarGraph") {
                    return (
                        <BarGraphComponent
                            data={child.props.data}
                            className={props.className ? props.className : ""}
                            forwardedRef={d3Container}
                            xScale={xScale}
                            scale={child.props.scale}
                            width={width}
                            height={height}
                            padding={padding}
                        />
                    );
                }
                if (child.key == "LineGraph") {
                    return (
                        <LineGraphComponent
                            data={child.props.data}
                            className={props.className ? props.className : ""}
                            forwardedRef={d3Container}
                            xScale={xScale}
                            scale={child.props.scale}
                            width={width}
                            height={height}
                            padding={padding}
                        />
                    );
                }
            })}
        </>

    );
}

function getAllYAxisScales(children: any, innerHeight: number) {
    var scales: Array<scaleObject> = [];
    var normalizedScale: scaleObject = {
        type: "",
        min: 0,
        max: 1,
        yScale: scaleLinear().domain([0, 1]).range([innerHeight, 0]).nice(),
        legends: [],
    };
    var percentageScale: scaleObject = {
        type: "",
        min: 0,
        max: 100,
        yScale: scaleLinear().domain([0, 100]).range([innerHeight, 0]).nice(),
        legends: [],
    };
    var isNormalizedScaleAdded: boolean = false;
    var isPercentageScaleAdded: boolean = false;
    React.Children.map(children, (child) => {
        if (child != null) {
            if (child.props.scale == Scale.normalizedScale) {
                if (!isNormalizedScaleAdded) {
                    normalizedScale = {
                        type: Scale.normalizedScale,
                        min: 0,
                        max: 1,
                        yScale: scaleLinear().domain([0, 1]).range([innerHeight, 0]).nice(),
                        legends: [{color: child.props.data.series.color, name: child.props.data.series.name}],
                    };
                    isNormalizedScaleAdded = true;
                } else {
                    normalizedScale.legends.push({color: child.props.data.series.color, name: child.props.data.series.name});
                }
            } else if (child.props.scale == Scale.percentageScale) {
                if (!isPercentageScaleAdded) {
                    percentageScale = {
                        type: Scale.percentageScale,
                        min: 0,
                        max: 100,
                        yScale: scaleLinear().domain([0, 100]).range([innerHeight, 0]).nice(),
                        legends: [],
                    };
                    isPercentageScaleAdded = true;
                } else {
                    percentageScale.legends.push({color: child.props.data.series.color, name: child.props.data.series.name});
                }
            } else if (child.props.scale == Scale.dataDriven) {
                scales.push({
                    type: Scale.dataDriven,
                    min: 0,
                    max: child.props.data.yMax,
                    yScale: scaleLinear().domain([0, child.props.data.yMax]).range([innerHeight, 0]).nice(),
                    legends: [{color: child.props.data.series.color, name: child.props.data.series.name}],
                });
            }
        }
    });

    if (normalizedScale.type != "") {
        scales.push(normalizedScale);
    }
    if (percentageScale.type != "") {
        scales.push(percentageScale);
    }
    return scales;
}
