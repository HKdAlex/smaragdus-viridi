#!/usr/bin/env node

/**
 * Test the full analysis pipeline: image download + OpenAI API call
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import OpenAI from "openai";
import { downloadImageAsBase64 } from "./ai-analysis/image-utils.mjs";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testFullAnalysis() {
  console.log(
    "🔬 Testing full analysis pipeline: image download + OpenAI API\n"
  );

  try {
    // Get a sample gemstone with images
    const { data: gemstones, error } = await supabase
      .from("gemstones")
      .select(
        `
        id,
        name,
        gemstone_images!inner (
          id,
          image_url,
          original_filename,
          image_order
        )
      `
      )
      .limit(1);

    if (error) {
      console.error("❌ Failed to fetch gemstone:", error);
      return;
    }

    if (!gemstones || gemstones.length === 0) {
      console.log("⚠️ No gemstones with images found");
      return;
    }

    const gemstone = gemstones[0];
    const images = gemstone.gemstone_images.slice(0, 3); // Limit to 3 images for testing

    console.log(`📍 Testing with gemstone: ${gemstone.name} (${gemstone.id})`);
    console.log(`🖼️ Images to process: ${images.length}\n`);

    // Step 1: Download images (same as real analysis)
    console.log("📥 Step 1: Downloading images...");
    const imageData = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(
        `  📸 Downloading image ${i + 1}/${images.length}: ${
          image.original_filename
        }`
      );

      try {
        const base64 = await downloadImageAsBase64(image.image_url);
        console.log(
          `    ✅ Downloaded: ${(base64.length / 1024 / 1024).toFixed(2)} MB`
        );

        imageData.push({
          imageId: image.id,
          filename: image.original_filename,
          base64: base64,
          order: image.image_order || i,
        });
      } catch (downloadError) {
        console.error(`    ❌ Download failed:`, downloadError.message);
        return;
      }
    }

    console.log(`\n🤖 Step 2: Sending ${imageData.length} images to OpenAI...`);

    // Step 2: Create OpenAI request (same as real analysis)
    const content = [
      {
        type: "text",
        text: `Analyze these ${imageData.length} gemstone images and extract: weight, cut, color, clarity, origin, and any visible certifications or labels. Provide response in JSON format.`,
      },
      ...imageData.map((img) => ({
        type: "image_url",
        image_url: { url: img.base64 },
      })),
    ];

    const startTime = Date.now();

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: content,
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const duration = Date.now() - startTime;
      console.log(`✅ OpenAI request successful in ${duration}ms`);
      console.log(`💰 Estimated cost: $0.01`);

      const aiResponse = response.choices[0].message.content;
      console.log(`📄 AI Response length: ${aiResponse.length} characters`);

      // Try to parse JSON
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log(`✅ JSON parsing successful`);
          console.log(`📊 Extracted data keys:`, Object.keys(parsedData));
        } else {
          console.log(`⚠️ No JSON found in response`);
        }
      } catch (parseError) {
        console.log(`⚠️ JSON parsing failed:`, parseError.message);
      }
    } catch (apiError) {
      console.error(`❌ OpenAI API failed:`, apiError.message);
      console.error(`Error type:`, apiError.constructor.name);
      if (apiError.code) {
        console.error(`Error code:`, apiError.code);
      }
    }
  } catch (error) {
    console.error("💥 Test failed:", error);
  }
}

testFullAnalysis();

