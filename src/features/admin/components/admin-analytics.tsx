"use client";

import { BarChart3, DollarSign, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { useTranslations } from "next-intl";

export function AdminAnalytics() {
  const t = useTranslations("admin.analytics");
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("description")}
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  $45,231
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("revenueThisMonth")}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 truncate">
                  +23% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  156
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("ordersThisMonth")}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  +5% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  3,429
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("activeUsers")}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                  +8% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  $289
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("avgOrderValue")}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 truncate">
                  +12% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Placeholder */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            {t("advancedAnalyticsDashboard")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
              {t("comingSoon")}
            </h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-2">
              {t("comingSoonDescription")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="font-medium mb-2 text-foreground text-sm sm:text-base">
                  {t("salesAnalytics")}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("salesAnalyticsDescription")}
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="font-medium mb-2 text-foreground text-sm sm:text-base">
                  {t("userAnalytics")}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("userAnalyticsDescription")}
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h4 className="font-medium mb-2 text-foreground text-sm sm:text-base">
                  {t("inventoryAnalytics")}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("inventoryAnalyticsDescription")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
