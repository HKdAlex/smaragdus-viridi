// @ts-check

import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: ["./tsconfig.json"],
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // ===== TYPE GOVERNANCE ENFORCEMENT =====

      // Prevent manual type definitions that should come from database
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TSTypeAliasDeclaration[id.name=/^(GemstoneType|GemColor|GemCut|GemClarity|CurrencyCode|UserRole|OrderStatus|PaymentType)$/]",
          message:
            "❌ Type duplication detected! Import this type from @/shared/types instead of defining manually. See PREVENT_TYPE_DUPLICATION.md",
        },
        {
          selector:
            "TSInterfaceDeclaration[id.name=/^(Gemstone|Origin|UserProfile|Order|OrderItem)$/]:not([id.name=/^(Database|Enhanced|Catalog)/])",
          message:
            "❌ Interface duplication detected! Use Database${name} from @/shared/types instead. See TYPE_GOVERNANCE.md",
        },
      ],

      // Prevent direct database.ts imports
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/database.ts",
                "../**/database.ts",
                "./**/database.ts",
              ],
              message:
                "❌ Direct database.ts import forbidden! Import from @/shared/types instead.",
            },
          ],
        },
      ],

      // ===== TYPESCRIPT SAFETY =====

      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          fixToUnknown: true,
          ignoreRestArgs: true,
        },
      ],

      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",

      // Enforce proper type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],

      // Prevent unused variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // ===== GEMSTONE E-COMMERCE SPECIFIC =====

      // Enforce proper authentication patterns
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message:
            "Use Supabase session management instead of localStorage for auth data",
        },
      ],

      // Prevent security issues
      "no-eval": "error",
      "no-new-func": "error",

      // ===== IMPORT ORGANIZATION =====

      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // ===== PERFORMANCE & BEST PRACTICES =====

      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",

      // Prevent performance issues with large lists
      "react/jsx-key": [
        "error",
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
        },
      ],
    },
  },
  {
    // Special rules for type definition files
    files: ["src/shared/types/**/*.ts"],
    rules: {
      // More strict rules in type definition files
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "no-restricted-syntax": "off", // Allow type definitions in shared/types
    },
  },
  {
    // Relaxed rules for generated files
    files: ["src/shared/types/database.ts"],
    rules: {
      // Allow any patterns in generated database types
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-syntax": "off",
    },
  },
];

export default eslintConfig;
