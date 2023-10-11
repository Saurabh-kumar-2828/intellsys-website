import {RadioGroup} from "@headlessui/react";
import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {CheckCircle, Circle, Link} from "react-bootstrap-icons";
import {checkConnectorExistsForAccount} from "~/backend/utilities/connectors/common.server";
import {ingestAndStoreGoogleAdsData} from "~/backend/utilities/connectors/googleAds.server";
import type {GoogleAdsAccessibleAccount, GoogleAdsCredentials} from "~/backend/utilities/connectors/googleOAuth.server";
import {getAccessibleAccounts, getGoogleAdsRefreshToken} from "~/backend/utilities/connectors/googleOAuth.server";
import {decrypt, encrypt} from "~/backend/utilities/utilities.server";
import {PageScaffold2} from "~/components/pageScaffold2";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {SectionHeader} from "~/components/scratchpad";
import {logBackendError} from "~/global-common-typescript/server/logging.server";
import type {Uuid} from "~/common--type-definitions/typeDefinitions";
import {getErrorFromUnknown, getNonEmptyStringFromUnknown, getObjectFromUnknown, getUuidFromUnknown, safeParse} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {getMemoryCache} from "~/utilities/memoryCache";
import {ConnectorType, DataSourceIds} from "~/utilities/typeDefinitions";

// Google ads

type LoaderData = {
    data: string;
    accessibleAccounts: Array<GoogleAdsAccessibleAccount>;
    companyId: Uuid;
};

export const loader: LoaderFunction = async ({request}) => {
    try {
        const urlSearchParams = new URL(request.url).searchParams;

        const authorizationCode = safeParse(getNonEmptyStringFromUnknown, urlSearchParams.get("code"));
        const companyId = safeParse(getNonEmptyStringFromUnknown, urlSearchParams.get("state"));
        if (authorizationCode == null || companyId == null) {
            throw new Response(null, {status: 400});
        }

        let refreshToken: string;

        const memoryCache = await getMemoryCache();

        const cacheKey = `${DataSourceIds.googleAnalytics}: ${authorizationCode}`;
        const cachedValue = await memoryCache.get(cacheKey);
        if (cachedValue != null) {
            refreshToken = cachedValue;
        } else {
            const refreshToken_ = await getGoogleAdsRefreshToken(authorizationCode, getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.GoogleAds));
            if (refreshToken_ instanceof Error) {
                throw refreshToken_;
            }
            await memoryCache.set(cacheKey, refreshToken_);
            refreshToken = refreshToken_;
        }

        const accessibleAccounts = await getAccessibleAccounts(refreshToken);
        if (accessibleAccounts instanceof Error) {
            throw accessibleAccounts;
        }

        // TODO: Filter accessible account

        // TODO: Get multiple accounts
        const loaderData: LoaderData = {
            data: encrypt(refreshToken),
            accessibleAccounts: accessibleAccounts,
            companyId: getUuidFromUnknown(companyId),
        };

        return json(loaderData);
    } catch (error_) {
        const error = getErrorFromUnknown(error_);
        logBackendError(error);

        throw error;
    }
};

export const action: ActionFunction = async ({request}) => {
    try {
        const urlSearchParams = new URL(request.url).searchParams;

        const authorizationCode = safeParse(getNonEmptyStringFromUnknown, urlSearchParams.get("code"));
        const companyId = safeParse(getUuidFromUnknown, urlSearchParams.get("state"));

        if (authorizationCode == null || companyId == null) {
            return new Response(null, {status: 400});
        }

        const body = await request.formData();

        const data = safeParse(getNonEmptyStringFromUnknown, body.get("data"));
        const selectedAccount = safeParse(getObjectFromUnknown, body.get("selectedAccount"));

        if (data == null || selectedAccount == null) {
            return new Response(null, {status: 400});
        }

        const refreshTokenDecoded = decrypt(data);

        const accountExists = await checkConnectorExistsForAccount(companyId, ConnectorType.GoogleAds, selectedAccount.customerClientId);
        if (accountExists instanceof Error) {
            return accountExists;
        }

        // Cannot create new connector, if connector with account already exists.
        if (accountExists) {
            return new Response(null, {status: 400, statusText: "Account already exists!"});
        }

        const googleAdsCredentials: GoogleAdsCredentials = {
            refreshToken: refreshTokenDecoded,
            googleAccountId: selectedAccount.customerClientId,
            googleLoginCustomerId: selectedAccount.managerId,
        };

        const connectorId = generateUuid();

        const response = await ingestAndStoreGoogleAdsData(googleAdsCredentials, companyId, connectorId, {
            accountId: googleAdsCredentials.googleAccountId,
            accountName: selectedAccount.customerClientName,
        });

        if (response instanceof Error) {
            return response;
        }

        const memoryCache = await getMemoryCache();

        const cacheKey = `${DataSourceIds.googleAnalytics}: ${authorizationCode}`;
        await memoryCache.delete(cacheKey);

        return redirect(`/${companyId}/0be2e81c-f5a7-41c6-bc34-6668088f7c4e/${connectorId}`);
    } catch (error_) {
        const error = getErrorFromUnknown(error_);
        logBackendError(error);
    }
};

export default function () {
    const {data, accessibleAccounts, companyId} = useLoaderData() as LoaderData;

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

function OAuthCallback({data, accessibleAccounts, companyId}: {data: string; accessibleAccounts: Array<GoogleAdsAccessibleAccount>; companyId: Uuid}) {
    const [selectedAccount, setSelectedAccount] = useState<GoogleAdsAccessibleAccount | null>(null);

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
                <div className="tw-grid tw-max-w-7xl tw-justify-center tw-min-w-[50vw] tw-w-full">
                    <div className="tw-w-full tw-min-w-[50vw]">
                        <SectionHeader label="Select an Account" />
                    </div>

                    <VerticalSpacer className="tw-h-8" />

                    <div className="tw-w-full tw-min-w-[50vw]">
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
                                            <div className="tw-pl-4 tw-pr-8 tw-py-[0.9375rem] tw-rounded-full tw-border-[0.0625rem] tw-border-solid tw-border-white tw-text-white tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-4 tw-items-center">
                                                {checked ? <CheckCircle className="tw-w-6 tw-h-6 tw-text-blue-500" /> : <Circle className="tw-w-6 tw-h-6 tw-text-blue-500" />}

                                                {`${item.customerClientName}, ${item.customerClientId}`}
                                            </div>
                                        )}
                                    </RadioGroup.Option>
                                )}
                            />
                        </RadioGroup>

                        <VerticalSpacer className="tw-h-8" />

                        <Form
                            method="POST"
                            className="tw-grid"
                        >
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
                                className="tw-row-start-2 tw-lp-button tw-place-self-center"
                            >
                                Submit
                            </button>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    );
}
