/**
 * Data Extractor Service
 * Extracts structured gemstone data from AI analysis results
 * @module scripts/ai-analysis/data-extractor
 */

/**
 * Extract gemstone properties from AI analysis result
 * Maps AI JSON structure to database fields
 *
 * @param {Object} consolidatedAnalysis - The complete AI analysis result
 * @returns {Object} Extracted data ready for database insertion
 */
export function extractGemstoneData(consolidatedAnalysis) {
  const data = consolidatedAnalysis;

  // Try multiple extraction strategies in order of preference
  console.log(`  📊 Attempting multi-strategy extraction...`);

  // Strategy 1: Check for aggregated_data (from structured outputs or explicit consolidation)
  const aggregated = data.aggregated_data || data.consolidated_data || {};

  if (Object.keys(aggregated).length > 0) {
    console.log(
      `  ✅ Found aggregated_data with ${Object.keys(aggregated).length} keys`
    );
    return extractFromAggregated(aggregated, data);
  }

  // Strategy 2: Parse individual_analyses array
  const individual = data.individual_analyses || [];
  if (individual.length > 0) {
    console.log(
      `  ✅ Found ${individual.length} individual_analyses, extracting...`
    );
    return extractFromIndividualAnalyses(individual, data);
  }

  // Strategy 3: Try to find data anywhere in the response
  console.log(
    `  ⚠️  No standard structure found, attempting flexible extraction...`
  );
  return extractFlexible(data);
}

/**
 * Extract from aggregated_data or consolidated_data
 */
