"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  BarChart3,
  Edit,
  Gem,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AdminAnalytics } from "./admin-analytics";
import { AdminGemstoneManager } from "./admin-gemstone-manager";
import { AdminPriceInventoryManager } from "./admin-price-inventory-manager";
import { AdminSettings } from "./admin-settings";
import { AdminUserManager } from "./admin-user-manager";
// Import admin components (will be created in subsequent phases)
import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";
import { useAdmin } from "../context/admin-context";
import { StatisticsService } from "../services/statistics-service";
import { OrderManagement } from "./order-management";

type AdminTab =
  | "dashboard"
  | "orders"
  | "gemstones"
  | "pricing"
  | "users"
  | "analytics"
  | "settings";

const getAdminTabs = (t: any) => [
  {
    id: "dashboard" as AdminTab,
    name: t("navigation.dashboard"),
    icon: BarChart3,
    description: t("tabs.dashboard"),
  },
  {
    id: "orders" as AdminTab,
    name: t("navigation.orders"),
    icon: Package,
    description: t("tabs.orders"),
  },
  {
    id: "gemstones" as AdminTab,
    name: t("navigation.gemstones"),
    icon: Gem,
    description: t("tabs.gemstones"),
  },
  {
    id: "pricing" as AdminTab,
    name: t("navigation.pricing"),
    icon: TrendingUp,
    description: t("tabs.pricing"),
  },
  {
    id: "users" as AdminTab,
    name: t("navigation.users"),
    icon: Users,
    description: t("tabs.users"),
  },
  {
    id: "analytics" as AdminTab,
    name: t("navigation.analytics"),
    icon: TrendingUp,
    description: t("tabs.analytics"),
  },
  {
    id: "settings" as AdminTab,
    name: t("navigation.settings"),
    icon: Settings,
    description: t("tabs.settings"),
  },
];

