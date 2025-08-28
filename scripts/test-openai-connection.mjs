#!/usr/bin/env node

/**
 * Test OpenAI connection with different SSL configurations
 */

import dotenv from "dotenv";
import https from "https";
import OpenAI from "openai";

// Load environment variables
dotenv.config({ path: ".env.local" });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY not found");
  process.exit(1);
}

console.log(
  "🔍 Testing OpenAI connection with different SSL configurations...\n"
);

// Test 1: Basic OpenAI client
console.log("🧪 Test 1: Basic OpenAI client");
try {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Hello, test connection" }],
    max_tokens: 10,
  });

  console.log(
    "✅ Basic client successful:",
    response.choices[0].message.content
  );
} catch (error) {
  console.error("❌ Basic client failed:", error.message);
  console.error("Error type:", error.constructor.name);
}

// Test 2: OpenAI client with custom HTTPS agent
console.log("\n🧪 Test 2: OpenAI client with custom HTTPS agent");
try {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: true,
    keepAlive: true,
    timeout: 30000,
    maxSockets: 10,
  });

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    httpAgent: httpsAgent,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Hello, test with custom agent" }],
    max_tokens: 10,
  });

  console.log(
    "✅ Custom agent successful:",
    response.choices[0].message.content
  );
} catch (error) {
  console.error("❌ Custom agent failed:", error.message);
  console.error("Error type:", error.constructor.name);
}

// Test 3: OpenAI client with vision model (similar to our analysis)
console.log("\n🧪 Test 3: OpenAI vision model (like our analysis)");
try {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Small test image (1x1 pixel base64)
  const testImageBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this image briefly." },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${testImageBase64}` },
          },
        ],
      },
    ],
    max_tokens: 20,
  });

  console.log(
    "✅ Vision model successful:",
    response.choices[0].message.content
  );
} catch (error) {
  console.error("❌ Vision model failed:", error.message);
  console.error("Error type:", error.constructor.name);
  if (error.response) {
    console.error("Response status:", error.response.status);
  }
}

console.log("\n🏁 Connection tests complete!");

