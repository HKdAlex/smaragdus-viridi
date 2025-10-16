/**
 * JSON Schema for Structured OpenAI Outputs
 * Forces GPT-5-mini to return data in our exact format
 */

export const GEMSTONE_ANALYSIS_SCHEMA = {
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
        measurements_cross_verified: {
          type: "object",
          properties: {
            weight_ct: {
              type: "object",
              properties: {
                value: { type: "number" },
                confidence: { type: "number" },
                sources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      image_index: { type: "number" },
                      method: { type: "string" },
                      confidence: { type: "number" },
                    },
                    required: ["image_index", "method", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["value", "confidence", "sources"],
              additionalProperties: false,
            },
            length_mm: {
              type: "object",
              properties: {
                value: { type: "number" },
                confidence: { type: "number" },
              },
              required: ["value", "confidence"],
              additionalProperties: false,
            },
            width_mm: {
              type: "object",
              properties: {
                value: { type: "number" },
                confidence: { type: "number" },
              },
              required: ["value", "confidence"],
              additionalProperties: false,
            },
            depth_mm: {
              type: "object",
              properties: {
                value: { type: "number" },
                confidence: { type: "number" },
              },
              required: ["value", "confidence"],
              additionalProperties: false,
            },
          },
          required: ["weight_ct"],
          additionalProperties: false,
        },
        overall_confidence_summary: {
          type: "object",
          properties: {
            visual_identification: { type: "number" },
            measurements_consistency: { type: "number" },
            label_and_display_agreement: { type: "number" },
          },
          required: ["visual_identification", "measurements_consistency"],
          additionalProperties: false,
        },
      },
      required: ["measurements_cross_verified", "overall_confidence_summary"],
      additionalProperties: false,
    },
    individual_analyses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "number" },
          type: { type: "string" },
          description: { type: "string" },
          measurements: {
            type: "object",
            properties: {
              weight_ct: {
                type: "object",
                properties: {
                  value: { type: "number" },
                  confidence: { type: "number" },
                },
                additionalProperties: false,
              },
              gauge_reading_mm: {
                type: "object",
                properties: {
                  value: { type: "number" },
                  dimension: { type: "string" },
                  confidence: { type: "number" },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          visual_observations: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["index", "type", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["primary_image", "aggregated_data", "individual_analyses"],
  additionalProperties: false,
};
