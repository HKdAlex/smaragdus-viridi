/**
 * AWS Lambda function for video optimization using FFmpeg
 * 
 * This function processes videos uploaded to Supabase Storage:
 * - Optimizes video (bitrate reduction, faststart)
 * - Extracts thumbnail
 * - Extracts duration
 * 
 * Uses FFmpeg Layer: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

const execAsync = promisify(exec);

// FFmpeg paths (from Lambda Layer)
// Try common locations for FFmpeg in Lambda layers
const FFMPEG_PATHS = [
  '/opt/bin/ffmpeg',
  '/opt/ffmpeg/ffmpeg',
  '/opt/ffmpeg',
  '/var/task/ffmpeg',
  '/usr/local/bin/ffmpeg',
  '/usr/bin/ffmpeg',
];

const FFPROBE_PATHS = [
  '/opt/bin/ffprobe',
  '/opt/ffmpeg/ffprobe',
  '/opt/ffprobe',
  '/var/task/ffprobe',
  '/usr/local/bin/ffprobe',
  '/usr/bin/ffprobe',
];

// FFmpeg paths (will be initialized on first invocation)
let FFMPEG_PATH = null;
let FFPROBE_PATH = null;
let ffmpegInitialized = false;

/**
 * Initialize FFmpeg paths (called once per cold start)
 */
async function initializeFFmpeg() {
  if (ffmpegInitialized) return;
  
  // Check which FFmpeg path exists
  for (const testPath of FFMPEG_PATHS) {
    try {
      await fs.access(testPath);
      FFMPEG_PATH = testPath;
      console.log(`[video-optimizer] Found FFmpeg at: ${testPath}`);
      break;
    } catch (e) {
      // Path doesn't exist, try next
    }
  }

  // Check which FFprobe path exists
  for (const testPath of FFPROBE_PATHS) {
    try {
      await fs.access(testPath);
      FFPROBE_PATH = testPath;
      console.log(`[video-optimizer] Found FFprobe at: ${testPath}`);
      break;
    } catch (e) {
      // Path doesn't exist, try next
    }
  }

  if (!FFMPEG_PATH || !FFPROBE_PATH) {
    console.error('[video-optimizer] FFmpeg not found! Checked paths:', FFMPEG_PATHS);
    console.error('[video-optimizer] FFprobe not found! Checked paths:', FFPROBE_PATHS);
    
    // Try to find it using 'which' command as fallback
    try {
      const { stdout: ffmpegPath } = await execAsync('which ffmpeg');
      FFMPEG_PATH = ffmpegPath.trim();
      console.log(`[video-optimizer] Found FFmpeg via which: ${FFMPEG_PATH}`);
    } catch (e) {
      console.error('[video-optimizer] Could not find FFmpeg using which');
    }
    
    try {
      const { stdout: ffprobePath } = await execAsync('which ffprobe');
      FFPROBE_PATH = ffprobePath.trim();
      console.log(`[video-optimizer] Found FFprobe via which: ${FFPROBE_PATH}`);
    } catch (e) {
      console.error('[video-optimizer] Could not find FFprobe using which');
    }
    
    // Try listing /opt directory to see what's actually there
    try {
      const { stdout: optContents } = await execAsync('ls -la /opt/');
      console.log('[video-optimizer] Contents of /opt/:', optContents);
    } catch (e) {
      console.error('[video-optimizer] Could not list /opt/');
    }
    
    try {
      const { stdout: binContents } = await execAsync('ls -la /opt/bin/ 2>&1 || echo "Directory does not exist"');
      console.log('[video-optimizer] Contents of /opt/bin/:', binContents);
    } catch (e) {
      console.error('[video-optimizer] Could not list /opt/bin/');
    }
    
    if (!FFMPEG_PATH || !FFPROBE_PATH) {
      throw new Error('FFmpeg or FFprobe not found in Lambda layer. The layer may be empty or incorrectly configured. Please check the layer contents.');
    }
  }
  
  ffmpegInitialized = true;
}

/**
 * Optimize video with FFmpeg
 */
