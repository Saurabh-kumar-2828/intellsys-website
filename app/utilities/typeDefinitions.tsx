import type {Uuid as GlobalUuid} from "~/common--type-definitions/typeDefinitions";

// TODO: Add support for the concept of "has field been fetched" for better validation
export type User = {
    id: Uuid;
    email: string;
    name: string;
    // Mapping from companyId to sourceId
    privileges: {[companyId: Uuid]: Array<Uuid>};
};

export type Company = {
    id: Uuid;
    name: string;
    domain: string;
    databaseCredentialId: string;
};

export type Uuid = GlobalUuid;
// TODO: Rename type
export type Jwt = string;

export type Iso8601Time = string;
export type Iso8601Date = string;
export type Iso8601DateTime = string;

export type PhoneNumberWithCountryCode = string;
export type PhoneNumberWithoutCountryCode = string;

export enum ValueDisplayingCardInformationType {
    integer,
    float,
    percentage,
    text,
}

export enum TimeZones {
    UTC = "UTC",
    IST = "Asia/Kolkata",
}

export enum QueryFilterType {
    category,
    product,
    platform,
    campaign,
    date,
}

export function filterToTextColor(filterType: QueryFilterType) {
    if (filterType == QueryFilterType.category) {
        return "tw-text-red-500";
    } else if (filterType == QueryFilterType.product) {
        return "tw-text-blue-500";
    } else if (filterType == QueryFilterType.platform) {
        return "tw-text-green-500";
    } else if (filterType == QueryFilterType.campaign) {
        return "tw-text-purple-500";
    } else if (filterType == QueryFilterType.date) {
        return "tw-text-yellow-500";
    } else {
        throw new Error(`Unexpected value for QueryFilterType ${filterType}`);
    }
}

export function filterToHumanReadableString(filterType: QueryFilterType) {
    if (filterType == QueryFilterType.category) {
        return "Category";
    } else if (filterType == QueryFilterType.product) {
        return "Product";
    } else if (filterType == QueryFilterType.platform) {
        return "Platform";
    } else if (filterType == QueryFilterType.campaign) {
        return "Campaign";
    } else if (filterType == QueryFilterType.date) {
        return "Date";
    } else {
        throw new Error(`Unexpected value for QueryFilterType ${filterType}`);
    }
}

// Get it from intellsys-connectors
export const ConnectorType = {
    Freshsales: "3ec459aa-ecbd-4829-a89a-9d4284887a1a" as Uuid,
    GoogleAds: "800c28ce-43ea-44b8-b6fc-077f44566296" as Uuid,
    FacebookAds: "d80731db-155e-4a24-bc58-158a57edabd7" as Uuid,
    GoogleAnalytics: "cc991d2b-dc83-458e-8e8d-9b47164c735f" as Uuid,
};

// Get it from intellsys-connectors
export enum ConnectorTableType {
    FreshsalesContacts = "d56fd051-ae14-40b4-ab4b-ec449738d2ff",
    FreshsalesContactDetails = "b8936660-e580-4ab3-84f6-49b8a2342d0c",
    GoogleAds = "4cf54b5c-66eb-4eeb-9a84-71dc42635c13",
    FacebookAds = "169fbcec-811a-4e27-9ace-9087ee8cf3d5",
    GoogleAnalytics = "c9d5f4f9-630b-4e89-a886-23a6271d54c9",
}

// Get it from intellsys-connectors
export enum dataSourcesAbbreviations {
    googleAds = "gad",
    facebookAds = "fad",
    googleAnalytics = "ga",
}

// TODO: TEMP
export enum DataSourceIds {
    googleAds = "0be2e81c-f5a7-41c6-bc34-6668088f7c4e",
    facebookAds = "3350d73d-64c1-4c88-92b4-0d791d954ae9",
    googleAnalytics = "6cd015ff-ec2e-412a-a777-f983fbdcb63e",
}

export type GenericActionData = {
    error: string | null;
};
