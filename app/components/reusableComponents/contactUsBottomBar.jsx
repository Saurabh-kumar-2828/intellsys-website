import {Link} from "@remix-run/react";

import {Spacer} from "~/components/reusableComponents/spacer";

export function ContactUsBottomBar(props) {
    return (
        <div className="tw-flex tw-flex-col xl:tw-flex-row tw-items-center tw-rounded-2xl tw-bg-[#272727] tw-mx-4 xl:tw-mx-40 tw-py-8 tw-px-8 tw-self-stretch">
            {/* TODO: This looks weird when wrapped on mobile due to line-height = 1. Figure out a way of handling leading everywhere. */}
            <div className="tw-flex-1 tw-text-center xl:tw-text-start tw-text-1rem xl:tw-text-1.5rem">
                Couldn't find what you were looking for?
            </div>

            <Spacer className="tw-h-4 xl:tw-w-8" />

            <Link to="/contact-us" className="tw-lectrix-rounded-button">
                Contact Us
            </Link>
        </div>
    );
};
