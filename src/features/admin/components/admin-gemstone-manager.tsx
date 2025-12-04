"use client";

import type {
  BulkImportResult,
  GemstoneWithRelations,
} from "../services/gemstone-admin-service";
import { Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BulkImportModal } from "./bulk-import-modal";
import { Button } from "@/shared/components/ui/button";
import { GemstoneDetailPage } from "./gemstone-detail-page";
import { GemstoneForm } from "./gemstone-form";
import { GemstoneListOptimized } from "./gemstone-list-optimized";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAdminGemstone } from "../hooks/use-admin-gemstone-query";
import { useDeleteGemstone } from "../hooks/use-admin-gemstone-mutations";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

type ViewMode = "list" | "create" | "edit" | "view";

interface AdminGemstoneManagerProps {
  initialGemstoneId?: string | null;
  initialMode?: "edit" | "view" | null;
  onInitialGemstoneHandled?: () => void;
}

export function AdminGemstoneManager({
  initialGemstoneId,
  initialMode,
  onInitialGemstoneHandled,
}: AdminGemstoneManagerProps) {
  const t = useTranslations("admin.gemstoneManagement");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Get edit/view ID from URL params
  const editId = searchParams.get("edit");
  const viewId = searchParams.get("view");

  // Determine view mode from URL
  const getViewModeFromUrl = useCallback((): ViewMode => {
    if (editId) return "edit";
    if (viewId) return "view";
    return "list";
  }, [editId, viewId]);

  const [viewMode, setViewMode] = useState<ViewMode>(getViewModeFromUrl);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [processedInitialGemstoneId, setProcessedInitialGemstoneId] = useState<
    string | null
  >(null);

  // For optimistic UI - store gemstone from list while loading full data
  const [optimisticGemstone, setOptimisticGemstone] =
    useState<GemstoneWithRelations | null>(null);

  // Get the gemstone ID to fetch (from URL or optimistic)
  const gemstoneIdToFetch = editId || viewId;

  // React Query hook for fetching single gemstone
  const {
    data: fetchedGemstone,
    isLoading: isLoadingGemstone,
    error: gemstoneError,
  } = useAdminGemstone(gemstoneIdToFetch);

  // Use fetched data if available, otherwise use optimistic data
  const selectedGemstone = fetchedGemstone || optimisticGemstone;

  // Delete mutation
  const deleteGemstone = useDeleteGemstone();

  // Helper to update URL with gemstone state
  const updateUrl = useCallback(
    (mode: ViewMode, gemstoneId?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (mode === "list" || mode === "create") {
        params.delete("edit");
        params.delete("view");
      } else if (mode === "edit" && gemstoneId) {
        params.set("edit", gemstoneId);
        params.delete("view");
      } else if (mode === "view" && gemstoneId) {
        params.set("view", gemstoneId);
        params.delete("edit");
      }

      const url = `/admin/dashboard?${params.toString()}`;
      router.replace(url as any);
    },
    [searchParams, router]
  );

  // Sync view mode with URL changes - only react to URL param changes, not viewMode state
  useEffect(() => {
    const newMode = getViewModeFromUrl();
    console.log("[AdminGemstoneManager] URL sync effect:", {
      editId,
      viewId,
      newMode,
      currentViewMode: viewMode,
    });
    setViewMode(newMode);
    // Clear optimistic data when URL changes to list
    if (!editId && !viewId) {
      setOptimisticGemstone(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, viewId, getViewModeFromUrl]);

  // Handle initial gemstone from props (for backward compatibility)
  useEffect(() => {
    if (
      !initialGemstoneId ||
      processedInitialGemstoneId === initialGemstoneId
    ) {
      return;
    }

    const mode = initialMode || "edit";
    updateUrl(mode, initialGemstoneId);
    setProcessedInitialGemstoneId(initialGemstoneId);
    onInitialGemstoneHandled?.();
  }, [
    initialGemstoneId,
    initialMode,
    processedInitialGemstoneId,
    onInitialGemstoneHandled,
    updateUrl,
  ]);

  const handleCreateNew = useCallback(() => {
    setOptimisticGemstone(null);
    // Set viewMode directly for create since it's not in URL
    setViewMode("create");
    updateUrl("create");
  }, [updateUrl]);

  const handleEdit = useCallback(
    (gemstone: GemstoneWithRelations) => {
      // Set optimistic data for immediate UI feedback
      setOptimisticGemstone(gemstone);
      // Only update URL - the useEffect will sync viewMode from URL
      updateUrl("edit", gemstone.id);
    },
    [updateUrl]
  );

  const handleView = useCallback(
    (gemstone: GemstoneWithRelations) => {
      // Set optimistic data for immediate UI feedback
      setOptimisticGemstone(gemstone);
      // Only update URL - the useEffect will sync viewMode from URL
      updateUrl("view", gemstone.id);
    },
    [updateUrl]
  );

  const handleDelete = useCallback(
    async (gemstone: GemstoneWithRelations) => {
      // Show confirmation dialog
      if (
        !confirm(
          t("deleteConfirmation", { serialNumber: gemstone.serial_number })
        )
      ) {
        return;
      }

      try {
        await deleteGemstone.mutateAsync(gemstone.id);
        console.log(t("deleteSuccess"));
      } catch (error) {
        alert(
          t("deleteFailed", {
            error: (error as Error).message || "Unknown error",
          })
        );
      }
    },
    [deleteGemstone, t]
  );

  const handleFormSuccess = useCallback(
    async (gemstone: GemstoneWithRelations) => {
      // Invalidate caches to refresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.gemstones.lists(),
      });

      // If we were creating a new gemstone, switch to edit mode
      if (viewMode === "create") {
        setOptimisticGemstone(gemstone);
        // Only update URL - the useEffect will sync viewMode from URL
        updateUrl("edit", gemstone.id);
        // Invalidate to fetch full data
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.gemstones.detail(gemstone.id),
        });
      } else {
        // Go back to list after editing
        setOptimisticGemstone(null);
        // Only update URL - the useEffect will sync viewMode from URL
        updateUrl("list");
      }
      console.log(t("formSuccess"));
    },
    [viewMode, updateUrl, queryClient, t]
  );

  const handleFormCancel = useCallback(() => {
    setOptimisticGemstone(null);
    // Only update URL - the useEffect will sync viewMode from URL
    updateUrl("list");
  }, [updateUrl]);

  const handleBackToList = useCallback(() => {
    setOptimisticGemstone(null);
    // Only update URL - the useEffect will sync viewMode from URL
    updateUrl("list");
  }, [updateUrl]);

  const handleBulkImport = useCallback(() => {
    setIsBulkImportOpen(true);
  }, []);

  const handleBulkImportSuccess = useCallback(
    (result: BulkImportResult) => {
      setIsBulkImportOpen(false);
      // Invalidate list cache to show new gemstones
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.gemstones.lists(),
      });
      console.log(t("bulkImportSuccess"), result);
    },
    [queryClient, t]
  );

  const handleBulkImportClose = useCallback(() => {
    setIsBulkImportOpen(false);
  }, []);

  // Render create mode
  if (viewMode === "create") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBackToList}
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

  // Render edit mode
  if (viewMode === "edit") {
    // Show loading state - also show if we have an editId but no gemstone yet
    if ((isLoadingGemstone || editId) && !selectedGemstone) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="min-h-[44px] self-start"
            >
              {t("backToList")}
            </Button>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("loading")}
            </h2>
          </div>
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      );
    }

    // Show error state
    if (gemstoneError && !selectedGemstone) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="min-h-[44px] self-start"
            >
              {t("backToList")}
            </Button>
            <h2 className="text-2xl sm:text-3xl font-bold text-destructive">
              Error loading gemstone
            </h2>
          </div>
          <p className="text-muted-foreground">
            {(gemstoneError as Error).message}
          </p>
        </div>
      );
    }

    if (selectedGemstone) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
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
  }

  // Render view mode
  if (viewMode === "view") {
    // Show loading state - also show if we have a viewId but no gemstone yet
    if ((isLoadingGemstone || viewId) && !selectedGemstone) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      );
    }

    if (selectedGemstone) {
      return (
        <GemstoneDetailPage
          gemstone={selectedGemstone}
          onBack={handleBackToList}
          onEdit={() => {
            // Only update URL - the useEffect will sync viewMode from URL
            updateUrl("edit", selectedGemstone.id);
          }}
        />
      );
    }
  }

  // Render list mode (default)
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