export function AdminDashboard() {
  const { user, profile, signOut, isLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations("admin");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
              <Shield className="w-6 h-6 text-primary" />
              {t("dashboard.accessRequired")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              {t("dashboard.privilegesRequired")}
            </p>
            <Button
              onClick={() => (window.location.href = "/admin/login")}
              className="min-h-[48px] w-full"
            >
              {t("dashboard.goToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardOverview />;
      case "orders":
        return <OrderManagement />;
      case "gemstones":
        return <AdminGemstoneManager />;
      case "pricing":
        return <AdminPriceInventoryManager />;
      case "users":
        return <AdminUserManager />;
      case "analytics":
        return <AdminAnalytics />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden min-h-[44px] min-w-[44px]"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg sm:text-xl break-words">
                  {t("header.title")}
                </h1>
                <p className="text-sm text-muted-foreground break-words leading-relaxed">
                  {t("header.welcomeBack", { name: profile.name })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="items-center gap-2 min-h-[44px] hidden sm:flex"
            >
              <LogOut className="w-4 h-4" />
              {t("header.signOut")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={signOut}
              className="sm:hidden min-h-[44px] min-w-[44px]"
              title={t("header.signOut")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 transition-transform duration-300 ease-in-out
          fixed md:static top-16 md:top-0 left-0 z-40
          w-64 sm:w-80 h-[calc(100vh-4rem)] md:h-screen
          bg-background/95 backdrop-blur-sm border-r border-border
          overflow-y-auto shadow-lg md:shadow-none
        `}
        >
          <nav className="p-4 space-y-2">
            {getAdminTabs(t).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-3 h-auto p-3 sm:p-4 min-h-[56px] text-left py-4"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false); // Close mobile sidebar
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base break-words">
                      {tab.name}
                    </div>
                    <div
                      className={`text-xs sm:text-sm break-words leading-relaxed whitespace-normal overflow-wrap-anywhere ${
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tab.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto min-h-0">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

// Dashboard Overview Component
function AdminDashboardOverview() {
  const t = useTranslations("admin.dashboard");
  const [stats, setStats] = useState<
    Array<{
      title: string;
      value: string;
      change: string;
      trend: "up" | "down" | "neutral";
      icon: React.ComponentType<{ className?: string }>;
    }>
  >([
    {
      title: t("stats.totalGemstones"),
      value: t("stats.loading"),
      change: "",
      trend: "neutral",
      icon: Gem,
    },
    {
      title: t("stats.activeUsers"),
      value: t("stats.loading"),
      change: "",
      trend: "neutral",
      icon: Users,
    },
    {
      title: t("stats.revenue"),
      value: t("stats.loading"),
      change: "",
      trend: "neutral",
      icon: TrendingUp,
    },
    {
      title: t("stats.orders"),
      value: t("stats.loading"),
      change: "",
      trend: "neutral",
      icon: BarChart3,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await StatisticsService.getDashboardStats();

      if (result.success) {
        const dashboardStats = result.data;

        setStats([
          {
            title: t("stats.totalGemstones"),
            value: StatisticsService.formatNumber(
              dashboardStats.totalGemstones
            ),
            change: `+${dashboardStats.changes.totalGemstones.percentage}%`,
            trend: dashboardStats.changes.totalGemstones.trend,
            icon: Gem,
          },
          {
            title: t("stats.activeUsers"),
            value: StatisticsService.formatNumber(dashboardStats.activeUsers),
            change: `+${dashboardStats.changes.activeUsers.percentage}%`,
            trend: dashboardStats.changes.activeUsers.trend,
            icon: Users,
          },
          {
            title: t("stats.revenue"),
            value: StatisticsService.formatCurrency(
              dashboardStats.totalRevenue
            ),
            change: `+${dashboardStats.changes.totalRevenue.percentage}%`,
            trend: dashboardStats.changes.totalRevenue.trend,
            icon: TrendingUp,
          },
          {
            title: t("stats.orders"),
            value: StatisticsService.formatNumber(dashboardStats.totalOrders),
            change: `+${dashboardStats.changes.totalOrders.percentage}%`,
            trend: dashboardStats.changes.totalOrders.trend,
            icon: BarChart3,
          },
        ]);
      } else {
        setError(result.error);
        console.error("Failed to load dashboard stats:", result.error);
      }
    } catch (error) {
      setError(t("stats.loadError"));
      console.error("Dashboard stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {t("overview.title")}
          </h2>
          <p className="text-muted-foreground">{t("overview.description")}</p>
        </div>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">
                {t("stats.loadErrorTitle")}
              </h3>
              <p className="text-destructive mb-4 text-sm">{error}</p>
              <Button
                onClick={loadDashboardStats}
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 min-h-[44px]"
              >
                {t("stats.retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {t("overview.title")}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("overview.description")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">
                      {stat.title}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground break-words">
                      {stat.value}
                    </p>
                    <p
                      className={`text-xs sm:text-sm flex items-center gap-1 ${
                        stat.trend === "up"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <TrendingUp className="w-3 h-3 flex-shrink-0" />
                      <span className="break-words">
                        {stat.change} {t("stats.fromLastMonth")}
                      </span>
                    </p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            {t("quickActions.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button className="flex items-center gap-3 h-auto p-4 justify-start min-h-[60px] text-left">
              <Upload className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-sm sm:text-base break-words">
                  {t("quickActions.uploadGemstones")}
                </div>
                <div className="text-xs sm:text-sm text-primary-foreground/80 line-clamp-2">
                  {t("quickActions.uploadGemstonesDesc")}
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-3 h-auto p-4 justify-start min-h-[60px] text-left"
            >
              <Edit className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-sm sm:text-base break-words">
                  {t("quickActions.editPrices")}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {t("quickActions.editPricesDesc")}
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-3 h-auto p-4 justify-start min-h-[60px] text-left"
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-sm sm:text-base break-words">
                  {t("quickActions.userManagement")}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {t("quickActions.userManagementDesc")}
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            {t("recentActivity.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 sm:gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base break-words">
                  {t("recentActivity.newGemstoneAdded")}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("recentActivity.twoHoursAgo")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base break-words">
                  {t("recentActivity.userPromoted")}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("recentActivity.fiveHoursAgo")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base break-words">
                  {t("recentActivity.priceUpdateApplied", { count: 15 })}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("recentActivity.oneDayAgo")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
