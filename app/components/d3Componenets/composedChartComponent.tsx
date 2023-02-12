import {axisBottom, axisLeft, axisRight} from "d3-axis";
import {NumberValue, scaleBand, scaleLinear, ScaleLinear} from "d3-scale";
import {select} from "d3-selection";
import React, {useRef} from "react";
import BarGraphComponent from "./barGraphComponent";
import {LineGraphComponent} from "./lineGraphComponent";
import {plotMargins, scale, yAxisDisplay} from "~/backend/utilities/utilities.server";
import {legend} from "./legend";

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

export function ComposedChart(props: {xValues: Array<string>; className: string; children: any; title: string; height: number; width: number}) {
    const ref = useRef(null);

    const height = props.height;
    const padding = 0.2;
    const innerHeight = height - plotMargins.top - plotMargins.bottom;
    const innerWidth = 60 * props.xValues.length;
    const width = innerWidth + plotMargins.left + plotMargins.right;
    const legendBoxTopMargin = 20;
    const legendBoxLeftMargin = 25;

    if (props.children == null) {
        return null;
    }
    // Common x-scale
    const xScale = scaleBand()
        .domain(props.xValues.map((d: string) => d))
        .range([0, innerWidth])
        .padding(padding)
        .round(true);

    // Plot graph
    const node = select(ref.current);

    node.attr("width", width).attr("height", height);
    node.selectAll("*").remove();

    // X-axis
    node.append("g")
        .attr("transform", `translate(${plotMargins.left},${height - plotMargins.bottom})`)
        .attr("class", "xAxis")
        .call(axisBottom(xScale));

    node.selectAll(".tick")
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-weight", 500)
        .style("font-size", 12)
        .style("color", "#CCC0C0")
        .style("font-family", "Poppins")
        .style("font-style", "normal")
        .attr("dx", "-.18em")
        .attr("transform", "rotate(-35)");

    // Y-axis
    const yAxisScales = getAllYAxisScales(props.children, innerHeight);

    if (yAxisScales.length <= 2) {
        // Left-axis
        node.append("g")
            .attr("transform", `translate(${plotMargins.left}, ${plotMargins.top})`)
            .attr("class", "yAxis")
            .style("font-weight", 400)
            .style("font-size", 12)
            .style("color", "#CCC0C0")
            .style("font-family", "Poppins")
            .style("font-style", "normal")
            .call(axisLeft(yAxisScales[0].yScale));

        // Legend
        node.call(legend, {data: yAxisScales[0].legends, x: plotMargins.left / 2, y: legendBoxTopMargin});

        // Right-axis
        if (yAxisScales.length == 2) {
            node.append("g")
                .attr("transform", `translate(${plotMargins.left + innerWidth}, ${plotMargins.top})`)
                .attr("class", "yAxis")
                .call(axisRight(yAxisScales[1].yScale));

            // Legend
            node.call(legend, {data: yAxisScales[1].legends, x: innerWidth - plotMargins.left, y: legendBoxTopMargin});
        }

        node.selectAll(".tick").selectAll("text").style("font-weight", 400).style("color", "#CCC0C0").style("font-size", 12).style("font-family", "Poppins").style("font-style", "normal");
    } else {
        var legendsFromAllScales: Array<legendObject> = [];
        yAxisScales.map((value: scaleObject) => {
            legendsFromAllScales = legendsFromAllScales.concat(value.legends);
        });
        node.call(legend, {data: legendsFromAllScales, x: plotMargins.left / 2, y: legendBoxTopMargin});
    }

    // Grid lines
    node.append("g")
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

    // Title of graph
    // node.append("text")
    //     .attr("x", width / 2)
    //     .attr("y", plotMargins.top / 2)
    //     .attr("text-anchor", "middle")
    //     .style("font-size", "20px")
    //     .text(props.title)
    //     .attr("class", "tw-fill-white");

    return (
        <svg className={props.className ? props.className : ""} ref={ref}>
            {React.Children.map(props.children, (child) => {
                if (child == null) {
                    return null;
                }
                const childClass = child.type.displayName;
                if (childClass == "BarGraphComponent") {
                    return (
                        <BarGraphComponent
                            data={child.props.data}
                            className={props.className ? props.className : ""}
                            container={ref.current}
                            xScale={xScale}
                            scale={child.props.scale}
                            width={width}
                            height={height}
                            padding={padding}
                        />
                    );
                }
                if (childClass == "LineGraphComponent") {
                    return (
                        <LineGraphComponent
                            data={child.props.data}
                            className={props.className ? props.className : ""}
                            container={ref.current}
                            xScale={xScale}
                            scale={child.props.scale}
                            width={width}
                            height={height}
                            padding={padding}
                        />
                    );
                }
            })}
        </svg>
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
            if (child.props.scale == scale.normalizedScale) {
                if (!isNormalizedScaleAdded) {
                    normalizedScale = {
                        type: scale.normalizedScale,
                        min: 0,
                        max: 1,
                        yScale: scaleLinear().domain([0, 1]).range([innerHeight, 0]).nice(),
                        legends: [{color: child.props.data.series.color, name: child.props.data.series.name}],
                    };
                    isNormalizedScaleAdded = true;
                } else {
                    normalizedScale.legends.push({color: child.props.data.series.color, name: child.props.data.series.name});
                }
            } else if (child.props.scale == scale.percentageScale) {
                if (!isPercentageScaleAdded) {
                    percentageScale = {
                        type: scale.percentageScale,
                        min: 0,
                        max: 100,
                        yScale: scaleLinear().domain([0, 100]).range([innerHeight, 0]).nice(),
                        legends: [],
                    };
                    isPercentageScaleAdded = true;
                } else {
                    percentageScale.legends.push({color: child.props.data.series.color, name: child.props.data.series.name});
                }
            } else if (child.props.scale == scale.dataDriven) {
                scales.push({
                    type: scale.dataDriven,
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
