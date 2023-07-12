import {Listbox} from "@headlessui/react";
import {Link} from "@remix-run/react";
import {ArcElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from "chart.js";
import {DateTime, Info} from "luxon";
import {RadioGroup, Switch} from "@headlessui/react";
import {useId} from "react";
import {CheckCircle, ChevronDown, Circle, Clipboard, Funnel, FunnelFill, InfoCircle} from "react-bootstrap-icons";
import {Doughnut} from "react-chartjs-2";
import {toast} from "react-toastify";
import type {TimeGranularity} from "~/backend/business-insights";
import {filterToHumanReadableString, filterToTextColor, TimeZones, ValueDisplayingCardInformationType} from "~/utilities/typeDefinitions";
import {concatenateNonNullStringsWithAmpersand, numberToHumanFriendlyString} from "~/utilities/utilities";
import {ItemBuilder} from "~/components/reusableComponents/itemBuilder";

export function FancySearchableSelect(props: {className?: string; options: Array<string>; label: string; selectedOption; setSelectedOption}) {
    return (
        <div className={props.className}>
            <Listbox value={props.selectedOption} onChange={props.setSelectedOption}>
                <Listbox.Button>
                    <div className="tw-bg-dark-bg-500 tw-p-2 tw-rounded-md tw-text-left">
                        <b>{props.label}</b>
                        {props.selectedOption == null ? null : `: ${props.selectedOption}`}
                    </div>
                </Listbox.Button>

                <Listbox.Options className="tw-w-fit tw-absolute tw-top-16 tw-bg-dark-bg-500 tw-rounded-md tw-max-h-[calc(100vh-20rem)] tw-border tw-border-fg tw-overflow-auto">
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

export function FancySearchableMultiSelect(props: {className?: string; options: Array<string>; label: string; selectedOptions; setSelectedOptions; filterType: QueryFilterType}) {
    return (
        <div className={props.className}>
            <Listbox value={props.selectedOptions} onChange={props.setSelectedOptions} multiple>
                <Listbox.Button>
                    <div className="tw-bg-dark-bg-500 tw-p-2 tw-rounded-md tw-text-left tw-flex tw-flex-row tw-items-center">
                        <Funnel className={concatenateNonNullStringsWithSpaces("tw-w-4 tw-h-4 tw-cursor-help", filterToTextColor(props.filterType))} />
                        <div className="tw-flex-none tw-w-2" />
                        <b>{props.label}</b>
                        {props.selectedOptions.length == 0 ? null : `: ${props.selectedOptions.join(", ")}`}
                    </div>
                </Listbox.Button>

                <Listbox.Options className="tw-w-fit tw-absolute tw-top-16 tw-bg-dark-bg-500 tw-rounded-md tw-max-h-[calc(100vh-20rem)] tw-border tw-border-fg tw-overflow-auto tw-z-10">
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

export function FancyCalendar(props: {label; value; setValue; id}) {
    return (
        <div className="tw-flex tw-flex-row tw-items-center tw-bg-dark-bg-500 tw-rounded-md tw-p-2 tw-gap-x-1">
            <label htmlFor={props.id}>{props.label}:</label>
            <input type="date" value={props.value} onChange={(e) => props.setValue(e.target.value)} className="tw-bg-dark-bg-500 tw-h-6" id={props.id} />
        </div>
    );
}

export function Card(props: {information: string; label: string; className?: string; metaQuery?: string; metaInformation?: string; extraLabels?: Array<string>}) {
    return (
        <div
            className={concatenateNonNullStringsWithSpaces("tw-relative tw-overflow-auto tw-bg-dark-bg-500 tw-p-4 tw-grid tw-grid-cols-1 tw-content-center tw-text-center", props.className)}
            title={props.information}
        >
            {props.metaInformation == null && props.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.metaInformation == null ? null : <InfoCircle title={props.metaInformation} className="tw-w-4 tw-h-4 tw-cursor-help" />}

                    {props.metaQuery == null ? null : (
                        <button title={props.metaQuery} onClick={async (e) => await navigator.clipboard.writeText(props.metaQuery)}>
                            <Clipboard className="tw-w-4 tw-h-4" />
                        </button>
                    )}
                </div>
            )}
            <div className="tw-text-[3rem]">{props.information}</div>
            <div className="tw-font-bold">{props.label}</div>
            {props.extraLabels == null
                ? null
                : props.extraLabels.map((label) => {
                      return <div className="tw-font-bold">{label}</div>;
                  })}
        </div>
    );
}

export function CustomCard(props: {information: string; informationClassName: string; label: string; className?: string; metaQuery?: string; metaInformation?: string; extraLabels?: Array<string>}) {
    return (
        <div
            className={concatenateNonNullStringsWithSpaces(
                "tw-relative tw-overflow-auto tw-bg-dark-bg-500 tw-p-4 tw-grid tw-grid-cols-1 tw-content-center tw-text-center tw-font-sans group",
                props.className,
                "hover:tw-bg-blue-600",
            )}
            title={props.information}
        >
            {props.metaInformation == null && props.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.metaInformation == null ? null : <InfoCircle title={props.metaInformation} className="tw-w-4 tw-h-4 tw-cursor-help" />}

                    {props.metaQuery == null ? null : (
                        <button title={props.metaQuery} onClick={async (e) => await navigator.clipboard.writeText(props.metaQuery)}>
                            <Clipboard className="tw-w-4 tw-h-4" />
                        </button>
                    )}
                </div>
            )}
            <div className={props.informationClassName}>{props.information}</div>
            <div className="tw-font-bold tw-font-sans">{props.label}</div>
            {props.extraLabels == null
                ? null
                : props.extraLabels.map((label) => {
                      return <div className="tw-font-bold tw-font-sans">{label}</div>;
                  })}
        </div>
    );
}

export function ValueDisplayingCard<T>(props: {queryInformation: T; contentExtractor: (queryInformation: T) => any; label: string; className?: string; type: ValueDisplayingCardInformationType}) {
    const content = props.contentExtractor(props.queryInformation);

    return (
        <div
            className={concatenateNonNullStringsWithSpaces(
                "tw-relative tw-overflow-auto tw-bg-dark-bg-500 tw-rounded-md tw-p-4 tw-grid tw-grid-cols-1 tw-content-center tw-text-center",
                props.className,
            )}
            title={content}
        >
            {props.queryInformation.metaFiltersPossible == null ? null : (
                <div className="tw-absolute tw-top-4 tw-left-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.queryInformation.metaFiltersPossible.map((filter, filterIndex) => {
                        if (props.queryInformation.metaFiltersApplied.includes(filter)) {
                            return (
                                <FunnelFill
                                    title={filterToHumanReadableString(filter)}
                                    className={concatenateNonNullStringsWithSpaces("tw-w-4 tw-h-4 tw-cursor-help", filterToTextColor(filter))}
                                    key={filterIndex}
                                />
                            );
                        } else {
                            return (
                                <Funnel
                                    title={filterToHumanReadableString(filter)}
                                    className={concatenateNonNullStringsWithSpaces("tw-w-4 tw-h-4 tw-cursor-help", filterToTextColor(filter))}
                                    key={filterIndex}
                                />
                            );
                        }
                    })}
                </div>
            )}

            {props.queryInformation.metaInformation == null && props.queryInformation.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.queryInformation.metaInformation == null ? null : <InfoCircle title={props.queryInformation.metaInformation} className="tw-w-4 tw-h-4 tw-cursor-help" />}

                    {props.queryInformation.metaQuery == null ? null : (
                        <button title={props.queryInformation.metaQuery} onClick={(e) => navigator.clipboard.writeText(props.queryInformation.metaQuery)}>
                            <Clipboard className="tw-w-4 tw-h-4" />
                        </button>
                    )}
                </div>
            )}

            <div className="tw-text-[3rem]">
                {props.type == ValueDisplayingCardInformationType.integer
                    ? numberToHumanFriendlyString(content)
                    : props.type == ValueDisplayingCardInformationType.float
                    ? numberToHumanFriendlyString(content, true)
                    : props.type == ValueDisplayingCardInformationType.percentage
                    ? numberToHumanFriendlyString(content, true, true, true)
                    : content}
            </div>
            <div className="tw-font-bold">{props.label}</div>
        </div>
    );
}

