# 🚨 CRITICAL: Preventing Type Duplication Disasters

## ⚠️ READ THIS BEFORE ADDING ANY TYPES

**This project has strict type governance rules to prevent the catastrophic type duplication that occurred during Sprint 3.**

### 🛑 STOP: Before You Add Types

1. **Check `src/shared/types/index.ts` FIRST** - Type might already exist
2. **Import from `@/shared/types`** - Never define types manually
3. **Run `npm run type-governance`** - Check for violations
4. **Read the governance docs** - Understand the rules

### 🎯 Golden Rules

```typescript
// ✅ ALWAYS DO THIS
import type { GemstoneType, GemColor } from "@/shared/types";

// ❌ NEVER DO THIS
type GemstoneType = "diamond" | "emerald"; // FORBIDDEN!
```

### 🔄 Type Hierarchy (MANDATORY)

```
1. Supabase Database Schema (SOURCE OF TRUTH)
   ↓ MCP Generate
2. src/shared/types/database.ts (AUTO-GENERATED - DON'T TOUCH)
   ↓ Import + Extend
3. src/shared/types/index.ts (Application Extensions)
   ↓ Import Only
4. Feature Types (src/features/*/types/)
```

### 🛡️ Enforcement Tools

- **`npm run type-governance`** - Check for violations
- **`npm run validate-types`** - Full type system validation
- **ESLint Rules** - Automatic violation detection
- **Pre-commit Hooks** - Prevent bad commits

### 📚 Documentation

- **[Type Governance](docs/04-implementation/TYPE_GOVERNANCE.md)** - Complete rules
- **[TypeScript Standards](.cursor/rules/typescript-standards.mdc)** - Coding standards
- **[Types README](src/shared/types/README.md)** - Quick reference

### 🚨 If You Find Type Duplications

1. **STOP development immediately**
2. **Run `npm run type-governance`** to identify all violations
3. **Consolidate duplicates** into proper hierarchy
4. **Test thoroughly** with `npm run validate-types`
5. **Update documentation** if needed

### ✅ Success Metrics

- Zero type duplications across codebase
- 100% of types imported from `@/shared/types`
- Automated type generation from database
- Fast development with reliable type safety

---

**Remember: Types are the foundation of our application. One duplicate type can break everything!** 🎯

**When in doubt, ask the team or check the governance documentation.**
