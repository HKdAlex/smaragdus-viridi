// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMSTONE_MEDIA_BUCKET = "gemstone-media";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AWS_LAMBDA_FUNCTION_NAME = Deno.env.get("AWS_LAMBDA_FUNCTION_NAME");
const AWS_LAMBDA_FUNCTION_URL = Deno.env.get("AWS_LAMBDA_FUNCTION_URL"); // Alternative: Function URL (simpler)
const AWS_REGION = Deno.env.get("AWS_REGION") || "eu-north-1";

interface StorageWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: string;
    name: string;
    bucket_id: string;
    owner: string;
    created_at: string;
    updated_at: string;
    last_accessed_at: string;
    metadata: {
      size: number;
      mimetype: string;
      cacheControl: string;
      lastModified: string;
      etag: string;
    };
    path: string;
  };
  schema: string;
  old_record: null | Record<string, unknown>;
}

serve(async (req) => {
  let payload: any = null;
  let videoRecordId: string | null = null;

  try {
    // Parse webhook payload
    // Storage webhooks send different payload formats, handle both
    payload = await req.json();

    // Handle Storage webhook format (from Supabase Storage)
    let record = payload.record || payload;
    let path = record.path || record.name;

    // If payload has a different structure, try to extract path
    if (!path && payload.name) {
      path = payload.name;
      record = payload;
    }

    // Only process videos in the videos folder
    if (!path || !path.includes("/videos/") || !path.endsWith(".mp4")) {
      return new Response(
        JSON.stringify({ message: "Not a video file, skipping", path }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[optimize-video] Processing video:", {
      path: path,
      size: record.metadata?.size || 0,
      mimetype: record.metadata?.mimetype || "video/mp4",
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract gemstone ID from path: gemstones/{gemstoneId}/videos/{filename}
    const pathParts = path.split("/");
    const gemstoneIdIndex = pathParts.indexOf("gemstones");
    if (gemstoneIdIndex === -1 || gemstoneIdIndex + 1 >= pathParts.length) {
      throw new Error(
        `Could not extract gemstone ID from path: ${record.path}`
      );
    }
    const gemstoneId = pathParts[gemstoneIdIndex + 1];

    // Find the video record in database
    const { data: videoRecord, error: findError } = await supabase
      .from("gemstone_videos")
      .select("id, video_url")
      .eq("gemstone_id", gemstoneId)
      .like("video_url", `%${record.path.split("/").pop()}%`)
      .maybeSingle();

    if (findError) {
      console.error("[optimize-video] Error finding video record:", findError);
      throw new Error(`Failed to find video record: ${findError.message}`);
    }

    if (!videoRecord) {
      console.warn(
        "[optimize-video] Video record not found, skipping optimization"
      );
      return new Response(
        JSON.stringify({ message: "Video record not found in database" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Store video record ID for error handling
    videoRecordId = videoRecord.id;

    // Update status to processing
    const originalSize = record.metadata?.size || 0;
    await supabase
      .from("gemstone_videos")
      .update({
        processing_status: "processing",
        original_size_bytes: originalSize,
      })
      .eq("id", videoRecord.id);

    // Download original video
    const { data: videoData, error: downloadError } = await supabase.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .download(path);

    if (downloadError || !videoData) {
      throw new Error(`Failed to download video: ${downloadError?.message}`);
    }

    // In Deno Edge Functions, Supabase Storage download returns a Blob directly
    // Convert Blob to ArrayBuffer
    let videoBuffer: ArrayBuffer;
    try {
      if (videoData instanceof Blob) {
        videoBuffer = await videoData.arrayBuffer();
      } else if (typeof videoData === "object" && "arrayBuffer" in videoData) {
        // If it has arrayBuffer method, use it directly
        videoBuffer = await (videoData as any).arrayBuffer();
      } else {
        // Fallback: try to convert to Blob
        console.log(
          "[optimize-video] videoData type:",
          typeof videoData,
          "constructor:",
          videoData?.constructor?.name
        );
        const blob = new Blob([videoData as any]);
        videoBuffer = await blob.arrayBuffer();
      }
    } catch (blobError) {
      console.error(
        "[optimize-video] Error converting video data to buffer:",
        blobError
      );
      throw new Error(
        `Failed to convert video data to buffer: ${
          blobError instanceof Error ? blobError.message : String(blobError)
        }`
      );
    }

    console.log(
      "[optimize-video] Video downloaded, size:",
      videoBuffer.byteLength
    );

    // Process video with AWS Lambda (if configured) or fallback to original
    let optimizedVideo: Uint8Array;
    let thumbnail: Blob | null = null;
    let duration: number | null = null;
    let optimizationSucceeded = false;
    let lambdaError: string | null = null;

    if (AWS_LAMBDA_FUNCTION_NAME || AWS_LAMBDA_FUNCTION_URL) {
      try {
        console.log(
          "[optimize-video] Calling AWS Lambda for video processing...",
          `Video size: ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`
        );

        // Create signed URLs:
        // 1. Download URL for Lambda to get the original video
        // 2. Upload URL for Lambda to upload the optimized video directly to Supabase Storage
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from(GEMSTONE_MEDIA_BUCKET)
            .createSignedUrl(path, 3600); // Valid for 1 hour (download)

        if (signedUrlError || !signedUrlData?.signedUrl) {
          throw new Error(
            `Failed to create signed download URL: ${
              signedUrlError?.message || "Unknown error"
            }`
          );
        }

        // Create upload URL for optimized video (Lambda will upload directly)
        // Use a temporary path first, then we'll replace the original after optimization
        // createSignedUploadUrl doesn't support overwriting existing files
        const optimizedPath = path.replace(/\.mp4$/, "_optimized.mp4");
        console.log(
          "[optimize-video] Creating signed upload URL for optimized path:",
          optimizedPath,
          "(original path:",
          path + ")"
        );

        // Cleanup: Delete temporary file if it exists from a previous failed optimization
        const { error: deleteTempError } = await supabase.storage
          .from(GEMSTONE_MEDIA_BUCKET)
          .remove([optimizedPath]);

        if (deleteTempError) {
          // It's OK if the file doesn't exist - that's the normal case
          console.log(
            "[optimize-video] Temporary file cleanup (may not exist):",
            deleteTempError.message
          );
        } else {
          console.log(
            "[optimize-video] Cleaned up existing temporary file:",
            optimizedPath
          );
        }

        // Check if createSignedUploadUrl method exists
        const storageFrom = supabase.storage.from(GEMSTONE_MEDIA_BUCKET);
        if (typeof storageFrom.createSignedUploadUrl !== "function") {
          console.error(
            "[optimize-video] createSignedUploadUrl is not available in this Supabase client version"
          );
          throw new Error(
            "createSignedUploadUrl is not available. Please update @supabase/supabase-js to a newer version."
          );
        }

        const { data: uploadUrlData, error: uploadUrlError } =
          await storageFrom.createSignedUploadUrl(optimizedPath);

        console.log("[optimize-video] Upload URL creation result:", {
          hasError: !!uploadUrlError,
          error: uploadUrlError,
          hasData: !!uploadUrlData,
          dataType: typeof uploadUrlData,
          dataKeys: uploadUrlData ? Object.keys(uploadUrlData) : [],
          fullData: JSON.stringify(uploadUrlData || {}).substring(0, 500),
        });

        if (uploadUrlError || !uploadUrlData) {
          console.error("[optimize-video] Upload URL creation error:", {
            error: uploadUrlError,
            data: uploadUrlData,
          });
          throw new Error(
            `Failed to create signed upload URL: ${
              uploadUrlError?.message || "Unknown error"
            }`
          );
        }

        // createSignedUploadUrl returns { signedUrl, token, path }
        const uploadUrl = uploadUrlData.signedUrl || uploadUrlData;
        console.log("[optimize-video] Extracted upload URL:", {
          hasSignedUrl: !!uploadUrlData.signedUrl,
          uploadUrlType: typeof uploadUrl,
          uploadUrlLength: uploadUrl ? String(uploadUrl).length : 0,
          uploadUrlPreview: uploadUrl
            ? String(uploadUrl).substring(0, 100)
            : "missing",
        });

        if (!uploadUrl) {
          console.error(
            "[optimize-video] Upload URL is missing:",
            uploadUrlData
          );
          throw new Error(
            "Upload URL is missing from createSignedUploadUrl response"
          );
        }

        console.log(
          "[optimize-video] Created signed URLs for Lambda (download & upload)",
          {
            downloadUrl: signedUrlData.signedUrl.substring(0, 100) + "...",
            uploadUrl: uploadUrl.substring(0, 100) + "...",
            hasUploadUrl: !!uploadUrl,
            uploadUrlDataKeys: Object.keys(uploadUrlData || {}),
          }
        );

        // Call Lambda function with both download and upload URLs
        // Lambda will download original, optimize, upload optimized, and return metadata only
        console.log("[optimize-video] About to create lambdaPayload:", {
          uploadUrlType: typeof uploadUrl,
          uploadUrlValue: uploadUrl
            ? String(uploadUrl).substring(0, 100)
            : "undefined/null",
          path: path,
        });

        const lambdaPayload = {
          videoUrl: signedUrlData.signedUrl, // Download URL
          uploadUrl: uploadUrl, // Upload URL for optimized video
          videoSize: videoBuffer.byteLength,
          videoPath: path, // Original path
          optimizedPath: optimizedPath, // Temporary path for optimized video
          originalPath: path, // Keep reference to original path for replacement
        };

        console.log("[optimize-video] Created lambdaPayload:", {
          hasVideoUrl: !!lambdaPayload.videoUrl,
          hasUploadUrl: !!lambdaPayload.uploadUrl,
          uploadUrlInPayload: lambdaPayload.uploadUrl
            ? String(lambdaPayload.uploadUrl).substring(0, 100)
            : "missing",
          hasOptimizedPath: !!lambdaPayload.optimizedPath,
          videoSize: lambdaPayload.videoSize,
          videoPath: lambdaPayload.videoPath,
          optimizedPath: lambdaPayload.optimizedPath,
          payloadKeys: Object.keys(lambdaPayload),
          payloadString: JSON.stringify(lambdaPayload).substring(0, 500),
        });

        const lambdaResponse = await callLambdaFunction(lambdaPayload);

        console.log("[optimize-video] Lambda response received:", {
          success: lambdaResponse.success,
          hasThumbnail: !!lambdaResponse.thumbnail,
          thumbnailType: typeof lambdaResponse.thumbnail,
          thumbnailLength: lambdaResponse.thumbnail
            ? String(lambdaResponse.thumbnail).length
            : 0,
          hasOptimizedVideoUrl: !!lambdaResponse.optimizedVideoUrl,
          optimizedSize: lambdaResponse.optimizedSize,
          duration: lambdaResponse.duration,
          responseKeys: Object.keys(lambdaResponse),
        });

        if (lambdaResponse.success) {
          // Lambda uploaded the optimized video directly to Supabase Storage
          // We just need to handle the metadata (thumbnail, duration, sizes)

          // Decode thumbnail (small, returned as base64)
          if (lambdaResponse.thumbnail) {
            try {
              if (typeof lambdaResponse.thumbnail !== "string") {
                console.warn(
                  "[optimize-video] Thumbnail is not a string:",
                  typeof lambdaResponse.thumbnail
                );
              } else if (lambdaResponse.thumbnail.trim().length === 0) {
                console.warn("[optimize-video] Thumbnail is an empty string");
              } else {
                // Validate base64 string before decoding
                const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
                if (!base64Regex.test(lambdaResponse.thumbnail)) {
                  console.warn(
                    "[optimize-video] Thumbnail does not appear to be valid base64"
                  );
                } else {
                  const thumbnailArray = Uint8Array.from(
                    atob(lambdaResponse.thumbnail),
                    (c) => c.charCodeAt(0)
                  );
                  thumbnail = new Blob([thumbnailArray], {
                    type: "image/jpeg",
                  });
                  console.log(
                    "[optimize-video] Thumbnail decoded successfully, size:",
                    thumbnailArray.length
                  );
                }
              }
            } catch (thumbnailError) {
              const errorMsg =
                thumbnailError instanceof Error
                  ? thumbnailError.message
                  : String(thumbnailError);
              console.warn(
                "[optimize-video] Failed to decode thumbnail base64:",
                errorMsg,
                "Thumbnail length:",
                lambdaResponse.thumbnail
                  ? String(lambdaResponse.thumbnail).length
                  : 0
              );
              // Continue without thumbnail - not critical
              // Don't throw - thumbnail is optional
            }
          } else {
            console.log("[optimize-video] No thumbnail in Lambda response");
          }

          duration = lambdaResponse.duration || null;

          // Check if optimization actually happened
          const optimizedSize = lambdaResponse.optimizedSize || 0;
          if (
            optimizedSize > 0 &&
            optimizedSize < videoBuffer.byteLength * 0.95
          ) {
            optimizationSucceeded = true;
            console.log("[optimize-video] Lambda optimization completed:", {
              originalSize: videoBuffer.byteLength,
              optimizedSize: optimizedSize,
              reduction:
                (
                  ((videoBuffer.byteLength - optimizedSize) /
                    videoBuffer.byteLength) *
                  100
                ).toFixed(2) + "%",
              optimizedVideoUrl: lambdaResponse.optimizedVideoUrl,
            });

            // Lambda uploaded the optimized video to a temporary path (_optimized.mp4)
            // Now we need to replace the original with the optimized version
            console.log(
              "[optimize-video] Lambda uploaded optimized video to temporary path:",
              lambdaResponse.optimizedVideoUrl
            );

            // Download the optimized video from the temporary path
            const { data: optimizedVideoData, error: downloadError } =
              await supabase.storage
                .from(GEMSTONE_MEDIA_BUCKET)
                .download(lambdaResponse.optimizedVideoUrl || optimizedPath);

            if (downloadError || !optimizedVideoData) {
              throw new Error(
                `Failed to download optimized video: ${
                  downloadError?.message || "Unknown error"
                }`
              );
            }

            // Convert to Uint8Array for processing
            const optimizedArrayBuffer = await optimizedVideoData.arrayBuffer();
            optimizedVideo = new Uint8Array(optimizedArrayBuffer);

            // Upload optimized video to original path (replacing original)
            const { error: replaceError } = await supabase.storage
              .from(GEMSTONE_MEDIA_BUCKET)
              .upload(path, optimizedVideo, {
                contentType: "video/mp4",
                upsert: true, // Replace original
                cacheControl: "3600",
              });

            if (replaceError) {
              throw new Error(
                `Failed to replace original with optimized video: ${replaceError.message}`
              );
            }

            // Delete the temporary optimized file
            const { error: deleteError } = await supabase.storage
              .from(GEMSTONE_MEDIA_BUCKET)
              .remove([lambdaResponse.optimizedVideoUrl || optimizedPath]);

            if (deleteError) {
              console.warn(
                "[optimize-video] Failed to delete temporary optimized file:",
                deleteError
              );
              // Don't fail - the original is already replaced
            }

            console.log(
              "[optimize-video] Successfully replaced original with optimized video"
            );
          } else {
            console.log(
              "[optimize-video] Lambda returned same size, using original"
            );
            optimizedVideo = new Uint8Array(videoBuffer);
            optimizationSucceeded = false;
          }
        } else {
          throw new Error(
            `Lambda processing failed: ${
              lambdaResponse.error || "Unknown error"
            }`
          );
        }
      } catch (error) {
        lambdaError = error instanceof Error ? error.message : String(error);
        console.error(
          "[optimize-video] Lambda processing failed:",
          lambdaError
        );
        // Use original video if Lambda fails
        optimizedVideo = new Uint8Array(videoBuffer);
        optimizationSucceeded = false;
        // Mark as failed in database
        if (videoRecordId) {
          try {
            await supabase
              .from("gemstone_videos")
              .update({
                processing_status: "failed",
                error_message: lambdaError.substring(0, 500),
              })
              .eq("id", videoRecordId);
            console.log(
              "[optimize-video] Marked video as failed due to Lambda error"
            );
          } catch (updateError) {
            console.error(
              "[optimize-video] Failed to update failed status:",
              updateError
            );
          }
        }
        // Return early - don't continue processing
        return new Response(
          JSON.stringify({
            error: lambdaError,
            videoRecordId,
            message: "Video optimization failed",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.warn(
        "[optimize-video] AWS_LAMBDA_FUNCTION_NAME not configured, skipping optimization"
      );
      // Use original video if Lambda is not configured
      optimizedVideo = new Uint8Array(videoBuffer);
      optimizationSucceeded = false;
    }

    // If Lambda uploaded directly, the optimized video is already in storage
    // We don't need to upload again. Only upload if we're using the original flow
    // (when Lambda is not configured or failed)
    if (
      optimizationSucceeded &&
      !AWS_LAMBDA_FUNCTION_NAME &&
      !AWS_LAMBDA_FUNCTION_URL &&
      optimizedVideo.byteLength < videoBuffer.byteLength
    ) {
      // This branch is for non-Lambda optimization (if we add it later)
      const { error: uploadError } = await supabase.storage
        .from(GEMSTONE_MEDIA_BUCKET)
        .upload(path, optimizedVideo, {
          contentType: "video/mp4",
          upsert: true, // Replace original
          cacheControl: "3600",
        });

      if (uploadError) {
        console.warn(
          "[optimize-video] Failed to upload optimized video, keeping original:",
          uploadError
        );
        // Don't fail - keep original video
        optimizationSucceeded = false;
      }
    } else if (
      optimizationSucceeded &&
      (AWS_LAMBDA_FUNCTION_NAME || AWS_LAMBDA_FUNCTION_URL)
    ) {
      console.log(
        "[optimize-video] Lambda already uploaded optimized video to storage, skipping upload"
      );
    } else {
      console.log(
        "[optimize-video] Skipping upload - using original video (optimization not applied)"
      );
    }

    // Upload thumbnail if available
    let thumbnailUrl: string | null = null;
    if (thumbnail) {
      const thumbnailPath = path.replace(".mp4", "_thumb.jpg");
      const { data: thumbnailUploadData, error: thumbnailError } =
        await supabase.storage
          .from(GEMSTONE_MEDIA_BUCKET)
          .upload(thumbnailPath, thumbnail, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "3600",
          });

      if (thumbnailError) {
        console.warn(
          "[optimize-video] Failed to upload thumbnail:",
          thumbnailError
        );
        // Don't fail the whole process if thumbnail fails
      } else {
        // Get thumbnail public URL
        const {
          data: { publicUrl },
        } = supabase.storage
          .from(GEMSTONE_MEDIA_BUCKET)
          .getPublicUrl(thumbnailPath);
        thumbnailUrl = publicUrl;
      }
    }

    // Calculate optimization metrics
    const optimizedSize = optimizationSucceeded
      ? optimizedVideo.byteLength
      : originalSize;
    const optimizationPercentage =
      optimizationSucceeded && originalSize > 0
        ? ((originalSize - optimizedSize) / originalSize) * 100
        : 0;

    // Update database record with results
    const { error: updateError } = await supabase
      .from("gemstone_videos")
      .update({
        processing_status: "completed",
        thumbnail_url: thumbnailUrl,
        duration_seconds: duration,
        original_size_bytes: originalSize,
        optimized_size_bytes: optimizedSize,
        optimization_percentage: Math.round(optimizationPercentage * 100) / 100,
      })
      .eq("id", videoRecord.id);

    if (updateError) {
      console.error("[optimize-video] Failed to update database:", updateError);
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    console.log("[optimize-video] Video optimized successfully:", {
      videoId: videoRecord.id,
      originalSize,
      optimizedSize,
      optimizationPercentage: optimizationPercentage.toFixed(2) + "%",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Video optimized successfully",
        videoId: videoRecord.id,
        originalSize,
        optimizedSize,
        optimizationPercentage: optimizationPercentage.toFixed(2),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("[optimize-video] Error:", {
      message: errorMessage,
      stack: errorStack,
      videoRecordId,
      payload: payload
        ? JSON.stringify(payload).substring(0, 200)
        : "no payload",
    });

    // Update status to failed if we have video record ID
    if (videoRecordId) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("gemstone_videos")
          .update({
            processing_status: "failed",
            error_message: errorMessage.substring(0, 500), // Limit to 500 chars
          })
          .eq("id", videoRecordId);
        console.log(
          "[optimize-video] Updated status to failed for video:",
          videoRecordId,
          "Error:",
          errorMessage
        );
      } catch (updateError) {
        console.error(
          "[optimize-video] Failed to update failed status:",
          updateError
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        videoRecordId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Call AWS Lambda function for video processing
 * Supports two methods:
 * 1. Lambda Function URL (simpler, no AWS signing required)
 * 2. AWS SDK invocation (requires AWS credentials)
 */
async function callLambdaFunction(payload: {
  videoUrl?: string; // Supabase Storage signed URL (download)
  videoBuffer?: string; // Base64 encoded video (fallback for small files)
  videoSize: number;
  videoPath?: string; // Storage path for reference (original)
  uploadUrl?: string; // Supabase Storage signed upload URL
  optimizedPath?: string; // Temporary path where optimized video should be stored
  originalPath?: string; // Original path for reference
}): Promise<any> {
  // Method 1: Use Function URL if configured (simpler)
  if (AWS_LAMBDA_FUNCTION_URL) {
    console.log(
      "[optimize-video] Calling Lambda via Function URL:",
      AWS_LAMBDA_FUNCTION_URL
    );
    console.log("[optimize-video] Payload:", {
      hasVideoUrl: !!payload.videoUrl,
      hasVideoBuffer: !!payload.videoBuffer,
      hasUploadUrl: !!payload.uploadUrl,
      hasOptimizedPath: !!payload.optimizedPath,
      videoSize: payload.videoSize,
      videoPath: payload.videoPath,
      uploadUrl: payload.uploadUrl
        ? payload.uploadUrl.substring(0, 100) + "..."
        : "missing",
      optimizedPath: payload.optimizedPath || "missing",
      payloadKeys: Object.keys(payload),
      fullPayload: JSON.stringify(payload).substring(0, 500),
    });

    try {
      // Set a longer timeout for Lambda (5 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const requestBody = JSON.stringify(payload);
      console.log(
        "[optimize-video] Request body length:",
        requestBody.length,
        "bytes"
      );
      console.log(
        "[optimize-video] Request body preview:",
        requestBody.substring(0, 500)
      );
      console.log(
        "[optimize-video] Request body contains uploadUrl:",
        requestBody.includes('"uploadUrl"'),
        "contains optimizedPath:",
        requestBody.includes('"optimizedPath"')
      );

      const response = await fetch(AWS_LAMBDA_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(
        "[optimize-video] Lambda response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[optimize-video] Lambda HTTP error:", errorText);
        throw new Error(
          `Lambda Function URL failed: ${response.status} ${errorText}`
        );
      }

      let result;
      try {
        result = await response.json();
        console.log("[optimize-video] Lambda response parsed:", {
          hasBody: !!result.body,
          hasSuccess: "success" in result,
          keys: Object.keys(result),
          fullResponse: JSON.stringify(result).substring(0, 500),
        });
      } catch (jsonError) {
        const responseText = await response.text();
        console.error(
          "[optimize-video] Failed to parse Lambda response as JSON:",
          {
            error: jsonError,
            responseText: responseText.substring(0, 500),
          }
        );
        throw new Error(
          `Failed to parse Lambda response: ${
            jsonError instanceof Error ? jsonError.message : String(jsonError)
          }`
        );
      }

      // Lambda Function URL automatically unwraps { statusCode, body }
      // If result.body exists, it means we got the raw Lambda response format
      // Otherwise, Function URL already unwrapped it and returned the body directly
      if (result.body) {
        let parsed;
        try {
          parsed =
            typeof result.body === "string"
              ? JSON.parse(result.body)
              : result.body;
        } catch (parseError) {
          console.error("[optimize-video] Failed to parse result.body:", {
            error: parseError,
            body:
              typeof result.body === "string"
                ? result.body.substring(0, 200)
                : result.body,
          });
          throw new Error(
            `Failed to parse Lambda response body: ${
              parseError instanceof Error
                ? parseError.message
                : String(parseError)
            }`
          );
        }

        if (!parsed.success) {
          throw new Error(parsed.error || "Lambda processing failed");
        }
        return parsed;
      }

      // Function URL returned the body directly
      if (!result.success) {
        throw new Error(result.error || "Lambda processing failed");
      }

      return result;
    } catch (error) {
      console.error("[optimize-video] Lambda call error:", error);
      throw error;
    }
  }

  // Method 2: Use AWS SDK invocation (requires credentials)
  if (!AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error(
      "Neither AWS_LAMBDA_FUNCTION_URL nor AWS_LAMBDA_FUNCTION_NAME configured"
    );
  }

  // Get AWS credentials from environment
  const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");

  if (!awsAccessKeyId || !awsSecretAccessKey) {
    throw new Error(
      "AWS credentials not configured (required for SDK invocation)"
    );
  }

  console.log("[optimize-video] Calling Lambda via AWS SDK");

  // Use AWS SDK for Deno
  // @ts-ignore - AWS SDK types may not be available
  const { LambdaClient, InvokeCommand } = await import(
    "https://esm.sh/@aws-sdk/client-lambda@3"
  );

  const client = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });

  const command = new InvokeCommand({
    FunctionName: AWS_LAMBDA_FUNCTION_NAME,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify(payload),
  });

  const response = await client.send(command);

  if (response.FunctionError) {
    throw new Error(`Lambda function error: ${response.FunctionError}`);
  }

  if (!response.Payload) {
    throw new Error("Lambda function returned no payload");
  }

  // Decode payload (it's a Uint8Array)
  const payloadText = new TextDecoder().decode(response.Payload);
  const result = JSON.parse(payloadText);

  // Lambda handler returns body with statusCode, so extract the actual body
  if (result.body) {
    return typeof result.body === "string"
      ? JSON.parse(result.body)
      : result.body;
  }

  return result;
}
