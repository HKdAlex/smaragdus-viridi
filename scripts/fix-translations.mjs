#!/usr/bin/env node

/**
 * Translation Fix Script
 * Automatically fixes common translation issues and maintains consistency
 */

import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";
import { validateTranslations } from "./validate-translations.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Configuration
const LOCALES = ["en", "ru"];
const MESSAGES_DIR = path.join(projectRoot, "src", "messages");

/**
 * Load translation file
 */
async function loadTranslationFile(locale, filename) {
  try {
    const filePath = path.join(MESSAGES_DIR, locale, filename);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(
      `Warning: Could not load ${locale}/${filename}: ${error.message}`
    );
    return {};
  }
}

/**
 * Save translation file
 */
async function saveTranslationFile(locale, filename, data) {
  try {
    const filePath = path.join(MESSAGES_DIR, locale, filename);
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  } catch (error) {
    console.error(`Error saving ${locale}/${filename}:`, error.message);
    return false;
  }
}

/**
 * Get all translation files
 */
async function getTranslationFiles() {
  try {
    const enDir = path.join(MESSAGES_DIR, "en");
    const files = await fs.readdir(enDir);
    return files.filter((file) => file.endsWith(".json"));
  } catch (error) {
    console.error("Error reading translation files:", error.message);
    return [];
  }
}

/**
 * Remove extra keys from Russian translations
 */
async function removeExtraKeys() {
  console.log("🧹 Removing extra keys from Russian translations...\n");

  const files = await getTranslationFiles();
  let totalRemoved = 0;

  for (const filename of files) {
    const enData = await loadTranslationFile("en", filename);
    const ruData = await loadTranslationFile("ru", filename);

    if (Object.keys(enData).length === 0 || Object.keys(ruData).length === 0) {
      continue;
    }

    const enKeys = getAllKeys(enData);
    const ruKeys = getAllKeys(ruData);
    const extraKeys = ruKeys.filter((key) => !enKeys.includes(key));

    if (extraKeys.length > 0) {
      console.log(`📄 ${filename}: Removing ${extraKeys.length} extra keys`);

      // Create cleaned Russian data
      const cleanedRuData = removeKeysFromObject(ruData, extraKeys);

      // Save cleaned file
      const saved = await saveTranslationFile("ru", filename, cleanedRuData);
      if (saved) {
        totalRemoved += extraKeys.length;
        extraKeys.forEach((key) => console.log(`  - Removed: ${key}`));
      }
    } else {
      console.log(`📄 ${filename}: No extra keys found ✅`);
    }
  }

  console.log(`\n🎯 Total extra keys removed: ${totalRemoved}\n`);
  return totalRemoved;
}

/**
 * Recursively get all keys from nested object
 */
function getAllKeys(obj, prefix = "") {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Remove specific keys from nested object
 */
function removeKeysFromObject(obj, keysToRemove) {
  const result = JSON.parse(JSON.stringify(obj)); // Deep clone

  for (const keyPath of keysToRemove) {
    const keys = keyPath.split(".");
    let current = result;

    // Navigate to parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]]) {
        current = current[keys[i]];
      } else {
        break; // Key path doesn't exist
      }
    }

    // Remove the final key
    const finalKey = keys[keys.length - 1];
    if (current && current.hasOwnProperty(finalKey)) {
      delete current[finalKey];
    }
  }

  return result;
}

/**
 * Add missing keys to Russian translations with placeholder values
 */
async function addMissingKeys() {
  console.log("➕ Adding missing keys to Russian translations...\n");

  const files = await getTranslationFiles();
  let totalAdded = 0;

  for (const filename of files) {
    const enData = await loadTranslationFile("en", filename);
    const ruData = await loadTranslationFile("ru", filename);

    if (Object.keys(enData).length === 0) {
      continue;
    }

    const enKeys = getAllKeys(enData);
    const ruKeys = getAllKeys(ruData);
    const missingKeys = enKeys.filter((key) => !ruKeys.includes(key));

    if (missingKeys.length > 0) {
      console.log(`📄 ${filename}: Adding ${missingKeys.length} missing keys`);

      // Add missing keys with placeholder values
      const updatedRuData = addKeysToObject(ruData, enData, missingKeys);

      // Save updated file
      const saved = await saveTranslationFile("ru", filename, updatedRuData);
      if (saved) {
        totalAdded += missingKeys.length;
        missingKeys.forEach((key) => console.log(`  + Added: ${key}`));
      }
    } else {
      console.log(`📄 ${filename}: No missing keys found ✅`);
    }
  }

  console.log(`\n🎯 Total missing keys added: ${totalAdded}\n`);
  return totalAdded;
}

/**
 * Add missing keys to object with placeholder values
 */
