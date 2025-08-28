"use client";

import { ArrowLeft, Lock, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/features/auth/context/auth-context";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import Link from "next/link";
import { useCart } from "../hooks/use-cart";
import { CartItem } from "./cart-item";
import { EmptyCart } from "./empty-cart";

export function CartPage() {
  const { user } = useAuth();
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
  } = useCart(user?.id);

  const [isClearing, setIsClearing] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

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

  const handleOrderSelected = async () => {
    if (selectedItemsCount === 0) return;

    setIsProcessingOrder(true);
    // TODO: Implement order processing
    console.log(`Processing order for ${selectedItemsCount} selected items`);

    // Simulate processing delay
    setTimeout(() => {
      setIsProcessingOrder(false);
      // TODO: Navigate to checkout or order confirmation
    }, 2000);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view and manage your shopping cart.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/catalog"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Continue Shopping
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-6 h-6 text-gray-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Shopping Cart
              </h1>
              {cartSummary && cartSummary.total_items > 0 && (
                <Badge variant="secondary">
                  {cartSummary.total_items} item
                  {cartSummary.total_items !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading your cart...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : !cartSummary || cartSummary.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                {/* Cart Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        Select All ({cartSummary.total_items} items)
                      </span>
                    </label>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCart}
                    disabled={isClearing}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {isClearing ? "Clearing..." : "Clear Cart"}
                  </Button>
                </div>

                {/* Cart Items */}
                <div className="divide-y divide-gray-200">
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
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({cartSummary.total_items} items)
                    </span>
                    <span className="text-gray-900 font-medium">
                      {cartSummary.formatted_subtotal}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900 font-medium">
                      Calculated at checkout
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900 font-medium">
                      Calculated at checkout
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      {selectedItemsCount === cartSummary.total_items
                        ? cartSummary.formatted_subtotal
                        : formatPrice(
                            selectedTotal.amount,
                            selectedTotal.currency
                          )}
                    </span>
                  </div>

                  {selectedItemsCount !== cartSummary.total_items && (
                    <p className="text-xs text-gray-500">
                      Showing total for {selectedItemsCount} selected item
                      {selectedItemsCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleOrderSelected}
                  disabled={selectedItemsCount === 0 || isProcessingOrder}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  size="lg"
                >
                  {isProcessingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Order...
                    </>
                  ) : (
                    `Order ${selectedItemsCount} Item${
                      selectedItemsCount !== 1 ? "s" : ""
                    }`
                  )}
                </Button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Secure checkout powered by industry-leading encryption
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
