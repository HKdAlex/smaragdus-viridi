"use client";

import {
  Calendar,
  Heart,
  Package,
  Plus,
  Settings,
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

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import type { UserActivity } from "../types/user-profile.types";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface ActivityFeedProps {
  activities?: UserActivity[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ActivityFeed({
  activities = [],
  loading = false,
  onLoadMore,
  hasMore = false,
}: ActivityFeedProps) {
  const t = useTranslations("user.activity");
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order_placed":
        return <Package className="w-4 h-4" />;
      case "order_status_changed":
        return <ShoppingCart className="w-4 h-4" />;
      case "profile_updated":
        return <User className="w-4 h-4" />;
      case "password_changed":
        return <Settings className="w-4 h-4" />;
      case "favorite_added":
        return <Heart className="w-4 h-4" />;
      case "favorite_removed":
        return <Heart className="w-4 h-4" />;
      case "cart_updated":
        return <Plus className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "order_placed":
        return "text-green-600 bg-green-50 border-green-200";
      case "order_status_changed":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "profile_updated":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "password_changed":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "favorite_added":
        return "text-pink-600 bg-pink-50 border-pink-200";
      case "favorite_removed":
        return "text-red-600 bg-red-50 border-red-200";
      case "cart_updated":
        return "text-indigo-600 bg-indigo-50 border-indigo-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getActivityTitle = (type: string) => {
    switch (type) {
      case "order_placed":
        return t("titles.orderPlaced");
      case "order_status_changed":
        return t("titles.orderStatusUpdated");
      case "profile_updated":
        return t("titles.profileUpdated");
      case "password_changed":
        return t("titles.passwordChanged");
      case "favorite_added":
        return t("titles.addedToFavorites");
      case "favorite_removed":
        return t("titles.removedFromFavorites");
      case "cart_updated":
        return t("titles.cartUpdated");
      default:
        return t("titles.activity");
    }
  };

  const formatActivityDescription = (activity: UserActivity) => {
    switch (activity.type) {
      case "order_placed":
        return t("descriptions.orderPlaced", {
          total: activity.metadata?.total || t("descriptions.anItem"),
        });
      case "order_status_changed":
        return t("descriptions.orderStatusChanged", {
          status: activity.metadata?.new_status || t("descriptions.updated"),
        });
      case "profile_updated":
        return t("descriptions.profileUpdated");
      case "password_changed":
        return t("descriptions.passwordChanged");
      case "favorite_added":
        return t("descriptions.favoriteAdded", {
          item: activity.metadata?.gemstone_name || t("descriptions.anItem"),
        });
      case "favorite_removed":
        return t("descriptions.favoriteRemoved", {
          item: activity.metadata?.gemstone_name || t("descriptions.anItem"),
        });
      case "cart_updated":
        return t("descriptions.cartUpdated", {
          action: activity.metadata?.action || t("descriptions.changes"),
        });
      default:
        return activity.description || t("descriptions.activityOccurred");
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("title")}</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("noActivity")}</h3>
            <p className="text-muted-foreground text-center">
              {t("noActivityDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <Card key={activity.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  {/* Activity Icon */}
                  <div
                    className={`p-2 rounded-full border ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        {getActivityTitle(activity.type)}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(activity.timestamp), "MMM d, yyyy")}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      {formatActivityDescription(activity)}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(activity.timestamp), "h:mm a")}
                    </p>
                  </div>
                </div>

                {/* Separator for all but last item */}
                {index < activities.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </CardContent>
            </Card>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={onLoadMore} disabled={loading}>
                {loading ? t("loading") : t("loadMore")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Activity Summary */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("summary.title")}</CardTitle>
            <CardDescription>{t("summary.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {activities.filter((a) => a.type === "order_placed").length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("summary.ordersPlaced")}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {
                    activities.filter((a) => a.type === "profile_updated")
                      .length
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("summary.profileUpdates")}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {activities.filter((a) => a.type.includes("favorite")).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("summary.favoritesChanged")}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {activities.filter((a) => a.type === "cart_updated").length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("summary.cartUpdates")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
