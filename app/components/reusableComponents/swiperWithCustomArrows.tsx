import {useState} from "react";
import {CaretLeftFill, CaretRightFill} from "react-bootstrap-icons";
import {Swiper} from "swiper/react";
import {SwiperSlide} from "swiper/react";
import {concatenateNonNullStringsWithSpaces} from "~/utilities/utilities";

export function SwiperWithCustomArrows(props: {swiperAttributes; buttonClassName; items; itemBuilder}) {
    const isLooping = props.swiperAttributes.loop;

    const [swiperInstance, setSwiperInstance] = useState(null);
    const [prevButtonEnabled, setPrevButtonEnabled] = useState(isLooping);
    const [nextButtonEnabled, setNextButtonEnabled] = useState(true);

    return (
        <div className="tw-flex tw-flex-row tw-w-full tw-items-center tw-gap-x-4">
            <button
                className={concatenateNonNullStringsWithSpaces(
                    "tw-flex-none tw-w-8 tw-h-8 tw-bg-[#272727] tw-text-white enabled:tw-lectrix-bg-primary-on-hover tw-rounded-full tw-flex tw-items-center tw-justify-center",
                    !prevButtonEnabled && "tw-text-neutral-700",
                    props.buttonClassName ?? null,
                )}
                onClick={(e) => swiperInstance.slidePrev()}
                disabled={!prevButtonEnabled}
            >
                <CaretLeftFill className="tw-w-3 tw-h-3" />
            </button>

            <Swiper
                {...props.swiperAttributes}
                className="tw-w-full"
                onSwiper={(swiper) => setSwiperInstance(swiper)}
                onReachBeginning={(swiper) => {
                    if (!isLooping) {
                        setPrevButtonEnabled(false);
                    }
                }}
                onSlideNextTransitionStart={(swiper) => {
                    if (!isLooping) {
                        setPrevButtonEnabled(true);
                    }
                }}
                onReachEnd={(swiper) => {
                    if (!isLooping) {
                        setNextButtonEnabled(false);
                    }
                }}
                onSlidePrevTransitionStart={(swiper) => {
                    if (!isLooping) {
                        setNextButtonEnabled(true);
                    }
                }}
            >
                {props.items.map(props.itemBuilder)}
            </Swiper>

            <button
                className={concatenateNonNullStringsWithSpaces(
                    "tw-flex-none tw-w-8 tw-h-8 tw-bg-[#272727] tw-text-white enabled:tw-lectrix-bg-primary-on-hover tw-rounded-full tw-flex tw-items-center tw-justify-center",
                    !nextButtonEnabled && "tw-text-neutral-700",
                    props.buttonClassName ?? null,
                )}
                onClick={(e) => swiperInstance.slideNext()}
                disabled={!nextButtonEnabled}
            >
                <CaretRightFill className="tw-w-3 tw-h-3" />
            </button>
        </div>
    );
}
