import {Link, useNavigate} from "@remix-run/react";
import {MenuComponent} from "~/components/menuComponent";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import type {Company, User} from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function HeaderComponent({userDetails, accessibleCompanies, className}: {userDetails: User | null; accessibleCompanies: Array<Company> | null; className?: string}) {
    const navigate = useNavigate();

    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-sticky tw-top-0 tw-h-16 tw-bg-dark-bg-400", className)}>
            <div className="tw-grid tw-grid-cols-[auto_1fr_auto] tw-items-center tw-p-4">
                <Link to="/" className="tw-col-start-1">
                    <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-2">
                        <img src="https://imagedelivery.net/QSJTsX8HH4EtEhHrJthznA/415c8f79-9b37-4af5-2bfd-d68b18264200/h=32" className="tw-h-8" />
                    </div>
                </Link>

                {userDetails == null ? null : (
                    <div className="tw-col-start-3 tw-flex tw-flex-row tw-gap-x-4">
                        <select defaultValue={accessibleCompanies[0].id} onChange={(e) => navigate(`/${e.target.value}`)} className="tw-bg-zinc-800 tw-text-white">
                            <ItemBuilder
                                items={accessibleCompanies}
                                itemBuilder={(accessibleCompany, accessibleCompanyIndex) => (
                                    <option value={accessibleCompany.id} key={accessibleCompanyIndex}>
                                        {accessibleCompany.name}
                                    </option>
                                )}
                            />
                        </select>
                        <img className="tw-w-8 tw-h-8 tw-rounded-full" src={`https://images.growthjockey.com/intellsys/users/${userDetails.id}.jpg`} title={userDetails.name} />
                        <MenuComponent className="tw-h-8" userDetails={userDetails} accessibleCompanies={accessibleCompanies} />
                    </div>
                )}
            </div>
        </div>
    );
}
