export function VerticalSpacer(props) {
    let className = props.className;

    if (props.sectionSeparatorPadding) {
        className = "tw-h-32";
    } else if (className == null) {
        className = "tw-h-8";
    }

    return <div className={`${className} tw-flex-none tw-self-stretch`}></div>;
};
