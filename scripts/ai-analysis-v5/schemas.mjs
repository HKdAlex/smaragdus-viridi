/**
 * JSON Schemas and Type Validators for AI Analysis v5
 */

const CLAIM_FIELDS = [
  "dimension_mm_max",
  "dimension_mm_min",
  "dimension_mm_height",
  "weight_ct",
  "units",
  "instrument_readout_mm",
  "instrument_range_mm",
  "cut_shape",
  "cut_style",
  "color_family",
  "color_grade_est",
  "clarity_est",
  "fluorescence_presence",
  "fluorescence_color",
  "fluorescence_strength",
  "treatment_signs",
  "origin_hint",
  "label_text",
  "notes",
];

const PROVENANCE_METHODS = [
  "lcd_ocr",
  "scale_detection",
  "label_ocr",
  "visual_inference",
  "text_parsing",
  "geometric_estimate",
];

export const PER_IMAGE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "GemImageExtraction",
  type: "object",
  required: ["image_id", "image_type", "claims"],
  properties: {
    image_id: { type: "string" },
    image_type: { enum: ["instrument", "label", "gem_macro", "unknown"] },
    claims: {
      type: "array",
      items: {
        type: "object",
        required: ["field", "value", "confidence", "provenance"],
        properties: {
          field: { enum: CLAIM_FIELDS },
          value: { type: ["string", "number", "boolean", "null"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          provenance: {
            type: "object",
            required: ["method"],
            properties: {
              method: { enum: PROVENANCE_METHODS },
              bbox: {
                type: ["array", "null"],
                items: { type: "number" },
                minItems: 4,
                maxItems: 4,
              },
              raw: { type: ["string", "null"] },
            },
          },
        },
      },
    },
  },
};

export const FUSION_OUTPUT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "GemstoneFusionOutput",
  type: "object",
  required: [
    "gemstone_id",
    "images",
    "final",
    "confidence",
    "provenance",
    "needs_review",
    "conflicts",
  ],
  properties: {
    gemstone_id: { type: "string" },
    images: { type: "array", items: { type: "string" } },
    final: {
      type: "object",
      required: [
        "dimensions_mm",
        "weight_ct",
        "cut",
        "color",
        "clarity_est",
        "fluorescence",
        "treatment_signs",
        "origin_hint",
      ],
      properties: {
        dimensions_mm: {
          type: "object",
          required: ["max", "min", "height"],
          properties: {
            max: { type: ["number", "null"] },
            min: { type: ["number", "null"] },
            height: { type: ["number", "null"] },
          },
          additionalProperties: false,
        },
        weight_ct: { type: ["number", "null"] },
        cut: {
          type: "object",
          required: ["shape", "style"],
          properties: {
            shape: { type: ["string", "null"] },
            style: { type: ["string", "null"] },
          },
          additionalProperties: false,
        },
        color: {
          type: "object",
          required: ["family", "grade_est"],
          properties: {
            family: { type: ["string", "null"] },
            grade_est: { type: ["string", "null"] },
          },
          additionalProperties: false,
        },
        clarity_est: { type: ["string", "null"] },
        fluorescence: {
          type: "object",
          required: ["presence", "color", "strength"],
          properties: {
            presence: { type: ["boolean", "null"] },
            color: { type: ["string", "null"] },
            strength: { type: ["string", "null"] },
          },
          additionalProperties: false,
        },
        treatment_signs: { type: ["string", "null"] },
        origin_hint: { type: ["string", "null"] },
      },
      additionalProperties: false,
    },
    confidence: {
      type: "object",
      required: [
        "dimensions_mm",
        "weight_ct",
        "cut",
        "color",
        "clarity_est",
        "fluorescence",
      ],
      properties: {
        dimensions_mm: {
          type: "object",
          required: ["max", "min", "height"],
          properties: {
            max: { type: "number" },
            min: { type: "number" },
            height: { type: "number" },
          },
          additionalProperties: false,
        },
        weight_ct: { type: "number" },
        cut: { type: "number" },
        color: { type: "number" },
        clarity_est: { type: "number" },
        fluorescence: { type: "number" },
      },
      additionalProperties: false,
    },
    provenance: {
      type: "object",
      required: ["dimension_sources", "weight_sources", "label_sources"],
      properties: {
        dimension_sources: { type: "array", items: { type: "string" } },
        weight_sources: { type: "array", items: { type: "string" } },
        label_sources: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
    conflicts: { type: "array", items: { type: "string" } },
    needs_review: { type: "boolean" },
  },
  additionalProperties: false,
};

export function assertIsValidPerImageExtraction(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Extraction result must be an object");
  }
  if (!("claims" in value) || !Array.isArray(value.claims)) {
    throw new Error("Extraction result must include claims array");
  }
}

export function assertIsValidFusionOutput(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Fusion output must be an object");
  }
  for (const key of ["final", "confidence", "provenance"]) {
    if (!(key in value)) {
      throw new Error(`Fusion output missing ${key}`);
    }
  }
}

export const IMAGE_TYPE_DISPLAY = {
  instrument: "Instrument",
  label: "Label",
  gem_macro: "Gem Macro",
  unknown: "Unknown",
};

export const fields = {
  CLAIM_FIELDS,
  PROVENANCE_METHODS,
};