function extractFromAggregated(aggregated, fullData) {
  // DEBUG: Log the actual keys present
  const keys = Object.keys(aggregated);
  console.log(`  🔍 aggregated_data keys:`, keys.join(", "));

  // DEBUG: Log the content of key fields
  if (aggregated.measurement_summary) {
    console.log(
      `  📏 measurement_summary:`,
      JSON.stringify(aggregated.measurement_summary).substring(0, 300) + "..."
    );
  }
  if (aggregated.color_assessment) {
    console.log(
      `  🎨 color_assessment:`,
      JSON.stringify(aggregated.color_assessment).substring(0, 300) + "..."
    );
  }
  if (aggregated.clarity_grade) {
    console.log(
      `  🔍 clarity_grade:`,
      JSON.stringify(aggregated.clarity_grade).substring(0, 300) + "..."
    );
  }
  if (aggregated.cut_quality) {
    console.log(
      `  ✂️  cut_quality:`,
      JSON.stringify(aggregated.cut_quality).substring(0, 300) + "..."
    );
  }
  if (aggregated.all_gauge_readings) {
    console.log(
      `  📐 all_gauge_readings:`,
      JSON.stringify(aggregated.all_gauge_readings).substring(0, 300) + "..."
    );
  }

  // CRITICAL: Handle measurements_cross_verified structure (GPT-5-mini's format)
  const crossVerified = aggregated.measurements_cross_verified || {};

  // Extract weight from multiple possible sources
  let weight = null;
  if (crossVerified.weight_ct?.value) {
    weight = crossVerified.weight_ct.value;
  } else if (crossVerified.weight?.value) {
    weight = crossVerified.weight.value;
  } else if (aggregated.weight_ct) {
    weight = aggregated.weight_ct;
  } else if (aggregated.weight) {
    weight = aggregated.weight;
  } else {
    // Try measurement_summary structure (new AI format)
    const measurementSummary = aggregated.measurement_summary || {};
    if (measurementSummary.weight_ct?.value) {
      weight = measurementSummary.weight_ct.value;
    } else if (measurementSummary.weight_ct) {
      weight = measurementSummary.weight_ct;
    } else if (measurementSummary.weight?.value) {
      weight = measurementSummary.weight.value;
    } else if (measurementSummary.weight) {
      weight = measurementSummary.weight;
    }
  }

  // Extract dimensions from multiple possible sources
  let length = null;
  if (crossVerified.length_mm?.value) {
    length = crossVerified.length_mm.value;
  } else if (crossVerified.length?.value) {
    length = crossVerified.length.value;
  } else if (aggregated.length_mm) {
    length = aggregated.length_mm;
  } else if (aggregated.length) {
    length = aggregated.length;
  } else {
    // Try measurement_summary structure (new AI format)
    const measurementSummary = aggregated.measurement_summary || {};
    if (measurementSummary.length_mm?.value) {
      length = measurementSummary.length_mm.value;
    } else if (measurementSummary.length_mm) {
      length = measurementSummary.length_mm;
    } else if (measurementSummary.length?.value) {
      length = measurementSummary.length.value;
    } else if (measurementSummary.length) {
      length = measurementSummary.length;
    }
  }

  let width = null;
  if (crossVerified.width_mm?.value) {
    width = crossVerified.width_mm.value;
  } else if (crossVerified.width?.value) {
    width = crossVerified.width.value;
  } else if (aggregated.width_mm) {
    width = aggregated.width_mm;
  } else if (aggregated.width) {
    width = aggregated.width;
  } else {
    // Try measurement_summary structure (new AI format)
    const measurementSummary = aggregated.measurement_summary || {};
    if (measurementSummary.width_mm?.value) {
      width = measurementSummary.width_mm.value;
    } else if (measurementSummary.width_mm) {
      width = measurementSummary.width_mm;
    } else if (measurementSummary.width?.value) {
      width = measurementSummary.width.value;
    } else if (measurementSummary.width) {
      width = measurementSummary.width;
    }
  }

  let depth = null;
  if (crossVerified.depth_mm?.value) {
    depth = crossVerified.depth_mm.value;
  } else if (crossVerified.depth?.value) {
    depth = crossVerified.depth.value;
  } else if (aggregated.depth_mm) {
    depth = aggregated.depth_mm;
  } else if (aggregated.depth) {
    depth = aggregated.depth;
  } else {
    // Try measurement_summary structure (new AI format)
    const measurementSummary = aggregated.measurement_summary || {};
    if (measurementSummary.depth_mm?.value) {
      depth = measurementSummary.depth_mm.value;
    } else if (measurementSummary.depth_mm) {
      depth = measurementSummary.depth_mm;
    } else if (measurementSummary.depth?.value) {
      depth = measurementSummary.depth.value;
    } else if (measurementSummary.depth) {
      depth = measurementSummary.depth;
    }
  }

  // Extract color - handle both string and object formats
  let color = aggregated.color;
  if (!color) {
    const colorData = aggregated.color_assessment || {};

    if (typeof colorData === "string") {
      color = colorData;
    } else {
      const primaryColor =
        colorData.primary_color ||
        colorData.color ||
        colorData.description ||
        colorData.value;

      if (typeof primaryColor === "string") {
        color = primaryColor;
      } else if (typeof primaryColor === "object" && primaryColor !== null) {
        // Handle object: try hue, name, or stringify
        color =
          primaryColor.hue ||
          primaryColor.name ||
          primaryColor.description ||
          primaryColor.value ||
          null;
      }
    }
  }

  // Extract clarity
  let clarity = aggregated.clarity_observations || aggregated.clarity;
  if (!clarity) {
    const clarityData =
      aggregated.clarity_grade || aggregated.clarity_assessment || {};

    if (typeof clarityData === "string") {
      clarity = clarityData;
    } else {
      clarity =
        clarityData.grade ||
        clarityData.assessment ||
        clarityData.level ||
        clarityData.clarity ||
        clarityData.description ||
        null;
    }
  }

  // Extract cut/shape
  let cut = aggregated.shape_cut || aggregated.shape || aggregated.cut;
  if (!cut) {
    const cutData = aggregated.cut_quality || aggregated.cut_assessment || {};

    if (typeof cutData === "string") {
      cut = cutData;
    } else if (typeof cutData === "object") {
      cut =
        cutData.shape ||
        cutData.cut_style ||
        cutData.cut ||
        cutData.style ||
        cutData.description ||
        null;
    }
  }

  // Calculate confidence from cross-verified data or fallback
  let confidence = 0;
  if (
    crossVerified.weight_ct?.confidence ||
    crossVerified.length_mm?.confidence ||
    crossVerified.width_mm?.confidence ||
    crossVerified.depth_mm?.confidence
  ) {
    // Average the confidences from cross-verified measurements
    const confidences = [
      crossVerified.weight_ct?.confidence,
      crossVerified.length_mm?.confidence,
      crossVerified.width_mm?.confidence,
      crossVerified.depth_mm?.confidence,
    ].filter((c) => c !== null && c !== undefined);

    confidence =
      confidences.length > 0
        ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
        : 0;
  } else {
    // Try to get confidence from measurement_summary (new AI format)
    const measurementSummary = aggregated.measurement_summary || {};
    const summaryConfidences = [
      measurementSummary.weight_ct?.confidence,
      measurementSummary.weight?.confidence,
      measurementSummary.length_mm?.confidence,
      measurementSummary.length?.confidence,
      measurementSummary.width_mm?.confidence,
      measurementSummary.width?.confidence,
      measurementSummary.depth_mm?.confidence,
      measurementSummary.depth?.confidence,
      measurementSummary.overall_measurement_confidence,
    ].filter((c) => c !== null && c !== undefined);

    if (summaryConfidences.length > 0) {
      confidence =
        summaryConfidences.reduce((sum, c) => sum + c, 0) /
        summaryConfidences.length;
    } else {
      // Fallback to overall confidence
      confidence =
        aggregated.overall_confidence ||
        aggregated.confidence ||
        fullData.overall_confidence ||
        aggregated.quality_assessment?.overall_confidence ||
        0;
    }
  }

  console.log(
    `  💎 Extracted: weight=${weight}, length=${length}, width=${width}, depth=${depth}, color=${color}, cut=${cut}`
  );
  console.log(`  📊 Confidence: ${Math.round(confidence * 100)}%`);

  return {
    ai_weight_carats: weight,
    ai_length_mm: length,
    ai_width_mm: width,
    ai_depth_mm: depth,
    ai_color: color,
    ai_clarity: clarity,
    ai_cut: cut,
    ai_origin: null,
    ai_treatment: null,
    ai_quality_grade: null,
    ai_extraction_confidence: confidence,
    ai_extracted_date: new Date().toISOString(),
  };
}

