// import {ActionFunction, json, MetaFunction} from "@remix-run/node";
// import {Form, useActionData} from "@remix-run/react";
// import React, {useEffect} from "react";
// import {processInitializeDataFromApi, Table} from "~/backend/data-management";
// import {updateDataFromFacebookOnFormsApi} from "~/backend/utilities/data-management/facebookOnFormAds.server";
// import {Card, DateDisplayingCard, errorToast, successToast} from "~/components/scratchpad";
// import {TimeZones} from "~/utilities/typeDefinitions";
// import {numberToHumanFriendlyString, dateToMediumNoneEnFormat} from "~/utilities/utilities";

// export const meta: MetaFunction = () => {
//     return {
//         title: "Data Management - Intellsys",
//     };
// };

// type ActionData = {
//     newLeadsCount: number | null;
//     error: string | null;
// };

// export const action: ActionFunction = async ({request}) => {
//     // const body = await request.formData();

//     let newLeadsCount: number | null;
//     try {
//         newLeadsCount = await updateDataFromFacebookOnFormsApi();
//     } catch (error) {
//         console.log("Error doing tasks");
//         console.log(error);

//         const actionData: ActionData = {
//             error: error.message,
//         };

//         return json(actionData);
//     }

//     const actionData: ActionData = {
//         newLeadsCount: newLeadsCount,
//         error: null,
//     };

//     return actionData;
// };

// export default function () {
//     const actionData = useActionData() as ActionData | null;

//     useEffect(() => {
//         if (actionData != null) {
//             if (actionData.error == null) {
//                 successToast(`Successfully loaded ${actionData.newLeadsCount} leads`);
//             } else {
//                 errorToast(actionData.error);
//             }
//         }
//     }, [actionData]);

//     return (
//         <div className="tw-grid tw-grid-cols-12 tw-gap-x-4 tw-gap-y-6 tw-p-8">
//             <>
//                 <div className="tw-col-span-12 tw-text-[3rem] tw-text-center">Facebook Onform leads</div>

//                 <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
//                     <input type="text" name="table" value={Table.facebookOnFormApi} readOnly className="tw-hidden" />
//                     <input type="text" name="operation" value={Operation.initialize} readOnly className="tw-hidden" />
//                     <input type="text" name="startDate" value={"2022-10-20T22:00:00Z"} readOnly className="tw-hidden" />

//                     <button className="tw-lp-button">Initialize data</button>
//                 </Form>
//             </>
//         </div>
//     );
// }
