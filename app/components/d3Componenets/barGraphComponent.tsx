import type React from "react";
import {useEffect} from "react";
import type {ScaleBand, ScaleLinear} from "d3-scale";
import {scaleLinear} from "d3-scale";
import {select} from "d3-selection";
import {plotMargins, Scale} from "~/utilities/utilities";
import type {DataObject} from "./common";

interface props {
    data: DataObject;
    forwardedRef: React.MutableRefObject<null>;
    className?: string | null;
    xScale: ScaleBand<string>;
    scale?: string;
    width?: number;
    height?: number;
    padding: number | 0;
}
export const BarGraphComponent: React.FC<props> = ({
    data,
    className,
    forwardedRef,
    xScale,
    scale,
    width,
    height,
    padding,
}) => {

    useEffect(() => {
        drawBarChart(data, xScale);
    }, [data, xScale]);

    const drawBarChart = (data: DataObject, xScale: ScaleBand<string>) => {
        if (height == undefined || width == undefined) {
            return null;
        }

        const innerHeight = height - plotMargins.top - plotMargins.bottom;

        // Yscale // TODO: Fix this
        let yScale: ScaleLinear<number, number, never>;
        if (scale == Scale.normalizedScale) {
            data.yMax = 1;
        } else if (scale == Scale.percentageScale) {
            data.yMax = 100;
        }
        yScale = scaleLinear().domain([0, data.yMax]).range([0, innerHeight]).nice();

        const node = select(forwardedRef.current);

        node.selectAll("rect")
            .data(data.series.values)
            .enter()
            .append("rect")
            .attr("x", (d) => plotMargins.left + xScale(d.xValue))
            .attr("y", (d) => innerHeight + plotMargins.top - yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => yScale(d.value))
            .attr("fill", "white");

    }

        return null;
}

export default BarGraphComponent;
