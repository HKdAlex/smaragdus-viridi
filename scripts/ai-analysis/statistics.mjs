/**
 * 📊 Analysis Statistics and Reporting
 *
 * Tracks analysis performance, costs, success rates, and provides
 * comprehensive reporting for the multi-image AI analysis system.
 *
 * @author Smaragdus Viridi Team
 * @version 3.0.0
 * @date 2025-01-19
 */

/**
 * Analysis Statistics Tracker for Multi-Image Processing
 */
export class MultiImageAnalysisStats {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalGemstones = 0;
    this.analyzedGemstones = 0;
    this.totalImages = 0;
    this.totalCost = 0;
    this.totalProcessingTime = 0;
    this.errors = [];
    this.startTime = Date.now();
    this.batchResults = [];
    this.primaryImageSelections = [];
  }

  addGemstone() {
    this.totalGemstones++;
  }

  addAnalyzedGemstone(
    gemstoneId,
    imageCount,
    cost,
    processingTime,
    primaryImageInfo
  ) {
    this.analyzedGemstones++;
    this.totalImages += imageCount;
    this.totalCost += cost;
    this.totalProcessingTime += processingTime;

    this.batchResults.push({
      gemstoneId,
      imageCount,
      cost,
      processingTime,
      timestamp: new Date().toISOString(),
    });

    if (primaryImageInfo) {
      this.primaryImageSelections.push({
        gemstoneId,
        selectedIndex: primaryImageInfo.selected_image_index,
        score: primaryImageInfo.score,
        reasoning: primaryImageInfo.reasoning,
      });
    }
  }

  addError(error, context) {
    this.errors.push({
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate comprehensive analysis report
   */
  getReport() {
    const elapsedTime = Date.now() - this.startTime;
    const avgImagesPerGemstone =
      this.analyzedGemstones > 0
        ? this.totalImages / this.analyzedGemstones
        : 0;
    const avgCostPerGemstone =
      this.analyzedGemstones > 0 ? this.totalCost / this.analyzedGemstones : 0;
    const avgProcessingTimePerGemstone =
      this.analyzedGemstones > 0
        ? this.totalProcessingTime / this.analyzedGemstones
        : 0;

    return {
      summary: {
        // Basic metrics
        totalGemstones: this.totalGemstones,
        analyzedGemstones: this.analyzedGemstones,
        successRate:
          this.totalGemstones > 0
            ? ((this.analyzedGemstones / this.totalGemstones) * 100).toFixed(
                1
              ) + "%"
            : "0%",

        // Image metrics
        totalImages: this.totalImages,
        avgImagesPerGemstone: avgImagesPerGemstone.toFixed(1),

        // Cost metrics
        totalCostUSD: this.totalCost.toFixed(4),
        avgCostPerGemstone: avgCostPerGemstone.toFixed(4),
        costPerImage:
          this.totalImages > 0
            ? (this.totalCost / this.totalImages).toFixed(4)
            : "0",

        // Performance metrics
        totalProcessingTimeMs: this.totalProcessingTime,
        avgProcessingTimePerGemstone: Math.round(avgProcessingTimePerGemstone),
        avgProcessingTimePerImage:
          this.totalImages > 0
            ? Math.round(this.totalProcessingTime / this.totalImages)
            : 0,

        // Time metrics
        totalElapsedTimeMs: elapsedTime,
        totalElapsedTimeFormatted: formatDuration(elapsedTime),

        // Error metrics
        errorCount: this.errors.length,
        errorRate:
          this.totalGemstones > 0
            ? ((this.errors.length / this.totalGemstones) * 100).toFixed(1) +
              "%"
            : "0%",
      },

      // Cost analysis
      costAnalysis: {
        totalUSD: this.totalCost.toFixed(4),
        perGemstone: avgCostPerGemstone.toFixed(4),
        perImage:
          this.totalImages > 0
            ? (this.totalCost / this.totalImages).toFixed(4)
            : "0",
        projectedCostFor100Gems: (avgCostPerGemstone * 100).toFixed(2),
        projectedCostFor1000Gems: (avgCostPerGemstone * 1000).toFixed(2),
        costSavingsVsSingleImage: this.calculateCostSavings(),
      },

      // Performance analysis
      performanceAnalysis: {
        avgBatchProcessingTime: Math.round(avgProcessingTimePerGemstone),
        avgImageProcessingTime:
          this.totalImages > 0
            ? Math.round(this.totalProcessingTime / this.totalImages)
            : 0,
        imagesPerSecond:
          this.totalProcessingTime > 0
            ? (this.totalImages / (this.totalProcessingTime / 1000)).toFixed(2)
            : "0",
        gemstonesPerMinute:
          elapsedTime > 0
            ? ((this.analyzedGemstones / (elapsedTime / 1000)) * 60).toFixed(2)
            : "0",
      },

      // Primary image analysis
      primaryImageAnalysis: {
        totalSelections: this.primaryImageSelections.length,
        avgConfidenceScore: this.calculateAvgPrimaryScore(),
        scoreDistribution: this.getPrimaryScoreDistribution(),
        topReasons: this.getTopPrimaryReasons(),
      },

      // Detailed results
      batchResults: this.batchResults,
      primaryImageSelections: this.primaryImageSelections,
      errors: this.errors.slice(0, 10), // Show first 10 errors

      // Comparison metrics
      comparisonMetrics: {
        vsOldSystemCostSavings: this.calculateCostSavings(),
        vsOldSystemTimeSavings: this.calculateTimeSavings(),
        dataConsolidationBenefit:
          "Cross-verification across all images per gemstone",
      },
    };
  }

  /**
   * Calculate cost savings compared to single-image analysis
   */
  calculateCostSavings() {
    if (this.totalImages === 0 || this.analyzedGemstones === 0) return "N/A";

    // Estimate old system cost (separate API call per image)
    const estimatedOldCost = this.totalImages * 0.02; // Estimate $0.02 per image
    const actualCost = this.totalCost;
    const savings = estimatedOldCost - actualCost;
    const savingsPercent = ((savings / estimatedOldCost) * 100).toFixed(1);

    return {
      estimatedOldSystemCost: estimatedOldCost.toFixed(4),
      actualMultiImageCost: actualCost.toFixed(4),
      savingsUSD: savings.toFixed(4),
      savingsPercent: savingsPercent + "%",
    };
  }

  /**
   * Calculate time savings from batch processing
   */
  calculateTimeSavings() {
    if (this.totalImages === 0 || this.analyzedGemstones === 0) return "N/A";

    // Estimate old system time (separate request per image + overhead)
    const estimatedOldTime = this.totalImages * 3000; // 3 seconds per image
    const actualTime = this.totalProcessingTime;
    const savings = estimatedOldTime - actualTime;
    const savingsPercent = ((savings / estimatedOldTime) * 100).toFixed(1);

    return {
      estimatedOldSystemTimeMs: estimatedOldTime,
      actualMultiImageTimeMs: actualTime,
      savingsMs: savings,
      savingsPercent: savingsPercent + "%",
      savingsFormatted: formatDuration(savings),
    };
  }

  /**
   * Calculate average primary image confidence score
   */
  calculateAvgPrimaryScore() {
    if (this.primaryImageSelections.length === 0) return 0;

    const totalScore = this.primaryImageSelections.reduce(
      (sum, selection) => sum + (selection.score || 0),
      0
    );

    return (totalScore / this.primaryImageSelections.length).toFixed(1);
  }

  /**
   * Get distribution of primary image scores
   */
  getPrimaryScoreDistribution() {
    const ranges = {
      "90-100": 0,
      "80-89": 0,
      "70-79": 0,
      "60-69": 0,
      "Below 60": 0,
    };

    this.primaryImageSelections.forEach((selection) => {
      const score = selection.score || 0;
      if (score >= 90) ranges["90-100"]++;
      else if (score >= 80) ranges["80-89"]++;
      else if (score >= 70) ranges["70-79"]++;
      else if (score >= 60) ranges["60-69"]++;
      else ranges["Below 60"]++;
    });

    return ranges;
  }

  /**
   * Get top reasons for primary image selection
   */
  getTopPrimaryReasons() {
    const reasonCounts = {};

    this.primaryImageSelections.forEach((selection) => {
      const reasoning = selection.reasoning || "No reason provided";
      // Extract key phrases from reasoning
      const keyWords = [
        "professional",
        "lighting",
        "background",
        "color",
        "clarity",
        "brilliance",
      ];
      keyWords.forEach((word) => {
        if (reasoning.toLowerCase().includes(word)) {
          reasonCounts[word] = (reasonCounts[word] || 0) + 1;
        }
      });
    });

    return Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
  }

  /**
   * Display real-time progress
   */
  displayProgress() {
    const elapsedTime = Date.now() - this.startTime;
    const successRate =
      this.totalGemstones > 0
        ? ((this.analyzedGemstones / this.totalGemstones) * 100).toFixed(1)
        : 0;

    console.log(
      `\n📊 Progress: ${this.analyzedGemstones}/${this.totalGemstones} gemstones (${successRate}%)`
    );
    console.log(`📸 Images: ${this.totalImages} processed`);
    console.log(`💰 Cost: $${this.totalCost.toFixed(4)}`);
    console.log(`⏱️  Time: ${formatDuration(elapsedTime)}`);
    if (this.errors.length > 0) {
      console.log(`❌ Errors: ${this.errors.length}`);
    }
  }
}

/**
 * Format duration in milliseconds to human readable format
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000)
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Generate detailed analysis report
 */
export function generateAnalysisReport(stats, additionalData = {}) {
  const report = stats.getReport();

  console.log(`\n${"=".repeat(80)}`);
  console.log(
    `🔍 MULTI-IMAGE AI ANALYSIS REPORT - ${new Date().toISOString()}`
  );
  console.log(`${"=".repeat(80)}`);

  // Summary
  console.log(`\n📊 SUMMARY:`);
  console.log(
    `   Gemstones: ${report.summary.analyzedGemstones}/${report.summary.totalGemstones} (${report.summary.successRate})`
  );
  console.log(
    `   Images: ${report.summary.totalImages} (avg ${report.summary.avgImagesPerGemstone} per gemstone)`
  );
  console.log(`   Total Cost: $${report.summary.totalCostUSD}`);
  console.log(`   Total Time: ${report.summary.totalElapsedTimeFormatted}`);
  console.log(
    `   Errors: ${report.summary.errorCount} (${report.summary.errorRate})`
  );

  // Cost Analysis
  console.log(`\n💰 COST ANALYSIS:`);
  console.log(`   Per Gemstone: $${report.costAnalysis.perGemstone}`);
  console.log(`   Per Image: $${report.costAnalysis.perImage}`);
  console.log(
    `   Projected 100 gems: $${report.costAnalysis.projectedCostFor100Gems}`
  );
  console.log(
    `   Projected 1000 gems: $${report.costAnalysis.projectedCostFor1000Gems}`
  );

  if (report.costAnalysis.costSavingsVsSingleImage !== "N/A") {
    console.log(
      `   Cost Savings vs Old: ${report.costAnalysis.costSavingsVsSingleImage.savingsPercent} ($${report.costAnalysis.costSavingsVsSingleImage.savingsUSD})`
    );
  }

  // Performance Analysis
  console.log(`\n⚡ PERFORMANCE:`);
  console.log(
    `   Avg Batch Time: ${report.performanceAnalysis.avgBatchProcessingTime}ms`
  );
  console.log(
    `   Avg Per Image: ${report.performanceAnalysis.avgImageProcessingTime}ms`
  );
  console.log(
    `   Images/Second: ${report.performanceAnalysis.imagesPerSecond}`
  );
  console.log(
    `   Gemstones/Minute: ${report.performanceAnalysis.gemstonesPerMinute}`
  );

  // Primary Image Analysis
  console.log(`\n🎯 PRIMARY IMAGE SELECTION:`);
  console.log(
    `   Selections Made: ${report.primaryImageAnalysis.totalSelections}`
  );
  console.log(
    `   Avg Confidence: ${report.primaryImageAnalysis.avgConfidenceScore}/100`
  );
  console.log(`   Score Distribution:`);
  Object.entries(report.primaryImageAnalysis.scoreDistribution).forEach(
    ([range, count]) => {
      console.log(`     ${range}: ${count} selections`);
    }
  );

  // Top Selection Reasons
  if (report.primaryImageAnalysis.topReasons.length > 0) {
    console.log(`   Top Selection Criteria:`);
    report.primaryImageAnalysis.topReasons.forEach(({ reason, count }) => {
      console.log(`     ${reason}: ${count} times`);
    });
  }

  // Errors
  if (report.errors.length > 0) {
    console.log(`\n❌ ERRORS (First 10):`);
    report.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.context}: ${error.error}`);
    });
  }

  console.log(`\n${"=".repeat(80)}`);

  return report;
}
