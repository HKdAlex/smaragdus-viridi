# Video Optimization Analysis

## Current Video Properties

**File:** `20250921_154108.mp4`
**File Size:** 26 MB
**Duration:** 15.3 seconds

### Video Stream

- **Codec:** H.264 (AVC) High Profile, Level 4.0 ✅
- **Resolution:** 1440×1440 (square, 1:1 aspect ratio)
- **Frame Rate:** 30 fps
- **Bitrate:** ~13.9 Mbps ⚠️ **VERY HIGH**
- **Pixel Format:** yuv420p ✅
- **Rotation:** -90 degrees (metadata)

### Audio Stream

- **Codec:** AAC-LC ✅
- **Sample Rate:** 48 kHz ✅
- **Channels:** Stereo (2) ✅
- **Bitrate:** 256 kbps ✅

### Container

- **Format:** MP4 (QuickTime/MOV compatible) ✅
- **Faststart:** ❌ **NOT OPTIMIZED** (moov atom not at beginning)

---

## Issues Identified

### 🔴 Critical Issues

1. **Extremely High Bitrate (13.9 Mbps)**

   - **Current:** 13.9 Mbps
   - **Recommended:** 2-4 Mbps for 1440×1440
   - **Impact:**
     - Large file size (26 MB for 15 seconds)
     - Slow loading times
     - High bandwidth costs
     - Poor mobile experience
     - May cause playback issues on slower connections

2. **Missing Faststart Optimization**
   - **Current:** moov atom not at beginning
   - **Impact:**
     - Video cannot start playing until entire file is downloaded
     - Poor user experience (long wait times)
     - No progressive download support

### 🟡 Moderate Issues

3. **Rotation Metadata**

   - Video has -90° rotation metadata
   - May cause playback issues if browser doesn't handle rotation properly
   - Should be baked into the video or handled explicitly

4. **File Size**
   - 26 MB for 15 seconds is very large
   - Should be ~3-5 MB for web delivery

---

## Optimization Recommendations

### 1. Reduce Bitrate (CRITICAL)

**Target:** 2-4 Mbps for 1440×1440 resolution

```bash
# High quality (4 Mbps) - recommended for gemstone showcase
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
  output_optimized.mp4

# Medium quality (2.5 Mbps) - good balance
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 25 \
  -maxrate 2.5M \
  -bufsize 5M \
  -vf "scale=1440:1440:force_original_aspect_ratio=decrease" \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output_medium.mp4
```

**Expected Results:**

- File size: ~3-5 MB (down from 26 MB)
- Loading time: ~80% reduction
- Quality: Still excellent for web display

### 2. Add Faststart Flag (CRITICAL)

```bash
# Re-encode with faststart (if not already done)
ffmpeg -i input.mp4 \
  -c copy \
  -movflags +faststart \
  output_faststart.mp4

# Or add faststart to existing optimized file
ffmpeg -i optimized.mp4 \
  -c copy \
  -movflags +faststart \
  output.mp4
```

**Expected Results:**

- Video can start playing immediately
- Progressive download support
- Better user experience

### 3. Handle Rotation

**Option A: Bake rotation into video (recommended)**

```bash
ffmpeg -i input.mp4 \
  -vf "transpose=2" \  # Rotate 90° clockwise
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -movflags +faststart \
  output_rotated.mp4
```

**Option B: Handle in browser (current approach)**

- Ensure video element handles rotation metadata
- Test across browsers

### 4. Create Multiple Resolutions (Optional but Recommended)

For responsive video delivery:

```bash
# 1440p (original) - 4 Mbps
ffmpeg -i input.mp4 -vf "scale=1440:1440" -c:v libx264 -preset slow -crf 23 -maxrate 4M -bufsize 8M -c:a aac -b:a 128k -movflags +faststart output_1440p.mp4

# 1080p - 2.5 Mbps
ffmpeg -i input.mp4 -vf "scale=1080:1080" -c:v libx264 -preset slow -crf 25 -maxrate 2.5M -bufsize 5M -c:a aac -b:a 128k -movflags +faststart output_1080p.mp4

# 720p - 1.5 Mbps (for mobile)
ffmpeg -i input.mp4 -vf "scale=720:720" -c:v libx264 -preset slow -crf 27 -maxrate 1.5M -bufsize 3M -c:a aac -b:a 96k -movflags +faststart output_720p.mp4
```

Then use `<source>` elements with `srcset` or serve appropriate resolution based on device.

---

## Recommended Optimization Workflow

### For New Uploads (Server-Side Processing)

1. **Accept upload** → Store temporarily
2. **Transcode** with optimized settings:
   - Bitrate: 2-4 Mbps
   - Faststart: enabled
   - Rotation: baked in
3. **Store optimized version** → Delete original
4. **Optional:** Generate multiple resolutions

### For Existing Videos

1. **Batch process** all existing videos
2. **Re-upload** optimized versions
3. **Update database** with new URLs

---

## Codec Compatibility

✅ **Current codec (H.264 High Profile) is excellent for web:**

- Supported by all modern browsers
- Hardware acceleration available
- Good compression efficiency

**No need to change codec** - just optimize bitrate and add faststart.

---

## Expected Improvements

| Metric               | Current   | Optimized  | Improvement          |
| -------------------- | --------- | ---------- | -------------------- |
| File Size            | 26 MB     | 3-5 MB     | **80-85% reduction** |
| Bitrate              | 13.9 Mbps | 2-4 Mbps   | **70-85% reduction** |
| Load Time (10 Mbps)  | ~21 sec   | ~2.5-4 sec | **80-88% faster**    |
| Load Time (5 Mbps)   | ~42 sec   | ~5-8 sec   | **80-88% faster**    |
| Progressive Playback | ❌        | ✅         | **Immediate start**  |
| Mobile Experience    | Poor      | Good       | **Much better**      |

---

## Implementation Priority

1. **🔴 HIGH:** Add faststart optimization (quick fix)
2. **🔴 HIGH:** Reduce bitrate to 2-4 Mbps (major improvement)
3. **🟡 MEDIUM:** Handle rotation properly
4. **🟢 LOW:** Create multiple resolutions (nice to have)

---

## Quick Fix Command

**One-liner to optimize existing video:**

```bash
ffmpeg -i "/Users/alex/Desktop/20250921_154108.mp4" \
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -maxrate 4M \
  -bufsize 8M \
  -vf "transpose=2" \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  "/Users/alex/Desktop/20250921_154108_optimized.mp4"
```

This will:

- Reduce bitrate to ~4 Mbps
- Add faststart
- Bake in rotation
- Maintain high quality
- Reduce file size by ~80%

---

## Next Steps

1. **Immediate:** Optimize this test video and verify playback
2. **Short-term:** Add video optimization to upload pipeline
3. **Long-term:** Consider CDN with automatic transcoding (e.g., Cloudflare Stream, Mux)
