import {RadioGroup} from "@headlessui/react";
import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {useState} from "react";
import {CheckCircle, Circle} from "react-bootstrap-icons";
import type {AccessibleAccount, GoogleAdsCredentials} from "~/backend/utilities/data-management/googleOAuth.server";
import {checkGoogleAdsConnectorExistsForAccount, getAccessibleAccounts, ingestAndStoreGoogleAdsData} from "~/backend/utilities/data-management/googleOAuth.server";
import {decrypt, encrypt, getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {generateUuid} from "~/global-common-typescript/utilities/utilities";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

// TODO: Keep only code part

type LoaderData = {
    data: string;
    accessibleAccounts: Array<AccessibleAccount>;
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

    const refreshToken = "1//0gn4awgQ5Ht5gCgYIARAAGBASNwF-L9Ir3fFP9-9QPpcxSW4eqZMkkmHKdsPfnTAN1t2uoO2-lmigeL7J5NK5HFcb0NJSQMBrbaE";
    // const refreshToken = await getGoogleAdsRefreshToken(authorizationCode, getUuidFromUnknown(companyId));
    // if (refreshToken instanceof Error) {
    //     return refreshToken;
    // }

    const accessibleAccounts = await getAccessibleAccounts(refreshToken);
    if (accessibleAccounts instanceof Error) {
        return accessibleAccounts;
    }

    // TODO: Get multiple accounts
    const loaderData: LoaderData = {
        data: encrypt(refreshToken),
        accessibleAccounts: accessibleAccounts,
    };

    return json(loaderData);
};

export const action: ActionFunction = async ({request}) => {
    try {
        const urlSearchParams = new URL(request.url).searchParams;

        const companyId = getNonEmptyStringOrNull(urlSearchParams.get("pstate"));

        if (companyId == null) {
            throw new Response(null, {status: 404});
        }

        const body = await request.formData();

        const data = body.get("data") as string;
        const selectedAccount = JSON.parse(body.get("selectedAccount") as string);

        // TODO: type validation
        const refreshTokenDecoded = decrypt(data);

        const accountExists = await checkGoogleAdsConnectorExistsForAccount(selectedAccount.managerId);
        if (accountExists instanceof Error) {
            return Error("Account already exists");
        }

        // Cannot create new connector, if connector with account already exists.
        if (accountExists) {
            return redirect(`/${companyId}/data-sources`);
        }

        const googleAdsCredentials: GoogleAdsCredentials = {
            refreshToken: refreshTokenDecoded,
            googleAccountId: selectedAccount.customerClientId,
            googleLoginCustomerId: selectedAccount.managerId,
        };

        // TODO: Remove jwt thingy
        const credentialsJwt = jwt.sign(googleAdsCredentials, getRequiredEnvironmentVariable("JWT_SECRET")) as any as string;

        const connectorId = generateUuid();

        const response = await ingestAndStoreGoogleAdsData(credentialsJwt, getUuidFromUnknown(companyId), connectorId);
        if (response instanceof Error) {
            throw response;
        }

        return redirect(`/${companyId}/data-sources/googleAds/${connectorId}`);
    } catch (e) {
        console.log(e);
    }

    return null;
};

export default function () {
    const {data, accessibleAccounts} = useLoaderData<LoaderData>();
    const [selectedAccount, setSelectedAccount] = useState<AccessibleAccount>();

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
                    name="data"
                    value={data}
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
