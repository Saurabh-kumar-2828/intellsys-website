import type {ShouldReloadFunction} from "@remix-run/react";
import {json, redirect} from "@remix-run/node";
import type {MetaFunction, LinksFunction, LoaderFunction} from "@remix-run/node";
import {Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useLocation, useTransition} from "@remix-run/react";
import {HeaderComponent} from "~/components/headerComponent";
import {LoaderComponent} from "~/components/loaderComponent";
import {getAccessToken, getAuthenticatedUserDetails} from "~/backend/utilities/sessionsHelper.server";
import {User} from "~/utilities/typeDefinitions";
import tailwindStylesheet from "../build/tailwind.css";
import {Toaster} from "react-hot-toast";

type LoaderData = {
    userDetails: User | null;
};

export const loader: LoaderFunction = async ({request}) => {
    const accessToken = await getAccessToken(request);

    if (accessToken != null && accessToken.schemaVersion != process.env.COOKIE_SCHEMA_VERSION) {
        return redirect("/sign-out");
    }

    const userDetails = await getAuthenticatedUserDetails(request);

    const loaderData: LoaderData = {
        userDetails: userDetails,
    };

    return json(loaderData);
};

export const meta: MetaFunction = () => ({
    charset: "utf-8",
    title: "Intellsys",
    viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [
    {rel: "stylesheet", href: tailwindStylesheet},
    {rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Poppins"},
];

export default function App() {
    const transition = useTransition();

    const {userDetails} = useLoaderData();

    return (
        <html lang="en">
            <head>
                <Meta />
                <Links />
            </head>

            <body className="tw-bg-dark-bg-400 tw-text-base tw-text-fg">
                <div className="tw-grid tw-grid-rows-[auto_1fr] tw-min-h-screen">
                    {transition.state == "idle" ? null : <LoaderComponent />}
                    <HeaderComponent userDetails={userDetails} className="tw-row-start-1 tw-z-50" />
                    <div className="tw-row-start-2">
                        <Outlet />
                    </div>
                </div>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 5000,
                        className: "!tw-bg-bg+1",
                    }}
                />
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}
