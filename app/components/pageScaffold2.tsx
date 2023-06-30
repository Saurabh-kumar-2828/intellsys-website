import {Link, useTransition} from "@remix-run/react";
import {ToastContainer} from "react-toastify";
import {LoaderComponent} from "~/components/loaderComponent";

export function PageScaffold2({children}: {children}) {
    const transition = useTransition();

    return (
        <div className="tw-grid tw-grid-rows-[auto_1fr] tw-min-h-screen">
            {transition.state == "idle" ? null : <LoaderComponent />}
            {/* {user == null || accessibleCompanies == null || currentCompany == null ? (
                <div />
            ) : (
                <SignedInHeaderComponent
                    user={user}
                    accessibleCompanies={accessibleCompanies}
                    currentCompany={currentCompany}
                    className="tw-row-start-1 tw-z-50"
                />
            )} */}

            <div className="tw-row-start-1 tw-w-full tw-h-16 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-sticky tw-top-0 tw-bg-dark-bg-400">
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
            </div>

            <div className="tw-row-start-2">{children}</div>

            <ToastContainer
                position="top-right"
                autoClose={false}
                theme="dark"
            />
        </div>
    );
}
