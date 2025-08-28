#!/usr/bin/env node

/**
 * Quick Diverse Import Script
 * Imports specific diverse gemstones directly
 */

import { execSync } from "child_process";

// Our diverse random selection from the previous command
const DIVERSE_FOLDERS = [
  "А 21",
  "А 79",
  "И 366",
  "С 54",
  "Н 36",
  "С 95",
  "И 410",
  "Е 15",
  "Z 11",
  "С 61",
  "И 13",
  "Т 21",
  "Г 55",
  "И 32",
  "Г 82",
  "С 64",
  "И 376",
  "И 254",
  "Г 140",
  "И 360",
];

console.log("🎲 Importing 20 diverse random gemstones...");
console.log("Selection:", DIVERSE_FOLDERS.join(", "));

// Create a temporary directory with symlinks to our selected folders
const tempDir = "/tmp/diverse-gems";
try {
  execSync(`rm -rf "${tempDir}"`);
  execSync(`mkdir -p "${tempDir}"`);

  // Create symlinks to selected folders
  for (const folder of DIVERSE_FOLDERS) {
    const sourcePath = `/Volumes/2TB/gems/${folder}`;
    const targetPath = `${tempDir}/${folder}`;
    execSync(`ln -s "${sourcePath}" "${targetPath}"`);
  }

  console.log(
    `✅ Created temporary directory with ${DIVERSE_FOLDERS.length} diverse gemstones`
  );

  // Run the import on the temporary directory
  console.log("🚀 Starting import...");
  execSync(
    `node scripts/gemstone-import-system-v3-optimized.mjs --source "${tempDir}" --max 20`,
    {
      stdio: "inherit",
    }
  );

  // Cleanup
  execSync(`rm -rf "${tempDir}"`);
  console.log("✅ Import completed and cleaned up");
} catch (error) {
  console.error("❌ Import failed:", error.message);
  // Cleanup on error
  try {
    execSync(`rm -rf "${tempDir}"`);
  } catch (e) {
    // Ignore cleanup errors
  }
}
