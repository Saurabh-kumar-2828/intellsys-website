import {useResizeDetector} from "react-resize-detector";

import {getUrlForCdnResource} from "~/utilities/utilities";
import {imageNameToInformationMap} from "~/utilities/imageNameToInformationMap";

const imageIdToSizeLoadedMap = {};

// TODO: Examine how it runs on the server, and see if I need to change anything (initially w=undefined)
// TODO: Add docs, preferably including mutually exclusive options documented properly
export function ResponsiveImage(props) {
    const imageName = props.imageName;

    let imageId = props.imageId;
    let imageOriginalWidth = props.imageOriginalWidth;
    let imageOriginalHeight = props.imageOriginalHeight;
    const style = props.style;
    const className = props.className;
    const coverImage = props.coverImage;
    const imageClassName = props.imageClassName;
    const variant = props.variant;

    const onClick = props.onClick;

    const {width: containerWidth, height: containerHeight, ref} = useResizeDetector();

    if (imageName != null) {
        const imageInformation = imageNameToInformationMap[imageName];
        imageId = imageInformation.id;
        imageOriginalWidth = imageInformation.width;
        imageOriginalHeight = imageInformation.height;
    }

    if (containerWidth == null) {
        return (
            <div ref={ref} className={className} style={{...style, aspectRatio: coverImage ? null : `${imageOriginalWidth}/${imageOriginalHeight}`}} onClick={onClick} />
        );
    }

    let src = null;

    if (variant != null) {
        src = getUrlForCdnResource(imageId, variant);
    } else {
        let variantWidth = null;

        const variantWidthLoaded = imageIdToSizeLoadedMap[imageId];
        if (variantWidthLoaded == null) {
            imageIdToSizeLoadedMap[imageId] = containerWidth;
            variantWidth = containerWidth;
        } else {
            variantWidth = variantWidthLoaded;
        }

        src = getUrlForCdnResource(imageId, `w=${variantWidth}`);
    }

    return (
        <div ref={ref} className={className} style={{...style, aspectRatio: coverImage ? null : `${imageOriginalWidth}/${imageOriginalHeight}`}} onClick={onClick}>
            {/* The width and height attributes have been removed because they *feel* redundant. Put back in if required. */}
            <img src={src} className={imageClassName ?? (coverImage && "tw-w-full tw-h-full tw-object-cover") ?? "tw-w-full tw-h-auto"}/>
        </div>
    );
}
