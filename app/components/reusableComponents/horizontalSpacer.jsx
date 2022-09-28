export function HorizontalSpacer(props) {
    let className = props.className;

    if (props.screenEdgePadding) {
        className = "tw-w-40";
    } else if (className == null) {
        className = "tw-w-8";
    }

    return <div className={`${className} tw-flex-none tw-self-stretch`}></div>;
};
