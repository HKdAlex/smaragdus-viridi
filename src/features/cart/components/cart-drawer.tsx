"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { useCart } from "../hooks/use-cart";
import { CartItem } from "./cart-item";
import { EmptyCart } from "./empty-cart";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const t = useTranslations("cart");
  const tAccessibility = useTranslations("common.accessibility");
  const {
    cartSummary,
    isLoading,
    error,
    getSelectedItemsCount,
    getSelectedTotal,
    toggleItemSelection,
    isItemSelected,
    selectAllItems,
    clearCart,
  } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  // Memoize expensive calculations to prevent unnecessary re-renders
  const selectedItemsCount = useMemo(
    () => getSelectedItemsCount(),
    [getSelectedItemsCount]
  );

  const selectedTotal = useMemo(() => getSelectedTotal(), [getSelectedTotal]);

  const allSelected = useMemo(() => {
    if (!cartSummary || cartSummary.items.length === 0) return false;
    return selectedItemsCount === cartSummary.items.length;
  }, [cartSummary, selectedItemsCount]);

  const handleOrderSelected = () => {
    if (selectedItemsCount === 0) return;
    // TODO: Implement order processing for selected items
    console.log(`Ordering ${selectedItemsCount} selected items`);
    onCheckout?.();
  };

  const handleSelectAll = () => {
    selectAllItems();
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      await clearCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">{t("title")}</h2>
              {cartSummary && cartSummary.total_items > 0 && (
                <Badge variant="secondary">
                  {cartSummary.total_items}{" "}
                  {cartSummary.total_items === 1 ? t("itemCount.singular") : t("itemCount.plural")}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={tAccessibility("closeCart")}
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
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
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
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && !cartSummary ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartSummary && cartSummary.items.length > 0 && (
            <div className="border-t bg-gray-50 p-4 space-y-4">
              {/* Selected Items Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {t("summary.selectedItems", { count: selectedItemsCount })}
                  </span>
                  <span className="font-medium">
                    {formatPrice(selectedTotal.amount, selectedTotal.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t("summary.shipping")}</span>
                  <span>{t("summary.calculatedAtCheckout")}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t("summary.tax")}</span>
                  <span>{t("summary.calculatedAtCheckout")}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t("summary.selectedTotal")}</span>
                  <span>
                    {formatPrice(selectedTotal.amount, selectedTotal.currency)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleOrderSelected}
                  className="w-full"
                  size="lg"
                  disabled={isLoading || selectedItemsCount === 0}
                >
                  {t("actions.orderSelectedItems", {
                    count: selectedItemsCount,
                  })}
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleSelectAll}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {allSelected
                      ? t("actions.deselectAll")
                      : t("actions.selectAll")}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleClearCart}
                    disabled={isLoading || isClearing}
                    className="flex-1"
                  >
                    {isClearing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>{t("actions.clearing")}</span>
                      </div>
                    ) : (
                      t("actions.clearCart")
                    )}
                  </Button>
                </div>

                <Button variant="ghost" onClick={onClose} className="w-full">
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
