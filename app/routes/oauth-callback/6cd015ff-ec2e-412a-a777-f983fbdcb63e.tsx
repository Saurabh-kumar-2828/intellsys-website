import {RadioGroup} from "@headlessui/react";
import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {Form, Link, useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {CheckCircle, Circle} from "react-bootstrap-icons";
import {checkConnectorExistsForAccount} from "~/backend/utilities/connectors/common.server";
import type {GoogleAnalyticsAccessiblePropertyIds, GoogleAnalyticsCredentials} from "~/backend/utilities/connectors/googleAnalytics.server";
import {getAccessiblePropertyIds, ingestAndStoreGoogleAnalyticsData} from "~/backend/utilities/connectors/googleAnalytics.server";
import {getGoogleAdsRefreshToken} from "~/backend/utilities/connectors/googleOAuth.server";
import {decrypt, encrypt} from "~/backend/utilities/utilities.server";
import {PageScaffold2} from "~/components/pageScaffold2";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {VerticalSpacer} from "~/components/reusableComponents/verticalSpacer";
import {SectionHeader} from "~/components/scratchpad";
import type {Uuid} from "~/global-common-typescript/typeDefinitions";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {concatenateNonNullStringsWithSpaces, generateUuid, getNonEmptyStringOrNull} from "~/global-common-typescript/utilities/utilities";
import {getMemoryCache} from "~/utilities/memoryCache";
import {ConnectorType, DataSourceIds} from "~/utilities/typeDefinitions";


// Google analytics

// TODO: Keep only code part
type LoaderData = {
    data: string;
    accessiblePropertyIds: Array<GoogleAnalyticsAccessiblePropertyIds>;
    companyId: Uuid;
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;
    if(urlSearchParams == null){
        throw new Response(null, {status: 404});
    }

    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));
    const state = getNonEmptyStringOrNull(urlSearchParams.get("state"));

    const companyId = getUuidFromUnknown(state);
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }
    if (authorizationCode == null) {
        throw Error("Authorization failed!");
    }

    let refreshToken: string;

    const memoryCache = await getMemoryCache();

    const cacheKey = `${DataSourceIds.googleAds}: ${authorizationCode}`;
    const cachedValue = await memoryCache.get(cacheKey);
    if (cachedValue != null) {
        refreshToken = cachedValue;
    } else {
        const refreshToken_ = await getGoogleAdsRefreshToken(authorizationCode, getUuidFromUnknown(companyId), getUuidFromUnknown(ConnectorType.GoogleAnalytics));
        if (refreshToken_ instanceof Error) {
            throw refreshToken_;
        }
        await memoryCache.set(cacheKey, refreshToken_);
        refreshToken = refreshToken_;
    }


    const accessiblePropertyIds = await getAccessiblePropertyIds(refreshToken);
    if (accessiblePropertyIds instanceof Error) {
        throw accessiblePropertyIds;
    }

    // TODO: Filter accessible account

    // TODO: Get multiple accounts
    const loaderData: LoaderData = {
        data: encrypt(refreshToken) as unknown as string,
        accessiblePropertyIds: accessiblePropertyIds,
        companyId: companyId,
    };

    return json(loaderData);
};

export const action: ActionFunction = async ({request}) => {
    try {
        const urlSearchParams = new URL(request.url).searchParams;

        const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));
        const companyId = getNonEmptyStringOrNull(urlSearchParams.get("state"));

        if (companyId == null) {
            throw new Response(null, {status: 404});
        }

        const body = await request.formData();

        const data = body.get("data") as string;
        const selectedAccount = JSON.parse(body.get("selectedAccount") as string);

        // TODO: type validation
        const refreshTokenDecoded = decrypt(data);

        const accountExists = await checkConnectorExistsForAccount(getUuidFromUnknown(companyId), ConnectorType.GoogleAnalytics, selectedAccount.customerClientId);
        if (accountExists instanceof Error) {
            throw new Response(null, {status: 400, statusText: "Account already Exists!"});
        }

        // Cannot create new connector, if connector with account already exists.
        if (accountExists) {
            throw new Response(null, {status: 404, statusText: "Account already Exists!"});
        }

        const googleAnalyticsCredentials: GoogleAnalyticsCredentials = {
            propertyId: selectedAccount.propertyId,
            refreshToken: refreshTokenDecoded,
        };

        const connectorId = generateUuid();

        const response = await ingestAndStoreGoogleAnalyticsData(googleAnalyticsCredentials, getUuidFromUnknown(companyId), connectorId, {
            accountId: googleAnalyticsCredentials.propertyId,
            accountName: selectedAccount.displayName,
        });
        if (response instanceof Error) {
            throw response;
        }

        const memoryCache = await getMemoryCache();

        const cacheKey = `${DataSourceIds.googleAds}: ${authorizationCode}`;
        await memoryCache.delete(cacheKey);

        return redirect(`/${companyId}/6cd015ff-ec2e-412a-a777-f983fbdcb63e/${connectorId}`);
    } catch (e) {
        console.log(e);
    }

    return null;
};

export default function () {
    const {data, accessiblePropertyIds, companyId} = useLoaderData() as LoaderData;

    // const routeMatches = useMatches();
    // const {user, accessibleCompanies, currentCompany} = getSingletonValue(routeMatches.filter((routeMatch) => routeMatch.id == `routes/oauth-callback`)).data as CompanyLoaderData;

    return (
        <PageScaffold2>
            <OAuthCallback
                data={data}
                accessiblePropertyIds={accessiblePropertyIds}
                companyId={companyId}
                className="tw-row-start-2"
            />
        </PageScaffold2>
    );
}

function OAuthCallback({data, accessiblePropertyIds, companyId, className}: {data: string; accessiblePropertyIds: Array<GoogleAnalyticsAccessiblePropertyIds>; companyId: Uuid; className: string}) {
    const [selectedAccount, setSelectedAccount] = useState<GoogleAnalyticsAccessiblePropertyIds | null>(null);

    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-m-4 tw-grid tw-grid-auto-rows tw-gap-4 tw-justify-center", className)}>
            {accessiblePropertyIds.length == 0 ? (
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
                                items={accessiblePropertyIds}
                                itemBuilder={(item, itemIndex) => (
                                    <RadioGroup.Option
                                        value={item}
                                        key={itemIndex}
                                    >
                                        {({checked}) => (
                                            <div className="tw-pl-4 tw-pr-8 tw-py-[0.9375rem] tw-rounded-full tw-border-[0.0625rem] tw-border-solid tw-border-white tw-text-white tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-4 tw-items-center">
                                                {checked ? <CheckCircle className="tw-w-6 tw-h-6 tw-text-blue-500" /> : <Circle className="tw-w-6 tw-h-6 tw-text-blue-500" />}

                                                {`${item.propertyId}, ${item.displayName}`}
                                            </div>
                                        )}
                                    </RadioGroup.Option>
                                )}
                            />
                        </RadioGroup>

                        <Form
                            method="post"
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

                            <button
                                type="submit"
                                className="tw-row-start-2 tw-lp-button tw-place-self-center"
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
