import {Link, useLocation} from "@remix-run/react";
import {List} from "react-bootstrap-icons";

import {MenuComponent} from "~/components/menuComponent";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {User} from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function HeaderComponent(props: {userDetails: User | null, className?: string}) {
    const currentUrl = useLocation().pathname;

    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-sticky tw-top-0 tw-h-16 tw-bg-dark-bg-400", props.className)}>
            <div className="tw-grid tw-grid-cols-[auto_1fr_auto] tw-items-center tw-p-4">
                <Link to="/" className="tw-col-start-1">
                    <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-2">
                        <img src="https://imagedelivery.net/QSJTsX8HH4EtEhHrJthznA/415c8f79-9b37-4af5-2bfd-d68b18264200/h=32" className="tw-h-8" />
                    </div>
                </Link>

                {currentUrl.startsWith("/sign-in") ? null : <MenuComponent className="tw-col-start-3 tw-h-8" userDetails={props.userDetails} />}
            </div>
        </div>
    );
}
