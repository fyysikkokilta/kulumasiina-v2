import { fixupConfigRules } from '@eslint/compat'
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["frontend/dist/"],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier",
)), {
    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
    },

    rules: {
        "react/react-in-jsx-scope": "off",

        "react/jsx-filename-extension": [1, {
            extensions: [".ts", ".tsx"],
        }],

        "@typescript-eslint/no-unused-vars": [1, {
            varsIgnorePattern: "^_",
            argsIgnorePattern: "^_",
        }],

        "no-debugger": "off",
    },
}, {
    files: ["**/eslintrc.config.js"],

    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: 5,
        sourceType: "commonjs",
    },
}];