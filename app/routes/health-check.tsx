import {json, type LoaderFunction} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import healthCheck from "~/healthCheck.json";

type LoaderData = {
    deploymentTime: string;
    commitId: string;
};

export const loader: LoaderFunction = async ({request}) => {
    // TODO: Add encryption

    const loaderData: LoaderData = {
        deploymentTime: healthCheck.deploymentTime ?? null,
        commitId: healthCheck.commitId ?? null,
    };

    return json(loaderData);
};

// TODO: Add meta to disable robot crawling

export default function Component() {
    const {deploymentTime, commitId} = useLoaderData() as LoaderData;

    return (
        <div>
            <div>{deploymentTime}</div>
            <div>{commitId}</div>
        </div>
    );
}
