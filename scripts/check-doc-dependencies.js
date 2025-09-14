#!/usr/bin/env node

/**
 * Cross-Document Dependency Checker for Crystallique
 * Validates consistency across related documentation files
 */

const fs = require("fs");
const path = require("path");

class CrossDocumentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.docs = {};
  }

  async validate() {
    console.log("🔍 Checking cross-document dependencies...\n");

    await this.loadDocuments();
    this.checkSprintConsistency();
    this.checkTimelineAlignment();
    this.checkFeatureAlignment();
    this.checkStatusConsistency();

    this.reportResults();
    return this.errors.length === 0;
  }

  async loadDocuments() {
    const docPaths = [
      "README.md",
      "docs/01-project/README.md",
      "docs/06-tracking/LIVING_PLAN.md",
      "docs/05-features/feature-overview.md",
      "docs/02-requirements/technical-specifications.md",
    ];

    for (const docPath of docPaths) {
      const fullPath = path.join(__dirname, "..", docPath);
      if (fs.existsSync(fullPath)) {
        this.docs[docPath] = fs.readFileSync(fullPath, "utf-8");
      } else {
        this.warnings.push(`Document not found: ${docPath}`);
      }
    }

    console.log(
      `✅ Loaded ${Object.keys(this.docs).length} documents for validation`
    );
  }

  checkSprintConsistency() {
    const livingPlan = this.docs["docs/06-tracking/LIVING_PLAN.md"];
    const projectReadme = this.docs["docs/01-project/README.md"];

    if (!livingPlan || !projectReadme) return;

    // Extract sprint information from both documents
    const livingPlanSprints = this.extractSprints(livingPlan);
    const readmeSprints = this.extractSprints(projectReadme);

    // Check for mismatched sprint counts
    if (livingPlanSprints.length !== readmeSprints.length) {
      this.errors.push(
        `Sprint count mismatch: LIVING_PLAN.md has ${livingPlanSprints.length} sprints, ` +
          `docs/01-project/README.md has ${readmeSprints.length} sprints`
      );
    }

    // Check for sprint name consistency
    livingPlanSprints.forEach((sprint, index) => {
      const readmeSprint = readmeSprints[index];
      if (readmeSprint && sprint.name !== readmeSprint.name) {
        this.warnings.push(
          `Sprint ${index + 1} name mismatch: ` +
            `"${sprint.name}" vs "${readmeSprint.name}"`
        );
      }
    });

    console.log(
      `✅ Sprint consistency check: ${livingPlanSprints.length} sprints validated`
    );
  }

  checkTimelineAlignment() {
    const livingPlan = this.docs["docs/06-tracking/LIVING_PLAN.md"];
    const mainReadme = this.docs["README.md"];

    if (!livingPlan || !mainReadme) return;

    // Extract timeline references
    const livingPlanTimeline = this.extractTimeline(livingPlan);
    const readmeTimeline = this.extractTimeline(mainReadme);

    if (livingPlanTimeline && readmeTimeline) {
      if (livingPlanTimeline !== readmeTimeline) {
        this.errors.push(
          `Timeline mismatch: LIVING_PLAN.md shows ${livingPlanTimeline}, ` +
            `README.md shows ${readmeTimeline}`
        );
      }
    }

    console.log("✅ Timeline alignment check completed");
  }

  checkFeatureAlignment() {
    const livingPlan = this.docs["docs/06-tracking/LIVING_PLAN.md"];
    const featureOverview = this.docs["docs/05-features/feature-overview.md"];

    if (!livingPlan || !featureOverview) return;

    // Extract feature mentions from both documents
    const livingPlanFeatures = this.extractFeatureReferences(livingPlan);
    const overviewFeatures = this.extractFeatureReferences(featureOverview);

    // Check for missing features in overview
    livingPlanFeatures.forEach((feature) => {
      if (!overviewFeatures.includes(feature)) {
        this.warnings.push(
          `Feature "${feature}" mentioned in LIVING_PLAN.md but not in feature-overview.md`
        );
      }
    });

    console.log(
      `✅ Feature alignment check: ${livingPlanFeatures.length} features cross-referenced`
    );
  }

  checkStatusConsistency() {
    const livingPlan = this.docs["docs/06-tracking/LIVING_PLAN.md"];
    const projectReadme = this.docs["docs/01-project/README.md"];

    if (!livingPlan || !projectReadme) return;

    // Check for status indicators consistency
    const livingPlanStatus = this.extractCurrentStatus(livingPlan);
    const readmeStatus = this.extractCurrentStatus(projectReadme);

    if (livingPlanStatus && readmeStatus) {
      if (livingPlanStatus.sprint !== readmeStatus.sprint) {
        this.warnings.push(
          `Current sprint mismatch: LIVING_PLAN.md shows "${livingPlanStatus.sprint}", ` +
            `docs/01-project/README.md shows "${readmeStatus.sprint}"`
        );
      }
    }

    console.log("✅ Status consistency check completed");
  }

  extractSprints(content) {
    // Updated pattern to handle markdown table format with bold text and emojis
    const sprintPattern = /\*\*[^*]*Sprint\s+(\d+):\s*([^*]+)\*\*/g;
    const sprints = [];
    let match;

    while ((match = sprintPattern.exec(content)) !== null) {
      sprints.push({
        number: parseInt(match[1]),
        name: match[2].trim(),
      });
    }

    // Fallback to original pattern for non-markdown format
    if (sprints.length === 0) {
      const fallbackPattern = /Sprint\s+(\d+):\s*([^(]+)/g;
      while ((match = fallbackPattern.exec(content)) !== null) {
        sprints.push({
          number: parseInt(match[1]),
          name: match[2].trim(),
        });
      }
    }

    return sprints;
  }

  extractTimeline(content) {
    const timelinePattern = /(\d+)\s*[-\s]*week/i;
    const match = content.match(timelinePattern);
    return match ? `${match[1]} weeks` : null;
  }

  extractFeatureReferences(content) {
    const features = [];
    const commonFeatures = [
      "gemstone catalog",
      "cart",
      "orders",
      "chat",
      "admin",
      "authentication",
      "visualization",
      "3D",
      "media",
      "currency",
    ];

    commonFeatures.forEach((feature) => {
      if (content.toLowerCase().includes(feature.toLowerCase())) {
        features.push(feature);
      }
    });

    return features;
  }

  extractCurrentStatus(content) {
    const sprintPattern = /Current Sprint:\s*Sprint\s+(\d+)[:\s-]*([^(\n]+)/i;
    const match = content.match(sprintPattern);

    if (match) {
      return {
        sprint: `Sprint ${match[1]}`,
        name: match[2].trim(),
      };
    }
    return null;
  }

  reportResults() {
    console.log("\n📊 Cross-Document Validation Results:\n");

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("🎉 Perfect! All documents are consistent!");
      return;
    }

    if (this.errors.length > 0) {
      console.log("❌ CRITICAL INCONSISTENCIES (must fix):");
      this.errors.forEach((error) => console.log(`   • ${error}`));
      console.log("");
    }

    if (this.warnings.length > 0) {
      console.log("⚠️  POTENTIAL INCONSISTENCIES (should review):");
      this.warnings.forEach((warning) => console.log(`   • ${warning}`));
      console.log("");
    }

    console.log(
      `Summary: ${this.errors.length} critical issues, ${this.warnings.length} warnings`
    );

    if (this.errors.length > 0) {
      console.log("\n🚨 Fix critical inconsistencies before proceeding!");
      console.log(
        "📋 Check docs/06-tracking/DOCUMENT_DEPENDENCIES.md for update requirements"
      );
    }
  }
}

