#!/usr/bin/env node

/**
 * Hardcoded String Scanner
 * Scans the codebase for potentially untranslated hardcoded strings
 */

import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Configuration
const SCAN_DIRECTORIES = ["src/features", "src/shared/components", "src/app"];

const FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

// Patterns to identify potentially untranslated strings
const HARDCODED_STRING_PATTERNS = [
  // JSX text content
  />\s*([A-Z][a-zA-Z\s]{3,})\s*</g,
  // String literals in JSX attributes (placeholder, title, etc.)
  /(?:placeholder|title|aria-label|alt)\s*=\s*["']([A-Z][a-zA-Z\s]{3,})["']/g,
  // Button/link text
  /(?:button|Button|Link).*>([A-Z][a-zA-Z\s]{3,})</g,
  // Error messages
  /(?:throw new Error|console\.error|alert)\s*\(\s*["']([A-Z][a-zA-Z\s]{3,})["']/g,
  // Form labels
  /(?:label|Label).*>([A-Z][a-zA-Z\s]{3,})</g,
];

// Patterns to exclude (these are likely not user-facing text)
const EXCLUDE_PATTERNS = [
  /console\.(log|debug|info|warn|error)/,
  /className\s*=/,
  /import\s+.*from/,
  /export\s+/,
  /interface\s+/,
  /type\s+/,
  /function\s+/,
  /const\s+\w+\s*=/,
  /let\s+\w+\s*=/,
  /var\s+\w+\s*=/,
  /\/\*[\s\S]*?\*\//, // Block comments
  /\/\/.*$/, // Line comments
  /useTranslations\(/, // Already using translations
  /t\(/, // Already using translations
];

// Common English words that are likely user-facing
const USER_FACING_KEYWORDS = [
  "Loading",
  "Error",
  "Success",
  "Warning",
  "Info",
  "Save",
  "Cancel",
  "Delete",
  "Edit",
  "Add",
  "Remove",
  "Search",
  "Filter",
  "Sort",
  "View",
  "Back",
  "Next",
  "Submit",
  "Continue",
  "Confirm",
  "Close",
  "Open",
  "Login",
  "Logout",
  "Register",
  "Sign",
  "Account",
  "Profile",
  "Settings",
  "Dashboard",
  "Admin",
  "Order",
  "Cart",
  "Checkout",
  "Payment",
  "Shipping",
  "Gemstone",
  "Diamond",
  "Ruby",
  "Emerald",
  "Sapphire",
  "Price",
  "Weight",
  "Color",
  "Cut",
  "Clarity",
  "Available",
  "Stock",
  "Inventory",
  "Catalog",
];

/**
 * Get all files to scan
 */
async function getFilesToScan() {
  const files = [];

  for (const dir of SCAN_DIRECTORIES) {
    const fullPath = path.join(projectRoot, dir);
    try {
      await collectFiles(fullPath, files);
    } catch (error) {
      console.warn(
        `Warning: Could not scan directory ${dir}: ${error.message}`
      );
    }
  }

  return files;
}

/**
 * Recursively collect files with target extensions
 */
async function collectFiles(dirPath, files) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await collectFiles(fullPath, files);
      } else if (
        entry.isFile() &&
        FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(
      `Warning: Could not read directory ${dirPath}: ${error.message}`
    );
  }
}

/**
 * Scan a file for hardcoded strings
 */
async function scanFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);
    const findings = [];

    // Skip files that are already using translations extensively
    if (
      content.includes("useTranslations(") ||
      content.match(/t\(/g)?.length > 5
    ) {
      return { file: relativePath, findings: [], hasTranslations: true };
    }

    const lines = content.split("\n");

    lines.forEach((line, lineNumber) => {
      // Skip lines that match exclude patterns
      if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(line))) {
        return;
      }

      // Check for hardcoded strings using patterns
      HARDCODED_STRING_PATTERNS.forEach((pattern, patternIndex) => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const text = match[1];

          // Filter out likely false positives
          if (isLikelyUserFacingText(text)) {
            findings.push({
              line: lineNumber + 1,
              text: text,
              context: line.trim(),
              pattern: patternIndex,
              severity: getSeverity(text, line),
            });
          }
        }
      });

      // Check for user-facing keywords
      USER_FACING_KEYWORDS.forEach((keyword) => {
        if (
          line.includes(`"${keyword}"`) ||
          line.includes(`'${keyword}'`) ||
          line.includes(`>${keyword}<`)
        ) {
          // Make sure it's not already in a translation call
          if (!line.includes("t(") && !line.includes("useTranslations")) {
            findings.push({
              line: lineNumber + 1,
              text: keyword,
              context: line.trim(),
              pattern: "keyword",
              severity: "medium",
            });
          }
        }
      });
    });

    return { file: relativePath, findings, hasTranslations: false };
  } catch (error) {
    console.warn(`Warning: Could not scan file ${filePath}: ${error.message}`);
    return {
      file: path.relative(projectRoot, filePath),
      findings: [],
      error: error.message,
    };
  }
}

