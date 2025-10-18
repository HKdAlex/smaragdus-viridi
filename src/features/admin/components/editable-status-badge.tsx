"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

import { useOrderTranslations } from "@/features/orders/utils/order-translations";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import type { OrderStatus } from "@/shared/types";
import {
  getOrderStatusColors,
  getOrderStatusIcon,
  type OrderStatus as OrderStatusType,
} from "@/shared/utils/order-status";
import { useState } from "react";

// Get available status options
const STATUS_OPTIONS: OrderStatusType[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

interface EditableStatusBadgeProps {
  status: OrderStatus;
  onStatusChange: (newStatus: OrderStatus) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function EditableStatusBadge({
  status,
  onStatusChange,
  disabled = false,
  className,
}: EditableStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { translateOrderStatus } = useOrderTranslations();

  const colors = getOrderStatusColors(status);
  const allStatuses = STATUS_OPTIONS;

  const handleStatusSelect = async (newStatus: OrderStatus) => {
    if (newStatus === status || isUpdating) return;

    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update order status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-auto p-2 rounded-full border transition-all duration-200",
            colors,
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled || isUpdating}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            {getOrderStatusIcon(status)}
            <span className="text-sm font-medium">
              {translateOrderStatus(status, "admin")}
            </span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-1" align="start">
        {allStatuses.map((statusOption) => {
          const optionColors = getOrderStatusColors(statusOption);
          const isSelected = statusOption === status;

          return (
            <DropdownMenuItem
              key={statusOption}
              className={cn(
                "cursor-pointer h-auto p-3 rounded-md transition-all duration-200",
                optionColors,
                isSelected && "ring-2 ring-primary/20"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusSelect(statusOption);
              }}
              disabled={isUpdating}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">
                  {translateOrderStatus(statusOption, "admin")}
                </span>
                {isSelected && <Check className="w-4 h-4" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
