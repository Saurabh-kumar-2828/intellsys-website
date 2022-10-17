import {extent} from "d3-array";
import {axisBottom, axisLeft} from "d3-axis";
import {scaleBand, scaleLinear} from "d3-scale";
import {select} from "d3-selection";
import {line} from "d3-shape";
import React from "react";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export class LineGraphComponent extends React.Component {
    renderGraph = () => {
        var data = this.props.data;
        var barWidth = this.props.barWidth;

        if (data == null) {
            return;
        }

        const groupWidth = barWidth;
        const xScalePaddingAsFractionForEachElement = 0;
        const xScaleSecondaryPaddingAsFractionForEachElement = 0.25;
        const margins = {
            top: 50,
            right: 20,
            bottom: 100,
            // bottom: 200, // This causes a weird white line at bottom, investigate
            left: 100,
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

        node.attr("width", width).attr("height", height);

        node.selectAll("*").remove();

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
        var xScale = scaleBand().domain(data.x).range([0, graphInnerWidth]).padding(xScalePaddingAsFractionForEachElement);

        node.append("g")
            .attr("transform", `translate(${margins.left}, ${height - margins.bottom})`)
            .attr("class", "xAxis")
            .call(axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "translate(-10, 0) rotate(-45)")
            .style("text-anchor", "end");

        // Y Axis
        var yExtent = extent(Object.values(data.y).map(yInfo => yInfo.data).flat());

        var yScale = scaleLinear().domain(yExtent).range([graphInnerHeight, 0]).nice();

        node.append("g").attr("transform", `translate(${margins.left}, ${margins.top})`).attr("class", "yAxis").call(axisLeft(yScale));

        // Horizontal lines along y axis. Explicitly using `domain()[1]` instead of `yMax`
        // because `nice()` can cause `domain()[1]` to be greater than `yMax`.
        var yScaleMaxTick = yScale.domain()[1];

        node.append("g")
            .attr("transform", `translate(${margins.left}, ${margins.top})`)
            .attr("class", "grid")
            .call(
                axisLeft(yScale)
                    .tickSize(-graphInnerWidth)
                    .tickFormat("")
                    .tickValues([yScaleMaxTick * 0.25, yScaleMaxTick * 0.5, yScaleMaxTick * 0.75, yScaleMaxTick])
            );

        // Actual graph
        Object.values(data.y).forEach((yInfo, lineIndex) => {
            const dataForLine = yInfo.data;
            const yClass = yInfo;

            // Draw the line
            node.append("path")
                .datum(dataForLine)
                .attr("class", `tw-fill-[none] tw-stroke-2 ${yInfo.lineClassName}`)
                .attr(
                    "d",
                    line()
                        .x((dataForPoint, index) => xScale(data.x[index]) + barWidth/2 + margins.left)
                        .y((dataForPoint) => yScale(dataForPoint) + margins.top)
                );

            // Draw circles to highlight the data points
            node.selectAll(null)
                .data(dataForLine)
                .enter()
                .append("circle")
                .attr("class", `dataLineCircle ${yInfo.pointClassName}`)
                .attr("cx", (dataForPoint, index) => xScale(data.x[index]) + barWidth/2 + margins.left)
                .attr("cy", (dataForPoint) => yScale(dataForPoint) + margins.top)
                .attr("r", 3)
                // TODO: Remove once we have proper tooltips.
                .append("title")
                .text((dataForPoint) => dataForPoint);
        });

        // Legend
        var legendNode = node
            .append("g")
            .attr("transform", `translate(${margins.left + legendBoxLeftMargin}, ${margins.top + legendBoxTopMargin})`)
            .attr("class", "tw-fill-[#00000033]");

        legendNode.append("rect").attr("width", legendBoxWidth).attr("height", legendBoxHeight);

        Object.entries(data.y).forEach(([group, yInfo], groupIndex) => {
            const yClass = yInfo.pointClassName;

            // Add legend
            legendNode
                .append("circle")
                .attr("class", `legendCircle ${yClass}`)
                .attr("cx", legendBoxPaddingLeft)
                .attr("cy", (groupIndex + 0.5) * legendRowHeight + legendBoxPaddingTop)
                .attr("r", 3);

            legendNode
                .append("text")
                .attr("class", "tw-fill-white")
                .text(group)
                .attr("x", legendBoxPaddingLeft + legendTextMarginLeft)
                .attr("y", (groupIndex + 0.5) * legendRowHeight + legendBoxPaddingTop)
                .attr("dominant-baseline", "middle");
        });
    };

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

        return <svg ref={(node) => (this.node = node)} className={concatenateNonNullStringsWithSpaces("lineGraphComponent", this.props.className)} />;
    }
}
