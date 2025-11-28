"use client";

import {
  Card,
  CardContent,
} from "@/shared/components/ui/card";
import { Shield, UserCheck, Users, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserStatistics } from "../../types/user-management.types";

interface UserStatisticsCardsProps {
  statistics: UserStatistics;
  loading?: boolean;
}

export function UserStatisticsCards({
  statistics,
  loading = false,
}: UserStatisticsCardsProps) {
  const t = useTranslations("admin.users.stats");

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20"
          >
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-muted rounded-lg mb-4"></div>
                <div className="h-6 w-16 bg-muted rounded mb-2"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statistics.totalUsers}</p>
              <p className="text-sm text-muted-foreground">{t("totalUsers")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statistics.activeUsers}</p>
              <p className="text-sm text-muted-foreground">{t("activeUsers")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statistics.premiumUsers}</p>
              <p className="text-sm text-muted-foreground">{t("vipUsers")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statistics.admins}</p>
              <p className="text-sm text-muted-foreground">{t("admins")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

