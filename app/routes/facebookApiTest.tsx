import {ActionFunction} from "@remix-run/node";
import {Form} from "@remix-run/react";
import {ingestDataFromFacebookApi} from "~/backend/utilities/data-management/facebookAds.server";

export const action: ActionFunction = async ({request}) => {
    const body = await request.formData();
    await ingestDataFromFacebookApi("2023-02-26 00:00:00");
    return null;
};

export default function () {
    return (
        <>
            <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                <input type="text" name="startDate" value={"2022-10-20T22:00:00Z"} readOnly className="tw-hidden" />
                <button className="tw-lp-button">Fetch Data From API</button>
            </Form>
        </>
    );
}
