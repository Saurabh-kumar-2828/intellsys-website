/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
    ignoredRouteFiles: ["**/.*"],
    // appDirectory: "app",
    // assetsBuildDirectory: "public/build",
    // serverBuildPath: "build/index.js",
    // publicPath: "/build/",
    tailwind: true,
    future: {
        v2_errorBoundary: true,
    },
    serverDependenciesToBundle: [
        // /^swiper.*/,
        // "ssr-window",
        // "dom7",
        "d3-scale",
        "d3-array",
        "d3-interpolate",
        "d3-selection",
        "d3-axis",
        "d3-time-format",
        "d3-shape",
        "d3-selection",
        "d3-scale-chromatic",
        "d3",
        "d3-brush",
        "d3-chordbrush",
        "d3-contourbrush",
        "d3-delaunaybrush",
        "d3-dispatchbrush",
        "d3-dragbrush",
        "d3-dsvbrush",
        "d3-easebrush",
        "d3-fetchbrush",
        "d3-forcebrush",
        "d3-geobrush",
        "d3-hierarchybrush",
        "d3-polygonbrush",
        "d3-quadtreebrush",
        "d3-randombrush",
        "d3-timerbrush",
        "d3-transitionbrush",
        "d3-zoombrush",
        "d3-color",
        "d3-time",
        "d3-path"
    ],
};
