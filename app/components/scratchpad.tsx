import {useState} from "react";
import {ChevronDown, Clipboard, InfoCircle, RecordCircle} from "react-bootstrap-icons";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";
import {Listbox} from "@headlessui/react";

export function FancySearchableSelect(props: {id: string; className?: string; placeholder: string; options: Array<string>; label: string, selectedOption; setSelectedOption}) {
    return (
        <div className={props.className}>
            <Listbox value={props.selectedOption} onChange={props.setSelectedOption}>
                <Listbox.Button>
                    <div className="tw-bg-lp tw-p-2 tw-rounded-md tw-text-left">
                        <b>{props.label}</b>{props.selectedOption == null ? null : `: ${props.selectedOption}`}
                    </div>
                </Listbox.Button>

                <Listbox.Options className="tw-w-fit tw-absolute tw-top-16 tw-bg-lp tw-rounded-md tw-max-h-[calc(100vh_-_10rem)] tw-overflow-auto">
                    {props.options.map((option, optionIndex) => (
                        <Listbox.Option value={option} key={optionIndex} className="tw-p-2 tw-cursor-pointer">
                            <div className={props.selectedOption == option ? "tw-text-white tw-font-bold" : "tw-text-fg"}>{option}</div>
                        </Listbox.Option>
                    ))}
                </Listbox.Options>
            </Listbox>
        </div>
    );
}

export function FancySearchableMultiSelect(props: {id: string; className?: string; placeholder: string; options: Array<string>; label: string, selectedOptions; setSelectedOptions}) {
    return (
        <div className={props.className}>
            <Listbox value={props.selectedOptions} onChange={props.setSelectedOptions} multiple>
                <Listbox.Button>
                    <div className="tw-bg-lp tw-p-2 tw-rounded-md tw-text-left">
                        <b>{props.label}</b>{props.selectedOptions.length == 0 ? null : `: ${props.selectedOptions.join(", ")}`}
                    </div>
                </Listbox.Button>

                <Listbox.Options className="tw-w-fit tw-absolute tw-top-16 tw-bg-lp tw-rounded-md tw-max-h-[calc(100vh_-_10rem)] tw-overflow-auto">
                    {props.options.map((option, optionIndex) => (
                        <Listbox.Option value={option} key={optionIndex} className="tw-p-2 tw-cursor-pointer">
                            <div className={props.selectedOptions.includes(option) ? "tw-text-white tw-font-bold" : "tw-text-fg"}>{option}</div>
                        </Listbox.Option>
                    ))}
                </Listbox.Options>
            </Listbox>
        </div>
    );
}

export function FancyCalendar(props: {label, value, setValue}) {
    return (
        <div className="tw-flex tw-flex-row tw-items-center tw-bg-lp tw-p-2 tw-gap-x-1">
            <div>
                {props.label}:
            </div>
            <input type="date" value={props.value} onChange={e => props.setValue(e.target.value)} className="tw-bg-lp" />
        </div>
    );
}

export function Card(props: {information: string, label: string, className?: string, metaQuery?: string, metaInformation?: string}) {
    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-relative tw-overflow-auto tw-bg-bg-100 tw-p-4 tw-grid tw-grid-cols-1 tw-content-center tw-text-center", props.className)} title={props.information}>
            {props.metaInformation == null && props.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-bg-bg-400 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.metaInformation == null ? null : (
                        <InfoCircle title={props.metaInformation} className="tw-w-4 tw-h-4 tw-cursor-help" />
                    )}

                    {props.metaQuery == null ? null : (
                        <button title={props.metaQuery} onClick={e => navigator.clipboard.writeText(props.metaQuery)}>
                            <Clipboard className="tw-w-4 tw-h-4" />
                        </button>
                    )}
                </div>
            )}
            <div className="tw-text-[3rem]">{props.information}</div>
            <div className="tw-font-bold">{props.label}</div>
        </div>
    );
}

export function GenericCard(props: {content: JSX.Element, label?: string, className?: string, metaQuery?: string, metaInformation?: string}) {
    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-relative tw-overflow-auto tw-bg-bg-100 tw-p-4 tw-grid tw-grid-cols-1 tw-place-items-center", props.className)} title={props.information}>
            {props.metaInformation == null && props.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-bg-bg-400 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.metaInformation == null ? null : (
                        <InfoCircle title={props.metaInformation} className="tw-w-4 tw-h-4 tw-cursor-help" />
                    )}

                    {props.metaQuery == null ? null : (
                        <button title={props.metaQuery} onClick={e => navigator.clipboard.writeText(props.metaQuery)}>
                            <Clipboard className="tw-w-4 tw-h-4" />
                        </button>
                    )}
                </div>
            )}
            {props.content}
            {props.label == null ? null : <div className="tw-font-bold">{props.label}</div>}
        </div>
    );
}
