import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {facebookOAuthFlow} from "~/backend/utilities/data-management/facebookOAuth.server";
import {HiddenFormField} from "~/global-common-typescript/components/hiddenFormField";
import {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

// Facebook ads

type LoaderData = {
    authorizationCode: string;
    companyId: Uuid;
}

export const loader: LoaderFunction = async ({request, params}) => {
    const urlSearchParams = new URL(request.url).searchParams;
    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));
    const state = getNonEmptyStringOrNull(urlSearchParams.get("state"));

    const companyId = getUuidFromUnknown(state);
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    if (authorizationCode == null) {
        throw Error("Authorization failed!");
    }

    const loaderData: LoaderData = {
        authorizationCode: authorizationCode,
        companyId: companyId,
    }

    return json(loaderData);
};

export const action: ActionFunction = async ({request, params}) => {
    const body = await request.formData();

    const accountId = body.get("accountId") as string;
    const code = body.get("authorizationCode") as string;
    const companyId = body.get("companyId") as string;

    if (accountId == null || code == null || companyId == null) {
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
        console.log("Facebobook Authorization code: ", code);
        const response = await facebookOAuthFlow(code, companyId, accountId, connectorId);

        if (response instanceof Error) {
            throw response;
        }

        return redirect(`/${companyId}/facebook-ads/${connectorId}`);
    }

    return null;
};

export default function () {
    const {authorizationCode, companyId} = useLoaderData() as LoaderData;
    const [selectedAccount, setSelectedAccount] = useState("");

    return (
        <div className="tw-m-4 tw-flex tw-flex-row ">
            <form method="post">
                <input
                    type="text"
                    name="accountId"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="tw-p-2 tw-basis-1/4"
                />

                <HiddenFormField
                    name="authorizationCode"
                    value={authorizationCode}
                />

                <HiddenFormField
                    name="companyId"
                    value={companyId}
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
