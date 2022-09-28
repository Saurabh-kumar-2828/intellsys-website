import type {MetaFunction} from "@remix-run/node";

export const meta: MetaFunction = () => {
    return {
        title: "Livpure Data Management",
    };
};

export default function () {
    return (
        <div className="tw-min-h-full tw-grid tw-grid-cols-12 tw-gap-x-6 tw-gap-y-6 tw-p-8">
            <div className="tw-col-span-12 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-y-4">
                <div className="tw-text-[3rem] tw-font-bold tw-text-primary">Livpure Data Management</div>
                <div className="tw-text-[1.5rem] tw-font-bold">Powered by <span className="tw-text-[#00a2ed]">Growth Jockey</span></div>
            </div>
        </div>
    );
}
