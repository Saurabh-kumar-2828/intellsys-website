/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: ["@remix-run/eslint-config", "@remix-run/eslint-config/node"],
    rules: {
        "object-curly-spacing": "error",
    },
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            parserOptions: {
                project: ['./tsconfig.json'],
            },
            rules: {
                "@typescript-eslint/no-floating-promises": "error",
                "@typescript-eslint/no-misused-promises": "error",
            },
        }
    ]
};
