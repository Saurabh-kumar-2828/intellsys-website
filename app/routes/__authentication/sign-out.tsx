import type {LoaderFunction} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {commitCookieSession, getCookieSession} from "~/backend/utilities/cookieSessions.server";
import {coalesce} from "~/utilities/utilities";

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const redirectTo = urlSearchParams.get("redirectTo");

    const session = await getCookieSession(request.headers.get("Cookie"));

    session.unset("accessToken");
    session.unset("refreshToken");

    return redirect(coalesce(redirectTo, "/"), {
        headers: {
            "Set-Cookie": await commitCookieSession(session),
        },
    });
};
