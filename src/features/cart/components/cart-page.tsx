"use client";

import { ArrowLeft, Lock, ShoppingBag } from "lucide-react";

import { useAuth } from "@/features/auth/context/auth-context";
import { OrderConfirmationModal } from "@/features/orders/components/order-confirmation-modal";
import type { CreateOrderResponse } from "@/features/orders/types/order.types";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCartContext } from "../context/cart-context";
import { CartItem } from "./cart-item";
import { EmptyCart } from "./empty-cart";

export function CartPage() {
  const { user } = useAuth();
  const t = useTranslations("cart");
  const tErrors = useTranslations("errors.cart");
  const {
    cartSummary,
    isLoading,
    error,
    clearCart,
    loadCart,
    getSelectedItemsCount,
    getSelectedTotal,
    isAllSelected,
    toggleSelectAll,
    toggleItemSelection,
    isItemSelected,
  } = useCartContext();

  const [isClearing, setIsClearing] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderResult, setOrderResult] = useState<CreateOrderResponse | null>(
    null
  );

  const selectedItemsCount = getSelectedItemsCount();
  const selectedTotal = getSelectedTotal();
  const allSelected = isAllSelected();

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

  const handleOrderSelected = () => {
    if (selectedItemsCount === 0) return;
    setShowOrderModal(true);
    setOrderResult(null);
  };

  const handleConfirmOrder = async () => {
    if (!user?.id || selectedItemsCount === 0) return;

    setIsProcessingOrder(true);
    setOrderResult(null);

    try {
      // Prepare order data from selected cart items
      const orderItems =
        cartSummary?.items
          .filter((item) => isItemSelected(item.id))
          .map((item) => ({
            gemstone_id: item.gemstone_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })) || [];

      const orderRequest = {
        user_id: user.id,
        items: orderItems.map((item) => ({
          gemstone_id: item.gemstone_id,
          quantity: item.quantity,
          unit_price: item.unit_price.amount, // Extract amount from Money object
        })),
        currency_code: "USD", // Default to USD, could be made configurable
      };

      // Create order using the order service
      const orderService = new (
        await import("@/features/orders/services/order-service")
      ).OrderService();
      const result = await orderService.createOrder(orderRequest);
      setOrderResult(result);

      if (result.success) {
        // Refresh cart data after successful order
        loadCart();
      }
    } catch (error) {
      setOrderResult({
        success: false,
        error: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    if (orderResult?.success) {
      // Reset selections after successful order
      setOrderResult(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-md p-6 sm:p-8 text-center">
          <Lock className="w-12 sm:w-16 h-12 sm:h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {t("authRequired.title")}
          </h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            {t("authRequired.message")}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors min-h-[48px] font-medium"
          >
            {t("authRequired.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/catalog"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 py-1 rounded"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm sm:text-base">
                  {t("continueShopping")}
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 sm:w-6 h-5 sm:h-6 text-muted-foreground" />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                {t("title")}
              </h1>
              {cartSummary && cartSummary.total_items > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {t("itemCount", { count: cartSummary.total_items })}
                </Badge>
              )}
            </div>
            <div className="w-20 sm:w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 sm:py-16 px-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-muted-foreground text-sm sm:text-base">
                {t("loading")}
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6 text-center max-w-md mx-auto">
            <p className="text-destructive mb-4 text-sm sm:text-base">
              {error}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="min-h-[44px]"
            >
              {t("actions.tryAgain")}
            </Button>
          </div>
        ) : !cartSummary || cartSummary.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg shadow-sm">
                {/* Cart Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer min-h-[44px] px-2 py-1 rounded hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {t("actions.selectAll", {
                          count: cartSummary.total_items,
                        })}
                      </span>
                    </label>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCart}
                    disabled={isClearing}
                    className="text-destructive border-destructive/50 hover:bg-destructive/10 min-h-[44px]"
                  >
                    {isClearing
                      ? t("actions.clearing")
                      : t("actions.clearCart")}
                  </Button>
                </div>

                {/* Cart Items */}
                <div className="divide-y divide-border">
                  {cartSummary.items.map((item) => (
                    <div key={item.id} className="p-6">
                      <CartItem
                        item={item}
                        isSelected={isItemSelected(item.id)}
                        onSelectionChange={(selected) =>
                          selected
                            ? toggleItemSelection(item.id)
                            : toggleItemSelection(item.id)
                        }
                        onRemove={(itemId) => {
                          // Handle item removal
                          console.log("Item removed:", itemId);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  {t("orderSummary.title")}
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("orderSummary.subtotal", {
                        count: cartSummary.total_items,
                      })}
                    </span>
                    <span className="text-foreground font-medium">
                      {cartSummary.formatted_subtotal}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("orderSummary.shipping")}
                    </span>
                    <span className="text-foreground font-medium">
                      {t("orderSummary.calculatedAtCheckout")}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("orderSummary.tax")}
                    </span>
                    <span className="text-foreground font-medium">
                      {t("orderSummary.calculatedAtCheckout")}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-base sm:text-lg font-semibold">
                    <span className="text-foreground">
                      {t("orderSummary.total")}
                    </span>
                    <span className="text-foreground">
                      {selectedItemsCount === cartSummary.total_items
                        ? cartSummary.formatted_subtotal
                        : formatPrice(
                            selectedTotal.amount,
                            selectedTotal.currency
                          )}
                    </span>
                  </div>

                  {selectedItemsCount !== cartSummary.total_items && (
                    <p className="text-xs text-muted-foreground">
                      {t("orderSummary.selectedItemsTotal", {
                        count: selectedItemsCount,
                      })}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleOrderSelected}
                  disabled={selectedItemsCount === 0 || isProcessingOrder}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 min-h-[48px]"
                  size="lg"
                >
                  {isProcessingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      {t("processingOrder")}
                    </>
                  ) : (
                    t("orderItems", { count: selectedItemsCount })
                  )}
                </Button>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {t("secureCheckout")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Confirmation Modal */}
        <OrderConfirmationModal
          isOpen={showOrderModal}
          onClose={handleCloseOrderModal}
          selectedItems={
            cartSummary?.items.filter((item) => isItemSelected(item.id)) || []
          }
          onConfirmOrder={handleConfirmOrder}
          isProcessing={isProcessingOrder}
          orderResult={orderResult || undefined}
        />
      </div>
    </div>
  );
}
