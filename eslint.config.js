import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import n from "eslint-plugin-n";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default defineConfig(
  globalIgnores([
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "prisma/generated/**",
    "eslint.config.js",
  ]),
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      n.configs["flat/recommended"],
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "import/no-unresolved": "off",
      "n/no-missing-import": "off",
      "n/no-process-exit": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [
      js.configs.recommended,
      n.configs["flat/recommended"],
      tseslint.configs.disableTypeChecked,
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: globals.node,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "import/no-unresolved": "off",
      "n/no-missing-import": "off",
      "n/no-process-exit": "off",
    },
  }
);
