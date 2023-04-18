import {LoaderFunction, redirect} from "@remix-run/node";
import { getFacebookData } from "~/backend/utilities/data-management/facebookOAuth.server";


export const loader: LoaderFunction = async ({request, params}) => {

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    getFacebookData(companyId);
    return null;
}
