#!/usr/bin/env node

import { config } from "dotenv";
import { runMultiImageAnalysis } from "./ai-gemstone-analyzer-v3.mjs";

config({ path: ".env.local" });

async function runTest() {
  console.log(`🧪 GPT-5 Analysis Test Suite`);
  console.log(`🤖 Vision Model: ${process.env.OPENAI_VISION_MODEL || "gpt-5"}`);
  console.log(
    `📝 Description Model: ${
      process.env.OPENAI_DESCRIPTION_MODEL || "gpt-5-mini"
    }\n`
  );

  try {
    const report = await runMultiImageAnalysis({
      limit: 5,
      clearExisting: false,
    });

    console.log(`\n✅ Test Complete!`);
    console.log(`📊 Summary`);
    console.log(
      `  - Gemstones analyzed: ${report?.summary?.analyzedGemstones || 0}`
    );
    console.log(`  - Total cost: $${report?.summary?.totalCostUSD || 0}`);
    console.log(
      `  - Avg cost per gem: $${report?.costAnalysis?.perGemstone || 0}`
    );
    console.log(`  - Success rate: ${report?.summary?.successRate || "0%"}`);

    console.log(`\n💡 Next Steps`);
    console.log(`  1. Review analysis quality in Supabase dashboard`);
    console.log(`  2. Verify Russian OCR accuracy and normalization`);
    console.log(`  3. Validate primary image selection reasoning`);
    console.log(
      `  4. Generate descriptions: node scripts/ai-description-generator-v4.mjs --limit=5`
    );
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

runTest();
