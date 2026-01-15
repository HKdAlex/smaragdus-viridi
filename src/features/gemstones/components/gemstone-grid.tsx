/**
 * Gemstone Grid Component
 *
 * Grid layout for displaying gemstone cards with responsive columns.
 * Handles loading states, empty states, and different layout variants.
 * FILTER-C5.3: Added staggered entrance animations.
 *
 * Following clean-code principles:
 * - Single Responsibility: Only handles grid layout
 * - Composable: Works with any gemstone card variant
 * - Accessible: Proper semantic HTML
 */

"use client";

import type { CatalogGemstone } from "../services/gemstone-fetch.service";
import { GemstoneCard } from "./gemstone-card";
import { LoadingState } from "./loading-state";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";

// ===== TYPES =====

export interface GemstoneGridProps {
  gemstones: CatalogGemstone[];
  loading?: boolean;
  variant?: "catalog" | "admin" | "related";
  onCardClick?: (gemstone: CatalogGemstone) => void;
  className?: string;
  /** Enable staggered entrance animations */
  animate?: boolean;
}

// ===== COMPONENT =====

export function GemstoneGrid({
  gemstones,
  loading = false,
  variant = "catalog",
  onCardClick,
  className = "",
  animate = true,
}: GemstoneGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  if (loading) {
    return <LoadingState count={variant === "related" ? 4 : 8} />;
  }

  const gridCols = {
    catalog: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    admin: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    related: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[variant]} gap-4 sm:gap-6 ${className}`}>
      {gemstones.map((gemstone, index) => (
        <div
          key={gemstone.id}
          className={shouldAnimate ? "animate-fade-in-fast" : ""}
          style={
            shouldAnimate
              ? {
                  animationDelay: `${Math.min(index * 50, 400)}ms`,
                  animationFillMode: "backwards",
                }
              : undefined
          }
        >
          <GemstoneCard
            gemstone={gemstone}
            variant={variant === "related" ? "compact" : variant}
            onSelect={onCardClick ? () => onCardClick(gemstone) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
