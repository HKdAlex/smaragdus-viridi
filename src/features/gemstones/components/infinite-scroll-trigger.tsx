/**
 * Infinite Scroll Trigger Component
 *
 * Detects when user scrolls near bottom of page and triggers loading more items.
 * Shows loading state and "no more items" message.
 */

"use client";

import { useEffect, useRef } from "react";

import { useIntersectionObserver } from "../hooks/use-intersection-observer";
import { useTranslations } from "next-intl";

export interface InfiniteScrollTriggerProps {
  /** Callback when user scrolls to trigger point */
  onIntersect: () => void;

  /** Whether currently fetching more items */
  isFetching: boolean;

  /** Whether there are more items to load */
  hasMore: boolean;

  /** Custom loading message (optional) */
  loadingMessage?: string;

  /** Custom "no more items" message (optional) */
  endMessage?: string;
}

/**
 * Component that triggers loading more items when scrolled into view
 */
export function InfiniteScrollTrigger({
  onIntersect,
  isFetching,
  hasMore,
  loadingMessage,
  endMessage,
}: InfiniteScrollTriggerProps) {
  const t = useTranslations("catalog");

  // Track if we've already triggered for the current intersection
  const hasTriggeredRef = useRef(false);
  // Track the last fetch timestamp to prevent rapid calls
  const lastFetchTimeRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 500; // 500ms minimum between fetches

  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "50px", // Reduced for more conservative triggering
    enabled: hasMore && !isFetching,
  });

  // Trigger load when element enters viewport (with debouncing)
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    if (
      isIntersecting &&
      hasMore &&
      !isFetching &&
      !hasTriggeredRef.current &&
      timeSinceLastFetch > DEBOUNCE_DELAY
    ) {
      hasTriggeredRef.current = true;
      lastFetchTimeRef.current = now;
      onIntersect();
    }

    // Reset trigger when we're no longer intersecting
    if (!isIntersecting) {
      hasTriggeredRef.current = false;
    }

    // Reset trigger when fetching completes
    if (!isFetching && hasTriggeredRef.current) {
      // Wait a bit before allowing next trigger
      const timer = setTimeout(() => {
        hasTriggeredRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isIntersecting, hasMore, isFetching, onIntersect]);

  return (
    <div ref={ref} className="py-12 text-center">
      {isFetching && (
        <div
          className="flex flex-col items-center gap-4"
          role="status"
          aria-live="polite"
        >
          {/* Modern animated spinner */}
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute top-0 left-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-emerald-500 dark:border-t-emerald-400" />
          </div>

          {/* Loading text with subtle animation */}
          <div className="space-y-1">
            <p className="text-base font-medium text-gray-900 dark:text-gray-100 animate-pulse">
              {loadingMessage || t("loadingMore")}
            </p>
            <div className="flex justify-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {!hasMore && !isFetching && (
        <div
          className="flex flex-col items-center gap-3"
          role="status"
          aria-live="polite"
        >
          {/* Checkmark icon */}
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3">
            <svg
              className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* End message */}
          <div className="space-y-1">
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">
              {endMessage || t("allItemsLoaded")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("thankYouForBrowsing")}
            </p>
          </div>
        </div>
      )}

      {/* Hidden element for screen readers */}
      {hasMore && !isFetching && (
        <span className="sr-only">{t("scrollToLoadMore")}</span>
      )}
    </div>
  );
}
