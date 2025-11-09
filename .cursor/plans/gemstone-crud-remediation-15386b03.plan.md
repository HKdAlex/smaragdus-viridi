<!-- 15386b03-cc3e-46fb-85b5-bc5c58f5998a 3a9c3ce9-df26-4d68-ac22-da9ec2cb8756 -->
# Gemstone CRUD Remediation Implementation

## Phase 1: Security Hardening (Critical)

### 1.1 Move Service-Role Operations Server-Side

**Problem**: `MediaUploadService`, `PriceManagementService` expose service-role credentials in browser.

**Solution**: Create server actions/API routes for privileged operations:

- `app/api/admin/gemstones/media/route.ts` - handle media uploads with signed URLs
- `app/api/admin/gemstones/pricing/route.ts` - handle price updates
- `app/api/admin/gemstones/route.ts` - POST handler for gemstone creation
- Refactor client components to call these endpoints instead of direct supabaseAdmin usage

**Files to modify**:

- `src/lib/services/media-upload-service.ts` - remove service-role client, use fetch to API
- `src/lib/services/price-management-service.ts` - remove service-role client, use fetch to API
- Create new server route handlers in `app/api/admin/gemstones/`

### 1.2 RLS Policy Migrations

**Problem**: No RLS policies for admin INSERT/UPDATE/DELETE on gemstone tables.

**Solution**: Create migration establishing admin-gated policies:

- `public.gemstones` - INSERT, UPDATE, DELETE for `user_profiles.role = 'admin'`
- `public.gemstone_images` - INSERT, UPDATE, DELETE for admins
- `public.gemstone_videos` - INSERT, UPDATE, DELETE for admins
- `public.gemstones_ai_v6` - INSERT, UPDATE, DELETE for admins
- `public.certifications` - INSERT, UPDATE, DELETE for admins

**Migration file**: `supabase/migrations/YYYYMMDDHHMMSS_add_admin_rls_policies.sql`

## Phase 2: CRUD Gap Closure

### 2.1 Core Product Data Fields

**Add to `GemstoneForm` component**:

- `quantity` field (number input, default: 1, validation: >= 0)
- `metadata_status` field (select: 'draft' | 'pending_review' | 'approved' | 'published')
- `price_per_carat` field (number input with currency display)

**Migration needed**:

- Add default value for `quantity` column: `ALTER TABLE gemstones ALTER COLUMN quantity SET DEFAULT 1;`

### 2.2 Price Per Carat Implementation

**Three-part implementation**:

1. **Migration**: Ensure `price_per_carat` column exists (appears to already exist per inventory)

2. **Backfill script**: `scripts/backfill-price-per-carat.ts`

   - Calculate `price_per_carat = price_amount / (weight_carats * 100)` for all existing gemstones
   - Handle edge cases (zero weight, null prices)

3. **Database trigger**: `supabase/migrations/YYYYMMDDHHMMSS_price_per_carat_trigger.sql`

   - When `price_per_carat` changes, update `price_amount = price_per_carat * weight_carats * 100`
   - Trigger on UPDATE of `price_per_carat` column
   - Handle null/zero cases appropriately

4. **UI Integration**:

   - Add price-per-carat input to `GemstoneForm`
   - Display in admin gemstone list/detail views
   - Include in bulk edit modal

### 2.3 AI Moderation Dashboard

**New component**: `src/components/admin/gemstones/AIReviewDashboard.tsx`

**Features**:

- Display AI confidence scores for each gemstone
- Show `needs_review` flag prominently
- Allow admins to review and approve AI-generated content
- Edit capabilities for all AI fields:
  - Technical/emotional descriptions (en/ru)
  - Narrative stories (en/ru)
  - Promotional text (en/ru)
  - Marketing highlights (en/ru)
  - Historical context (en/ru)
  - Care instructions (en/ru)
- View image selection reasoning and quality scores
- Override AI primary image recommendations

**Audit trail fields** (extend `gemstones_ai_v6` table via migration):

- `reviewed_by` (uuid, FK to user_profiles)
- `reviewed_at` (timestamptz)
- `review_notes` (text) - already exists per inventory
- `approval_status` ('pending' | 'approved' | 'rejected')

**Migration**: `supabase/migrations/YYYYMMDDHHMMSS_add_ai_review_audit.sql`

**API endpoint**: `app/api/admin/gemstones/[id]/ai-review/route.ts`

- POST: mark AI content as reviewed/approved
- PATCH: update AI fields with admin overrides

### 2.4 Certifications CRUD

**New component**: `src/components/admin/gemstones/CertificationManager.tsx`

**Schema** (verify against existing `certifications` table):

- `gemstone_id` (uuid, FK)
- `certificate_number` (text)
- `certification_type` (text or enum)
- `issued_date` (date)
- `certificate_url` (text)
- `certificate_file_path` (text) - storage path for uploaded PDFs

**Features**:

- List certifications for a gemstone
- Add new certification (form with file upload)
- Edit certification details
- Delete certification (with storage cleanup)

**Storage**: Use `gemstone-certificates` bucket in Supabase Storage

**API endpoints**:

- `app/api/admin/gemstones/[id]/certifications/route.ts` - GET (list), POST (create)
- `app/api/admin/gemstones/[id]/certifications/[certId]/route.ts` - PATCH (update), DELETE

**Migration**: Verify RLS policies exist for certifications table

### 2.5 Media Management Enhancements

**Extend `EnhancedMediaUpload` component**:

