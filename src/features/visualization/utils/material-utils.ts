import * as THREE from "three";

import {
  CLARITY_OPACITY_MAP,
  GEMSTONE_COLOR_MAP,
  GemstoneMaterial,
  LightingMode,
} from "../types/visualization.types";

import { Gemstone } from "@/shared/types";

/**
 * Creates realistic gemstone material based on gemstone properties
 */
export function createGemstoneMaterial(
  gemstone: Gemstone,
  lightingMode: LightingMode = "studio"
): THREE.Material {
  const color = getGemstoneColor(gemstone.color);
  const opacity = getClarityOpacity(gemstone.clarity);
  const materialProperties = getMaterialProperties(gemstone);

  const material = new THREE.MeshPhysicalMaterial({
    color: color,
    metalness: materialProperties.metalness,
    roughness: materialProperties.roughness,
    transmission: materialProperties.transmission,
    transparent: true,
    opacity: opacity,
    clearcoat: materialProperties.clearcoat,
    clearcoatRoughness: materialProperties.clearcoatRoughness,
    ior: materialProperties.ior,
    envMapIntensity: lightingMode === "dramatic" ? 2.0 : 1.0,
    side: THREE.DoubleSide, // Render both sides for transparency
  });

  return material;
}

/**
 * Gets gemstone color as hex value
 */
export function getGemstoneColor(color: string): number {
  return GEMSTONE_COLOR_MAP[color] || 0xffffff;
}

/**
 * Gets opacity based on clarity grade
 */
export function getClarityOpacity(clarity: string): number {
  return CLARITY_OPACITY_MAP[clarity] || 0.85;
}

/**
 * Gets material properties based on gemstone type
 */
function getMaterialProperties(gemstone: Gemstone): GemstoneMaterial {
  const { name, clarity } = gemstone;

  // Base properties for different gemstone types
  const baseProperties: Record<string, Partial<GemstoneMaterial>> = {
    diamond: {
      metalness: 0.0,
      roughness: 0.05,
      transmission: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      ior: 2.42, // Diamond refractive index
    },
    emerald: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.9,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.58, // Emerald refractive index
    },
    ruby: {
      metalness: 0.0,
      roughness: 0.08,
      transmission: 0.85,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      ior: 1.77, // Ruby refractive index
    },
    sapphire: {
      metalness: 0.0,
      roughness: 0.08,
      transmission: 0.85,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      ior: 1.77, // Sapphire refractive index
    },
    amethyst: {
      metalness: 0.0,
      roughness: 0.12,
      transmission: 0.8,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      ior: 1.54, // Amethyst refractive index
    },
    topaz: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.62, // Topaz refractive index
    },
    garnet: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.8,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.74, // Garnet refractive index
    },
    peridot: {
      metalness: 0.0,
      roughness: 0.12,
      transmission: 0.8,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      ior: 1.65, // Peridot refractive index
    },
    citrine: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.8,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.54, // Citrine refractive index
    },
    tanzanite: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.69, // Tanzanite refractive index
    },
    aquamarine: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.57, // Aquamarine refractive index
    },
    morganite: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.58, // Morganite refractive index
    },
    tourmaline: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.8,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.62, // Tourmaline refractive index
    },
    zircon: {
      metalness: 0.0,
      roughness: 0.08,
      transmission: 0.9,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      ior: 1.93, // Zircon refractive index
    },
    apatite: {
      metalness: 0.0,
      roughness: 0.12,
      transmission: 0.8,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      ior: 1.63, // Apatite refractive index
    },
    quartz: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.8,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.54, // Quartz refractive index
    },
    paraiba: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.62, // Paraiba refractive index
    },
    spinel: {
      metalness: 0.0,
      roughness: 0.08,
      transmission: 0.9,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      ior: 1.72, // Spinel refractive index
    },
    alexandrite: {
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      ior: 1.75, // Alexandrite refractive index
    },
    agate: {
      metalness: 0.0,
      roughness: 0.15,
      transmission: 0.7,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      ior: 1.54, // Agate refractive index
    },
  };

  // Get base properties for this gemstone type
  const baseProps = baseProperties[name] || baseProperties.diamond;

  // Adjust properties based on clarity
  const clarityMultiplier = getClarityQualityMultiplier(clarity);

  return {
    color: 0xffffff, // Will be overridden by the actual gemstone color
    opacity: 0.9,
    metalness: baseProps.metalness || 0.0,
    roughness: (baseProps.roughness || 0.1) * clarityMultiplier,
    transmission: (baseProps.transmission || 0.9) * clarityMultiplier,
    clearcoat: (baseProps.clearcoat || 0.9) * clarityMultiplier,
    clearcoatRoughness:
      (baseProps.clearcoatRoughness || 0.05) / clarityMultiplier,
    ior: baseProps.ior || 2.42,
  };
}

