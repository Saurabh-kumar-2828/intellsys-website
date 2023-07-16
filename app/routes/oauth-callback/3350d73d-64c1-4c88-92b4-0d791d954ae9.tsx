import {RadioGroup} from "@headlessui/react";
import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, Link, useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {CheckCircle, Circle} from "react-bootstrap-icons";
import {checkConnectorExistsForAccount} from "~/backend/utilities/connectors/common.server";
import type {FacebookAccessibleAccount, FacebookAdsSourceCredentials} from "~/backend/utilities/connectors/facebookOAuth.server";
import {facebookOAuthFlow, getAccessibleAccounts, getFacebookAdsAccessToken} from "~/backend/utilities/connectors/facebookOAuth.server";
import {decrypt, encrypt} from "~/backend/utilities/utilities.server";
import {PageScaffold2} from "~/components/pageScaffold2";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {SectionHeader} from "~/components/scratchpad";
import {HiddenFormField} from "~/global-common-typescript/components/hiddenFormField";
import {VerticalSpacer} from "~/global-common-typescript/components/verticalSpacer";
import {logBackendError} from "~/global-common-typescript/server/logging.server";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getErrorFromUnknown, getNonEmptyStringFromUnknown, getObjectFromUnknown, getUuidFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {getMemoryCache} from "~/utilities/memoryCache";
import {ConnectorType, DataSourceIds} from "~/utilities/typeDefinitions";

// Facebook ads

type LoaderData = {
    data: string;
    companyId: Uuid;
    accessibleAccounts: Array<FacebookAccessibleAccount>;
};

export const loader: LoaderFunction = async ({request, params}) => {
    try {
        const urlSearchParams = new URL(request.url).searchParams;

        const authorizationCode = safeParse(getNonEmptyStringFromUnknown, urlSearchParams.get("code"));
        const companyId = safeParse(getUuidFromUnknown, urlSearchParams.get("state"));

        if (companyId == null) {
            throw new Response(null, {status: 400});
        }

        if (authorizationCode == null) {
            throw Error("Authorization failed!");
        }

        let credentials: FacebookAdsSourceCredentials;

        const memoryCache = await getMemoryCache();

        const cacheKey = `${DataSourceIds.facebookAds}: ${authorizationCode}`;
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
    } catch (error_) {
        const error = getErrorFromUnknown(error_);
        logBackendError(error);
    }
};

export const action: ActionFunction = async ({request, params}) => {
    try {
        const urlSearchParams = new URL(request.url).searchParams;

        const authorizationCode = safeParse(getNonEmptyStringFromUnknown, urlSearchParams.get("code"));

        const body = await request.formData();

        const selectedAccount: FacebookAccessibleAccount = safeParse(getObjectFromUnknown, body.get("selectedAccount"));
        const data = safeParse(getNonEmptyStringFromUnknown, body.get("data"));
        const companyId = safeParse(getUuidFromUnknown, body.get("companyId"));

        if (selectedAccount == null || data == null || companyId == null) {
            throw new Response(null, {status: 400});
        }

        const dataDecoded = decrypt(data);

        // TODO: Confirm its implementation.
        const accountExists = await checkConnectorExistsForAccount(companyId, ConnectorType.FacebookAds, selectedAccount.accountId);
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
            const response = await facebookOAuthFlow(facebookAdsCredentials, companyId, connectorId, {
                accountId: facebookAdsCredentials.adAccountId,
                accountName: selectedAccount.accountName,
            });
            if (response instanceof Error) {
                throw response;
            }

            const memoryCache = await getMemoryCache();

            const cacheKey = `${DataSourceIds.facebookAds}: ${authorizationCode}`;
            await memoryCache.delete(cacheKey);

            return redirect(`/${companyId}/3350d73d-64c1-4c88-92b4-0d791d954ae9/${connectorId}`);
        }

        return null;
    } catch (error_) {
        const error = getErrorFromUnknown(error_);
        logBackendError(error);
    }
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
                <div className="tw-w-[100vw] tw-h-[calc(100vh-6rem)] tw-grid tw-items-center tw-justify-center tw-max-w-7xl">
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
                <div className="tw-grid tw-w-full tw-max-w-7xl tw-justify-center tw-min-w-[50vw]">
                    <div className="tw-w-full tw-min-w-[50vw]">
                        <SectionHeader label="Select an Account" />
                    </div>

                    <VerticalSpacer className="tw-h-8" />

                    <div className="tw-w-full tw-min-w-[50vw]">
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
                                            <div className="tw-p-4 tw-rounded-full tw-border-[0.0625rem] tw-border-solid tw-border-white tw-text-white tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-4 tw-items-center">
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

                    <VerticalSpacer className="tw-h-8" />

                    <div>
                        <Form
                            method="post"
                            className="tw-row-auto tw-grid"
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
                                className="tw-lp-button tw-items-center tw-place-self-center"
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
