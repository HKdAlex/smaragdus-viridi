"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useEffect, useState } from "react";

import { UserAuditLogsViewer } from "./users/user-audit-logs-viewer";
import { UserInvitationManager } from "./users/user-invitation-manager";
import { UserListTable } from "./users/user-list-table";
import { UserManagementService } from "../services/user-management-service";
import type { UserStatistics } from "../types/user-management.types";
import { UserStatisticsCards } from "./users/user-statistics-cards";
import { useTranslations } from "next-intl";

export function AdminUserManager() {
  const t = useTranslations("admin.users");
  const [statistics, setStatistics] = useState<UserStatistics>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    admins: 0,
    newUsersThisMonth: 0,
    regularCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await UserManagementService.getUserStatistics();

      if (result.success) {
        setStatistics(result.data);
      } else {
        setError(result.error || "Failed to load statistics");
      }
    } catch (error) {
      setError("Failed to load user statistics");
      console.error("Failed to load user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* User Statistics */}
      <UserStatisticsCards statistics={statistics} loading={loading} />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* User Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">{t("tabs.allUsers")}</TabsTrigger>
          <TabsTrigger value="invitations">{t("tabs.invitations")}</TabsTrigger>
          <TabsTrigger value="audit">{t("tabs.auditLogs")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserListTable onRefresh={loadUserStats} />
        </TabsContent>

        <TabsContent value="invitations">
          <UserInvitationManager />
        </TabsContent>

        <TabsContent value="audit">
          <UserAuditLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
