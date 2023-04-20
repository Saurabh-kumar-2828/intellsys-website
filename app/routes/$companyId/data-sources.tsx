import { ActionFunction, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { getFacebookData, getRedirectUri } from "~/backend/utilities/data-management/facebookOAuth.server";

export let action: ActionFunction = async ({request, params}) => {
    const body = await request.formData();
    const companyId = params.companyId;
        if (companyId == null) {
            throw new Response(null, {status: 404});
        }

    if (body.get("action") == "facebook") {
        // TODO: Put this in env
        const scope = "ads_read, ads_management";
        const redirectUri = getRedirectUri(companyId);

        // TODO: Create function to get env variables
        const authUrl = `https://www.facebook.com/${process.env.FACEBOOK_API_VERSION!}/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID!}&redirect_uri=${redirectUri}&scope=${scope}`;

        return redirect(authUrl);

    } else if(body.get("action") == "google") {
        const scope = "https://www.googleapis.com/auth/adwords";
        const redirectUri = "http://localhost:3000/capture-authorization-code";

        const url = `https://accounts.google.com/o/oauth2/v2/auth?scope=${scope}&client_id=${process.env.GOOGLE_CLIENT_ID!}&response_type=code&redirect_uri=${redirectUri}&prompt=consent&access_type=offline&state=${companyId}`;
        
        return redirect(url);
    }

    return null;
}


export default function () {

    return (
        <div className="tw-grid tw-h-32 tw-grid-cols-3 tw-gap-1">
            <div className="tw-col-start-1">
                <Form method="post">
                    <input type="hidden" name="action" value="facebook" />
                    <button className="tw-lp-button tw-bg-blue-500">
                        Authorize Facebook Account
                    </button>
                </Form>
            </div>
            <div className="tw-col-start-2">
                <Form method="post">
                <input type="hidden" name="action" value="google" />
                    <button className="tw-lp-button tw-bg-blue-700">
                        Authorize Google Account
                    </button>
                </Form>
            </div>
        </div>
    )
}
