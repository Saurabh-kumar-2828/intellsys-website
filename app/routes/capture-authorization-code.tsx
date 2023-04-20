import {LoaderFunction, redirect} from "@remix-run/node";
import { baseUrl, facebookOAuthFlow } from "~/backend/utilities/data-management/facebookOAuth.server";
import { googleOAuthFlow } from "~/backend/utilities/data-management/googleOAuth.server";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";


export const loader: LoaderFunction = async ({request}) => {

    const urlSearchParams = new URL(request.url).searchParams;
    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"));
    const companyId = getNonEmptyStringOrNull(urlSearchParams.get("state"));

    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    if(authorizationCode!=null){
        googleOAuthFlow(authorizationCode, companyId);
    } else {
        throw Error("Authorization failed!");
    }

    return redirect(`${baseUrl}/${companyId}/data-sources`);
}
