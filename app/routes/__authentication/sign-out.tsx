import type {LoaderFunction} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {getSession, commitSession} from "~/backend/utilities/sessions.server";
import {coalesce} from "~/utilities/utilities";

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const redirectTo = urlSearchParams.get("redirectTo");

    const session = await getSession(request.headers.get("Cookie"));

    session.unset("accessToken");
    session.unset("refreshToken");

    // TODO: See if I can move this inside redirect
    const commitedSession = await commitSession(session);

    return redirect(coalesce(redirectTo, "/"), {
        headers: {
            "Set-Cookie": commitedSession,
        },
    });
};
