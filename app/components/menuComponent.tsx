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
            url: `/${companyId}/business-insights`,
            displayName: "Business Insights",
        },
        {
            url: `/${companyId}/google-ads-funnel`,
            displayName: "Google Ads Funnel",
        },
        {
            url: `/${companyId}/facebook-ads-funnel`,
            displayName: "Facebook Ads Funnel",
        },
        {
            url: `/${companyId}/sales-report`,
            displayName: "Sales Report",
        },
        {
            url: `/${companyId}/leads-report`,
            displayName: "Leads Report",
        },
        {
            url: `/${companyId}/pnl-view`,
            displayName: "P&L View",
        },
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
                                            currentUrl == item.url || currentUrl.startsWith(`${item.url}?`) ? "tw-font-bold" : null
                                        )}
                                        toggleMenu={toggleMenu}
                                        key={itemIndex}
                                    >
                                        {item.displayName}
                                    </MenuClosingLink>
                                );
                            }}
                        />

                        <VerticalSpacer className="tw-h-6" />

                        <Divider />

                        <div className="tw-flex-grow" />

                        <Divider />

                        <VerticalSpacer className="tw-h-6" />

                        <MenuClosingLink to="/sign-out" className="hover:tw-underline" toggleMenu={toggleMenu}>
                            Sign Out
                        </MenuClosingLink>

                        <VerticalSpacer className="tw-h-2" />
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
