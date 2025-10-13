/**
 * Pagination Controls Component
 *
 * Navigation controls for paginated results.
 * Handles page changes with proper disabled states.
 */

"use client";

import type { PaginationMeta } from "../services/gemstone-fetch.service";

export interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
}

export function PaginationControls({
  pagination,
  onPageChange,
  loading = false,
  className = "",
}: PaginationControlsProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center mt-8 space-x-2 ${className}`}
    >
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPrevPage || loading}
        className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
        aria-label="Previous page"
      >
        Previous
      </button>

      <span className="text-sm text-muted-foreground px-4">
        Page {pagination.page} of {pagination.totalPages}
      </span>

      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={!pagination.hasNextPage || loading}
        className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
