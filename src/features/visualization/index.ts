// Main exports for the 3D visualization feature
export { Lazy3DVisualizer } from "./components/lazy-3d-visualizer";
export { Stone3DVisualizer } from "./components/stone-3d-visualizer";

// Types
export type {
  GemstoneGeometry,
  GemstoneMaterial,
  LightingMode,
  LightingSetup,
  PerformanceMetrics,
  RenderQuality,
  Stone3DVisualizerProps,
  ViewMode,
  VisualizationConfig,
  VisualizationControls,
  VisualizationError,
} from "./types/visualization.types";

// Constants
export {
  CLARITY_OPACITY_MAP,
  DEFAULT_VISUALIZATION_CONFIG,
  GEMSTONE_COLOR_MAP,
  LIGHTING_PRESETS,
  RENDER_QUALITY_SETTINGS,
} from "./types/visualization.types";

// Utilities
export {
  calculateOptimalDetailLevel,
  createOptimizedGemstoneGeometry,
  validateGemstoneDimensions,
} from "./utils/geometry-utils";

export {
  createCustomShaderMaterial,
  createEnvironmentMap,
  createGemstoneMaterial,
  createLightingModeMaterial,
  getClarityOpacity,
  getGemstoneColor,
  updateShaderUniforms,
  validateMaterialProperties,
} from "./utils/material-utils";
