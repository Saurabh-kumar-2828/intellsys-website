import {useTransition} from "@remix-run/react";
import {ToastContainer} from "react-toastify";
import {LoaderComponent} from "~/components/loaderComponent";

export function PageScaffold2({
    children,
}: {
    children;
}) {
    const transition = useTransition();

    return (
        <div className="tw-grid tw-grid-rows-[auto_1fr] tw-min-h-screen">
            {transition.state == "idle" ? null : <LoaderComponent />}
            {/* {user == null || accessibleCompanies == null || currentCompany == null ? <div /> : (
                <SignedInHeaderComponent
                    user={user}
                    accessibleCompanies={accessibleCompanies}
                    currentCompany={currentCompany}
                    className="tw-row-start-1 tw-z-50"
                />
            )} */}

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