export function ValueDisplayingCardWithTarget({
    label,
    value,
    target,
    explanation,
    equivalentQuery,
    className,
    doughnutClassName,
    valueClassName,
    labelClassName,
    type,
}: {
    label: string;
    value: number;
    target: number;
    explanation?: string;
    equivalentQuery?: string;
    className?: string;
    doughnutClassName?: string;
    valueClassName?: string;
    labelClassName?: string;
    type: ValueDisplayingCardInformationType;
}) {
    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-relative tw-overflow-auto tw-bg-dark-bg-500 tw-rounded-md tw-p-8 tw-grid tw-grid-cols-1 tw-content-center tw-text-center", className)}>
            {explanation == null && equivalentQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {explanation == null ? null : <InfoCircle title={explanation} className="tw-w-4 tw-h-4 tw-cursor-help" />}

                    {equivalentQuery == null ? null : (
                        <button title={equivalentQuery} onClick={(e) => navigator.clipboard.writeText(equivalentQuery)}>
                            <Clipboard className="tw-w-4 tw-h-4" />
                        </button>
                    )}
                </div>
            )}

            <div className="tw-grid tw-place-items-center">
                <Doughnut
                    data={{
                        labels: ["Realized", "Unrealized"],
                        datasets: [
                            {
                                data: [value, target - value],
                                backgroundColor: ["#1f40cb", "#000000"],
                                borderWidth: 0,
                            },
                        ],
                    }}
                    options={{
                        cutout: "70%",
                        plugins: {
                            legend: {
                                display: false,
                            },
                        },
                    }}
                    className={concatenateNonNullStringsWithSpaces("tw-row-start-1 tw-col-start-1", doughnutClassName)}
                />

                <div className={concatenateNonNullStringsWithSpaces("tw-row-start-1 tw-col-start-1", valueClassName)}>
                    {type == ValueDisplayingCardInformationType.integer
                        ? numberToHumanFriendlyString(value)
                        : type == ValueDisplayingCardInformationType.float
                        ? numberToHumanFriendlyString(value, true)
                        : type == ValueDisplayingCardInformationType.percentage
                        ? numberToHumanFriendlyString(value, true, true, true)
                        : value}
                </div>
            </div>

            <div className={concatenateNonNullStringsWithSpaces("tw-font-bold", labelClassName)}>{label}</div>
        </div>
    );
}