/**
 * Determine if text is likely user-facing
 */
function isLikelyUserFacingText(text) {
  // Must be at least 3 characters
  if (text.length < 3) return false;

  // Must start with capital letter
  if (!/^[A-Z]/.test(text)) return false;

  // Exclude common code patterns
  if (/^[A-Z][a-z]+([A-Z][a-z]+)+$/.test(text)) return false; // PascalCase
  if (/^[A-Z_]+$/.test(text)) return false; // CONSTANT_CASE
  if (/^\w+\(\)$/.test(text)) return false; // function calls
  if (/^[A-Z]\w*Error$/.test(text)) return false; // Error class names
  if (/^[A-Z]\w*Exception$/.test(text)) return false; // Exception class names

  // Include if it contains common user-facing words
  const lowerText = text.toLowerCase();
  if (
    USER_FACING_KEYWORDS.some((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    )
  ) {
    return true;
  }

  // Include if it looks like a sentence or phrase
  if (/^[A-Z][a-z]+(\s+[a-z]+)*[.!?]?$/.test(text)) {
    return true;
  }

  return false;
}

/**
 * Determine severity of untranslated string
 */
function getSeverity(text, context) {
  // High severity: Error messages, user notifications
  if (
    /error|fail|invalid|required|missing/i.test(text) ||
    /alert|toast|notification/i.test(context)
  ) {
    return "high";
  }

  // Medium severity: UI labels, buttons, form fields
  if (
    /button|label|placeholder|title/i.test(context) ||
    USER_FACING_KEYWORDS.some((k) =>
      text.toLowerCase().includes(k.toLowerCase())
    )
  ) {
    return "medium";
  }

  // Low severity: Other text
  return "low";
}

/**
 * Generate report
 */
function generateReport(results) {
  const totalFiles = results.length;
  const filesWithFindings = results.filter((r) => r.findings.length > 0).length;
  const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0);

  console.log("\n📊 HARDCODED STRING SCAN REPORT");
  console.log("=".repeat(50));
  console.log(`📁 Files scanned: ${totalFiles}`);
  console.log(`⚠️  Files with potential issues: ${filesWithFindings}`);
  console.log(`🔍 Total findings: ${totalFindings}`);

  if (totalFindings === 0) {
    console.log(
      "\n🎉 No hardcoded strings found! All text appears to be properly internationalized."
    );
    return;
  }

  // Group by severity
  const bySeverity = {
    high: [],
    medium: [],
    low: [],
  };

  results.forEach((result) => {
    result.findings.forEach((finding) => {
      bySeverity[finding.severity].push({ ...finding, file: result.file });
    });
  });

  // Report by severity
  ["high", "medium", "low"].forEach((severity) => {
    const findings = bySeverity[severity];
    if (findings.length > 0) {
      console.log(
        `\n🚨 ${severity.toUpperCase()} PRIORITY (${findings.length} findings):`
      );
      console.log("-".repeat(30));

      findings.forEach((finding) => {
        console.log(`📄 ${finding.file}:${finding.line}`);
        console.log(`   Text: "${finding.text}"`);
        console.log(`   Context: ${finding.context}`);
        console.log("");
      });
    }
  });

  // Suggestions
  console.log("\n💡 RECOMMENDATIONS:");
  console.log("-".repeat(30));
  console.log("1. Replace hardcoded strings with translation keys");
  console.log("2. Use useTranslations() hook in components");
  console.log("3. Add missing keys to translation files");
  console.log("4. Test in both English and Russian locales");

  return {
    totalFiles,
    filesWithFindings,
    totalFindings,
    bySeverity,
  };
}

/**
 * Main execution
 */
async function main() {
  console.log("🔍 Scanning codebase for hardcoded strings...\n");
  console.log("Scan directories:", SCAN_DIRECTORIES.join(", "));
  console.log("File extensions:", FILE_EXTENSIONS.join(", "));
  console.log("=".repeat(50));

  try {
    const files = await getFilesToScan();
    console.log(`\n📁 Found ${files.length} files to scan`);

    const results = [];
    let processed = 0;

    for (const file of files) {
      const result = await scanFile(file);
      results.push(result);
      processed++;

      if (processed % 10 === 0) {
        console.log(
          `📊 Progress: ${processed}/${files.length} files processed`
        );
      }
    }

    console.log(`✅ Scan complete: ${processed} files processed`);

    const report = generateReport(results);

    // Save detailed report
    const reportPath = path.join(
      projectRoot,
      "docs",
      "06-tracking",
      "localization",
      "hardcoded-strings-report.json"
    );
    await fs.writeFile(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: report,
          results: results.filter((r) => r.findings.length > 0),
        },
        null,
        2
      )
    );

    console.log(`\n📋 Detailed report saved: ${reportPath}`);

    if (report && report.totalFindings > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during scan:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateReport, getFilesToScan, scanFile };
