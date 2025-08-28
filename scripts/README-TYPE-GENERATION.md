# Supabase Type Generation

This directory contains scripts for generating TypeScript types from your Supabase database schema.

## Overview

The `generate-supabase-types.mjs` script automatically generates TypeScript types from your Supabase database, ensuring your application types are always in sync with your database schema.

## Usage

### Generate Types from Supabase

```bash
# Generate types from your Supabase project
npm run types:generate

# Or run directly
node scripts/generate-supabase-types.mjs
```

### Requirements

1. **Supabase CLI**: Install globally

   ```bash
   npm install -g supabase
   ```

2. **Environment Variables**: Ensure your `.env.local` file contains:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### What It Does

1. **Connects to your Supabase database** using the service role key
2. **Generates TypeScript types** from your current database schema
3. **Updates `src/shared/types/database.ts`** with the latest types
4. **Adds metadata comments** indicating when types were generated

### Generated Types

The script generates types for:

- **Tables**: All database tables with proper Row/Insert/Update types
- **Enums**: All database enums (user roles, currencies, gem types, etc.)
- **Relationships**: Foreign key relationships between tables

### Integration with Development Workflow

#### Automatic Type Updates

Run `npm run types:generate` whenever you:

- Add new database tables or columns
- Modify existing table schemas
- Add new enums or change enum values
- Update database relationships

#### Build Integration

The generated types are automatically used by:

- TypeScript compiler for type checking
- ESLint for type-aware linting
- IDE for IntelliSense and autocomplete
- Runtime type validation with Supabase client

### File Structure

```
src/shared/types/
├── database.ts          # Auto-generated Supabase types
├── index.ts             # Application-specific type extensions
└── [other].ts           # Feature-specific types
```

### Best Practices

1. **Never edit `database.ts` manually** - it's auto-generated
2. **Run type generation after schema changes** - keep types in sync
3. **Commit generated types** - they should be part of your codebase
4. **Review type changes** - ensure they match your expectations

### Troubleshooting

#### Common Issues

**"Missing environment variables"**

- Check your `.env.local` file
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

**"Invalid Supabase URL format"**

- URL should be: `https://[project-id].supabase.co`
- Check for typos in your environment variables

**"Failed to generate types"**

- Verify your service role key has database access
- Check Supabase project permissions
- Ensure Supabase CLI is properly installed

#### Debug Mode

Run with debug logging:

```bash
SUPABASE_DEBUG=true npm run types:generate
```

### Examples

#### Before Schema Change

```sql
-- Add new column to gemstones table
ALTER TABLE gemstones ADD COLUMN certification_date DATE;
```

#### After Schema Change

```bash
# Generate updated types
npm run types:generate

# Check that new field appears in types
grep "certification_date" src/shared/types/database.ts
```

#### Using Generated Types

```typescript
import type { Database } from "@/shared/types/database";

type Gemstone = Database["public"]["Tables"]["gemstones"]["Row"];

// Now you have full type safety for the new certification_date field
function processGemstone(gemstone: Gemstone) {
  if (gemstone.certification_date) {
    // TypeScript knows about this field
  }
}
```

### Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Generate Supabase Types
  run: npm run types:generate

- name: Check for Type Changes
  run: |
    if git diff --name-only | grep -q "src/shared/types/database.ts"; then
      echo "Database types have changed. Consider updating your code accordingly."
    fi
```

This ensures your types stay in sync across your development team and deployment pipeline.
