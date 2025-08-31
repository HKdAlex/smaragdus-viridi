"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CartItem } from "./cart-item";
import { EmptyCart } from "./empty-cart";
import { Separator } from "@/shared/components/ui/separator";
import { useCart } from "../hooks/use-cart";
import { useTranslations } from "next-intl";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const t = useTranslations("cart");
  const {
    cartSummary,
    isLoading,
    error,
    clearCart,
    getSelectedItemsCount,
    getSelectedTotal,
    isAllSelected,
    toggleSelectAll,
    toggleItemSelection,
    isItemSelected,
  } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  // Memoize expensive calculations to prevent unnecessary re-renders
  const selectedItemsCount = useMemo(
    () => getSelectedItemsCount(),
    [getSelectedItemsCount]
  );
  const selectedTotal = useMemo(() => getSelectedTotal(), [getSelectedTotal]);
  const allSelected = useMemo(() => isAllSelected(), [isAllSelected]);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const handleOrderSelected = async () => {
    if (selectedItemsCount === 0) return;
    // TODO: Implement order processing for selected items
    console.log(`Ordering ${selectedItemsCount} selected items`);
    if (onCheckout) {
      onCheckout();
    }
  };

  const handleSelectAll = () => {
    toggleSelectAll();
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    const success = await clearCart();
    if (success) {
      // Cart cleared successfully
    }
    setIsClearing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full max-w-md bg-card shadow-xl border-l border-border">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-foreground">
                {t("title")}
              </h2>
              {cartSummary && cartSummary.total_items > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {t("itemCount", { count: cartSummary.total_items })}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded"
              aria-label={t("accessibility.closeCart")}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border-l-4 border-destructive p-4 mx-4 mt-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-destructive"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && !cartSummary ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading cart...
                  </p>
                </div>
              </div>
            ) : !cartSummary || cartSummary.items.length === 0 ? (
              <EmptyCart onClose={onClose} />
            ) : (
              <div className="p-4 space-y-4">
                {cartSummary.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    isSelected={isItemSelected(item.id)}
                    onSelectionChange={(selected) =>
                      toggleItemSelection(item.id)
                    }
                    onRemove={(itemId) => {
                      // Handle item removal
                      console.log("Item removed:", itemId);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartSummary && cartSummary.items.length > 0 && (
            <div className="border-t border-border bg-muted/30 p-4 space-y-4">
              {/* Selected Items Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("summary.selectedItems", { count: selectedItemsCount })}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(selectedTotal.amount, selectedTotal.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("summary.shipping")}</span>
                  <span>{t("summary.calculatedAtCheckout")}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("summary.tax")}</span>
                  <span>{t("summary.calculatedAtCheckout")}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-foreground">
                    {t("summary.selectedTotal")}
                  </span>
                  <span className="text-foreground">
                    {formatPrice(selectedTotal.amount, selectedTotal.currency)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleOrderSelected}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground min-h-[48px]"
                  size="lg"
                  disabled={isLoading || selectedItemsCount === 0}
                >
                  {t("actions.orderSelectedItems", {
                    count: selectedItemsCount,
                  })}
                </Button>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSelectAll}
                    disabled={isLoading}
                    className="flex-1 min-h-[44px]"
                  >
                    {allSelected
                      ? t("actions.deselectAll")
                      : t("actions.selectAll")}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleClearCart}
                    disabled={isLoading || isClearing}
                    className="flex-1 min-h-[44px]"
                  >
                    {isClearing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border"></div>
                        <span>{t("actions.clearing")}</span>
                      </div>
                    ) : (
                      t("actions.clearCart")
                    )}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full min-h-[44px]"
                >
                  {t("actions.continueShopping")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
