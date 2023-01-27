import type {MetaFunction, ActionFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {Form, Link, useActionData, useLoaderData, useNavigate} from "@remix-run/react";
import {Base64} from "js-base64";
import {useState} from "react";

import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {ResponsiveImage} from "~/components/reusableComponents/responsiveImage";
import {concatenateNonNullStringsWithSpaces, getNonEmptyStringOrNull} from "~/utilities/utilities";
import {getAuthenticatedUserDetails} from "~/backend/utilities/sessionsHelper.server";

export const action: ActionFunction = async ({request}) => {
    const body = await request.formData();

    const username = getNonEmptyStringOrNull(body.get("username") as string);
    const password = getNonEmptyStringOrNull(body.get("password") as string);

    // TODO: Do this properly

    const values = {
        username,
        password
    };

    const errors = [];

    if (username == null) {
        errors.push("Username cannot be empty!");
    }

    if (password == null) {
        errors.push("Password cannot be empty!");
    }

    if (errors.length != 0) {
        return json({
            values,
            errors,
        });
    }

    if (username == "gj" && password == "gj") {
        return redirect("/set-session?userId=admin");
    } else if (username == "harsha@livpure.com" && password == "Livpure!") {
        return redirect("/set-session?userId=harsha@livpure.com");
    } else {
        errors.push("Invalid credentials!");
    }

    return json({
        values,
        errors,
    });
};

export const loader: LoaderFunction = async ({request}) => {
    const userDetails = await getAuthenticatedUserDetails(request);

    if (userDetails != null) {
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
    const actionData = useActionData();

    return (
        <div>
            <div className="tw-flex-grow-[999] tw-grid tw-grid-cols-1 md:tw-grid-cols-[1fr_30rem] tw-items-center tw-justify-center tw-px-screen-edge tw-min-h-[calc(100vh-var(--gj-header-height))] tw-gap-x-8 tw-gap-y-8">
                <div className="tw-flex tw-flex-col tw-justify-center">
                    <div className="tw-font-h1-400">
                        Codify Your Coffee
                    </div>

                    <div className="tw-font-h1-400">
                        Techify Your Meals
                    </div>

                    <VerticalSpacer className="tw-h-8" />

                    <div>
                        Growth Jockey lets your company not miss out on any growth opportunity while retaining your focus on the core business.

                    </div>

                    <VerticalSpacer className="tw-h-8" />

                    <a href="https://www.growthjockey.com" className="is-button tw-px-16 tw-self-start">
                        Explore Services
                    </a>
                </div>

                <Form
                    method="post"
                    className="tw-flex tw-flex-col tw-bg-dark-bg-500 tw-rounded-2xl tw-p-8"
                >
                    <label
                        htmlFor="username"
                    >
                        Username
                    </label>

                    <VerticalSpacer className="tw-h-2" />

                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Enter your email"
                        required
                        defaultValue={actionData?.values?.username ?? ""}
                        // pattern="[0-9]{10}"
                        className="is-text-input"
                    />

                    <VerticalSpacer className="tw-h-4" />

                    <label
                        htmlFor="password"
                    >
                        Password
                    </label>

                    <VerticalSpacer className="tw-h-2" />

                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        required
                        // pattern="[0-9]{10}"
                        defaultValue={actionData?.values?.password ?? ""}
                        className="is-text-input"
                    />

                    <VerticalSpacer />

                    {actionData?.errors == null ? null : (
                        <>
                            <div className="tw-text-red-500 tw-text-center">{actionData?.errors.join(", ")}</div>

                            <VerticalSpacer />
                        </>
                    )}

                    <button className="is-button tw-self-center tw-px-16">
                        Sign In
                    </button>
                </Form>
            </div>
        </div>
    );
}
