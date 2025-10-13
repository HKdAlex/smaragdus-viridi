import * as THREE from "three";

import { Gemstone } from "@/shared/types";

/**
 * Creates optimized gemstone geometry based on cut type and dimensions
 */
export function createOptimizedGemstoneGeometry(
  gemstone: Gemstone
): THREE.BufferGeometry {
  const { cut, length_mm, width_mm, depth_mm } = gemstone;

  // Scale factors for different cuts (normalize to reasonable 3D space)
  const scaleX = length_mm / 10;
  const scaleY = depth_mm / 10;
  const scaleZ = width_mm / 10;

  switch (cut) {
    case "round":
      return createRoundCutGeometry(scaleX, scaleY, scaleZ);

    case "oval":
      return createOvalCutGeometry(scaleX, scaleY, scaleZ);

    case "emerald":
      return createEmeraldCutGeometry(scaleX, scaleY, scaleZ);

    case "princess":
      return createPrincessCutGeometry(scaleX, scaleY, scaleZ);

    case "cushion":
      return createCushionCutGeometry(scaleX, scaleY, scaleZ);

    case "radiant":
      return createRadiantCutGeometry(scaleX, scaleY, scaleZ);

    case "marquise":
      return createMarquiseCutGeometry(scaleX, scaleY, scaleZ);

    case "pear":
      return createPearCutGeometry(scaleX, scaleY, scaleZ);

    case "heart":
      return createHeartCutGeometry(scaleX, scaleY, scaleZ);

    case "asscher":
      return createAsscherCutGeometry(scaleX, scaleY, scaleZ);

    case "baguette":
      return createBaguetteCutGeometry(scaleX, scaleY, scaleZ);

    case "triangle":
      return createTriangleCutGeometry(scaleX, scaleY, scaleZ);

    case "hexagon":
      return createHexagonCutGeometry(scaleX, scaleY, scaleZ);

    case "cabochon":
      return createCabochonCutGeometry(scaleX, scaleY, scaleZ);

    default:
      // Default to octahedron for fantasy cuts
      return new THREE.OctahedronGeometry(scaleX, 2).scale(
        1,
        scaleY / scaleX,
        scaleZ / scaleX
      );
  }
}

/**
 * Creates a round brilliant cut geometry
 */
function createRoundCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(scaleX, 32, 16);

  // Apply scaling to match gemstone dimensions
  geometry.scale(1, scaleY / scaleX, scaleZ / scaleX);

  // Add facets for more realistic appearance
  const positions = geometry.attributes.position.array as Float32Array;
  const normals = geometry.attributes.normal.array as Float32Array;

  // Enhance facets by adjusting vertex positions
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Create more defined facets
    const facetFactor = 0.95;
    positions[i] = x * facetFactor;
    positions[i + 1] = y * facetFactor;
    positions[i + 2] = z * facetFactor;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates an oval cut geometry
 */
function createOvalCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(scaleX, 32, 16);

  // Stretch to oval shape
  geometry.scale(1, scaleY / scaleX, scaleZ / scaleX);

  // Modify to create more oval-like appearance
  const positions = geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];

    // Create oval shape
    const ovalFactor = Math.sqrt(x * x + z * z);
    if (ovalFactor > 0) {
      positions[i] =
        (x / ovalFactor) * scaleX * Math.cos(Math.atan2(z, x) * 0.8);
      positions[i + 2] =
        (z / ovalFactor) * scaleZ * Math.sin(Math.atan2(z, x) * 0.8);
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates an emerald cut geometry (rectangular with cut corners)
 */
function createEmeraldCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);

  // Add beveled edges
  const positions = geometry.attributes.position.array as Float32Array;
  const normals = geometry.attributes.normal.array as Float32Array;

  // Create beveled corners
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Bevel the corners
    const bevelFactor = 0.1;
    if (Math.abs(x) > scaleX * 0.8 && Math.abs(z) > scaleZ * 0.8) {
      positions[i] = x * (1 - bevelFactor);
      positions[i + 2] = z * (1 - bevelFactor);
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a princess cut geometry (square with pointed corners)
 */
function createPrincessCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);

  // Add pointed corners
  const positions = geometry.attributes.position.array as Float32Array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Create pointed corners
    const pointFactor = 0.2;
    if (Math.abs(x) > scaleX * 0.8 && Math.abs(z) > scaleZ * 0.8) {
      positions[i] = x * (1 + pointFactor);
      positions[i + 2] = z * (1 + pointFactor);
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a cushion cut geometry (rounded square)
 */
function createCushionCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);

  // Round the edges
  const positions = geometry.attributes.position.array as Float32Array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Round the corners
    const roundFactor = 0.3;
    if (Math.abs(x) > scaleX * 0.7 && Math.abs(z) > scaleZ * 0.7) {
      const cornerX = x / scaleX;
      const cornerZ = z / scaleZ;
      const distance = Math.sqrt(cornerX * cornerX + cornerZ * cornerZ);

      if (distance > 0.7) {
        positions[i] = (cornerX / distance) * scaleX * 0.7;
        positions[i + 2] = (cornerZ / distance) * scaleZ * 0.7;
      }
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a radiant cut geometry (rectangular with cut corners)
 */
function createRadiantCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);

  // Similar to emerald but with different proportions
  const positions = geometry.attributes.position.array as Float32Array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Cut corners more aggressively
    const cutFactor = 0.15;
    if (Math.abs(x) > scaleX * 0.85 && Math.abs(z) > scaleZ * 0.85) {
      positions[i] = x * (1 - cutFactor);
      positions[i + 2] = z * (1 - cutFactor);
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a marquise cut geometry (football/eye shape)
 */
function createMarquiseCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const segments = 32;
  const vertices: number[] = [];
  const indices: number[] = [];

  // Create marquise shape
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const radius = scaleX * Math.cos(angle * 0.5); // Creates marquise shape

    // Top vertices
    vertices.push(
      radius * Math.cos(angle),
      scaleY,
      radius * Math.sin(angle) * (scaleZ / scaleX)
    );

    // Bottom vertices
    vertices.push(
      radius * Math.cos(angle),
      -scaleY,
      radius * Math.sin(angle) * (scaleZ / scaleX)
    );
  }

  // Create faces
  for (let i = 0; i < segments; i++) {
    const top1 = i * 2;
    const top2 = (i + 1) * 2;
    const bottom1 = i * 2 + 1;
    const bottom2 = (i + 1) * 2 + 1;

    // Top face
    indices.push(top1, top2, 0);

    // Bottom face
    indices.push(bottom1, 1, bottom2);

    // Side faces
    indices.push(top1, bottom1, top2);
    indices.push(top2, bottom1, bottom2);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a pear cut geometry (teardrop shape)
 */
function createPearCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const segments = 32;
  const vertices: number[] = [];
  const indices: number[] = [];

  // Create pear shape
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    let radius = scaleX;

    // Create pear shape (wider at bottom, pointed at top)
    if (i < segments / 2) {
      radius = scaleX * (0.3 + 0.7 * (i / (segments / 2)));
    } else {
      radius = scaleX * (1.0 - 0.3 * ((i - segments / 2) / (segments / 2)));
    }

    // Top vertices
    vertices.push(
      radius * Math.cos(angle),
      scaleY,
      radius * Math.sin(angle) * (scaleZ / scaleX)
    );

    // Bottom vertices
    vertices.push(
      radius * Math.cos(angle),
      -scaleY,
      radius * Math.sin(angle) * (scaleZ / scaleX)
    );
  }

  // Create faces (similar to marquise)
  for (let i = 0; i < segments; i++) {
    const top1 = i * 2;
    const top2 = (i + 1) * 2;
    const bottom1 = i * 2 + 1;
    const bottom2 = (i + 1) * 2 + 1;

    // Top face
    indices.push(top1, top2, 0);

    // Bottom face
    indices.push(bottom1, 1, bottom2);

    // Side faces
    indices.push(top1, bottom1, top2);
    indices.push(top2, bottom1, bottom2);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a heart cut geometry
 */
function createHeartCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const vertices: number[] = [];
  const indices: number[] = [];

  // Create heart shape vertices
  const heartPoints = [
    [0, scaleY, 0], // Top point
    [-scaleX * 0.5, scaleY * 0.7, 0], // Left curve
    [scaleX * 0.5, scaleY * 0.7, 0], // Right curve
    [-scaleX * 0.8, 0, 0], // Left side
    [scaleX * 0.8, 0, 0], // Right side
    [0, -scaleY * 0.3, 0], // Middle bottom
    [0, -scaleY, 0], // Bottom point
  ];

  // Add vertices for top and bottom
  heartPoints.forEach(([x, y, z]) => {
    vertices.push(x, y, z); // Top
    vertices.push(x, -y, z); // Bottom
  });

  // Create faces
  const numPoints = heartPoints.length;
  for (let i = 0; i < numPoints - 1; i++) {
    const top1 = i * 2;
    const top2 = (i + 1) * 2;
    const bottom1 = i * 2 + 1;
    const bottom2 = (i + 1) * 2 + 1;

    // Top face
    indices.push(top1, top2, 0);

    // Bottom face
    indices.push(bottom1, 1, bottom2);

    // Side faces
    indices.push(top1, bottom1, top2);
    indices.push(top2, bottom1, bottom2);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates an Asscher cut geometry (square with cut corners)
 */
function createAsscherCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);

  // Similar to emerald but square
  const positions = geometry.attributes.position.array as Float32Array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Cut corners
    const cutFactor = 0.2;
    if (Math.abs(x) > scaleX * 0.8 && Math.abs(z) > scaleZ * 0.8) {
      positions[i] = x * (1 - cutFactor);
      positions[i + 2] = z * (1 - cutFactor);
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a baguette cut geometry (rectangular)
 */
function createBaguetteCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  // Simple rectangular geometry
  return new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
}

/**
 * Creates a triangle cut geometry
 */
function createTriangleCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.ConeGeometry(scaleX, scaleY, 3);
  geometry.scale(1, 1, scaleZ / scaleX);
  return geometry;
}

