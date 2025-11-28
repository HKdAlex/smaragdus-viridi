"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type {
  ChangePasswordRequest,
  CurrencyCode,
  UpdateProfileRequest,
  UserProfile,
} from "../types/user-profile.types";
import { Eye, EyeOff, Lock, Save, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { UserPreferencesService } from "../services/user-preferences-service";
import type { UserPreferences } from "../services/user-preferences-service";
import {
  updateProfileSchema,
  simplePasswordSchema,
  formatZodErrors,
} from "../validation/profile-schemas";

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdateProfile: (updates: UpdateProfileRequest) => Promise<void>;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  onChangePassword: (request: ChangePasswordRequest) => Promise<void>;
}

export function ProfileSettings({
  user,
  onUpdateProfile,
  onUpdatePreferences,
  onChangePassword,
}: ProfileSettingsProps) {
  const t = useTranslations("user.settings");
  const router = useRouter();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    phone: user.phone || "",
    preferred_currency: user.preferred_currency,
    language_preference:
      user.language_preference === "en" || user.language_preference === "ru"
        ? user.language_preference
        : ("en" as "en" | "ru"),
  });

  // Preferences state (separate from profile form)
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    order_updates: true,
    marketing_emails: false,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [preferencesMessage, setPreferencesMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  // Validation errors state
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      setLoadingPreferences(true);
      try {
        const preferencesService = new UserPreferencesService();
        const loadedPreferences =
          await preferencesService.getUserNotificationPreferences(user.user_id);
        if (loadedPreferences) {
          setPreferences({
            email_notifications: loadedPreferences.email_notifications,
            order_updates: loadedPreferences.order_updates,
            marketing_emails: loadedPreferences.marketing_emails,
          });
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [user.user_id]);

  // Handle preferences update
  const handlePreferencesUpdate = async (
    key: keyof typeof preferences,
    value: boolean
  ) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    setPreferencesMessage(null);

    try {
      await onUpdatePreferences(updatedPreferences);
      setPreferencesMessage({
        type: "success",
        text: t("settingsSaved") || "Preferences saved successfully",
      });
      // Clear message after 3 seconds
      setTimeout(() => setPreferencesMessage(null), 3000);
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      setPreferencesMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : t("profileUpdateFailed") || "Failed to save preferences",
      });
    }
  };

  const handleProfileUpdate = async () => {
    setProfileErrors({});
    setProfileMessage(null);

    // Validate with Zod schema
    const validation = updateProfileSchema.safeParse(profileForm);
    if (!validation.success) {
      setProfileErrors(formatZodErrors(validation.error));
      return;
    }

    setUpdatingProfile(true);

    try {
      await onUpdateProfile(profileForm);
      setProfileMessage({
        type: "success",
        text: t("profileUpdatedSuccess"),
      });
      // Refresh page data after successful update
      router.refresh();
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
    setPasswordErrors({});
    setPasswordMessage(null);

    // Validate with Zod schema
    const validation = simplePasswordSchema.safeParse(passwordForm);
    if (!validation.success) {
      setPasswordErrors(formatZodErrors(validation.error));
      return;
    }

    setChangingPassword(true);

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
                className={profileErrors.name ? "border-red-500" : ""}
              />
              {profileErrors.name && (
                <p className="text-sm text-red-500">{profileErrors.name}</p>
              )}
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
                className={profileErrors.phone ? "border-red-500" : ""}
              />
              {profileErrors.phone && (
                <p className="text-sm text-red-500">{profileErrors.phone}</p>
              )}
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

            {loadingPreferences ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-5 bg-muted rounded w-3/4" />
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-notifications"
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) =>
                        handlePreferencesUpdate(
                          "email_notifications",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="email-notifications" className="text-sm">
                      {t("emailNotifications")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="order-updates"
                      checked={preferences.order_updates}
                      onCheckedChange={(checked) =>
                        handlePreferencesUpdate(
                          "order_updates",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="order-updates" className="text-sm">
                      {t("orderUpdates")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketing-emails"
                      checked={preferences.marketing_emails}
                      onCheckedChange={(checked) =>
                        handlePreferencesUpdate(
                          "marketing_emails",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="marketing-emails" className="text-sm">
                      {t("marketingEmails")}
                    </Label>
                  </div>
                </div>

                {preferencesMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      preferencesMessage.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {preferencesMessage.text}
                  </div>
                )}
              </>
            )}
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
                  className={passwordErrors.current_password ? "border-red-500" : ""}
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
              {passwordErrors.current_password && (
                <p className="text-sm text-red-500">{passwordErrors.current_password}</p>
              )}
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
                  className={passwordErrors.new_password ? "border-red-500" : ""}
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
              {passwordErrors.new_password && (
                <p className="text-sm text-red-500">{passwordErrors.new_password}</p>
              )}
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
                  className={passwordErrors.confirm_password ? "border-red-500" : ""}
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
              {passwordErrors.confirm_password && (
                <p className="text-sm text-red-500">{passwordErrors.confirm_password}</p>
              )}
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
                <Input value={user.email || ""} readOnly className="bg-muted" />
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
