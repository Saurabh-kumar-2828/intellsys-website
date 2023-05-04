import type {LoaderFunction} from "@remix-run/node";
import {getFacebookData} from "~/backend/utilities/data-management/facebookOAuth.server";
import {getGoogleData} from "~/backend/utilities/data-management/googleOAuth.server";
import {getUuidFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";

export const loader: LoaderFunction = async ({request, params}) => {
    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const companyIdToUuid = getUuidFromUnknown(companyId);

    await getFacebookData(companyIdToUuid);
    // getGoogleData(companyId);
    return null;
};
