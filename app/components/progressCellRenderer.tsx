import {ICellRendererParams} from "ag-grid-community";

export function progressCellRenderer(props: ICellRendererParams) {
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

export function progressCellRendererTarget(props: ICellRendererParams) {
    const target = props.target[props.data.campaignName][props.colDef.field];
    const progress = (props.value / target)*100;
    const remaining = (Math.abs(props.value - target) / target)*100;

    return (
        <div className={`tw-grid`}>
            <div
                className="tw-row-start-1 tw-col-start-1 tw-px-1 tw-py-1"
                style={{
                    width: `${progress}%`,
                    backgroundColor: props.color,
                    // opacity: 0.1,
                }}
            />
            <div
                className="tw-row-start-1 tw-col-start-1 tw-px-1 tw-py-1"
                style={{
                    width: `${100}%`,
                    backgroundColor: props.color,
                    opacity: 0.4,
                }}
            />
           <div className="tw-row-start-1 tw-col-start-1 tw-px-1">{props.value}</div>
        </div>
    );
}
