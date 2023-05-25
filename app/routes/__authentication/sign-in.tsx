import type {ActionFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, useActionData} from "@remix-run/react";
import {useEffect} from "react";
import {validateUser} from "~/backend/authentication.server";
import {commitCookieSession, getCookieSession} from "~/backend/utilities/cookieSessions.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {errorToast} from "~/components/scratchpad";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

type ActionData = null | {
    error: string;
};

export const action: ActionFunction = async ({request}) => {
    console.log("100");
    const body = await request.formData();

    console.log(200);
    const username = getNonEmptyStringOrNull(body.get("username") as string);
    const password = getNonEmptyStringOrNull(body.get("password") as string);

    // TODO: Do this properly

    if (username == null || password == null) {
        const actionData: ActionData = {
            error: "Username or password cannot be empty!",
        };

        return json(actionData);
    }

    console.log(1);

    const response = await validateUser(username, password);
    if (response == null) {
        const actionData = {
            error: "Incorrect username or password!",
        };

        return json(actionData);
    }

    console.log(2);

    const cookieSession = await getCookieSession(request.headers.get("Cookie"));

    console.log(3);

    cookieSession.set("accessToken", response.accessTokenJwt);
    // session.set("refreshToken", response.refreshTokenJwt);

    console.log(4);

    console.log(response.accessTokenJwt);

    // return redirect(coalesce(redirectTo, "/"), {
    return redirect("/", {
        headers: {
            "Set-Cookie": await commitCookieSession(cookieSession),
        },
    });
};

export const loader: LoaderFunction = async ({request}) => {
    const accessToken = await getAccessTokenFromCookies(request);

    if (accessToken != null) {
        return redirect("/");
    }

    return null;
};

export const meta: MetaFunction = () => {
    return {
        title: "Sign In - Intellsys",
    };
};

export default function () {
    const actionData = useActionData() as ActionData;

    useEffect(() => {
        if (actionData != null) {
            errorToast(actionData.error);
        }
    }, [actionData]);

    return (
        <div>
            <div className="tw-flex-grow-[999] tw-grid tw-grid-cols-1 md:tw-grid-cols-[1fr_30rem] tw-items-center tw-justify-center tw-px-screen-edge tw-min-h-[calc(100vh-var(--gj-header-height))] tw-gap-x-8 tw-gap-y-8">
                <div className="tw-flex tw-flex-col tw-justify-center">
                    <div className="tw-font-h1-400">Codify Your Coffee</div>

                    <div className="tw-font-h1-400">Techify Your Meals</div>

                    <VerticalSpacer className="tw-h-8" />

                    <div>Growth Jockey lets your company not miss out on any growth opportunity while retaining your focus on the core business.</div>

                    <VerticalSpacer className="tw-h-8" />

                    <a href="https://www.growthjockey.com" className="is-button tw-px-16 tw-self-start">
                        Explore Services
                    </a>
                </div>

                <Form method="post" className="tw-flex tw-flex-col tw-bg-dark-bg-500 tw-rounded-2xl tw-p-8">
                    <label htmlFor="username">Username</label>

                    <VerticalSpacer className="tw-h-2" />

                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Enter your email"
                        required
                        // pattern="[0-9]{10}"
                        className="is-text-input"
                    />

                    <VerticalSpacer className="tw-h-4" />

                    <label htmlFor="password">Password</label>

                    <VerticalSpacer className="tw-h-2" />

                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        required
                        // pattern="[0-9]{10}"
                        className="is-text-input"
                    />

                    <VerticalSpacer />

                    <button className="is-button tw-self-center tw-px-16">Sign In</button>
                </Form>
            </div>
        </div>
    );
}
