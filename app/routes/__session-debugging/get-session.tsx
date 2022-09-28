import type {LoaderFunction} from "@remix-run/node";
import {Link, useLoaderData} from "@remix-run/react";
import {getSession} from "~/backend/utilities/sessions.server";

export const loader: LoaderFunction = async ({request}) => {
    const session = await getSession(request.headers.get("Cookie"));

    // if (session.has("accessToken") && session.has("refreshToken")) {
    //     return {accessToken: session.get("accessToken"), refreshToken: session.get("refreshToken")};
    // }

    if (session.has("accessToken")) {
        return {accessToken: session.get("accessToken")};
    }

    // return {accessToken: null, refreshToken: null};
    return {accessToken: null};
};

export default function () {
    const {accessToken, refreshToken} = useLoaderData();

    return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-screen tw-gap-y-4">
            <div>accessToken: `{accessToken}`</div>

            {/* <div>refreshToken: `{refreshToken}`</div> */}

            <div className="tw-flex tw-flex-row tw-gap-x-8">
                <Link to={`/set-session?debugUserId=c7c54aaa-b1b8-4b07-90a0-709706468d95&redirectTo=/get-session`} className="tw-lp-button">
                    Set Session
                </Link>

                <Link to="/clear-session?redirectTo=/get-session" className="tw-lp-button">
                    Clear Session
                </Link>
            </div>
        </div>
    );
}
