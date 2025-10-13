/**
 * Gemstone Grid Component
 *
 * Grid layout for displaying gemstone cards with responsive columns.
 * Handles loading states, empty states, and different layout variants.
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

// ===== TYPES =====

export interface GemstoneGridProps {
  gemstones: CatalogGemstone[];
  loading?: boolean;
  variant?: "catalog" | "admin" | "related";
  onCardClick?: (gemstone: CatalogGemstone) => void;
  className?: string;
}

// ===== COMPONENT =====

export function GemstoneGrid({
  gemstones,
  loading = false,
  variant = "catalog",
  onCardClick,
  className = "",
}: GemstoneGridProps) {
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
      {gemstones.map((gemstone) => (
        <GemstoneCard
          key={gemstone.id}
          gemstone={gemstone}
          variant={variant === "related" ? "compact" : variant}
          onSelect={onCardClick ? () => onCardClick(gemstone) : undefined}
        />
      ))}
    </div>
  );
}
