import { ActionFunction, json, MetaFunction } from '@remix-run/node'
import { Form } from '@remix-run/react'
import React from 'react'
import { processInitializeDataFromApi, Table } from '~/backend/data-management'
import { Card, DateDisplayingCard } from '~/components/scratchpad'
import { TimeZones } from '~/utilities/typeDefinitions'
import { numberToHumanFriendlyString, dateToMediumNoneEnFormat } from '~/utilities/utilities'

export const meta: MetaFunction = () => {
    return {
        title: "Data Management - Intellsys",
    };
};

export const action: ActionFunction = async ({request}) => {
    const body = await request.formData();

    try {
        const table = parseInt(body.get("table") as string) as Table;
        const operation = parseInt(body.get("operation") as string) as Operation;

        if (operation == Operation.initialize) {
            const startDate = body.get("startDate") as string;
            // TODO: Remove null coalesce
            await processInitializeDataFromApi(table, startDate ?? "1990-01-01T00:00:00Z");
        } else {
            throw new Response(null, {status: 400});
        }
    } catch (error) {
        console.log("Error doing tasks");
        console.log(error);
        return json({
            error: error.message,
        });
    }

    return null;
};

export default function initialize() {
  return (
    <div className="tw-grid tw-grid-cols-12 tw-gap-x-4 tw-gap-y-6 tw-p-8">
        <>
                <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Facebook Onform leads</div>



                <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
                    <input type="text" name="table" value={Table.facebookOnFormAPI} readOnly className="tw-hidden" />
                    <input type="text" name="operation" value={Operation.initialize} readOnly className="tw-hidden" />
                    <input type="text" name="startDate" value={"2022-10-20T22:00:00Z"} readOnly className="tw-hidden" />

                    <button className="tw-lp-button">Initialize data</button>
                </Form>
            </>

    </div>
  )
}

enum Operation {
    upload,
    delete,
    truncate,
    refresh,
    ingestDataFromApi,
    initialize
}
