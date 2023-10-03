import type {LinksFunction, MetaFunction} from "@remix-run/node";
import {Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration} from "@remix-run/react";
import reactToastifyStylesheet from "react-toastify/ReactToastify.css";
import tailwindStylesheet from "~/tailwind.css";
import {cssBundleHref} from "@remix-run/css-bundle";

export const meta: MetaFunction = ({data, matches}) => {
    return [
        {
            title: "Intellsys",
        },
    ];
};

export const links: LinksFunction = () => [
    ...(cssBundleHref ? [{rel: "stylesheet", href: cssBundleHref}] : []),
    {rel: "stylesheet", href: tailwindStylesheet},
    {rel: "stylesheet", href: reactToastifyStylesheet},
    {rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Poppins"},
];

export default function App() {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <Meta />
                <Links />
            </head>

            <body className="tw-bg-dark-bg-400 tw-text-base tw-text-fg">
                <Outlet />
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}
