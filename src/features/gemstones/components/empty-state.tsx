/**
 * Empty State Component
 *
 * Displays a friendly, premium message when no results are found.
 * FILTER-C5.5: Enhanced with suggestions and better styling.
 */

"use client";

import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  action?: React.ReactNode;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon = "💎",
  action,
  suggestions,
  onSuggestionClick,
  className = "",
}: EmptyStateProps) {
  const t = useTranslations("catalog.emptyState");
  const prefersReducedMotion = useReducedMotion();

  const displayTitle = title || t("title");
  const displayMessage = message || t("description");

  return (
    <div
      className={`text-center py-16 px-6 ${
        !prefersReducedMotion ? "animate-fade-in" : ""
      } ${className}`}
    >
      {/* Decorative background */}
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl scale-150" />
        <div
          className={`relative text-6xl sm:text-7xl ${
            !prefersReducedMotion ? "animate-pulse-soft" : ""
          }`}
        >
          {icon}
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
        {displayTitle}
      </h3>

      <p className="text-base text-muted-foreground max-w-md mx-auto mb-6">
        {displayMessage}
      </p>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-3">
            Try searching for:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick?.(suggestion)}
                className={`px-4 py-2 text-sm font-medium rounded-full border border-border bg-card hover:bg-muted hover:border-primary/30 ${
                  !prefersReducedMotion
                    ? "transition-all duration-200 hover:scale-105"
                    : ""
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips section */}
      <div className="max-w-sm mx-auto bg-muted/50 rounded-xl p-4 border border-border/50">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">💡 Tip:</span>{" "}
          Try adjusting your filters or using broader search terms to find more
          gemstones.
        </p>
      </div>

      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
