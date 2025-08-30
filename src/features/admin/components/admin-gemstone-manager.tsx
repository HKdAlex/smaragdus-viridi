"use client";

import { AlertCircle, Gem, Plus, Upload } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useEffect, useState } from "react";

import { BulkImportModal } from "./bulk-import-modal";
import type { BulkImportResult } from "../services/gemstone-admin-service";
import { Button } from "@/shared/components/ui/button";
import type { DatabaseGemstone } from "@/shared/types";
import { GemstoneAdminService } from "../services/gemstone-admin-service";
import { GemstoneForm } from "./gemstone-form";
import { GemstoneList } from "./gemstone-list";
import { StatisticsService } from "../services/statistics-service";
import { useTranslations } from "next-intl";

type ViewMode = "list" | "create" | "edit";

export function AdminGemstoneManager() {
  const t = useTranslations("admin.gemstoneManagement");
  const tErrors = useTranslations("errors.admin");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedGemstone, setSelectedGemstone] =
    useState<DatabaseGemstone | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  useEffect(() => {
    loadGemstoneStats();
  }, []);

  const loadGemstoneStats = async () => {
    try {
      const result = await StatisticsService.getGemstoneStats();

      if (result.success) {
        const gemstoneStats = result.data;
        setStats({
          total: gemstoneStats.total,
          inStock: gemstoneStats.inStock,
          lowStock: 0, // TODO: Implement low stock logic
          outOfStock: gemstoneStats.outOfStock,
        });
      } else {
        console.error(tErrors("loadGemstoneStatsFailed"), result.error);
      }
    } catch (error) {
      console.error(tErrors("loadGemstoneStatsFailed"), error);
    }
  };

  const handleCreateNew = () => {
    setSelectedGemstone(null);
    setViewMode("create");
  };

  const handleEdit = (gemstone: DatabaseGemstone) => {
    setSelectedGemstone(gemstone);
    setViewMode("edit");
  };

  const handleView = (gemstone: DatabaseGemstone) => {
    // TODO: Implement view mode
    console.log(t("viewGemstone", { gemstone: gemstone.serial_number }));
  };

  const handleDelete = async (gemstone: DatabaseGemstone) => {
    if (
      confirm(t("deleteConfirmation", { serialNumber: gemstone.serial_number }))
    ) {
      const result = await GemstoneAdminService.deleteGemstone(gemstone.id);
      if (result.success) {
        // Refresh the list
        window.location.reload();
      } else {
        alert(t("deleteFailed", { error: result.error }));
      }
    }
  };

  const handleFormSuccess = (gemstone: DatabaseGemstone) => {
    setViewMode("list");
    setSelectedGemstone(null);
    // Refresh the list
    window.location.reload();
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
    // Refresh the stats and gemstone list
    loadGemstoneStats();
    // The GemstoneList component will refresh automatically due to the reload
    window.location.reload();
  };

  const handleBulkImportClose = () => {
    setIsBulkImportOpen(false);
  };

  if (viewMode === "create") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode("list")}>
            ← Back to List
          </Button>
          <h2 className="text-3xl font-bold text-foreground">
            Create New Gemstone
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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode("list")}>
            ← Back to List
          </Button>
          <h2 className="text-3xl font-bold text-foreground">
            Edit Gemstone: {selectedGemstone.serial_number}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBulkImport}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {t("bulkImport")}
          </Button>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("addGemstone")}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Gem className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.total.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("stats.totalGemstones")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 dark:bg-green-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.inStock.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("stats.inStock")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.lowStock.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("stats.lowStock")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-red-600 dark:bg-red-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.outOfStock.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("stats.outOfStock")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notice for development */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t("notice.title")}
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {t("notice.description")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gemstone List */}
      <GemstoneList
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