/**
 * Extract from individual_analyses array
 */
function extractFromIndividualAnalyses(analyses, fullData) {
  // Find best measurement for each dimension
  const weight = getBestMeasurement(analyses, "weight_ct", "weight");
  const length = getBestMeasurement(analyses, "length_mm", "length");
  const width = getBestMeasurement(analyses, "width_mm", "width");
  const depth = getBestMeasurement(analyses, "depth_mm", "depth");

  // Extract color and cut from visual observations
  let color = null;
  let cut = null;

  for (const analysis of analyses) {
    if (!color && analysis.visual_observations) {
      // Try to extract color from text
      const colorMatch =
        analysis.visual_observations.match(/color[:\s]+([^,\.]+)/i);
      if (colorMatch) color = colorMatch[1].trim();
    }

    if (!cut && (analysis.visual_observations || analysis.description)) {
      const text = analysis.visual_observations || analysis.description || "";
      // Try to extract shape/cut
      const cutMatch = text.match(
        /(round|oval|cushion|emerald|octagon\w*|pear|marquise|heart|trillion|radiant|princess|asscher)[\s\-]?(cut)?/i
      );
      if (cutMatch) cut = cutMatch[1];
    }
  }

  // Calculate confidence from measurements
  const confidences = [weight, length, width, depth]
    .filter((m) => m && m.confidence)
    .map((m) => m.confidence);

  const avgConfidence =
    confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;

  return {
    ai_weight_carats: weight ? weight.value : null,
    ai_length_mm: length ? length.value : null,
    ai_width_mm: width ? width.value : null,
    ai_depth_mm: depth ? depth.value : null,
    ai_color: color,
    ai_clarity: null,
    ai_cut: cut,
    ai_origin: null,
    ai_treatment: null,
    ai_quality_grade: null,
    ai_extraction_confidence: avgConfidence,
    ai_extracted_date: new Date().toISOString(),
  };
}

