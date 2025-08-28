#!/usr/bin/env node

/**
 * Diverse Gemstone Selection Script
 * Selects 20 gemstones from different categories for AI analysis testing
 */

import fs from "fs/promises";
import path from "path";

const GEMS_SOURCE = "/Volumes/2TB/gems";
const TARGET_COUNT = 20;

// Define categories with their Russian letter prefixes and likely types
const CATEGORIES = {
  И: { name: "Emerald (Изумруд)", count: 3 },
  Г: { name: "Garnet (Гранат)", count: 3 },
  С: { name: "Sapphire (Сапфир)", count: 3 },
  А: { name: "Amethyst (Аметист)", count: 2 },
  Е: { name: "Unknown E-type", count: 2 },
  Ц: { name: "Unknown Ts-type", count: 2 },
  Н: { name: "Unknown N-type", count: 1 },
  Т: { name: "Unknown T-type", count: 1 },
  К: { name: "Unknown K-type", count: 1 },
  Ф: { name: "Unknown F-type", count: 1 },
  В: { name: "Unknown V-type", count: 1 },
};

async function getGemstonesInCategory(letter) {
  try {
    const allDirs = await fs.readdir(GEMS_SOURCE);
    const categoryDirs = allDirs.filter((dir) => dir.startsWith(letter + " "));
    return categoryDirs.map((dir) => path.join(GEMS_SOURCE, dir));
  } catch (error) {
    console.error(`Error reading category ${letter}:`, error.message);
    return [];
  }
}

async function selectRandomFromArray(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function selectDiverseGemstones() {
  console.log("🔍 Selecting diverse gemstones for AI analysis testing...\n");

  const selectedPaths = [];

  for (const [letter, config] of Object.entries(CATEGORIES)) {
    console.log(
      `📦 Category ${letter} (${config.name}): selecting ${config.count} gemstones`
    );

    const categoryGems = await getGemstonesInCategory(letter);
    console.log(`   Found ${categoryGems.length} gemstones in category`);

    if (categoryGems.length === 0) {
      console.log(`   ⚠️ No gemstones found for category ${letter}`);
      continue;
    }

    const selected = await selectRandomFromArray(categoryGems, config.count);
    selectedPaths.push(...selected);

    selected.forEach((gemPath) => {
      const gemName = path.basename(gemPath);
      console.log(`   ✓ Selected: ${gemName}`);
    });

    console.log("");
  }

  console.log(`🎯 Total selected: ${selectedPaths.length} gemstones`);
  console.log("\n📋 Selected gemstones:");
  selectedPaths.forEach((gemPath, index) => {
    console.log(`${index + 1}. ${path.basename(gemPath)}`);
  });

  return selectedPaths;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  selectDiverseGemstones()
    .then((selectedPaths) => {
      console.log("\n✅ Selection complete!");
      console.log(`\nTo import these gemstones, run:`);
      console.log(
        `node scripts/gemstone-import-system-v3-optimized.mjs --source "${GEMS_SOURCE}" --max 20 --random`
      );
    })
    .catch((error) => {
      console.error("❌ Selection failed:", error);
      process.exit(1);
    });
}

export { selectDiverseGemstones };
