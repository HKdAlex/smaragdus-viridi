"use client";

import {
  ColorIndicator,
  CutIcon,
  GemstoneTypeIcon,
} from "@/shared/components/ui/gemstone-icons";
import { Scale } from "lucide-react";

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
    <div className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200">
      {/* Selection checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectionChange}
          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
          disabled={isLoading}
        />
      </div>

      {/* Main content */}
      <div className="flex gap-4 ml-6 items-stretch">
        {/* Gemstone Image */}
        <div className="relative w-24 h-full min-h-[120px] flex-shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage.image_url}
              alt={gemstone.name}
              fill
              className="object-cover rounded-lg shadow-sm"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center">
              <svg
                className="h-8 w-8 text-muted-foreground"
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
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-base sm:text-lg leading-tight">
              {translateGemstoneType(gemstone.name)}
            </h3>
            <div className="flex items-center gap-2">
              <ColorIndicator color={gemstone.color} className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">
                {translateColor(gemstone.color)}
              </span>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-[auto_1fr] gap-3 text-sm">
            {/* Cut */}
            <div className="flex items-center gap-2">
              <CutIcon cut={gemstone.cut} className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cut</span>
            </div>
            <span className="font-medium text-foreground">
              {translateCut(gemstone.cut)}
            </span>

            {/* Color */}
            <div className="flex items-center gap-2">
              <ColorIndicator color={gemstone.color} className="w-4 h-4" />
              <span className="text-muted-foreground">Color</span>
            </div>
            <span className="font-medium text-foreground">
              {translateColor(gemstone.color)}
            </span>

            {/* Weight */}
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Weight</span>
            </div>
            <span className="font-medium text-foreground">
              {gemstone.weight_carats}ct
            </span>

            {/* Serial Number */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Serial</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {gemstone.serial_number}
            </span>
          </div>

          {/* Price */}
          <div className="pt-2 border-t border-border">
            <p className="text-lg font-bold text-foreground">
              {item.formatted_unit_price} <span className="text-sm font-normal text-muted-foreground">{t("each")}</span>
            </p>
          </div>
        </div>

        {/* Remove Button */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isLoading || isRemoving}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
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
