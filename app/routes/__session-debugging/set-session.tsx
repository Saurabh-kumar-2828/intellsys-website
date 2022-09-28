import jwt_decode from "jwt-decode";
import jwt from "jsonwebtoken";
import type {LoaderFunction} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {getSession, commitSession} from "~/backend/utilities/sessions.server";
import {coalesce} from "~/utilities/utilities";

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const redirectTo = urlSearchParams.get("redirectTo");

    // TODO: Make this generic?
    const userId = urlSearchParams.get("userId") as string;
    // const refreshToken = null;

    const session = await getSession(request.headers.get("Cookie"));

    let accessToken = null;

    if (userId != null) {
        accessToken = jwt.sign({userId: userId, schemaVersion: process.env.COOKIE_SCHEMA_VERSION}, process.env.JWT_SECRET);
    } else {
        accessToken = null;
    }

    session.set("accessToken", accessToken);
    // session.set("refreshToken", refreshToken);

    return redirect(coalesce(redirectTo, "/"), {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
};
