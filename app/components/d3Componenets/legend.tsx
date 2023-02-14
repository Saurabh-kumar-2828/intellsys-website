import React from "react";
import {plotMargins, YAxisDisplay} from "~/backend/utilities/utilities.server";
import {legendObject} from "./composedChartComponent";

export const legend = (
    container: any,
    props: {data: Array<{color: string, name: string}>, x: number, y: number}
) => {
    const {data, x, y} = props;

    const legendBoxWidth = 169;
    const legendRowHeight = 30;
    const legendBoxTopMargin = 15;
    const legendBoxLeftMargin = 15;
    const legendBoxPaddingTop = 6;
    const legendBoxPaddingLeft = 3;
    const legendBoxPaddingBottom = 6;
    const legendTextMarginLeft = 5;
    const legendBoxHeight = legendRowHeight * data.length + legendBoxPaddingTop + legendBoxPaddingBottom;

    const legendSymbolRadius = 11;
    var legendNode = container.append("g").attr("transform", `translate(${x}, ${y})`);

    legendNode.append("rect").attr("width", legendBoxWidth).attr("height", legendBoxHeight).attr("class", "tw-fill-[#191919] tw-opacity-0.7").attr("rx", 12).attr("ry", 12);

    var legendGroup = legendNode.append("g").attr("transform", `translate(${legendBoxLeftMargin}, ${legendBoxTopMargin})`)
    data.forEach((d: legendObject, groupIndex: number) => {
        // Add legend
        legendGroup
            .append("circle")
            .attr("class", `legendcircle`)
            .attr("cx", legendBoxPaddingLeft)
            .attr("cy", groupIndex * legendRowHeight + legendBoxPaddingTop)
            .attr("r", legendSymbolRadius)
            .style("fill", `${d.color}`)
            .style("fill-opacity", 0.7)
            .style("stroke", `${d.color}`)
            .style("stroke-width", "2");

        legendGroup
            .append("text")
            .attr("class", "tw-fill-white")
            .text(d.name)
            .attr("x", legendBoxPaddingLeft + legendSymbolRadius + legendTextMarginLeft)
            .attr("y", groupIndex * legendRowHeight + legendBoxPaddingTop)
            .attr("text-anchor", "left")
            .attr("dominant-baseline", "middle")
            .style("font-family", "Poppins")
            .style("font-size", 14)
            .style("font-weight", 500);
    });
    return null;
};
