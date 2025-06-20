#!/usr/bin/env node

/**
 * Documentation Validation Script for Smaragdus Viridi
 * Validates LIVING_PLAN.md for consistency and quality issues
 */

const fs = require("fs");
const path = require("path");

const LIVING_PLAN_PATH = path.join(
  __dirname,
  "../docs/06-tracking/LIVING_PLAN.md"
);

class DocumentationValidator {
  constructor(filePath) {
    this.filePath = filePath;
    this.content = "";
    this.lines = [];
    this.errors = [];
    this.warnings = [];
  }

  async validate() {
    try {
      this.content = fs.readFileSync(this.filePath, "utf-8");
      this.lines = this.content.split("\n");

      console.log("🔍 Validating LIVING_PLAN.md...\n");

      this.checkSprintDuplication();
      this.checkTimelineConsistency();
      this.checkHeaderHierarchy();
      this.checkFormatConsistency();
      this.checkStatusMarkers();

      this.reportResults();

      return this.errors.length === 0;
    } catch (error) {
      console.error("❌ Failed to validate documentation:", error.message);
      return false;
    }
  }

  checkSprintDuplication() {
    const sprintPattern = /^#{3,4}\s*\*?\*?Sprint\s+(\d+):/i;
    const foundSprints = new Map();

    this.lines.forEach((line, index) => {
      const match = line.match(sprintPattern);
      if (match) {
        const sprintNumber = parseInt(match[1]);
        const lineNumber = index + 1;

        if (foundSprints.has(sprintNumber)) {
          this.errors.push(
            `Duplicate Sprint ${sprintNumber} found at lines ${foundSprints.get(
              sprintNumber
            )} and ${lineNumber}`
          );
        } else {
          foundSprints.set(sprintNumber, lineNumber);
        }
      }
    });

    // Check for sequential sprint numbering
    const sprintNumbers = Array.from(foundSprints.keys()).sort((a, b) => a - b);
    for (let i = 0; i < sprintNumbers.length - 1; i++) {
      if (sprintNumbers[i + 1] !== sprintNumbers[i] + 1) {
        this.warnings.push(
          `Non-sequential sprint numbering: Sprint ${
            sprintNumbers[i]
          } followed by Sprint ${sprintNumbers[i + 1]}`
        );
      }
    }

    console.log(
      `✅ Sprint duplication check: ${foundSprints.size} unique sprints found`
    );
  }

  checkTimelineConsistency() {
    const weekPattern = /\(Weeks?\s+(\d+)(?:-(\d+))?\)/i;
    const weekRanges = [];

    this.lines.forEach((line, index) => {
      const match = line.match(weekPattern);
      if (match) {
        const startWeek = parseInt(match[1]);
        const endWeek = match[2] ? parseInt(match[2]) : startWeek;
        const lineNumber = index + 1;

        weekRanges.push({ start: startWeek, end: endWeek, line: lineNumber });
      }
    });

    // Check for overlapping week ranges
    weekRanges.sort((a, b) => a.start - b.start);
    for (let i = 0; i < weekRanges.length - 1; i++) {
      const current = weekRanges[i];
      const next = weekRanges[i + 1];

      if (current.end >= next.start) {
        this.errors.push(
          `Overlapping week ranges: Weeks ${current.start}-${current.end} (line ${current.line}) and Weeks ${next.start}-${next.end} (line ${next.line})`
        );
      }
    }

    // Check for 2-week sprint consistency
    weekRanges.forEach((range) => {
      const duration = range.end - range.start + 1;
      if (duration !== 2) {
        this.warnings.push(
          `Sprint duration is ${duration} weeks instead of standard 2 weeks at line ${range.line}`
        );
      }
    });

    console.log(
      `✅ Timeline consistency check: ${weekRanges.length} week ranges validated`
    );
  }

  checkHeaderHierarchy() {
    const headerPattern = /^(#{1,6})\s+(.+)$/;
    let lastLevel = 0;

    this.lines.forEach((line, index) => {
      const match = line.match(headerPattern);
      if (match) {
        const level = match[1].length;
        const content = match[2];
        const lineNumber = index + 1;

        // Check for proper sprint header levels
        if (content.includes("Sprint") && level !== 4) {
          this.warnings.push(
            `Sprint header should use #### (found ${"#".repeat(
              level
            )}) at line ${lineNumber}`
          );
        }

        // Check for proper hierarchy (no skipping levels)
        if (level > lastLevel + 1) {
          this.warnings.push(
            `Header level skipped (from h${lastLevel} to h${level}) at line ${lineNumber}`
          );
        }

        lastLevel = level;
      }
    });

    console.log("✅ Header hierarchy check completed");
  }

  checkFormatConsistency() {
    let hasDeliverables = false;
    let hasSuccessMetrics = false;

    this.lines.forEach((line) => {
      if (line.includes("🏗️ DELIVERABLES")) hasDeliverables = true;
      if (line.includes("📊 SUCCESS METRICS")) hasSuccessMetrics = true;
    });

    if (!hasDeliverables) {
      this.warnings.push("Missing deliverables sections in sprint definitions");
    }

    if (!hasSuccessMetrics) {
      this.warnings.push(
        "Missing success metrics sections in sprint definitions"
      );
    }

    console.log("✅ Format consistency check completed");
  }

  checkStatusMarkers() {
    const validMarkers = ["✅", "❌", "🚧", "⏳", "📋", "🔥", "🟢", "🟡", "🔴"];
    const statusLines = this.lines.filter((line) =>
      validMarkers.some((marker) => line.includes(marker))
    );

    if (statusLines.length === 0) {
      this.warnings.push(
        "No status markers found - consider adding progress indicators"
      );
    }

    console.log(
      `✅ Status markers check: ${statusLines.length} status indicators found`
    );
  }

  reportResults() {
    console.log("\n📊 Validation Results:\n");

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("🎉 Perfect! No issues found in LIVING_PLAN.md");
      return;
    }

    if (this.errors.length > 0) {
      console.log("❌ ERRORS (must fix):");
      this.errors.forEach((error) => console.log(`   • ${error}`));
      console.log("");
    }

    if (this.warnings.length > 0) {
      console.log("⚠️  WARNINGS (should fix):");
      this.warnings.forEach((warning) => console.log(`   • ${warning}`));
      console.log("");
    }

    console.log(
      `Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`
    );

    if (this.errors.length > 0) {
      console.log("\n🚨 Fix all errors before committing changes!");
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DocumentationValidator(LIVING_PLAN_PATH);
  validator.validate().then((success) => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = DocumentationValidator;
