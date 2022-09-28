import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function HeadingAndSubHeading(props) {
    const heading = props.heading;
    const subHeading = props.subHeading;
    const reverseOrder = props.reverseOrder;
    const className = props.className;
    const headingClassName = props.headingClassName;
    const subHeadingClassName = props.subHeadingClassName;

    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-flex", reverseOrder ? "tw-flex-col-reverse" : "tw-flex-col", className)}>
            {heading == null ? null : (
                <div className={concatenateNonNullStringsWithSpaces("tw-text-2rem tw-font-bold", headingClassName)}>
                    {heading}
                </div>
            )}

            {heading == null || subHeading == null ? null : (
                <VerticalSpacer className="tw-h-3" />
            )}

            {subHeading == null ? null : (
                <div className={concatenateNonNullStringsWithSpaces("tw-text-2rem tw-font-light tw-text-textMuted", subHeadingClassName)}>
                    {subHeading}
                </div>
            )}
        </div>
    );
}
