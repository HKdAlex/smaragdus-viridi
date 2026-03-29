"use client";

import { Link, useRouter } from "@/i18n/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";
import { ColorIndicator, CutIcon } from "@/shared/components/ui/gemstone-icons";
import {
    CheckCircle,
    Edit,
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
import { useLocale, useTranslations } from "next-intl";

import { useAuth } from "@/features/auth/context/auth-context";
import { useCartContext } from "@/features/cart/context/cart-context";
import { useCurrency } from "@/features/currency/hooks/use-currency";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import type { DetailGemstone } from "@/shared/types";
import type { Database } from "@/shared/types/database";
import { useState } from "react";
import { useGemstoneTranslations } from "../utils/gemstone-translations";
import { resolveGemstoneTypeLabelSource } from "../utils/gemstone-type-display";
import { CertificationDisplay } from "./certification-display";
import { GemstoneDetailV6Tabs } from "./gemstone-detail-v6-tabs";
import { MediaGallery } from "./media-gallery";
import { ProfessionalSpecifications } from "./professional-specifications";
import { RelatedGemstones } from "./related-gemstones";
import { TreatmentDisclosure } from "./treatment-disclosure";

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
  const { user, profile } = useAuth();
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
    translateIfEnumCode,
  } = useGemstoneTranslations();

  const isAlreadyInCart = isInCart(gemstone.id);
  const isAdmin = profile?.role === "admin";

  // Use currency context for price formatting
  const { formatPrice } = useCurrency();

  // Contract: DISPLAY-C8.0
  // Use display_* fields from database (precedence already resolved: Admin Custom > AI > Enum)
  // Only translate if value is an enum code (lowercase, no spaces)
  // Custom values with spaces/Unicode are already in display form
  const typeLabel = translateIfEnumCode(
    resolveGemstoneTypeLabelSource(locale, {
      name: gemstone.name,
      type_code: gemstone.type_code ?? null,
      display_name: gemstone.display_name ?? null,
      name_custom: gemstone.name_custom ?? null,
      name_custom_en: gemstone.name_custom_en ?? null,
      name_custom_ru: gemstone.name_custom_ru ?? null,
    }),
    translateGemstoneType
  );

  const colorLabel = translateIfEnumCode(
    (gemstone as any).display_color || gemstone.ai_color || gemstone.color,
    translateColor
  );

  const cutLabel = translateIfEnumCode(
    (gemstone as any).display_cut || gemstone.v6Text?.detected_cut || gemstone.cut,
    translateCut
  );

  const clarityLabel = translateIfEnumCode(
    (gemstone as any).display_clarity || gemstone.clarity,
    translateClarity
  );

  // For icons/visual indicators, use the same resolved values
  const effectiveColor = (gemstone as any).display_color || gemstone.ai_color || gemstone.color;
  const effectiveCut = (gemstone as any).display_cut || gemstone.v6Text?.detected_cut || gemstone.cut;

  // Format weight with proper decimals
  const formatWeight = (weight: number) => {
    return parseFloat(weight.toString()).toFixed(2);
  };

  const weightCaratsNum = Number(gemstone.weight_carats);
  const ppcFromDb =
    typeof gemstone.price_per_carat === "number" && gemstone.price_per_carat > 0
      ? gemstone.price_per_carat
      : null;
  const pricePerCaratMinorUnits =
    ppcFromDb !== null
      ? ppcFromDb
      : weightCaratsNum > 0 &&
          Number.isFinite(weightCaratsNum) &&
          gemstone.price_amount > 0
        ? Math.round(gemstone.price_amount / weightCaratsNum)
        : null;

  const normalizeDimensionValue = (value: unknown): number | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "number") {
      return value > 0 ? value : null;
    }

    if (typeof value === "string") {
      const parsed = parseFloat(value.replace(",", "."));
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    return null;
  };

  // Extract dimensions from AI content or use database values
  const extractDimensions = () => {
    let length: number | null = null;
    let width: number | null = null;
    let depth: number | null = null;

    const technicalDescription =
      gemstone.v6Text?.technical_description_en ||
      gemstone.v6Text?.technical_description_ru ||
      (gemstone as any).technical_description_en ||
      (gemstone as any).technical_description_ru;

    if (technicalDescription) {
      const dimensionMatch = technicalDescription.match(
        /(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm/i
      );
      if (dimensionMatch) {
        length = parseFloat(dimensionMatch[1]);
        width = parseFloat(dimensionMatch[2]);
        depth = parseFloat(dimensionMatch[3]);
      }
    }

    const dbLength = normalizeDimensionValue(gemstone.length_mm);
    if (dbLength !== null) {
      length = dbLength;
    }

    const dbWidth = normalizeDimensionValue(gemstone.width_mm);
    if (dbWidth !== null) {
      width = dbWidth;
    }

    const dbDepth = normalizeDimensionValue(gemstone.depth_mm);
    if (dbDepth !== null) {
      depth = dbDepth;
    }

    return { length, width, depth };
  };

  const dimensions = extractDimensions();

  const formatDimensionNumber = (value: number) => {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(2).replace(/\.?0+$/, "");
  };

  const formatDimensionValue = (value: number | null) => {
    if (value === null || value <= 0) {
      return t("notSpecified");
    }
    return `${formatDimensionNumber(value)} mm`;
  };

  const formatOverallDimensions = () => {
    const parts = [dimensions.length, dimensions.width, dimensions.depth]
      .filter((value): value is number => value !== null && value > 0)
      .map((value) => formatDimensionNumber(value));

    if (parts.length === 0) {
      return t("notSpecified");
    }

    return `${parts.join(" × ")} mm`;
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

  const handleEditGemstone = () => {
    if (!isAdmin) return;
    router.push({
      pathname: "/catalog/[id]/edit" as const,
      params: { id: gemstone.id },
    });
  };

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

  // Open the floating chat widget so the user can ask about this gemstone
  const handleRequestInfo = () => {
    window.dispatchEvent(new CustomEvent("open-chat-widget"));
  };

  // Handle share functionality
  const handleShare = async () => {
    const url = window.location.href;
    const title = `${formatWeight(gemstone.weight_carats)}ct ${typeLabel}`.trim();

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

          {/* Gemstone Details — identity → purchase panel → highlights */}
          <div className="xl:col-span-2">
            <Card className="border border-border/60 shadow-xl bg-card overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-0">
                {/* 1. Identity: title + weight chip + lot codes */}
                <header className="space-y-5">
                  <h1 className="text-3xl sm:text-4xl font-bold leading-[1.15] tracking-tight capitalize text-foreground">
                    {typeLabel}
                  </h1>

                  {/* Weight chip — prominently sized */}
                  <div className="inline-flex items-center gap-2.5 rounded-xl bg-primary/8 dark:bg-primary/12 border border-primary/20 px-4 py-2.5">
                    <Scale className="w-5 h-5 text-primary shrink-0" aria-hidden />
                    <span className="text-lg font-bold text-foreground tabular-nums tracking-tight">
                      {formatWeight(gemstone.weight_carats)}{" "}
                      <span className="font-semibold text-primary">{t("caratSuffix")}</span>
                    </span>
                  </div>

                  {/* Lot codes row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <span className="shrink-0 font-medium text-foreground/70 text-xs uppercase tracking-wide">
                        {t("serial")}
                      </span>
                      <code className="px-2.5 py-1 rounded-md bg-muted font-mono text-sm text-foreground truncate max-w-[12rem] sm:max-w-none">
                        {gemstone.serial_number}
                      </code>
                    </div>
                    {gemstone.internal_code && (
                      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <span className="shrink-0 font-medium text-foreground/70 text-xs uppercase tracking-wide">
                          {t("code")}
                        </span>
                        <code className="px-2.5 py-1 rounded-md bg-muted font-mono text-sm text-foreground truncate max-w-[10rem] sm:max-w-none">
                          {gemstone.internal_code}
                        </code>
                      </div>
                    )}
                  </div>
                </header>

                <Separator className="my-6" />

                {/* 2. Commerce panel: price, availability, primary actions */}
                <section
                  className="rounded-2xl border border-border/80 bg-gradient-to-b from-muted/40 to-muted/10 dark:from-muted/25 dark:to-muted/5 p-5 sm:p-6 space-y-5"
                  aria-labelledby="gemstone-price-heading"
                >
                  {/* Price block */}
                  <div className="space-y-3">
                    <h2
                      id="gemstone-price-heading"
                      className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold"
                    >
                      {t("price")}
                    </h2>

                    {/* Main price + strikethrough */}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-4xl sm:text-5xl font-bold text-foreground tabular-nums tracking-tight">
                        {formatPrice(
                          gemstone.price_amount,
                          gemstone.price_currency
                        )}
                      </span>
                      {gemstone.premium_price_amount && (
                        <>
                          <span className="text-xl text-muted-foreground line-through font-medium tabular-nums">
                            {formatPrice(
                              gemstone.premium_price_amount,
                              gemstone.premium_price_currency ||
                                gemstone.price_currency
                            )}
                          </span>
                          <Badge variant="destructive" className="text-xs px-2 py-0.5 self-center">
                            SAVE{" "}
                            {Math.round(
                              ((gemstone.premium_price_amount -
                                gemstone.price_amount) /
                                gemstone.premium_price_amount) *
                                100
                            )}
                            %
                          </Badge>
                        </>
                      )}
                    </div>

                    {/* Per-carat price chip — enlarged */}
                    {pricePerCaratMinorUnits !== null && (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-muted/70 dark:bg-muted/40 px-3 py-1.5">
                        <span className="text-base font-semibold text-foreground tabular-nums">
                          {formatPrice(pricePerCaratMinorUnits, gemstone.price_currency)}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          / {t("caratSuffix")}
                        </span>
                      </div>
                    )}

                    {/* Availability badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge
                        variant="outline"
                        className={
                          gemstone.in_stock
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium gap-1.5 pl-2.5 pr-3 py-1.5 text-sm"
                            : "border-destructive/40 bg-destructive/10 text-destructive font-medium gap-1.5 pl-2.5 pr-3 py-1.5 text-sm"
                        }
                      >
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            gemstone.in_stock
                              ? "bg-emerald-500"
                              : "bg-destructive"
                          }`}
                          aria-hidden
                        />
                        {gemstone.in_stock ? t("inStock") : t("outOfStock")}
                      </Badge>
                      {gemstone.delivery_days ? (
                        <Badge
                          variant="secondary"
                          className="font-normal gap-1.5 pl-2.5 pr-3 py-1.5 text-sm text-foreground/90"
                        >
                          <Truck className="w-3.5 h-3.5" aria-hidden />
                          {t("daysDelivery", {
                            days: gemstone.delivery_days,
                          })}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

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

                  {/* Primary action buttons */}
                  <div className="flex flex-col gap-3">
                    <Button
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={
                        !gemstone.in_stock || isAddingToCart || !user
                      }
                      className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2 shrink-0" />
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
                      onClick={handleRequestInfo}
                      className="w-full h-12 text-base font-medium border-2"
                    >
                      <Info className="w-5 h-5 mr-2 shrink-0" />
                      {t("requestInfo")}
                    </Button>
                  </div>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleEditGemstone}
                      className="w-full h-11 text-sm font-medium border-primary/35 text-primary hover:bg-primary/5 min-h-[44px]"
                    >
                      <Edit className="w-4 h-4 mr-2 shrink-0" />
                      {t("editGemstone")}
                    </Button>
                  )}

                  <div className="flex items-center justify-center gap-1 pt-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleFavorite}
                      className={`text-muted-foreground hover:text-foreground ${
                        isFavorite
                          ? "!text-destructive hover:!text-destructive"
                          : ""
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 mr-1.5 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                      {isFavorite ? t("favorited") : t("favorite")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="w-4 h-4 mr-1.5" />
                      {t("share")}
                    </Button>
                  </div>
                </section>

                {/* 3. Marketing highlights — after purchase context, tighter */}
                {(() => {
                  const highlights =
                    locale === "ru"
                      ? gemstone.v6Text?.marketing_highlights_ru ||
                        gemstone.v6Text?.marketing_highlights
                      : gemstone.v6Text?.marketing_highlights;
                  if (!highlights?.length) return null;
                  return (
                    <>
                      <Separator className="my-5 sm:my-6" />
                      <section
                        className="rounded-xl border border-border/50 bg-muted/20 dark:bg-muted/10 p-4 sm:p-5"
                        aria-labelledby="gemstone-highlights-heading"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles
                            className="w-4 h-4 text-primary shrink-0"
                            aria-hidden
                          />
                          <h3
                            id="gemstone-highlights-heading"
                            className="text-xs font-semibold uppercase tracking-widest text-primary"
                          >
                            {t("distinguishedFeatures")}
                          </h3>
                        </div>
                        <ul className="space-y-2.5">
                          {highlights.slice(0, 3).map((highlight, index) => (
                            <li
                              key={index}
                              className="flex gap-3 text-sm text-foreground/90 leading-relaxed"
                            >
                              <span
                                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/70"
                                aria-hidden
                              />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </>
                  );
                })()}
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
                        color={effectiveColor}
                        className="w-5 h-5"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("color")}
                        </span>
                        <span className="font-medium text-foreground capitalize">
                          {colorLabel}
                        </span>
                      </div>
                    </div>

                    {/* Cut */}
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <CutIcon
                        cut={effectiveCut}
                        className="w-5 h-5"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("cut")}
                        </span>
                        <span className="font-medium text-foreground capitalize">
                          {cutLabel}
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
                          {clarityLabel}
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
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {t("quantity")}
                        </span>
                        <span className="font-medium text-foreground">
                          {gemstone.quantity !== null && gemstone.quantity >= 0
                            ? t("quantityAvailable", {
                                count: gemstone.quantity,
                              })
                            : t("quantityUnknown")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg">
                  <h4 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center">
                    <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-2" />
                    {gemstone.individual_stones &&
                    gemstone.individual_stones.length > 0
                      ? t("individualStoneDimensions")
                      : t("dimensions")}
                  </h4>

                  {gemstone.individual_stones &&
                  gemstone.individual_stones.length > 0 ? (
                    // Individual stones display
                    <div className="space-y-4">
                      {gemstone.individual_stones
                        .sort((a, b) => a.stone_number - b.stone_number)
                        .map((stone) => (
                          <div
                            key={stone.id}
                            className="border border-white/10 rounded-lg p-3 bg-white/5 dark:bg-black/10"
                          >
                            <h5 className="font-medium text-sm mb-3 text-primary">
                              {t("stoneNumber", { number: stone.stone_number })}
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  {t("length")}:
                                </span>
                                <span className="font-medium">
                                  {formatDimensionValue(
                                    stone.dimensions.length_mm
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  {t("width")}:
                                </span>
                                <span className="font-medium">
                                  {formatDimensionValue(
                                    stone.dimensions.width_mm
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  {t("depth")}:
                                </span>
                                <span className="font-medium">
                                  {formatDimensionValue(
                                    stone.dimensions.depth_mm
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    // Overall dimensions display
                    <div className="space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
                      {/* Length */}
                      <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                        <Ruler className="w-5 h-5 text-muted-foreground" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {t("length")}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatDimensionValue(dimensions.length)}
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
                            {formatDimensionValue(dimensions.width)}
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
                            {formatDimensionValue(dimensions.depth)}
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
                            {formatOverallDimensions()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Specifications (FLEX-C3.1) */}
          <ProfessionalSpecifications gemstone={gemstone} />

          {/* Treatment & Enhancement Disclosure (FLEX-C3.2) */}
          <TreatmentDisclosure gemstone={gemstone} />

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
