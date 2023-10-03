// import type {ActionFunction} from "@remix-run/node";
// import {sendOtp} from "~/backend/authentication.server";
// import {getStringFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";
// import type {GenericActionData} from "~/utilities/typeDefinitions";

// export const action: ActionFunction = async ({request}) => {
//     const body = await request.formData();

//     const email = getStringFromUnknown(body.get("email"));

//     // TODO: Do this properly

//     await sendOtp(email);

//     const actionData: GenericActionData = {
//         error: null,
//     };

//     return actionData;
// };