export function LargeValueDisplayingCardWithTarget({
    label,
    value,
    target,
    explanation,
    equivalentQuery,
    className,
    type,
}: {
    label: string;
    value: number;
    target: number;
    explanation?: string;
    equivalentQuery?: string;
    className?: string;
    type: ValueDisplayingCardInformationType;
}) {
    return (
        <ValueDisplayingCardWithTarget
            label={label}
            value={value}
            target={target}
            explanation={explanation}
            equivalentQuery={equivalentQuery}
            className={concatenateNonNullStringsWithSpaces(className, "!tw-bg-dark-bg-400 tw-row-span-2 tw-col-span-4")}
            doughnutClassName="tw-bg-dark-bg-500 tw-p-8 tw-rounded-full tw-m-8"
            valueClassName="tw-font-4rem"
            labelClassName="tw-pt-12 tw-font-2rem"
            type={type}
        />
    );
}

export function SmallValueDisplayingCardWithTarget({
    label,
    value,
    target,
    explanation,
    equivalentQuery,
    className,
    valueClassName,
    type,
}: {
    label: string;
    value: number;
    target: number;
    explanation?: string;
    equivalentQuery?: string;
    className?: string;
    type: ValueDisplayingCardInformationType;
    valueClassName?: string;
}) {
    return (
        <ValueDisplayingCardWithTarget
            label={label}
            value={value}
            target={target}
            explanation={explanation}
            equivalentQuery={equivalentQuery}
            className={concatenateNonNullStringsWithSpaces(className, "tw-col-span-2")}
            valueClassName={valueClassName == "undefined" ? "tw-font-2rem tw-px-0.2" : valueClassName}
            labelClassName="tw-pt-4 tw-font-1rem"
            type={type}
        />
    );
}

export function SectionHeader({label}: {label: string}) {
    return <div className="tw-col-span-12 tw-font-2rem tw-font-bold tw-text-center">{label}</div>;
}

