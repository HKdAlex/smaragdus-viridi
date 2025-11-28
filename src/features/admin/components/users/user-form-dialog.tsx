"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UserWithAuth, CreateUserRequest, UpdateUserRequest } from "../../types/user-management.types";
import type { UserRole, CurrencyCode } from "@/shared/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithAuth | null;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
}

const USER_ROLES: UserRole[] = ["guest", "regular_customer", "premium_customer", "admin"];
const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "GBP", "RUB", "CHF", "JPY", "KZT"];

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
}: UserFormDialogProps) {
  const t = useTranslations("admin.users");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.auth_email || "",
    phone: user?.phone || "",
    role: (user?.role || "regular_customer") as UserRole,
    preferred_currency: (user?.preferred_currency || "USD") as CurrencyCode,
    password: "",
    send_invitation: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await onSubmit({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          preferred_currency: formData.preferred_currency,
        } as UpdateUserRequest);
      } else {
        await onSubmit({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          preferred_currency: formData.preferred_currency,
          password: formData.password || undefined,
          send_invitation: formData.send_invitation,
        } as CreateUserRequest);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? t("editUser") : t("createUser")}</DialogTitle>
          <DialogDescription>
            {user ? "Update user information" : "Create a new user account"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("form.name")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">{t("form.email")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          {!user && (
            <div>
              <Label htmlFor="password">{t("form.password")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t("form.passwordPlaceholder")}
              />
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="send_invitation"
                  checked={formData.send_invitation}
                  onChange={(e) =>
                    setFormData({ ...formData, send_invitation: e.target.checked })
                  }
                />
                <Label htmlFor="send_invitation" className="text-sm font-normal">
                  {t("form.sendInvite")}
                </Label>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="phone">{t("form.phone")}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="role">{t("form.role")}</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as UserRole })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="currency">{t("form.currency")}</Label>
            <Select
              value={formData.preferred_currency}
              onValueChange={(value) =>
                setFormData({ ...formData, preferred_currency: value as CurrencyCode })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : user ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

