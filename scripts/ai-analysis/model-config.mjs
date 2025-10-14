/**
 * AI Model configuration and pricing utilities
 */

export const AI_MODELS = {
  "gpt-5": {
    name: "gpt-5",
    capabilities: [
      "vision",
      "structured_output",
      "high_quality_ocr",
      "reasoning",
    ],
    pricing: { input_per_1k: 0.01, output_per_1k: 0.03 },
    max_tokens: 16000, // Increased - GPT-5 needs room for reasoning + output
    reasoning_effort: "medium", // Reduced from "high" to balance quality/speed
    use_for: ["vision_analysis", "description_generation"],
    notes: "Highest quality, slowest, most expensive",
  },
  "gpt-5-mini": {
    name: "gpt-5-mini",
    capabilities: ["vision", "structured_output", "ocr"],
    pricing: { input_per_1k: 0.0015, output_per_1k: 0.006 }, // Updated based on research
    max_tokens: 8000, // Increased for sufficient output
    reasoning_effort: "low", // Reduced to minimize token waste on reasoning
    use_for: ["vision_analysis", "description_generation"],
    notes: "85% cheaper, faster, good quality",
  },
  "gpt-5-nano": {
    name: "gpt-5-nano",
    capabilities: ["vision", "structured_output", "basic_ocr"],
    pricing: { input_per_1k: 0.0005, output_per_1k: 0.002 }, // Estimated
    max_tokens: 4000, // Increased slightly
    reasoning_effort: "low",
    use_for: ["vision_analysis"],
    notes: "95% cheaper, fastest, basic quality",
  },
  "gpt-4o": {
    name: "gpt-4o",
    capabilities: ["vision", "structured_output", "high_quality_ocr"],
    pricing: { input_per_1k: 0.005, output_per_1k: 0.015 },
    max_tokens: 4000,
    use_for: ["vision_analysis", "description_generation"],
    notes: "Balanced, proven reliability",
  },
  "gpt-4o-mini": {
    name: "gpt-4o-mini",
    capabilities: ["vision", "structured_output", "ocr"],
    pricing: { input_per_1k: 0.00015, output_per_1k: 0.0006 },
    max_tokens: 4000,
    use_for: ["vision_analysis", "description_generation"],
    notes: "Very cheap, good for bulk",
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
