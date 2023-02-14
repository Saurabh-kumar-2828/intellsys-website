import {axisBottom, axisLeft, axisRight} from "d3-axis";
import {ScaleBand, scaleBand, ScaleLinear, scaleLinear, scaleOrdinal} from "d3-scale";
import {create, select} from "d3-selection";
import {line} from "d3-shape";
import React from "react";
import {plotMargins, scale, YAxisDisplay} from "~/backend/utilities/utilities.server";
import {legend} from "../d3Componenets/legend";

type lineDataObject = {
    dates: Array<string>;
    yMax: number;
    title: string;
    series: Array<{values: Array<{date: string; value: number}>; name: string; color: string}>;
};

interface props {
    data: lineDataObject;
    container?: string | null;
    className?: string | null;
    xScale?: ScaleBand<string>;
    scale?: string;
    showYAxis?: string;
    width: number;
    height: number;
}

// export class GroupedBarGraphComponent extends React.Component {
    // renderGraph = () => {
    //     const innerWidth = 960 - plotMargins.left - plotMargins.right;
    //     const innerHeight = 500 - plotMargins.top - plotMargins.bottom;

    //     var xScale = scaleBand() // v4
    //         .domain([10, 20, 30, 40, 50])
    //         .rangeRound([0, 1]);
    //         // .padding([0.1]);

    //     console.log(xScale(10));
    //     console.log(xScale(20));
    //     console.log(xScale(30));
    //     console.log(xScale(40));
    //     console.log(xScale(50));
    // };

    // static displayName: string = "groupedBarGraphComponent";

    // componentDidMount() {
    //     this.renderGraph();
    // }

    // componentDidUpdate() {
    //     this.renderGraph();
    // }

    // render() {
    //     if (this.props.data == null) {
    //         return null;
    //     }

    //     return null;
    // }
// }


export function GroupedBarChart(data: any , {
    x = (d, i) => i, // given d in data, returns the (ordinal) x-value
    y = d => d, // given d in data, returns the (quantitative) y-value
    z = () => 1, // given d in data, returns the (categorical) z-value
    title, // given d in data, returns the title text
    marginTop =  30, // top margin, in pixels
    marginRight = 0, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    xDomain, // array of x-values
    xRange = [marginLeft, width - marginRight], // [xmin, xmax]
    xPadding = 0.1, // amount of x-range to reserve to separate groups
    yType = scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [ymin, ymax]
    zDomain, // array of z-values
    zPadding = 0.05, // amount of x-range to reserve to separate bars
    yFormat, // a format specifier string for the y-axis
    yLabel, // a label for the y-axis
    colors = ["red", "green", "blue"], // array of colors
    ref,
  } = { }) {
    // Compute values.
    const X = data.map(x => x.state);
    const Y = data.map(x => x.population);
    const Z = data.map(x => x.age);

    // Compute default domains, and unique the x- and z-domains.
    if (xDomain === undefined) xDomain = X;
    if (yDomain === undefined) yDomain = [0, Math.max(Y)];
    if (zDomain === undefined) zDomain = Z;
    // xDomain = new InternSet(xDomain);
    // zDomain = new InternSet(zDomain);

    // Construct scales, axes, and formats.
    const xScale = scaleBand(xDomain, xRange).paddingInner(xPadding);
    const xzScale = scaleBand(zDomain, [0, xScale.bandwidth()]).padding(zPadding);
    const yScale = yType(yDomain, yRange);
    const zScale = scaleOrdinal(zDomain, colors);
    const xAxis = axisBottom(xScale).tickSizeOuter(0);
    const yAxis = axisLeft(yScale).ticks(height / 60, yFormat);

    // // Compute titles.
    // if (title === undefined) {
    //   const formatValue = yScale.tickFormat(100, yFormat);
    //   title = i => `${X[i]}\n${Z[i]}\n${formatValue(Y[i])}`;
    // } else {
    //   const O = map(data, d => d);
    //   const T = title;
    //   title = i => T(O[i], i, data);
    // }

    const svg = ref.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));

    svg.append("g")
      .selectAll("rect")
      .data(I)
      .join("rect")
        .attr("x", i => {
            return xScale(X[i]) + xzScale(Z[i]);
        })
        .attr("y", i => yScale(Y[i]))
        .attr("width", xzScale.bandwidth())
        .attr("height", i => yScale(0) - yScale(Y[i]))
        .attr("fill", i => zScale(Z[i]));

    // if (title) bar.append("title")
    //     .text(title);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis);

    return Object.assign(svg.node(), {scales: {color: zScale}});
  }


export const data = [
    {state: "AL", age: "<10", population: 598478},
    {state: "AK", age: "<10", population: 106741},
    {state: "AZ", age: "<10", population: 892083},
    {state: "AR", age: "<10", population: 392177},
    {state: "AL", age: "10-19", population: 638789},
    {state: "AK", age: "10-19", population: 99926},
    {state: "AZ", age: "10-19", population: 912735},
    {state: "AR", age: "10-19", population: 397185},
    {state: "AL", age: "20-29", population: 661666},
    {state: "AK", age: "20-29", population: 120674},
    {state: "AZ", age: "20-29", population: 939804},
    {state: "AR", age: "20-29", population: 399698}
]

