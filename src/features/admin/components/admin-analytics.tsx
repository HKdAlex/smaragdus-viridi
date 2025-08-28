"use client";

import { BarChart3, DollarSign, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">
          Analytics & Insights
        </h2>
        <p className="text-muted-foreground">
          Track performance metrics and business insights
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">$45,231</p>
                <p className="text-sm text-muted-foreground">
                  Revenue This Month
                </p>
                <p className="text-xs text-green-600">+23% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">
                  Orders This Month
                </p>
                <p className="text-xs text-blue-600">+5% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">3,429</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-xs text-purple-600">+8% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">$289</p>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-xs text-orange-600">+12% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Placeholder */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle>Advanced Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Analytics Dashboard Coming Soon
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              The comprehensive analytics and insights dashboard will be
              implemented in Phase 5, including charts, reports, and business
              intelligence features.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Sales Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Revenue trends, conversion rates, and sales performance
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">User Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  User behavior, engagement metrics, and retention data
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Inventory Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Stock levels, turnover rates, and inventory optimization
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
