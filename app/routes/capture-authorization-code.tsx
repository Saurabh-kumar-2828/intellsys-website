// TODO: Keep only code part

import type {ActionFunction, LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {GoogleAdsCredentials, getGoogleAdsRefreshToken, ingestAndStoreGoogleAdsData, storeGoogleAdsOAuthDetails} from "~/backend/utilities/data-management/googleOAuth.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";
import type {Jwt} from "jsonwebtoken";
import jwt from "jsonwebtoken";
import {getRequiredEnvironmentVariable} from "~/backend/utilities/utilities.server";

type LoaderData = {
    accessTokenJwt: string
};

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));
    const companyId = getNonEmptyStringOrNull(urlSearchParams.get("state"));

    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    if(authorizationCode == null){
        throw Error("Authorization failed!");
    }

    const refreshToken = await getGoogleAdsRefreshToken(authorizationCode, getUuidFromUnknown(companyId));
    if (refreshToken instanceof Error) {
        return refreshToken;
    }

    // TODO: Get multiple accounts
    return json({
        accessTokenJwt: jwt.sign(refreshToken, getRequiredEnvironmentVariable("TOKEN_SECRET")) as any as Jwt,
    });

};

export const action: ActionFunction = async ({request}) => {
    try {
        const urlSearchParams = new URL(request.url).searchParams;

        const companyId = getNonEmptyStringOrNull(urlSearchParams.get("state"));

        if (companyId == null) {
            throw new Response(null, {status: 404});
        }

        const body = await request.formData();

        const googleAccountId = body.get("googleAccountId") as string;

        const googleLoginCustomerId = body.get("googleLoginCustomerId") as string;
        const googleAdsCredentials = body.get("googleAdsCredentials") as string;

        const credentialsDecoded = jwt.verify(googleAdsCredentials, getRequiredEnvironmentVariable("TOKEN_SECRET")) as GoogleAdsCredentials;

        credentialsDecoded.googleAccountId = googleAccountId;
        credentialsDecoded.googleLoginCustomerId = googleLoginCustomerId;

        const credentialsJwt = jwt.sign(credentialsDecoded, getRequiredEnvironmentVariable("TOKEN_SECRET")) as any as string

        await ingestAndStoreGoogleAdsData(credentialsJwt, getUuidFromUnknown(companyId));

        return redirect(`/${companyId}/data-sources`);

    } catch (e) {
        console.log(e);
    }

    return null;
}

export default function () {
    const refreshToken = useLoaderData<LoaderData>();

    return (
        <div>
            <form method="post" className="tw-grid tw-grid-rows-auto tw-gap-y-2 tw-p-10">
                <div className="tw-row-start-1">
                    <div className="tw-grid tw-grid-cols-2 tw-gap-[1px]">
                        <div className="tw-col-start-1">
                            <label>Google Account ID</label>
                        </div>
                        <div className="tw-col-start-2">
                            <input type="text" name="googleAccountId" required />
                        </div>
                    </div>

                </div>
                <div className="tw-row-start-2">
                    <div className="tw-grid tw-grid-cols-2 tw-gap-default">
                        <div className="tw-col-start-1">
                            <label>Google Login Cusotmer ID</label>
                        </div>
                        <div className="tw-col-start-2">
                            <input type="text" name="googleLoginCustomerId" required />

                            {/* Add toast if accesstoken not available */}

                            <input type="text" name="googleAdsCredentials" value={refreshToken.accessTokenJwt} hidden />
                        </div>
                    </div>
                </div>
                <div className="tw-row-start-3">
                    <button type="submit" className="tw-lp-button">Submit</button>
                </div>
            </form>
        </div>
    )
}
