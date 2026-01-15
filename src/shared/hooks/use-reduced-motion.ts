/**
 * Use Reduced Motion Hook
 * 
 * Detects user's motion preference and provides animation utilities.
 * FILTER-C5.3: Respects prefers-reduced-motion for accessibility.
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if user prefers reduced motion
 * @returns boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation class based on reduced motion preference
 * @param animationClass - The animation class to apply
 * @param fallbackClass - Optional fallback class when motion is reduced
 * @returns The appropriate class based on user preference
 */
export function useAnimationClass(
  animationClass: string,
  fallbackClass: string = ""
): string {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? fallbackClass : animationClass;
}

/**
 * Animation duration based on reduced motion preference
 * @param normalDuration - Duration in ms for normal motion
 * @param reducedDuration - Duration in ms for reduced motion (default: 0)
 * @returns Duration in ms
 */
export function useAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedDuration : normalDuration;
}
