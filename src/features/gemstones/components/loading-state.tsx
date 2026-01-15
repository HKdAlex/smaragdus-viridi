/**
 * Loading State Component
 *
 * Displays a premium loading skeleton for gemstone grids.
 * FILTER-C5.5: Enhanced with better shimmer and staggered animations.
 */

"use client";

import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";

export interface LoadingStateProps {
  count?: number;
  variant?: "grid" | "list";
  className?: string;
  showHeader?: boolean;
}

export function LoadingState({
  count = 8,
  variant = "grid",
  className = "",
  showHeader = true,
}: LoadingStateProps) {
  const prefersReducedMotion = useReducedMotion();

  if (variant === "list") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-muted rounded-xl animate-pulse"
            style={
              !prefersReducedMotion
                ? { animationDelay: `${i * 100}ms` }
                : undefined
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {showHeader && (
        <div className="text-center px-4">
          <div className="h-10 sm:h-12 bg-muted rounded-xl mx-auto w-2/3 sm:w-1/2 animate-pulse" />
          <div className="mt-3 h-4 sm:h-5 bg-muted/80 rounded-lg mx-auto w-11/12 sm:w-2/3 animate-pulse" />
        </div>
      )}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="group relative bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
            style={
              !prefersReducedMotion
                ? {
                    animationDelay: `${Math.min(i * 50, 400)}ms`,
                    animationFillMode: "backwards",
                  }
                : undefined
            }
          >
            {/* Image Container Skeleton */}
            <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
              {/* Premium shimmer effect */}
              {!prefersReducedMotion && (
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent" />
              )}

              {/* Centered gemstone icon placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground/30"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2l4.75 4.75L10 18l-4.75-11.25L10 2zm0 3.25l-2.25 2.25L10 14.5l2.25-7L10 5.25z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card Content Skeleton */}
            <div className="p-4 space-y-4">
              {/* Title Skeleton */}
              <div className="space-y-2">
                <div className="h-5 bg-muted rounded-lg animate-pulse w-3/4" />
                <div className="h-4 bg-muted/70 rounded-lg animate-pulse w-1/2" />
              </div>

              {/* Properties Grid Skeleton */}
              <div className="space-y-3">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-muted rounded-full animate-pulse flex-shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <div className="h-4 bg-muted/70 rounded animate-pulse w-16" />
                      <div className="h-4 bg-muted rounded animate-pulse w-20" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Price Skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-6 bg-primary/20 rounded-lg animate-pulse w-24" />
                <div className="h-5 bg-muted rounded-lg animate-pulse w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
