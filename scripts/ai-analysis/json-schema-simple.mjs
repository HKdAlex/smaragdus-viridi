/**
 * Simplified JSON Schema for Structured OpenAI Outputs
 * Focuses on guaranteed, always-present fields only
 */

export const GEMSTONE_ANALYSIS_SCHEMA_SIMPLE = {
  type: "object",
  properties: {
    primary_image: {
      type: "object",
      properties: {
        index: { type: "number" },
        score: { type: "number" },
        reasoning: { type: "string" },
      },
      required: ["index", "score", "reasoning"],
      additionalProperties: false,
    },
    aggregated_data: {
      type: "object",
      properties: {
        shape_cut: { type: "string" },
        color: { type: "string" },
        clarity_observations: { type: "string" },
        weight_ct: { type: "number" },
        length_mm: { type: "number" },
        width_mm: { type: "number" },
        depth_mm: { type: "number" },
        overall_confidence: { type: "number" },
      },
      required: [
        "shape_cut",
        "color",
        "clarity_observations",
        "weight_ct",
        "overall_confidence",
      ],
      additionalProperties: false,
    },
  },
  required: ["primary_image", "aggregated_data"],
  additionalProperties: false,
};
