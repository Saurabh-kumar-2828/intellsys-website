import type {LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Outlet} from "@remix-run/react";
import {getAccessibleCompanies, getUser} from "~/backend/userDetails.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import type {Company, User} from "~/utilities/typeDefinitions";
import {getSingletonValueOrNull} from "~/utilities/utilities";

export type CompanyLoaderData = {
    user: User;
    accessibleCompanies: Array<Company>;
    currentCompany: Company;
};

export const loader: LoaderFunction = async ({request, params}) => {
    const accessToken = await getAccessTokenFromCookies(request);

    if (accessToken == null) {
        // TODO: Add message in login page
        // return redirect(`/sign-in?redirectTo=${getUrlFromRequest(request)}`);

        return redirect(`/sign-in`);
    }

    const user = await getUser(getUuidFromUnknown(accessToken.userId));
    const accessibleCompanies = await getAccessibleCompanies(user);

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const currentCompany = getSingletonValueOrNull(accessibleCompanies.filter((company) => company.id == companyId));
    if (currentCompany == null) {
        throw new Response(null, {status: 404});
    }

    const loaderData: CompanyLoaderData = {
        user: user,
        accessibleCompanies: accessibleCompanies,
        currentCompany: currentCompany,
    };

    return json(loaderData);
};

export default function () {
    return (
        <Outlet />
    );
}
