/**
 * Blur Placeholder Component - Phase 6
 *
 * Provides smooth image loading with blur-to-sharp transition.
 * Improves perceived performance for gemstone images.
 */

"use client";

import { useState } from "react";

interface BlurPlaceholderProps {
  src: string;
  alt: string;
  className?: string;
  blurDataURL?: string;
  priority?: boolean;
}

/**
 * Image component with blur placeholder for smooth loading
 * Shows blurred version first, then sharpens when loaded
 */
export function BlurPlaceholder({
  src,
  alt,
  className = "",
  blurDataURL,
  priority = false,
}: BlurPlaceholderProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setLoaded(true); // Show error state
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Blur placeholder - shows while image loads */}
      {blurDataURL && !loaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 opacity-60"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
      />

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-8 w-8 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {!loaded && !blurDataURL && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </div>
  );
}

/**
 * Hook to generate blur placeholder data URL from image
 * This could be enhanced to generate actual blur data URLs
 */
export function useBlurPlaceholder(imageUrl: string): string | undefined {
  // For now, return undefined - blurDataURL should be provided by parent
  // In the future, this could generate blur placeholders on the client side
  // or fetch them from a service that pre-generates them
  return undefined;
}
