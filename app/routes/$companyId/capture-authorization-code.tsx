import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {facebookOAuthFlow} from "~/backend/utilities/data-management/facebookOAuth.server";
import {decrypt} from "~/backend/utilities/utilities.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import { generateUuid } from "~/global-common-typescript/utilities/utilities";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

type LoaderData = {
    authorizationCode: string
}

export const loader: LoaderFunction = async ({request, params}) => {
    const urlSearchParams = new URL(request.url).searchParams;
    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));

    const companyId = getUuidFromUnknown(params.companyId);
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    if (authorizationCode == null) {
        throw Error("Authorization failed!");
    }

    const loaderData: LoaderData = {
        authorizationCode: authorizationCode
    }

    return json(loaderData);
};

export const action: ActionFunction = async ({request, params}) => {
    const body = await request.formData();

    const companyId = getUuidFromUnknown(params.companyId);
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const data = body.get("id") as string;
    const code = body.get("authorizationCode") as string;

    if (data == null || code == null) {
        throw new Response(null, {status: 404});
    }

    // const dataDecoded = decrypt(data);

    // TODO: Confirm its implementation.
    // const accountExists = await checkIfFacebookAdsConnectorExistsForAccount(data);
    // if (accountExists instanceof Error) {
    //     return Error("Account already exists");
    // }

    // Cannot create new connector, if connector with account already exists.
    // if (accountExists) {
    //     return redirect(`/${companyId}/data-sources`);
    // }

    const connectorId = generateUuid();
    if (code != null) {
        await facebookOAuthFlow(code, companyId, data, connectorId);
    }


    // if (response instanceof Error) {
    //     throw response;
    // }

    // return redirect(`/${companyId}/googleAds/${connectorId}`);

    return null;
};

export default function () {
    const {authorizationCode} = useLoaderData() as LoaderData;
    const [selectedAccount, setSelectedAccount] = useState("");

    return (
        <div className="tw-m-4 tw-flex tw-flex-row ">
            <form method="post">
                <input
                    type="text"
                    name="id"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="tw-p-2 tw-basis-1/4"
                />

                <input
                    type="text"
                    name="authorizationCode"
                    value={authorizationCode}
                    readOnly
                    hidden
                />

                <button
                    type="submit"
                    className="tw-row-start-2 tw-lp-button tw-basis-1/4"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}
