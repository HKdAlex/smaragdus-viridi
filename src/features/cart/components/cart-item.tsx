"use client";

import {
  removeFromCart,
  updateCartItemQuantity,
} from "../services/cart-service";

import { Button } from "@/shared/components/ui/button";
import type { CartItem as CartItemType } from "@/shared/types";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface CartItemProps {
  item: CartItemType;
  isSelected: boolean;
  onSelectionChange: (itemId: string, selected: boolean) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItem({
  item,
  isSelected,
  onSelectionChange,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const t = useTranslations("cart.items");

  const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectionChange(item.id, e.target.checked);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    const success = await updateCartItemQuantity(item.id, newQuantity);

    if (success) {
      onQuantityChange(item.id, newQuantity);
    }
    // Could show a toast notification here
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    const success = await removeFromCart(item.id);

    if (success) {
      onRemove(item.id);
    }
    // Could show a toast notification here
    setIsRemoving(false);
  };

  // Handle case where gemstone data is not available
  if (!item.gemstone) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{t("gemstoneInfoNotAvailable")}</p>
      </div>
    );
  }

  const gemstone = item.gemstone as any; // Temporary type assertion
  const primaryImage =
    gemstone.images?.find((img: any) => img.is_primary) || gemstone.images?.[0];

  // Type guard to ensure gemstone has required properties
  if (!gemstone.name) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{t("gemstoneNameNotAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Selection checkbox and item content */}
      <div className="flex space-x-4">
        {/* Selection checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectionChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            disabled={isLoading}
          />
        </div>
        {/* Gemstone Image */}
        <div className="relative w-16 h-16 flex-shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage.image_url}
              alt={gemstone.name}
              fill
              className="object-cover rounded-md"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443a55.381 55.381 0 015.25 2.882V15"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Gemstone Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {gemstone.name} {gemstone.color} {gemstone.cut}
          </h3>
          <p className="text-sm text-gray-600">
            {gemstone.weight_carats}ct • {gemstone.serial_number}
          </p>
          <p className="text-sm font-medium text-gray-900">
            {item.formatted_unit_price} {t("each")}
          </p>
        </div>

        {/* Remove Button */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isLoading || isRemoving || isUpdating}
            className="text-gray-400 hover:text-red-600 p-1"
            aria-label={t("removeFromCart", { name: gemstone.name })}
          >
            {isRemoving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Quantity and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            {t("quantity")}:
          </label>
          <div className="flex items-center border border-gray-300 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isLoading || isUpdating || item.quantity <= 1}
              className="px-2 py-1 text-gray-600 hover:text-gray-900"
            >
              -
            </Button>
            <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isLoading || isUpdating}
              className="px-2 py-1 text-gray-600 hover:text-gray-900"
            >
              +
            </Button>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600">
            {t("price")}: {item.formatted_unit_price}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {t("total")}: {item.formatted_line_total}
          </p>
        </div>
      </div>
    </div>
  );
}
