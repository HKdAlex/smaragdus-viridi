# Video Processing Alternatives Analysis

## Current Issue

**Problem**: ffmpeg.wasm doesn't work reliably in Deno Edge Functions (Supabase)
- Edge Functions are returning 500 errors
- Videos get stuck in "processing" status
- WASM support limitations in Deno runtime

## Option Comparison

### Option 1: AWS EC2 Instance ✅ **RECOMMENDED**

**Pros:**
- ✅ Full control over environment
- ✅ Native ffmpeg support (not WASM)
- ✅ High performance (can use GPU instances)
- ✅ Cost-effective for consistent workloads
- ✅ Can process large videos without timeout
- ✅ Supports all ffmpeg features

**Cons:**
- ⚠️ Requires server management
- ⚠️ Need to set up API endpoint
- ⚠️ Scaling requires manual configuration or auto-scaling

**Cost Estimate:**
- **t3.medium** (2 vCPU, 4GB RAM): ~$30/month
- **c5.large** (2 vCPU, 4GB RAM): ~$68/month (better for CPU-intensive)
- **Spot Instances**: Up to 90% cheaper (~$3-7/month)

**Processing Time:**
- 27MB video: **5-15 seconds** (much faster than WASM)
- Native ffmpeg is 10-50x faster than ffmpeg.wasm

**Implementation:**
1. Launch EC2 instance (Ubuntu/Debian)
2. Install ffmpeg: `apt-get install ffmpeg`
3. Create Express.js API endpoint
4. Call from Edge Function or directly from confirm route
5. Process video and upload back to Supabase Storage

---

### Option 2: AWS Lambda with FFmpeg Layer ✅ **GOOD ALTERNATIVE**

**Pros:**
- ✅ Serverless (no server management)
- ✅ Auto-scaling
- ✅ Pay per use
- ✅ Native ffmpeg via Lambda Layer
- ✅ 15-minute timeout (enough for most videos)

**Cons:**
- ⚠️ Cold starts (1-3 seconds)
- ⚠️ 512MB-10GB memory limit
- ⚠️ More complex setup

**Cost Estimate:**
- ~$0.20 per 1000 requests
- ~$0.0000166667 per GB-second
- **27MB video**: ~$0.001 per video

**Processing Time:**
- 27MB video: **10-30 seconds**

**Implementation:**
1. Use existing ffmpeg Lambda Layer (e.g., `serverless-ffmpeg`)
2. Create Lambda function
3. Call from Edge Function or confirm route
4. Process and upload back

---

### Option 3: External Video Processing API ✅ **SIMPLEST**

**Services:**
- **Cloudflare Stream** - $1 per 1000 minutes
- **Mux** - $0.015 per minute
- **AWS MediaConvert** - Pay per minute
- **Video.js Cloud** - Various pricing

**Pros:**
- ✅ No infrastructure management
- ✅ Highly optimized
- ✅ Automatic scaling
- ✅ Professional quality

**Cons:**
- ⚠️ Ongoing costs per video
- ⚠️ Less control
- ⚠️ Vendor lock-in

**Cost Estimate:**
- **Mux**: ~$0.23 per 15-second video
- **Cloudflare Stream**: ~$0.015 per video

---

### Option 4: Keep Current (Graceful Degradation) ⚠️ **TEMPORARY**

**Current Status:**
- Function completes with original video if optimization fails
- Videos don't get stuck
- No optimization applied

**Pros:**
- ✅ Already implemented
- ✅ No additional costs
- ✅ Videos still work

**Cons:**
- ❌ No actual optimization
- ❌ Large file sizes
- ❌ Poor user experience

---

## Recommendation: AWS EC2

**Why EC2 is best for your use case:**

1. **Cost-Effective**: 
   - Spot instances: ~$5-10/month
   - Can process hundreds of videos
   - Much cheaper than per-video APIs

2. **Performance**:
   - Native ffmpeg: 10-50x faster than WASM
   - 27MB video: 5-15 seconds vs 60-120 seconds

3. **Control**:
   - Full control over processing parameters
   - Can customize for your needs
   - No vendor lock-in

4. **Reliability**:
   - No WASM limitations
   - Stable environment
   - Can handle large videos

## Implementation Plan for EC2

### Step 1: Set Up EC2 Instance

```bash
# Launch EC2 instance (Ubuntu 22.04)
# Instance type: t3.medium or c5.large
# Storage: 20GB

# Install dependencies
sudo apt update
sudo apt install -y ffmpeg nodejs npm

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Create Processing API

```javascript
// server.js
const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const upload = multer({ dest: '/tmp/' });

app.post('/optimize-video', upload.single('video'), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `/tmp/output_${Date.now()}.mp4`;
  const thumbnailPath = `/tmp/thumb_${Date.now()}.jpg`;
  
  try {
    // Optimize video
    await execPromise(`ffmpeg -i ${inputPath} \
      -c:v libx264 -preset slow -crf 23 -maxrate 4M -bufsize 8M \
      -c:a aac -b:a 128k \
      -movflags +faststart \
      -y ${outputPath}`);
    
    // Extract thumbnail
    await execPromise(`ffmpeg -i ${inputPath} \
      -ss 00:00:01 -vframes 1 -q:v 2 \
      -y ${thumbnailPath}`);
    
    // Get file sizes
    const originalSize = (await fs.stat(inputPath)).size;
    const optimizedSize = (await fs.stat(outputPath)).size;
    
    // Return results
    res.json({
      success: true,
      optimizedVideo: await fs.readFile(outputPath),
      thumbnail: await fs.readFile(thumbnailPath),
      originalSize,
      optimizedSize,
      optimizationPercentage: ((originalSize - optimizedSize) / originalSize) * 100
    });
    
    // Cleanup
    await fs.unlink(inputPath);
    await fs.unlink(outputPath);
    await fs.unlink(thumbnailPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

### Step 3: Update Edge Function

Call EC2 API instead of using ffmpeg.wasm:

```typescript
// In optimize-video Edge Function
const ec2ApiUrl = Deno.env.get("EC2_VIDEO_PROCESSING_URL");

// Download video
const videoBlob = await videoData.blob();

// Send to EC2 for processing
const formData = new FormData();
formData.append('video', videoBlob, 'video.mp4');

const response = await fetch(`${ec2ApiUrl}/optimize-video`, {
  method: 'POST',
  body: formData
});

const result = await response.json();
// Upload result.optimizedVideo back to Storage
```

---

## Quick Comparison

| Option | Setup Complexity | Cost/Month | Processing Time | Reliability |
|--------|------------------|------------|-----------------|-------------|
| **EC2** | Medium | $5-30 | 5-15s | ⭐⭐⭐⭐⭐ |
| **Lambda** | Medium | $0.10-1 | 10-30s | ⭐⭐⭐⭐ |
| **External API** | Low | $50-200 | 30-60s | ⭐⭐⭐⭐⭐ |
| **Current (WASM)** | Low | $0 | N/A (fails) | ⭐ |

---

## Next Steps

1. **Short-term**: Keep current implementation (graceful degradation)
2. **Medium-term**: Set up EC2 instance for video processing
3. **Long-term**: Consider Lambda or external API if volume increases

Would you like me to:
1. Set up the EC2 processing service?
2. Create a Lambda function instead?
3. Integrate with an external API service?


