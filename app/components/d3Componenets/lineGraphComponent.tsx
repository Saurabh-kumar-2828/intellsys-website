import type {ScaleBand, ScaleLinear} from "d3-scale";
import {scaleBand, scaleLinear} from "d3-scale";
import {select, pointer} from "d3-selection";
import {line} from "d3-shape";
import {Scale, plotMargins} from "~/utilities/utilities";
import type {DataObject} from "./common";
import type React from "react";
import {useEffect} from "react";
import type {Integer} from "~/common--type-definitions/typeDefinitions";
import {bisector} from "d3-array";
import {transition} from "d3-transition";

interface props {
    data: DataObject;
    className: string;
    forwardedRef: React.MutableRefObject<null>;
    xScale: ScaleBand<string>;
    scale: string;
    width: Integer;
    height: Integer;
    padding: Integer;
}

export const LineGraphComponent: React.FC<props> = ({data, className, forwardedRef, xScale, scale, width, height, padding}) => {
    useEffect(() => {
        drawLineChart(data, xScale);
    });

    const drawLineChart = (data: DataObject, xScale: ScaleBand<string>) => {
        if (height == undefined || width == undefined) {
            return null;
        }

        const innerHeight = height - plotMargins.top - plotMargins.bottom;
        const innerWidth = width - plotMargins.left - plotMargins.right;

        // X Axis
        xScale = scaleBand()
            .domain(data.xValues.map((d: string) => d))
            .range([0, innerWidth])
            .padding(padding);

        // Yscale
        let yScale: ScaleLinear<number, number, never>;
        if (scale == Scale.normalizedScale) {
            data.yMax = 1;
        } else if (scale == Scale.percentageScale) {
            data.yMax = 100;
        }
        yScale = scaleLinear().domain([0, data.yMax]).range([innerHeight, 0]).nice();

        // Plot graph
        const node = select(forwardedRef.current);
        node.select(".line-chart").remove();

        const chartGroup = node
            .append("g")
            .attr("class", "line-chart")
            .attr("transform", `translate(${xScale.bandwidth() / 2 + plotMargins.left}, ${plotMargins.top})`);

        // Draw line
        chartGroup
            .append("path")
            .datum(data.series.values)
            .attr(
                "d",
                line()
                    .x(function (d) {
                        return xScale(d.xValue);
                    })
                    .y(function (d) {
                        return yScale(d.value);
                    }),
            )
            .attr("shape-rendering", "optimizeQuality")
            .style("fill", "none")
            .style("stroke", data.series.color)
            .style("stroke-width", 2);

        // Draw circles to highlight data points
        chartGroup
            .selectAll(".circle")
            .data(data.series.values)
            .enter()
            .append("circle")
            .attr("cx", (d) => xScale(d.xValue))
            .attr("cy", (d) => yScale(d.value))
            .attr("r", 6)
            .style("fill", data.series.color)
            .style("fill-opacity", 0.4)
            .style("stroke", `${data.series.color}`)
            .style("stroke-width", "1");

        // const focus = chartGroup
        //     .append("g")
        //     .attr("class", "focus")
        //     .style("display", "none");

        // focus
        //     .append('circle')
        //     .attr('r', 5)
        //     .attr('class', 'circle');

        // const toolTip = chartGroup
        //     .append("div")
        //     .attr("class", "tooltip")
        //     .style('opacity', 0.9);

        // chartGroup
        //     .append('rect')
        //     .attr('class', 'overlay')
        //     .attr('width', width)
        //     .attr('height', height)
        //     .style('opacity', 0)
        //     .on('mouseover', () => {
        //         focus.style('display', null);
        //     })
        //     .on('mouseout', () => {
        //         toolTip
        //             .transition()
        //             .duration(300)
        //             .style('opacity', 0);
        //     })
        //     .on('mousemove', (event) => {
        //         const bisect = bisector(d => d.xValue).left;
        //         const xPos = pointer(event)[0];

        //         let eachBand = xScale.step();
        //         let index = Math.round((xPos / eachBand));
        //         let xValue = xScale.domain()[index];

        //         const x0 = bisect(data.xValues, xValue);

        //         const d0 = data.series.values[x0];

        //         focus.attr(
        //             'transform',
        //             `translate(${xScale(d0.xValue)},${yScale(d0.value)})`,
        //         );

        //         // toolTip
        //         //     .transition()
        //         //     .duration(300)
        //         //     .style('opacity', 0.9);

        //         // toolTip
        //         //     .html(`<b>x: </b>${d0.xValue}<br><b>y: </b>${d0.value}`)
        //         //     .style(
        //         //         'transform',
        //         //         `translate(${xScale(d0.xValue) + 30}, ${yScale(d0.value) - 30})`,
        //         //     );
        //     });
    };

    return null;
};

export default LineGraphComponent;
