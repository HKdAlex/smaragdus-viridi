"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Database, Palette, Settings, Shield } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";

export function AdminSettings() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">
          {t("settings.title")}
        </h2>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Settings */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t("settings.security.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.security.twoFactor.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.security.twoFactor.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.security.sessionTimeout.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.security.sessionTimeout.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.security.passwordPolicy.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.security.passwordPolicy.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {t("settings.database.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.database.backup.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.database.backup.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.database.retention.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.database.retention.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.database.performance.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.database.performance.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI Settings */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t("settings.ui.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("settings.ui.theme.title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.ui.theme.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("settings.ui.layout.title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.ui.layout.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.ui.notifications.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.ui.notifications.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t("settings.general.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.general.site.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.general.site.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.general.email.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.general.email.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("settings.general.api.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.general.api.description")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("settings.configure")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Placeholder */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle>{t("settings.advanced.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t("settings.advanced.comingSoon")}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("settings.advanced.description")}
            </p>

            <div className="flex justify-center gap-3">
              <Button variant="outline" disabled>
                <Shield className="w-4 h-4 mr-2" />
                {t("settings.security.title")}
              </Button>
              <Button variant="outline" disabled>
                <Database className="w-4 h-4 mr-2" />
                {t("settings.database.title")}
              </Button>
              <Button variant="outline" disabled>
                <Palette className="w-4 h-4 mr-2" />
                {t("settings.ui.title")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
