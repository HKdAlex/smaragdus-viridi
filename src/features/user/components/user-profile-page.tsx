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

interface UserProfilePageProps {
  user: UserProfile;
  stats: ProfileStats;
  onUpdateProfile: (updates: any) => Promise<void>;
  onUpdatePreferences: (preferences: any) => Promise<void>;
  onChangePassword: (request: any) => Promise<void>;
}

export function UserProfilePage({
  user,
  stats,
  onUpdateProfile,
  onUpdatePreferences,
  onChangePassword,
}: UserProfilePageProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
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
        return "Premium Customer";
      case "regular_customer":
        return "Regular Customer";
      case "admin":
        return "Administrator";
      default:
        return "Guest";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and view your order history
            </p>
          </div>
          <Badge
            variant="outline"
            className={`px-3 py-1 ${getRoleBadgeColor(user.role)}`}
          >
            {getRoleDisplayName(user.role)}
          </Badge>
        </div>

        {/* Profile Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.averageOrderValue > 0
                  ? `Avg: ${formatCurrency(
                      stats.averageOrderValue,
                      user.preferred_currency
                    )}`
                  : "No orders yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalSpent, user.preferred_currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Since {new Date(stats.memberSince).getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.favoriteGemstones}
              </div>
              <p className="text-xs text-muted-foreground">Saved gemstones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cartItems}</div>
              <p className="text-xs text-muted-foreground">Items in cart</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="space-y-6">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Email Address
                      </p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          Phone Number
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Member since{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Account Created
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preferences</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Currency:</span>
                        <span className="ml-2 font-medium">
                          {user.preferred_currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Language:</span>
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
                    Recent Orders
                  </CardTitle>
                  <CardDescription>Your latest order activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Order history will appear here
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <a href="#orders">View All Orders</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="orders">
            <OrderHistory />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ActivityFeed />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <ProfileSettings
              user={user}
              onUpdateProfile={onUpdateProfile}
              onChangePassword={onChangePassword}
            />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}
