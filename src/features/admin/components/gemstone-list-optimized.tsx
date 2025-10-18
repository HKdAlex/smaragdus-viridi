"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Edit, FileText, Gem, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ExportService, type ExportOptions } from "../services/export-service";
import {
  GemstoneAdminService,
  type GemstoneWithRelations,
} from "../services/gemstone-admin-service";

import { GemstoneImageThumbnail } from "@/features/gemstones/components/gemstone-image-thumbnail";
import { adminCache } from "../services/admin-cache";
import { BulkEditModal } from "./bulk-edit-modal";
import { EnhancedSearch, type SearchFilters } from "./enhanced-search";
import { GemstoneActionsMenu } from "./gemstone-actions-menu";

interface GemstoneListOptimizedProps {
  onCreateNew?: () => void;
  onEdit?: (gemstone: GemstoneWithRelations) => void;
  onView?: (gemstone: GemstoneWithRelations) => void;
  onDelete?: (gemstone: GemstoneWithRelations) => void;
}

interface PaginatedGemstones {
  gemstones: GemstoneWithRelations[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  error?: string;
}

export function GemstoneListOptimized({
  onCreateNew,
  onEdit,
  onView,
  onDelete,
}: GemstoneListOptimizedProps) {
  const t = useTranslations("admin.gemstoneList");
  const [gemstones, setGemstones] = useState<GemstoneWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    // Load page size from localStorage, default to 50
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin-gemstone-page-size");
      return saved ? parseInt(saved, 10) : 50;
    }
    return 50;
  });
  const [pagination, setPagination] = useState<
    PaginatedGemstones["pagination"] | null
  >(null);
  const [stats, setStats] = useState<PaginatedGemstones["stats"]>({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [selectedGemstones, setSelectedGemstones] = useState<Set<string>>(
    new Set()
  );
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
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
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);

  // Server-side filtering and pagination with caching
  const fetchGemstones = useCallback(
    async (filters: SearchFilters, page: number = 1) => {
      try {
        setLoading(true);

        // Check cache first
        const cachedResult = adminCache.getCachedSearchResults(filters, page);
        if (cachedResult) {
          setGemstones(cachedResult.gemstones);
          setPagination(cachedResult.pagination);
          setStats(cachedResult.stats);

          // Extract unique origins for filter options
          const origins = [
            ...new Set(
              cachedResult.gemstones
                .filter((g: any) => g.origin?.name)
                .map((g: any) => g.origin!.name)
            ),
          ].sort() as string[];
          setAvailableOrigins(origins);

          setLoading(false);
          return;
        }

        // Build query parameters for server-side filtering
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (filters.query) queryParams.set("search", filters.query);
        if (filters.types.length)
          queryParams.set("types", filters.types.join(","));
        if (filters.colors.length)
          queryParams.set("colors", filters.colors.join(","));
        if (filters.cuts.length)
          queryParams.set("cuts", filters.cuts.join(","));
        if (filters.clarities.length)
          queryParams.set("clarities", filters.clarities.join(","));
        if (filters.origins.length)
          queryParams.set("origins", filters.origins.join(","));
        if (filters.priceMin !== undefined)
          queryParams.set("priceMin", filters.priceMin.toString());
        if (filters.priceMax !== undefined)
          queryParams.set("priceMax", filters.priceMax.toString());
        if (filters.weightMin !== undefined)
          queryParams.set("weightMin", filters.weightMin.toString());
        if (filters.weightMax !== undefined)
          queryParams.set("weightMax", filters.weightMax.toString());
        if (filters.inStock !== undefined)
          queryParams.set("inStock", filters.inStock.toString());

        console.log("🔍 [GemstoneListOptimized] Fetching with filters:", {
          filters,
          page,
          queryParams: queryParams.toString(),
          timestamp: new Date().toISOString(),
        });

        // Call server-side API endpoint (we'll create this next)
        const response = await fetch(`/api/admin/gemstones?${queryParams}`);
        const result: PaginatedGemstones = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch gemstones");
        }

        console.log("✅ [GemstoneListOptimized] Fetched gemstones:", {
          count: result.gemstones.length,
          totalItems: result.pagination.totalItems,
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
        });

        setGemstones(result.gemstones);
        setPagination(result.pagination);
        setStats(result.stats);

        // Cache the results
        adminCache.setCachedSearchResults(filters, page, result);

        // Extract unique origins for filter options
        const origins = [
          ...new Set(
            result.gemstones
              .filter((g) => g.origin?.name)
              .map((g) => g.origin!.name)
          ),
        ].sort();
        setAvailableOrigins(origins);
      } catch (error) {
        console.error(
          "❌ [GemstoneListOptimized] Error fetching gemstones:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // Initial load and page changes
  useEffect(() => {
    fetchGemstones(searchFilters, currentPage);
  }, [currentPage, pageSize, searchFilters, fetchGemstones]);

  // Handle filter changes with debouncing
  const handleSearchFiltersChange = useCallback(
    (filters: SearchFilters) => {
      console.log("🎯 [GemstoneListOptimized] Filter change received:", {
        filters,
        timestamp: new Date().toISOString(),
      });

      setSearchFilters(filters);
      setCurrentPage(1); // Reset to first page when filters change
      fetchGemstones(filters, 1);
    },
    [fetchGemstones]
  );

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle page size changes
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("admin-gemstone-page-size", newPageSize.toString());
    }
  }, []);

  // Handle selection
  const handleSelectGemstone = useCallback(
    (gemstoneId: string, selected: boolean) => {
      const newSelected = new Set(selectedGemstones);
      if (selected) {
        newSelected.add(gemstoneId);
      } else {
        newSelected.delete(gemstoneId);
      }
      setSelectedGemstones(newSelected);
    },
    [selectedGemstones]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedGemstones(new Set(gemstones.map((g) => g.id)));
      } else {
        setSelectedGemstones(new Set());
      }
    },
    [gemstones]
  );

  // Bulk operations
  const handleBulkEdit = useCallback(() => {
    setBulkEditOpen(true);
  }, []);

  const handleBulkEditSuccess = useCallback(
    (updatedCount: number) => {
      setBulkEditOpen(false);
      setSelectedGemstones(new Set()); // Clear selection after successful edit
      // Refresh the current page
      fetchGemstones(searchFilters, currentPage);
    },
    [fetchGemstones, searchFilters, currentPage]
  );

  const handleBulkEditClose = useCallback(() => {
    setBulkEditOpen(false);
  }, []);

  // Detail view - now uses the unified onView callback
  const handleViewDetail = useCallback(
    (gemstone: GemstoneWithRelations) => {
      onView?.(gemstone);
    },
    [onView]
  );

  // Individual operations
  const handleDuplicate = useCallback(
    async (gemstone: GemstoneWithRelations) => {
      try {
        const formData = {
          serial_number: `${gemstone.serial_number}_copy_${Date.now()}`,
          name: gemstone.name,
          color: gemstone.color,
          cut: gemstone.cut,
          clarity: gemstone.clarity,
          weight_carats: gemstone.weight_carats,
          length_mm: gemstone.length_mm ?? undefined,
          width_mm: gemstone.width_mm ?? undefined,
          depth_mm: gemstone.depth_mm ?? undefined,
          origin_id: gemstone.origin_id ?? undefined,
          price_amount: gemstone.price_amount,
          price_currency: gemstone.price_currency,
          premium_price_amount: gemstone.premium_price_amount ?? undefined,
          premium_price_currency: gemstone.premium_price_currency ?? undefined,
          in_stock: gemstone.in_stock ?? false,
          delivery_days: gemstone.delivery_days ?? undefined,
          internal_code: gemstone.internal_code
            ? `${gemstone.internal_code}_copy`
            : undefined,
          description: gemstone.description ?? undefined,
        };

        const result = await GemstoneAdminService.createGemstone(formData);

        if (result.success) {
          console.log(t("messages.duplicateSuccess"));
          // Refresh the current page
          fetchGemstones(searchFilters, currentPage);
        } else {
          alert(
            t("errors.duplicateFailed", {
              error: result.error || "Unknown error",
            })
          );
        }
      } catch (error) {
        console.error(t("errors.duplicateError"), error);
        alert(t("errors.duplicateFailed"));
      }
    },
    [t, fetchGemstones, searchFilters, currentPage]
  );

  const handleArchive = useCallback(
    async (gemstone: GemstoneWithRelations) => {
      try {
        const result = await GemstoneAdminService.updateGemstone(gemstone.id, {
          in_stock: false,
        });

        if (result.success) {
          console.log(t("messages.archiveSuccess"));
          // Refresh the current page
          fetchGemstones(searchFilters, currentPage);
        } else {
          alert(
            t("errors.archiveFailed", {
              error: result.error || "Unknown error",
            })
          );
        }
      } catch (error) {
        console.error(t("errors.archiveError"), error);
        alert(t("errors.archiveFailed"));
      }
    },
    [t, fetchGemstones, searchFilters, currentPage]
  );

  const handleRestore = useCallback(
    async (gemstone: GemstoneWithRelations) => {
      try {
        const result = await GemstoneAdminService.updateGemstone(gemstone.id, {
          in_stock: true,
        });

        if (result.success) {
          console.log(t("messages.restoreSuccess"));
          // Refresh the current page
          fetchGemstones(searchFilters, currentPage);
        } else {
          alert(
            t("errors.restoreFailed", {
              error: result.error || "Unknown error",
            })
          );
        }
      } catch (error) {
        console.error(t("errors.restoreError"), error);
        alert(t("errors.restoreFailed"));
      }
    },
    [t, fetchGemstones, searchFilters, currentPage]
  );

  // Export operations
  const handleExportSingle = useCallback(
    async (gemstone: GemstoneWithRelations) => {
      await handleExport("csv", false, [gemstone.id]);
    },
    []
  );

  const handleExport = useCallback(
    async (
      format: "csv" | "pdf",
      selectedOnly: boolean = false,
      specificIds?: string[]
    ) => {
      setExporting(true);

      try {
        let gemstonesToExport;

        if (specificIds && specificIds.length > 0) {
          // Export specific gemstones by ID
          gemstonesToExport = gemstones.filter((g) =>
            specificIds.includes(g.id)
          );
        } else if (selectedOnly && selectedGemstones.size > 0) {
          // Export selected gemstones
          gemstonesToExport = gemstones.filter((g) =>
            selectedGemstones.has(g.id)
          );
        } else {
          // Export all current page gemstones
          gemstonesToExport = gemstones;
        }

        const options: ExportOptions = {
          format,
          selectedGemstones:
            specificIds || (selectedOnly && selectedGemstones.size > 0)
              ? Array.from(selectedGemstones)
              : undefined,
          includeImages: false, // TODO: Implement image export
          includeMetadata: true,
        };

        const result =
          format === "csv"
            ? await ExportService.exportToCSV(gemstonesToExport, options)
            : await ExportService.exportToPDF(gemstonesToExport, options);

        if (result.success) {
          ExportService.downloadFile(result);
        } else {
          alert(
            t("errors.exportFailed", { error: result.error || "Unknown error" })
          );
        }
      } catch (error) {
        console.error(t("errors.exportError"), error);
        alert(t("errors.exportFailed"));
      } finally {
        setExporting(false);
      }
    },
    [gemstones, selectedGemstones, t]
  );

  // Utility functions
  const formatPrice = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  }, []);

  const formatWeight = useCallback(
    (weight: number) => {
      return `${weight.toFixed(2)}${t("carats")}`;
    },
    [t]
  );

  // Localization helpers
  const getLocalizedGemstoneType = useCallback(
    (type: string) => {
      return t(`gemstones.types.${type}` as any) || type;
    },
    [t]
  );

  const getLocalizedColor = useCallback(
    (color: string) => {
      return t(`gemstones.colors.${color}` as any) || color;
    },
    [t]
  );

  const getLocalizedCut = useCallback(
    (cut: string) => {
      return t(`gemstones.cuts.${cut}` as any) || cut;
    },
    [t]
  );

  const getLocalizedClarity = useCallback(
    (clarity: string) => {
      return t(`gemstones.clarities.${clarity}` as any) || clarity;
    },
    [t]
  );

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search */}
      <EnhancedSearch
        onFiltersChange={handleSearchFiltersChange}
        onSearch={(query) =>
          handleSearchFiltersChange({ ...searchFilters, query })
        }
        availableOrigins={availableOrigins}
        initialFilters={searchFilters}
      />

      {/* Selection Actions */}
      {selectedGemstones.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-800">
            {t("selectedCount", { count: selectedGemstones.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv", true)}
              disabled={exporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? t("exporting") : t("exportCsv")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf", true)}
              disabled={exporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? t("exporting") : t("exportPdf")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkEdit}
              disabled={selectedGemstones.size === 0}
            >
              <Edit className="w-4 h-4 mr-2" />
              {t("bulkEdit")}
            </Button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {pagination
            ? searchFilters.query && searchFilters.query.trim()
              ? t("resultsSummary", {
                  showing: gemstones.length,
                  total: pagination.totalItems,
                  currentPage: pagination.page,
                  totalPages: pagination.totalPages,
                  searchTerm: searchFilters.query,
                })
              : t("resultsSummaryNoSearch", {
                  showing: gemstones.length,
                  total: pagination.totalItems,
                  currentPage: pagination.page,
                  totalPages: pagination.totalPages,
                })
            : t("loading")}
        </span>
        <span>
          {selectedGemstones.size > 0 &&
            t("selected", { count: selectedGemstones.size })}
        </span>
      </div>

      {/* Gemstone Table */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-0">
          {gemstones.length === 0 ? (
            <div className="text-center py-12">
              <Gem className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchFilters.query
                  ? t("noResultsFound")
                  : t("noGemstonesYet")}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchFilters.query
                  ? t("tryAdjustingSearch")
                  : t("getStartedMessage")}
              </p>
              {!searchFilters.query && (
                <Button
                  onClick={onCreateNew}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("addFirstGemstone")}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedGemstones.size === gemstones.length &&
                          gemstones.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("tableHeaders.gemstone")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("tableHeaders.details")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("tableHeaders.price")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("tableHeaders.status")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("tableHeaders.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {gemstones.map((gemstone) => (
                    <tr
                      key={gemstone.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => onView?.(gemstone)}
                    >
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGemstones.has(gemstone.id)}
                          onChange={(e) =>
                            handleSelectGemstone(gemstone.id, e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <GemstoneImageThumbnail
                            gemstone={gemstone}
                            size="sm"
                            alt={getLocalizedGemstoneType(gemstone.name)}
                          />
                          <div className="ml-4">
                            <div className="font-medium text-foreground">
                              {formatWeight(gemstone.weight_carats)}{" "}
                              {getLocalizedColor(gemstone.color)}{" "}
                              {getLocalizedGemstoneType(gemstone.name)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {gemstone.serial_number}
                              {gemstone.internal_code &&
                                ` • ${gemstone.internal_code}`}
                              {gemstone.images &&
                                gemstone.images.length > 0 && (
                                  <span className="ml-2 text-xs text-green-600">
                                    📷 {gemstone.images.length}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          <div>
                            {t("labels.cut")}: {getLocalizedCut(gemstone.cut)}
                          </div>
                          <div>
                            {t("labels.clarity")}:{" "}
                            {getLocalizedClarity(gemstone.clarity)}
                          </div>
                          {gemstone.origin && (
                            <div className="text-muted-foreground">
                              {t("originFormat", {
                                name: gemstone.origin.name,
                                country: gemstone.origin.country,
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            {formatPrice(
                              gemstone.price_amount,
                              gemstone.price_currency
                            )}
                          </div>
                          {gemstone.premium_price_amount && (
                            <div className="text-muted-foreground">
                              {t("premium")}:{" "}
                              {formatPrice(
                                gemstone.premium_price_amount,
                                gemstone.premium_price_currency ||
                                  gemstone.price_currency
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              gemstone.in_stock ? "default" : "destructive"
                            }
                            className="w-fit"
                          >
                            {gemstone.in_stock ? t("inStock") : t("outOfStock")}
                          </Badge>
                          {gemstone.delivery_days && (
                            <span className="text-xs text-muted-foreground">
                              {gemstone.delivery_days} {t("days")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GemstoneActionsMenu
                          gemstone={gemstone}
                          onView={handleViewDetail}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onDuplicate={handleDuplicate}
                          onExportSingle={handleExportSingle}
                          onArchive={handleArchive}
                          onRestore={handleRestore}
                          isArchived={!gemstone.in_stock}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => handlePageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>

          {/* Page Navigation */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={bulkEditOpen}
        onClose={handleBulkEditClose}
        selectedGemstones={selectedGemstones}
        onSuccess={handleBulkEditSuccess}
      />
    </div>
  );
}
