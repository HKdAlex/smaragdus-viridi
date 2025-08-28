"use client";

import {
  BarChart3,
  Edit,
  Gem,
  LogOut,
  Menu,
  Settings,
  Shield,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useEffect, useState } from "react";

import { AdminAnalytics } from "./admin-analytics";
import { AdminGemstoneManager } from "./admin-gemstone-manager";
import { AdminPriceInventoryManager } from "./admin-price-inventory-manager";
import { AdminSettings } from "./admin-settings";
import { AdminUserManager } from "./admin-user-manager";
// Import admin components (will be created in subsequent phases)
import { Button } from "@/shared/components/ui/button";
import { StatisticsService } from "../services/statistics-service";
import { useAdmin } from "../context/admin-context";

type AdminTab =
  | "dashboard"
  | "gemstones"
  | "pricing"
  | "users"
  | "analytics"
  | "settings";

const adminTabs: Array<{
  id: AdminTab;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: BarChart3,
    description: "Overview and key metrics",
  },
  {
    id: "gemstones",
    name: "Gemstones",
    icon: Gem,
    description: "Manage gemstone catalog and inventory",
  },
  {
    id: "pricing",
    name: "Price & Inventory",
    icon: TrendingUp,
    description: "Pricing analytics and inventory management",
  },
  {
    id: "users",
    name: "Users",
    icon: Users,
    description: "User management and permissions",
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: TrendingUp,
    description: "Performance metrics and insights",
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    description: "System configuration and preferences",
  },
];

export function AdminDashboard() {
  const { user, profile, signOut, isLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You need administrator privileges to access this area.
            </p>
            <Button onClick={() => (window.location.href = "/admin/login")}>
              Go to Admin Login
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
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {profile.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 transition-transform duration-200 ease-in-out
          fixed md:static top-16 md:top-0 left-0 z-40
          w-64 h-[calc(100vh-4rem)] md:h-screen
          bg-background/95 backdrop-blur-sm border-r border-border
          overflow-y-auto
        `}
        >
          <nav className="p-4 space-y-2">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-3 h-auto p-3"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false); // Close mobile sidebar
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tab.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-x-auto">{renderTabContent()}</main>
      </div>
    </div>
  );
}

// Dashboard Overview Component
function AdminDashboardOverview() {
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
      title: "Total Gemstones",
      value: "Loading...",
      change: "",
      trend: "neutral",
      icon: Gem,
    },
    {
      title: "Active Users",
      value: "Loading...",
      change: "",
      trend: "neutral",
      icon: Users,
    },
    {
      title: "Revenue",
      value: "Loading...",
      change: "",
      trend: "neutral",
      icon: TrendingUp,
    },
    {
      title: "Orders",
      value: "Loading...",
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
            title: "Total Gemstones",
            value: StatisticsService.formatNumber(
              dashboardStats.totalGemstones
            ),
            change: `+${dashboardStats.changes.totalGemstones.percentage}%`,
            trend: dashboardStats.changes.totalGemstones.trend,
            icon: Gem,
          },
          {
            title: "Active Users",
            value: StatisticsService.formatNumber(dashboardStats.activeUsers),
            change: `+${dashboardStats.changes.activeUsers.percentage}%`,
            trend: dashboardStats.changes.activeUsers.trend,
            icon: Users,
          },
          {
            title: "Revenue",
            value: StatisticsService.formatCurrency(
              dashboardStats.totalRevenue
            ),
            change: `+${dashboardStats.changes.totalRevenue.percentage}%`,
            trend: dashboardStats.changes.totalRevenue.trend,
            icon: TrendingUp,
          },
          {
            title: "Orders",
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
      setError("Failed to load dashboard statistics");
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
            Dashboard Overview
          </h2>
          <p className="text-muted-foreground">
            Monitor your gemstone business performance and manage operations
          </p>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Failed to Load Statistics
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                onClick={loadDashboardStats}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground">
          Monitor your gemstone business performance and manage operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p
                      className={`text-sm flex items-center gap-1 ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
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
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-3 h-auto p-4 justify-start">
              <Upload className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Upload Gemstones</div>
                <div className="text-sm text-muted-foreground">
                  Add new stones to catalog
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-3 h-auto p-4 justify-start"
            >
              <Edit className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Edit Prices</div>
                <div className="text-sm text-muted-foreground">
                  Update pricing across catalog
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-3 h-auto p-4 justify-start"
            >
              <Users className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">User Management</div>
                <div className="text-sm text-muted-foreground">
                  Manage user roles and access
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">New gemstone added to catalog</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">User promoted to admin</p>
                <p className="text-sm text-muted-foreground">5 hours ago</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">
                  Price update applied to 15 gemstones
                </p>
                <p className="text-sm text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
