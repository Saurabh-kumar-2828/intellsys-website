import jwt_decode from "jwt-decode";
import {getSession} from "~/backend/utilities/sessions.server";
import {User} from "~/utilities/typeDefinitions";

export async function getAccessToken(request: Request): Promise<null | {userId: string, schemaVersion: string}> {
    const session = await getSession(request.headers.get("Cookie"));

    // TODO: Ensure the accessToken is still valid, otherwise redirect user to a page to regenerate accessToken from refreshToken and so on
    if (!session.has("accessToken")) {
        return null;
    }

    const accessToken = session.get("accessToken");
    if (accessToken == null || accessToken.length == 0) {
        return null;
    }

    const accessTokenDecoded = jwt_decode(accessToken);

    // TODO: Add additional checks for integrity/structure of token?

    return accessTokenDecoded;
}

export async function getAuthenticatedUserDetails(
    request: Request,
    requestedFields?: {
        // phoneNumber?: boolean;
        // name?: boolean;
        // emailId?: boolean;
    }
): Promise<User | null> {
    const accessToken = await getAccessToken(request);
    if (accessToken == null) {
        return null;
    }

    const userId = accessToken.userId;

    const userDetails: User = {
        id: userId,
    };

    // if (requestedFields != null && (
    //     requestedFields.phoneNumber ||
    //     requestedFields.name ||
    //     requestedFields.emailId ||
    // )) {
    //     const userDetailsFromDatabase = await getUserDetailsFromDatabase(userId);

    //     // TODO: Do this check outside the if?
    //     if (userDetailsFromDatabase == null) {
    //         return null;
    //     }

    //     if (requestedFields.phoneNumber) {
    //         // Handle undefined values, empty values
    //         userDetails.phoneNumber = userDetailsFromDatabase.phoneNumber;
    //     }

    //     if (requestedFields.name) {
    //         // Handle undefined values, empty values
    //         userDetails.name = userDetailsFromDatabase.name;
    //     }

    //     if (requestedFields.emailId) {
    //         // Handle undefined values, empty values
    //         userDetails.emailId = userDetailsFromDatabase.emailId;
    //     }

    //     if (requestedFields.addressLine1) {
    //         // Handle undefined values, empty values
    //         userDetails.addressLine1 = userDetailsFromDatabase.addressLine1;
    //     }

    //     if (requestedFields.addressLine2) {
    //         // Handle undefined values, empty values
    //         userDetails.addressLine2 = userDetailsFromDatabase.addressLine2;
    //     }

    //     if (requestedFields.city) {
    //         // Handle undefined values, empty values
    //         userDetails.city = userDetailsFromDatabase.city;
    //     }

    //     if (requestedFields.state) {
    //         // Handle undefined values, empty values
    //         userDetails.state = userDetailsFromDatabase.state;
    //     }

    //     if (requestedFields.pinCode) {
    //         // Handle undefined values, empty values
    //         userDetails.pinCode = userDetailsFromDatabase.pinCode;
    //     }

    //     if (requestedFields.panCardNumber) {
    //         // Handle undefined values, empty values
    //         userDetails.panCardNumber = userDetailsFromDatabase.panCardNumber;
    //     }

    //     if (requestedFields.panCardVerificationStatus) {
    //         // Handle undefined values, empty values
    //         userDetails.panCardVerificationStatus = userDetailsFromDatabase.panCardVerificationStatus;
    //     }

    //     if (requestedFields.drivingLicenseNumber) {
    //         // Handle undefined values, empty values
    //         userDetails.drivingLicenseNumber = userDetailsFromDatabase.drivingLicenseNumber;
    //     }

    //     if (requestedFields.drivingLicenseVerificationStatus) {
    //         // Handle undefined values, empty values
    //         userDetails.drivingLicenseVerificationStatus = userDetailsFromDatabase.drivingLicenseVerificationStatus;
    //     }
    // }

    return userDetails;
}
