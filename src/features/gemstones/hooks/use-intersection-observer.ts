/**
 * Use Intersection Observer Hook
 *
 * Observes when a target element enters the viewport.
 * Useful for implementing infinite scroll, lazy loading, etc.
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });
 * useEffect(() => {
 *   if (isIntersecting) {
 *     loadMoreItems();
 *   }
 * }, [isIntersecting]);
 */

"use client";

import { useEffect, useRef, useState } from "react";

export interface UseIntersectionObserverOptions {
  /**
   * Percentage of target visibility required to trigger (0.0 to 1.0)
   * @default 0.1
   */
  threshold?: number;

  /**
   * Margin around the root (viewport) to trigger early/late
   * @default '200px' - triggers 200px before element enters viewport
   */
  rootMargin?: string;

  /**
   * Root element for intersection (null = viewport)
   * @default null
   */
  root?: Element | null;

  /**
   * Whether observation is enabled
   * @default true
   */
  enabled?: boolean;
}

export interface UseIntersectionObserverReturn {
  /** Ref to attach to the target element */
  ref: React.RefObject<HTMLDivElement | null>;

  /** Whether the target is currently intersecting */
  isIntersecting: boolean;
}

/**
 * Hook to detect when an element enters the viewport
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0.1,
    rootMargin = "200px",
    root = null,
    enabled = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, root, enabled]);

  return { ref, isIntersecting };
}
