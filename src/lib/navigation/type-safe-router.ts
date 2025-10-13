/**
 * Type-Safe Router Wrapper
 *
 * Provides type-safe navigation methods for dynamic URLs that aren't
 * known at compile time (e.g., search queries, filters).
 *
 * Eliminates the need for `as any` when using router with dynamic URLs.
 */

import { useRouter as useNextRouter, usePathname } from "next/navigation";

export interface TypeSafeRouter {
  /**
   * Navigate to a dynamic URL (e.g., with query params)
   * Use this instead of router.push() when the URL is constructed at runtime
   */
  pushDynamic: (url: string, options?: { scroll?: boolean }) => void;

  /**
   * Replace current URL with a dynamic URL (shallow navigation)
   * Use this for filter changes, search updates, etc.
   */
  replaceDynamic: (url: string, options?: { scroll?: boolean }) => void;

  /**
   * Navigate back in history
   */
  back: () => void;

  /**
   * Navigate forward in history
   */
  forward: () => void;

  /**
   * Refresh the current page
   */
  refresh: () => void;

  /**
   * Prefetch a route
   */
  prefetch: (href: string) => void;
}

/**
 * Custom hook that wraps Next.js router with type-safe dynamic navigation
 */
export function useTypeSafeRouter(): TypeSafeRouter {
  const router = useNextRouter();

  return {
    pushDynamic: (url: string, options?: { scroll?: boolean }) => {
      router.push(url, options);
    },
    replaceDynamic: (url: string, options?: { scroll?: boolean }) => {
      router.replace(url, options);
    },
    back: () => router.back(),
    forward: () => router.forward(),
    refresh: () => router.refresh(),
    prefetch: (href: string) => router.prefetch(href),
  };
}

/**
 * Hook to get current pathname in a type-safe way
 */
export function useCurrentPathname(): string {
  return usePathname();
}
