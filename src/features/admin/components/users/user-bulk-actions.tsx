"use client";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import type { UserRole } from "@/shared/types";

interface UserBulkActionsProps {
  selectedCount: number;
  onBulkAction: (
    operation: "role_change" | "activate" | "suspend" | "delete",
    role?: UserRole
  ) => void;
}

export function UserBulkActions({
  selectedCount,
  onBulkAction,
}: UserBulkActionsProps) {
  const t = useTranslations("admin.users.bulk");

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 border-b">
      <span className="text-sm text-muted-foreground">
        {t("selectedUsers", { count: selectedCount })}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {t("bulkActions")}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onBulkAction("activate")}>
            {t("activate")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction("suspend")}>
            {t("suspend")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction("delete")}>
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

