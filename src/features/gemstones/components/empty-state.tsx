/**
 * Empty State Component
 *
 * Displays a friendly message when no results are found.
 */

"use client";

import { useTranslations } from "next-intl";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon = "💎",
  action,
  className = "",
}: EmptyStateProps) {
  const t = useTranslations("catalog.emptyState");

  const displayTitle = title || t("title");
  const displayMessage = message || t("description");
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="text-4xl sm:text-6xl text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
        {displayTitle}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
        {displayMessage}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
