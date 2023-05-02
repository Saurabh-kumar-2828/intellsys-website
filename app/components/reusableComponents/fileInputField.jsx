import {useState} from "react";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function FileInputField({className, name}) {
    const [selectedFile, setSelectedFile] = useState(null);

    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-w-full", className)}>
            <label className="tw-flex tw-text-fg tw-justify-center tw-w-full tw-h-32 tw-px-4 tw-transition tw-bg-dark-bg-500 tw-border-2 tw-border-gray-300 tw-border-dashed tw-rounded-md tw-appearance-none tw-cursor-pointer tw-hover:border-gray-400 tw-focus:outline-none">
                <span className="tw-flex tw-items-center tw-space-x-2">
                    <span>
                        {selectedFile != null ? (
                            selectedFile.name
                        ) : (
                            <span>
                                Drop Csv file to Attach, or <span className="tw-text-blue-400 tw-underline">browse</span>
                            </span>
                        )}
                    </span>
                </span>
                <input
                    type="file"
                    accept="text/csv,.csv"
                    required={true}
                    onChange={(e) => {
                        setSelectedFile(e.target.files[0]);
                    }}
                    className="tw-hidden"
                    name={name}
                />
            </label>
        </div>
    );
}