// Generate impact analysis report
function generateImpactReport(changedFile) {
  console.log(`\n📈 Impact Analysis for: ${changedFile}\n`);

  const dependencies = {
    "docs/06-tracking/LIVING_PLAN.md": [
      "README.md",
      "docs/01-project/README.md",
      "docs/04-implementation/implementation-playbook.md",
      "docs/05-features/feature-overview.md",
    ],
    "docs/02-requirements/technical-specifications.md": [
      "src/shared/types/database.ts",
      "docs/04-implementation/development-setup.md",
      "docs/06-tracking/LIVING_PLAN.md",
    ],
    "docs/05-features/feature-overview.md": [
      "docs/06-tracking/LIVING_PLAN.md",
      "docs/02-requirements/feature-matrix.md",
      "README.md",
    ],
  };

  const affected = dependencies[changedFile] || [];

  if (affected.length > 0) {
    console.log("🔄 Documents that may need updates:");
    affected.forEach((doc) => console.log(`   • ${doc}`));
  } else {
    console.log("✅ No known dependencies for this document");
  }

  console.log("\n📋 Action Required:");
  console.log("1. Review each potentially affected document");
  console.log("2. Update as needed to maintain consistency");
  console.log("3. Run validation again after updates");
  console.log(
    "4. Consider updating dependency matrix if new relationships found"
  );
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CrossDocumentValidator();

  // Check for impact analysis flag
  const impactFlag = process.argv.find((arg) => arg.startsWith("--impact="));
  if (impactFlag) {
    const changedFile = impactFlag.split("=")[1];
    generateImpactReport(changedFile);
  } else {
    validator.validate().then((success) => {
      if (!success) {
        process.exit(1);
      }
    });
  }
}

module.exports = { CrossDocumentValidator, generateImpactReport };
