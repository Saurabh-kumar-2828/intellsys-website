import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function ArrowRightSvgIconComponent(props) {
    const className = props.className;

    return (
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" fill="currentColor" className={concatenateNonNullStringsWithSpaces("tw-rotate-180", className)}>
            <path d="M20 .755l-14.374 11.245 14.374 11.219-.619.781-15.381-12 15.391-12 .609.755z"/>
        </svg>
    );
}
