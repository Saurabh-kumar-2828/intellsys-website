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
    console.log("ASD");

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
        title: "Sign In - Livpure Data Management",
    };
};

export default function () {
    const actionData = useActionData();

    return (
        <div>
            <VerticalSpacer />

            <div className="tw-flex-grow-[999] tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-8 lg:tw-px-40 tw-h-[calc(100vh_-_6rem)]">
                <div className="tw-flex tw-flex-col tw-w-full lg:tw-w-[40rem]">
                    <Form
                        method="post"
                        className="tw-flex tw-flex-col"
                    >
                        <input
                            type="text"
                            name="username"
                            placeholder="Enter your email"
                            required
                            defaultValue={actionData?.values?.username ?? ""}
                            // pattern="[0-9]{10}"
                            className="tw-bg-white tw-text-black tw-p-4 tw-rounded-lg"
                        />

                        <VerticalSpacer />

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            required
                            // pattern="[0-9]{10}"
                            defaultValue={actionData?.values?.password ?? ""}
                            className="tw-bg-white tw-text-black tw-p-4 tw-rounded-lg"
                        />

                        <VerticalSpacer />

                        {actionData?.errors == null ? null : (
                            <>
                                <div className="tw-text-red-500 tw-text-center">{actionData?.errors.join(", ")}</div>

                                <VerticalSpacer />
                            </>
                        )}

                        <button className="tw-lp-button tw-self-center tw-px-16">
                            Sign In
                        </button>
                    </Form>
                </div>
            </div>
        </div>
    );
}
