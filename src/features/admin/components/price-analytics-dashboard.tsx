"use client";

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
  BarChart3,
  Clock,
  DollarSign,
  Percent,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  PriceManagementService,
  type PriceAnalytics,
} from "../services/price-management-service";
import { useCurrency } from "@/features/currency/hooks/use-currency";

export function PriceAnalyticsDashboard() {
  const t = useTranslations("admin.priceAnalytics");
  const { formatPrice, convertPrice } = useCurrency();
  const [analytics, setAnalytics] = useState<PriceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk price update state
  const [bulkUpdate, setBulkUpdate] = useState({
    percentage: "",
    fixedAmount: "",
    reason: "",
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await PriceManagementService.getPriceAnalytics();
      if (result.success) {
        setAnalytics(result.data || null);
      } else {
        setError(result.error || "Failed to load analytics");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!analytics?.recentChanges) return;

    const percentage = parseFloat(bulkUpdate.percentage);
    const fixedAmount = parseFloat(bulkUpdate.fixedAmount);

    if (isNaN(percentage) && isNaN(fixedAmount)) {
      alert("Please enter either a percentage or fixed amount");
      return;
    }

    if (!bulkUpdate.reason.trim()) {
      alert("Please provide a reason for the price update");
      return;
    }

    try {
      // Get gemstone IDs from recent changes (mock implementation)
      const gemstoneIds = analytics.recentChanges
        .slice(0, 5)
        .map((change) => change.gemstone_id);

      const result = await PriceManagementService.bulkUpdatePrices({
        gemstoneIds,
        priceIncrease: !isNaN(percentage) ? percentage : undefined,
        fixedPrice: !isNaN(fixedAmount) ? fixedAmount : undefined,
        currency: "USD",
        reason: bulkUpdate.reason,
      });

      if (result.success) {
        alert(`Updated ${result.updated} gemstones, ${result.failed} failed`);
        setBulkUpdate({ percentage: "", fixedAmount: "", reason: "" });
        loadAnalytics(); // Refresh data
      } else {
        alert(`Bulk update failed: ${result.error}`);
      }
    } catch (err) {
      alert("An unexpected error occurred during bulk update");
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{t("title")}</h2>
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{t("title")}</h2>
            <p className="text-muted-foreground">{t("errorLoading")}</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  {t("errorLoadingTitle")}
                </h3>
                <p className="text-red-800 dark:text-red-200">{error}</p>
                <Button onClick={loadAnalytics} className="mt-3">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("retry")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{t("title")}</h2>
            <p className="text-muted-foreground">{t("noDataAvailable")}</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t("noPricingData")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("noPricingDataDescription")}
            </p>
          </CardContent>
        </Card>
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

        <Button onClick={loadAnalytics} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("refresh")}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatPrice(analytics.averagePrice, "USD")}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t("averagePrice")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatPrice(analytics.priceRange.max, "USD")}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t("highestPrice")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {analytics.currencyBreakdown.length}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {t("currencies")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {analytics.recentChanges.length}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {t("recentChanges")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Distribution */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Price Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.priceDistribution.map((dist, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {dist.range}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.max(
                            10,
                            (dist.count /
                              Math.max(
                                ...analytics.priceDistribution.map(
                                  (d) => d.count
                                )
                              )) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {dist.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Currency Breakdown */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Currency Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.currencyBreakdown.map((currency, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{currency.currency}</div>
                    <div className="text-sm text-muted-foreground">
                      {currency.count} gemstones
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatPrice(currency.avgPrice, "USD")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      avg price
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Price Changes */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Price Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentChanges.slice(0, 5).map((change) => (
              <div
                key={change.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <div className="font-medium">
                    Gemstone {change.gemstone_id.slice(0, 8)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {change.reason || t("priceUpdated")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {formatPrice(change.old_price, "USD")} →{" "}
                    {formatPrice(change.new_price, "USD")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(change.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {analytics.recentChanges.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                {t("noRecentPriceChanges")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Price Update */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            {t("bulkPriceUpdate")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("percentageIncrease")}
              </label>
              <Input
                type="number"
                placeholder="10"
                value={bulkUpdate.percentage}
                onChange={(e) =>
                  setBulkUpdate((prev) => ({
                    ...prev,
                    percentage: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fixedAmount")}</label>
              <Input
                type="number"
                placeholder="500"
                value={bulkUpdate.fixedAmount}
                onChange={(e) =>
                  setBulkUpdate((prev) => ({
                    ...prev,
                    fixedAmount: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("reason")}</label>
              <Input
                placeholder={t("marketAdjustmentPlaceholder")}
                value={bulkUpdate.reason}
                onChange={(e) =>
                  setBulkUpdate((prev) => ({ ...prev, reason: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleBulkPriceUpdate}
              disabled={!bulkUpdate.reason.trim()}
            >
              <Percent className="w-4 h-4 mr-2" />
              {t("applyBulkUpdate")}
            </Button>

            <div className="text-sm text-muted-foreground">
              {t("bulkUpdateDescription")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
