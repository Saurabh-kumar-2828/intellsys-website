import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { processFileUpload } from "~/backend/utilities/data-management/shopifyAutomation.server";


export const loader: LoaderFunction = async ({request}) => {
    return null;
};

export const action: ActionFunction = async ({request}) => {
    const body = await request.formData();
    const file = body.getAll("file")[0] as File;
    processFileUpload(file);

    return null;
}

export default function(){
    return (
        <>
            <Form method="post" encType="multipart/form-data" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                <input type="file" name="file" accept="application/json" required />
                <button type="submit" className="tw-lp-button tw-w-40">
                    Upload JSON
                </button>
            </Form>
        </>
    )
}