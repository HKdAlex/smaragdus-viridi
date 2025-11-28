"use client";

import {
  Calendar,
  CreditCard,
  Heart,
  Mail,
  Package,
  Phone,
  ShoppingCart,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { ProfileStats, UserProfile } from "../types/user-profile.types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

import { ActivityFeed } from "./activity-feed";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { OrderHistory } from "./order-history";
import { ProfileSettings } from "./profile-settings";
import { Separator } from "@/shared/components/ui/separator";
import { useTranslations } from "next-intl";
import { useOrderHistory } from "../hooks/use-order-history";
import { useActivityHistory } from "../hooks/use-activity-history";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import { useCurrency } from "@/features/currency/hooks/use-currency";
import { useState } from "react";

import type { UpdateProfileRequest, ChangePasswordRequest } from "../types/user-profile.types";
import type { UserPreferences } from "../services/user-preferences-service";

interface UserProfilePageProps {
  user: UserProfile;
  stats: ProfileStats;
  onUpdateProfile: (updates: UpdateProfileRequest) => Promise<void>;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  onChangePassword: (request: ChangePasswordRequest) => Promise<void>;
}

export function UserProfilePage({
  user,
  stats,
  onUpdateProfile,
  onUpdatePreferences,
  onChangePassword,
}: UserProfilePageProps) {
  const t = useTranslations("user.profile");
  const tStats = useTranslations("user.stats");
  const tSettings = useTranslations("user.settings");
  const tOverview = useTranslations("user.overview");
  const tOrders = useTranslations("user.orders");
  const tFavorites = useTranslations("user.favorites");
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");

  // Wire hooks for order and activity history
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    hasMore: ordersHasMore,
    loadMore: loadMoreOrders,
  } = useOrderHistory(user.user_id);

  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    hasMore: activitiesHasMore,
    loadMore: loadMoreActivities,
  } = useActivityHistory(user.user_id);

  // Get recent orders for overview tab (last 3)
  const recentOrders = orders.slice(0, 3);

  const formatCurrency = (amount: number, currency: string) => {
    // Use currency context for proper formatting with user's preferred currency
    return formatPrice(amount, currency as any);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "premium_customer":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "premium_customer":
        return tSettings("premiumCustomer");
      case "regular_customer":
        return tSettings("regularCustomer");
      case "admin":
        return tSettings("administrator");
      default:
        return tSettings("guest");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <Badge
            variant="outline"
            className={`px-3 py-1 ${getRoleBadgeColor(user.role || "guest")}`}
          >
            {getRoleDisplayName(user.role || "guest")}
          </Badge>
        </div>

        {/* Profile Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {tStats("totalOrders")}
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.averageOrderValue > 0
                  ? `${tStats("averageOrder")}: ${formatCurrency(
                      stats.averageOrderValue,
                      user.preferred_currency || "USD"
                    )}`
                  : tOrders("noOrdersDesc")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {tStats("totalSpent")}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  stats.totalSpent,
                  user.preferred_currency || "USD"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {tStats("memberSince")}{" "}
                {new Date(stats.memberSince).getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {tStats("favorites")}
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.favoriteGemstones}
              </div>
              <p className="text-xs text-muted-foreground">
                {tFavorites("noFavoritesDesc")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {tStats("cartItems")}
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cartItems}</div>
              <p className="text-xs text-muted-foreground">{tStats("items")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="orders">{t("tabs.orderHistory")}</TabsTrigger>
              <TabsTrigger value="activity">{t("tabs.activity")}</TabsTrigger>
              <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      {tSettings("personalInfo")}
                    </CardTitle>
                    <CardDescription>
                      {tSettings("preferences")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tSettings("fullName")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {tSettings("email")}
                        </p>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{user.phone}</p>
                          <p className="text-sm text-muted-foreground">
                            {tSettings("phone")}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {tOverview("memberSince", {
                            date: user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : "Unknown",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tOverview("accountType")}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {tSettings("preferences")}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            {tSettings("currency")}:
                          </span>
                          <span className="ml-2 font-medium">
                            {user.preferred_currency || "USD"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {tSettings("language")}:
                          </span>
                          <span className="ml-2 font-medium">
                            {user.language_preference === "en"
                              ? "English"
                              : "Русский"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      {tOrders("title")}
                    </CardTitle>
                    <CardDescription>{tOrders("subtitle")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading && recentOrders.length === 0 ? (
                      <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-lg" />
                        ))}
                      </div>
                    ) : recentOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {tOrders("noOrdersDesc")}
                        </p>
                        <Button variant="outline" className="mt-4" asChild>
                          <Link href="/catalog">{tOrders("startShopping")}</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {order.order_number?.replace(/^cq-/, "CQ-") ||
                                  `Order ${order.id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  new Date(order.created_at),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-sm">
                                {formatCurrency(
                                  order.total_amount,
                                  order.currency_code
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.items?.length || 0}{" "}
                                {order.items?.length === 1 ? "item" : "items"}
                              </p>
                            </div>
                          </div>
                        ))}
                        {orders.length > 3 && (
                          <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => setActiveTab("orders")}
                          >
                            {t("viewAllOrders")}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Order History Tab */}
            <TabsContent value="orders">
              <OrderHistory
                orders={orders}
                loading={ordersLoading}
                hasMore={ordersHasMore}
                onLoadMore={loadMoreOrders}
              />
              {ordersError && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                  <p className="text-sm">{ordersError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.refresh()}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <ActivityFeed
                activities={activities}
                loading={activitiesLoading}
                hasMore={activitiesHasMore}
                onLoadMore={loadMoreActivities}
              />
              {activitiesError && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                  <p className="text-sm">{activitiesError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.refresh()}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <ProfileSettings
                user={user}
                onUpdateProfile={onUpdateProfile}
                onUpdatePreferences={onUpdatePreferences}
                onChangePassword={onChangePassword}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
