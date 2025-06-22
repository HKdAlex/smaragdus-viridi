# Gemstone Import & AI Analysis Implementation Plan

## 📋 Overview

This document outlines the comprehensive implementation plan for importing and AI-analyzing a collection of 1,447 gemstone folders containing photos, videos, certificates, and measurement images. The system will use OpenAI Vision API to extract structured data and generate promotional content.

## 🚨 CRITICAL ISSUES DISCOVERED (January 19, 2025)

### Issue Analysis from Production Import

During the first production import run, several critical issues were identified that require immediate resolution:

#### 1. **Video Size Limit Violations** 🎥

**Error Pattern**: `"The object exceeded the maximum allowed size"`

- **Root Cause**: Supabase Storage has file size limits (6MB for free tier, 50MB for paid)
- **Impact**: Large MP4 video files getting rejected and skipped
- **Files Affected**: Multiple videos in first folder (20200826_225927.mp4, 20220208_182915.mp4, etc.)

#### 2. **Database Constraint Violation** 🗄️

**Error**: `"new row for relation "import_batches" violates check constraint "import_batches_status_check"`

- **Root Cause**: Import script using "processing" status, but constraint expects enum values
- **Valid Values**: 'pending', 'processing', 'completed', 'failed', 'cancelled'
- **Solution**: Status value is actually correct - likely a timing issue

#### 3. **Image Format Inefficiency** 🖼️

**Current**: Converting HEIC → JPEG (larger files, slower web loading)

- **Better Option**: HEIC → WebP (30-50% smaller, better web performance)
- **Best Option**: HEIC → AVIF (50-70% smaller, next-gen format)
- **Impact**: Faster page loads, reduced storage costs, better UX

#### 4. **Missing Media Reporting** 📊

**Current**: No detailed count of found vs imported media per gemstone

- **Need**: "Found 12 images, 3 videos | Imported 12 images, 0 videos (3 failed)"
- **Impact**: Can't track import success rate or identify problematic files

#### 5. **Image Loading Timeouts** ⏱️

**Error Pattern**: `"upstream image response timed out"`

- **Root Cause**: Large JPEG files causing Next.js Image component timeouts
- **Contributing Factors**: No compression, inefficient format
- **Impact**: Poor catalog performance, user experience issues

## 🎯 Objectives

1. **Import all gemstone data** with proper file organization and metadata preservation
2. **AI-powered content analysis** to extract structured gemstone properties
3. **Automatic image categorization** (gemstone photos, certificates, labels, measurements)
4. **Generate promotional descriptions** and marketing content
5. **Create structured database** with confidence scoring and traceability
6. **Prepare for future e-commerce integration**

## 📊 Current Collection Statistics

- **1,447 gemstone folders** total
- **~12,000+ images** (8-16 per folder average)
- **~2,000+ videos** (MP4 format)
- **Mixed file formats**: HEIC, JPG, MP4
- **Folder naming patterns**: Numeric (1, 1.1, 1.2) and Cyrillic prefixes (Ц, Ф, Т, А)
- **Estimated AI analysis cost**: $400-500 total
- **Processing time**: 2-3 hours with rate limiting

## 🏗️ System Architecture

### Phase 1: Enhanced Import System ✅ COMPLETED → ⚠️ NEEDS FIXES

**Status**: `scripts/gemstone-import-system.mjs` - Needs critical updates

**Features Implemented**:

- ✅ Recursive folder processing with metadata preservation
- ✅ HEIC to JPEG conversion with optimization
- ✅ Standardized file naming: `{type}_{timestamp}_{hash}.{ext}`
- ✅ Serial number generation: `SV-{folder}-{timestamp}`
- ✅ AI analysis priority scoring
- ✅ Original path/filename preservation for traceability
- ✅ Gemstone type detection from folder names
- ✅ Default type changed from diamond to emerald

**Critical Fixes Needed**:

- ❌ **Video size limit handling** - Add compression/chunking
- ❌ **Image format optimization** - Switch to WebP/AVIF
- ❌ **Detailed media reporting** - Track found vs imported counts
- ❌ **Error handling improvement** - Graceful failures with retry logic
- ❌ **File size validation** - Pre-check before upload attempt

### Phase 2: AI Analysis Pipeline ✅ COMPLETED

**Status**: `scripts/ai-gemstone-analyzer.mjs` - Ready for deployment