/**
 * Gets clarity quality multiplier for material properties
 */
function getClarityQualityMultiplier(clarity: string): number {
  const clarityMultipliers: Record<string, number> = {
    FL: 1.0, // Flawless - perfect properties
    IF: 0.98, // Internally Flawless - near perfect
    VVS1: 0.95,
    VVS2: 0.92,
    VS1: 0.88,
    VS2: 0.85,
    SI1: 0.8,
    SI2: 0.75,
    I1: 0.7, // Included - reduced properties
  };

  return clarityMultipliers[clarity] || 0.85;
}

/**
 * Creates environment map for realistic reflections
 */
export function createEnvironmentMap(): THREE.CubeTexture | null {
  // For now, return null - in production, you'd load actual environment maps
  // This could be loaded from HDR files or generated procedurally
  return null;
}

/**
 * Creates custom shader material for special effects
 */
export function createCustomShaderMaterial(
  gemstone: Gemstone,
  lightingMode: LightingMode = "studio"
): THREE.ShaderMaterial {
  const color = getGemstoneColor(gemstone.color);
  const opacity = getClarityOpacity(gemstone.clarity);

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 color;
    uniform float opacity;
    uniform float time;
    uniform vec3 lightPosition;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      // Basic lighting
      vec3 lightDir = normalize(lightPosition - vPosition);
      float diff = max(dot(vNormal, lightDir), 0.0);
      
      // Add some sparkle effect
      float sparkle = sin(vUv.x * 50.0 + time) * sin(vUv.y * 50.0 + time);
      sparkle = max(0.0, sparkle - 0.8) * 5.0;
      
      vec3 finalColor = color * (0.3 + 0.7 * diff) + vec3(sparkle);
      gl_FragColor = vec4(finalColor, opacity);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: opacity },
      time: { value: 0.0 },
      lightPosition: { value: new THREE.Vector3(10, 10, 5) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

/**
 * Updates shader uniforms for animation
 */
export function updateShaderUniforms(
  material: THREE.ShaderMaterial,
  time: number,
  lightPosition: THREE.Vector3
): void {
  if (material.uniforms.time) {
    material.uniforms.time.value = time;
  }
  if (material.uniforms.lightPosition) {
    material.uniforms.lightPosition.value.copy(lightPosition);
  }
}

/**
 * Creates material for different lighting modes
 */
export function createLightingModeMaterial(
  baseMaterial: THREE.Material,
  lightingMode: LightingMode
): THREE.Material {
  if (baseMaterial instanceof THREE.MeshPhysicalMaterial) {
    const material = baseMaterial.clone();

    switch (lightingMode) {
      case "studio":
        material.envMapIntensity = 1.0;
        material.clearcoat = 1.0;
        material.clearcoatRoughness = 0.0;
        break;

      case "natural":
        material.envMapIntensity = 0.8;
        material.clearcoat = 0.8;
        material.clearcoatRoughness = 0.1;
        break;

      case "dramatic":
        material.envMapIntensity = 2.0;
        material.clearcoat = 1.0;
        material.clearcoatRoughness = 0.0;
        material.transmission = Math.min(material.transmission + 0.1, 1.0);
        break;

      case "custom":
        // Keep original properties
        break;
    }

    return material;
  }

  return baseMaterial;
}

/**
 * Validates material properties
 */
export function validateMaterialProperties(
  properties: GemstoneMaterial
): boolean {
  return (
    properties.metalness >= 0 &&
    properties.metalness <= 1 &&
    properties.roughness >= 0 &&
    properties.roughness <= 1 &&
    properties.transmission >= 0 &&
    properties.transmission <= 1 &&
    properties.clearcoat >= 0 &&
    properties.clearcoat <= 1 &&
    properties.clearcoatRoughness >= 0 &&
    properties.clearcoatRoughness <= 1 &&
    properties.ior >= 1.0 &&
    properties.ior <= 3.0 &&
    true
  );
}
