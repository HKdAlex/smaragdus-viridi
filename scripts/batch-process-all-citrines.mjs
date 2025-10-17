#!/usr/bin/env node
/**
 * Process ALL citrines in the catalog with AI v6 text generation
 */

import { generateTextForGemstone } from "./ai-analysis-v6/pipeline.mjs";

// All 40 citrine IDs from the database
const citrineIds = [
  // Singles (14)
  "b766d396-25c3-4f50-b9e8-e3542e966a17",
  "4e0ee68f-4e9c-4315-b866-3ca3531c8897",
  "d04c743f-cc28-4050-95e2-4349aa12762f",
  "9dd4681a-c708-4136-a4b4-368054c337e8",
  "511007f3-2f06-4cad-8f89-e2de249d0b0e",
  "9fc856ec-cd3a-49fa-b9b5-c7f2f5b64b72",
  "96fd1b7b-73ff-4987-998e-33baabcf472a",
  "55df22b3-15bb-4fee-a3b9-b7678999e838",
  "24469697-397c-4d9d-b929-be470f1db896",
  "08513592-f374-4cea-b1eb-e17afde97e12",
  "0f070559-8923-4c13-a9f0-2ea65ff9b9a9",
  "be9fe848-8c46-4aec-9c0c-65f685439615",
  "c1bfb80f-9de9-4217-b21d-6967013f7c66",
  "40e8ec39-48bb-4d5d-93c3-5e9756a61e58",
  // Pairs (6)
  "27d8ff67-5b18-41be-809e-03eca78fd6e2",
  "e63f9cf1-f66f-4395-8397-fb10d018d5b3",
  "95d2cf77-ca8a-4b7e-abaa-82b5c9e453bf",
  "0d57cfd4-71ce-49d7-b5e9-6af8f500203b",
  "86d7d6e1-6305-4cfa-be4a-422f28ac0401",
  "eefd058f-e10f-47f6-980d-9433487ac508",
  // Trios (12)
  "3a8efda1-e4b9-43ae-b29d-9436d51c616a",
  "8eba3b92-1e0d-497c-a3cd-a67cacfc3f06",
  "468979fd-0438-489b-a418-feb2a1f5775c",
  "d2ada32f-852e-49a5-9625-f7135588d3d7",
  "633a868a-8806-425f-9fa0-a7f0eb46f3af",
  "784272c5-170f-481c-8e48-d072e52a3ca4",
  "9abfb996-e7c0-4edc-9cef-12c32e2a9d24",
  "34254dda-e998-4ef2-9e6f-353e3eac2826",
  "7ed6feaf-2db9-4e1a-a56e-a8fa0e80958b",
  "ebd48038-5f2d-4e40-ab71-b23e4cb9521f",
  "dbbc9a40-779f-4eb1-a682-572ec37e777a",
  "21ea64a2-1552-4c1b-9c53-cb533ba9f735",
  // 4+ stones (8)
  "e6670036-0959-44f1-a0ad-bb3185774133", // 4
  "8229650f-67d1-4f48-8b8e-e4f9bd653146", // 5
  "ae4b0420-e7f2-4f83-a2b0-a8880b2223c2", // 9
  "93fcbe36-0e85-44f5-a4ff-803a8c2e7605", // 9
  "a203bc5c-02ec-44f7-bf13-ae70e1f7e70b", // 9
  "b78b6174-4570-483b-9438-9a645da30846", // 15
  "97901088-7cb7-4dc5-9932-8069638270f4", // 23
  "99d799f0-1476-4799-94f6-3914fb69d32a", // 36
];

console.log("=".repeat(80));
console.log("AI TEXT GENERATION V6 - CITRINE BATCH PROCESSING");
console.log("=".repeat(80));
console.log(`\nProcessing ${citrineIds.length} citrines...\n`);

const results = [];
let successCount = 0;
let failureCount = 0;
let totalCost = 0;
let totalTime = 0;

for (let i = 0; i < citrineIds.length; i++) {
  const gemstoneId = citrineIds[i];
  console.log(`\n[${i + 1}/${citrineIds.length}] Processing: ${gemstoneId}`);
  console.log("-".repeat(80));

  try {
    const startTime = Date.now();
    const result = await generateTextForGemstone(gemstoneId, {
      model: process.env.OPENAI_DESCRIPTION_MODEL || "gpt-4o-mini",
    });

    const elapsed = Date.now() - startTime;

    if (result.success) {
      successCount++;
      totalCost += result.generation.cost_usd || 0;
      totalTime += elapsed;

      console.log(`✅ SUCCESS - citrine (${result.gemstone.serial_number})`);
      console.log(`   Quantity: ${result.gemstone.quantity || 1}`);
      console.log(`   Confidence: ${result.generation.confidence.toFixed(2)}`);
      console.log(`   Cost: $${(result.generation.cost_usd || 0).toFixed(4)}`);
      console.log(`   Time: ${(elapsed / 1000).toFixed(1)}s`);

      results.push({
        id: gemstoneId,
        serial_number: result.gemstone.serial_number,
        quantity: result.gemstone.quantity || 1,
        success: true,
        confidence: result.generation.confidence,
        cost: result.generation.cost_usd,
        time: elapsed,
      });
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    failureCount++;
    console.error(`❌ FAILED: ${error.message}`);

    results.push({
      id: gemstoneId,
      success: false,
      error: error.message,
    });
  }

  // Brief pause between requests to avoid rate limits
  if (i < citrineIds.length - 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

console.log("\n" + "=".repeat(80));
console.log("BATCH PROCESSING COMPLETE");
console.log("=".repeat(80));
console.log(`\n✅ Successful: ${successCount}/${citrineIds.length}`);
console.log(`❌ Failed: ${failureCount}/${citrineIds.length}`);

if (successCount > 0) {
  console.log(`\n💰 Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`💰 Average Cost: $${(totalCost / successCount).toFixed(4)}`);
  console.log(`⏱️  Total Time: ${(totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(
    `⏱️  Average Time: ${(totalTime / successCount / 1000).toFixed(1)}s`
  );

  const avgConfidence =
    results
      .filter((r) => r.success && r.confidence)
      .reduce((sum, r) => sum + r.confidence, 0) / successCount;
  console.log(`📊 Average Confidence: ${avgConfidence.toFixed(2)}`);

  // Group by quantity
  const byQuantity = results.reduce((acc, r) => {
    if (r.success) {
      const qty = r.quantity;
      acc[qty] = (acc[qty] || 0) + 1;
    }
    return acc;
  }, {});

  console.log("\n📈 Breakdown by Quantity:");
  Object.keys(byQuantity)
    .sort((a, b) => a - b)
    .forEach((qty) => {
      console.log(
        `   ${qty} stone${qty > 1 ? "s" : ""}: ${byQuantity[qty]} citrines`
      );
    });
}

console.log("\n" + "=".repeat(80));
console.log("VIEW RESULTS");
console.log("=".repeat(80));
console.log("\nView all citrines at:");
console.log("EN: http://localhost:3000/en/catalog?type=citrine");
console.log("RU: http://localhost:3000/ru/catalog?type=citrine");

console.log("\nSample links (first 5 successful):");
const successfulGems = results.filter((r) => r.success).slice(0, 5);
successfulGems.forEach((r, i) => {
  console.log(`${i + 1}. http://localhost:3000/en/catalog/${r.id}`);
  console.log(`   (Quantity: ${r.quantity}, Serial: ${r.serial_number})`);
});

console.log("\n");
