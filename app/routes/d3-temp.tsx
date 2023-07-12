import * as Tabs from "@radix-ui/react-tabs";
import {useRef} from "react";
import BarGraphComponent from "~/components/d3Componenets/barGraphComponent";
import {ComposedChart} from "~/components/d3Componenets/composedChartComponent";
import {GenericCard} from "~/components/scratchpad";
import {Scale} from "~/utilities/utilities";

export default function () {
    const ref = useRef(null);
    const yValues = [
        {
            date: "one",
            value: 1,
        },
        {
            date: "two",
            value: 2,
        },
        {
            date: "three",
            value: 3,
        },
        {
            date: "four",
            value: 4,
        },
    ];

    return (
        <div className="tw-m-7">
            <Tabs.Root
                defaultValue="1"
                className="tw-row-start-3"
            >
                <Tabs.List>
                    <Tabs.Trigger
                        value="1"
                        className="lp-tab tw-rounded-tl-md"
                    >
                        Graph
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value="2"
                        className="lp-tab tw-rounded-tr-md"
                    >
                        Raw Data
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="2">
                    <div className="tw-grid tw-overflow-auto">Sample</div>
                </Tabs.Content>
                <Tabs.Content value="1">
                    <GenericCard
                        className="tw-rounded-tl-none"
                        content={
                            <ComposedChart
                                xValues={["one", "two", "three", "four"]}
                                className={""}
                                title={"Sample graph for testing."}
                                height={400}
                                width={600}
                                ref={ref}
                            >
                                <BarGraphComponent
                                    scale={Scale.dataDriven}
                                    data={{
                                        dates: ["one", "two", "three", "four"],
                                        yMax: 10,
                                        series: {
                                            values: yValues,
                                            name: "Numbers",
                                            color: "White",
                                        },
                                    }}
                                />
                            </ComposedChart>
                        }
                    />
                </Tabs.Content>
            </Tabs.Root>
        </div>
    );
}
