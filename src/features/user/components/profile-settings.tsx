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
  SelectValue,
} from "@/shared/components/ui/select";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("user");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    phone: user.phone || "",
    preferred_currency: user.preferred_currency,
    language_preference: user.language_preference,
    email_notifications: user.email_notifications,
    order_updates: user.order_updates,
    marketing_emails: user.marketing_emails,
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
        text: "Profile updated successfully!",
      });
    } catch (error) {
      setProfileMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 8 characters long",
      });
      return;
    }

    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      await onChangePassword(passwordForm);
      setPasswordMessage({
        type: "success",
        text: "Password changed successfully!",
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
          error instanceof Error ? error.message : "Failed to change password",
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
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select
                value={profileForm.preferred_currency}
                onValueChange={(value) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    preferred_currency: value as CurrencyCode,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
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
              <Label htmlFor="language">Language</Label>
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
                  <SelectValue placeholder="Select language" />
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
            <h4 className="text-sm font-medium">Notification Preferences</h4>

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
                  Email notifications for important updates
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
                  Order status updates and tracking information
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
                  Marketing emails and special offers
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
                "Updating..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password for better security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
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
                  placeholder="Enter current password"
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
              <Label htmlFor="new-password">New Password</Label>
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
                  placeholder="Enter new password"
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
              <Label htmlFor="confirm-password">Confirm New Password</Label>
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
                  placeholder="Confirm new password"
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
                "Changing..."
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and membership information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center space-x-2">
                <Input value={user.email} readOnly className="bg-muted" />
                <Badge variant="secondary">Verified</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Role</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={user.role
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  readOnly
                  className="bg-muted"
                />
                {user.discount_percentage > 0 && (
                  <Badge variant="outline" className="bg-yellow-50">
                    {user.discount_percentage}% Discount
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <Input
                value={new Date(user.created_at).toLocaleDateString()}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Last Updated</Label>
              <Input
                value={new Date(user.updated_at).toLocaleDateString()}
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
