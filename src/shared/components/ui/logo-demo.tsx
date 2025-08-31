"use client";

import { useState } from "react";
import { Button } from "./button";
import { Logo } from "./logo";

export function LogoDemo() {
  const [showEnhancedContrast, setShowEnhancedContrast] = useState(true);

  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Logo Contrast Demo</h2>
        <p className="text-muted-foreground mb-6">
          Compare the logo appearance with enhanced contrast settings
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          variant={showEnhancedContrast ? "default" : "outline"}
          onClick={() => setShowEnhancedContrast(!showEnhancedContrast)}
        >
          {showEnhancedContrast
            ? "Enhanced Contrast: ON"
            : "Enhanced Contrast: OFF"}
        </Button>
      </div>

      {/* Logo Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Inline Logo */}
        <div className="text-center p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Inline Logo</h3>
          <div className="flex justify-center mb-4">
            <Logo
              variant="inline"
              size="xxxl"
              showText={false}
              enhancedContrast={showEnhancedContrast}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Using original logo with CSS filters
          </p>
        </div>

        {/* Block Logo */}
        <div className="text-center p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Block Logo</h3>
          <div className="flex justify-center mb-4">
            <Logo
              variant="block"
              size="xxxl"
              showText={false}
              enhancedContrast={showEnhancedContrast}
            />
          </div>
          <p className="text-sm text-muted-foreground">Block variant logo</p>
        </div>

        {/* Small Logo */}
        <div className="text-center p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Small Logo</h3>
          <div className="flex justify-center mb-4">
            <Logo
              variant="inline"
              size="lg"
              showText={false}
              enhancedContrast={showEnhancedContrast}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Small size for navigation
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center p-6 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>Enhanced Contrast:</strong> Applies CSS filters in light
            mode for better visibility
          </li>
          <li>
            • <strong>CSS Filters:</strong> Uses contrast(1.5) brightness(0.1)
            saturate(1.5) for maximum visibility
          </li>
          <li>
            • <strong>Dark Mode:</strong> No filters applied - logos display
            naturally
          </li>
          <li>
            • <strong>Responsive:</strong> Automatically adjusts based on theme
            context
          </li>
        </ul>
      </div>
    </div>
  );
}
