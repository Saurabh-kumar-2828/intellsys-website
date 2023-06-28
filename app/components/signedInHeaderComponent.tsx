import {Popover} from "@headlessui/react";
import {Link, useLocation, useParams} from "@remix-run/react";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {IntellsysHeaderDropdownTrigger} from "~/components/scratchpad";
import type {Company, User} from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";
import {List, XLg} from "react-bootstrap-icons";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import React, {useState} from "react";

export function SignedInHeaderComponent({
    userDetails,
    accessibleCompanies,
    currentCompany,
    className,
}: {
    userDetails: User;
    accessibleCompanies: Array<Company>;
    currentCompany: Company;
    className?: string;
}) {
    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-sticky tw-top-0 tw-h-16 tw-bg-dark-bg-400", className)}>
            <div className="tw-grid tw-grid-cols-[auto_1fr_auto] tw-items-center tw-p-4">
                <Link
                    to="/"
                    className="tw-col-start-1"
                >
                    <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-2">
                        <img
                            src="https://imagedelivery.net/QSJTsX8HH4EtEhHrJthznA/415c8f79-9b37-4af5-2bfd-d68b18264200/h=32"
                            className="tw-h-8"
                        />
                    </div>
                </Link>

                <div className="tw-col-start-3 tw-flex tw-flex-row tw-gap-x-4">
                    <Popover
                        as="div"
                        className="tw-relative"
                    >
                        {({open: isOpen, close}) => (
                            <>
                                <Popover.Button>
                                    <IntellsysHeaderDropdownTrigger
                                        isOpen={isOpen}
                                        content={
                                            <div className="tw-grid tw-grid-cols-[auto_auto] tw-items-center tw-gap-x-2">
                                                <img
                                                    className="tw-w-4 tw-h-4 tw-rounded-full"
                                                    src={`https://intellsys-optimizer.b-cdn.net/intellsys/companies/${currentCompany.id}.png`}
                                                />

                                                <div>{currentCompany.name}</div>
                                            </div>
                                        }
                                    />
                                </Popover.Button>

                                <Popover.Panel className="tw-absolute tw-right-0 tw-top-8 tw-w-full tw-min-w-max">
                                    <div className="tw-w-full tw-h-fit tw-max-h-[20rem] tw-bg-dark-bg-500 tw-shadow-lg tw-rounded-lg tw-overflow-auto tw-pointer-events-auto tw-grid tw-grid-cols-1 tw-grid-flow-row">
                                        <ItemBuilder
                                            items={accessibleCompanies}
                                            itemBuilder={(accessibleCompany, accessibleCompanyIndex) => (
                                                <Link
                                                    to={`/${accessibleCompany.id}`}
                                                    className="tw-p-3 tw-flex tw-flex-row tw-items-center tw-gap-x-2"
                                                    onClick={close}
                                                    key={accessibleCompanyIndex}
                                                >
                                                    <img
                                                        className="tw-w-4 tw-h-4 tw-rounded-full"
                                                        src={`https://intellsys-optimizer.b-cdn.net/intellsys/companies/${accessibleCompany.id}.png`}
                                                    />
                                                    {accessibleCompany.name}
                                                </Link>
                                            )}
                                            spaceBuilder={(spaceIndex) => (
                                                <div
                                                    className="tw-w-full tw-h-px tw-bg-fg"
                                                    key={spaceIndex}
                                                />
                                            )}
                                        />
                                    </div>
                                </Popover.Panel>
                            </>
                        )}
                    </Popover>

                    <Popover
                        as="div"
                        className="tw-relative"
                    >
                        {({open: isOpen, close}) => (
                            <>
                                <Popover.Button>
                                    <img
                                        className="tw-w-8 tw-h-8 tw-rounded-full"
                                        src={`https://intellsys-optimizer.b-cdn.net/intellsys/users/${userDetails.id}.jpg`}
                                    />
                                </Popover.Button>

                                <Popover.Panel className="tw-absolute tw-right-0 tw-top-8 tw-w-full tw-min-w-max">
                                    <div className="tw-w-full tw-h-fit tw-max-h-[20rem] tw-bg-dark-bg-500 tw-shadow-lg tw-rounded-lg tw-overflow-auto tw-pointer-events-auto tw-grid tw-grid-cols-1 tw-grid-flow-row">
                                        <div className="tw-p-3">
                                            Current logged in as: <b>{userDetails.name}</b>
                                        </div>

                                        <div className="tw-w-full tw-h-px tw-bg-fg" />

                                        <Link
                                            to="/sign-out"
                                            className="tw-p-3 hover:tw-underline"
                                            onClick={close}
                                        >
                                            Sign Out
                                        </Link>
                                    </div>
                                </Popover.Panel>
                            </>
                        )}
                    </Popover>

                    <MenuComponent
                        className="tw-h-8"
                        userDetails={userDetails}
                        accessibleCompanies={accessibleCompanies}
                        currentCompany={currentCompany}
                    />
                </div>
            </div>
        </div>
    );
}

export function MenuComponent({
    userDetails,
    accessibleCompanies,
    currentCompany,
    className,
}: {
    userDetails: User;
    accessibleCompanies: Array<Company>;
    currentCompany: Company;
    className?: string;
}) {
    const currentUrl = useLocation().pathname;

    const [isMenuExpanded, setIsMenuExpanded] = useState(false);

    const companyId = currentCompany.id;

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
        // null,
        {
            url: `/${companyId}/business-insights?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
            displayName: "Business Insights",
        },
        {
            url: `/${companyId}/google-ads-funnel?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
            displayName: "Google Ads Funnel",
        },
        // {
        //     url: `/${companyId}/facebook-ads-funnel?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
        //     displayName: "Facebook Ads Funnel",
        // },
        // {
        //     url: `/${companyId}/sales-report?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
        //     displayName: "Sales Report",
        // },
        // {
        //     url: `/${companyId}/leads-report?selected_granularity=Daily&min_date=2023-03-01&max_date=2023-03-31`,
        //     displayName: "Leads Report",
        // },
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
        // null,
        // {
        //     url: "/settings",
        //     displayName: "Settings",
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
                    <div
                        className="tw-flex-grow tw-backdrop-blur-md tw-backdrop-brightness-75"
                        onClick={toggleMenu}
                    />

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
        <Link
            to={props.to}
            className={props.className}
            onClick={props.toggleMenu}
        >
            {props.children}
        </Link>
    );
}

function Divider() {
    return <div className="tw-h-0.5 tw-w-full tw-bg-white tw-opacity-[15%]" />;
}
