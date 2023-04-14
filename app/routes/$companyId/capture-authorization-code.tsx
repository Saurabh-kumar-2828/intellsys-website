import {LoaderFunction, redirect} from "@remix-run/node";
import {getAccessToken} from "~/backend/utilities/data-management/facebookOAuth.server";
import {getNonEmptyStringOrNull} from "~/utilities/utilities";


export const loader: LoaderFunction = async ({request, params}) => {
    const urlSearchParams = new URL(request.url).searchParams;

    const authorizationCode = getNonEmptyStringOrNull(urlSearchParams.get("code"))
    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    if(authorizationCode!=null){
        getAccessToken(authorizationCode, companyId)
    }

    return redirect(`http://localhost:3000/${companyId}/facebook-oauth`);
}
