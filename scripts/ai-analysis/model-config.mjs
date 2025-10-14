/**
 * AI Model configuration and pricing utilities
 */

export const AI_MODELS = {
  "gpt-5": {
    name: "gpt-5",
    capabilities: ["vision", "structured_output", "high_quality_ocr"],
    pricing: { input_per_1k: 0.01, output_per_1k: 0.03 },
    max_tokens: 8000,
    use_for: ["vision_analysis", "description_generation"],
  },
  "gpt-5-mini": {
    name: "gpt-5-mini",
    capabilities: ["vision", "structured_output"],
    pricing: { input_per_1k: 0.003, output_per_1k: 0.01 },
    max_tokens: 4000,
    use_for: ["description_generation"],
  },
  "gpt-4o": {
    name: "gpt-4o",
    capabilities: ["vision", "structured_output"],
    pricing: { input_per_1k: 0.005, output_per_1k: 0.015 },
    max_tokens: 4000,
    use_for: ["vision_analysis", "description_generation"],
  },
};

export function getModelConfig(modelName) {
  const model = AI_MODELS[modelName];
  if (!model) {
    throw new Error(
      `Unknown model: ${modelName}. Available: ${Object.keys(AI_MODELS).join(
        ", "
      )}`
    );
  }
  return model;
}

export function calculateActualCost(modelName, promptTokens, completionTokens) {
  const model = getModelConfig(modelName);
  const inputCost = ((promptTokens || 0) / 1000) * model.pricing.input_per_1k;
  const outputCost =
    ((completionTokens || 0) / 1000) * model.pricing.output_per_1k;
  return inputCost + outputCost;
}