export function DateDisplayingCard(props: {information: any; label: string; className?: string; timezone: TimeZones; metaQuery?: string; metaInformation?: string}) {
    return (
        <div
            className={concatenateNonNullStringsWithSpaces(
                "tw-relative tw-overflow-auto tw-bg-dark-bg-500 tw-rounded-md tw-p-4 tw-grid tw-grid-cols-1 tw-content-center tw-text-center",
                props.className,
            )}
            title={props.information}
        >
            {props.metaInformation == null && props.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.metaInformation == null ? null : <InfoCircle title={props.metaInformation} className="tw-w-4 tw-h-4 tw-cursor-help" />}

                    {props.metaQuery == null ? null : (
                        <button title={props.metaQuery} onClick={async (e) => await navigator.clipboard.writeText(props.metaQuery)}>
                            <Clipboard className="tw-w-4 tw-h-4" />
                        </button>
                    )}
                </div>
            )}

            <div className="tw-text-[3rem]">
                {props.timezone == TimeZones.IST
                    ? new Intl.DateTimeFormat("en", {timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short", hour12: true}).format(new Date(props.information))
                    : props.timezone == TimeZones.UTC
                    ? new Intl.DateTimeFormat("en", {timeZone: "UTC", dateStyle: "medium", timeStyle: "short", hour12: true}).format(new Date(props.information))
                    : props.information}
            </div>

            <div className="tw-font-bold">{props.label}</div>
        </div>
    );
}