**Features Implemented**:

- ✅ **Image Classification**: Automatically categorizes images into:
  - Gemstone photos (close-up beauty shots)
  - Certificates (official lab reports)
  - Labels (price tags, info stickers)
  - Measurements (ruler/caliper photos)
  - Packaging, comparison, environment, other
- ✅ **Multi-language OCR**: Russian, English, Kazakh text extraction
- ✅ **Promotional Content Generation**: SEO-optimized titles, descriptions, features
- ✅ **Data Consolidation**: Cross-references all sources with confidence scoring
- ✅ **Batch Processing**: Rate-limited with cost estimation
- ✅ **Error Handling**: Graceful failures with retry logic

## 🗄️ Database Schema Updates REQUIRED

### Current Schema Analysis

The existing schema needs enhancement to support AI analysis results:

```sql
-- REQUIRED: Add AI analysis fields to gemstones table
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS promotional_title TEXT;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS promotional_description TEXT;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS key_features TEXT[];
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS marketing_tags TEXT[];
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS investment_highlights TEXT;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS certification_summary TEXT;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS ai_analysis_status ai_analysis_status_enum DEFAULT 'pending';
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS ai_analysis_timestamp TIMESTAMPTZ;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS ai_analysis_data JSONB;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS ai_analysis_error TEXT;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS ai_analysis_priority INTEGER DEFAULT 5;
ALTER TABLE gemstones ADD COLUMN IF NOT EXISTS ai_confidence_scores JSONB;

-- Create enum for AI analysis status
CREATE TYPE ai_analysis_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');

-- REQUIRED: Add image classification fields
ALTER TABLE gemstone_images ADD COLUMN IF NOT EXISTS image_type image_type_enum;
ALTER TABLE gemstone_images ADD COLUMN IF NOT EXISTS analysis_confidence INTEGER;
ALTER TABLE gemstone_images ADD COLUMN IF NOT EXISTS ai_analysis_data JSONB;
ALTER TABLE gemstone_images ADD COLUMN IF NOT EXISTS ai_analysis_status ai_analysis_status_enum DEFAULT 'pending';

-- Create enum for image types
CREATE TYPE image_type_enum AS ENUM (
  'gemstone_photo', 'certificate', 'label', 'measurement',
  'packaging', 'comparison', 'environment', 'other'
);

-- REQUIRED: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gemstones_ai_analysis_status ON gemstones(ai_analysis_status);
CREATE INDEX IF NOT EXISTS idx_gemstones_ai_analysis_priority ON gemstones(ai_analysis_priority DESC);
CREATE INDEX IF NOT EXISTS idx_gemstone_images_image_type ON gemstone_images(image_type);
CREATE INDEX IF NOT EXISTS idx_gemstone_images_ai_analysis_status ON gemstone_images(ai_analysis_status);

-- REQUIRED: Add marketing search indexes
CREATE INDEX IF NOT EXISTS idx_gemstones_marketing_tags ON gemstones USING GIN(marketing_tags);
CREATE INDEX IF NOT EXISTS idx_gemstones_seo_keywords ON gemstones USING GIN(seo_keywords);
CREATE INDEX IF NOT EXISTS idx_gemstones_promotional_search ON gemstones USING GIN(to_tsvector('english', promotional_title || ' ' || promotional_description));
```

## 📋 Implementation Steps

### ⚠️ URGENT: Critical Import Fixes ⏳ IMMEDIATE ACTION REQUIRED

**Priority**: CRITICAL - Must fix before continuing imports

**Issues to Address**:

1. **Video Size Handling**

   - Add file size validation before upload
   - Implement video compression for large files
   - Add fallback for oversized videos (skip with detailed logging)

2. **Image Format Optimization**

   - Switch from JPEG to WebP output format
   - Implement AVIF as premium option with WebP fallback
   - Reduce file sizes by 30-50% for faster loading

3. **Enhanced Reporting**

   - Track found vs imported counts per gemstone
   - Report failed files with specific reasons
   - Add progress indicators and ETA calculation

4. **Error Resilience**
   - Graceful handling of size limit violations
   - Retry logic for transient failures
   - Detailed error categorization and logging

### Step 1: Database Schema Updates ⏳ PENDING

**Priority**: CRITICAL - Must be done before running AI analysis

