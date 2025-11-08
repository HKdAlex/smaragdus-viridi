# Gemstone CRUD Remediation Plan

## Objectives

1. Deliver complete CRUD coverage for gemstone records, including advanced metadata, AI review, certifications, and media hygiene.
2. Eliminate security regressions by moving privileged operations server-side and aligning with Supabase RLS policies.
3. Establish automated test coverage (unit + E2E) for the admin gemstone lifecycle.

## Highest-Risk Items (address immediately)

1. **Service-role exposure in client code**
   - Refactor `MediaUploadService`, `PriceManagementService`, and any other browser code that imports `supabaseAdmin` to server actions or route handlers.
   - Store uploads and price changes behind authenticated API endpoints so service-role credentials remain server-only.
2. **Missing gemstone create endpoint & RLS alignment**
   - Introduce POST handler at `app/api/admin/gemstones/route.ts` to handle creates with server auth.
   - Ensure migrations define `INSERT/UPDATE/DELETE` policies for `gemstones`, `gemstone_images`, `gemstones_ai_v6`, `certifications`, etc., gating by `user_profiles.role = 'admin'`.
3. **Orphaned media / AI records on delete**
   - Implement transactional delete (e.g., RPC or server route) that removes related images, videos, AI records, certifications, and storage assets.
   - Alternatively, add foreign keys with `ON DELETE CASCADE` + storage cleanup queue.

## CRUD Gap Closure by Area

### Core product data (`public.gemstones`)

- Add form inputs + validation for `quantity`, `metadata_status`, and (optionally) `price_per_carat` (auto-calc from price/weight with override toggle).
- Capture `import_*` metadata in admin UI and surface read-only in detail page.
- Replace client-side `updated_at` stamping with database default (e.g., trigger) to avoid clock drift.

### AI metadata (`public.gemstones` + `public.gemstones_ai_v6`)

- Add moderation dashboard for AI fields: review flag (`needs_review`), confidence score display, manual overrides.
- Expose `historical_context`, `care_instructions`, `review_notes`, image selection reasoning to admins; allow edits/approvals.
- Provide control to mark `ai_text_generated_v6` (and timestamp) when content reviewed/accepted.

### Certifications & supporting tables

- Build CRUD UI for certifications (upload certificate, number, type, issued date, URL) under gemstone detail.
- Decide on storage for certificate files (e.g., Supabase storage bucket) and ensure cascade delete.

### Media management

- Add UI for image/video ordering beyond primary flag.
- Surface image metadata editing (alt text, watermark flag).
- Validate uploads server-side (size/type limits) and send signed URLs to client.

### Bulk operations

- Extend bulk edit/import to cover new fields (metadata status, quantity, origin) and align validation with single-record form.
- Provide CSV template updates reflecting new columns.

## Testing Strategy

- **Unit Tests (Vitest)**: cover server actions/services for create/update/delete, media upload handlers, certification CRUD, AI field validators.
- **Integration/E2E (Playwright)**: admin flow from create → media upload → AI review → certification attach → delete, verifying DB state matches expectations.
- **Regression suites**: tests ensuring RLS policies prevent non-admin CRUD attempts.

## Security & Observability Enhancements

- Audit Supabase policies to confirm only admins can mutate gemstone-related tables; codify via migrations.
- Add structured logging (server-side) for CRUD actions, including actor, gemstone ID, fields changed.
- Monitor storage bucket for orphaned files; consider scheduled cleanup job.

## Dependencies & Open Questions

- Confirm whether `quantity` has default at DB level; if not, migration needed to avoid insert failures once UI starts populating it.
- Verify desired workflow for `metadata_status` (manual vs automated?).
- Determine if AI review requires audit trail (users & timestamps) beyond existing fields.
- Align with product on whether price-per-carat should be stored or derived at runtime.

Addressing the above restores complete gemstone CRUD, secures privileged operations, and enables confidence via testing.
