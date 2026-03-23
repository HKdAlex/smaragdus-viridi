/**
 * Search Input Component with Autocomplete
 *
 * Features:
 * - Real-time autocomplete suggestions
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Debounced API calls (300ms)
 * - Loading states
 * - Category-based suggestions
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useSearchSuggestionsQuery } from "../hooks/use-search-suggestions-query";
import { useTypeSafeRouter } from "@/lib/navigation/type-safe-router";

export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  defaultValue?: string;
}

export function SearchInput({
  placeholder,
  className = "",
  onSearch,
  autoFocus = false,
  showSuggestions = true,
  defaultValue = "",
}: SearchInputProps) {
  const t = useTranslations("search");
  const router = useTypeSafeRouter();
  const locale = useLocale();

  const [query, setQuery] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch suggestions with current locale
  const { data, isLoading } = useSearchSuggestionsQuery(debouncedQuery, {
    enabled: showSuggestions && debouncedQuery.length >= 2,
    locale,
  });

  const suggestions = data?.suggestions || [];

  // Show dropdown when we have suggestions
  useEffect(() => {
    setShowDropdown(suggestions.length > 0 && query.length >= 2);
  }, [suggestions, query]);

  // Handle search submission
  const handleSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      setShowDropdown(false);

      if (onSearch) {
        onSearch(trimmed);
      } else {
        // Navigate to search results page
        router.pushDynamic(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [onSearch, router]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      handleSearch(suggestion);
    },
    [handleSearch]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown) {
        if (e.key === "Enter") {
          handleSearch(query);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex].suggestion);
          } else {
            handleSearch(query);
          }
          break;

        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          setShowDropdown(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [
      showDropdown,
      query,
      suggestions,
      selectedIndex,
      handleSearch,
      handleSelectSuggestion,
    ]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Category badge styling
  const getCategoryBadge = (category: string) => {
    const badges = {
      serial_number: {
        label: t("serialNumber"),
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      type: {
        label: t("type"),
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      color: {
        label: t("color"),
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      cut: {
        label: t("cut"),
        color:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      },
      clarity: {
        label: t("clarity"),
        color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      },
    };
    return badges[category as keyof typeof badges] || badges.type;
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Premium Search Input */}
      <div className="relative group">
        {/* Subtle glow effect on focus */}
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-sm transition-opacity duration-300 ${
            isFocused ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="relative flex items-center">
          {/* Search Icon - Always visible on left */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-colors duration-200 ${
                isFocused ? "text-primary" : "text-muted-foreground"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (suggestions.length > 0 && query.length >= 2) {
                setShowDropdown(true);
              }
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            placeholder={placeholder || t("placeholder")}
            autoFocus={autoFocus}
            className="w-full pl-12 pr-12 py-4 text-base bg-background border-2 border-border/50 rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-0 transition-all duration-200 placeholder:text-muted-foreground/60 shadow-sm hover:shadow-md focus:shadow-lg"
          />

          {/* Clear Button - Shown when has text */}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Search Button - Shown when no text */}
          {!query && (
            <button
              onClick={() => handleSearch(query)}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label={t("search")}
            >
              {t("search")}
            </button>
          )}
        </div>
      </div>

      {/* Premium Autocomplete Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-background border border-border/50 rounded-2xl shadow-xl max-h-96 overflow-y-auto backdrop-blur-sm"
        >
          {isLoading ? (
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                {t("loading")}
              </span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-5 py-4 text-sm text-muted-foreground text-center">
              {t("noSuggestions")}
            </div>
          ) : (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => {
                const badge = getCategoryBadge(suggestion.category);
                const isSelected = index === selectedIndex;

                return (
                  <li key={`${suggestion.suggestion}-${index}`}>
                    <button
                      onClick={() =>
                        handleSelectSuggestion(suggestion.suggestion)
                      }
                      className={`w-full px-5 py-3 text-left flex items-center justify-between gap-3 transition-all duration-150 ${
                        isSelected
                          ? "bg-primary/5 border-l-2 border-primary"
                          : "hover:bg-muted/50 border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-primary/10" : "bg-muted/50"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <span
                          className={`text-sm truncate ${
                            isSelected
                              ? "text-foreground font-medium"
                              : "text-foreground/80"
                          }`}
                        >
                          {suggestion.suggestion}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0 ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Keyboard hint */}
          <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  ↵
                </kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                esc
              </kbd>
              close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
