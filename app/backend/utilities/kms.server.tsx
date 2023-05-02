import {Uuid} from "global-common-typescript/typeDefinitions";

type Credential = {
    error?: string;
    id?: string;
    credential?: string;
} & ({error: string; id?: undefined; credential?: undefined} | {error?: undefined; id: string; credential: string});

export async function getCredentialsFromKms(id: string): Promise<string | Error> {
    try {
        // TODO: Make seperate function to get credential
        const url = `${process.env.KMS_SERVER_URL}/get-credential?id=${id}`;

        const headers = new Headers();
        const auth = `intellsys:${process.env.INTELLSYS_PASSWORD!}`;
        const encodedAuth = Buffer.from(auth).toString("base64");
        headers.set("Authorization", `Basic ${encodedAuth}`);

        const response = await fetch(url, {
            method: "GET",
            headers: headers,
        });

        const credentialsRaw: Credential = await response.json();
        if (credentialsRaw.error != undefined) {
            return Error(credentialsRaw.error);
        }

        // TODO: Add type

        return credentialsRaw.credential;
    } catch (e) {
        return Error("Failed to fetch credentials from KMS");
    }
}

export async function addCredentialsToKms(id: string, credential: any): Promise<string | Error> {
    const url = `${process.env.KMS_SERVER_URL}/set-credential`;

    const headers = new Headers();
    const auth = `intellsys:${process.env.INTELLSYS_PASSWORD!}`;
    const encodedAuth = Buffer.from(auth).toString("base64");
    headers.set("Authorization", `Basic ${encodedAuth}`);

    const formData = new FormData();
    formData.append("id", id);
    formData.append("credential", JSON.stringify(credential));

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: formData,
    });

    const credentialsRaw = await response.json();
    return credentialsRaw;
}

export async function updateCredentialsInKms(id: string, credential: any): Promise<string | Error> {
    const url = `${process.env.KMS_SERVER_URL}/update-credential`;

    const headers = new Headers();
    const auth = `intellsys:${process.env.INTELLSYS_PASSWORD!}`;
    const encodedAuth = Buffer.from(auth).toString("base64");
    headers.set("Authorization", `Basic ${encodedAuth}`);

    const formData = new FormData();
    formData.append("id", id);
    formData.append("credential", JSON.stringify(credential));

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: formData,
    });

    const credentialsRaw = await response.json();
    return credentialsRaw;
}
