"use client";

import * as THREE from "three";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Download, Pause, Play, RotateCcw, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Gemstone } from "@/shared/types";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Stone3DVisualizerProps {
  gemstone: Gemstone;
  className?: string;
  onDownload?: () => void;
}

type LightingMode = "studio" | "natural" | "dramatic" | "custom";
type ViewMode = "front" | "side" | "top" | "free";

export function Stone3DVisualizer({
  gemstone,
  className = "",
  onDownload,
}: Stone3DVisualizerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [lightingMode, setLightingMode] = useState<LightingMode>("studio");
  const [viewMode, setViewMode] = useState<ViewMode>("free");
  const [showControls, setShowControls] = useState(false);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const gemstoneMeshRef = useRef<THREE.Mesh | null>(null);

  // Memoize gemstone geometry based on cut and dimensions
  const gemstoneGeometry = useMemo(() => {
    return createGemstoneGeometry(gemstone);
  }, [gemstone.cut, gemstone.length_mm, gemstone.width_mm, gemstone.depth_mm]);

  // Memoize gemstone material based on color and properties
  const gemstoneMaterial = useMemo(() => {
    return createGemstoneMaterial(gemstone, lightingMode);
  }, [gemstone.color, gemstone.clarity, lightingMode]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 15);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Clear existing content
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // Create gemstone mesh
    const gemstoneMesh = new THREE.Mesh(gemstoneGeometry, gemstoneMaterial);
    gemstoneMesh.castShadow = true;
    gemstoneMesh.receiveShadow = true;
    scene.add(gemstoneMesh);

    // Setup lighting
    setupLighting(scene, lightingMode);

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 2.0;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;
    gemstoneMeshRef.current = gemstoneMesh;

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener("resize", handleResize);

      // Cleanup Three.js objects
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      controls.dispose();
      renderer.dispose();

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gemstoneGeometry, gemstoneMaterial, isAutoRotating]);

  // Update lighting when mode changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing lights
    const lightsToRemove = sceneRef.current.children.filter(
      (child) => child instanceof THREE.Light
    );
    lightsToRemove.forEach((light) => sceneRef.current!.remove(light));

    // Add new lighting
    setupLighting(sceneRef.current, lightingMode);
  }, [lightingMode]);

  // Update auto-rotation
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // View mode controls
  const setView = useCallback((mode: ViewMode) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (mode) {
      case "front":
        camera.position.set(0, 0, 15);
        controls.target.set(0, 0, 0);
        break;
      case "side":
        camera.position.set(15, 0, 0);
        controls.target.set(0, 0, 0);
        break;
      case "top":
        camera.position.set(0, 15, 0);
        controls.target.set(0, 0, 0);
        break;
      case "free":
        camera.position.set(0, 5, 15);
        controls.target.set(0, 0, 0);
        break;
    }

    controls.update();
    setViewMode(mode);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setView("free");
    setIsAutoRotating(true);
  }, [setView]);

  // Download screenshot
  const handleDownload = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Temporarily disable auto-rotation for screenshot
    const wasAutoRotating = controlsRef.current?.autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }

    // Render frame
    renderer.render(scene, camera);

    // Capture screenshot
    const dataURL = renderer.domElement.toDataURL("image/png");

    // Create download link
    const link = document.createElement("a");
    link.download = `${gemstone.serial_number}-3d-view.png`;
    link.href = dataURL;
    link.click();

    // Restore auto-rotation
    if (controlsRef.current && wasAutoRotating) {
      controlsRef.current.autoRotate = true;
    }

    onDownload?.();
  }, [gemstone.serial_number, onDownload]);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            3D Stone Visualizer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {gemstone.serial_number}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(!showControls)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 3D Viewport */}
        <div className="relative">
          <div
            ref={mountRef}
            className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden"
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading 3D visualizer...</p>
              </div>
            </div>
          )}

          {/* Overlay Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className="bg-white/90 backdrop-blur-sm"
            >
              {isAutoRotating ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={resetView}
              className="bg-white/90 backdrop-blur-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Download Button */}
          <div className="absolute top-4 right-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="bg-white/90 backdrop-blur-sm"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        {showControls && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* View Controls */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">View</h4>
              <div className="flex gap-1">
                {(["front", "side", "top", "free"] as ViewMode[]).map(
                  (mode) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setView(mode)}
                      className="text-xs capitalize"
                    >
                      {mode}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Lighting Controls */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lighting</h4>
              <div className="flex gap-1">
                {(["studio", "natural", "dramatic"] as LightingMode[]).map(
                  (mode) => (
                    <Button
                      key={mode}
                      variant={lightingMode === mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLightingMode(mode)}
                      className="text-xs capitalize"
                    >
                      {mode}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stone Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Cut:</span>
            <span className="ml-2 font-medium capitalize">{gemstone.cut}</span>
          </div>
          <div>
            <span className="text-gray-600">Color:</span>
            <span className="ml-2 font-medium capitalize">
              {gemstone.color}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Weight:</span>
            <span className="ml-2 font-medium">{gemstone.weight_carats}ct</span>
          </div>
          <div>
            <span className="text-gray-600">Dimensions:</span>
            <span className="ml-2 font-medium">
              {gemstone.length_mm}×{gemstone.width_mm}×{gemstone.depth_mm}mm
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to create gemstone geometry based on cut
function createGemstoneGeometry(gemstone: Gemstone): THREE.BufferGeometry {
  const { cut, length_mm, width_mm, depth_mm } = gemstone;

  // Scale factors for different cuts
  const scaleX = length_mm / 10;
  const scaleY = depth_mm / 10;
  const scaleZ = width_mm / 10;

  switch (cut) {
    case "round":
      return new THREE.SphereGeometry(scaleX, 32, 16).scale(
        1,
        scaleY / scaleX,
        1
      );

    case "oval":
      return new THREE.SphereGeometry(scaleX, 32, 16).scale(
        1,
        scaleY / scaleX,
        scaleZ / scaleX
      );

    case "emerald":
    case "princess":
    case "cushion":
    case "radiant":
      return new THREE.BoxGeometry(scaleX, scaleY, scaleZ);

    case "marquise":
    case "pear":
      // Create custom geometry for these cuts
      return createCustomCutGeometry(cut, scaleX, scaleY, scaleZ);

    case "heart":
      return createHeartGeometry(scaleX, scaleY, scaleZ);

    default:
      // Default to octahedron for fantasy cuts
      return new THREE.OctahedronGeometry(scaleX).scale(
        1,
        scaleY / scaleX,
        scaleZ / scaleX
      );
  }
}

// Create custom geometry for complex cuts
function createCustomCutGeometry(
  cut: string,
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Simplified geometry for marquise and pear cuts
  const vertices = new Float32Array([
    // Top vertices
    0,
    scaleY,
    0,
    -scaleX * 0.8,
    0,
    0,
    scaleX * 0.8,
    0,
    0,
    0,
    0,
    -scaleZ * 0.8,
    0,
    0,
    scaleZ * 0.8,

    // Bottom vertices
    0,
    -scaleY,
    0,
    -scaleX * 0.6,
    0,
    0,
    scaleX * 0.6,
    0,
    0,
    0,
    0,
    -scaleZ * 0.6,
    0,
    0,
    scaleZ * 0.6,
  ]);

  const indices = new Uint16Array([
    // Top faces
    0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1,

    // Side faces
    1, 6, 2, 2, 7, 3, 3, 8, 4, 4, 9, 1,

    // Bottom faces
    5, 2, 1, 5, 3, 2, 5, 4, 3, 5, 1, 4,
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  return geometry;
}

// Create heart-shaped geometry
function createHeartGeometry(
  scaleX: number,
  scaleY: number,
  scaleZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Simplified heart shape
  const vertices = new Float32Array([
    // Heart top
    0,
    scaleY,
    0,
    -scaleX * 0.5,
    scaleY * 0.7,
    0,
    scaleX * 0.5,
    scaleY * 0.7,
    0,

    // Heart middle
    -scaleX * 0.8,
    0,
    0,
    scaleX * 0.8,
    0,
    0,
    0,
    -scaleY * 0.3,
    0,

    // Heart bottom
    0,
    -scaleY,
    0,
  ]);

  const indices = new Uint16Array([
    0, 1, 2, 1, 3, 6, 2, 6, 4, 3, 5, 6, 4, 6, 5,
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  return geometry;
}

// Create gemstone material based on color and properties
function createGemstoneMaterial(
  gemstone: Gemstone,
  lightingMode: LightingMode
): THREE.Material {
  const color = getGemstoneColor(gemstone.color);
  const opacity = getClarityOpacity(gemstone.clarity);

  const material = new THREE.MeshPhysicalMaterial({
    color: color,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    transparent: true,
    opacity: opacity,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    ior: 2.4, // Diamond-like refractive index
    reflectivity: 0.9,
    envMapIntensity: lightingMode === "dramatic" ? 2.0 : 1.0,
  });

  return material;
}

// Get gemstone color as hex value
function getGemstoneColor(color: string): number {
  const colorMap: Record<string, number> = {
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
  };

  return colorMap[color] || 0xffffff;
}

// Get opacity based on clarity
function getClarityOpacity(clarity: string): number {
  const clarityMap: Record<string, number> = {
    FL: 0.95, // Flawless
    IF: 0.93, // Internally Flawless
    VVS1: 0.9,
    VVS2: 0.88,
    VS1: 0.85,
    VS2: 0.82,
    SI1: 0.78,
    SI2: 0.75,
    I1: 0.7,
  };

  return clarityMap[clarity] || 0.85;
}

// Setup lighting for the scene
function setupLighting(scene: THREE.Scene, mode: LightingMode): void {
  // Clear existing lights
  const lightsToRemove = scene.children.filter(
    (child) => child instanceof THREE.Light
  );
  lightsToRemove.forEach((light) => scene.remove(light));

  switch (mode) {
    case "studio":
      // Professional studio lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
      keyLight.position.set(10, 10, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-10, 5, -5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
      rimLight.position.set(0, -5, -10);
      scene.add(rimLight);
      break;

    case "natural":
      // Natural daylight
      const naturalAmbient = new THREE.AmbientLight(0x87ceeb, 0.6);
      scene.add(naturalAmbient);

      const sunLight = new THREE.DirectionalLight(0xfff8dc, 0.8);
      sunLight.position.set(5, 15, 5);
      scene.add(sunLight);
      break;

    case "dramatic":
      // Dramatic lighting for maximum sparkle
      const dramaticAmbient = new THREE.AmbientLight(0x202020, 0.2);
      scene.add(dramaticAmbient);

      const spotLight1 = new THREE.SpotLight(0xffffff, 1.5);
      spotLight1.position.set(10, 10, 10);
      spotLight1.angle = Math.PI / 6;
      spotLight1.penumbra = 0.1;
      scene.add(spotLight1);

      const spotLight2 = new THREE.SpotLight(0xffffff, 1.0);
      spotLight2.position.set(-10, 5, -10);
      spotLight2.angle = Math.PI / 4;
      spotLight2.penumbra = 0.2;
      scene.add(spotLight2);

      const pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
      pointLight.position.set(0, 20, 0);
      scene.add(pointLight);
      break;
  }
}
