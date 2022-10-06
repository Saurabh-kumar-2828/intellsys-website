import React from "react";
import {scaleLinear} from "d3-scale";
import {extent} from "d3-array";
import {axisBottom} from "d3-axis";
import {axisLeft} from "d3-axis";
import {select} from "d3-selection";
import {line} from "d3-shape";

/***
 * Accepts the following parameters:
 *     - dataStore
 *     - height
 *     - data: 3d array, each element is an array of [x, y] points for a given line.
 *     - classes: List of CSS classes to associate with each line
 *     - yLabels: List of labels to associate with each line for the legend
 */
// TODO: Add extent here
export class LineGraphComponent extends React.Component {
    renderGraph = () => {
        var data = this.props.data;
        // var axesLabels = this.props.axesLabels;
        var yLabels = this.props.yLabels;
        var yClasses = this.props.yClasses;

        // const elementWidth = 35;
        // const paddingAsFractionForEachElement = 0.25;
        // const defaultElementCountIfNoDataIsPresent = 10;
        // const defaultValue = 0;
        const margins = {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
        };

        // // const scalingFactor = 1;
        const aspectRatio = 16/9;
        const graphInnerHeight = this.props.height - margins.top - margins.bottom;
        const graphInnerWidth = graphInnerHeight * aspectRatio;
        const width = margins.left + margins.right + graphInnerWidth;
        const height = this.props.height;
        const legendBoxWidth = 100;
        const legendRowHeight = 20;
        const legendBoxTopMargin = 20;
        const legendBoxLeftMargin = 20;
        const legendBoxPaddingTop = 5;
        const legendBoxPaddingLeft = 10;
        const legendBoxPaddingBottom = 5;
        const legendTextMarginLeft = 10;
        const legendBoxHeight = legendRowHeight * yLabels.length + legendBoxPaddingTop + legendBoxPaddingBottom;

        const node = select(this.node);

        node.attr("width", width)
            .attr("height", height);

        node.selectAll("*")
            .remove();

        // if (data == null || dataHeaders == null) {
        //     node.append("text")
        //         .attr("x", "50%")
        //         .attr("y", "50%")
        //         .attr("text-anchor", "middle")
        //         .attr("dominant-baseline", "middle")
        //         .attr("fill", "white")
        //         .text("No data found");
        //     return;
        // }

        // X axis
        var xExtent = extent(data.x);

        var xScale = scaleLinear()
            .domain(xExtent)
            .range([0, graphInnerWidth])
            .nice();

        node.append("g")
            .attr("transform", `translate(${margins.left}, ${height - margins.bottom})`)
            .attr("class", "xAxis")
            .call(axisBottom(xScale))
            .selectAll("text")
                .attr("transform", "translate(-10, 0) rotate(-45)")
                .style("text-anchor", "end");

        // Y axis
        var yExtent = extent(data.y.flat());

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

        // Actual graph
        data.y.forEach((dataForLine, lineIndex) => {
            const yClass = yClasses[lineIndex];

            // Draw the line
            node.append("path")
                .datum(dataForLine)
                .attr("class", `dataLinePath ${yClass}`)
                .attr("d", line()
                    .x((dataForPoint, index) => xScale(data.x[index]) + margins.left)
                    .y(dataForPoint => yScale(dataForPoint) + margins.top));

            // Draw circles to highlight the data points
            node.selectAll(null)
                .data(dataForLine)
                .enter()
                    .append("circle")
                    .attr("class", `dataLineCircle ${yClass}`)
                    .attr("cx", (dataForPoint, index) => xScale(data.x[index]) + margins.left)
                    .attr("cy", dataForPoint => yScale(dataForPoint) + margins.top)
                    .attr("r", 3)
                        // TODO: Remove once we have proper tooltips.
                        .append("title")
                        .text(dataForPoint => dataForPoint);
        });

        // Legend
        var legendNode = node.append("g")
            .attr("transform", `translate(${margins.left + legendBoxLeftMargin}, ${margins.top + legendBoxTopMargin})`)
            .attr("class", "legend");

        legendNode.append("rect")
            .attr("width", legendBoxWidth)
            .attr("height", legendBoxHeight);

        yLabels.forEach((yLabel, lineIndex) => {
            const yClass = yClasses[lineIndex];

            // Add legend
            legendNode.append("circle")
                .attr("class", `legendCircle ${yClass}`)
                .attr("cx", legendBoxPaddingLeft)
                .attr("cy", (lineIndex + 0.5) * legendRowHeight + legendBoxPaddingTop)
                .attr("r", 3);

            legendNode.append("text")
                .text(yLabel)
                .attr("x", legendBoxPaddingLeft + legendTextMarginLeft)
                .attr("y", (lineIndex + 0.5) * legendRowHeight + legendBoxPaddingTop)
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
        return (
            <svg
                ref={node => this.node = node}
                className={"lineGraphComponent" + (this.props.className ? ` ${this.props.className}` : "")} />
        );
    }
}
