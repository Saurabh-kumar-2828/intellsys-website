import { ActionFunction, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
export let action: ActionFunction = async ({request, params}) => {

    // TODO: Put this in env
    const scope = "ads_read, ads_management";

    const companyId = params.companyId;
    if (companyId == null) {
        throw new Response(null, {status: 404});
    }

    const redirectUri = `http://localhost:3000/${companyId}/capture-authorization-code`;

    const auth_url = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID!}&redirect_uri=${redirectUri}&scope=${scope}`;

    return redirect(auth_url)
}


export default function () {

    return (
        <div className="tw-h-32 tw-w-36">
            <Form method="post">
                <button className="tw-lp-button tw-bg-blue-500">
                    Authorize Facebook Account
                </button>
            </Form>
        </div>
    )
}
