import { Gemstone } from "@/shared/types";

export interface VisualizationConfig {
  readonly autoRotate: boolean;
  readonly rotationSpeed: number;
  readonly lightingMode: LightingMode;
  readonly viewMode: ViewMode;
  readonly showControls: boolean;
  readonly quality: RenderQuality;
}

export type LightingMode = "studio" | "natural" | "dramatic" | "custom";
export type ViewMode = "front" | "side" | "top" | "free";
export type RenderQuality = "low" | "medium" | "high" | "ultra";

export interface Stone3DVisualizerProps {
  readonly gemstone: Gemstone;
  readonly className?: string;
  readonly onDownload?: () => void;
  readonly config?: Partial<VisualizationConfig>;
}

export interface VisualizationControls {
  readonly setView: (mode: ViewMode) => void;
  readonly setLighting: (mode: LightingMode) => void;
  readonly toggleAutoRotate: () => void;
  readonly resetView: () => void;
  readonly downloadScreenshot: () => void;
}

export interface GemstoneGeometry {
  readonly vertices: Float32Array;
  readonly indices: Uint16Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
}

export interface GemstoneMaterial {
  readonly color: number;
  readonly opacity: number;
  readonly metalness: number;
  readonly roughness: number;
  readonly transmission: number;
  readonly ior: number;
  readonly clearcoat: number;
  readonly clearcoatRoughness: number;
}

export interface LightingSetup {
  readonly ambient: {
    readonly color: number;
    readonly intensity: number;
  };
  readonly directional: Array<{
    readonly color: number;
    readonly intensity: number;
    readonly position: [number, number, number];
    readonly castShadow: boolean;
  }>;
  readonly spot: Array<{
    readonly color: number;
    readonly intensity: number;
    readonly position: [number, number, number];
    readonly angle: number;
    readonly penumbra: number;
  }>;
  readonly point: Array<{
    readonly color: number;
    readonly intensity: number;
    readonly position: [number, number, number];
    readonly distance: number;
  }>;
}

export interface PerformanceMetrics {
  readonly fps: number;
  readonly frameTime: number;
  readonly memoryUsage: number;
  readonly drawCalls: number;
  readonly triangles: number;
}

export interface VisualizationError {
  readonly code:
    | "WEBGL_NOT_SUPPORTED"
    | "WEBGL_CONTEXT_LOST"
    | "GEOMETRY_ERROR"
    | "MATERIAL_ERROR";
  readonly message: string;
  readonly details?: string;
}

export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  autoRotate: true,
  rotationSpeed: 2.0,
  lightingMode: "studio",
  viewMode: "free",
  showControls: false,
  quality: "high",
} as const;

export const LIGHTING_PRESETS: Record<LightingMode, LightingSetup> = {
  studio: {
    ambient: { color: 0x404040, intensity: 0.4 },
    directional: [
      {
        color: 0xffffff,
        intensity: 1.0,
        position: [10, 10, 5],
        castShadow: true,
      },
      {
        color: 0xffffff,
        intensity: 0.3,
        position: [-10, 5, -5],
        castShadow: false,
      },
      {
        color: 0xffffff,
        intensity: 0.2,
        position: [0, -5, -10],
        castShadow: false,
      },
    ],
    spot: [],
    point: [],
  },
  natural: {
    ambient: { color: 0x87ceeb, intensity: 0.6 },
    directional: [
      {
        color: 0xfff8dc,
        intensity: 0.8,
        position: [5, 15, 5],
        castShadow: false,
      },
    ],
    spot: [],
    point: [],
  },
  dramatic: {
    ambient: { color: 0x202020, intensity: 0.2 },
    directional: [],
    spot: [
      {
        color: 0xffffff,
        intensity: 1.5,
        position: [10, 10, 10],
        angle: Math.PI / 6,
        penumbra: 0.1,
      },
      {
        color: 0xffffff,
        intensity: 1.0,
        position: [-10, 5, -10],
        angle: Math.PI / 4,
        penumbra: 0.2,
      },
    ],
    point: [
      { color: 0xffffff, intensity: 0.8, position: [0, 20, 0], distance: 100 },
    ],
  },
  custom: {
    ambient: { color: 0x404040, intensity: 0.4 },
    directional: [],
    spot: [],
    point: [],
  },
} as const;

export const GEMSTONE_COLOR_MAP: Record<string, number> = {
  // Diamond colors
  D: 0xffffff,
  E: 0xfefefe,
  F: 0xfdfdfd,
  G: 0xfbfbfb,
  H: 0xf9f9f9,
  I: 0xf7f7f7,
  J: 0xf5f5f5,
  K: 0xf3f3f3,
  L: 0xf1f1f1,
  M: 0xefefef,

  // Fancy colors
  "fancy-yellow": 0xffd700,
  "fancy-blue": 0x4169e1,
  "fancy-pink": 0xff69b4,
  "fancy-green": 0x32cd32,

  // Other gemstone colors
  red: 0xdc143c,
  blue: 0x4169e1,
  green: 0x32cd32,
  yellow: 0xffd700,
  pink: 0xff69b4,
  white: 0xffffff,
  black: 0x2f2f2f,
  colorless: 0xf0f0f0,
} as const;

export const CLARITY_OPACITY_MAP: Record<string, number> = {
  FL: 0.95, // Flawless
  IF: 0.93, // Internally Flawless
  VVS1: 0.9,
  VVS2: 0.88,
  VS1: 0.85,
  VS2: 0.82,
  SI1: 0.78,
  SI2: 0.75,
  I1: 0.7,
} as const;

export const RENDER_QUALITY_SETTINGS: Record<
  RenderQuality,
  {
    readonly pixelRatio: number;
    readonly shadowMapSize: number;
    readonly geometryDetail: number;
    readonly antialias: boolean;
  }
> = {
  low: {
    pixelRatio: 1,
    shadowMapSize: 512,
    geometryDetail: 8,
    antialias: false,
  },
  medium: {
    pixelRatio: 1.5,
    shadowMapSize: 1024,
    geometryDetail: 16,
    antialias: true,
  },
  high: {
    pixelRatio: 2,
    shadowMapSize: 2048,
    geometryDetail: 32,
    antialias: true,
  },
  ultra: {
    pixelRatio: 2,
    shadowMapSize: 4096,
    geometryDetail: 64,
    antialias: true,
  },
} as const;
