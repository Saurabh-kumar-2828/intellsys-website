import {Dialog, Transition} from "@headlessui/react";
import type {ActionFunction, LoaderFunction, MetaFunction} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {Form, useActionData, useNavigation} from "@remix-run/react";
import React, {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {createCompany, createUser, getAccessTokenForUser, getCompanyForDomain, getUserForEmail, sendOtp, verifyOtp} from "~/backend/authentication.server";
import {commitCookieSession, getCookieSession} from "~/backend/utilities/cookieSessions.server";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {errorToast} from "~/components/scratchpad";
import {HiddenFormField} from "~/global-common-typescript/components/hiddenFormField";
import {getStringFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {concatenateNonNullStringsWithSpaces} from "~/global-common-typescript/utilities/utilities";
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
            {/* <div className="tw-flex-grow-[999] tw-grid tw-grid-cols-1 md:tw-grid-cols-[1fr_30rem] tw-items-center tw-justify-center tw-px-screen-edge tw-min-h-[calc(100vh-var(--gj-header-height))] tw-gap-x-8 tw-gap-y-8">
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
            </div> */}

            {/* <div className="tw-grid tw-cols-1 tw-"></div> */}
            <LoginPage />
        </div>
    );
}

function LoginPage() {
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

    const showLoginDialog = () => setIsLoginDialogOpen(true);
    const hideLoginDialog = () => setIsLoginDialogOpen(false);

    return (
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-16 tw-items-center tw-justify-center tw-w-full tw-max-w-7xl tw-mx-auto tw-px-[120px] tw-gap-y-24">
            <div className="tw-row-start-1 tw-grid tw-grid-rows-[6rem_auto_1rem_auto_2rem_auto_2rem_auto_minmax(0,2fr)]">
                <div className="tw-row-start-2 tw-text-center tw-place-self-center tw-text-4xl tw-font-bold">Empower Your Data Insights With Our Analytical Genius</div>
                <div className="tw-row-start-4 tw-text-center tw-place-self-center">Connect and track data from any tool, simplifying performance and business decisions.</div>

                <LoginComponent className="tw-row-start-6 tw-max-w-md tw-mx-auto" />

                <div className="tw-row-start-[8] tw-text-center tw-place-self-center">
                    <button
                        onClick={showLoginDialog}
                        className="tw-col-start-1 gj-bg-primary-gradient tw-text-white tw-py-2 tw-px-4 tw-rounded-full"
                    >
                        Sign Up For Free
                    </button>
                    <VerticalSpacer className="tw-h-8" />
                </div>

                <img
                    className="tw-row-start-[9]"
                    src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/1/laptop-3b14f4.png"
                />
            </div>

            <div className="tw-row-start-2 tw-grid tw-grid-flow-row tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)] tw-gap-x-8">
                <div className="tw-col-start-1 tw-col-span-full tw-text-center tw-text-3xl">
                    <span className="gj-text-primary-gradient tw-text-3xl">Unlock </span>Your
                </div>
                <div className="tw-col-start-1 tw-col-span-full tw-text-center tw-text-3xl">
                    <span className="gj-text-primary-gradient">Tech Transformation</span>
                </div>

                <div className="tw-col-start-1 tw-col-span-full tw-text-center tw-text-sm tw-text-gray-500">Analyse Your Performance By</div>

                <VerticalSpacer className="tw-h-6 tw-col-start-1 tw-col-span-full" />

                <div className="tw-col-start-1 tw-grid tw-gap-y-4 tw-overflow-hidden">
                    <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_1rem_minmax(0,3fr)] tw-bg-[#202329] tw-p-6 tw-rounded-lg">
                        <div className="gj-bg-foreground-gradient-dark tw-w-full tw-aspect-square tw-place-self-center tw-grid tw-place-items-center tw-rounded-full">
                            <img
                                src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/3/metrics-7845d8.png"
                                className="tw-col-start-1 tw-h-1/2 tw-w-1/2 tw-object-contain tw-object-left"
                            />
                        </div>
                        <div className="tw-col-start-3">
                            <div className="tw-grid tw-grid-rows-[minmax(0,1fr)_auto_1rem_auto_minmax(0,1fr)]">
                                <div className="tw-row-start-2">Meticulous Metrics</div>
                                <div className="tw-row-start-4">Combine data from multiple sources, calculate metrics without coding.</div>
                            </div>
                        </div>
                    </div>
                    <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_1rem_minmax(0,3fr)] tw-bg-[#202329] tw-p-6 tw-rounded-lg">
                        <div className="gj-bg-foreground-gradient-dark tw-w-full tw-aspect-square tw-place-self-center tw-grid tw-place-items-center tw-rounded-full">
                            <img
                                src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/3/metrics-7845d8.png"
                                className="tw-col-start-1 tw-h-1/2 tw-w-1/2"
                            />
                        </div>
                        <div className="tw-col-start-3">
                            <div className="tw-grid tw-grid-rows-[minmax(0,1fr)_auto_1rem_auto_minmax(0,1fr)]">
                                <div className="tw-row-start-2">Meticulous Metrics</div>
                                <div className="tw-row-start-4">Combine data from multiple sources, calculate metrics without coding.</div>
                            </div>
                        </div>
                    </div>
                    <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_1rem_minmax(0,3fr)] tw-bg-[#202329] tw-p-6 tw-rounded-lg">
                        <div className="gj-bg-foreground-gradient-dark tw-w-full tw-aspect-square tw-place-self-center tw-grid tw-place-items-center tw-rounded-full">
                            <img
                                src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/3/metrics-7845d8.png"
                                className="tw-col-start-1 tw-h-1/2 tw-w-1/2"
                            />
                        </div>
                        <div className="tw-col-start-3">
                            <div className="tw-grid tw-grid-rows-[minmax(0,1fr)_auto_1rem_auto_minmax(0,1fr)]">
                                <div className="tw-row-start-2">Meticulous Metrics</div>
                                <div className="tw-row-start-4">Combine data from multiple sources, calculate metrics without coding.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tw-overflow-hidden tw-col-start-2 tw-h-full tw-w-full tw-object-contain  tw-relative">
                    <img
                        src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/3/laptop-half-3c446a.png"
                        className="tw-h-full tw-aspect-square tw-absolute tw-left-0"
                    />
                </div>
            </div>

            <div className="tw-row-start-3 tw-w-full tw-mx-[80px_auto] tw-grid tw-grid-cols-[2rem_auto_2rem_minmax(0,1fr)] tw-bg-[#202329] tw-p-8">
                <div className="tw-col-start-2">
                    <img src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/6/rectangle-188f38.png" />
                </div>

                <div className="tw-col-start-4 tw-grid tw-grid-flow-row">
                    <div className="tw-text-3xl tw-font-extrabold tw-text-white">Three simple steps on a fast track to data driven decisions</div>

                    <div className="tw-text-[#00A2ED]">Step 1: Connect</div>

                    <div className="tw-grid tw-grid-cols-[auto_1rem_minmax(0,1fr)] tw-grid-flow-col">
                        <div className="tw-col-start-1 tw-bg-white tw-p-[6px] tw-h-fit tw-rounded-full tw-self-center">
                            <img
                                src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/6/tick-61474d.png"
                                className="tw-h-1/2 tw-w-full"
                            />
                        </div>
                        <div className="tw-col-start-3 tw-self-center">Lorem ipsum dolor sit amet.</div>
                    </div>

                    <div className="tw-grid tw-grid-cols-[auto_1rem_minmax(0,1fr)] tw-grid-flow-col">
                        <div className="tw-col-start-1 tw-bg-white tw-p-[6px] tw-h-fit tw-rounded-full tw-self-center">
                            <img
                                src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/6/tick-61474d.png"
                                className="tw-h-1/2 tw-w-full"
                            />
                        </div>
                        <div className="tw-col-start-3 tw-self-center">Lorem ipsum dolor sit amet.</div>
                    </div>
                    <div className="tw-grid tw-grid-cols-[auto_1rem_minmax(0,1fr)] tw-grid-flow-col">
                        <div className="tw-col-start-1 tw-bg-white tw-p-[6px] tw-h-fit tw-rounded-full tw-self-center">
                            <img
                                src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/6/tick-61474d.png"
                                className="tw-h-1/2 tw-w-full"
                            />
                        </div>
                        <div className="tw-col-start-3 tw-self-center">Lorem ipsum dolor sit amet.</div>
                    </div>

                    <div className="tw-self-end">
                        <button onClick={showLoginDialog} className="gj-bg-primary-gradient tw-text-white tw-px-8 tw-py-4 tw-rounded-full">Sign Up For Free</button>
                    </div>
                </div>
            </div>

            <div className="tw-row-start-4 tw-grid tw-justify-items-center tw-grid-flow-row">
                <div className="tw-text-3xl tw-text-white">Integrations app data</div>

                <VerticalSpacer className="tw-h-12" />

                <input
                    className="tw-w-3/4 tw-rounded-full tw-p-4"
                    placeholder="Search By Integration"
                />

                <VerticalSpacer className="tw-h-8" />

                <div className="tw-grid tw-grid-cols-4 tw-grid-flow-row tw-gap-8">
                    <Integration />
                    <Integration />
                    <Integration />
                    <Integration />
                    <Integration />
                    <Integration />
                    <Integration />
                    <Integration />
                </div>
            </div>

            <div className="tw-row-start-5 tw-grid tw-grid-cols-1 tw-grid-flow-row tw-place-items-center">
                <div className="tw-text-3xl">
                    Types of <span className="gj-text-primary-gradient">Dashboards</span>
                </div>

                <VerticalSpacer className="tw-h-8" />

                <div>
                    <img src="https://intellsys-optimizer.b-cdn.net/intellsys/sign-in/9/laptop-574087.png" />
                </div>
            </div>

            <div className="tw-row-start-6 tw-grid tw-p-24 is-gray-bg-gradient tw-place-items-center tw-grid-cols-[minmax(0,2fr)_1rem_minmax(0,1fr)] tw-grid-flow-row">
                <div className="tw-col-start-1 tw-grid tw-grid-flow-row">
                    <div className="tw-text-white">Ignite your growth</div>
                    <VerticalSpacer className="tw-h-16" />
                    <div className="tw-text-2xl tw-text-white">You are one step away from unlocking your potential</div>
                    <VerticalSpacer className="tw-h-16" />

                    <div className="tw-grid tw-grid-cols-[auto_1rem_auto] tw-w-3/4">
                        <button onClick={showLoginDialog} className="tw-col-start-1 gj-bg-primary-gradient tw-text-white tw-py-2 tw-px-4 tw-rounded-full">Sign Up For Free</button>
                        <button onClick={showLoginDialog} className="tw-col-start-3 tw-border tw-border-[#00a2ed] tw-text-white tw-py-2 tw-px-4 tw-rounded-full">Start a project</button>
                    </div>
                </div>
                <div className="tw-col-start-3 gj-bg-primary-gradient tw-h-1/2 tw-aspect-square tw-rounded-full tw-text-white tw-flex tw-justify-center tw-items-center">Let's Start</div>
            </div>

            <Transition
                show={isLoginDialogOpen}
                as={React.Fragment}
            >
                <Dialog
                    as="div"
                    className="tw-fixed tw-inset-0 tw-grid tw-place-items-center tw-z-50 tw-isolate"
                    onClose={hideLoginDialog}
                >
                    <div
                        onClick={hideLoginDialog}
                        className="tw-absolute tw-inset-0 -tw-z-10 tw-bg-[#000000bb]"
                    />
                    <LoginComponent />
                </Dialog>
            </Transition>
        </div>
    );
}

function Integration() {
    return (
        <div className="tw-border tw-border-[#00a2ed] tw-rounded-lg tw-py-4 tw-px-4 tw-grid tw-grid-cols-[minmax(0,1fr)_1rem_minmax(0,1fr)]">
            <div className="tw-col-start-1 tw-h-[5rem] tw-w-[5rem] gj-bg-primary-gradient tw-rounded-full"></div>

            <div className="tw-col-start-3 tw-self-center">App Name</div>
        </div>
    );
}

function LoginComponent({className}: {className?: string}) {
    const navigation = useNavigation();

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
            className={concatenateNonNullStringsWithSpaces("tw-flex tw-flex-col tw-bg-dark-bg-500 tw-rounded-2xl tw-p-8", className)}
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
                        autoFocus={true}
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
                        autoFocus={true}
                    />
                </>
            )}

            <VerticalSpacer />

            <button
                disabled={navigation.state != "idle"}
                className="is-button tw-self-center tw-px-16"
            >
                Sign In
            </button>
        </Form>
    );
}
