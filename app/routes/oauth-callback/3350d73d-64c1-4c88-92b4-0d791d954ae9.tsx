import {RadioGroup} from "@headlessui/react";
import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {CheckCircle, Circle} from "react-bootstrap-icons";
import type {FacebookAccessibleAccount, FacebookAdsSourceCredentials} from "~/backend/utilities/data-management/facebookOAuth.server";
import {facebookOAuthFlow, getAccessibleAccounts, getFacebookAdsAccessToken} from "~/backend/utilities/data-management/facebookOAuth.server";
import {decrypt, encrypt} from "~/backend/utilities/utilities.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {SectionHeader} from "~/components/scratchpad";
import {HiddenFormField} from "~/global-common-typescript/components/hiddenFormField";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

type LoaderData = {
    data: string;
    companyId: Uuid;
    accessibleAccounts: Array<FacebookAccessibleAccount>;
};

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

    const credentials = await getFacebookAdsAccessToken(authorizationCode, getUuidFromUnknown(companyId));
    if (credentials instanceof Error) {
        throw new Response(null, {status: 404, statusText: "Invalid credentials!"});
    }

    const accessibleAccounts = await getAccessibleAccounts(credentials);

    const loaderData: LoaderData = {
        data: encrypt(credentials.facebookExchangeToken),
        companyId: companyId,
        accessibleAccounts: accessibleAccounts,
    };

    return json(loaderData);
};

export const action: ActionFunction = async ({request, params}) => {
    const body = await request.formData();

    const selectedAccount: FacebookAccessibleAccount = JSON.parse(body.get("selectedAccount") as string);
    const data = body.get("data") as string;
    const companyId = body.get("companyId") as string;

    if (selectedAccount == null || data == null || companyId == null) {
        throw new Response(null, {status: 404});
    }

    const dataDecoded = decrypt(data);

    // TODO: Confirm its implementation.
    // const accountExists = await checkIfFacebookAdsConnectorExistsForAccount(data);
    // if (accountExists instanceof Error) {
    //     return Error("Account already exists");
    // }

    // Cannot create new connector, if connector with account already exists.
    // if (accountExists) {
    //     return redirect(`/${companyId}/data-sources`);
    // }

    const facebookAdsCredentials: FacebookAdsSourceCredentials = {
        facebookExchangeToken: dataDecoded,
        adAccountId: selectedAccount.accountId,
    };

    const connectorId = generateUuid();

    if (data != null) {
        const response = await facebookOAuthFlow(facebookAdsCredentials, getUuidFromUnknown(companyId), connectorId);
        if (response instanceof Error) {
            throw response;
        }

        return redirect(`/${companyId}/3350d73d-64c1-4c88-92b4-0d791d954ae9/${connectorId}`);
    }

    return null;
};

export default function () {
    const {accessibleAccounts, data, companyId} = useLoaderData() as LoaderData;
    const [selectedAccount, setSelectedAccount] = useState("");

    return (
        <div className="tw-m-4 tw-grid tw-grid-auto-rows tw-gap-4">
            <div>
                <SectionHeader label="Select an Account" />
            </div>
            <div>
                <RadioGroup
                    name="selectedAccount"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e)}
                    className="tw-m-1 tw-row-start-1 tw-grid tw-grid-flow-row tw-content-center tw-gap-y-4"
                >
                    <ItemBuilder
                        items={accessibleAccounts}
                        itemBuilder={(item, itemIndex) => (
                            <RadioGroup.Option
                                value={item}
                                key={itemIndex}
                            >
                                {({checked}) => (
                                    <div className="tw-p-4 tw-rounded-full tw-border-[0.0625rem] tw-border-solid tw-border-white tw-text-white tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-2">
                                        {checked ? <CheckCircle className="tw-w-6 tw-h-6 tw-text-blue-500" /> : <Circle className="tw-w-6 tw-h-6 tw-text-blue-500" />}

                                        {`${item.accountId}, ${item.businessName}`}
                                    </div>
                                )}
                            </RadioGroup.Option>
                        )}
                    />
                </RadioGroup>
            </div>

            <div>
                <form method="post tw-row-auto">
                    <HiddenFormField
                        name="selectedAccount"
                        value={selectedAccount ? JSON.stringify(selectedAccount) : ""}
                    />

                    <HiddenFormField
                        name="data"
                        value={data}
                    />

                    <HiddenFormField
                        name="companyId"
                        value={companyId}
                    />

                    <button
                        type="submit"
                        className="tw-lp-button tw-items-center"
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}
