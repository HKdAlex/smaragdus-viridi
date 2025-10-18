/**
 * Admin Gemstone List (Refactored - Phase 1)
 *
 * Clean admin implementation using:
 * - React Query for server state
 * - Controlled filter components
 * - Maintains admin features (bulk edit, export, detail view)
 *
 * Reduced from 831 LOC to ~300 LOC by:
 * - Using React Query (replaces admin-cache)
 * - Using Phase 0 shared components
 * - Simplified state management
 * - Clear separation of concerns
 */

"use client";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Edit, FileText, Gem, Plus } from "lucide-react";
import { useCallback, useState } from "react";

// Controlled filter components
import { AdvancedFiltersControlled } from "@/features/gemstones/components/filters/advanced-filters-controlled";
// Types
import type { AdvancedGemstoneFilters } from "@/features/gemstones/types/filter.types";
import { Badge } from "@/shared/components/ui/badge";
import { BulkEditModal } from "./bulk-edit-modal";
// Admin-specific components
import { Button } from "@/shared/components/ui/button";
// Types
import type { CatalogGemstone } from "@/features/gemstones/services/gemstone-fetch.service";
// Shared components
import { EmptyState } from "@/features/gemstones/components/empty-state";
import { ExportService } from "../services/export-service";
import { GemstoneActionsMenu } from "./gemstone-actions-menu";
import type { GemstoneWithRelations } from "../services/gemstone-admin-service";
// Services
import { LoadingState } from "@/features/gemstones/components/loading-state";
import { PaginationControls } from "@/features/gemstones/components/pagination-controls";
import { queryKeys } from "@/lib/react-query/query-keys";
// React Query hooks
import { useFilterCountsQuery } from "@/features/gemstones/hooks/use-filter-counts-query";
// Filter state hooks
import { useFilterState } from "@/features/gemstones/hooks/use-filter-state";
import { useGemstoneQuery } from "@/features/gemstones/hooks/use-gemstone-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

const ADMIN_PAGE_SIZE = 50; // Larger page size for admin

interface GemstoneListRefactoredProps {
  onCreateNew?: () => void;
  onEdit?: (gemstone: GemstoneWithRelations) => void;
  onView?: (gemstone: GemstoneWithRelations) => void;
  onDelete?: (gemstone: GemstoneWithRelations) => void;
}

