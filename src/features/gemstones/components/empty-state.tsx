/**
 * Empty State Component
 *
 * Displays a friendly message when no results are found.
 */

"use client";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No gemstones found",
  message = "Try adjusting your filters to see more results",
  icon = "💎",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="text-4xl sm:text-6xl text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
