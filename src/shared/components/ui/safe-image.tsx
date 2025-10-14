"use client";

import Image from "next/image";
import { useState } from "react";

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fallbackSrc?: string;
  onError?: (error: string) => void;
}

/**
 * SafeImage component that gracefully handles broken image URLs
 * Provides automatic fallbacks and error reporting
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes,
  fallbackSrc,
  onError,
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Default gemstone placeholder - a solid color representing a gem
  // Use URL encoding instead of btoa to avoid Unicode encoding issues
  const svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <rect width="60%" height="60%" x="20%" y="20%" fill="#e5e7eb" rx="10"/>
    <circle cx="50%" cy="50%" r="15%" fill="#d1d5db"/>
  </svg>`;
  const defaultFallback = `data:image/svg+xml,${encodeURIComponent(svgString)}`;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const errorMessage = `Failed to load image: ${currentSrc}`;

      // Try fallback if provided
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        onError?.(errorMessage);
        return;
      }

      // Use default placeholder
      setCurrentSrc(defaultFallback);
      onError?.(errorMessage);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={currentSrc === defaultFallback} // Don't optimize data URLs
      />

      {/* Loading placeholder */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400 text-center">
            <div className="text-2xl mb-1">💎</div>
            <div className="text-xs">Loading...</div>
          </div>
        </div>
      )}

      {/* Error indicator for development */}
      {hasError && process.env.NODE_ENV === "development" && (
        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
          ⚠
        </div>
      )}
    </div>
  );
}
