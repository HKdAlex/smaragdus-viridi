/**
 * JSON Schema for AI Text Generation v6
 * Used with OpenAI Structured Outputs to enforce consistent response format
 */

export const TEXT_GENERATION_SCHEMA = {
  type: "object",
  properties: {
    technical_description: {
      type: "object",
      properties: {
        en: {
          type: "string",
          description: "Technical description in English (200-300 words)",
        },
        ru: {
          type: "string",
          description: "Technical description in Russian (200-300 words)",
        },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    emotional_description: {
      type: "object",
      properties: {
        en: {
          type: "string",
          description:
            "Emotional/evocative description in English (150-200 words)",
        },
        ru: {
          type: "string",
          description:
            "Emotional/evocative description in Russian (150-200 words)",
        },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    narrative_story: {
      type: "object",
      properties: {
        en: {
          type: "string",
          description: "Narrative story/journey in English (300-400 words)",
        },
        ru: {
          type: "string",
          description: "Narrative story/journey in Russian (300-400 words)",
        },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    historical_context: {
      type: "object",
      properties: {
        en: {
          type: "string",
          description:
            "Historical context of gemstone type in English (150-200 words)",
        },
        ru: {
          type: "string",
          description:
            "Historical context of gemstone type in Russian (150-200 words)",
        },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    care_instructions: {
      type: "object",
      properties: {
        en: {
          type: "string",
          description:
            "Care and maintenance instructions in English (100-150 words)",
        },
        ru: {
          type: "string",
          description:
            "Care and maintenance instructions in Russian (100-150 words)",
        },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    marketing_highlights: {
      type: "object",
      properties: {
        en: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 5,
          description: "3-5 concise marketing highlights in English",
        },
        ru: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 5,
          description: "3-5 concise marketing highlights in Russian",
        },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    promotional_text: {
      type: "object",
      properties: {
        en: {
          type: "string",
          description:
            "Promotional text highlighting special occasions/use cases in English (100-150 words)",
        },
        ru: {
          type: "string",
          description:
            "Promotional text highlighting special occasions/use cases in Russian (100-150 words)",
        },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence score for the generated content (0-1)",
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of confidence score and any limitations",
    },
  },
  required: [
    "technical_description",
    "emotional_description",
    "narrative_story",
    "historical_context",
    "care_instructions",
    "marketing_highlights",
    "promotional_text",
    "confidence",
    "reasoning",
  ],
  additionalProperties: false,
};
