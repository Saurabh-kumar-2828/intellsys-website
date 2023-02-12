import React from "react";
import {axisLeft, axisRight} from "d3-axis";
import {ScaleBand, scaleBand, ScaleLinear, scaleLinear} from "d3-scale";
import {select} from "d3-selection";
import {plotMargins, scale, yAxisDisplay} from "~/backend/utilities/utilities.server";

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

export class BarGraphComponent extends React.Component<props> {
    constructor(props: any) {
        super(props);
    }

    static displayName: string = "BarGraphComponent";

    componentDidMount() {
        this.drawBarChart(this.props.data, this.props.xScale);
    }

    componentDidUpdate() {
        this.drawBarChart(this.props.data, this.props.xScale);
    }

    drawBarChart(data: lineDataObject, xScale: ScaleBand<string> | undefined) {
        const width = this.props.width;
        const height = this.props.height;
        const padding = this.props.padding;

        if (height == undefined || width == undefined) {
            return null;
        }

        const innerHeight = height - plotMargins.top - plotMargins.bottom;
        const innerWidth = width - plotMargins.left - plotMargins.right;

        // Xscale

        if (xScale === undefined) {
            xScale = scaleBand()
                .domain(data.dates.map((d: string) => d))
                .range([0, innerWidth])
                .padding(padding);
        }

        // Yscale
        var yScale: ScaleLinear<number, number, never>;
        if (this.props.scale == scale.normalizedScale) {
            data.yMax = 1;
        } else if (this.props.scale == scale.percentageScale) {
            data.yMax = 100;
        }
        yScale = scaleLinear().domain([0, data.yMax]).range([0, innerHeight]).nice();
        const yScaleReversed = scaleLinear().domain([0, data.yMax]).range([innerHeight, 0]).nice();

        const node = select(this.props.container!);

        node.selectAll("rect")
            .data(data.series.values)
            .enter()
            .append("rect")
            .attr("x", (d) => plotMargins.left + xScale(d.date))
            .attr("y", (d) => innerHeight + plotMargins.top - yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => yScale(d.value))
            .attr("fill", "white");
    }
    render() {
        return null;
    }
}

export default BarGraphComponent;
