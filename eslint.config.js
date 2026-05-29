import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";

const files = ["**/*.{js,mjs,cjs,jsx}"];

export default defineConfig([
    // Base JS rules
    {
        files,
        languageOptions: {
            globals: {
                ...globals.browser,
                // Common Laravel/Inertia/Ziggy globals used in React pages
                // `require` is sometimes used in Inertia setups; allow it to avoid false `no-undef`.
                require: "readonly",
                // Ziggy's `route()` helper is often exposed as a global.
                route: "readonly",
            },
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        rules: {
            ...js.configs.recommended.rules,
        },
    },

    // React best-practice rules
    {
        files,
        ...pluginReact.configs.flat.recommended,
        settings: {
            react: { version: "detect" },
        },
        rules: {
            ...pluginReact.configs.flat.recommended.rules,
            // Common for React 17+ (no need for prop-types in many projects)
            "react/prop-types": "off",
            // Common for React 17+ new JSX transform
            "react/jsx-uses-react": "off",
            "react/react-in-jsx-scope": "off",
        },
    },

    // React Hooks rules
    {
        files,
        ...pluginReactHooks.configs.flat.recommended,
    },

    // Accessibility rules for JSX
    {
        files,
        plugins: {
            "jsx-a11y": pluginJsxA11y,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        rules: {
            ...pluginJsxA11y.configs.recommended.rules,
        },
    },

    // Unused imports & variables cleanup
    {
        files,
        plugins: {
            "unused-imports": unusedImports,
        },
        rules: {
            // ❌ matikan bawaan ESLint
            "no-unused-vars": "off",

            // ✅ auto remove unused import
            "unused-imports/no-unused-imports": "error",

            // ✅ handle unused variables
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
]);