/**
 * Get best measurement from multiple analyses
 */
function getBestMeasurement(analyses, ...fieldNames) {
  let best = null;

  for (const analysis of analyses) {
    if (!analysis.measurements) continue;

    for (const fieldName of fieldNames) {
      const measurement = analysis.measurements[fieldName];
      if (!measurement) continue;

      // Handle both { value, confidence } and direct number formats
      const value =
        typeof measurement === "object" ? measurement.value : measurement;
      const confidence =
        typeof measurement === "object" ? measurement.confidence || 0.5 : 0.5;

      if (value && (!best || confidence > best.confidence)) {
        best = { value, confidence };
      }
    }
  }

  return best;
}

/**
 * Flexible extraction when structure is non-standard
 */
function extractFlexible(data) {
  // Try to find data anywhere in the JSON
  const searchObject = (obj, key) => {
    if (!obj || typeof obj !== "object") return null;
    if (obj[key]) return obj[key];
    for (const value of Object.values(obj)) {
      if (typeof value === "object") {
        const found = searchObject(value, key);
        if (found) return found;
      }
    }
    return null;
  };

  return {
    ai_weight_carats:
      searchObject(data, "weight_ct") || searchObject(data, "weight"),
    ai_length_mm:
      searchObject(data, "length_mm") || searchObject(data, "length"),
    ai_width_mm: searchObject(data, "width_mm") || searchObject(data, "width"),
    ai_depth_mm: searchObject(data, "depth_mm") || searchObject(data, "depth"),
    ai_color: searchObject(data, "color"),
    ai_clarity:
      searchObject(data, "clarity") ||
      searchObject(data, "clarity_observations"),
    ai_cut:
      searchObject(data, "cut") ||
      searchObject(data, "shape") ||
      searchObject(data, "shape_cut"),
    ai_origin: null,
    ai_treatment: null,
    ai_quality_grade: null,
    ai_extraction_confidence: searchObject(data, "confidence") || 0,
    ai_extracted_date: new Date().toISOString(),
  };
}

/**
 * Validate whether extracted AI data should update a field
 * Never overwrites manual data; only fills in missing values with confident AI data
 *
 * @param {any} manualValue - Current manual value from database
 * @param {any} aiValue - AI-extracted value
 * @param {number} aiConfidence - Confidence score for AI extraction (0-1)
 * @returns {boolean} Whether the field should be updated with AI data
 */
export function shouldUpdateField(manualValue, aiValue, aiConfidence) {
  // Never overwrite manual data
  if (manualValue !== null && manualValue !== undefined) {
    return false;
  }

  // Only use AI data if it exists and confidence is high enough (> 0.7)
  return aiValue !== null && aiConfidence > 0.7;
}

/**
 * Count how many fields have manual vs AI data
 * Used for quality reporting
 *
 * @param {Object} gemstone - Current gemstone data from database
 * @returns {Object} Counts of manual, ai, and empty fields
 */
export function countDataSources(gemstone) {
  const fields = [
    "weight_carats",
    "length_mm",
    "width_mm",
    "depth_mm",
    "color",
    "clarity",
    "cut",
  ];

  const counts = {
    manual: 0,
    ai_only: 0,
    both: 0,
    empty: 0,
  };

  fields.forEach((field) => {
    const hasManual = gemstone[field] !== null && gemstone[field] !== undefined;
    const hasAI =
      gemstone[`ai_${field}`] !== null && gemstone[`ai_${field}`] !== undefined;

    if (hasManual && hasAI) {
      counts.both++;
    } else if (hasManual) {
      counts.manual++;
    } else if (hasAI) {
      counts.ai_only++;
    } else {
      counts.empty++;
    }
  });

  return counts;
}
