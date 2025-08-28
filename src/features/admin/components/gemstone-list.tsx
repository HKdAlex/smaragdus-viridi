"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { DatabaseGemstone } from "@/shared/types";
import { Edit, FileText, Gem, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ExportService, type ExportOptions } from "../services/export-service";
import {
  GemstoneAdminService,
  type GemstoneWithRelations,
} from "../services/gemstone-admin-service";

import { BulkEditModal } from "./bulk-edit-modal";
import { EnhancedSearch, type SearchFilters } from "./enhanced-search";
import { GemstoneActionsMenu } from "./gemstone-actions-menu";
import { GemstoneDetailView } from "./gemstone-detail-view";

interface GemstoneListProps {
  onCreateNew?: () => void;
  onEdit?: (gemstone: DatabaseGemstone) => void;
  onView?: (gemstone: DatabaseGemstone) => void;
  onDelete?: (gemstone: DatabaseGemstone) => void;
}

export function GemstoneList({
  onCreateNew,
  onEdit,
  onView,
  onDelete,
}: GemstoneListProps) {
  const [gemstones, setGemstones] = useState<GemstoneWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGemstones, setSelectedGemstones] = useState<Set<string>>(
    new Set()
  );
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedGemstoneForView, setSelectedGemstoneForView] =
    useState<DatabaseGemstone | null>(null);
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

  useEffect(() => {
    loadGemstones();
  }, []);

  const loadGemstones = async () => {
    try {
      const result = await GemstoneAdminService.getAllGemstones();
      if (result.success) {
        const gemstonesData = result.data || [];
        setGemstones(gemstonesData);

        // Extract unique origins for filter
        const origins = [
          ...new Set(
            gemstonesData
              .filter((g) => g.origin?.name)
              .map((g) => g.origin!.name)
          ),
        ].sort();
        setAvailableOrigins(origins);
      }
    } catch (error) {
      console.error("Failed to load gemstones:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGemstones = gemstones
    .filter((gemstone) => {
      // Text search filter
      if (searchFilters.query) {
        const searchLower = searchFilters.query.toLowerCase();
        const matchesSearch =
          gemstone.serial_number.toLowerCase().includes(searchLower) ||
          gemstone.name.toLowerCase().includes(searchLower) ||
          gemstone.color.toLowerCase().includes(searchLower) ||
          gemstone.internal_code?.toLowerCase().includes(searchLower) ||
          gemstone.origin?.name.toLowerCase().includes(searchLower) ||
          gemstone.description?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Type filter
      if (
        searchFilters.types.length > 0 &&
        !searchFilters.types.includes(gemstone.name)
      ) {
        return false;
      }

      // Color filter
      if (
        searchFilters.colors.length > 0 &&
        !searchFilters.colors.includes(gemstone.color)
      ) {
        return false;
      }

      // Cut filter
      if (
        searchFilters.cuts.length > 0 &&
        !searchFilters.cuts.includes(gemstone.cut)
      ) {
        return false;
      }

      // Clarity filter
      if (
        searchFilters.clarities.length > 0 &&
        !searchFilters.clarities.includes(gemstone.clarity)
      ) {
        return false;
      }

      // Price range filter
      if (
        searchFilters.priceMin !== undefined &&
        gemstone.price_amount < searchFilters.priceMin
      ) {
        return false;
      }
      if (
        searchFilters.priceMax !== undefined &&
        gemstone.price_amount > searchFilters.priceMax
      ) {
        return false;
      }

      // Weight range filter
      if (
        searchFilters.weightMin !== undefined &&
        gemstone.weight_carats < searchFilters.weightMin
      ) {
        return false;
      }
      if (
        searchFilters.weightMax !== undefined &&
        gemstone.weight_carats > searchFilters.weightMax
      ) {
        return false;
      }

      // Stock status filter
      if (
        searchFilters.inStock !== undefined &&
        gemstone.in_stock !== searchFilters.inStock
      ) {
        return false;
      }

      // Origin filter
      if (searchFilters.origins.length > 0 && gemstone.origin) {
        if (!searchFilters.origins.includes(gemstone.origin.name)) {
          return false;
        }
      } else if (searchFilters.origins.length > 0) {
        return false; // No origin but origins filter is active
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (searchFilters.sortBy) {
        case "created_at":
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case "price_amount":
          aValue = a.price_amount;
          bValue = b.price_amount;
          break;
        case "weight_carats":
          aValue = a.weight_carats;
          bValue = b.weight_carats;
          break;
        case "serial_number":
          aValue = a.serial_number.toLowerCase();
          bValue = b.serial_number.toLowerCase();
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return searchFilters.sortOrder === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return searchFilters.sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });

  const handleSelectGemstone = (gemstoneId: string, selected: boolean) => {
    const newSelected = new Set(selectedGemstones);
    if (selected) {
      newSelected.add(gemstoneId);
    } else {
      newSelected.delete(gemstoneId);
    }
    setSelectedGemstones(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedGemstones(new Set(filteredGemstones.map((g) => g.id)));
    } else {
      setSelectedGemstones(new Set());
    }
  };

  const handleBulkEdit = () => {
    setBulkEditOpen(true);
  };

  const handleBulkEditSuccess = (updatedCount: number) => {
    setBulkEditOpen(false);
    setSelectedGemstones(new Set()); // Clear selection after successful edit
    // Refresh the gemstones list
    loadGemstones();
  };

  const handleBulkEditClose = () => {
    setBulkEditOpen(false);
  };

  const handleViewDetail = (gemstone: DatabaseGemstone) => {
    setSelectedGemstoneForView(gemstone);
    setDetailViewOpen(true);
  };

  const handleDetailViewClose = () => {
    setDetailViewOpen(false);
    setSelectedGemstoneForView(null);
  };

  const handleSearchFiltersChange = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleSearchQuery = (query: string) => {
    setSearchFilters({ ...searchFilters, query });
  };

  const handleDuplicate = async (gemstone: DatabaseGemstone) => {
    try {
      // Transform DatabaseGemstone to GemstoneFormData format
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
        promotional_text: undefined, // Not available in DatabaseGemstone
      };

      const result = await GemstoneAdminService.createGemstone(formData);

      if (result.success) {
        console.log("Gemstone duplicated successfully");
        loadGemstones(); // Refresh the list
      } else {
        alert(`Failed to duplicate gemstone: ${result.error}`);
      }
    } catch (error) {
      console.error("Error duplicating gemstone:", error);
      alert("Failed to duplicate gemstone");
    }
  };

  const handleExportSingle = async (gemstone: DatabaseGemstone) => {
    await handleExport("csv", false, [gemstone.id]);
  };

  const handleArchive = async (gemstone: DatabaseGemstone) => {
    // For now, we'll just mark as out of stock
    try {
      const result = await GemstoneAdminService.updateGemstone(gemstone.id, {
        in_stock: false,
      });

      if (result.success) {
        console.log("Gemstone archived successfully");
        loadGemstones(); // Refresh the list
      } else {
        alert(`Failed to archive gemstone: ${result.error}`);
      }
    } catch (error) {
      console.error("Error archiving gemstone:", error);
      alert("Failed to archive gemstone");
    }
  };

  const handleRestore = async (gemstone: DatabaseGemstone) => {
    // For now, we'll just mark as in stock
    try {
      const result = await GemstoneAdminService.updateGemstone(gemstone.id, {
        in_stock: true,
      });

      if (result.success) {
        console.log("Gemstone restored successfully");
        loadGemstones(); // Refresh the list
      } else {
        alert(`Failed to restore gemstone: ${result.error}`);
      }
    } catch (error) {
      console.error("Error restoring gemstone:", error);
      alert("Failed to restore gemstone");
    }
  };

  const handleExport = async (
    format: "csv" | "pdf",
    selectedOnly: boolean = false,
    specificIds?: string[]
  ) => {
    setExporting(true);

    try {
      let gemstonesToExport;

      if (specificIds && specificIds.length > 0) {
        // Export specific gemstones by ID
        gemstonesToExport = filteredGemstones.filter((g) =>
          specificIds.includes(g.id)
        );
      } else if (selectedOnly && selectedGemstones.size > 0) {
        // Export selected gemstones
        gemstonesToExport = filteredGemstones.filter((g) =>
          selectedGemstones.has(g.id)
        );
      } else {
        // Export all filtered gemstones
        gemstonesToExport = filteredGemstones;
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
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)}ct`;
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
            <p className="text-muted-foreground">Loading gemstones...</p>
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
        onSearch={handleSearchQuery}
        availableOrigins={availableOrigins}
        initialFilters={searchFilters}
      />

      {/* Selection Actions */}
      {selectedGemstones.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-800">
            {selectedGemstones.size} gemstones selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv", true)}
              disabled={exporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf", true)}
              disabled={exporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkEdit}
              disabled={selectedGemstones.size === 0}
            >
              <Edit className="w-4 h-4 mr-2" />
              Bulk Edit
            </Button>
          </div>
        </div>
      )}

      {/* Create New Button */}
      <div className="flex justify-between items-center">
        <div></div>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Gemstone
        </Button>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredGemstones.length} of {gemstones.length} gemstones
          {searchTerm && ` for "${searchTerm}"`}
        </span>
        <span>
          {selectedGemstones.size > 0 && `${selectedGemstones.size} selected`}
        </span>
      </div>

      {/* Gemstone Table */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-0">
          {filteredGemstones.length === 0 ? (
            <div className="text-center py-12">
              <Gem className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "No gemstones found" : "No gemstones yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? "Try adjusting your search terms or filters."
                  : "Get started by adding your first gemstone to the catalog."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={onCreateNew}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Gemstone
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
                          selectedGemstones.size === filteredGemstones.length &&
                          filteredGemstones.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Gemstone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredGemstones.map((gemstone) => (
                    <tr
                      key={gemstone.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
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
                          <div className="flex-shrink-0 w-12 h-12">
                            {gemstone.images && gemstone.images.length > 0 ? (
                              <img
                                src={gemstone.images[0].image_url}
                                alt={gemstone.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Gem className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-foreground">
                              {formatWeight(gemstone.weight_carats)}{" "}
                              {gemstone.color} {gemstone.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {gemstone.serial_number}
                              {gemstone.internal_code &&
                                ` • ${gemstone.internal_code}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          <div className="capitalize">{gemstone.cut} cut</div>
                          <div>{gemstone.clarity} clarity</div>
                          {gemstone.origin && (
                            <div className="text-muted-foreground">
                              {gemstone.origin.name}, {gemstone.origin.country}
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
                              Premium:{" "}
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
                            {gemstone.in_stock ? "In Stock" : "Out of Stock"}
                          </Badge>
                          {gemstone.delivery_days && (
                            <span className="text-xs text-muted-foreground">
                              {gemstone.delivery_days} days
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
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

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={bulkEditOpen}
        onClose={handleBulkEditClose}
        selectedGemstones={selectedGemstones}
        onSuccess={handleBulkEditSuccess}
      />

      {/* Gemstone Detail View Modal */}
      {selectedGemstoneForView && (
        <GemstoneDetailView
          gemstone={selectedGemstoneForView}
          isOpen={detailViewOpen}
          onClose={handleDetailViewClose}
        />
      )}
    </div>
  );
}