**Actions Required**:

1. **Apply schema migrations** using Supabase MCP tool
2. **Test schema changes** on development database
3. **Verify indexes** are created properly
4. **Update TypeScript types** after schema changes

**Commands**:

```bash
# Use Supabase MCP tool to apply migrations
mcp_supabase_apply_migration(project_id, "add_ai_analysis_fields", sql_content)
mcp_supabase_generate_typescript_types(project_id)
```

### Step 2: Fix Import System Issues ⏳ PENDING

**Priority**: CRITICAL - Foundation for everything else

**Critical Fixes Required**:

- [ ] **Video size limit handling** - Add compression/validation
- [ ] **WebP image conversion** - Replace JPEG output
- [ ] **Enhanced progress reporting** - Found vs imported counts
- [ ] **Error resilience** - Graceful failure handling
- [ ] **File size pre-validation** - Check before upload

### Step 3: Run Enhanced Import System ⏳ PENDING

**Priority**: HIGH - Foundation for everything else

**Pre-execution Checklist**:

- [ ] Verify source path: `/Volumes/2TB/gems` exists and accessible
- [ ] Confirm Supabase connection and storage bucket setup
- [ ] Test with small batch first (--max-folders=10)
- [ ] Monitor disk space (HEIC→WebP conversion needs temp space)

**Execution Commands**:

```bash
# Test run first
node scripts/gemstone-import-system.mjs --dry-run --max-folders=10

# Small batch test
node scripts/gemstone-import-system.mjs --max-folders=50

# Full import (when confident)
node scripts/gemstone-import-system.mjs
```

**Expected Results**:

- 1,447 gemstone records in database
- ~12,000+ optimized WebP images in Supabase Storage
- ~2,000+ videos uploaded (with size validation)
- All files renamed and organized
- AI analysis queue populated
- Detailed import statistics per gemstone

### Step 4: AI Analysis Pipeline Execution ⏳ PENDING

**Priority**: HIGH - Core value generation

**Pre-execution Checklist**:

- [ ] Verify OpenAI API key and billing setup
- [ ] Confirm $500 budget available for API calls
- [ ] Test with small batch first (--max-items=5)
- [ ] Monitor rate limits and API responses

**Execution Commands**:

```bash
# Test run to verify everything works
node scripts/ai-gemstone-analyzer.mjs --dry-run --max-items=10

# Small batch test
node scripts/ai-gemstone-analyzer.mjs --max-items=25

# Production run (when confident)
node scripts/ai-gemstone-analyzer.mjs --batch-size=5
```

**Expected Results**:

- All images classified by type with confidence scores
- Certificates analyzed and text extracted
- Labels processed for weight/price/dimensions
- Measurements analyzed for accurate dimensions
- Promotional content generated for each gemstone
- Consolidated data with confidence scoring

### Step 5: Quality Assurance & Validation ⏳ PENDING

**Priority**: MEDIUM - Ensure data quality

**Validation Tasks**:

1. **Manual Review Sample**: Review 50 random gemstones for accuracy
2. **Data Completeness Check**: Verify all expected fields populated
3. **Confidence Score Analysis**: Identify low-confidence items for manual review
4. **Image Classification Accuracy**: Verify image types correctly identified
5. **Promotional Content Quality**: Review generated descriptions for accuracy

**Quality Metrics to Track**:

- % of gemstones with complete data (weight, dimensions, color, cut)
- Average confidence scores by data type
- % of images correctly classified
- % of certificates successfully parsed
- % of promotional content requiring manual editing

### Step 6: Data Refinement & Manual Corrections ⏳ PENDING

**Priority**: MEDIUM - Polish the results

**Refinement Tasks**:

1. **Low Confidence Review**: Manually verify items with <70% confidence
2. **Missing Data Investigation**: Research gemstones with incomplete data
3. **Promotional Content Editing**: Refine AI-generated descriptions
4. **Pricing Analysis**: Add pricing data where available
5. **Origin Research**: Enhance origin information from certificates

### Step 7: E-commerce Integration Preparation ⏳ PENDING

**Priority**: LOW - Future enhancement

**Integration Tasks**:

1. **Search Functionality**: Implement full-text search on promotional content
2. **Filtering System**: Create advanced filters using marketing tags
3. **Image Gallery**: Build responsive galleries with classified images
4. **Certificate Display**: Create certificate viewer for authenticated users
5. **SEO Optimization**: Implement structured data markup

