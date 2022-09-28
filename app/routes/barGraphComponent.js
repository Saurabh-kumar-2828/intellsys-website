import React from "react";
import {scaleLinear} from "d3-scale";
import {scaleBand} from "d3-scale";
import {extent} from "d3-array";
import {axisBottom} from "d3-axis";
import {axisLeft} from "d3-axis";
import {select} from "d3-selection";
import { concatenateNonNullStringsWithSpaces } from "~/utilities/utilities";

export class BarGraphComponent extends React.Component {
    renderGraph = () => {
        var data = this.props.data;
        var yClasses = this.props.yClasses;
        var barWidth = this.props.barWidth;

        if (data == null) {
            return;
        }

        const groupWidth = barWidth * Object.values(data.y).length;
        const xScalePaddingAsFractionForEachElement = 0;
        const xScaleSecondaryPaddingAsFractionForEachElement = 0.25;
        const margins = {
            top: 50,
            right: 20,
            bottom: 100,
            // bottom: 200, // This causes a weird white line at bottom, investigate
            left: 100
        };

        // const scalingFactor = 1;
        const graphInnerWidth = groupWidth * data.x.length;
        const graphInnerHeight = this.props.height - margins.top - margins.bottom;
        const width = margins.left + margins.right + graphInnerWidth;
        const height = this.props.height;
        const legendBoxWidth = 200;
        const legendRowHeight = 20;
        const legendBoxTopMargin = 20;
        const legendBoxLeftMargin = 20;
        const legendBoxPaddingTop = 5;
        const legendBoxPaddingLeft = 10;
        const legendBoxPaddingBottom = 5;
        const legendTextMarginLeft = 10;
        const legendBoxHeight = legendRowHeight * Object.keys(data.y).length + legendBoxPaddingTop + legendBoxPaddingBottom;

        const node = select(this.node);

        node.attr("width", width)
            .attr("height", height);

        node.selectAll("*")
            .remove();

        // if (data == null || yLabels == null) {
        //     node.append("text")
        //         .attr("x", "50%")
        //         .attr("y", "50%")
        //         .attr("text-anchor", "middle")
        //         .attr("dominant-baseline", "middle")
        //         .attr("fill", "white")
        //         .text("No data found");
        //     return;
        // }

        // X Axis
        var xScale = scaleBand()
            .domain(data.x)
            .range([0, graphInnerWidth])
            .padding(xScalePaddingAsFractionForEachElement);

        node.append("g")
            .attr("transform", `translate(${margins.left}, ${height - margins.bottom})`)
            .attr("class", "xAxis")
            .call(axisBottom(xScale))
            .selectAll("text")
                .attr("transform", "translate(-10, 0) rotate(-45)")
                .style("text-anchor", "end");

        // Y Axis
        var yExtent = extent(Object.values(data.y).flat());

        var yScale = scaleLinear()
            .domain(yExtent)
            .range([graphInnerHeight, 0])
            .nice();

        node.append("g")
            .attr("transform", `translate(${margins.left}, ${margins.top})`)
            .attr("class", "yAxis")
            .call(axisLeft(yScale));

        // Horizontal lines along y axis. Explicitly using `domain()[1]` instead of `yMax`
        // because `nice()` can cause `domain()[1]` to be greater than `yMax`.
        var yScaleMaxTick = yScale.domain()[1];

        node.append("g")
            .attr("transform", `translate(${margins.left}, ${margins.top})`)
            .attr("class", "grid")
            .call(axisLeft(yScale)
                .tickSize(-graphInnerWidth)
                .tickFormat("")
                .tickValues([yScaleMaxTick * 0.25, yScaleMaxTick * 0.5, yScaleMaxTick * 0.75, yScaleMaxTick]));

        // Secondary x axis, for positioning the different bars for a given group
        var xScaleSecondary = scaleBand()
            .domain(Object.keys(data.y))
            .range([0, xScale.bandwidth()])
            .padding(xScaleSecondaryPaddingAsFractionForEachElement);

        // Actual graph
        node.selectAll(null)
            .data(data.x)
            .enter()
                .append("g")
                .attr("transform", group => `translate(${xScale(group) + margins.left}, 0)`)
                .selectAll(null)
                .data((xValue, xIndex) => Object.entries(data.y).map(([group, yValues]) => [group, yValues[xIndex]]))
                .enter()
                    .append("rect")
                    .attr("x", ([group, yValue]) => xScaleSecondary(group))
                    .attr("y", ([group, yValue]) => yScale(yValue) + margins.top)
                    .attr("width", xScaleSecondary.bandwidth())
                    .attr("height", ([group, yValue]) => graphInnerHeight - yScale(yValue))
                    .attr("class", ([group, yValue], groupIndex) => yClasses[groupIndex])
                        // TODO: Remove once we have proper tooltips.
                        .append("title")
                        .text(dataForPoint => dataForPoint[1]);

        // Legend
        var legendNode = node.append("g")
            .attr("transform", `translate(${margins.left + legendBoxLeftMargin}, ${margins.top + legendBoxTopMargin})`)
            .attr("class", "tw-fill-[#00000033]");

        legendNode.append("rect")
            .attr("width", legendBoxWidth)
            .attr("height", legendBoxHeight);

        Object.keys(data.y).forEach((group, groupIndex) => {
            const yClass = yClasses[groupIndex];

            // Add legend
            legendNode.append("circle")
                .attr("class", `legendCircle ${yClass}`)
                .attr("cx", legendBoxPaddingLeft)
                .attr("cy", (groupIndex + 0.5) * legendRowHeight + legendBoxPaddingTop)
                .attr("r", 3);

            legendNode.append("text")
                .attr("class", "tw-fill-white")
                .text(group)
                .attr("x", legendBoxPaddingLeft + legendTextMarginLeft)
                .attr("y", (groupIndex + 0.5) * legendRowHeight + legendBoxPaddingTop)
                .attr("dominant-baseline", "middle");
        });
    }

    componentDidMount() {
        this.renderGraph();
    }

    componentDidUpdate() {
        this.renderGraph();
    }

    render() {
        if (this.props.data == null) {
            return null;
        }

        return (
            <svg
                ref={node => this.node = node}
                className={concatenateNonNullStringsWithSpaces("barGraphComponent", this.props.className)}
            />
        );
    }
}
