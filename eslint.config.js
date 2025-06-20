import globals from "globals";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // 🚨 TYPE GOVERNANCE RULES - Prevent type duplication disasters

      // Prevent manual enum definitions that should come from database
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TSTypeAliasDeclaration[id.name=/^(GemstoneType|GemColor|GemCut|GemClarity|CurrencyCode|UserRole)$/]",
          message:
            "❌ FORBIDDEN: Manual enum definitions! Import from @/shared/types instead. See TYPE_GOVERNANCE.md",
        },
        {
          selector:
            "TSInterfaceDeclaration[id.name=/^(Gemstone|Origin|UserProfile)$/]:not([id.name=/^(Database|Enhanced|Catalog)/])",
          message:
            "❌ FORBIDDEN: Duplicate core interfaces! Import DatabaseGemstone, DatabaseOrigin, etc. from @/shared/types instead.",
        },
      ],

      // Require imports from shared types for common types
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/database.ts"],
              message:
                "❌ Don't import database.ts directly. Use @/shared/types instead.",
            },
          ],
        },
      ],

      // Warn about potential type duplications
      "@typescript-eslint/no-duplicate-type-constituents": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",

      // Ensure proper type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
        },
      ],

      // Prevent any type in documentation files
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Program:matches([body] TSTypeAliasDeclaration, [body] TSInterfaceDeclaration)",
          message:
            "❌ FORBIDDEN: Type definitions in documentation files! Move to src/shared/types/ instead.",
        },
      ],

      // Prevent 'as any' usage - use proper typing instead
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],
    },
  }
);