/**
 * Creates a hexagon cut geometry
 */
function createHexagonCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.ConeGeometry(scaleX, scaleY, 6);
  geometry.scale(1, 1, scaleZ / scaleX);
  return geometry;
}

/**
 * Creates a cabochon cut geometry (dome-shaped)
 */
function createCabochonCutGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(
    scaleX,
    32,
    16,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  geometry.scale(1, scaleY / scaleX, scaleZ / scaleX);
  return geometry;
}

/**
 * Validates gemstone dimensions
 */
export function validateGemstoneDimensions(gemstone: Gemstone): boolean {
  const { length_mm, width_mm, depth_mm, weight_carats } = gemstone;

  return (
    length_mm > 0 &&
    width_mm > 0 &&
    depth_mm > 0 &&
    weight_carats > 0 &&
    length_mm <= 100 && // Reasonable maximum
    width_mm <= 100 &&
    depth_mm <= 100 &&
    weight_carats <= 1000 // Reasonable maximum
  );
}

/**
 * Calculates optimal geometry detail level based on gemstone size
 */
export function calculateOptimalDetailLevel(gemstone: Gemstone): number {
  const { length_mm, width_mm, depth_mm } = gemstone;
  const maxDimension = Math.max(length_mm, width_mm, depth_mm);

  if (maxDimension < 5) return 8; // Low detail for small stones
  if (maxDimension < 10) return 16; // Medium detail
  if (maxDimension < 20) return 32; // High detail
  return 64; // Ultra detail for large stones
}
