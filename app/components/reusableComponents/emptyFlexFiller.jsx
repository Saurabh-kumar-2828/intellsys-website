import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function EmptyFlexFiller(props) {
    const className = props.className;

    return <div className={concatenateNonNullStringsWithSpaces("tw-flex-1", className)} />
};
