import {Link, useLocation} from "@remix-run/react";

import {ResponsiveImage} from "~/components/reusableComponents/responsiveImage";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";
import { ItemBuilder } from "./reusableComponents/itemBuilder";

export function HeaderComponent(props: {className?: string}) {
    const currentUrl = useLocation().pathname;

    const pages = currentUrl == "/sign-in" ? [] : [
        {
            url: "/",
            displayName: "Home",
            exactMatch: true,
        },
        {
            url: "#",
            displayName: "|",
            exactMatch: true,
        },
        {
            url: "/business-insights",
            displayName: "Business Insights",
            exactMatch: false,
        },
        {
            url: "/facebook-campaigns",
            displayName: "Facebook Campaigns",
            exactMatch: false,
        },
        // {
        //     url: "/google-campaigns",
        //     displayName: "Google Campaigns",
        //     exactMatch: false,
        // },
        {
            url: "#",
            displayName: "|",
            exactMatch: true,
        },
        {
            url: "/data-management",
            displayName: "Data Managemnet",
            exactMatch: false,
        },
        {
            url: "/data-source-information",
            displayName: "Data Source Information",
            exactMatch: false,
        },
        {
            url: "/dashboard-health-monitoring",
            displayName: "Dashboard Health Monitoring",
            exactMatch: false,
        },
    ];

    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-sticky tw-top-0 tw-h-16 tw-bg-lp tw-shadow-[0px_10px_15px_-3px] tw-shadow-zinc-900", props.className)}>
            <div className="tw-grid tw-grid-cols-[auto_1fr_auto] tw-items-center tw-p-4">
                <Link to="/" className="tw-col-start-1">
                    <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-2">
                        <img src="/favicon.ico" className="tw-h-8" />
                        <div className="tw-font-bold tw-text-[1.5em] tw-leading-none tw-pb-1">Livpure Data Management</div>
                    </div>
                </Link>

                <div className="tw-col-start-3 tw-flex tw-flex-row tw-gap-x-4">
                    <ItemBuilder
                        items={pages}
                        itemBuilder={((item, itemIndex) => (
                            <Link to={item.url} className={concatenateNonNullStringsWithSpaces("hover:tw-underline", (item.exactMatch && currentUrl == item.url) || (!item.exactMatch && currentUrl.startsWith(item.url)) ? "tw-font-bold" : null)} key={itemIndex}>
                                {item.displayName}
                            </Link>
                        ))}
                    />
                </div>

                {/* <MenuComponent userDetails={props.userDetails} /> */}
            </div>
        </div>
    );
}
