"use client";

import {
  ColorIndicator,
  CutIcon,
  GemstoneTypeIcon,
} from "@/shared/components/ui/gemstone-icons";

import { Button } from "@/shared/components/ui/button";
import type { CartItem as CartItemType } from "@/shared/types";
import Image from "next/image";
import { removeFromCart } from "../services/cart-service";
import { useGemstoneTranslations } from "@/features/gemstones/utils/gemstone-translations";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface CartItemProps {
  item: CartItemType;
  isSelected: boolean;
  onSelectionChange: (itemId: string, selected: boolean) => void;
  onRemove: (itemId: string) => void;
}

export function CartItem({
  item,
  isSelected,
  onSelectionChange,
  onRemove,
}: CartItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const t = useTranslations("cart.items");
  const { translateColor, translateCut, translateGemstoneType } =
    useGemstoneTranslations();

  const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectionChange(item.id, e.target.checked);
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
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive text-sm">
          {t("gemstoneInfoNotAvailable")}
        </p>
      </div>
    );
  }

  const gemstone = item.gemstone as any; // Temporary type assertion
  const primaryImage =
    gemstone.gemstone_images?.find((img: any) => img.is_primary) ||
    gemstone.gemstone_images?.[0];

  // Type guard to ensure gemstone has required properties
  if (!gemstone.name) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive text-sm">
          {t("gemstoneNameNotAvailable")}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
      {/* Selection checkbox and item content */}
      <div className="flex space-x-4">
        {/* Selection checkbox */}
        <div className="flex items-center min-h-[64px] sm:min-h-[80px]">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectionChange}
            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
            disabled={isLoading}
          />
        </div>
        {/* Gemstone Image */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage.image_url}
              alt={gemstone.name}
              fill
              className="object-cover rounded-md"
              sizes="(max-width: 640px) 64px, 80px"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground"
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
        <div className="flex-1 min-w-0 space-y-2">
          {/* Gemstone Type and Color with Icons */}
          <div className="flex items-center space-x-2">
            <GemstoneTypeIcon className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-foreground text-sm sm:text-base">
              {translateGemstoneType(gemstone.name)}
            </h3>
          </div>

          {/* Color with Icon */}
          <div className="flex items-center space-x-2">
            <ColorIndicator color={gemstone.color} className="w-3 h-3" />
            <span className="text-sm text-muted-foreground">
              {translateColor(gemstone.color)}
            </span>
          </div>

          {/* Cut with Icon and Weight */}
          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <CutIcon cut={gemstone.cut} className="w-3 h-3" />
              <span className="bg-muted/50 px-2 py-1 rounded-md font-medium">
                {translateCut(gemstone.cut)}
              </span>
            </div>
            <span>•</span>
            <span className="font-medium">{gemstone.weight_carats}ct</span>
          </div>

          {/* Serial Number */}
          <p className="text-xs text-muted-foreground font-mono">
            {gemstone.serial_number}
          </p>

          {/* Price */}
          <p className="text-sm font-semibold text-foreground">
            {item.formatted_unit_price} {t("each")}
          </p>
        </div>

        {/* Remove Button */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isLoading || isRemoving}
            className="text-muted-foreground hover:text-destructive p-2 min-h-[64px] sm:min-h-[80px] min-w-[44px] flex items-center justify-center"
            aria-label={t("removeFromCart", { name: gemstone.name })}
          >
            {isRemoving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border"></div>
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
    </div>
  );
}
