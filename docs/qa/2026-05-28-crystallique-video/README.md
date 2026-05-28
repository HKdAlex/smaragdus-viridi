# Crystallique video QA (2026-05-28)

Reference for the Russian walkthrough QA session and follow-up requirements.

## Issues covered

| Area | Fix (code) |
|------|------------|
| Media upload | Confirm route storage check + MIME inference + server proxy fallback |
| 12 basic colors | `basic-gem-colors.ts`, admin/catalog filters, no new `fancy-*` writes |
| Admin list cut/color | `display_*` fields in admin API + list UI |
| Catalog counts | `CategoryTabs` uses `categoryData.totalCount` |
| Import defaults | No default round cut; `needs_review` + `in_stock: false` when weight/price empty |

## Manual data fixes (out of scope for scripts)

Correct legacy rows in admin when needed: apatite cuts, amethyst/orange colors, zero weight/price.

## Enum migration

**Applied** to Supabase project `bbtmedia-2025-1` (`dpqapyojcdtrjwuhybky`) on 2026-05-28 via `add_basic_gem_color_values` (`orange`, `gray`, `violet`, `brown` on `gem_color`).

Source file: [`supabase/migrations/20260528120000_add_basic_gem_color_values.sql`](../../../supabase/migrations/20260528120000_add_basic_gem_color_values.sql)
