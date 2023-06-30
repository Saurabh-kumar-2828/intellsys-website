import {RadioGroup} from "@headlessui/react";
import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, Link, useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {ArrowLeft, CheckCircle, Circle} from "react-bootstrap-icons";
import {checkConnectorExistsForAccount} from "~/backend/utilities/connectors/common.server";
import type {FacebookAccessibleAccount, FacebookAdsSourceCredentials} from "~/backend/utilities/connectors/facebookOAuth.server";
import {facebookOAuthFlow, getAccessibleAccounts, getFacebookAdsAccessToken} from "~/backend/utilities/connectors/facebookOAuth.server";
import {decrypt, encrypt} from "~/backend/utilities/utilities.server";
import {PageScaffold2} from "~/components/pageScaffold2";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {SectionHeader} from "~/components/scratchpad";
import {HiddenFormField} from "~/global-common-typescript/components/hiddenFormField";
import {VerticalSpacer} from "~/global-common-typescript/components/verticalSpacer";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {getMemoryCache} from "~/utilities/memoryCache";
import {ConnectorType} from "~/utilities/typeDefinitions";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

// Facebook ads

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

    let credentials: FacebookAdsSourceCredentials;

    const memoryCache = await getMemoryCache();

    const cacheKey = `3350d73d-64c1-4c88-92b4-0d791d954ae9: ${authorizationCode}`;
    const cachedValue = await memoryCache.get(cacheKey);
    if (cachedValue != null) {
        credentials = {
            facebookExchangeToken: cachedValue,
        };
    } else {
        const credentials_ = await getFacebookAdsAccessToken(authorizationCode, getUuidFromUnknown(companyId));
        if (credentials_ instanceof Error) {
            throw new Response(null, {status: 404, statusText: "Invalid credentials!"});
        }
        await memoryCache.set(cacheKey, credentials_.facebookExchangeToken);
        credentials = credentials_;
    }

    const accessibleAccounts = await getAccessibleAccounts(credentials, companyId);
    if (accessibleAccounts instanceof Error) {
        throw new Response(null, {status: 404, statusText: "No Accessible Accounts!"});
    }

    const loaderData: LoaderData = {
        data: encrypt(credentials.facebookExchangeToken),
        companyId: companyId,
        accessibleAccounts: accessibleAccounts,
    };

    return json(loaderData);
};

export const action: ActionFunction = async ({request, params}) => {
    const urlSearchParams = new URL(request.url).searchParams;
    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));

    const body = await request.formData();

    const selectedAccount: FacebookAccessibleAccount = JSON.parse(body.get("selectedAccount") as string);
    const data = body.get("data") as string;
    const companyId = body.get("companyId") as string;

    if (selectedAccount == null || data == null || companyId == null) {
        throw new Response(null, {status: 404});
    }

    const dataDecoded = decrypt(data);

    // TODO: Confirm its implementation.
    const accountExists = await checkConnectorExistsForAccount(getUuidFromUnknown(companyId), ConnectorType.FacebookAds, selectedAccount.accountId);
    if (accountExists instanceof Error) {
        throw Error("Account already exists");
    }

    // Cannot create new connector, if connector with account already exists.
    if (accountExists) {
        throw new Response(null, {status: 400, statusText: "Account already Exists!"});
    }

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

        const memoryCache = await getMemoryCache();

        const cacheKey = `3350d73d-64c1-4c88-92b4-0d791d954ae9: ${authorizationCode}`;
        await memoryCache.delete(cacheKey);

        return redirect(`/${companyId}/3350d73d-64c1-4c88-92b4-0d791d954ae9/${connectorId}`);
    }

    return null;
};

export default function () {
    const {accessibleAccounts, data, companyId} = useLoaderData() as LoaderData;

    return (
        <PageScaffold2>
            <OAuthCallback
                data={data}
                accessibleAccounts={accessibleAccounts}
                companyId={companyId}
            />
        </PageScaffold2>
    );
}

function OAuthCallback({accessibleAccounts, data, companyId}: {data: string; companyId: Uuid; accessibleAccounts: Array<FacebookAccessibleAccount>}) {
    const [selectedAccount, setSelectedAccount] = useState("");

    return (
        <div className="tw-m-4 tw-grid tw-grid-auto-rows tw-gap-4 tw-justify-center">
            {accessibleAccounts.length == 0 ? (
                <div className="tw-w-[100vw] tw-h-[100vh] tw-grid tw-items-center tw-justify-center tw-max-w-7xl">
                    <div className="tw-grid">
                        <div className="tw-font-h1-400 tw-row-start-1">No Account Found, Please login with different account.</div>

                        <VerticalSpacer className="tw-h-8 tw-row-start-2" />

                        <Link
                            to={`/${companyId}/data-sources`}
                            className="tw-font-1rem tw-row-start-3 tw-flex tw-flex-row tw-gap-[2px] tw-items-center tw-text-center"
                        >
                            Click Here to go back to <span className="hover:tw-underline tw-underline-offset-4">data sources</span>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="tw-grid tw-max-w-7xl tw-justify-center">
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
                                        disabled={item.disable}
                                    >
                                        {({checked}) => (
                                            <div className="tw-p-4 tw-rounded-full tw-border-[0.0625rem] tw-border-solid tw-border-white tw-text-white tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-2">
                                                {checked ? (
                                                    <CheckCircle className="tw-w-6 tw-h-6 tw-text-blue-500" />
                                                ) : (
                                                    <Circle className={`tw-w-6 tw-h-6 tw-text-blue-500 ${item.disable ? "disabled:tw-text-gray-500" : ""}`} />
                                                )}

                                                {`${item.accountId}, ${item.accountName}`}
                                            </div>
                                        )}
                                    </RadioGroup.Option>
                                )}
                            />
                        </RadioGroup>
                    </div>

                    <div>
                        <Form
                            method="post"
                            className="tw-row-auto"
                        >
                            <HiddenFormField
                                name="selectedAccount"
                                value={selectedAccount ? JSON.stringify(selectedAccount) : ""}
                                required
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
                                Proceed
                            </button>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    );
}
