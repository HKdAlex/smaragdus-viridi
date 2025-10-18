"use client";

import type {
  BulkImportResult,
  GemstoneWithRelations,
} from "../services/gemstone-admin-service";
import { Plus, Upload } from "lucide-react";

import { BulkImportModal } from "./bulk-import-modal";
import { Button } from "@/shared/components/ui/button";
import { GemstoneAdminApiService } from "../services/gemstone-admin-api-service";
import { GemstoneAdminService } from "../services/gemstone-admin-service";
import { GemstoneDetailPage } from "./gemstone-detail-page";
import { GemstoneForm } from "./gemstone-form";
import { GemstoneListOptimized } from "./gemstone-list-optimized";
import { useState } from "react";
import { useTranslations } from "next-intl";

type ViewMode = "list" | "create" | "edit" | "view";

export function AdminGemstoneManager() {
  const t = useTranslations("admin.gemstoneManagement");
  const tErrors = useTranslations("errors.admin");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedGemstone, setSelectedGemstone] =
    useState<GemstoneWithRelations | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const handleCreateNew = () => {
    setSelectedGemstone(null);
    setViewMode("create");
  };

  const handleEdit = async (gemstone: GemstoneWithRelations) => {
    // Fetch full gemstone data with images for edit view
    const result = await GemstoneAdminApiService.getGemstoneById(gemstone.id);
    if (result.success) {
      setSelectedGemstone(result.data as GemstoneWithRelations);
      setViewMode("edit");
    } else {
      console.error("Failed to fetch gemstone details:", result.error);
      // Fallback to basic gemstone data
      setSelectedGemstone(gemstone);
      setViewMode("edit");
    }
  };

  const handleView = async (gemstone: GemstoneWithRelations) => {
    // Fetch full gemstone data with images for detail view
    const result = await GemstoneAdminApiService.getGemstoneById(gemstone.id);
    if (result.success) {
      setSelectedGemstone(result.data as GemstoneWithRelations);
      setViewMode("view");
    } else {
      console.error("Failed to fetch gemstone details:", result.error);
      // Fallback to basic gemstone data
      setSelectedGemstone(gemstone);
      setViewMode("view");
    }
  };

  const handleDelete = async (gemstone: GemstoneWithRelations) => {
    if (
      confirm(t("deleteConfirmation", { serialNumber: gemstone.serial_number }))
    ) {
      const result = await GemstoneAdminService.deleteGemstone(gemstone.id);
      if (result.success) {
        // The optimized list component will handle refreshing automatically
        console.log(t("deleteSuccess"));
      } else {
        alert(t("deleteFailed", { error: result.error || "Unknown error" }));
      }
    }
  };

  const handleFormSuccess = (gemstone: GemstoneWithRelations) => {
    setViewMode("list");
    setSelectedGemstone(null);
    // The optimized list component will handle refreshing automatically
    console.log(t("formSuccess"));
  };

  const handleFormCancel = () => {
    setViewMode("list");
    setSelectedGemstone(null);
  };

  const handleBulkImport = () => {
    setIsBulkImportOpen(true);
  };

  const handleBulkImportSuccess = (result: BulkImportResult) => {
    setIsBulkImportOpen(false);
    // The optimized list component will handle refreshing automatically
    console.log(t("bulkImportSuccess"), result);
  };

  const handleBulkImportClose = () => {
    setIsBulkImportOpen(false);
  };

  if (viewMode === "create") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setViewMode("list")}
            className="min-h-[44px] self-start"
          >
            {t("backToList")}
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("createNew")}
          </h2>
        </div>
        <GemstoneForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  if (viewMode === "edit" && selectedGemstone) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setViewMode("list")}
            className="min-h-[44px] self-start"
          >
            {t("backToList")}
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
            {t("editGemstone", {
              serialNumber: selectedGemstone.serial_number,
            })}
          </h2>
        </div>
        <GemstoneForm
          gemstone={selectedGemstone}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  if (viewMode === "view" && selectedGemstone) {
    return (
      <GemstoneDetailPage
        gemstone={selectedGemstone}
        onBack={() => setViewMode("list")}
        onEdit={() => setViewMode("edit")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBulkImport}
            className="flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t("bulkImport")}</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 min-h-[48px] bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("addGemstone")}</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Gemstone List Optimized */}
      <GemstoneListOptimized
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={handleBulkImportClose}
        onSuccess={handleBulkImportSuccess}
      />
    </div>
  );
}
