import {useState} from "react";
import {ChevronDown, Clipboard, Filter, Funnel, FunnelFill, InfoCircle, RecordCircle} from "react-bootstrap-icons";
import {concatenateNonNullStringsWithSpaces, numberToHumanFriendlyString} from "~/utilities/utilities";
import {Listbox} from "@headlessui/react";
import { filterToHumanReadableString, filterToTextColor, ValueDisplayingCardInformationType } from "~/utilities/typeDefinitions";

export function FancySearchableSelect(props: {className?: string; options: Array<string>; label: string, selectedOption; setSelectedOption}) {
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

export function FancySearchableMultiSelect(props: {className?: string; options: Array<string>; label: string, selectedOptions; setSelectedOptions, filterType: QueryFilterType}) {
    return (
        <div className={props.className}>
            <Listbox value={props.selectedOptions} onChange={props.setSelectedOptions} multiple>
                <Listbox.Button>
                    <div className="tw-bg-lp tw-p-2 tw-rounded-md tw-text-left tw-flex tw-flex-row tw-items-center">
                        <Funnel className={concatenateNonNullStringsWithSpaces("tw-w-4 tw-h-4 tw-cursor-help", filterToTextColor(props.filterType))} />
                        <div className="tw-flex-none tw-w-2" />
                        <b>{props.label}</b>
                        {props.selectedOptions.length == 0 ? null : `: ${props.selectedOptions.join(", ")}`}
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
        <div className={concatenateNonNullStringsWithSpaces("tw-relative tw-overflow-auto tw-bg-bg+1 tw-p-4 tw-grid tw-grid-cols-1 tw-content-center tw-text-center", props.className)} title={props.information}>
            {props.metaInformation == null && props.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
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

export function ValueDisplayingCard(props: {queryInformation, contentExtractor, label: string, className?: string, type: ValueDisplayingCardInformationType}) {
    const content = props.contentExtractor(props.queryInformation);

    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-relative tw-overflow-auto tw-bg-bg+1 tw-p-4 tw-grid tw-grid-cols-1 tw-content-center tw-text-center", props.className)} title={content}>
            {props.queryInformation.metaFiltersPossible == null ? null : (
                <div className="tw-absolute tw-top-4 tw-left-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.queryInformation.metaFiltersPossible.map((filter, filterIndex) => {
                        if (props.queryInformation.metaFiltersApplied.includes(filter)) {
                            return (
                                <FunnelFill title={filterToHumanReadableString(filter)} className={concatenateNonNullStringsWithSpaces("tw-w-4 tw-h-4 tw-cursor-help", filterToTextColor(filter))} key={filterIndex} />
                            );
                        } else {
                            return (
                                <Funnel title={filterToHumanReadableString(filter)} className={concatenateNonNullStringsWithSpaces("tw-w-4 tw-h-4 tw-cursor-help", filterToTextColor(filter))} key={filterIndex} />
                            );
                        }
                    })}
                </div>
            )}
            {props.queryInformation.metaInformation == null && props.queryInformation.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.queryInformation.metaInformation == null ? null : (
                        <InfoCircle title={props.queryInformation.metaInformation} className="tw-w-4 tw-h-4 tw-cursor-help" />
                    )}

                    {props.queryInformation.metaQuery == null ? null : (
                        <button title={props.queryInformation.metaQuery} onClick={e => navigator.clipboard.writeText(props.queryInformation.metaQuery)}>
                            <Clipboard className="tw-w-4 tw-h-4" />
                        </button>
                    )}
                </div>
            )}
            <div className="tw-text-[3rem]">
                {
                    props.type == ValueDisplayingCardInformationType.integer ? numberToHumanFriendlyString(content) :
                    props.type == ValueDisplayingCardInformationType.float ? numberToHumanFriendlyString(content, true) :
                    props.type == ValueDisplayingCardInformationType.percentage ? numberToHumanFriendlyString(content, true, true, true) :
                    content
                }
            </div>
            <div className="tw-font-bold">{props.label}</div>
        </div>
    );
}

export function GenericCard(props: {content: JSX.Element, label?: string, className?: string, metaQuery?: string, metaInformation?: string}) {
    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-relative tw-overflow-auto tw-bg-bg+1 tw-p-4 tw-grid tw-grid-cols-1", props.className)} title={props.information}>
            {props.metaInformation == null && props.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
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
