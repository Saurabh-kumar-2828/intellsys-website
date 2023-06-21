import {json, LoaderFunction, MetaFunction, redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {getAccessibleCompanies, getNameAndPrivilegesForUser} from "~/backend/userDetails.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";
import {Company, User} from "~/utilities/typeDefinitions";
import {getSingletonValue, getSingletonValueOrNull} from "~/utilities/utilities";

type LoaderData = {
    userDetails: User;
    accessibleCompanies: Array<Company>;
    currentCompany: Company;
};

export const loader: LoaderFunction = async ({request, params}) => {
    const accessToken = await getAccessTokenFromCookies(request);

    if (accessToken == null) {
        // TODO: Add message in login page
        return redirect(`/sign-in?redirectTo=${getUrlFromRequest(request)}`);
    }

    const userDetails = await getNameAndPrivilegesForUser(accessToken.userId);
    const accessibleCompanies = await getAccessibleCompanies(userDetails);

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const company = getSingletonValueOrNull(accessibleCompanies.filter(company => company.id == companyId));
    if (company == null) {
        throw new Response(null, {status: 404});
    }

    const loaderData: LoaderData = {
        userDetails: userDetails,
        accessibleCompanies: accessibleCompanies,
        currentCompany: company,
    };

    return json(loaderData);
};

export const meta: MetaFunction = () => {
    return {
        title: "Intellsys",
    };
};

export default function () {
    const {userDetails, accessibleCompanies, currentCompany} = useLoaderData() as LoaderData;

    return (
        <div className="tw-min-h-full tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-y-4">
                {/* <img src="https://imagedelivery.net/QSJTsX8HH4EtEhHrJthznA/415c8f79-9b37-4af5-2bfd-d68b18264200/h=128" className="tw-h-32" /> */}
                <div className="tw-text-[4rem]">
                    Welcome to Intellsys
                </div>
            </div>
        </div>
    );
}
