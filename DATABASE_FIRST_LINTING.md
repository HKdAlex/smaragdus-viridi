# Database-First Linting & Type Safety

## Issue Discovered

Inconsistent quote styles in database type references:

```typescript
// ❌ Inconsistent
type DbGemstone = Database["public"]["Tables"]["gemstones"]["Row"]; // double
export type DatabaseGemstone = Database["public"]["Tables"]["gemstones"]["Row"]; // single
```

## Solution

### 1. ESLint Rules Added

**File:** `eslint.config.js`

```javascript
rules: {
  // Enforce single quotes for consistency
  quotes: ["error", "single", {
    avoidEscape: true,
    allowTemplateLiterals: true
  }],

  // Enforce consistent quote props
  "quote-props": ["error", "as-needed"],
}
```

### 2. TypeScript Strict Mode (Already Enabled)

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### 3. Additional Checks to Add (Future)

**Custom ESLint Rule (Optional):**

```javascript
// .eslintrc.custom-rules.js
module.exports = {
  rules: {
    "database-type-import": {
      create(context) {
        return {
          ImportDeclaration(node) {
            // Enforce imports from @/shared/types/database
            if (
              node.source.value.includes("/database") &&
              !node.source.value.startsWith("@/shared/types/database")
            ) {
              context.report({
                node,
                message:
                  "Database types must be imported from @/shared/types/database",
              });
            }
          },
        };
      },
    },
  },
};
```

## Database-First Checklist

### ✅ Current Compliance

- [x] All types imported from `@/shared/types/database`
- [x] Types generated via `npm run types:generate`
- [x] No manual type definitions for database entities
- [x] TypeScript strict mode enabled
- [x] Quote consistency enforced via ESLint

### 🔄 Automated Checks

**Pre-commit Hook (Recommended):**

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run typecheck"
    }
  }
}
```

**CI/CD Pipeline:**

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: npm run lint

- name: Type Check
  run: npm run typecheck

- name: Verify Database Types
  run: |
    npm run types:generate
    git diff --exit-code src/shared/types/database.ts
```

### 📝 Manual Review Checklist

Before merging any PR with database changes:

1. [ ] Migration applied to Supabase
2. [ ] `npm run types:generate` executed
3. [ ] `src/shared/types/database.ts` committed
4. [ ] All imports use `@/shared/types/database`
5. [ ] No manual type definitions for DB entities
6. [ ] ESLint passes (`npm run lint`)
7. [ ] TypeScript compiles (`npm run typecheck`)

## Common Violations & Fixes

### ❌ Violation 1: Manual Type Definition

```typescript
// ❌ WRONG
export interface Gemstone {
  id: string;
  name: string;
  // ... manual fields
}
```

```typescript
// ✅ CORRECT
import type { Database } from "@/shared/types/database";
export type Gemstone = Database["public"]["Tables"]["gemstones"]["Row"];
```

### ❌ Violation 2: Wrong Import Path

```typescript
// ❌ WRONG
import type { Database } from "@/types/database";
import type { Database } from "../../types/database";
```

```typescript
// ✅ CORRECT
import type { Database } from "@/shared/types/database";
```

### ❌ Violation 3: Inconsistent Quotes

```typescript
// ❌ WRONG (mixed quotes)
type DbGemstone = Database["public"]["Tables"]["gemstones"]["Row"];
type DbUser = Database["public"]["Tables"]["user_profiles"]["Row"];
```

```typescript
// ✅ CORRECT (consistent single quotes)
type DbGemstone = Database["public"]["Tables"]["gemstones"]["Row"];
type DbUser = Database["public"]["Tables"]["user_profiles"]["Row"];
```

## NPM Scripts

```json
{
  "scripts": {
    "types:generate": "npx supabase gen types typescript --project-id dpqapyojcdtrjwuhybky --schema public > src/shared/types/database.ts",
    "types:check": "tsc --noEmit",
    "lint": "next lint",
    "lint:fix": "next lint --fix"
  }
}
```

## Enforcement Strategy

### Level 1: Developer Workflow

- Run `npm run lint` before committing
- Run `npm run typecheck` to catch type errors
- Use IDE extensions (ESLint, TypeScript)

### Level 2: Git Hooks

- Pre-commit: `lint` + `typecheck`
- Pre-push: Full test suite

### Level 3: CI/CD Pipeline

- Automated linting on every PR
- Type generation verification
- Test coverage enforcement

---

**Status:** ✅ ESLint rules added, quote consistency enforced

**Next Steps:**

1. Add pre-commit hooks (husky)
2. Add CI/CD checks
3. Consider custom ESLint rule for import paths
