import type {LoaderFunction} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {getNameAndPrivilegesForUser} from "~/backend/userDetails.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {getUrlFromRequest} from "~/backend/utilities/utilities.server";

export const loader: LoaderFunction = async ({request}) => {
    const accessToken = await getAccessTokenFromCookies(request);

    if (accessToken == null) {
        // TODO: Add message in login page
        return redirect(`/sign-in?redirectTo=${getUrlFromRequest(request)}`);
    }

    const userDetails = await getNameAndPrivilegesForUser(accessToken.userId);

    if (userDetails.privileges.length == 0) {
        return Error("No company associated with user!");
    }

    return redirect(`/${userDetails.privileges[0]}/`);
};
