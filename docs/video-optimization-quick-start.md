# Video Optimization - Quick Start Guide

## ✅ What's Been Implemented

1. **Database Migration** - Adds optimization tracking columns
2. **Edge Function** - Video processing with ffmpeg.wasm
3. **Real-time Status Tracking** - UI updates automatically
4. **UI Notifications** - Shows optimization progress and results

## 🚀 Deployment Steps

### 1. Run Migration

```bash
# Link project if not already linked
supabase link --project-ref YOUR_PROJECT_REF

# Push migration
supabase db push
```

### 2. Deploy Edge Function

```bash
supabase functions deploy optimize-video
```

### 3. Set Up Storage Webhook

**In Supabase Dashboard:**

1. Go to **Storage** → **Policies** → **Webhooks** (or use Database → Webhooks)
2. Click **Create Webhook**
3. Configure:
   - **Name**: `video-optimization`
   - **Table**: `objects` (Storage)
   - **Events**: `INSERT`
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/optimize-video`
   - **HTTP Method**: `POST`
   - **HTTP Headers**:
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```
   - **Filter** (SQL):
     ```sql
     bucket_id = 'gemstone-media' AND name LIKE '%/videos/%.mp4'
     ```

**Get your Service Role Key:**
- Dashboard → Settings → API → `service_role` key (secret)

### 4. Test

1. Upload a video via admin UI
2. Watch for status badges: "Pending..." → "Processing..." → "✓ Optimized"
3. Check notification showing file size reduction

## 📊 What Happens

1. **Video Upload** → Status set to "pending"
2. **Webhook Triggers** → Edge Function starts processing
3. **Status Updates** → "processing" → "completed"
4. **UI Updates** → Real-time badge updates + notification
5. **Database Updated** → Optimization metrics saved

## 🔍 Monitoring

```bash
# View Edge Function logs
supabase functions logs optimize-video

# Check optimization status in database
SELECT 
  original_filename,
  processing_status,
  original_size_bytes,
  optimized_size_bytes,
  optimization_percentage
FROM gemstone_videos
WHERE processing_status IS NOT NULL
ORDER BY created_at DESC;
```

## ⚠️ Troubleshooting

**Webhook not triggering?**
- Verify webhook URL is correct
- Check Authorization header has service role key
- Verify filter matches your video paths

**Processing fails?**
- Check Edge Function logs
- Verify ffmpeg.wasm can load (needs internet access)
- Large videos (>100MB) may timeout

**Status not updating?**
- Verify Realtime is enabled on `gemstone_videos` table
- Check browser console for subscription errors

## 📝 Notes

- **Processing Time**: 30-60 seconds for typical videos
- **File Size**: Usually 70-85% reduction
- **Thumbnail**: Extracted at 1 second mark
- **Fallback**: If optimization fails, original video is kept

