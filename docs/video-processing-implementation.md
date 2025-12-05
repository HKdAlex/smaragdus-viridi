# Video Processing Implementation Plan

## Recommendation: Server-Side Processing ✅

**Why server-side?**

- ✅ No manual work for admins
- ✅ Consistent quality across all uploads
- ✅ Automatic optimization (bitrate, faststart)
- ✅ Better user experience (no client-side delays)
- ✅ Can extract metadata (duration, thumbnail)

**Why NOT client-side preprocessing?**

- ❌ Requires admins to know how to optimize
- ❌ Inconsistent quality
- ❌ Easy to forget/skip
- ❌ Browser-based processing is slower
- ❌ Large files can crash browser

---

## Architecture Options

### Option 1: Supabase Edge Functions (RECOMMENDED) ⭐

**Best choice** because:

- ✅ Already using Supabase
- ✅ Can run up to 300 seconds (5 minutes)
- ✅ Can install ffmpeg
- ✅ Triggered automatically via Storage webhooks
- ✅ No Vercel timeout issues

**Flow:**

```
1. Admin uploads video → Direct to Supabase Storage (current flow)
2. Storage webhook triggers Edge Function
3. Edge Function downloads video
4. Edge Function processes with ffmpeg:
   - Reduce bitrate (2-4 Mbps)
   - Add faststart
   - Extract thumbnail
   - Extract duration
5. Edge Function uploads optimized video
6. Edge Function updates database record
7. Delete original if optimization successful
```

### Option 2: Vercel API Route (NOT RECOMMENDED)

**Limitations:**

- ❌ 10s timeout (Hobby) or 60s (Pro) - too short for video processing
- ❌ No ffmpeg available by default
- ❌ Memory limits
- ❌ Would need to download, process, re-upload (slow)

**Only viable if:**

- Videos are very small (< 5MB)
- Processing is minimal (just faststart)

### Option 3: Separate Processing Service

**Options:**

- AWS Lambda with ffmpeg layer
- Google Cloud Functions
- Railway/Render with background workers

**Pros:**

- More control
- Can scale independently

**Cons:**

- More complex setup
- Additional service to manage
- Higher cost

---

## Recommended Implementation: Supabase Edge Function

### Step 1: Create Edge Function

**File:** `supabase/functions/optimize-video/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMSTONE_MEDIA_BUCKET = "gemstone-media";

serve(async (req) => {
  try {
    // Get webhook payload from Supabase Storage
    const payload = await req.json();
    const { record } = payload;

    // Only process videos
    if (!record.path.includes("/videos/")) {
      return new Response(
        JSON.stringify({ message: "Not a video, skipping" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download original video
    const { data: videoData, error: downloadError } = await supabase.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .download(record.path);

    if (downloadError || !videoData) {
      throw new Error(`Failed to download video: ${downloadError?.message}`);
    }

    const videoBlob = await videoData.blob();
    const videoBuffer = await videoBlob.arrayBuffer();

    // Process video with ffmpeg
    const optimizedVideo = await optimizeVideoWithFFmpeg(videoBuffer);

    // Upload optimized video (replace original)
    const { error: uploadError } = await supabase.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .upload(record.path, optimizedVideo, {
        contentType: "video/mp4",
        upsert: true, // Replace original
        cacheControl: "3600",
      });

    if (uploadError) {
      throw new Error(
        `Failed to upload optimized video: ${uploadError.message}`
      );
    }

    // Extract metadata
    const metadata = await extractVideoMetadata(videoBuffer);

    // Update database record if exists
    const gemstoneId = extractGemstoneId(record.path);
    if (gemstoneId) {
      await updateVideoMetadata(supabase, gemstoneId, record.path, metadata);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Video optimized successfully",
        metadata,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error optimizing video:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function optimizeVideoWithFFmpeg(
  videoBuffer: ArrayBuffer
): Promise<Uint8Array> {
  // Use ffmpeg.wasm or call external ffmpeg service
  // For Deno, we can use a subprocess or external API

  // Option A: Use ffmpeg.wasm (browser-compatible, works in Deno)
  // Option B: Call external processing service
  // Option C: Use Supabase's built-in processing (if available)

  // This is a placeholder - actual implementation depends on available tools
  throw new Error("FFmpeg processing not yet implemented");
}

async function extractVideoMetadata(videoBuffer: ArrayBuffer): Promise<{
  duration: number;
  width: number;
  height: number;
  bitrate: number;
}> {
  // Extract metadata using ffprobe or similar
  // Placeholder
  return {
    duration: 0,
    width: 0,
    height: 0,
    bitrate: 0,
  };
}

function extractGemstoneId(path: string): string | null {
  const match = path.match(/gemstones\/([^/]+)\//);
  return match ? match[1] : null;
}

async function updateVideoMetadata(
  supabase: any,
  gemstoneId: string,
  path: string,
  metadata: any
) {
  // Find video record and update metadata
  const fileName = path.split("/").pop();

  const { data, error } = await supabase
    .from("gemstone_videos")
    .update({
      duration_seconds: metadata.duration,
      // Add other metadata fields as needed
    })
    .eq("gemstone_id", gemstoneId)
    .like("video_url", `%${fileName}%`)
    .select()
    .single();

  if (error) {
    console.warn("Failed to update video metadata:", error);
  }
}
```

