import {PostgresDatabaseManager, getNewDatabaseConnectionPool} from "~/global-common-typescript/server/postgresDatabaseManager.server";

export const loader = async () => {
    const z = await getNewDatabaseConnectionPool({
        dbHost: "3.109.189.227",
        dbName: "ab0c339a-8c39-42e2-8449-6b962cc184cb",
        dbPassword: "jXYQb$izEYP6j6QB",
        dbPort: "5432",
        dbUsername: "postgres",
    });
    if (z instanceof Error) {
        throw z;
    }
    const z2 = new PostgresDatabaseManager(z);
    const z3 = await z2.execute("SELECT NOW()");
    if (z3 instanceof Error) {
        console.log("ASDASDASD");
        throw z3;
    }
    console.log(z3);
    console.log("HFksdjhfgkjdfhgkjdfhg ");

    return null;
}

export default function() {
    return (
        <div className="tw-w-full tw-h-screen tw-bg-black tw-p-16">
            <div className="tw-grid tw-grid-cols-3 tw-grid-rows-[32px_auto_minmax(0,1fr)]">
                <div className="tw-col-start-2 tw-row-start-2 tw-bg-gray-800 tw-text-center">
                    test
                </div>
            </div>
        </div>
    );
}

function CardComponent1() {
    return (
        <div className="tw-w-full tw-h-60 tw-rounded-lg tw-bg-red-400" />
    );
}

function CardComponent2() {
    return (
        <div className="tw-w-full tw-h-60 tw-rounded-lg tw-bg-blue-400" />
    );
}
