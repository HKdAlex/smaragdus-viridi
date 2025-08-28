#!/usr/bin/env node

/**
 * Quick Diverse Import Script
 * Imports specific diverse gemstones directly
 */

import { execSync } from "child_process";

// Get diverse random selection from actual available folders
function getAvailableFolders() {
  try {
    const result = execSync(
      'ls -1 "/Volumes/2TB/gems" | grep -E "^[А-ЯA-Z].*[0-9]$"',
      { encoding: "utf8" }
    );
    return result.trim().split("\n").filter(Boolean);
  } catch (error) {
    console.error("❌ Could not read available folders:", error.message);
    return [];
  }
}

function getDiverseSelection(availableFolders, count = 20) {
  // Shuffle and select diverse folders
  const shuffled = [...availableFolders].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, availableFolders.length));
}

// Get actual available folders and filter out empty ones
function getAvailableFoldersWithContent() {
  try {
    const folders = getAvailableFolders();

    console.log(`🔍 Found ${folders.length} folders, checking content...`);

    // Filter out empty folders and folders with no supported media
    const validFolders = [];
    for (const folder of folders) {
      try {
        const folderPath = `/Volumes/2TB/gems/${folder}`;
        const result = execSync(
          `find "${folderPath}" -maxdepth 1 -type f \\( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.mp4" -o -iname "*.webm" \\) | wc -l`,
          { encoding: "utf8" }
        ).trim();

        const mediaFileCount = parseInt(result);
        if (mediaFileCount > 0) {
          validFolders.push(folder);
        } else {
          console.log(
            `⚠️  Skipping folder ${folder} - no supported media files`
          );
        }
      } catch (error) {
        console.log(`⚠️  Error checking folder ${folder}: ${error.message}`);
        // Include folder anyway to be safe
        validFolders.push(folder);
      }
    }

    console.log(
      `✅ Found ${validFolders.length} folders with content out of ${folders.length} total`
    );
    return validFolders;
  } catch (error) {
    console.error("❌ Could not filter folders by content:", error.message);
    return getAvailableFolders(); // Fallback to original method
  }
}

// Parse command line arguments first to get maxFolders
const args = process.argv.slice(2);
const maxFolders =
  parseInt(args.find((arg) => arg.startsWith("--max"))?.split("=")[1]) ||
  parseInt(args[args.indexOf("--max") + 1]) ||
  20; // Default to 20 if not specified

// Get actual available folders with content
const ALL_AVAILABLE_FOLDERS = getAvailableFoldersWithContent();
const DIVERSE_FOLDERS = getDiverseSelection(ALL_AVAILABLE_FOLDERS, maxFolders);

// Select the requested number of folders (capped by available)
const availableFolders = DIVERSE_FOLDERS.length;
const actualMax = Math.min(maxFolders, availableFolders);
const selectedFolders = DIVERSE_FOLDERS.slice(0, actualMax);

console.log(
  `🎲 Importing ${selectedFolders.length} diverse random gemstones...`
);

if (maxFolders > availableFolders) {
  console.log(
    `ℹ️  Note: Requested ${maxFolders} but only ${availableFolders} diverse folders available`
  );
}

console.log(`Selection: ${selectedFolders.join(", ")}`);

// Create a temporary directory with symlinks to our selected folders
const tempDir = "/tmp/diverse-gems";

// Create a temporary directory with symlinks to our selected folders
async function createImportDirectory() {
  try {
    execSync(`rm -rf "${tempDir}"`);
    execSync(`mkdir -p "${tempDir}"`);

    // Create symlinks to selected folders
    for (const folder of selectedFolders) {
      const sourcePath = `/Volumes/2TB/gems/${folder}`;
      const targetPath = `${tempDir}/${folder}`;
      execSync(`ln -s "${sourcePath}" "${targetPath}"`);
    }

    // Verify symlinks were created successfully
    const createdLinks = execSync(`ls -la "${tempDir}" | grep -c "^l"`)
      .toString()
      .trim();
    const expectedLinks = selectedFolders.length.toString();

    if (createdLinks !== expectedLinks) {
      throw new Error(
        `Symlink creation failed: expected ${expectedLinks}, got ${createdLinks}`
      );
    }

    console.log(
      `✅ Created temporary directory with ${selectedFolders.length} diverse gemstones (${createdLinks} symlinks verified)`
    );

    // Small delay to ensure filesystem operations are complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Run the import on the temporary directory
    console.log("🚀 Starting import...");
    execSync(
      `node scripts/gemstone-import-system-v3-optimized.mjs --source "${tempDir}" --max ${actualMax}`,
      {
        stdio: "inherit",
      }
    );

    // Cleanup
    execSync(`rm -rf "${tempDir}"`);
    console.log("✅ Import completed and cleaned up");
  } catch (error) {
    console.error("❌ Import failed:", error.message);
    execSync(`rm -rf "${tempDir}"`); // Cleanup on error
    throw error;
  }
}

// Execute the import
createImportDirectory().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
