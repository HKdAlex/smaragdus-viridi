"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";
import { Eye, EyeOff, Lock, Save, User } from "lucide-react";
import type {
  ChangePasswordRequest,
  CurrencyCode,
  UpdateProfileRequest,
  UserProfile,
} from "../types/user-profile.types";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdateProfile: (updates: UpdateProfileRequest) => Promise<void>;
  onChangePassword: (request: ChangePasswordRequest) => Promise<void>;
}

export function ProfileSettings({
  user,
  onUpdateProfile,
  onChangePassword,
}: ProfileSettingsProps) {
  const t = useTranslations("user.settings");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    phone: user.phone || "",
    preferred_currency: user.preferred_currency,
    language_preference: user.language_preference,
    // Preferences will be loaded from separate preferences table
    email_notifications: true, // default value
    order_updates: true, // default value
    marketing_emails: false, // default value
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // UI state
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleProfileUpdate = async () => {
    setUpdatingProfile(true);
    setProfileMessage(null);

    try {
      await onUpdateProfile(profileForm);
      setProfileMessage({
        type: "success",
        text: t("profileUpdatedSuccess"),
      });
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("profileUpdateFailed"),
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: "error", text: t("passwordsDoNotMatch") });
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({
        type: "error",
        text: t("passwordTooShort"),
      });
      return;
    }

    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      await onChangePassword(passwordForm);
      setPasswordMessage({
        type: "success",
        text: t("passwordChangedSuccess"),
      });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : t("passwordChangeFailed"),
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const currencies: { value: CurrencyCode; label: string }[] = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
    { value: "RUB", label: "Russian Ruble (₽)" },
    { value: "CHF", label: "Swiss Franc (CHF)" },
    { value: "JPY", label: "Japanese Yen (¥)" },
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "ru", label: "Русский" },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            {t("personalInfo")}
          </CardTitle>
          <CardDescription>{t("preferences")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("enterFullName")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder={t("enterPhone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("currency")}</Label>
              <Select
                value={profileForm.preferred_currency || undefined}
                onValueChange={(value) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    preferred_currency: value as CurrencyCode,
                  }))
                }
              >
                <SelectTrigger>
                  <span className="text-sm">
                    {profileForm.preferred_currency ? (
                      currencies.find(
                        (c) => c.value === profileForm.preferred_currency
                      )?.label || profileForm.preferred_currency
                    ) : (
                      <span className="text-muted-foreground">
                        {t("selectCurrency")}
                      </span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t("language")}</Label>
              <Select
                value={profileForm.language_preference}
                onValueChange={(value) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    language_preference: value as "en" | "ru",
                  }))
                }
              >
                <SelectTrigger>
                  <span className="text-sm">
                    {profileForm.language_preference ? (
                      languages.find(
                        (l) => l.value === profileForm.language_preference
                      )?.label || profileForm.language_preference
                    ) : (
                      <span className="text-muted-foreground">
                        {t("selectLanguage")}
                      </span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">
              {t("notificationPreferences")}
            </h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={profileForm.email_notifications}
                  onCheckedChange={(checked) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      email_notifications: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="email-notifications" className="text-sm">
                  {t("emailNotifications")}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="order-updates"
                  checked={profileForm.order_updates}
                  onCheckedChange={(checked) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      order_updates: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="order-updates" className="text-sm">
                  {t("orderUpdates")}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing-emails"
                  checked={profileForm.marketing_emails}
                  onCheckedChange={(checked) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      marketing_emails: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="marketing-emails" className="text-sm">
                  {t("marketingEmails")}
                </Label>
              </div>
            </div>
          </div>

          {profileMessage && (
            <div
              className={`p-4 rounded-lg ${
                profileMessage.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleProfileUpdate} disabled={updatingProfile}>
              {updatingProfile ? (
                t("updating")
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t("saveChanges")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            {t("changePassword")}
          </CardTitle>
          <CardDescription>{t("changePasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t("currentPassword")}</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      current_password: e.target.value,
                    }))
                  }
                  placeholder={t("enterCurrentPassword")}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      current: !prev.current,
                    }))
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">{t("newPassword")}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      new_password: e.target.value,
                    }))
                  }
                  placeholder={t("enterNewPassword")}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      new: !prev.new,
                    }))
                  }
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }))
                  }
                  placeholder={t("confirmNewPassword")}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {passwordMessage && (
            <div
              className={`p-4 rounded-lg ${
                passwordMessage.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              variant="outline"
            >
              {changingPassword ? (
                t("changing")
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t("changePassword")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("accountInformation")}</CardTitle>
          <CardDescription>{t("accountDetails")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <div className="flex items-center space-x-2">
                <Input value={user.email} readOnly className="bg-muted" />
                <Badge variant="secondary">{t("verified")}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("accountRole")}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={(user.role || "guest")
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  readOnly
                  className="bg-muted"
                />
                {(user.discount_percentage || 0) > 0 && (
                  <Badge variant="outline" className="bg-yellow-50">
                    {user.discount_percentage}% {t("discount")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("memberSince")}</Label>
              <Input
                value={
                  user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : t("unknown")
                }
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("lastUpdated")}</Label>
              <Input
                value={
                  user.updated_at
                    ? new Date(user.updated_at).toLocaleDateString()
                    : t("unknown")
                }
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
