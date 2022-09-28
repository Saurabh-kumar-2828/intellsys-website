import React, {useState} from "react";
import ReactDOM from "react-dom";
import {Link} from "@remix-run/react";

import {HamburgerMenuSvgIconComponent} from "~/components/reusableComponents/svgIconComponents/hamburgerMenuSvgIconComponent";
import {CloseSvgIconComponent} from "~/components/reusableComponents/svgIconComponents/closeSvgIconComponent";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {AccountSvgIconComponent} from "~/components/reusableComponents/svgIconComponents/accountSvgIconComponent";
import {UserDetails} from "~/utilities/typeDefinitions";

export function MenuComponent(props: {userDetails: UserDetails | null}) {
    const userDetails = props.userDetails;

    const [isMenuExpanded, setIsMenuExpanded] = useState(false);

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

    return (
        <div>
            <button onClick={toggleMenu}>
                <HamburgerMenuSvgIconComponent className="tw-h-8" />
            </button>

            <div className={concatenateNonNullStringsWithSpaces("tw-inset-0", isMenuExpanded ? "tw-fixed" : "tw-hidden")}>
                <div className="tw-flex tw-flex-row tw-w-full tw-h-full">
                    <div className="tw-flex-grow tw-bg-black tw-opacity-50" onClick={toggleMenu} />

                    <div className="tw-flex tw-flex-col tw-p-4 tw-min-w-[66%] xl:tw-min-w-[20rem] tw-bg-black tw-overflow-y-auto">
                        <div className="tw-flex tw-flex-row tw-justify-end tw-items-center tw-h-10">
                            <button onClick={toggleMenu}>
                                <CloseSvgIconComponent className="tw-h-8" />
                            </button>
                        </div>

                        <VerticalSpacer />

                        {userDetails == null ? <GuestSubMenu toggleMenu={toggleMenu} /> : <LoggedInUserSubMenu userDetails={userDetails} toggleMenu={toggleMenu} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function GuestSubMenu(props: {toggleMenu: React.MouseEventHandler}) {
    const toggleMenu = props.toggleMenu;

    return (
        <>
            <div className="tw-text-center">
                <div>To Access Account</div>
                <div>And Manage Bookings</div>

                <VerticalSpacer className="tw-h-4" />

                <MenuClosingLink to="/sign-in" className="tw-lectrix-rounded-button-dark" toggleMenu={toggleMenu}>
                    Log In
                </MenuClosingLink>
            </div>

            <VerticalSpacer />

            <div className="tw-h-0.5 tw-w-full tw-bg-white tw-opacity-[15%]" />

            <VerticalSpacer />

            <StandardNavigationSubMenu toggleMenu={toggleMenu} />

            <VerticalSpacer />
        </>
    );
}

function LoggedInUserSubMenu(props: {userDetails: UserDetails, toggleMenu: React.MouseEventHandler}) {
    const toggleMenu = props.toggleMenu;

    return (
        <>
            <div className="tw-text-center">
                <div>Welcome back, {props.userDetails.name ?? props.userDetails.phoneNumber?.substring(3)}!</div>
            </div>

            <VerticalSpacer />

            <div className="tw-h-0.5 tw-w-full tw-bg-white tw-opacity-[15%]" />

            <StandardNavigationSubMenu toggleMenu={toggleMenu} />

            <div className="tw-h-0.5 tw-w-full tw-bg-white tw-opacity-[15%]" />

            <VerticalSpacer />

            <Link to="/account">Account</Link>

            <VerticalSpacer className="tw-h-4" />

            <Link to="/account/profile">Profile</Link>

            <VerticalSpacer className="tw-h-4" />

            <div>Address</div>

            <VerticalSpacer className="tw-h-4" />

            <div>Payments</div>

            <VerticalSpacer className="tw-h-4" />

            <div>Subscriptions</div>

            <VerticalSpacer />

            <div className="tw-h-0.5 tw-w-full tw-bg-white tw-opacity-[15%]" />

            <div className="tw-flex-grow" />

            <div className="tw-h-0.5 tw-w-full tw-bg-white tw-opacity-[15%]" />

            <VerticalSpacer />

            <MenuClosingLink to="/clear-session" toggleMenu={toggleMenu}>Sign Out</MenuClosingLink>
        </>
    );
}

function StandardNavigationSubMenu(props: {toggleMenu: React.MouseEventHandler}) {
    const toggleMenu = props.toggleMenu;

    return (
        <>
            <VerticalSpacer />

            <MenuClosingLink to="/" toggleMenu={toggleMenu}>Home</MenuClosingLink>

            <VerticalSpacer className="tw-h-4" />

            <MenuClosingLink to="/about-us" toggleMenu={toggleMenu}>About Us</MenuClosingLink>

            <VerticalSpacer className="tw-h-4" />

            <MenuClosingLink to="/contact-us" toggleMenu={toggleMenu}>Contact Us</MenuClosingLink>

            <VerticalSpacer />
        </>
    );
}

function MenuClosingLink(props: {to: string, children: string, className?: string, toggleMenu: React.MouseEventHandler}) {
    return <Link to={props.to} className={props.className} onClick={props.toggleMenu}>
        {props.children}
    </Link>
}