async function optimizeVideo(inputPath, outputPath) {
  const command = `${FFMPEG_PATH} -i ${inputPath} \
    -c:v libx264 \
    -preset slow \
    -crf 23 \
    -maxrate 4M \
    -bufsize 8M \
    -c:a aac \
    -b:a 128k \
    -movflags +faststart \
    -y ${outputPath}`;

  await execAsync(command);
  
  const stats = await fs.stat(outputPath);
  return stats.size;
}

/**
 * Extract thumbnail from video
 */
async function extractThumbnail(inputPath, outputPath) {
  const command = `${FFMPEG_PATH} -i ${inputPath} \
    -ss 00:00:01 \
    -vframes 1 \
    -q:v 2 \
    -y ${outputPath}`;

  await execAsync(command);
  
  const thumbnailBuffer = await fs.readFile(outputPath);
  return thumbnailBuffer;
}

/**
 * Extract video duration
 */
async function extractDuration(inputPath) {
  const command = `${FFPROBE_PATH} -v error \
    -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 \
    ${inputPath}`;

  const { stdout } = await execAsync(command);
  const duration = parseFloat(stdout.trim());
  return isNaN(duration) ? null : Math.round(duration);
}

/**
 * Download file from URL
 */
async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Upload file to Supabase Storage using signed upload URL
 */
