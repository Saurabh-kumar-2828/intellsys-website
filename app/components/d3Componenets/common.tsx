export type PointObject = {
    xValue: string; value: number
}

export type DataObject = {
    xValues: Array<string>;
    yMax: number;
    series: {values: Array<PointObject>; name: string; color: string};
};