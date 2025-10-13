/**
 * Loading State Component
 *
 * Displays a loading skeleton for gemstone grids.
 */

"use client";

export interface LoadingStateProps {
  count?: number;
  variant?: "grid" | "list";
  className?: string;
}

export function LoadingState({
  count = 8,
  variant = "grid",
  className = "",
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
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          <div className="aspect-square bg-muted animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
