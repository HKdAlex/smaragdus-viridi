"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Package,
  RefreshCw,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  InventoryManagementService,
  type InventoryAlert,
  type InventoryReport,
} from "../services/inventory-management-service";

export function InventoryManagementDashboard() {
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk inventory update state
  const [bulkUpdate, setBulkUpdate] = useState({
    inStock: true,
    deliveryDays: "",
    reason: "",
  });

  // Selected gemstones for bulk operations
  const [selectedGemstones, setSelectedGemstones] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportResult, alertsResult] = await Promise.all([
        InventoryManagementService.getInventoryReport(),
        InventoryManagementService.getActiveAlerts(),
      ]);

      if (reportResult.success) {
        setReport(reportResult.data || null);
      } else {
        setError(reportResult.error || "Failed to load inventory report");
      }

      if (alertsResult.success) {
        setAlerts(alertsResult.data || []);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInventoryUpdate = async () => {
    if (selectedGemstones.size === 0) {
      alert("Please select gemstones to update");
      return;
    }

    if (!bulkUpdate.reason.trim()) {
      alert("Please provide a reason for the inventory update");
      return;
    }

    try {
      const result = await InventoryManagementService.bulkUpdateInventory({
        gemstoneIds: Array.from(selectedGemstones),
        inStock: bulkUpdate.inStock,
        deliveryDays: bulkUpdate.deliveryDays
          ? parseInt(bulkUpdate.deliveryDays)
          : undefined,
        reason: bulkUpdate.reason,
      });

      if (result.success) {
        alert(`Updated ${result.updated} gemstones, ${result.failed} failed`);
        setSelectedGemstones(new Set());
        setBulkUpdate({ inStock: true, deliveryDays: "", reason: "" });
        loadInventoryData(); // Refresh data
      } else {
        alert(`Bulk update failed: ${result.error}`);
      }
    } catch (err) {
      alert("An unexpected error occurred during bulk update");
    }
  };

  const handleGemstoneSelect = (gemstoneId: string, selected: boolean) => {
    const newSelected = new Set(selectedGemstones);
    if (selected) {
      newSelected.add(gemstoneId);
    } else {
      newSelected.delete(gemstoneId);
    }
    setSelectedGemstones(newSelected);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const getStockStatusColor = (inStock: boolean | null) => {
    const isInStock = inStock ?? false;
    return isInStock
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getStockStatusIcon = (inStock: boolean | null) => {
    const isInStock = inStock ?? false;
    return isInStock ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <AlertTriangle className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Inventory Management
            </h2>
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20"
            >
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Inventory Management
            </h2>
            <p className="text-muted-foreground">
              Error loading inventory data
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  Error Loading Inventory
                </h3>
                <p className="text-red-800 dark:text-red-200">
                  {error || "No inventory data available"}
                </p>
                <Button onClick={loadInventoryData} className="mt-3">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, topValued, outOfStock, lowStock, recentUpdates } = report;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Inventory Management
          </h2>
          <p className="text-muted-foreground">
            Track stock levels, manage inventory, and monitor alerts
          </p>
        </div>

        <Button onClick={loadInventoryData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Inventory Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.totalGemstones.toLocaleString()}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Total Gemstones
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats.inStock.toLocaleString()}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  In Stock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {stats.outOfStock.toLocaleString()}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Out of Stock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {formatPrice(stats.totalValue)}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Total Value
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        {alert.message}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p>No active alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Valued Gemstones */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Valued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topValued.slice(0, 5).map((gemstone) => (
                <div
                  key={gemstone.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {gemstone.name} {gemstone.color}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {gemstone.cut} cut
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatPrice(gemstone.price_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUpdates.slice(0, 5).map((gemstone) => (
                <div
                  key={gemstone.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {gemstone.name} {gemstone.color}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(gemstone.updated_at || "").toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStockStatusIcon(gemstone.in_stock)}
                    <Badge className={getStockStatusColor(gemstone.in_stock)}>
                      {gemstone.in_stock ? "In Stock" : "Out"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Out of Stock Items */}
      {outOfStock.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Out of Stock ({outOfStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outOfStock.slice(0, 6).map((gemstone) => (
                <div
                  key={gemstone.id}
                  className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        {gemstone.name} {gemstone.color}
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {gemstone.cut} cut • {gemstone.serial_number}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedGemstones.has(gemstone.id)}
                      onChange={(e) =>
                        handleGemstoneSelect(gemstone.id, e.target.checked)
                      }
                      className="rounded border-red-300"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      {formatPrice(gemstone.price_amount)}
                    </span>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Inventory Update */}
      {selectedGemstones.size > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Bulk Inventory Update ({selectedGemstones.size} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock Status</label>
                <select
                  value={bulkUpdate.inStock.toString()}
                  onChange={(e) =>
                    setBulkUpdate((prev) => ({
                      ...prev,
                      inStock: e.target.value === "true",
                    }))
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Days</label>
                <Input
                  type="number"
                  placeholder="7"
                  value={bulkUpdate.deliveryDays}
                  onChange={(e) =>
                    setBulkUpdate((prev) => ({
                      ...prev,
                      deliveryDays: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Input
                  placeholder="Stock update"
                  value={bulkUpdate.reason}
                  onChange={(e) =>
                    setBulkUpdate((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleBulkInventoryUpdate}
                disabled={!bulkUpdate.reason.trim()}
              >
                <Package className="w-4 h-4 mr-2" />
                Apply Bulk Update
              </Button>

              <Button
                variant="outline"
                onClick={() => setSelectedGemstones(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
