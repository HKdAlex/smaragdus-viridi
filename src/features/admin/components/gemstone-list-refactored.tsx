/**
 * Gemstone List (Admin - Refactored)
 * 
 * Admin interface for managing gemstones using shared services.
 * Reduced from 832 LOC to ~220 LOC by using extracted components/services.
 * 
 * Maintains admin-specific features:
 * - Bulk selection and editing
 * - Export functionality
 * - Stock statistics
 * - Admin actions menu
 */

"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FileText, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useFilterCounts } from "@/features/gemstones/hooks/use-filter-counts";
import { useGemstoneFetch } from "@/features/gemstones/hooks/use-gemstone-fetch";
import type { AdvancedGemstoneFilters } from "@/features/gemstones/types/filter.types";
import { GemstoneGrid } from "@/features/gemstones/components/gemstone-grid";
import { PaginationControls } from "@/features/gemstones/components/pagination-controls";
import { EmptyState } from "@/features/gemstones/components/empty-state";
import { ExportService, type ExportOptions } from "../services/export-service";
import type { GemstoneWithRelations } from "../services/gemstone-admin-service";
import { BulkEditModal } from "./bulk-edit-modal";
import { EnhancedSearch, type SearchFilters } from "./enhanced-search";
import { GemstoneActionsMenu } from "./gemstone-actions-menu";
import { GemstoneDetailView } from "./gemstone-detail-view";

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

  // Convert SearchFilters to AdvancedGemstoneFilters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    sortBy: "created_at",
    sortOrder: "desc",
    types: [],
    colors: [],
    cuts: [],
    clarities: [],
    origins: [],
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50; // Larger page size for admin

  // Admin-specific state
  const [selectedGemstones, setSelectedGemstones] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedGemstoneForView, setSelectedGemstoneForView] =
    useState<GemstoneWithRelations | null>(null);

  // Convert search filters to advanced filters
  const advancedFilters: AdvancedGemstoneFilters = {
    search: searchFilters.query,
    gemstoneTypes: searchFilters.types as any[],
    colors: searchFilters.colors as any[],
    cuts: searchFilters.cuts as any[],
    clarities: searchFilters.clarities as any[],
    origins: searchFilters.origins,
    priceRange: searchFilters.priceMin !== undefined && searchFilters.priceMax !== undefined
      ? { min: searchFilters.priceMin, max: searchFilters.priceMax, currency: "USD" }
      : undefined,
    weightRange: searchFilters.weightMin !== undefined && searchFilters.weightMax !== undefined
      ? { min: searchFilters.weightMin, max: searchFilters.weightMax }
      : undefined,
    inStockOnly: searchFilters.inStock,
    sortBy: searchFilters.sortBy as any,
    sortDirection: searchFilters.sortOrder,
  };

  // Fetch gemstones using shared hook
  const { gemstones, loading, pagination, refetch } = useGemstoneFetch(
    advancedFilters,
    currentPage,
    pageSize
  );

  // Fetch filter counts using shared hook
  const { aggregated: filterOptions } = useFilterCounts();

  // Calculate stats from gemstones
  const stats = {
    total: pagination?.totalItems || 0,
    inStock: gemstones.filter((g) => g.in_stock).length,
    lowStock: 0, // TODO: Add low stock logic
    outOfStock: gemstones.filter((g) => !g.in_stock).length,
  };

  // Admin-specific handlers
  const handleSearchChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
    setCurrentPage(1);
    setSelectedGemstones(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedGemstones.size === gemstones.length) {
      setSelectedGemstones(new Set());
    } else {
      setSelectedGemstones(new Set(gemstones.map((g) => g.id)));
    }
  }, [gemstones, selectedGemstones]);

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

  const handleBulkEdit = useCallback(async () => {
    setBulkEditOpen(true);
  }, []);

  const handleExport = useCallback(async (options: ExportOptions) => {
    try {
      setExporting(true);
      await ExportService.exportGemstones(
        gemstones.map((g: any) => g),
        options
      );
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  }, [gemstones]);

  const handleViewDetails = useCallback((gemstone: any) => {
    setSelectedGemstoneForView(gemstone);
    setDetailViewOpen(true);
    if (onView) onView(gemstone);
  }, [onView]);

  // Extract available origins from filter options
  const availableOrigins = filterOptions?.origins.map((o) => o.value) || [];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>Total: {stats.total}</span>
            <span>In Stock: {stats.inStock}</span>
            <span>Out of Stock: {stats.outOfStock}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedGemstones.size > 0 && (
            <Button onClick={handleBulkEdit} variant="outline">
              Bulk Edit ({selectedGemstones.size})
            </Button>
          )}
          <Button onClick={() => handleExport({ format: "csv" })} variant="outline" disabled={exporting}>
            <FileText className="w-4 h-4 mr-2" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            {t("createNew")}
          </Button>
        </div>
      </div>

      {/* Enhanced Search */}
      <EnhancedSearch
        onFiltersChange={handleSearchChange}
        onSearch={() => refetch()}
        availableOrigins={availableOrigins}
        initialFilters={searchFilters}
      />

      {/* Selection Controls */}
      {gemstones.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-muted rounded-lg">
          <Checkbox
            checked={selectedGemstones.size === gemstones.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm">
            {selectedGemstones.size === gemstones.length
              ? "Deselect All"
              : "Select All"}
          </span>
          {selectedGemstones.size > 0 && (
            <Badge variant="secondary">{selectedGemstones.size} selected</Badge>
          )}
        </div>
      )}

      {/* Results */}
      {loading && gemstones.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">Loading gemstones...</div>
          </CardContent>
        </Card>
      ) : gemstones.length === 0 ? (
        <EmptyState
          title="No gemstones found"
          message="Try adjusting your search filters or create a new gemstone"
          action={
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Gemstone
            </Button>
          }
        />
      ) : (
        <>
          {/* Admin Grid with Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gemstones.map((gemstone: any) => (
              <Card
                key={gemstone.id}
                className={`cursor-pointer transition-all ${
                  selectedGemstones.has(gemstone.id)
                    ? "ring-2 ring-primary"
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Checkbox
                      checked={selectedGemstones.has(gemstone.id)}
                      onCheckedChange={() => handleSelectGemstone(gemstone.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <GemstoneActionsMenu
                      gemstone={gemstone}
                      onEdit={() => onEdit?.(gemstone)}
                      onView={() => handleViewDetails(gemstone)}
                      onDelete={() => onDelete?.(gemstone)}
                    />
                  </div>
                  <div onClick={() => handleViewDetails(gemstone)}>
                    <p className="font-semibold text-sm mb-1">
                      {gemstone.serial_number}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {gemstone.color} {gemstone.name}
                    </p>
                    <p className="text-sm font-bold">
                      ${(gemstone.price_amount / 100).toFixed(2)}
                    </p>
                    <Badge
                      variant={gemstone.in_stock ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {gemstone.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && (
            <PaginationControls
              pagination={pagination}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          )}
        </>
      )}

      {/* Bulk Edit Modal */}
      {bulkEditOpen && (
        <BulkEditModal
          selectedIds={Array.from(selectedGemstones)}
          onClose={() => setBulkEditOpen(false)}
          onSuccess={() => {
            setSelectedGemstones(new Set());
            refetch();
          }}
        />
      )}

      {/* Detail View */}
      {detailViewOpen && selectedGemstoneForView && (
        <GemstoneDetailView
          gemstone={selectedGemstoneForView}
          onClose={() => {
            setDetailViewOpen(false);
            setSelectedGemstoneForView(null);
          }}
          onEdit={() => {
            if (selectedGemstoneForView) {
              onEdit?.(selectedGemstoneForView);
            }
          }}
          onDelete={() => {
            if (selectedGemstoneForView) {
              onDelete?.(selectedGemstoneForView);
            }
          }}
        />
      )}
    </div>
  );
}

