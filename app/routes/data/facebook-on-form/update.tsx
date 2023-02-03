import {ActionFunction, json, MetaFunction} from "@remix-run/node";
import {Form, useActionData} from "@remix-run/react";
import React, {useEffect} from "react";
import {processInitializeDataFromApi, Table} from "~/backend/data-management";
import {updateDataFromFacebookOnFormsApi} from "~/backend/utilities/data-management/facebookOnFormAds.server";
import {Card, DateDisplayingCard, errorToast, successToast} from "~/components/scratchpad";
import {TimeZones} from "~/utilities/typeDefinitions";
import {numberToHumanFriendlyString, dateToMediumNoneEnFormat} from "~/utilities/utilities";

export const meta: MetaFunction = () => {
    return {
        title: "Data Management - Intellsys",
    };
};

type ActionData = {
    idToCountOfLeads: {[formId: string]: number} | null;
    error: string | null;
};

export const action: ActionFunction = async ({request}) => {
    // const body = await request.formData();

    let idToCountOfLeads: {[formId: string]: number} | null;
    try {
        idToCountOfLeads = await updateDataFromFacebookOnFormsApi();
    } catch (error) {
        console.log("Error doing tasks");
        console.log(error);

        const actionData: ActionData = {
            idToCountOfLeads: null,
            error: error.message,
        };

        return json(actionData);
    }

    const actionData: ActionData = {
        idToCountOfLeads: idToCountOfLeads,
        error: null,
    };

    return actionData;
};

export default function () {
    const actionData = useActionData() as ActionData | null;

    useEffect(() => {
        if (actionData != null) {
            if (actionData.error == null) {
                let message = "";
                for (const kvp of Object.entries(actionData.idToCountOfLeads)) {
                    if (message.length != 0) {
                        message += "\n";
                    }
                    message += `Form ID ${kvp[0]}: Loaded ${kvp[1]} leads`
                }
                successToast(message);
            } else {
                errorToast(actionData.error);
            }
        }
    }, [actionData]);

    return (
        <div className="tw-grid tw-grid-cols-12 tw-gap-x-4 tw-gap-y-6 tw-p-8">
            <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Facebook Onform leads</div>

                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <button className="tw-lp-button">Update data</button>
                </Form>
            </>
        </div>
    );
}
