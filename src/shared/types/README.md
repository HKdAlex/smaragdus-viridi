# Types Directory - Smaragdus Viridi

## 🚨 CRITICAL: READ BEFORE EDITING

This directory contains the **ONLY** authorized type definitions for the entire application.

## 📁 File Structure

```
src/shared/types/
├── database.ts          # 🔒 GENERATED - DO NOT EDIT
├── index.ts            # ✏️  Application extensions
└── README.md           # 📖 This file
```

## 🛡️ Rules (MANDATORY)

### ✅ database.ts - Generated Types

- **AUTO-GENERATED** from Supabase via MCP
- **NEVER EDIT MANUALLY** - Changes will be overwritten
- **READ-ONLY** - Import from this file only
- **Regenerate** via `mcp_supabase_generate_typescript_types`

### ✏️ index.ts - Application Extensions

- **Import** types from `database.ts`
- **Extend** database types with business logic
- **Never duplicate** enum definitions
- **Single source** for all application types

## 🚫 What NOT to Do

```typescript
// ❌ NEVER: Define enums manually
type GemstoneType = "diamond" | "emerald"; // FORBIDDEN!

// ❌ NEVER: Duplicate database types
interface MyGemstone {
  id: string;
} // FORBIDDEN!

// ❌ NEVER: Edit database.ts
// This file is auto-generated - edits will be lost!
```

## ✅ What TO Do

```typescript
// ✅ DO: Import from database types
import type { Database } from "./database";
type GemstoneType = Database["public"]["Enums"]["gemstone_type"];

// ✅ DO: Extend database types
interface Gemstone extends DatabaseGemstone {
  readonly computed_value: number;
}

// ✅ DO: Create business logic types
interface PriceCalculation {
  readonly original: number;
  readonly final: number;
}
```

## 🔄 Workflow

1. **Database Changes** → Update Supabase schema
2. **Regenerate Types** → Use MCP tools
3. **Extend if Needed** → Modify `index.ts`
4. **Import Everywhere** → Use `@/shared/types`

## ⚠️ Emergency Contact

If you find type duplications or inconsistencies:

1. **STOP** - Don't continue development
2. **Fix immediately** - Consolidate duplicates
3. **Test build** - Ensure no breaking changes
4. **Update docs** - Document any changes

## 📚 Documentation

- [Type Governance](../../../docs/04-implementation/TYPE_GOVERNANCE.md)
- [TypeScript Standards](../../../.cursor/rules/typescript-standards.mdc)

---

**Remember: This directory is the foundation of our type system. Keep it clean!** 🎯
