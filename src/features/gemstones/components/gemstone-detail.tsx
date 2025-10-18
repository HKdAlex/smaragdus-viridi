"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  CheckCircle,
  Heart,
  Info,
  Package,
  Ruler,
  Scale,
  Share2,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";
import { ColorIndicator, CutIcon } from "@/shared/components/ui/gemstone-icons";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CertificationDisplay } from "./certification-display";
import type { Database } from "@/shared/types/database";
import type { DetailGemstone } from "@/shared/types";
import { GemstoneDetailV6Tabs } from "./gemstone-detail-v6-tabs";
import { MediaGallery } from "./media-gallery";
import { RelatedGemstones } from "./related-gemstones";
import { useAuth } from "@/features/auth/context/auth-context";
import { useCartContext } from "@/features/cart/context/cart-context";
import { useGemstoneTranslations } from "../utils/gemstone-translations";
import { useState } from "react";

// DetailGemstone interface is now imported from shared types

interface GemstoneDetailProps {
  gemstone: DetailGemstone & {
    v6Text?:
      | (Database["public"]["Tables"]["gemstones_ai_v6"]["Row"] & {
          // Only include the field that's actually used
          recommended_primary_image_index?: number | null;
        })
      | null;
  };
}

export function GemstoneDetail({ gemstone }: GemstoneDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCartContext();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const t = useTranslations("catalog.gemstone.detail");
  const tCart = useTranslations("cart");
  const locale = useLocale(); // Use proper Next.js i18n locale hook
  const {
    translateColor,
    translateCut,
    translateClarity,
    translateGemstoneType,
    translateGemstoneTypePlural,
  } = useGemstoneTranslations();

  const isAlreadyInCart = isInCart(gemstone.id);

  // Format price with currency
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  // Format weight with proper decimals
  const formatWeight = (weight: number) => {
    return parseFloat(weight.toString()).toFixed(2);
  };

  // Format dimensions
  const formatDimensions = () => {
    return `${gemstone.length_mm} × ${gemstone.width_mm} × ${gemstone.depth_mm} mm`;
  };

  // Get quality grade based on clarity
  const getQualityGrade = () => {
    const clarityOrder = [
      "FL",
      "IF",
      "VVS1",
      "VVS2",
      "VS1",
      "VS2",
      "SI1",
      "SI2",
      "I1",
    ];
    const index = clarityOrder.indexOf(gemstone.clarity);
    if (index <= 1)
      return {
        grade: t("qualityGrades.excellent"),
        color: "text-green-600 dark:text-green-400",
      };
    if (index <= 4)
      return {
        grade: t("qualityGrades.veryGood"),
        color: "text-blue-600 dark:text-blue-400",
      };
    if (index <= 6)
      return {
        grade: t("qualityGrades.good"),
        color: "text-yellow-600 dark:text-yellow-400",
      };
    return {
      grade: t("qualityGrades.fair"),
      color: "text-orange-600 dark:text-orange-400",
    };
  };

  const qualityGrade = getQualityGrade();

  // Handle add to cart
  const handleAddToCart = async () => {
    console.log("🔍 Debug: handleAddToCart called", {
      user: user ? { id: user.id, email: user.email } : null,
      userId: user?.id,
      gemstoneId: gemstone.id,
      inStock: gemstone.in_stock,
    });

    if (!user) {
      setCartMessage(tCart("messages.signInRequired"));
      setTimeout(() => setCartMessage(null), 3000);
      return;
    }

    if (!user.id) {
      setCartMessage(
        "❌ User ID is missing. Please sign out and sign back in."
      );
      setTimeout(() => setCartMessage(null), 5000);
      return;
    }

    if (!gemstone.in_stock) {
      setCartMessage(tCart("messages.outOfStock"));
      setTimeout(() => setCartMessage(null), 3000);
      return;
    }

    setIsAddingToCart(true);
    setCartMessage(null);

    try {
      console.log("🛒 Calling addToCart with:", {
        gemstoneId: gemstone.id,
        userId: user.id,
      });

      const success = await addToCart(gemstone.id);
      console.log("✅ Add to cart result:", success);

      if (success) {
        setCartMessage(tCart("messages.addedToCart"));
        setTimeout(() => setCartMessage(null), 3000);
      } else {
        setCartMessage(tCart("messages.failedToAdd"));
        setTimeout(() => setCartMessage(null), 5000);
      }
    } catch (error) {
      console.error("❌ Add to cart error:", error);
      setCartMessage(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setTimeout(() => setCartMessage(null), 5000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle add to favorites (dummy for now)
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    console.log("Toggled favorite:", gemstone.id);
  };

  // Handle share functionality
  const handleShare = async () => {
    const url = window.location.href;
    const displayColor = gemstone.color;
    const title = `${gemstone.weight_carats}ct ${displayColor} ${gemstone.name}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      console.log("URL copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header Section with Breadcrumbs */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link
                href="/catalog"
                className="hover:text-foreground transition-colors font-medium"
              >
                {t("catalog")}
              </Link>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-foreground capitalize font-medium">
                {translateGemstoneTypePlural(gemstone.name)}
              </span>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-foreground font-medium">
                {gemstone.serial_number}
              </span>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 sm:gap-8 items-start">
          {/* Media Gallery - Takes up more space on larger screens */}
          <div className="xl:col-span-3">
            <MediaGallery
              images={gemstone.images}
              videos={gemstone.videos}
              recommendedPrimaryIndex={
                gemstone.v6Text?.recommended_primary_image_index ?? null
              }
              selectedImageUuid={gemstone.v6Text?.selected_image_uuid ?? null}
            />
          </div>

          {/* Gemstone Details - Sophisticated Multi-Section Layout */}
          <div className="xl:col-span-2 space-y-4">
            {/* Luxury Header Card - Redesigned */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-card via-card/95 to-muted/40 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-3 sm:p-4 space-y-4 sm:space-y-6">
                {/* Title Section */}
                <div className="space-y-3">
                  {/* Main Title - First, with gradient shadow */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight capitalize bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent drop-shadow-sm">
                    {translateColor(gemstone.ai_color || gemstone.color)}{" "}
                    {translateGemstoneType(gemstone.name)}
                  </h1>

                  {/* Weight + Icon - Below title */}
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 backdrop-blur-xl rounded-xl flex-shrink-0">
                      <Scale className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-xl font-semibold text-muted-foreground">
                      {formatWeight(gemstone.weight_carats)}
                    </div>
                  </div>
                </div>

                {/* Metadata - Single Line, No Wrap */}
                <div className="flex items-center gap-3 text-sm bg-muted/30 rounded-lg px-4 py-3 overflow-x-auto">
                  <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                    <span className="font-medium">{t("serial")}:</span>
                    <code className="px-2 py-1 bg-background rounded font-mono text-xs">
                      {gemstone.serial_number}
                    </code>
                  </div>
                  {gemstone.internal_code && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                        <span className="font-medium">{t("code")}:</span>
                        <code className="px-2 py-1 bg-background rounded font-mono text-xs">
                          {gemstone.internal_code}
                        </code>
                      </div>
                    </>
                  )}
                </div>

                {/* Key Highlights - Above Price */}
                {(() => {
                  const highlights =
                    locale === "ru"
                      ? gemstone.v6Text?.marketing_highlights_ru ||
                        gemstone.v6Text?.marketing_highlights
                      : gemstone.v6Text?.marketing_highlights;
                  return (
                    highlights &&
                    highlights.length > 0 && (
                      <div className="relative bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10 overflow-hidden">
                        {/* Elegant corner accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full blur-2xl" />

                        <div className="relative">
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                              <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="font-semibold text-xs uppercase tracking-widest text-primary/80">
                              {t("distinguishedFeatures")}
                            </h3>
                          </div>

                          <ul className="space-y-3">
                            {highlights.slice(0, 3).map((highlight, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-3 group"
                              >
                                <div className="relative mt-1.5">
                                  <div className="w-1 h-1 bg-gradient-to-br from-primary to-primary/60 rounded-full" />
                                  <div className="absolute inset-0 w-1 h-1 bg-primary rounded-full animate-pulse opacity-0 group-hover:opacity-40" />
                                </div>
                                <span className="text-sm text-foreground/85 leading-relaxed font-light">
                                  {highlight}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  );
                })()}

                {/* Price Section - More Spacing */}
                <div className="pt-6 border-t border-border">
                  <div className="space-y-5">
                    <div className="pb-2">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                        {t("price")}
                      </div>
                      <div className="flex items-baseline gap-3 pb-1">
                        <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent filter drop-shadow-sm">
                          {formatPrice(
                            gemstone.price_amount,
                            gemstone.price_currency
                          )}
                        </span>
                        {gemstone.premium_price_amount && (
                          <span className="text-xl text-muted-foreground/60 line-through font-medium">
                            {formatPrice(
                              gemstone.premium_price_amount,
                              gemstone.premium_price_currency ||
                                gemstone.price_currency
                            )}
                          </span>
                        )}
                      </div>
                      {gemstone.premium_price_amount && (
                        <div className="mt-2">
                          <Badge
                            variant="destructive"
                            className="text-xs font-semibold"
                          >
                            SAVE{" "}
                            {Math.round(
                              ((gemstone.premium_price_amount -
                                gemstone.price_amount) /
                                gemstone.premium_price_amount) *
                                100
                            )}
                            %
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Status Indicators - Glassmorphic High-Tech */}
                    <div className="flex items-center gap-3 flex-wrap pt-4">
                      {/* In Stock Badge */}
                      <div
                        className={`group relative flex items-center gap-2 px-2 py-1 rounded-lg font-medium text-sm backdrop-blur-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                          gemstone.in_stock
                            ? "bg-white/5 text-emerald-400 border border-emerald-400/30 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                            : "bg-white/5 text-red-400 border border-red-400/30 shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                        }`}
                      >
                        {/* Animated glass reflection */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${
                            gemstone.in_stock
                              ? "from-emerald-400/10 via-transparent to-transparent"
                              : "from-red-400/10 via-transparent to-transparent"
                          } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                        />

                        {/* Status indicator */}
                        <div className="relative flex items-center gap-3">
                          <div className="relative">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                gemstone.in_stock
                                  ? "bg-emerald-400 shadow-lg shadow-emerald-400/60"
                                  : "bg-red-400 shadow-lg shadow-red-400/60"
                              } ${gemstone.in_stock ? "animate-pulse" : ""}`}
                            />
                            {gemstone.in_stock && (
                              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-30" />
                            )}
                          </div>
                          <span className="relative tracking-wide">
                            {gemstone.in_stock ? t("inStock") : t("outOfStock")}
                          </span>
                        </div>
                      </div>

                      {/* Delivery Badge */}
                      {gemstone.delivery_days && (
                        <div className="group relative flex items-center gap-2 px-2 py-1 rounded-lg font-medium text-sm backdrop-blur-xl bg-white/5 text-foreground/90 border border-white/20 shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]">
                          {/* Animated glass reflection */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="relative flex items-center gap-3">
                            <Truck className="w-4 h-4 drop-shadow-sm" />
                            <span className="relative tracking-wide">
                              {t("daysDelivery", {
                                days: gemstone.delivery_days,
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cart Message */}
                {cartMessage && (
                  <div
                    className={`p-3 rounded-lg text-center text-sm font-medium ${
                      cartMessage.includes("✅")
                        ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800"
                        : cartMessage.includes("❌")
                        ? "bg-destructive/10 text-destructive border border-destructive/20 dark:bg-destructive/20 dark:text-destructive/80 dark:border-destructive/40"
                        : "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {cartMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={!gemstone.in_stock || isAddingToCart || !user}
                      className="flex-1 h-12 sm:h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px]"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {isAddingToCart
                        ? t("adding")
                        : isAlreadyInCart
                        ? t("inCart")
                        : user
                        ? t("addToCart")
                        : t("signInToAdd")}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 h-12 sm:h-12 text-base font-medium border-2 hover:border-primary/50 transition-all duration-200 min-h-[48px]"
                    >
                      <Info className="w-5 h-5 mr-2" />
                      {t("requestInfo")}
                    </Button>
                  </div>

                  {/* Favorite & Share Buttons */}
                  <div className="flex items-center gap-2 justify-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleFavorite}
                      className={`rounded-lg transition-all duration-300 ${
                        isFavorite
                          ? "text-destructive bg-destructive/15 hover:bg-destructive/25"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                      {isFavorite ? t("favorited") : t("favorite")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="rounded-lg hover:bg-muted transition-all duration-300"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {t("share")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* V6 AI Content Tabs - Full width below hero */}
        {gemstone.v6Text && (
          <div className="mt-8">
            <GemstoneDetailV6Tabs v6Text={gemstone.v6Text} locale={locale} />
          </div>
        )}

        {/* Fallback: Legacy Description when no V6 */}
        {!gemstone.v6Text && gemstone.description && (
          <Card className="mt-8 border border-white/10 shadow-lg bg-white/5 dark:bg-black/20 backdrop-blur-xl">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-3" />
                {t("description")}
              </h3>
              <div className="prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed">
                {gemstone.description}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Specifications - Full width below */}
        <div className="mt-8 space-y-8">
          <Card className="border border-white/10 shadow-2xl bg-white/5 dark:bg-black/20 backdrop-blur-xl">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center text-xl sm:text-2xl font-bold text-foreground">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                {t("technicalSpecifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* 4Cs */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg">
                  <h4 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center">
                    <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-2" />
                    {t("the4Cs")}
                  </h4>
                  <div className="space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
                    {/* Carat Weight */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <Scale className="w-5 h-5 text-muted-foreground" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("caratWeight")}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatWeight(gemstone.weight_carats)}ct
                        </span>
                      </div>
                    </div>

                    {/* Color */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <ColorIndicator
                        color={gemstone.ai_color || gemstone.color}
                        className="w-5 h-5"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("color")}
                        </span>
                        <span className="font-medium text-foreground capitalize">
                          {translateColor(gemstone.ai_color || gemstone.color)}
                        </span>
                      </div>
                    </div>

                    {/* Cut */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <CutIcon
                        cut={gemstone.v6Text?.detected_cut || gemstone.cut}
                        className="w-5 h-5"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("cut")}
                        </span>
                        <span className="font-medium text-foreground capitalize">
                          {translateCut(
                            gemstone.v6Text?.detected_cut || gemstone.cut
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Clarity */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("clarity")}
                        </span>
                        <span className="font-medium text-foreground">
                          {translateClarity(gemstone.clarity)}
                        </span>
                      </div>
                    </div>

                    {/* In Stock */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <CheckCircle
                        className={`w-5 h-5 ${
                          gemstone.in_stock
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("inStock")}
                        </span>
                        <span
                          className={`font-medium ${
                            gemstone.in_stock
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {gemstone.in_stock ? t("inStock") : t("outOfStock")}
                        </span>
                      </div>
                    </div>

                    {/* Quantity */}
                    {gemstone.quantity !== null && gemstone.quantity > 0 && (
                      <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {t("quantity")}
                          </span>
                          <span className="font-medium text-foreground">
                            {gemstone.quantity}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg">
                  <h4 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center">
                    <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-2" />
                    {t("dimensions")}
                  </h4>
                  <div className="space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
                    {/* Length */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <Ruler className="w-5 h-5 text-muted-foreground" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("length")}
                        </span>
                        <span className="font-medium text-foreground">
                          {gemstone.length_mm} mm
                        </span>
                      </div>
                    </div>

                    {/* Width */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <Ruler className="w-5 h-5 text-muted-foreground" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("width")}
                        </span>
                        <span className="font-medium text-foreground">
                          {gemstone.width_mm} mm
                        </span>
                      </div>
                    </div>

                    {/* Depth */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <Ruler className="w-5 h-5 text-muted-foreground" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("depth")}
                        </span>
                        <span className="font-medium text-foreground">
                          {gemstone.depth_mm} mm
                        </span>
                      </div>
                    </div>

                    {/* Overall */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-muted-foreground"
                        >
                          <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
                        </svg>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("overall")}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatDimensions()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          {gemstone.certifications.length > 0 && (
            <CertificationDisplay
              certifications={gemstone.certifications.map((cert) => ({
                ...cert,
                certificate_number: cert.certificate_number || undefined,
                certificate_url: cert.certificate_url || undefined,
                issued_date: cert.issued_date || undefined,
              }))}
            />
          )}

          {/* Related Gemstones */}
          <RelatedGemstones
            currentGemstone={gemstone}
            gemstoneType={gemstone.name}
            color={gemstone.color}
            priceRange={{
              min: Math.max(0, gemstone.price_amount - 50000), // ±$500
              max: gemstone.price_amount + 50000,
              currency: gemstone.price_currency,
            }}
          />
        </div>
      </div>
    </div>
  );
}