function addKeysToObject(ruData, enData, missingKeys) {
  const result = JSON.parse(JSON.stringify(ruData)); // Deep clone

  for (const keyPath of missingKeys) {
    const keys = keyPath.split(".");
    let currentRu = result;
    let currentEn = enData;

    // Navigate/create path in Russian object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];

      if (!currentRu[key]) {
        currentRu[key] = {};
      }
      currentRu = currentRu[key];

      if (currentEn[key]) {
        currentEn = currentEn[key];
      }
    }

    // Add the missing key with placeholder
    const finalKey = keys[keys.length - 1];
    const enValue = getValueFromPath(enData, keyPath);
    currentRu[finalKey] = `[TRANSLATE: ${enValue}]`;
  }

  return result;
}

/**
 * Get value from nested object using dot notation path
 */
function getValueFromPath(obj, path) {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : `[${path}]`;
  }, obj);
}

/**
 * Validate JSON syntax in all translation files
 */
async function validateJsonSyntax() {
  console.log("🔍 Validating JSON syntax...\n");

  const files = await getTranslationFiles();
  let errors = 0;

  for (const filename of files) {
    for (const locale of LOCALES) {
      try {
        await loadTranslationFile(locale, filename);
        console.log(`✅ ${locale}/${filename}: Valid JSON`);
      } catch (error) {
        console.error(
          `❌ ${locale}/${filename}: Invalid JSON - ${error.message}`
        );
        errors++;
      }
    }
  }

  console.log(`\n🎯 JSON validation complete. Errors: ${errors}\n`);
  return errors === 0;
}

/**
 * Generate translation report
 */
async function generateReport() {
  console.log("📊 Generating translation report...\n");

  const results = await validateTranslations();

  // Create summary report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.files.length,
      completeFiles: 0,
      filesWithIssues: 0,
      totalMissingKeys: 0,
      totalExtraKeys: 0,
    },
    files: [],
  };

  for (const fileResult of results.files) {
    const fileReport = {
      filename: fileResult.filename,
      status: "complete",
      issues: [],
    };

    for (const [locale, missingKeys] of Object.entries(
      fileResult.missingInLocales
    )) {
      if (missingKeys.length > 0) {
        fileReport.status = "incomplete";
        fileReport.issues.push({
          type: "missing",
          locale,
          count: missingKeys.length,
          keys: missingKeys,
        });
        report.summary.totalMissingKeys += missingKeys.length;
      }
    }

    for (const [locale, extraKeys] of Object.entries(
      fileResult.extraInLocales
    )) {
      if (extraKeys.length > 0) {
        fileReport.status = "has_extra";
        fileReport.issues.push({
          type: "extra",
          locale,
          count: extraKeys.length,
          keys: extraKeys,
        });
        report.summary.totalExtraKeys += extraKeys.length;
      }
    }

    if (fileReport.status === "complete") {
      report.summary.completeFiles++;
    } else {
      report.summary.filesWithIssues++;
    }

    report.files.push(fileReport);
  }

  // Save report
  const reportPath = path.join(
    projectRoot,
    "docs",
    "06-tracking",
    "localization",
    "translation-report.json"
  );
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log("📋 Translation Report Summary:");
  console.log(
    `   Complete files: ${report.summary.completeFiles}/${report.summary.totalFiles}`
  );
  console.log(`   Files with issues: ${report.summary.filesWithIssues}`);
  console.log(`   Missing keys: ${report.summary.totalMissingKeys}`);
  console.log(`   Extra keys: ${report.summary.totalExtraKeys}`);
  console.log(`   Report saved: ${reportPath}\n`);

  return report;
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || "validate";

  console.log("🌐 Translation Fix Tool\n");
  console.log("=".repeat(50) + "\n");

  try {
    switch (command) {
      case "validate":
        console.log("🔍 Running validation only...\n");
        await validateTranslations();
        break;

      case "fix":
        console.log("🔧 Running full fix process...\n");

        // 1. Validate JSON syntax
        const validJson = await validateJsonSyntax();
        if (!validJson) {
          console.error(
            "❌ JSON validation failed. Please fix syntax errors first."
          );
          process.exit(1);
        }

        // 2. Remove extra keys
        await removeExtraKeys();

        // 3. Add missing keys
        await addMissingKeys();

        // 4. Final validation
        console.log("🔍 Running final validation...\n");
        await validateTranslations();

        // 5. Generate report
        await generateReport();

        console.log("✅ Translation fix process completed!\n");
        break;

      case "clean":
        console.log("🧹 Cleaning extra keys only...\n");
        await removeExtraKeys();
        break;

      case "add":
        console.log("➕ Adding missing keys only...\n");
        await addMissingKeys();
        break;

      case "report":
        console.log("📊 Generating report only...\n");
        await generateReport();
        break;

      default:
        console.log("Usage: node fix-translations.mjs [command]");
        console.log("Commands:");
        console.log("  validate  - Validate translations (default)");
        console.log("  fix       - Full fix process (clean + add + validate)");
        console.log(
          "  clean     - Remove extra keys from Russian translations"
        );
        console.log("  add       - Add missing keys to Russian translations");
        console.log("  report    - Generate detailed translation report");
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during translation fix:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { addMissingKeys, generateReport, removeExtraKeys, validateJsonSyntax };
