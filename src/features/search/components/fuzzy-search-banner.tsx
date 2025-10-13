/**
 * Fuzzy Search Banner Component
 *
 * Displays "Did you mean?" suggestions when fuzzy search is used
 */

"use client";

import { AlertCircle, Search } from "lucide-react";

import { useTranslations } from "next-intl";

export interface FuzzySuggestion {
  suggestion: string;
  score: number;
  type: string;
}

interface FuzzySearchBannerProps {
  originalQuery: string;
  suggestions: FuzzySuggestion[];
  onSuggestionClick: (suggestion: string) => void;
}

export function FuzzySearchBanner({
  originalQuery,
  suggestions,
  onSuggestionClick,
}: FuzzySearchBannerProps) {
  const t = useTranslations("search");

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const topSuggestion = suggestions[0];

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />

        <div className="flex-1">
          <div className="mb-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {t("fuzzySearch.noExactMatches")}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t("fuzzySearch.showingSimilar")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-amber-700 dark:text-amber-300">
              {t("fuzzySearch.didYouMean")}
            </span>

            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={`${suggestion.suggestion}-${index}`}
                onClick={() => onSuggestionClick(suggestion.suggestion)}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-sm font-medium text-amber-900 shadow-sm transition-colors hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
              >
                <Search className="h-3.5 w-3.5" />
                <span>{suggestion.suggestion}</span>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  ({suggestion.type})
                </span>
              </button>
            ))}
          </div>

          {suggestions.length > 3 && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {t("fuzzySearch.andMore", { count: suggestions.length - 3 })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
