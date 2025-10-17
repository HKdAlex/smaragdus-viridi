#!/usr/bin/env node
/**
 * Test quantity-aware descriptions with different gemstone counts
 */

import { generateTextForGemstone } from "./ai-analysis-v6/pipeline.mjs";

const gemstones = [
  {
    id: "e46d9892-2438-4336-ab9f-87d3686e55e7",
    name: "sapphire",
    quantity: 1,
    weight: "1.4ct",
  },
  {
    id: "115959df-63b3-44e9-82b5-74ee83e26123",
    name: "sapphire pair",
    quantity: 2,
    weight: "3.21ct",
  },
  {
    id: "0c416424-5ac1-4d29-9c65-c1f45f41a465",
    name: "garnet trio",
    quantity: 3,
    weight: "1.02ct",
  },
];

console.log("=".repeat(80));
console.log("QUANTITY-AWARE DESCRIPTIONS TEST");
console.log("=".repeat(80));
console.log(
  `\nTesting ${gemstones.length} gemstones with different quantities...\n`
);

const results = [];

for (const gem of gemstones) {
  console.log(`\n[Quantity ${gem.quantity}] ${gem.name} (${gem.weight})`);
  console.log("-".repeat(80));

  try {
    const result = await generateTextForGemstone(gem.id, {
      model: process.env.OPENAI_DESCRIPTION_MODEL || "gpt-4o-mini",
    });

    if (result.success) {
      const desc = result.generation.content.technical_description.en;
      const firstSentence = desc.split(".")[0] + ".";

      console.log(`✅ Generated successfully`);
      console.log(`📝 First sentence: ${firstSentence}`);
      console.log(`💰 Cost: $${result.generation.cost_usd.toFixed(4)}`);

      results.push({
        quantity: gem.quantity,
        name: gem.name,
        firstSentence,
        success: true,
      });
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    results.push({ quantity: gem.quantity, name: gem.name, success: false });
  }
}

console.log("\n" + "=".repeat(80));
console.log("RESULTS SUMMARY");
console.log("=".repeat(80));

results.forEach((r) => {
  if (r.success) {
    console.log(`\n✅ Quantity ${r.quantity} (${r.name}):`);
    console.log(`   "${r.firstSentence}"`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("VERIFICATION");
console.log("=".repeat(80));
console.log("\n✓ Quantity 1 should use: 'This [gemstone]' (singular)");
console.log("✓ Quantity 2 should use: 'This matched pair' or 'These two'");
console.log("✓ Quantity 3 should use: 'This trio' or 'These three'");
console.log("\n");
