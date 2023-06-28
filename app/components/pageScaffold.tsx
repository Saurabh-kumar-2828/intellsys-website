import {useTransition} from "@remix-run/react";
import {ToastContainer} from "react-toastify";
import {LoaderComponent} from "~/components/loaderComponent";
import {SignedInHeaderComponent} from "~/components/signedInHeaderComponent";
import type {Company, User} from "~/utilities/typeDefinitions";

export function PageScaffold({
    userDetails,
    accessibleCompanies,
    currentCompany,
    children,
}: {
    userDetails: User;
    accessibleCompanies: Array<Company>;
    currentCompany: Company;
    children;
}) {
    const transition = useTransition();

    return (
        <div className="tw-grid tw-grid-rows-[auto_1fr] tw-min-h-screen">
            {transition.state == "idle" ? null : <LoaderComponent />}
            {userDetails == null || accessibleCompanies == null || currentCompany == null ? <div /> : (
                <SignedInHeaderComponent
                    userDetails={userDetails}
                    accessibleCompanies={accessibleCompanies}
                    currentCompany={currentCompany}
                    className="tw-row-start-1 tw-z-50"
                />
            )}

            <div className="tw-row-start-2">
                {children}
            </div>

            <ToastContainer
                position="top-right"
                autoClose={false}
                theme="dark"
            />
        </div>
    );
}
