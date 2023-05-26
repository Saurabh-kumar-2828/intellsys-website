import type {Uuid as GlobalUuid} from "~/global-common-typescript/typeDefinitions";

// TODO: Add support for the concept of "has field been fetched" for better validation
export type User = {
    id: Uuid;
    name: string;
    privileges: Array<Uuid>;
}

export type Company = {
    id: Uuid;
    name: string;
    pages: Array<string> | null;
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


export const CredentialType:{[key: string]: Uuid} = {
    FacebookAds: "c32d8b45-92fe-44f6-8b61-42c2107dfe87" as Uuid,
    GoogleAds: "76fc1962-628f-4e53-898b-9c85c362bf11" as Uuid,
    DatabaseNew: "adac3858-fab9-4d36-8bb4-1e3a09247f87" as Uuid,
    DatabaseOld: "ac200d5a-cabf-4484-8d84-f96e05a7bef9" as Uuid
}

export const Companies:{[key: string]: Uuid} =  {
    Intellsys: "",
    Livpure: "833e5ca8-249d-4486-97e8-95cc576f0484" as Uuid,
    Livguard: "84589528-ef5e-46b2-90bd-96b6e2d206ce" as Uuid,
    Lectrix: "ba3033ba-32a8-49f7-b2bf-16c3be6d331a" as Uuid,
    IntellsysRaw: "12176c01-616e-4308-b635-2fff6a481f90" as Uuid // For product and campaign library
};

export const companyDatabaseCredentialsMap: {[key: string]: Uuid} = {
    [Companies.Intellsys]: "24292254-f51b-40e5-b450-e70949876332" as Uuid,
    [Companies.Livpure]:  "f8d430d0-6761-43c0-bf73-c606e37629e1" as Uuid,
    [Companies.Lectrix]: "1dbe5ecb-6ade-4a38-a46b-502f42d65d73" as Uuid,
    [Companies.IntellsysRaw]: "4447787a-f311-43e7-b21c-665ce8b9c52e" as Uuid
};

// Get it from intellsys-connectors
export enum ConnectorType {
    Freshsales = "3ec459aa-ecbd-4829-a89a-9d4284887a1a",
    GoogleAds = "800c28ce-43ea-44b8-b6fc-077f44566296",
    FacebookAds = "d80731db-155e-4a24-bc58-158a57edabd7"
};

export enum ConnectorTableType {
    FreshsalesContacts = "d56fd051-ae14-40b4-ab4b-ec449738d2ff",
    FreshsalesContactDetails = "b8936660-e580-4ab3-84f6-49b8a2342d0c",
    GoogleAds = "4cf54b5c-66eb-4eeb-9a84-71dc42635c13",
    FacebookAds = "169fbcec-811a-4e27-9ace-9087ee8cf3d5"
};

export enum dataSourcesAbbreviations {
    googleAds = "GAD",
}