module.exports = {
    extends: ["@remix-run/eslint-config"],
    "rules": {
        "object-curly-spacing": ["warn"],
        "array-callback-return": ["warn"],
        "constructor-super": ["warn"],
        "for-direction": ["warn"],
        "getter-return": ["warn"],
        "import/no-anonymous-default-export": ["error", {
            "allowArray": false,
            "allowArrowFunction": false,
            "allowAnonymousClass": false,
            "allowAnonymousFunction": false,
            "allowCallExpression": true, // The true value here is for backward compatibility
            "allowNew": false,
            "allowLiteral": false,
            "allowObject": false
          }],
    },
};
