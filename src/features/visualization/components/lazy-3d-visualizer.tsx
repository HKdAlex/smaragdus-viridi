"use client";

import { Suspense, lazy } from "react";

import { Gemstone } from "@/shared/types";

// Lazy load the heavy 3D component
const Stone3DVisualizer = lazy(() =>
  import("./stone-3d-visualizer").then((module) => ({
    default: module.Stone3DVisualizer,
  }))
);

interface Lazy3DVisualizerProps {
  gemstone: Gemstone;
  className?: string;
  onDownload?: () => void;
}

export function Lazy3DVisualizer(props: Lazy3DVisualizerProps) {
  return (
    <Suspense fallback={<Visualizer3DLoading />}>
      <Stone3DVisualizer {...props} />
    </Suspense>
  );
}

function Visualizer3DLoading() {
  return (
    <div className="space-y-4">
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading 3D visualizer...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a moment on slower devices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
