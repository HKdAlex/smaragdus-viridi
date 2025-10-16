import {
  DIMENSION_TOLERANCE_MM,
  MIN_CONFIDENCE_THRESHOLD,
  WEIGHT_TOLERANCE_CT,
} from "./config.mjs";

function weightedMean(values) {
  const numerator = values.reduce(
    (sum, item) => sum + item.value * item.weight,
    0
  );
  const denominator = values.reduce((sum, item) => sum + item.weight, 0);
  if (denominator === 0) return null;
  return numerator / denominator;
}

function maxConfidence(values) {
  return values.length > 0 ? Math.max(...values.map((item) => item.weight)) : 0;
}

function extractNumericClaims(perImage, field) {
  return perImage
    .flatMap((image) =>
      image.claims
        .filter(
          (claim) =>
            claim.field === field &&
            claim.value !== null &&
            !Number.isNaN(Number(claim.value))
        )
        .map((claim) => ({
          imageId: image.image_id,
          value: Number(claim.value),
          weight: Number(claim.confidence ?? 0),
          provenance: claim.provenance,
        }))
    )
    .filter((item) => item.weight > 0);
}

function extractTextClaims(perImage, field) {
  return perImage
    .flatMap((image) =>
      image.claims
        .filter((claim) => claim.field === field && claim.value)
        .map((claim) => ({
          imageId: image.image_id,
          value: String(claim.value),
          weight: Number(claim.confidence ?? 0),
          provenance: claim.provenance,
        }))
    )
    .filter((item) => item.weight > 0);
}

function calculateRange(values) {
  if (values.length === 0) return 0;
  const numeric = values.map((item) => item.value);
  return Math.max(...numeric) - Math.min(...numeric);
}

function buildSources(values) {
  return [
    ...new Set(
      values.map((item) => `${item.imageId}:${item.provenance.method}`)
    ),
  ];
}

function selectTopClaim(values) {
  if (values.length === 0) return null;
  return values.reduce((best, current) =>
    current.weight > best.weight ? current : best
  );
}

export function fuseClaims(perImage) {
  const extractions = perImage || [];

  const heightClaims = extractNumericClaims(extractions, "dimension_mm_height");
  const minClaims = extractNumericClaims(extractions, "dimension_mm_min");
  const maxClaims = extractNumericClaims(extractions, "dimension_mm_max");
  const weightClaims = extractNumericClaims(extractions, "weight_ct");

  const cutClaims = extractTextClaims(extractions, "cut_shape");
  const colorClaims = extractTextClaims(extractions, "color_family");
  const clarityClaims = extractTextClaims(extractions, "clarity_est");

  const heightValue = weightedMean(heightClaims);
  const minValue = weightedMean(minClaims);
  const maxValue = weightedMean(maxClaims);
  const weightValue = weightedMean(weightClaims);

  const heightConfidence = maxConfidence(heightClaims);
  const minConfidence = maxConfidence(minClaims);
  const maxConfidenceScore = maxConfidence(maxClaims);
  const weightConfidence = maxConfidence(weightClaims);

  const cutTop = selectTopClaim(cutClaims);
  const colorTop = selectTopClaim(colorClaims);
  const clarityTop = selectTopClaim(clarityClaims);

  const conflicts = [];

  const heightRange = calculateRange(heightClaims);
  const minRange = calculateRange(minClaims);
  const maxRange = calculateRange(maxClaims);
  const weightRange = calculateRange(weightClaims);

  if (heightRange > DIMENSION_TOLERANCE_MM) {
    conflicts.push(`height variance > ${DIMENSION_TOLERANCE_MM}mm`);
  }
  if (minRange > DIMENSION_TOLERANCE_MM) {
    conflicts.push(`min variance > ${DIMENSION_TOLERANCE_MM}mm`);
  }
  if (maxRange > DIMENSION_TOLERANCE_MM) {
    conflicts.push(`max variance > ${DIMENSION_TOLERANCE_MM}mm`);
  }
  if (weightRange > WEIGHT_TOLERANCE_CT) {
    conflicts.push(`weight variance > ${WEIGHT_TOLERANCE_CT}ct`);
  }

  const final = {
    dimensions_mm: {
      max: maxValue,
      min: minValue,
      height: heightValue,
    },
    weight_ct: weightValue,
    cut: {
      shape: cutTop?.value ?? null,
      style: null,
    },
    color: {
      family: colorTop?.value ?? null,
      grade_est: null,
    },
    clarity_est: clarityTop?.value ?? null,
    fluorescence: {
      presence: null,
      color: null,
      strength: null,
    },
    treatment_signs: null,
    origin_hint: null,
  };

  const confidence = {
    dimensions_mm: {
      max: maxConfidenceScore,
      min: minConfidence,
      height: heightConfidence,
    },
    weight_ct: weightConfidence,
    cut: cutTop?.weight ?? 0,
    color: colorTop?.weight ?? 0,
    clarity_est: clarityTop?.weight ?? 0,
    fluorescence: 0,
  };

  const provenance = {
    dimension_sources: buildSources([
      ...heightClaims,
      ...minClaims,
      ...maxClaims,
    ]),
    weight_sources: buildSources(weightClaims),
    label_sources: buildSources(extractTextClaims(extractions, "label_text")),
  };

  const needsReview =
    conflicts.length > 0 ||
    confidence.weight_ct < MIN_CONFIDENCE_THRESHOLD ||
    confidence.dimensions_mm.height < MIN_CONFIDENCE_THRESHOLD;

  return {
    final,
    confidence,
    provenance,
    conflicts,
    needs_review: needsReview,
  };
}

