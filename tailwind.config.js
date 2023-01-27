/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require("tailwindcss/plugin");

module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                "primary": "#00a2ed",
                "primary-1": "#1f40cb",
                "primary-2": "#051c2a",
                fg: "#d2d2d6",
                bg: "#1e1e2d",
                "bg+1": "#27293d",
                lp: "#483387",
                "dark-bg-400": "#131313",
                "dark-bg-500": "#272727",
                "dark-bg-600": "#333333",
                "dark-fg-400": "#d2d2d6",
            },
            fontSize: {
                base: ["1rem"],
            },
            spacing: {
                default: "2rem",
            },
            fontFamily: {
                sans: ['Poppins', ...defaultTheme.fontFamily.sans]
            }
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
