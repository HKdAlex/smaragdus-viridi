#!/usr/bin/env node

/**
 * Type Governance Checker - Smaragdus Viridi
 *
 * This script enforces our type governance rules to prevent the type
 * duplication disaster that occurred during Sprint 3.
 *
 * See: docs/04-implementation/TYPE_GOVERNANCE.md
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

// Forbidden type patterns that should only exist in database.ts or index.ts
const FORBIDDEN_TYPES = [
  "GemstoneType",
  "GemColor",
  "GemCut",
  "GemClarity",
  "CurrencyCode",
  "UserRole",
  "OrderStatus",
  "PaymentType",
];

// Forbidden interface patterns
const FORBIDDEN_INTERFACES = [
  "Gemstone",
  "Origin",
  "UserProfile",
  "Order",
  "OrderItem",
];

// Allowed locations for types
const ALLOWED_TYPE_LOCATIONS = [
  "src/shared/types/database.ts",
  "src/shared/types/index.ts",
];

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERROR: ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, "yellow");
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

function findFiles(
  dir,
  extensions = [".ts", ".tsx"],
  exclude = ["node_modules", ".git", "dist"]
) {
  const files = [];

  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !exclude.includes(item)) {
        walk(fullPath);
      } else if (
        stat.isFile() &&
        extensions.some((ext) => item.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const violations = [];
  const lines = content.split("\n");

  // Skip allowed locations
  if (ALLOWED_TYPE_LOCATIONS.includes(filePath)) {
    return violations;
  }

  // Check for forbidden type definitions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;

    // Check for forbidden type aliases
    for (const forbiddenType of FORBIDDEN_TYPES) {
      if (
        line.includes(`export type ${forbiddenType}`) &&
        !line.includes("import") &&
        !line.includes("Database[")
      ) {
        violations.push({
          file: filePath,
          line: lineNumber,
          type: "FORBIDDEN_TYPE",
          message: `Manual definition of ${forbiddenType} - import from @/shared/types instead`,
          content: line,
        });
      }
    }

    // Check for forbidden interface definitions
    for (const forbiddenInterface of FORBIDDEN_INTERFACES) {
      // More precise matching - must be exact interface name, not just contains
      const exactInterfacePattern = new RegExp(
        `export interface ${forbiddenInterface}(?![a-zA-Z])`
      );
      if (
        exactInterfacePattern.test(line) &&
        !line.includes("Database") &&
        !line.includes("Enhanced") &&
        !line.includes("Catalog")
      ) {
        violations.push({
          file: filePath,
          line: lineNumber,
          type: "FORBIDDEN_INTERFACE",
          message: `Duplicate interface ${forbiddenInterface} - use Database${forbiddenInterface} from @/shared/types`,
          content: line,
        });
      }
    }

    // Check for direct database.ts imports
    if (line.includes("from ") && line.includes("database.ts")) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: "DIRECT_DATABASE_IMPORT",
        message: "Direct import from database.ts - use @/shared/types instead",
        content: line,
      });
    }

    // Check for 'as any' usage (forbidden)
    if (line.includes("as any")) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: "FORBIDDEN_ANY_CAST",
        message: 'Usage of "as any" is forbidden - use proper typing instead',
        content: line,
      });
    }
  }

  return violations;
}

function checkTypeGovernance() {
  log("\n🔍 Checking Type Governance...", "bold");
  log("Enforcing rules from TYPE_GOVERNANCE.md\n", "cyan");

  const allViolations = [];

  // Check TypeScript files
  const tsFiles = findFiles(".", [".ts", ".tsx"]);
  const mdFiles = findFiles(".", [".md"]);

  logInfo(`Scanning ${tsFiles.length} TypeScript files...`);

  for (const file of tsFiles) {
    const violations = checkFile(file);
    allViolations.push(...violations);
  }

  // Check documentation files for type definitions (should not exist)
  logInfo(`Scanning ${mdFiles.length} documentation files...`);

  for (const file of mdFiles) {
    if (file.includes("node_modules")) continue;

    // Skip documentation files - they're allowed to have examples
    if (
      file.includes("docs/") ||
      file.includes("README.md") ||
      file.includes(".cursor/rules/") ||
      file.includes("TYPE_GOVERNANCE.md")
    ) {
      continue;
    }

    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Look for type definitions in code blocks
      if (
        line.startsWith("export type ") &&
        FORBIDDEN_TYPES.some((type) => line.includes(type))
      ) {
        allViolations.push({
          file: file,
          line: lineNumber,
          type: "DOCS_TYPE_DEFINITION",
          message:
            "Type definition in documentation - these should be examples only",
          content: line,
        });
      }
    }
  }

  // Report results
  if (allViolations.length === 0) {
    logSuccess("Type governance check passed! No violations found.");
    return true;
  }

  log("\n🚨 TYPE GOVERNANCE VIOLATIONS FOUND:\n", "red");

  const violationsByType = {};
  for (const violation of allViolations) {
    if (!violationsByType[violation.type]) {
      violationsByType[violation.type] = [];
    }
    violationsByType[violation.type].push(violation);
  }

  for (const [type, violations] of Object.entries(violationsByType)) {
    log(`\n${type} (${violations.length} violations):`, "magenta");

    for (const violation of violations) {
      logError(`${violation.file}:${violation.line}`);
      log(`  ${violation.message}`, "yellow");
      log(`  Code: ${violation.content}`, "cyan");
    }
  }

  log("\n📚 How to fix:", "bold");
  log("1. Remove manual type definitions");
  log("2. Import types from @/shared/types instead");
  log("3. See docs/04-implementation/TYPE_GOVERNANCE.md");
  log("4. Run npm run validate-types to verify fixes\n");

  return false;
}

function main() {
  try {
    const passed = checkTypeGovernance();
    process.exit(passed ? 0 : 1);
  } catch (error) {
    logError(`Type governance check failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkTypeGovernance };
