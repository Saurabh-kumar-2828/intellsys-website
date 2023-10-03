// import type {ActionFunction} from "@remix-run/node";
// import {sendOtp} from "~/backend/authentication.server";
// import {getStringFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";

// export const action: ActionFunction = async ({request}) => {
//     const body = await request.formData();

//     const email = safeParse(getStringFromUnknown, body.get("email"));
//     const otp = safeParse(getStringFromUnknown, body.get("otp"));

//     // TODO: Do this properly

//     if (email == null) {
//         return new Response("Invalid input: 9e692b78-ca87-4c03-877f-1e53a6510523", {
//             status: 400,
//         });
//     }

//     if (otp == null) {
//         await sendOtp(email);

//         const actionData: ActionData = {
//             otpSent: true,
//             error: null,
//         };

//         return actionData;
//     } else {
//         const result = await verifyOtp(email, otp);

//         if (!result.success) {
//             const actionData: ActionData = {
//                 otpSent: false,
//                 error: "Invalid OTP",
//             };

//             return actionData;
//         } else {
//             // Ensure company is properly created
//             const domain = getDomainFromEmail(email);

//             let company = await getCompanyForDomain(domain);
//             // let wasCompanyJustCreated = false;
//             if (company instanceof Error) {
//                 return company;
//             }

//             if (company == null) {
//                 company = await createCompany(domain);
//                 if (company instanceof Error) {
//                     return company;
//                 }

//                 // wasCompanyJustCreated = true;
//             }

//             // Ensure user is properly created
//             let user = await getUserForEmail(email);
//             // let wasUserJustCreated = false;
//             if (user instanceof Error) {
//                 return user;
//             }

//             if (user == null) {
//                 user = await createUser(email, company);
//                 // Within createUser:
//                 //     - Create the user in table
//                 //     - Add the appropriate permissions for his own company

//                 // While sharing a page with a user that does not have an existing account,
//                 // ensure we give him appropriate access to his own company, and appropriate
//                 // access to the shared company
//                 if (user instanceof Error) {
//                     return user;
//                 }
//                 // wasUserJustCreated = true;
//             }

//             const cookieSession = await getCookieSession(request.headers.get("Cookie"));

//             const result = await getAccessTokenForUser(user.id);

//             cookieSession.set("accessToken", result.accessTokenJwt);

//             return redirect("/", {
//                 headers: {
//                     "Set-Cookie": await commitCookieSession(cookieSession),
//                 },
//             });
//         }
//     }
// };