### Step 2: Set Up Storage Webhook

**In Supabase Dashboard:**

1. Go to Storage → Buckets → `gemstone-media`
2. Enable webhooks
3. Add webhook URL: `https://your-project.supabase.co/functions/v1/optimize-video`
4. Set trigger: `INSERT` on `gemstone-media` bucket
5. Add headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

### Step 3: Alternative - Process on Confirm

If webhooks are complex, process when admin confirms upload:

**Modify:** `src/app/api/admin/gemstones/media/confirm/route.ts`

```typescript
// After successful upload, trigger optimization
if (mediaType === "video") {
  // Trigger async optimization (don't wait)
  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/optimize-video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: storagePath,
      gemstoneId,
    }),
  }).catch((error) => {
    console.error("Failed to trigger video optimization:", error);
    // Don't fail the upload if optimization fails
  });
}
```

---

## FFmpeg Processing Details

### Required FFmpeg Command

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -maxrate 4M \
  -bufsize 8M \
  -vf "scale=1440:1440:force_original_aspect_ratio=decrease" \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output.mp4
```

### FFmpeg in Deno/Edge Functions

**Option A: Use ffmpeg.wasm**

```typescript
import { createFFmpeg, fetchFile } from "https://esm.sh/@ffmpeg/ffmpeg@0.12.6";

const ffmpeg = createFFmpeg({ log: true });
await ffmpeg.load();

ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoBuffer));
await ffmpeg.run(
  "-i",
  "input.mp4",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "23",
  "-maxrate",
  "4M",
  "-bufsize",
  "8M",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-movflags",
  "+faststart",
  "output.mp4"
);
const optimizedData = ffmpeg.FS("readFile", "output.mp4");
```

**Option B: Call External FFmpeg Service**

- Use a service like Cloudflare Workers with ffmpeg
- Or AWS Lambda with ffmpeg layer
- Or dedicated video processing API

**Option C: Use Supabase Storage Transformations** (if available)

- Some storage services offer built-in video transformations
- Check if Supabase has this feature

---

## Implementation Steps

### Phase 1: Basic Optimization (Faststart Only)

1. ✅ Create Edge Function skeleton
2. ✅ Set up webhook or manual trigger
3. ✅ Add faststart processing (quick, no re-encoding)
4. ✅ Test with sample video

### Phase 2: Full Optimization

1. ✅ Add bitrate reduction
2. ✅ Add rotation handling
3. ✅ Extract metadata (duration, dimensions)
4. ✅ Generate thumbnail
5. ✅ Update database records

### Phase 3: Error Handling & Monitoring

1. ✅ Add retry logic for failed optimizations
2. ✅ Log processing times and file sizes
3. ✅ Alert on failures
4. ✅ Fallback to original if optimization fails

---

## Cost Considerations

### Supabase Edge Functions

- **Free tier:** 500K invocations/month
- **Pro tier:** 2M invocations/month included
- **Processing time:** Up to 300 seconds per invocation
- **Cost:** ~$0.00002 per GB-second

### Estimated Costs

- **Small video (5MB → 3MB):** ~$0.0001 per video
- **Medium video (26MB → 5MB):** ~$0.0005 per video
- **1000 videos/month:** ~$0.50

**Very affordable!** ✅

---

## Fallback Strategy

If optimization fails:

1. ✅ Keep original video
2. ✅ Log error for debugging
3. ✅ Notify admin (optional)
4. ✅ Allow manual re-processing later

---

## Testing Plan

1. **Unit Tests:**

   - Test video metadata extraction
   - Test path parsing
   - Test database updates

2. **Integration Tests:**

   - Upload test video
   - Verify webhook triggers
   - Verify optimization completes
   - Verify database updated

3. **Performance Tests:**
   - Measure processing time
   - Measure file size reduction
   - Test with various video sizes

---

## Next Steps

1. **Decide on approach:**

   - ✅ Supabase Edge Function (recommended)
   - ⚠️ Vercel API Route (limited)
   - ⚠️ External service (more complex)

2. **If using Edge Functions:**

   - Create function skeleton
   - Set up webhook
   - Implement ffmpeg processing
   - Test with sample video

3. **If using external service:**
   - Choose service (AWS Lambda, etc.)
   - Set up API endpoint
   - Integrate with upload flow

---

## Quick Start: Faststart Only (Easiest)

If full optimization is too complex initially, start with just faststart:

```typescript
// Simple faststart optimization (no re-encoding)
// Uses ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4

// This is quick and doesn't require full re-encoding
// Can be done in < 1 second for most videos
```

This alone will:

- ✅ Enable progressive download
- ✅ Allow immediate playback
- ✅ No quality loss
- ✅ Very fast processing

Then add bitrate optimization later.
