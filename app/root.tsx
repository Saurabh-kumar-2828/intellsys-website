import type {LinksFunction, MetaFunction} from "@remix-run/node";
import {Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration} from "@remix-run/react";
import reactToastifyStylesheet from "react-toastify/dist/ReactToastify.css";
import tailwindStylesheet from "~/tailwind.css";

export const meta: MetaFunction = () => ({
    charset: "utf-8",
    title: "Intellsys",
    viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [
    {rel: "stylesheet", href: tailwindStylesheet},
    {rel: "stylesheet", href: reactToastifyStylesheet},
    {rel: "stylesheet", href: "https://fonts.googleapis.com/css?family=Poppins"},
];

export default function App() {
    return (
        <html lang="en">
            <head>
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