async function uploadToSupabase(uploadUrl, fileBuffer) {
  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileBuffer.length,
      },
    };

    const client = url.protocol === 'https:' ? https : http;
    const request = client.request(options, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve({ success: true });
        } else {
          const errorBody = Buffer.concat(chunks).toString();
          reject(new Error(`Upload failed: ${response.statusCode} ${errorBody}`));
        }
      });
    });

    request.on('error', reject);
    request.write(fileBuffer);
    request.end();
  });
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  // Initialize FFmpeg paths on first invocation
  await initializeFFmpeg();
  
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-opt-'));
  
  let inputPath, outputPath, thumbnailPath;
  
  try {
    // Parse input - support both videoUrl (for large files) and videoBuffer (for small files)
    // When using Function URL, event is wrapped in HTTP request format
    // When using SDK invocation, event is the direct object
    
    let payload = event;
    
    // Check if this is a Lambda Function URL event (has 'body' field)
    if (event.body) {
      console.log('[video-optimizer] Function URL event detected, extracting body');
      // Function URL wraps the request - extract body
      const body = event.isBase64Encoded 
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body;
      
      try {
        payload = JSON.parse(body);
        console.log('[video-optimizer] Parsed body:', {
          hasVideoUrl: !!payload.videoUrl,
          hasVideoBuffer: !!payload.videoBuffer,
          videoSize: payload.videoSize,
        });
      } catch (e) {
        console.error('[video-optimizer] Failed to parse body as JSON:', e);
        throw new Error(`Invalid JSON in request body: ${e.message}`);
      }
    } else {
      // Direct SDK invocation - event is the payload
      console.log('[video-optimizer] Direct SDK invocation detected');
      payload = event;
    }
    
    // Extract parameters from payload
    const { videoUrl, videoBuffer, videoSize, videoPath, uploadUrl, optimizedPath } = payload;
    
    console.log('[video-optimizer] Final extracted params:', {
      hasVideoUrl: !!videoUrl,
      hasVideoBuffer: !!videoBuffer,
      videoSize,
      videoPath,
      hasUploadUrl: !!uploadUrl,
      optimizedPath,
      uploadUrlPreview: uploadUrl ? uploadUrl.substring(0, 100) + '...' : 'missing',
      payloadKeys: Object.keys(payload),
    });
    
    let videoData;
    
    if (videoUrl) {
      // Download video from Supabase Storage signed URL
      console.log(`[video-optimizer] Downloading video from URL: ${videoPath || 'unknown path'}`);
      videoData = await downloadFile(videoUrl);
      console.log(`[video-optimizer] Downloaded video: ${videoData.length} bytes`);
    } else if (videoBuffer) {
      // Use provided base64 buffer (fallback for small files)
      videoData = Buffer.isBuffer(videoBuffer) 
        ? videoBuffer 
        : Buffer.from(videoBuffer, 'base64');
      console.log(`[video-optimizer] Using provided video buffer: ${videoData.length} bytes`);
    } else {
      throw new Error('Either videoUrl or videoBuffer is required');
    }

    // Write input file
    inputPath = path.join(tempDir, 'input.mp4');
    await fs.writeFile(inputPath, videoData);

    console.log(`[video-optimizer] Processing video: ${videoData.length} bytes`);

    // Optimize video
    outputPath = path.join(tempDir, 'output.mp4');
    const optimizedSize = await optimizeVideo(inputPath, outputPath);
    
    // Read optimized video
    const optimizedVideo = await fs.readFile(outputPath);

    // Extract thumbnail
    thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
    const thumbnail = await extractThumbnail(inputPath, thumbnailPath);

    // Extract duration
    const duration = await extractDuration(inputPath);

    // Calculate optimization percentage
    const originalSize = videoSize || videoData.length;
    const optimizationPercentage = originalSize > 0
      ? ((originalSize - optimizedSize) / originalSize) * 100
      : 0;

    console.log(`[video-optimizer] Optimization complete:`, {
      originalSize,
      optimizedSize,
      optimizationPercentage: optimizationPercentage.toFixed(2) + '%',
      duration,
    });

    // Upload optimized video to Supabase Storage if uploadUrl is provided
    let optimizedVideoUrl = null;
    if (uploadUrl && optimizedPath) {
      console.log('[video-optimizer] Uploading optimized video to Supabase Storage...');
      try {
        const uploadResponse = await uploadToSupabase(uploadUrl, optimizedVideo);
        if (uploadResponse.success) {
          optimizedVideoUrl = optimizedPath;
          console.log('[video-optimizer] Successfully uploaded optimized video to:', optimizedPath);
        } else {
          throw new Error(`Failed to upload: ${uploadResponse.error}`);
        }
      } catch (uploadError) {
        console.error('[video-optimizer] Upload error:', uploadError);
        // If upload fails, we can't return the video in response (too large)
        // So we must fail the entire operation
        throw new Error(`Failed to upload optimized video: ${uploadError.message}`);
      }
    } else {
      // CRITICAL: Without uploadUrl, we cannot return the optimized video (exceeds 6MB limit)
      // This should never happen if Edge Function is configured correctly
      console.error('[video-optimizer] MISSING uploadUrl! Cannot return optimized video:', {
        hasUploadUrl: !!uploadUrl,
        hasOptimizedPath: !!optimizedPath,
        optimizedSize: optimizedSize,
        payloadKeys: Object.keys({ videoUrl, videoBuffer, videoSize, videoPath, uploadUrl, optimizedPath }),
      });
      throw new Error('uploadUrl and optimizedPath are required. The optimized video is too large to return in the response. Please ensure the Edge Function provides uploadUrl and optimizedPath in the payload.');
    }

    // Ensure thumbnail is a Buffer before encoding
    let thumbnailBase64 = null;
    if (thumbnail && Buffer.isBuffer(thumbnail)) {
      try {
        thumbnailBase64 = thumbnail.toString('base64');
        console.log('[video-optimizer] Thumbnail encoded to base64, length:', thumbnailBase64.length);
      } catch (encodeError) {
        console.error('[video-optimizer] Failed to encode thumbnail to base64:', encodeError);
        // Continue without thumbnail - not critical
      }
    } else {
      console.warn('[video-optimizer] Thumbnail is not a valid Buffer:', typeof thumbnail);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        optimizedVideoUrl, // Path in Supabase Storage instead of base64
        thumbnail: thumbnailBase64, // Thumbnail as base64 string or null
        duration,
        originalSize,
        optimizedSize,
        optimizationPercentage: parseFloat(optimizationPercentage.toFixed(2)),
      }),
    };
  } catch (error) {
    console.error('[video-optimizer] Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
    };
  } finally {
    // Cleanup temp files
    try {
      const files = [inputPath, outputPath, thumbnailPath].filter(Boolean);
      await Promise.all(files.map(file => fs.unlink(file).catch(() => {})));
      await fs.rmdir(tempDir).catch(() => {});
    } catch (cleanupError) {
      console.warn('[video-optimizer] Cleanup error:', cleanupError);
    }
  }
};


