// import * as Tabs from "@radix-ui/react-tabs";
// import BarGraphComponent from "~/components/d3Componenets/barGraphComponent";
// import LineGraphComponent from "~/components/d3Componenets/lineGraphComponent";
// import {ComposedChart} from "~/components/d3Componenets/composedChart";
// import {GenericCard} from "~/components/scratchpad";
// import {Scale} from "~/utilities/utilities";

// export default function () {
//     const yValues = [
//         {
//             xValue: "one",
//             value: 1,
//         },
//         {
//             xValue: "two",
//             value: 2,
//         },
//         {
//             xValue: "three",
//             value: 3,
//         },
//         {
//             xValue: "four",
//             value: 4,
//         },
//     ];

//     return (
//         <div className="tw-m-7">
//             <Tabs.Root
//                 defaultValue="1"
//                 className="tw-row-start-3"
//             >
//                 <Tabs.List>
//                     <Tabs.Trigger
//                         value="1"
//                         className="lp-tab tw-rounded-tl-md"
//                     >
//                         Graph
//                     </Tabs.Trigger>
//                     <Tabs.Trigger
//                         value="2"
//                         className="lp-tab tw-rounded-tr-md"
//                     >
//                         Raw Data
//                     </Tabs.Trigger>
//                 </Tabs.List>
//                 <Tabs.Content value="2">
//                     <div className="tw-grid tw-overflow-auto">Sample</div>
//                 </Tabs.Content>
//                 <Tabs.Content value="1">
//                     {/* <GenericCard
//                         className="tw-rounded-tl-none"
//                         content={
//                             <ComposedChart
//                                 xValues={["one", "two", "three", "four"]}
//                                 className={""}
//                                 title={"Sample graph for testing."}
//                                 height={400}
//                                 width={600}
//                                 ref={ref}
//                             >
//                                 <BarGraphComponent
//                                     scale={Scale.dataDriven}
//                                     data={{
//                                         xValues: ["one", "two", "three", "four"],
//                                         yMax: 10,
//                                         series: {
//                                             values: yValues,
//                                             name: "Numbers",
//                                             color: "White",
//                                         },
//                                     }}
//                                 />
//                             </ComposedChart>
//                         }
//                     /> */}
//                     <GenericCard
//                         className="tw-rounded-tl-none"
//                         content={
//                             <ComposedChart
//                                 data={[1, 2, 3, 4]}
//                                 height={600}
//                                 xValues={["one", "two", "three", "four"]}
//                                 className={""}
//                             >
//                                 <LineGraphComponent
//                                     key="LineGraph"
//                                     scale={Scale.dataDriven}
//                                     data={{
//                                         xValues: ["one", "two", "three", "four"],
//                                         yMax: 10,
//                                         series: {
//                                             values: yValues,
//                                             name: "Numbers",
//                                             color: "White",
//                                         },
//                                     }}
//                                 />
//                                 <BarGraphComponent
//                                     key="BarGraph"
//                                     scale={Scale.dataDriven}
//                                     data={{
//                                         xValues: ["one", "two", "three", "four"],
//                                         yMax: 10,
//                                         series: {
//                                             values: yValues,
//                                             name: "Numbers",
//                                             color: "White",
//                                         },
//                                     }}
//                                 />
//                             </ComposedChart>
//                         }
//                     />
//                 </Tabs.Content>
//             </Tabs.Root>
//         </div>
//     );
// }
