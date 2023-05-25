// TODO: Keep only code part

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { AccessibleAccount, GoogleAdsCredentials } from "~/backend/utilities/data-management/googleOAuth.server";
import { getAccessibleAccounts } from "~/backend/utilities/data-management/googleOAuth.server";
import { checkGoogleAdsConnectorExistsForAccount, getGoogleAdsRefreshToken, ingestAndStoreGoogleAdsData } from "~/backend/utilities/data-management/googleOAuth.server";
import { getUuidFromUnknown } from "~/global-common-typescript/utilities/typeValidationUtilities";
import { getNonEmptyStringOrNull } from "~/utilities/utilities";
import type { Jwt } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { getRequiredEnvironmentVariable } from "~/backend/utilities/utilities.server";
import { generateUuid } from "~/global-common-typescript/utilities/utilities";
import { useState } from 'react'
import { RadioGroup, Switch } from "@headlessui/react";
import { ItemBuilder } from "~/components/reusableComponents/itemBuilder";
import { CheckCircle, Circle } from "react-bootstrap-icons";


type LoaderData = {
    refreshTokenJwt: string,
    accessibleAccounts: Array<AccessibleAccount>
};

export const loader: LoaderFunction = async ({ request }) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));
    const companyId = getNonEmptyStringOrNull(urlSearchParams.get("state"));

    if (companyId == null) {
        throw new Response(null, { status: 404 });
    }

    if (authorizationCode == null) {
        throw Error("Authorization failed!");
    }

    const refreshToken = await getGoogleAdsRefreshToken(authorizationCode, getUuidFromUnknown(companyId));
    if (refreshToken instanceof Error) {
        return refreshToken;
    }

    const accessibleAccounts = await getAccessibleAccounts(refreshToken);

    // TODO: Get multiple accounts
    return json({
        refreshTokenJwt: jwt.sign(refreshToken, getRequiredEnvironmentVariable("TOKEN_SECRET")) as any as Jwt,
        // refreshTokenJwt: "",
        accessibleAccounts: accessibleAccounts
    });

};

// export const action: ActionFunction = async ({ request }) => {
//     try {
//         // const urlSearchParams = new URL(request.url).searchParams;

//         // const companyId = getNonEmptyStringOrNull(urlSearchParams.get("pstate"));

//         // if (companyId == null) {
//         //     throw new Response(null, { status: 404 });
//         // }

//         // const body = await request.formData();

//         // const googleAdsRefreshToken = body.get("googleAdsRefreshToken") as string;
//         // const selectedAccount = JSON.parse(body.get("selectedAccount") as string);

//         // // TODO: type validation
//         // const refreshTokenDecoded = jwt.verify(googleAdsRefreshToken, getRequiredEnvironmentVariable("TOKEN_SECRET")) as string;

//         // const accountExists = await checkGoogleAdsConnectorExistsForAccount(selectedAccount.managerId);
//         // if (accountExists instanceof Error) {
//         //     return Error("Account already exists");
//         // }

//         // // Cannot create new connector, if connector with account already exists.
//         // if (accountExists) {
//         //     return redirect(`/${companyId}/data-sources`);
//         // }

//         // const googleAdsCredentials: GoogleAdsCredentials = {
//         //     refreshToken: refreshTokenDecoded,
//         //     googleAccountId: selectedAccount.customerClientId,
//         //     googleLoginCustomerId: selectedAccount.managerId
//         // }

//         // const credentialsJwt = jwt.sign(googleAdsCredentials, getRequiredEnvironmentVariable("TOKEN_SECRET")) as any as string

//         // const connectorId = generateUuid();

//         // const response = await ingestAndStoreGoogleAdsData(credentialsJwt, getUuidFromUnknown(companyId), connectorId);
//         // if (response instanceof Error) {
//         //     throw response;
//         // }

//         // return redirect(`/${companyId}/data-sources/googleAds/${connectorId}`);
//         return null;
//     } catch (e) {
//         console.log(e);
//     }

//     return null;
// }

export default function () {
    const { refreshTokenJwt, accessibleAccounts } = useLoaderData<LoaderData>();
    const [selectedAccount, setSelectedAccount] = useState<AccessibleAccount>()

    return (
        <div>
            <RadioGroup
                name="selectedAccount"
                value={selectedAccount}
                onChange={setSelectedAccount}
                className="tw-row-start-1 tw-w-full tw-grid tw-grid-flow-row tw-content-center tw-gap-y-4"
            >
                <ItemBuilder
                    items={accessibleAccounts}
                    itemBuilder={(item, itemIndex) => (
                        <RadioGroup.Option
                            value={item}
                            key={itemIndex}
                        >
                            {({ checked }) => (
                                <div className="tw-pl-4 tw-pr-8 tw-py-[0.9375rem] tw-rounded-full tw-border-[0.0625rem] tw-border-solid tw-border-white tw-text-white tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-2">
                                    {checked ? <CheckCircle className="tw-w-6 tw-h-6 tw-text-blue-500" /> : <Circle className="tw-w-6 tw-h-6 tw-text-blue-500" />}

                                    {`${item.customerClientName}, ${item.customerClientId}`}
                                </div>
                            )}
                        </RadioGroup.Option>
                    )}
                />
            </RadioGroup>

            <form
                method="post"
                className="tw-relative tw-grid tw-w-full tw-h-auto tw-gap-8 tw-p-10"
            >
                <input
                    type="text"
                    name="selectedAccount"
                    value={JSON.stringify(selectedAccount)}
                    hidden
                    readOnly
                />
                <input
                    type="text"
                    name="googleAdsRefreshToken"
                    value={refreshTokenJwt}
                    hidden
                    readOnly
                />

                <button
                    type="submit"
                    className="tw-row-start-2 tw-lp-button"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}
