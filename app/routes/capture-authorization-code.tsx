import type {LoaderFunction} from "@remix-run/node";
import {redirect} from "@remix-run/node";
import {googleOAuthFlow} from "~/backend/utilities/data-management/googleOAuth.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";

export const loader: LoaderFunction = async ({request}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));
    const companyId = getNonEmptyStringOrNull(urlSearchParams.get("state"));

    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    if (authorizationCode != null) {
        await googleOAuthFlow(authorizationCode, getUuidFromUnknown(companyId));
    } else {
        throw Error("Authorization failed!");
    }

    return redirect(`${process.env.REDIRECT_BASE_URI}/${companyId}/data-sources`);
};
