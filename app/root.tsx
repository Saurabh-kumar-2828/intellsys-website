import {LoaderFunction, redirect} from "@remix-run/node";
import {MetaFunction, LinksFunction} from "@remix-run/node";
import {Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useLocation, useTransition} from "@remix-run/react";
import {HeaderComponent} from "~/components/headerComponent";
import {LoaderComponent} from "~/components/loaderComponent";
import {getAccessToken} from "~/backend/utilities/sessionsHelper.server";

import tailwindStylesheet from "../build/tailwind.css";

export const loader: LoaderFunction = async ({request}) => {
    const accessToken = await getAccessToken(request);

    if (accessToken == null) {
        const currentUrl = new URL(request.url).pathname;

        if (currentUrl != "/sign-in") {
            return redirect("/sign-in");
        } else {
            return null;
        }
    }

    if (accessToken.schemaVersion != process.env.COOKIE_SCHEMA_VERSION) {
        return redirect("/clear-session");
    }

    return null;
};

export const meta: MetaFunction = () => ({
    charset: "utf-8",
    title: "Livpure Data Management",
    viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [{rel: "stylesheet", href: tailwindStylesheet}];

export default function App() {
    const transition = useTransition();

    return (
        <html lang="en">
            <head>
                <Meta />
                <Links />
            </head>

            <body className="tw-bg-bg tw-text-base tw-text-fg">
                <div className="tw-grid tw-grid-cols-[auto_1fr] tw-grid-rows-[auto_1fr] tw-min-h-screen">
                    {transition.state == "idle" ? null : <LoaderComponent />}
                    <HeaderComponent className="tw-row-start-1 tw-col-start-1 tw-col-span-2 tw-z-50" />
                    <div className="tw-row-start-2 tw-col-start-1 tw-w-16 tw-bg-lp tw-z-40 tw-shadow-[10px_0px_15px_-3px] tw-shadow-zinc-900" />
                    <div className="tw-row-start-2 tw-col-start-2">
                        <Outlet />
                    </div>
                </div>
                <ScrollRestoration />
                <Scripts />
                {/* <LiveReload /> */}
            </body>
        </html>
    );
}
