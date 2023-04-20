import {LoaderFunction, redirect} from "@remix-run/node";
import { baseUrl, facebookOAuthFlow } from "~/backend/utilities/data-management/facebookOAuth.server";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";


export const loader: LoaderFunction = async ({request, params}) => {

    const urlSearchParams = new URL(request.url).searchParams;

    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"))

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    console.log(companyId);
    if(authorizationCode!=null){
        facebookOAuthFlow(authorizationCode, companyId)
    }

    return redirect(`${baseUrl}/${companyId}/data-sources`);
}