export function GemstoneListRefactored({
  onCreateNew,
  onEdit,
  onView,
  onDelete,
}: GemstoneListRefactoredProps) {
  const t = useTranslations("admin.gemstoneList");
  const queryClient = useQueryClient();

  // Filter state (single source of truth)
  const { filters, setFilters } = useFilterState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Admin-specific state
  const [selectedGemstones, setSelectedGemstones] = useState<Set<string>>(
    new Set()
  );
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // React Query: Fetch gemstones
  const {
    data: gemstonesData,
    isLoading: gemstonesLoading,
    error: gemstonesError,
    refetch: refetchGemstones,
  } = useGemstoneQuery(filters, currentPage, ADMIN_PAGE_SIZE);

  // React Query: Fetch filter counts
  const { data: filterCountsData } = useFilterCountsQuery();

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: AdvancedGemstoneFilters) => {
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page
      setSelectedGemstones(new Set()); // Clear selection
    },
    [setFilters]
  );

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedGemstones(new Set()); // Clear selection on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Selection handlers
  const handleSelectGemstone = useCallback((id: string) => {
    setSelectedGemstones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const gemstones = gemstonesData?.data || [];
    if (selectedGemstones.size === gemstones.length) {
      setSelectedGemstones(new Set());
    } else {
      setSelectedGemstones(new Set(gemstones.map((g) => g.id)));
    }
  }, [gemstonesData, selectedGemstones]);

  // Export handler
  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const gemstones = gemstonesData?.data || [];
      const gemstonesToExport =
        selectedGemstones.size > 0
          ? gemstones.filter((g) => selectedGemstones.has(g.id))
          : gemstones;

      await ExportService.exportToCSV(gemstonesToExport, {
        format: "csv",
        includeImages: false,
        includeMetadata: true,
      });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  }, [gemstonesData, selectedGemstones]);

  // Bulk edit handler
  const handleBulkEdit = useCallback(() => {
    if (selectedGemstones.size === 0) return;
    setBulkEditOpen(true);
  }, [selectedGemstones]);

  // Detail view handlers - now uses the unified onView callback
  const handleViewDetail = useCallback(
    (gemstone: CatalogGemstone | GemstoneWithRelations) => {
      onView?.(gemstone as GemstoneWithRelations);
    },
    [onView]
  );

  // Action handlers
  const handleEditGemstone = useCallback(
    (gemstone: CatalogGemstone | GemstoneWithRelations) => {
      onEdit?.(gemstone as GemstoneWithRelations);
    },
    [onEdit]
  );

  const handleDeleteGemstone = useCallback(
    (gemstone: CatalogGemstone | GemstoneWithRelations) => {
      onDelete?.(gemstone as GemstoneWithRelations);
    },
    [onDelete]
  );

  // After bulk edit success
  const handleBulkEditSuccess = useCallback(
    (updatedCount: number) => {
      console.log(`Bulk edit success: ${updatedCount} gemstones updated`);
      setBulkEditOpen(false);
      setSelectedGemstones(new Set());
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.gemstones.all,
      });
    },
    [queryClient]
  );

  const gemstones = gemstonesData?.data || [];
  const pagination = gemstonesData?.pagination;
  const filterOptions = filterCountsData?.aggregated;

  // Show loading state
  if (gemstonesLoading && !gemstonesData) {
    return <LoadingState count={ADMIN_PAGE_SIZE} variant="list" />;
  }

  // Show error state
  if (gemstonesError) {
    return (
      <EmptyState
        title="Error Loading Gemstones"
        message="Please try refreshing the page or contact support."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Gem className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t("title")}
                </h2>
                {pagination && (
                  <p className="text-sm text-muted-foreground">
                    {pagination.totalItems} {t("totalGemstones")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {selectedGemstones.size > 0 && (
                <>
                  <Badge variant="secondary" className="mr-2">
                    {selectedGemstones.size} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkEdit}
                    disabled={gemstonesLoading}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t("bulkEdit")}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting || gemstonesLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {exporting ? t("exporting") : t("export")}
              </Button>
              {onCreateNew && (
                <Button size="sm" onClick={onCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("createNew")}
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          {filterOptions && (
            <AdvancedFiltersControlled
              filters={filters}
              onChange={handleFiltersChange}
              options={filterOptions}
              loading={gemstonesLoading}
            />
          )}

          {/* Selection Controls */}
          {gemstones.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={gemstonesLoading}
              >
                {selectedGemstones.size === gemstones.length
                  ? t("deselectAll")
                  : t("selectAll")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {pagination &&
                  `${t("page")} ${pagination.page} ${t("of")} ${
                    pagination.totalPages
                  }`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gemstones List/Grid */}
      {gemstones.length === 0 ? (
        <EmptyState
          title={t("noGemstonesFound")}
          message={t("adjustFiltersMessage")}
        />
      ) : (
        <>
          {/* Admin Grid with Selection */}
          <div className="grid grid-cols-1 gap-4">
            {gemstones.map((gemstone) => (
              <Card
                key={gemstone.id}
                className={`transition-all ${
                  selectedGemstones.has(gemstone.id)
                    ? "ring-2 ring-primary"
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedGemstones.has(gemstone.id)}
                        onChange={() => handleSelectGemstone(gemstone.id)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />

                      {/* Gemstone Info */}
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {gemstone.name} - {gemstone.weight_carats}ct
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {gemstone.serial_number} • {gemstone.color} •{" "}
                          {gemstone.cut}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <GemstoneActionsMenu
                      gemstone={gemstone}
                      onView={() => handleViewDetail(gemstone)}
                      onEdit={() => handleEditGemstone(gemstone)}
                      onDelete={() => handleDeleteGemstone(gemstone)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={gemstonesLoading}
            />
          )}
        </>
      )}

      {/* Bulk Edit Modal */}
      {bulkEditOpen && (
        <BulkEditModal
          isOpen={bulkEditOpen}
          selectedGemstones={selectedGemstones}
          onClose={() => setBulkEditOpen(false)}
          onSuccess={handleBulkEditSuccess}
        />
      )}
    </div>
  );
}