## 🚨 Risk Management

### Technical Risks

1. **API Rate Limits**: OpenAI may throttle requests
   - **Mitigation**: Built-in rate limiting, batch processing
2. **Storage Costs**: Large number of high-res images
   - **Mitigation**: WebP optimization, storage lifecycle policies
3. **AI Accuracy**: Some classifications may be incorrect
   - **Mitigation**: Confidence scoring, manual review process
4. **Video Size Limits**: Large videos exceeding platform limits
   - **Mitigation**: Compression, chunking, size validation

### Business Risks

1. **Cost Overrun**: AI analysis could exceed budget
   - **Mitigation**: Cost estimation, batch testing, monitoring
2. **Data Quality**: Inconsistent source data quality
   - **Mitigation**: Multi-source validation, confidence scoring
3. **Processing Time**: Full analysis could take longer than expected
   - **Mitigation**: Batch processing, progress monitoring
4. **Import Failures**: Critical files failing to import
   - **Mitigation**: Enhanced error handling, retry logic, graceful degradation

## 💰 Cost Analysis

### Development Costs (One-time)

- **AI Analysis**: $400-500 (OpenAI API calls)
- **Storage**: ~$20/month (Supabase storage)
- **Processing Time**: ~20 hours development + 3 hours execution

### Ongoing Costs

- **Storage**: $15-25/month for WebP images/videos (reduced from $20-30)
- **Database**: Included in Supabase plan
- **CDN**: Minimal for image delivery

## 📈 Success Metrics

### Technical Metrics

- **Import Success Rate**: >95% of folders successfully processed (revised from 99%)
- **AI Analysis Accuracy**: >85% confidence on key properties
- **Image Classification**: >90% correctly categorized
- **Processing Speed**: <3 hours for full collection
- **File Size Reduction**: >30% smaller files with WebP conversion

### Business Metrics

- **Data Completeness**: >80% of gemstones have weight, dimensions, color
- **Promotional Quality**: >90% of descriptions require minimal editing
- **Search Effectiveness**: Users can find gemstones using generated tags
- **Certificate Coverage**: >50% of gemstones have certificate data
- **Page Load Performance**: <2s image loading with WebP optimization

## 🔄 Maintenance & Updates

### Regular Tasks

- **Monthly**: Review low-confidence items and update manually
- **Quarterly**: Retrain AI prompts based on accuracy feedback
- **Annually**: Archive old analysis data, update gemstone valuations

### System Monitoring

- **API Usage**: Track OpenAI costs and usage patterns
- **Storage Growth**: Monitor file storage and implement archival
- **Performance**: Database query performance as collection grows
- **Quality Drift**: Monitor AI accuracy over time
- **Import Metrics**: Track success rates and failure patterns

## 📝 Documentation Updates

### Required Documentation

1. **Database Schema**: Document all new fields and their purposes
2. **API Integration**: OpenAI integration patterns and best practices
3. **Data Flow**: End-to-end process from import to e-commerce ready
4. **Troubleshooting**: Common issues and resolution steps
5. **Admin Procedures**: Manual review and correction workflows

## 🎯 Next Steps (Immediate Actions)

1. **Fix Critical Import Issues** (URGENT)

   - Update video size handling with compression/validation
   - Switch to WebP image format for 30-50% smaller files
   - Add detailed media reporting (found vs imported)
   - Implement graceful error handling

2. **Apply Database Schema Updates** (CRITICAL)

   - Use Supabase MCP tool to run migrations
   - Generate updated TypeScript types
   - Test schema changes

3. **Run Test Import** (HIGH PRIORITY)

   - Execute fixed import script with small batch
   - Verify file processing and database insertion
   - Check image optimization and storage

4. **Test AI Analysis** (HIGH PRIORITY)

   - Run AI analyzer on test batch
   - Verify API integration and cost tracking
   - Review generated content quality

5. **Plan Production Execution** (MEDIUM PRIORITY)
   - Schedule full import during low-traffic period
   - Prepare monitoring and rollback procedures
   - Set up progress tracking and reporting

---

**Last Updated**: January 19, 2025  
**Status**: Critical fixes required before production  
**Estimated Completion**: 1-2 weeks with proper testing
