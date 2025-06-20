import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".next", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Next.js specific rules
      "react/no-unescaped-entities": "off",

      // 🚨 TYPE GOVERNANCE RULES - Prevent type duplication disasters

      // Prevent manual enum definitions that should come from database
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'TSTypeAliasDeclaration[id.name=/^(GemstoneType|GemColor|GemCut|UserRole|CurrencyCode)$/]:not([typeAnnotation.typeName.object.name="Database"])',
          message:
            "Manual enum definitions forbidden - import from @/shared/types instead",
        },
      ],

      // Prevent 'as any' usage - use proper typing instead
      "@typescript-eslint/no-explicit-any": "error",

      // Allow unused vars for underscore-prefixed parameters
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  }
);
