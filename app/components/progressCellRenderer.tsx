import {ICellRendererParams} from "ag-grid-community";

export default function progressCellRenderer(props: ICellRendererParams) {
    const target = props.target[props.data.date][props.colDef.field];
    const progress = Math.min(Math.max(props.value / (2 * target), 0), 100);

    return (
        <div className="tw-grid">
            <div
                className="tw-row-start-1 tw-col-start-1"
                style={{
                    width: `${progress * 100}%`,
                    backgroundColor: props.color,
                }}
            />
            <div className="tw-row-start-1 tw-col-start-1 tw-justify-self-center tw-w-px tw-bg-dark-fg-400" />
            <div className="tw-row-start-1 tw-col-start-1">{props.value}</div>
        </div>
    );
}
