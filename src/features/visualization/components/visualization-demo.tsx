"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Gemstone } from "@/shared/types";
import { Lazy3DVisualizer } from "./lazy-3d-visualizer";
import { useState } from "react";

interface VisualizationDemoProps {
  gemstone: Gemstone;
  className?: string;
}

export function VisualizationDemo({
  gemstone,
  className = "",
}: VisualizationDemoProps) {
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);

  const handleDownload = () => {
    setDownloadCount((prev) => prev + 1);
    console.log(`Downloaded 3D view of ${gemstone.serial_number}`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Gemstone Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {gemstone.name} - {gemstone.serial_number}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {gemstone.cut}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {gemstone.color}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Weight:</span>
              <span className="ml-2 font-medium">
                {gemstone.weight_carats}ct
              </span>
            </div>
            <div>
              <span className="text-gray-600">Clarity:</span>
              <span className="ml-2 font-medium">{gemstone.clarity}</span>
            </div>
            <div>
              <span className="text-gray-600">Dimensions:</span>
              <span className="ml-2 font-medium">
                {(() => {
                  // Extract dimensions from AI content or use database values
                  const technicalDescription =
                    (gemstone as any).technical_description_en ||
                    (gemstone as any).technical_description_ru;

                  if (technicalDescription) {
                    // Look for dimension patterns like "11 × 11.7 × 6.8 mm" or "11 x 11.7 x 6.8 mm"
                    const dimensionMatch = technicalDescription.match(
                      /(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm/i
                    );
                    if (dimensionMatch) {
                      return `${dimensionMatch[1]}×${dimensionMatch[2]}×${dimensionMatch[3]}mm`;
                    }
                  }

                  // Fallback to database values
                  return `${gemstone.length_mm}×${gemstone.width_mm}×${gemstone.depth_mm}mm`;
                })()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Price:</span>
              <span className="ml-2 font-medium">
                ${(gemstone.price_amount / 100).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button
              onClick={() => setShowVisualizer(!showVisualizer)}
              variant={showVisualizer ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              {showVisualizer ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide 3D View
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  View in 3D
                </>
              )}
            </Button>

            {downloadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                Downloaded {downloadCount} time{downloadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3D Visualizer */}
      {showVisualizer && (
        <Lazy3DVisualizer
          gemstone={gemstone}
          onDownload={handleDownload}
          className="w-full"
        />
      )}
    </div>
  );
}
