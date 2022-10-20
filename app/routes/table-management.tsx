// import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import { Form, useLoaderData } from "@remix-run/react";
// import { getNameForTable, Table } from "~/backend/data-management";
// import { doesTableExist } from "~/backend/table-management";
// import { Card } from "~/components/scratchpad";
// import { dateToMediumEnFormat, numberToHumanFriendlyString } from "~/utilities/utilities";

// export const meta: MetaFunction = () => {
//     return {
//         title: "Table Management - Livpure Data Management",
//     };
// };

// export const action: ActionFunction = async ({request}) => {
//     const body = await request.formData();

//     const table = parseInt(body.get("table") as string) as Table;
//     const operation = parseInt(body.get("operation") as string) as Operation;

//     if (operation == Operation.drop) {
//         // await processFileUpload(table, file);
//     } else if (operation == Operation.create) {
//         // await processDelete(table, startDate, endDate);
//     } else {
//         throw new Response(null, {status: 400});
//     }

//     return null;
// };

// type LoaderData = {
//     shopifySalesRawExists: boolean;
//     freshsalesLeadsRawExists: boolean;
//     googleAdsRawExists: boolean;
//     facebookAdsRawExists: boolean;
//     websitePopupFormResponsesRawExists: boolean;
//     typeformResponsesMattressExists: boolean;
//     typeformResponsesWaterPurifierExists: boolean;
// };

// export const loader: LoaderFunction = async () => {
//     const loaderData: LoaderData = {
//         facebookAdsRawExists: await doesTableExist(getNameForTable(Table.facebookAdsRaw)),
//         freshsalesLeadsRawExists: await doesTableExist(getNameForTable(Table.freshsalesLeadsRaw)),
//         googleAdsRawExists: await doesTableExist(getNameForTable(Table.googleAdsRaw)),
//         shopifySalesRawExists: await doesTableExist(getNameForTable(Table.shopifySalesRaw)),
//         typeformResponsesMattressExists: await doesTableExist(getNameForTable(Table.typeformResponsesMattressRaw)),
//         typeformResponsesWaterPurifierExists: await doesTableExist(getNameForTable(Table.typeformResponsesWaterPurifierRaw)),
//         websitePopupFormResponsesRawExists: await doesTableExist(getNameForTable(Table.websitePopupFormResponsesRaw)),
//     };

//     return json(loaderData);
// };

// export default function () {
//     const {
//         shopifySalesRawExists,
//         freshsalesLeadsRawExists,
//         googleAdsRawExists,
//         facebookAdsRawExists,
//         websitePopupFormResponsesRawExists,
//         typeformResponsesMattressExists,
//         typeformResponsesWaterPurifierExists,
//     } = useLoaderData() as LoaderData;

//     return (
//         <div className="tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
//             <Form method="post" className="tw-col-span-3 tw-flex tw-flex-col tw-justify-center tw-items-stretch tw-gap-y-6">
//                 <input type="text" name="table" value="" readOnly className="tw-hidden" />
//                 <input type="text" name="operation" value={Operation.create} readOnly className="tw-hidden" />

//                 <button className="tw-lp-button">Create View</button>
//             </Form>
//         </div>
//     );
// }

// enum Operation {
//     drop,
//     create,
// }
