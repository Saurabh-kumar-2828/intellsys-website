import {Link, useLocation, useParams} from "@remix-run/react";
import React, {useState} from "react";
import {List, XLg} from "react-bootstrap-icons";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {Company, User, Uuid} from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function MenuComponent({userDetails, accessibleCompanies, className}: {userDetails: User; accessibleCompanies: Array<Company> | null; className?: string}) {
    const currentUrl = useLocation().pathname;
    const params = useParams();

    const [isMenuExpanded, setIsMenuExpanded] = useState(false);

    const companyId: Uuid = params.companyId;

    function toggleMenu() {
        const isMenuExpandedOld = isMenuExpanded;

        setIsMenuExpanded(!isMenuExpandedOld);

        // const bodyNode = ReactDOM.findDOMNode(document.getElementsByTagName("body")[0]);
        // if (isMenuExpandedOld == false) {
        //     bodyNode.classList.add("menuOpen");
        // } else {
        //     bodyNode.classList.remove("menuOpen");
        // }
    }

    const pages = [
        {
            url: `/${companyId}/`,
            displayName: "Home",
        },
        null,
        {
            url: `/${companyId}/business-insights?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
            displayName: "Business Insights",
        },
        {
            url: `/${companyId}/google-ads-funnel?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
            displayName: "Google Ads Funnel",
        },
        {
            url: `/${companyId}/facebook-ads-funnel?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
            displayName: "Facebook Ads Funnel",
        },
        {
            url: `/${companyId}/sales-report?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
            displayName: "Sales Report",
        },
        {
            url: `/${companyId}/leads-report?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
            displayName: "Leads Report",
        },
        // {
        //     url: `/${companyId}/pnl-view?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
        //     displayName: "P&L View",
        // },
        null,
        {
            url: `/${companyId}/data-sources`,
            displayName: "Data Sources",
        },
        // null,
        // {
        //     url: "/data-management",
        //     displayName: "Data Management",
        // },
        // {
        //     url: "/data-source-information",
        //     displayName: "Data Source Information",
        // },
        // {
        //     url: "/dashboard-health-monitoring",
        //     displayName: "Dashboard Health Monitoring",
        // },
        // {
        //     url: "/table-management",
        //     displayName: "Table Management",
        // },
        null,
        {
            url: "/livguard/contact-us-leads?startDate=2023-06-01",
            displayName: "Contact Us Leads",
        },
        {
            url: "/livguard/search-queries?startDate=2023-06-01",
            displayName: "Search Queries",
        },
        {
            url: "/livguard/server-latencies?startDate=2023-06-01",
            displayName: "Server Latencies",
        },
        {
            url: "/livguard/google-analytics?startDate=2023-06-01",
            displayName: "Google Analytics",
        },
    ];

    // return (
    //     <div className="tw-col-start-3 tw-relative tw-group">
    //         <List className="tw-w-8 tw-h-8" />

    //         <div className="tw-absolute tw-hidden group-hover:tw-block tw-top-8 -tw-right-4 tw-pl-20 tw-pb-20">
    //             <div className="tw-flex tw-flex-col tw-gap-y-4 tw-min-w-16 tw-w-80 tw-bg-lp tw-p-4">
    //                 <ItemBuilder
    //                     items={pages}
    //                     itemBuilder={((item, itemIndex) => (
    //                         <Link to={item.url} className={concatenateNonNullStringsWithSpaces("hover:tw-underline", (item.exactMatch && currentUrl == item.url) || (!item.exactMatch && currentUrl.startsWith(item.url)) ? "tw-font-bold" : null)} key={itemIndex}>
    //                             {item.displayName}
    //                         </Link>
    //                     ))}
    //                 />
    //             </div>
    //         </div>
    //     </div>
    // );

    return (
        <div className={className}>
            <button onClick={toggleMenu}>
                <List className="tw-w-8 tw-h-8" />
            </button>

            <div className={concatenateNonNullStringsWithSpaces("tw-inset-0", isMenuExpanded ? "tw-fixed" : "tw-hidden")}>
                <div className="tw-flex tw-flex-row tw-w-full tw-h-full">
                    <div className="tw-flex-grow tw-backdrop-blur-md tw-backdrop-brightness-75" onClick={toggleMenu} />

                    <div className="tw-flex tw-flex-col tw-p-4 tw-min-w-[66%] xl:tw-min-w-[20rem] tw-bg-dark-bg-500 tw-overflow-y-auto">
                        <div className="tw-flex tw-flex-row tw-justify-end tw-items-center tw-h-10">
                            <button onClick={toggleMenu}>
                                <XLg className="tw-w-8 tw-h-8" />
                            </button>
                        </div>

                        <VerticalSpacer />

                        <ItemBuilder
                            items={pages}
                            itemBuilder={(item, itemIndex) => {
                                if (item == null) {
                                    return (
                                        <React.Fragment key={itemIndex}>
                                            <VerticalSpacer className="tw-h-4" />

                                            <Divider />

                                            <VerticalSpacer className="tw-h-4" />
                                        </React.Fragment>
                                    );
                                }
                                return (
                                    <MenuClosingLink
                                        to={item.url}
                                        className={concatenateNonNullStringsWithSpaces(
                                            "tw-py-2 hover:tw-underline",
                                            currentUrl == item.url || currentUrl.startsWith(`${item.url}?`) ? "tw-font-bold" : null,
                                            !item.url.includes("/livguard") || currentUrl.includes("/livguard") || currentUrl.includes("/84589528-ef5e-46b2-90bd-96b6e2d206ce") ? null : "tw-hidden",
                                        )}
                                        toggleMenu={toggleMenu}
                                        key={itemIndex}
                                    >
                                        {item.displayName}
                                    </MenuClosingLink>
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MenuClosingLink(props: {to: string; children: string; className?: string; toggleMenu: React.MouseEventHandler}) {
    return (
        <Link to={props.to} className={props.className} onClick={props.toggleMenu}>
            {props.children}
        </Link>
    );
}

function Divider() {
    return <div className="tw-h-0.5 tw-w-full tw-bg-white tw-opacity-[15%]" />;
}
