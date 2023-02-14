import {axisLeft, axisRight} from "d3-axis";
import {ScaleBand, scaleBand, ScaleLinear, scaleLinear, scaleOrdinal} from "d3-scale";
import {select} from "d3-selection";
import {line} from "d3-shape";
import React from "react";
import {legend} from "./legend";
import {bisector} from "d3-array";
import {plotMargins, Scale} from "~/utilities/utilities";

type lineDataObject = {
    dates: Array<string>;
    yMax: number;
    series: {values: Array<{date: string; value: number}>; name: string; color: string};
};

interface props {
    data: lineDataObject;
    container?: string | null;
    className?: string | null;
    xScale?: ScaleBand<string>;
    scale?: string;
    width?: number;
    height?: number;
    padding?: number | 0;
}

export class LineGraphComponent extends React.Component<props> {
    renderGraph = () => {
        var data: lineDataObject = this.props.data;
        var xScale: ScaleBand<string> | undefined = this.props.xScale;

        if (data == null) {
            return;
        }

        const width = this.props.width;
        const height = this.props.height;
        const padding = this.props.padding;

        if (height == undefined || width == undefined) {
            return null;
        }

        const innerHeight = height - plotMargins.top - plotMargins.bottom;
        const innerWidth = width - plotMargins.left - plotMargins.right;

        // X Axis
        if (xScale === undefined) {
            xScale = scaleBand()
                .domain(data.dates.map((d: string) => d))
                .range([0, innerWidth])
                .padding(padding!);
        }

        // Yscale
        var yScale: ScaleLinear<number, number, never>;
        if (this.props.scale == Scale.normalizedScale) {
            data.yMax = 1;
        } else if (this.props.scale == Scale.percentageScale) {
            data.yMax = 100;
        }
        yScale = scaleLinear().domain([0, data.yMax]).range([innerHeight, 0]).nice();

        // Plot graph
        const node = select(this.props.container!);
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
                        return xScale(d.date);
                    })
                    .y(function (d) {
                        return yScale(d.value);
                    })
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
            .attr("cx", (d) => xScale(d.date))
            .attr("cy", (d) => yScale(d.value))
            .attr("r", 6)
            .style("fill", data.series.color)
            .style("fill-opacity", 0.4)
            .style("height", 12)
            .style("width", 12)
            .style("stroke", `${data.series.color}`)
            .style("stroke-width", "1");
    };

    static displayName: string = "LineGraphComponent";

    componentDidMount() {
        this.renderGraph();
    }

    componentDidUpdate() {
        this.renderGraph();
    }

    render() {
        return null;
    }
}
