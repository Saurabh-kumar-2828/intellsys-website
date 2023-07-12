import type {LoaderFunction} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {getCompanyForDomain} from "~/backend/authentication.server";
import {getUser} from "~/backend/userDetails.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import { getUuidFromUnknown } from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getDomainFromEmail} from "~/utilities/utilities";

export const loader: LoaderFunction = async ({request}) => {
    const accessToken = await getAccessTokenFromCookies(request);

    if (accessToken == null) {
        // TODO: Add message in login page
        return redirect(`/sign-in`);
    }

    const userId = getUuidFromUnknown(accessToken.userId);

    const user = await getUser(userId);
    if(user instanceof Error){
        throw new Response("No user found!", {status: 400});
    }

    if (Object.keys(user.privileges).length == 0) {
        return new Response("Invalid input: 17b05997-ac5d-44b3-a4a1-5fb4c49f8469", {
            status: 400,
        });
    }

    const domain = getDomainFromEmail(user.email);

    const company = await getCompanyForDomain(domain);
    if (company instanceof Error) {
        return company;
    }
    if (company == null) {
        return new Response("Invalid input: ca17b689-f5fe-4059-8853-5aa7c6021345", {
            status: 400,
        });
    }

    return redirect(`/${company.id}/`);
};
