"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import type { DatabaseGemstone } from "@/shared/types";
import {
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Gem,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  GemstoneAdminService,
  type GemstoneWithRelations,
} from "../services/gemstone-admin-service";
import { AdvancedFilters, type AdvancedFiltersState } from "./advanced-filters";
import { BulkEditModal } from "./bulk-edit-modal";
import { ExportService, type ExportOptions } from "../services/export-service";

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
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    types: [],
    colors: [],
    cuts: [],
    clarities: [],
    priceMin: undefined,
    priceMax: undefined,
    weightMin: undefined,
    weightMax: undefined,
    stockStatus: "all",
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

  const filteredGemstones = gemstones.filter((gemstone) => {
    // Text search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        gemstone.serial_number.toLowerCase().includes(searchLower) ||
        gemstone.name.toLowerCase().includes(searchLower) ||
        gemstone.color.toLowerCase().includes(searchLower) ||
        gemstone.internal_code?.toLowerCase().includes(searchLower) ||
        gemstone.origin?.name.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Advanced filters
    // Type filter
    if (
      advancedFilters.types.length > 0 &&
      !advancedFilters.types.includes(gemstone.name)
    ) {
      return false;
    }

    // Color filter
    if (
      advancedFilters.colors.length > 0 &&
      !advancedFilters.colors.includes(gemstone.color)
    ) {
      return false;
    }

    // Cut filter
    if (
      advancedFilters.cuts.length > 0 &&
      !advancedFilters.cuts.includes(gemstone.cut)
    ) {
      return false;
    }

    // Clarity filter
    if (
      advancedFilters.clarities.length > 0 &&
      !advancedFilters.clarities.includes(gemstone.clarity)
    ) {
      return false;
    }

    // Price range filter
    if (
      advancedFilters.priceMin !== undefined &&
      gemstone.price_amount < advancedFilters.priceMin
    ) {
      return false;
    }
    if (
      advancedFilters.priceMax !== undefined &&
      gemstone.price_amount > advancedFilters.priceMax
    ) {
      return false;
    }

    // Weight range filter
    if (
      advancedFilters.weightMin !== undefined &&
      gemstone.weight_carats < advancedFilters.weightMin
    ) {
      return false;
    }
    if (
      advancedFilters.weightMax !== undefined &&
      gemstone.weight_carats > advancedFilters.weightMax
    ) {
      return false;
    }

    // Stock status filter
    if (advancedFilters.stockStatus === "in_stock" && !gemstone.in_stock) {
      return false;
    }
    if (advancedFilters.stockStatus === "out_of_stock" && gemstone.in_stock) {
      return false;
    }

    // Origin filter
    if (advancedFilters.origins.length > 0 && gemstone.origin) {
      if (!advancedFilters.origins.includes(gemstone.origin.name)) {
        return false;
      }
    } else if (advancedFilters.origins.length > 0) {
      return false; // No origin but origins filter is active
    }

    return true;
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

  const handleExport = async (format: 'csv' | 'pdf', selectedOnly: boolean = false) => {
    setExporting(true);

    try {
      const gemstonesToExport = selectedOnly && selectedGemstones.size > 0
        ? filteredGemstones.filter(g => selectedGemstones.has(g.id))
        : filteredGemstones;

      const options: ExportOptions = {
        format,
        selectedGemstones: selectedOnly && selectedGemstones.size > 0
          ? Array.from(selectedGemstones)
          : undefined,
        includeImages: false, // TODO: Implement image export
        includeMetadata: true,
      };

      const result = format === 'csv'
        ? await ExportService.exportToCSV(gemstonesToExport, options)
        : await ExportService.exportToPDF(gemstonesToExport, options);

      if (result.success) {
        ExportService.downloadFile(result);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
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
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search gemstones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {selectedGemstones.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedGemstones.size} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv', true)}
                  disabled={exporting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf', true)}
                  disabled={exporting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </Button>
              </div>
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
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Gemstone
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export All CSV'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export All PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        isOpen={advancedFiltersOpen}
        onToggle={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
        availableOrigins={availableOrigins}
      />

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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView?.(gemstone)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit?.(gemstone)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(gemstone)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
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
    </div>
  );
}
