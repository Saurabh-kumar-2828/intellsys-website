/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");

module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                fg: "#d2d2d6",
                bg: "#1e1e2d",
                "bg+1": "#27293d",
                lp: "#483387",
            },
            fontSize: {
                base: ["1rem"],
            },
            spacing: {
                default: "2rem",
            },
        },
    },
    plugins: [
        plugin(({addVariant}) => {
            addVariant("radix-tab-active", "&[data-state='active']");
            addVariant("hocus", ["&:hover", "&:focus"]);
        }),
    ],
    prefix: "tw-",
};
