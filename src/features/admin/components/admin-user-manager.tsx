"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Shield, UserCheck, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { StatisticsService } from "../services/statistics-service";
import { useTranslations } from "next-intl";

export function AdminUserManager() {
  const t = useTranslations("admin");
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await StatisticsService.getUserActivityStats();

      if (result.success) {
        setUserStats({
          totalUsers: result.data.totalUsers,
          activeUsers: result.data.activeUsers,
          premiumUsers: result.data.premiumUsers,
          admins: result.data.admins,
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Failed to load user statistics");
      console.error("Failed to load user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {t("users.title")}
            </h2>
            <p className="text-muted-foreground">{t("users.subtitle")}</p>
          </div>
        </div>
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {t("users.title")}
            </h2>
            <p className="text-muted-foreground">{t("users.subtitle")}</p>
          </div>
        </div>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadUserStats} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {t("users.title")}
          </h2>
          <p className="text-muted-foreground">{t("users.subtitle")}</p>
        </div>

        <Button className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          {t("users.addUser")}
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">
                  {t("users.stats.totalUsers")}
                </p>
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
                <p className="text-2xl font-bold">{userStats.activeUsers}</p>
                <p className="text-sm text-muted-foreground">
                  {t("users.stats.activeUsers")}
                </p>
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
                <p className="text-2xl font-bold">{userStats.premiumUsers}</p>
                <p className="text-sm text-muted-foreground">
                  {t("users.stats.vipUsers")}
                </p>
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
                <p className="text-2xl font-bold">{userStats.admins}</p>
                <p className="text-sm text-muted-foreground">
                  {t("users.stats.admins")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Placeholder */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle>{t("users.system.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t("users.system.comingSoon")}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("users.system.description")}
            </p>

            <div className="flex justify-center gap-3">
              <Button variant="outline" disabled>
                <UserPlus className="w-4 h-4 mr-2" />
                {t("users.addUser")}
              </Button>
              <Button variant="outline" disabled>
                <Shield className="w-4 h-4 mr-2" />
                {t("users.manageRoles")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
