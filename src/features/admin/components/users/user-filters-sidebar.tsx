"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import type { UserFilters } from "../../types/user-management.types";
import type { UserRole } from "@/shared/types";

interface UserFiltersSidebarProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const USER_ROLES: UserRole[] = [
  "guest",
  "regular_customer",
  "premium_customer",
  "admin",
];

export function UserFiltersSidebar({
  filters,
  onFiltersChange,
  open,
  onOpenChange,
}: UserFiltersSidebarProps) {
  const t = useTranslations("admin.users.filters");
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Debounce search
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, search: value || undefined });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filters, onFiltersChange]
  );

  const handleRoleToggle = useCallback(
    (role: UserRole) => {
      const currentRoles = filters.role || [];
      const newRoles = currentRoles.includes(role)
        ? currentRoles.filter((r) => r !== role)
        : [...currentRoles, role];
      onFiltersChange({
        ...filters,
        role: newRoles.length > 0 ? newRoles : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({});
    setLocalSearch("");
  }, [onFiltersChange]);

  return (
    <div
      className={`${
        open ? "w-64" : "w-0"
      } transition-all duration-200 border-r border-border bg-muted/20 overflow-hidden`}
    >
      {open && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="search">{t("search")}</Label>
              <Input
                id="search"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("search")}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t("role")}</Label>
              <div className="mt-2 space-y-2">
                {USER_ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={filters.role?.includes(role) || false}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <Label
                      htmlFor={`role-${role}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>{t("status")}</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status-active"
                    checked={filters.is_active === true}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        is_active: checked ? true : undefined,
                      })
                    }
                  />
                  <Label htmlFor="status-active" className="text-sm font-normal cursor-pointer">
                    {t("active")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status-inactive"
                    checked={filters.is_active === false}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        is_active: checked ? false : undefined,
                      })
                    }
                  />
                  <Label htmlFor="status-inactive" className="text-sm font-normal cursor-pointer">
                    {t("inactive")}
                  </Label>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full"
            >
              {t("clearFilters")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

