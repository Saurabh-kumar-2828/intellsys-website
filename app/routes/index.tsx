import {LoaderFunction, MetaFunction, redirect} from "@remix-run/node";
import {getAccessTokenFromCookies} from "~/backend/utilities/cookieSessionsHelper.server";

export const loader: LoaderFunction = async ({request}) => {
    const accessToken = await getAccessTokenFromCookies(request);

    // TODO: Figure out the proper way to do this
    if (accessToken == null) {
        const currentUrl = new URL(request.url).pathname;

        if (currentUrl != "/sign-in") {
            // return redirect(`/sign-in?redirectTo=${encodeURI(currentUrl)}`);
            return redirect(`/sign-in`);
        }
    }

    return null;

    // const loaderData: LoaderData = {
    //     userDetails: userDetails,
    // };

    // return json(loaderData);
};

export const meta: MetaFunction = () => {
    return {
        title: "Intellsys",
    };
};

export default function () {
    return (
        <div className="tw-min-h-full tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-y-4">
                {/* <div className="tw-text-[3rem] tw-font-bold tw-text-primary">Intellsys</div> */}
                <img src="https://imagedelivery.net/QSJTsX8HH4EtEhHrJthznA/415c8f79-9b37-4af5-2bfd-d68b18264200/h=128" className="tw-h-32" />
            </div>
        </div>
    );
}
