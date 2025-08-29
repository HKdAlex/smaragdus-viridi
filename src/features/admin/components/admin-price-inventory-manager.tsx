"use client";

import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Package,
  Settings,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { Button } from "@/shared/components/ui/button";
import { InventoryManagementDashboard } from "./inventory-management-dashboard";
import { PriceAnalyticsDashboard } from "./price-analytics-dashboard";
import { useState } from "react";
import { useTranslations } from "next-intl";

type ViewMode = "overview" | "pricing" | "inventory";

export function AdminPriceInventoryManager() {
  const t = useTranslations("admin.priceInventoryManager");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  if (viewMode === "pricing") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode("overview")}>
            ← {t("backToOverview")}
          </Button>
          <h2 className="text-3xl font-bold text-foreground">
            {t("priceAnalytics")}
          </h2>
        </div>
        <PriceAnalyticsDashboard />
      </div>
    );
  }

  if (viewMode === "inventory") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode("overview")}>
            ← {t("backToOverview")}
          </Button>
          <h2 className="text-3xl font-bold text-foreground">
            {t("inventoryManagement")}
          </h2>
        </div>
        <InventoryManagementDashboard />
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
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => setViewMode("pricing")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {t("priceAnalytics")}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t("priceAnalyticsDescription")}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => setViewMode("inventory")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  {t("inventoryControl")}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t("inventoryControlDescription")}
                </p>
              </div>
              <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                  {t("bulkOperations")}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {t("bulkOperationsDescription")}
                </p>
              </div>
              <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Overview */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t("priceOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">
                  {t("averagePrice")}
                </span>
                <span className="font-medium">$2,450</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">
                  {t("priceRange")}
                </span>
                <span className="font-medium">$150 - $45,000</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">
                  {t("activeCurrencies")}
                </span>
                <span className="font-medium">USD, EUR, GBP</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">
                  {t("recentChanges")}
                </span>
                <span className="font-medium">12 this week</span>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => setViewMode("pricing")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {t("viewDetailedAnalytics")}
            </Button>
          </CardContent>
        </Card>

        {/* Inventory Overview */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t("inventoryOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">
                  {t("totalItems")}
                </span>
                <span className="font-medium">1,247</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                <span className="text-sm text-green-700 dark:text-green-300">
                  {t("inStock")}
                </span>
                <span className="font-medium text-green-700 dark:text-green-300">
                  1,189
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                <span className="text-sm text-red-700 dark:text-red-300">
                  {t("outOfStock")}
                </span>
                <span className="font-medium text-red-700 dark:text-red-300">
                  58
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t("lowStockAlert")}
                </span>
                <span className="font-medium text-yellow-700 dark:text-yellow-300">
                  12
                </span>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => setViewMode("inventory")}
            >
              <Package className="w-4 h-4 mr-2" />
              {t("manageInventory")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle>{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm">{t("priceAnalysis")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
            >
              <Package className="w-6 h-6" />
              <span className="text-sm">{t("stockUpdate")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm">{t("viewAlerts")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
            >
              <Settings className="w-6 h-6" />
              <span className="text-sm">{t("bulkOperations")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle>{t("recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Price updated for Diamond D Flawless
                </p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  5 gemstones marked as in stock
                </p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Low stock alert for Ruby</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
