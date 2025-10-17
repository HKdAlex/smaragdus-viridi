/**
 * Loading State Component
 *
 * Displays a loading skeleton for gemstone grids that matches the card structure.
 */

"use client";

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
  if (variant === "list") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {showHeader && (
        <div className="text-center px-4">
          <div className="h-10 sm:h-12 bg-gray-200 dark:bg-gray-800 rounded-lg mx-auto w-2/3 sm:w-1/2 animate-pulse" />
          <div className="mt-3 h-4 sm:h-5 bg-gray-100 dark:bg-gray-800/80 rounded mx-auto w-11/12 sm:w-2/3 animate-pulse" />
        </div>
      )}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200"
          >
            {/* Stock Status Badge Skeleton */}
            <div className="absolute top-3 left-3 z-10">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </div>

            {/* Image Container Skeleton */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Centered gemstone icon placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-300 dark:text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2l4.75 4.75L10 18l-4.75-11.25L10 2zm0 3.25l-2.25 2.25L10 14.5l2.25-7L10 5.25z" />
                </svg>
              </div>

              {/* SKU Badge Skeleton */}
              <div className="absolute bottom-3 right-3">
                <div className="h-6 w-32 bg-gray-800/60 dark:bg-gray-900/60 rounded animate-pulse" />
              </div>
            </div>

            {/* Card Content Skeleton */}
            <div className="p-4 space-y-3">
              {/* Title Skeleton */}
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />

              {/* Properties Grid Skeleton */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
                </div>
              </div>

              {/* Weight Skeleton */}
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />

              {/* Clarity Skeleton */}
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40" />

              {/* Divider */}
              <div className="h-px bg-gray-200 dark:bg-gray-700" />

              {/* Price and Date Skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12" />
              </div>

              {/* Promo Text Skeleton */}
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