- Add drag-and-drop reordering for images/videos
- Surface and allow editing:
  - `alt_text` for each image
  - `has_watermark` flag toggle
  - `duration_seconds` for videos (read-only, captured on upload)
- Display `original_filename` and `original_path` (read-only metadata)

**Update `MediaUploadService`**:

- Move to server-side API route (covered in Phase 1.1)
- Add server-side validation (file size, mime types)
- Implement reorder endpoint: `app/api/admin/gemstones/[id]/media/reorder/route.ts`

### 2.6 Bulk Operations Extensions

**Extend `BulkEditModal`**:

- Add fields: `quantity`, `metadata_status`, `origin_id`, `price_per_carat`
- Ensure validation aligns with single-record form

**Extend `BulkImport` component**:

- Update CSV template to include new columns
- Add import validation for new fields
- Surface `import_batch_id`, `import_folder_path`, `import_notes` in UI after import

### 2.7 Import Metadata Visibility

**Add to gemstone detail page**:

- Read-only section showing import metadata when present:
  - `import_batch_id`
  - `import_folder_path`
  - `import_notes`

## Phase 3: Cascading Delete & Cleanup

### 3.1 Transactional Delete Implementation

**Create database function**: `supabase/migrations/YYYYMMDDHHMMSS_gemstone_cascade_delete.sql`

**RPC function** `delete_gemstone_cascade(gemstone_uuid UUID)`:

1. Delete from `certifications` WHERE `gemstone_id = gemstone_uuid`
2. Delete from `gemstones_ai_v6` WHERE `gemstone_id = gemstone_uuid`
3. Get all `image_url`, `video_url` from `gemstone_images` and `gemstone_videos`
4. Delete from `gemstone_images` and `gemstone_videos`
5. Delete from `gemstones` WHERE `id = gemstone_uuid`
6. Return list of storage paths to delete

**Server endpoint**: `app/api/admin/gemstones/[id]/route.ts` DELETE handler

- Call RPC function
- Delete storage objects using service-role client server-side
- Return success/failure with cleanup status

**Update `GemstoneAdminService.deleteGemstone`**:

- Call new API endpoint instead of direct delete

### 3.2 Orphaned Data Cleanup (Optional Background Job)

**Script**: `scripts/cleanup-orphaned-media.ts`

- Find storage files not referenced in any `gemstone_images` or `gemstone_videos` records
- Log candidates for deletion
- Optional: automated cleanup with safety checks

## Phase 4: Database Improvements

### 4.1 Timestamp Trigger

**Migration**: Replace client-side `updated_at` stamping with database trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gemstones_updated_at BEFORE UPDATE ON gemstones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Apply to: `gemstones`, `gemstones_ai_v6`, `gemstone_images`, `gemstone_videos`, `certifications`

## Implementation Order

1. Phase 1.1 - Move service-role to server (security critical)
2. Phase 1.2 - RLS policy migration (security critical)
3. Phase 2.1 - Core fields (quantity, metadata_status)
4. Phase 2.2 - Price per carat (migration, backfill, trigger, UI)
5. Phase 2.3 - AI moderation dashboard
6. Phase 2.4 - Certifications CRUD
7. Phase 2.5 - Media enhancements
8. Phase 2.6 - Bulk operations
9. Phase 2.7 - Import metadata display
10. Phase 3 - Cascading deletes
11. Phase 4 - Database improvements

## Key Files

- **Services**: `src/lib/services/gemstone-admin-service.ts`, `media-upload-service.ts`, `price-management-service.ts`
- **Components**: `src/components/admin/gemstones/GemstoneForm.tsx`, `EnhancedMediaUpload.tsx`, `BulkEditModal.tsx`
- **New Components**: `AIReviewDashboard.tsx`, `CertificationManager.tsx`
- **API Routes**: `app/api/admin/gemstones/**/*.ts` (new structure)
- **Migrations**: `supabase/migrations/*.sql` (RLS policies, triggers, audit fields)
- **Scripts**: `scripts/backfill-price-per-carat.ts`, `scripts/cleanup-orphaned-media.ts`

### To-dos

- [ ] Create server API routes for media upload, pricing, and gemstone creation to replace service-role client usage
- [ ] Create migration with RLS policies for admin INSERT/UPDATE/DELETE on all gemstone tables
- [ ] Add quantity field to GemstoneForm with default=1 and migration to set DB default
- [ ] Add metadata_status field to GemstoneForm with enum validation
- [ ] Create migration for price_per_carat with backfill script for existing gemstones
- [ ] Create database trigger to update price_amount when price_per_carat changes
- [ ] Add price_per_carat field to GemstoneForm and bulk edit modal
- [ ] Build AI moderation dashboard with confidence scores, review flags, and edit capabilities for all AI fields
- [ ] Extend gemstones_ai_v6 table with audit trail fields (reviewed_by, reviewed_at, approval_status) via migration
- [ ] Build CertificationManager component with CRUD operations and file upload to storage
- [ ] Create API endpoints for certification create/read/update/delete operations
- [ ] Add drag-and-drop reordering UI for images/videos in EnhancedMediaUpload
- [ ] Add editing capabilities for alt_text and has_watermark flag in media management
- [ ] Extend BulkEditModal and BulkImport to cover new fields (quantity, metadata_status, price_per_carat)
- [ ] Add read-only import metadata section to gemstone detail page
- [ ] Create database RPC function for transactional gemstone deletion with related records cleanup
- [ ] Create DELETE API endpoint that calls RPC and cleans up storage objects server-side
- [ ] Create database triggers to auto-update updated_at timestamps instead of client-side stamping