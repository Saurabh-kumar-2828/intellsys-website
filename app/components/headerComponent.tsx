import {Popover} from "@headlessui/react";
import {Link} from "@remix-run/react";
import {MenuComponent} from "~/components/menuComponent";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {IntellsysHeaderDropdownTrigger} from "~/components/scratchpad";
import type {Company, User} from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function HeaderComponent({
    userDetails,
    accessibleCompanies,
    currentCompany,
    className
}: {
    userDetails: User | null;
    accessibleCompanies: Array<Company> | null;
    currentCompany: Company | null;
    className?: string
}) {
    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-sticky tw-top-0 tw-h-16 tw-bg-dark-bg-400", className)}>
            <div className="tw-grid tw-grid-cols-[auto_1fr_auto] tw-items-center tw-p-4">
                <Link to="/" className="tw-col-start-1">
                    <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-2">
                        <img src="https://imagedelivery.net/QSJTsX8HH4EtEhHrJthznA/415c8f79-9b37-4af5-2bfd-d68b18264200/h=32" className="tw-h-8" />
                    </div>
                </Link>

                {userDetails == null || accessibleCompanies == null ? null : (
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
                                                currentCompany == null ? (
                                                    <div>
                                                        Select Company
                                                    </div>
                                                ) : (
                                                    <div className="tw-grid tw-grid-cols-[auto_auto] tw-items-center tw-gap-x-2">
                                                        <img className="tw-w-4 tw-h-4 tw-rounded-full" src={`https://intellsys-optimizer.b-cdn.net/intellsys/companies/${currentCompany.id}.png`} />

                                                        <div>
                                                            {currentCompany.name}
                                                        </div>
                                                    </div>
                                                )
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
                                                        <img className="tw-w-4 tw-h-4 tw-rounded-full" src={`https://intellsys-optimizer.b-cdn.net/intellsys/companies/${accessibleCompany.id}.png`} />
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
                                        <img className="tw-w-8 tw-h-8 tw-rounded-full" src={`https://intellsys-optimizer.b-cdn.net/intellsys/users/${userDetails.id}.jpg`} />
                                    </Popover.Button>

                                    <Popover.Panel className="tw-absolute tw-right-0 tw-top-8 tw-w-full tw-min-w-max">
                                        <div className="tw-w-full tw-h-fit tw-max-h-[20rem] tw-bg-dark-bg-500 tw-shadow-lg tw-rounded-lg tw-overflow-auto tw-pointer-events-auto tw-grid tw-grid-cols-1 tw-grid-flow-row">
                                            <div className="tw-p-3">
                                                Current logged in as: <b>{userDetails.name}</b>
                                            </div>

                                            <div
                                                className="tw-w-full tw-h-px tw-bg-fg"
                                            />

                                            <Link to="/sign-out" className="tw-p-3 hover:tw-underline" onClick={close}>
                                                Sign Out
                                            </Link>
                                        </div>
                                    </Popover.Panel>
                                </>
                            )}
                        </Popover>

                        <MenuComponent className="tw-h-8" userDetails={userDetails} accessibleCompanies={accessibleCompanies} currentCompany={currentCompany} />
                    </div>
                )}
            </div>
        </div>
    );
}