export function GenericCard(props: {content: JSX.Element; label?: string; className?: string; metaQuery?: string; metaInformation?: string}) {
    return (
        <div className={concatenateNonNullStringsWithSpaces("tw-relative tw-overflow-auto tw-bg-dark-bg-500 tw-rounded-md tw-p-4 tw-grid tw-grid-cols-1", props.className)} title={props.information}>
            {props.metaInformation == null && props.metaQuery == null ? null : (
                <div className="tw-absolute tw-top-4 tw-right-4 tw-opacity-50 tw-flex tw-flex-row tw-gap-x-4">
                    {props.metaInformation == null ? null : <InfoCircle title={props.metaInformation} className="tw-w-4 tw-h-4 tw-cursor-help" />}

                    {props.metaQuery == null ? null : (
                        <button title={props.metaQuery} onClick={(e) => navigator.clipboard.writeText(props.metaQuery)}>
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

export function IntellsysRadioButtons<T>({items, selectedItem, setSelectedItem}: {items: Array<T>; selectedItem: T; setSelectedItem: (items: T) => void}) {
    return (
        <RadioGroup
            value={selectedItem}
            onChange={setSelectedItem}
            className="tw-w-full tw-grid tw-grid-flow-row tw-content-center tw-gap-y-4"
        >
            <ItemBuilder
                items={items}
                itemBuilder={(item, itemIndex) => (
                    <RadioGroup.Option
                        value={item}
                        key={itemIndex}
                    >
                        {({checked}) => (
                            <div className="tw-pl-4 tw-pr-8 tw-py-[0.9375rem] tw-rounded-full tw-border-[0.0625rem] tw-border-solid gj-border-foreground-900 gj-text-foreground-900 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-2">
                                {checked ? <CheckCircle className="tw-w-6 tw-h-6 gj-text-primary-500" /> : <Circle className="tw-w-6 tw-h-6 gj-text-foreground-500" />}

                                {item}
                            </div>
                        )}
                    </RadioGroup.Option>
                )}
            />
        </RadioGroup>
    );
}

export function DateFilterSection(props: {
    granularities: Array<string>;
    selectedGranularity: TimeGranularity;
    setSelectedGranularity: React.Dispatch<React.SetStateAction<TimeGranularity>>;
    selectedMinDate: string;
    setSelectedMinDate: React.Dispatch<React.SetStateAction<string>>;
    selectedMaxDate: string;
    setSelectedMaxDate: React.Dispatch<React.SetStateAction<string>>;
    page: string;
    className?: string;
}) {
    // const months = Info.months("long", {locale: "en-US"});

    let m = [...Array(12).keys()];
    // const months = m.map((num) => `${DateTime.now().startOf("month").minus({months: num}).monthLong}, ${DateTime.now().startOf("month").minus({months: num}).year}`)
    const months = m.map((num) => DateTime.now().startOf("month").minus({months: num+1}))

    const startDateId = useId();
    const endDateId = useId();

    return (
        <div
            className={concatenateNonNullStringsWithSpaces(
                "tw-col-span-12 tw-bg-dark-bg-400 tw-sticky tw-top-16 -tw-m-8 tw-mb-0 tw-z-40 tw-p-4 tw-flex tw-flex-row tw-items-start tw-gap-x-4",
                props.className,
            )}
        >
            <div className="tw-flex-1 tw-flex tw-flex-row tw-items-center tw-gap-x-4 tw-gap-y-4 tw-flex-wrap">
                    <FancySearchableSelect label="Granularity" options={props.granularities} selectedOption={props.selectedGranularity} setSelectedOption={props.setSelectedGranularity} />

                <button
                    type="button"
                    onClick={() => {
                        const minDate = DateTime.now().startOf("month").toISODate();
                        const maxDate = DateTime.now().toISODate();
                        props.setSelectedMinDate(minDate);
                        props.setSelectedMaxDate(maxDate);
                    }}
                    className="tw-lp-button tw-px-6 tw-py-2 tw-rounded-md"
                >
                    MTD
                </button>

                <button
                    type="button"
                    onClick={() => {
                        const minDate = DateTime.now().plus({days: -28}).toISODate();
                        const maxDate = DateTime.now().toISODate();
                        props.setSelectedMinDate(minDate);
                        props.setSelectedMaxDate(maxDate);
                    }}
                    className="tw-lp-button tw-px-6 tw-py-2 tw-rounded-md"
                >
                    Past 28 Days
                </button>

                <div className={props.className}>
                    <Listbox
                        onChange={(dateTime: DateTime) => {
                            console.log(dateTime)
                            props.setSelectedMinDate(
                                DateTime.now()
                                .startOf("month")
                                .set({month: dateTime.month, year: dateTime.year})
                                .toISODate(),
                            );
                            props.setSelectedMaxDate(
                                DateTime.now()
                                .set({month: dateTime.month, year: dateTime.year})
                                .endOf("month")
                                .toISODate(),
                            );
                        }}
                    >
                        <Listbox.Button>
                            <div className="tw-lp-button tw-px-6 tw-p-2 tw-rounded-md tw-text-left">Month</div>
                        </Listbox.Button>

                        <Listbox.Options className="tw-w-fit tw-absolute tw-top-16 tw-bg-dark-bg-500 tw-rounded-md tw-max-h-[calc(100vh-20rem)] tw-border tw-border-fg tw-overflow-auto tw-z-100">
                            {months.map((option, optionIndex) => (
                                <Listbox.Option value={option} key={optionIndex} className="tw-p-2 tw-cursor-pointer">
                                    <div>{`${option.monthLong}, ${option.year}`}</div>
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Listbox>
                </div>
            </div>

            <div className="tw-flex tw-flex-row tw-gap-x-4">
                {/* TODO: Load value from urlSearchParams */}
                <FancyCalendar label="Start Date" value={props.selectedMinDate} setValue={props.setSelectedMinDate} id={startDateId} />

                {/* TODO: Load value from urlSearchParams */}
                <FancyCalendar label="End Date" value={props.selectedMaxDate} setValue={props.setSelectedMaxDate} id={endDateId} />

                <Link
                    to={concatenateNonNullStringsWithAmpersand(
                        `${props.page}?selected_granularity=${props.selectedGranularity}`,
                        `min_date=${props.selectedMinDate}`,
                        `max_date=${props.selectedMaxDate}`,
                    )}
                    className="-tw-col-end-1 is-button tw-rounded-md tw-py-2"
                >
                    Update Time Range
                </Link>
            </div>
        </div>
    );
}

export function errorToast(content: any) {
    toast.error(content);
}

export function successToast(content: any) {
    toast.success(content);
}

export function IntellsysHeaderDropdownTrigger({content, isOpen, className}: {content: string; isOpen: boolean; className?: string}) {
    return (
        <div
            className={concatenateNonNullStringsWithSpaces(
                "tw-dark-bg-500 tw-text-fg hover:tw-text-primary tw-underline-offset-2 tw-relative tw-grid tw-grid-flow-col tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap tw-duration-200",
                className,
            )}
        >
            {content}

            <ChevronDown
                className="tw-w-4 tw-h-4 tw-duration-200 tw-transition-transform"
                style={{
                    transform: isOpen ? "rotateX(180deg)" : "rotateX(0deg)",
                }}
            />
        </div>
    );
}
