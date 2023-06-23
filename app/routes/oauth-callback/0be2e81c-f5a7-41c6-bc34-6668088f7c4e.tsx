import {RadioGroup} from "@headlessui/react";
import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {CheckCircle, Circle} from "react-bootstrap-icons";
import {ingestAndStoreGoogleAdsData} from "~/backend/utilities/data-management/common.server";
import type {GoogleAdsAccessibleAccount, GoogleAdsCredentials} from "~/backend/utilities/data-management/googleOAuth.server";
import {checkConnectorExistsForAccount} from "~/backend/utilities/data-management/googleOAuth.server";
import {getGoogleAdsRefreshToken} from "~/backend/utilities/data-management/googleOAuth.server";
import {getAccessibleAccounts} from "~/backend/utilities/data-management/googleOAuth.server";
import {decrypt, encrypt} from "~/backend/utilities/utilities.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {ConnectorType} from "~/utilities/typeDefinitions";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

// Google ads

// TODO: Keep only code part

type LoaderData = {
    data: string;
    accessibleAccounts: Array<GoogleAdsAccessibleAccount>;
};

export const loader: LoaderFunction = async ({request}) => {

    const urlSearchParams = new URL(request.url).searchParams;

    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));
    const companyId = getNonEmptyStringOrNull(urlSearchParams.get("state"));
    if (companyId == null) {
        throw new Response(null, {status: 400});
    }

    if (authorizationCode == null) {
        throw Error("Authorization failed!");
    }

    const refreshToken = await getGoogleAdsRefreshToken(authorizationCode, getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.GoogleAds));
    if (refreshToken instanceof Error) {
        return refreshToken;
    }

    const accessibleAccounts = await getAccessibleAccounts(refreshToken);
    if (accessibleAccounts instanceof Error) {
        return accessibleAccounts;
    }

    // TODO: Filter accessible account

    // TODO: Get multiple accounts
    const loaderData: LoaderData = {
        data: encrypt(refreshToken) as unknown as string,
        accessibleAccounts: accessibleAccounts,
    };

    return json(loaderData);
};

export const action: ActionFunction = async ({request}) => {
    try {
        const urlSearchParams = new URL(request.url).searchParams;

        const companyId = getNonEmptyStringOrNull(urlSearchParams.get("state"));

        if (companyId == null) {
            throw new Response(null, {status: 404});
        }

        const body = await request.formData();

        const data = body.get("data") as string;

        const selectedAccount = JSON.parse(body.get("selectedAccount") as string);

        // TODO: type validation
        const refreshTokenDecoded = decrypt(data);

        const accountExists = await checkConnectorExistsForAccount(ConnectorType.GoogleAds, selectedAccount.managerId);
        if (accountExists instanceof Error) {
            return Error("Account already exists");
        }

        // Cannot create new connector, if connector with account already exists.
        if (accountExists) {
            throw new Response(null, {status: 404, statusText: "Account already Exists!"});
        }

        const googleAdsCredentials: GoogleAdsCredentials = {
            refreshToken: refreshTokenDecoded as string,
            googleAccountId: selectedAccount.customerClientId,
            googleLoginCustomerId: selectedAccount.managerId,
        };

        const connectorId = generateUuid();

        const response = await ingestAndStoreGoogleAdsData(googleAdsCredentials, getUuidFromUnknown(companyId), connectorId);
        if (response instanceof Error) {
            throw response;
        }

        return redirect(`/${companyId}/0be2e81c-f5a7-41c6-bc34-6668088f7c4e/${connectorId}`);
    } catch (e) {
        console.log(e);
    }

    return null;
};

export default function () {
    const {data, accessibleAccounts} = useLoaderData() as LoaderData;
    const [selectedAccount, setSelectedAccount] = useState<GoogleAdsAccessibleAccount | null>(null);

    return (
        <div>
            <RadioGroup
                name="selectedAccount"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e)}
                className="tw-row-start-1 tw-w-full tw-grid tw-grid-flow-row tw-content-center tw-gap-y-4"
            >
                <ItemBuilder
                    items={accessibleAccounts}
                    itemBuilder={(item, itemIndex) => (
                        <RadioGroup.Option
                            value={item}
                            key={itemIndex}
                        >
                            {({checked}) => (
                                <div className="tw-pl-4 tw-pr-8 tw-py-[0.9375rem] tw-rounded-full tw-border-[0.0625rem] tw-border-solid tw-border-white tw-text-white tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-2">
                                    {checked ? <CheckCircle className="tw-w-6 tw-h-6 tw-text-blue-500" /> : <Circle className="tw-w-6 tw-h-6 tw-text-blue-500" />}

                                    {`${item.customerClientName}, ${item.customerClientId}`}
                                </div>
                            )}
                        </RadioGroup.Option>
                    )}
                />
            </RadioGroup>

            <Form method="post">
                <input
                    type="text"
                    name="selectedAccount"
                    value={selectedAccount ? JSON.stringify(selectedAccount) : ""}
                    hidden
                    readOnly
                />

                <input
                    type="text"
                    name="data"
                    value={data}
                    hidden
                    readOnly
                />

                {/* TODO: Disable it while loading */}
                <button
                    type="submit"
                    className="tw-row-start-2 tw-lp-button"
                >
                    Submit
                </button>
            </Form>
        </div>
    );
}
