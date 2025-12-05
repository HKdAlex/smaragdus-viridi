# Video Optimization Deployment Guide

## Prerequisites

1. Supabase CLI installed (`supabase --version`)
2. Project linked to remote Supabase project
3. Docker running (for local testing, optional)

## Step 1: Run Database Migration

Apply the migration to add optimization tracking columns:

```bash
# If not already linked, link your project first
supabase link --project-ref YOUR_PROJECT_REF

# Push migration to remote database
supabase db push

# Or apply migration directly
supabase migration up
```

The migration adds these columns to `gemstone_videos`:
- `processing_status` (pending/processing/completed/failed)
- `original_size_bytes`
- `optimized_size_bytes`
- `optimization_percentage`

## Step 2: Deploy Edge Function

Deploy the optimize-video Edge Function:

```bash
# Deploy the function
supabase functions deploy optimize-video

# Verify deployment
supabase functions list
```

The function will be available at:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/optimize-video`

## Step 3: Set Up Storage Webhook

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Policies** → **Webhooks**
3. Click **Create Webhook**
4. Configure:
   - **Name**: `video-optimization-webhook`
   - **Table**: `objects` (Storage objects)
   - **Events**: `INSERT`
   - **HTTP Request**:
     - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/optimize-video`
     - **HTTP Method**: `POST`
     - **HTTP Headers**:
       ```
       Authorization: Bearer YOUR_SERVICE_ROLE_KEY
       Content-Type: application/json
       ```
   - **Filter**: 
     ```sql
     bucket_id = 'gemstone-media' AND name LIKE '%/videos/%.mp4'
     ```

### Option B: Via SQL (Alternative)

Run this SQL in the Supabase SQL Editor:

```sql
-- Create webhook function
CREATE OR REPLACE FUNCTION public.handle_new_video()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/optimize-video',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'objects',
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_video_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'gemstone-media' AND NEW.name LIKE '%/videos/%.mp4')
  EXECUTE FUNCTION public.handle_new_video();
```

**Note**: Replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY` with your actual values.

## Step 4: Verify Deployment

1. **Test the Edge Function**:
   ```bash
   # Test with a sample payload
   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/optimize-video \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "INSERT",
       "table": "objects",
       "record": {
         "path": "gemstones/test-id/videos/test.mp4",
         "metadata": {
           "size": 1000000,
           "mimetype": "video/mp4"
         }
       }
     }'
   ```

2. **Upload a test video** via the admin UI and verify:
   - Status changes from "pending" → "processing" → "completed"
   - Optimization metrics appear in the database
   - Thumbnail is generated
   - File size is reduced

## Step 5: Monitor and Debug

### Check Edge Function Logs

```bash
# View recent logs
supabase functions logs optimize-video

# Follow logs in real-time
supabase functions logs optimize-video --follow
```

### Check Database

```sql
-- Check optimization status
SELECT 
  id,
  original_filename,
  processing_status,
  original_size_bytes,
  optimized_size_bytes,
  optimization_percentage,
  thumbnail_url,
  duration_seconds
FROM gemstone_videos
WHERE processing_status IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Edge Function Timeout

If videos are too large and processing times out:
- Edge Functions have a 300-second timeout
- Consider processing smaller videos or using an external service
- Add retry logic for failed optimizations

### FFmpeg.wasm Issues

If ffmpeg.wasm fails to load:
- Check Edge Function logs for errors
- Verify network access to unpkg.com (for ffmpeg.wasm CDN)
- Consider using an external video processing service

### Webhook Not Triggering

1. Verify webhook is configured correctly
2. Check Storage bucket policies allow INSERT
3. Verify webhook URL is correct
4. Check Edge Function logs for incoming requests

### Migration Errors

If migration fails:
```bash
# Check migration status
supabase migration list

# Rollback if needed
supabase migration down

# Re-apply
supabase migration up
```

## Performance Considerations

- **Processing Time**: Large videos (50MB+) may take 30-60 seconds
- **Concurrent Processing**: Multiple videos process sequentially
- **Cost**: Edge Function invocations are billed per GB-second
- **Storage**: Optimized videos replace originals (saves space)

## Next Steps

1. Monitor optimization success rate
2. Adjust bitrate settings if needed (currently 4Mbps max)
3. Add retry logic for failed optimizations
4. Consider batch processing for multiple videos
5. Add email notifications for failed optimizations (optional)

