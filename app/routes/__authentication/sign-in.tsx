import type {ActionFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {Form, useActionData} from "@remix-run/react";
import {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {createCompany, createUser, getAccessTokenForUser, getCompanyForDomain, getUserForEmail, sendOtp, verifyOtp} from "~/backend/authentication.server";
import {commitCookieSession, getCookieSession} from "~/backend/utilities/cookieSessions.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {errorToast} from "~/components/scratchpad";
import {HiddenFormField} from "~/global-common-typescript/components/hiddenFormField";
import {getStringFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {emailIdValidationPattern} from "~/global-common-typescript/utilities/validationPatterns";
import {getDomainFromEmail} from "~/utilities/utilities";

type ActionData = {
    otpSent: boolean;
    error: string | null;
};

export const action: ActionFunction = async ({request}) => {
    const body = await request.formData();

    const email = safeParse(getStringFromUnknown, body.get("email") as string);
    const otp = safeParse(getStringFromUnknown, body.get("otp") as string);

    // TODO: Do this properly

    if (email == null) {
        return new Response("Invalid input: 9e692b78-ca87-4c03-877f-1e53a6510523", {
            status: 400,
        });
    }

    if (otp == null) {
        await sendOtp(email);

        const actionData: ActionData = {
            otpSent: true,
            error: null,
        };

        return actionData;
    } else {
        const result = await verifyOtp(email, otp);

        if (!result.success) {
            const actionData: ActionData = {
                otpSent: false,
                error: "Invalid OTP",
            };

            return actionData;
        } else {
            // Ensure company is properly created
            const domain = getDomainFromEmail(email);

            let company = await getCompanyForDomain(domain);
            // let wasCompanyJustCreated = false;
            if (company instanceof Error) {
                return company;
            }

            if (company == null) {
                company = await createCompany(domain);
                if (company instanceof Error) {
                    return company;
                }

                // wasCompanyJustCreated = true;
            }

            // Ensure user is properly created
            let user = await getUserForEmail(email);
            // let wasUserJustCreated = false;
            if (user instanceof Error) {
                return user;
            }

            if (user == null) {
                user = await createUser(email, company);
                // Within createUser:
                //     - Create the user in table
                //     - Add the appropriate permissions for his own company

                // While sharing a page with a user that does not have an existing account,
                // ensure we give him appropriate access to his own company, and appropriate
                // access to the shared company
                if (user instanceof Error) {
                    return user;
                }
                // wasUserJustCreated = true;
            }

            const cookieSession = await getCookieSession(request.headers.get("Cookie"));

            const result = await getAccessTokenForUser(user.id);

            cookieSession.set("accessToken", result.accessTokenJwt);

            return redirect("/", {
                headers: {
                    "Set-Cookie": await commitCookieSession(cookieSession),
                },
            });
        }
    }
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
                    <div className="tw-font-h1-400">Intellsys</div>

                    <VerticalSpacer className="tw-h-8" />

                    <div className="tw-font-h1-400">Codify Your Coffee</div>

                    <div className="tw-font-h1-400">Techify Your Meals</div>

                    <VerticalSpacer className="tw-h-8" />

                    <div>Growth Jockey lets your company not miss out on any growth opportunity while retaining your focus on the core business.</div>

                    <VerticalSpacer className="tw-h-8" />

                    <a href="https://www.growthjockey.com" className="is-button tw-px-16 tw-self-start">
                        Explore Services
                    </a>
                </div>

                <LoginComponent />
            </div>
        </div>
    );
}

function LoginComponent() {
    const [hasOtpBeenSent, setHasOtpBeenSent] = useState(false);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const actionData = useActionData() as ActionData | null;

    useEffect(() => {
        if (actionData == null) {
            return;
        }

        if (actionData.error != null) {
            toast.error(actionData.error);
            return;
        }

        setHasOtpBeenSent(true);
    }, [actionData]);

    return (
        <Form
            action="/sign-in"
            method="post"
            className="tw-flex tw-flex-col tw-bg-dark-bg-500 tw-rounded-2xl tw-p-8"
        >
            {hasOtpBeenSent == false ? (
                <>
                    <label htmlFor="username">Username</label>

                    <VerticalSpacer className="tw-h-2" />

                    <input
                        type="text"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        required
                        // pattern="[0-9]{10}"
                        className="is-text-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        pattern={emailIdValidationPattern}
                    />
                </>
            ) : (
                <>
                    <div>
                        Email: {email}
                        <HiddenFormField
                            name="email"
                            value={email}
                            required={true}
                            pattern={emailIdValidationPattern}
                        />
                    </div>

                    <VerticalSpacer className="tw-h-2" />

                    <label htmlFor="otp">OTP</label>

                    <VerticalSpacer className="tw-h-2" />

                    <input
                        type="text"
                        id="otp"
                        name="otp"
                        placeholder="Enter your OTP"
                        required
                        // pattern="[0-9]{10}"
                        className="is-text-input"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                </>
            )}

            <VerticalSpacer />

            <button className="is-button tw-self-center tw-px-16">Sign In</button>
        </Form>
    );
}
