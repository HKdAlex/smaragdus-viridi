"use client";

import {
  ArrowLeft,
  Heart,
  Info,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { AIAnalysisDisplay } from "./ai-analysis-display";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CertificationDisplay } from "./certification-display";
import type { DetailGemstone } from "@/shared/types";
import Link from "next/link";
import { MediaGallery } from "./media-gallery";
import { RelatedGemstones } from "./related-gemstones";
import { useAuth } from "@/features/auth/context/auth-context";
import { useCart } from "@/features/cart/hooks/use-cart";
import { useRouter } from "next/navigation";
import { useState } from "react";

// DetailGemstone interface is now imported from shared types

interface GemstoneDetailProps {
  gemstone: DetailGemstone;
}

export function GemstoneDetail({ gemstone }: GemstoneDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, isInCart, getCartItemQuantity } = useCart(user?.id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const cartItemQuantity = getCartItemQuantity(gemstone.id);
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
        grade: "Excellent",
        color: "text-green-600 dark:text-green-400",
      };
    if (index <= 4)
      return { grade: "Very Good", color: "text-blue-600 dark:text-blue-400" };
    if (index <= 6)
      return { grade: "Good", color: "text-yellow-600 dark:text-yellow-400" };
    return { grade: "Fair", color: "text-orange-600 dark:text-orange-400" };
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
      setCartMessage("Please sign in to add items to your cart");
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
      setCartMessage("This item is currently out of stock");
      setTimeout(() => setCartMessage(null), 3000);
      return;
    }

    setIsAddingToCart(true);
    setCartMessage(null);

    try {
      console.log("🛒 Calling addToCart with:", {
        gemstoneId: gemstone.id,
        quantity: 1,
        userId: user.id,
      });

      const success = await addToCart(gemstone.id, 1);
      console.log("✅ Add to cart result:", success);

      if (success) {
        setCartMessage(`✅ Added to cart! (${cartItemQuantity + 1})`);
        setTimeout(() => setCartMessage(null), 3000);
      } else {
        setCartMessage("❌ Failed to add item to cart");
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
    const title = `${gemstone.weight_carats}ct ${gemstone.color} ${gemstone.name}`;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link
                href="/catalog"
                className="hover:text-foreground transition-colors font-medium"
              >
                Catalog
              </Link>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-foreground capitalize font-medium">
                {gemstone.name}s
              </span>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-foreground font-medium">
                {gemstone.serial_number}
              </span>
            </nav>

            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 sm:gap-8">
          {/* Media Gallery - Takes up more space on larger screens */}
          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            <MediaGallery images={gemstone.images} videos={gemstone.videos} />
          </div>

          {/* Gemstone Details - Optimized for luxury presentation */}
          <div className="xl:col-span-2 space-y-6 sm:space-y-8">
            {/* Luxury Header Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground capitalize leading-tight">
                        {formatWeight(gemstone.weight_carats)}ct{" "}
                        {gemstone.color} {gemstone.name}
                      </h1>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground font-medium">
                          Serial: {gemstone.serial_number}
                        </span>
                        {gemstone.internal_code && (
                          <>
                            <span className="text-muted-foreground/60">•</span>
                            <span className="text-muted-foreground">
                              Code: {gemstone.internal_code}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleToggleFavorite}
                        className={`h-10 w-10 border-2 transition-all duration-200 ${
                          isFavorite
                            ? "text-destructive border-destructive/50 bg-destructive/10 hover:bg-destructive/20 dark:border-destructive/70 dark:bg-destructive/20 dark:hover:bg-destructive/30"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFavorite ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleShare}
                        className="h-10 w-10 border-2 hover:border-primary/50 transition-all duration-200"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-3xl lg:text-4xl font-bold text-foreground">
                        {formatPrice(
                          gemstone.price_amount,
                          gemstone.price_currency
                        )}
                      </span>
                      {gemstone.premium_price_amount && (
                        <span className="text-xl text-muted-foreground line-through">
                          {formatPrice(
                            gemstone.premium_price_amount,
                            gemstone.premium_price_currency ||
                              gemstone.price_currency
                          )}
                        </span>
                      )}
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant={gemstone.in_stock ? "default" : "destructive"}
                        className="px-3 py-1 text-sm font-medium"
                      >
                        {gemstone.in_stock ? "In Stock" : "Out of Stock"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`px-3 py-1 text-sm font-medium ${qualityGrade.color}`}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {qualityGrade.grade}
                      </Badge>
                      {gemstone.delivery_days && (
                        <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          <Truck className="w-4 h-4 mr-1" />
                          {gemstone.delivery_days} days delivery
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {gemstone.description && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-3" />
                    Description
                  </h3>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed">
                    {gemstone.description}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Description */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <div className="w-1 h-6 bg-gradient-to-b from-muted-foreground to-muted-foreground/60 rounded-full mr-3" />
                  Professional Summary
                </h3>
                <p className="text-foreground/90 leading-relaxed font-medium">
                  Professional quality {gemstone.color} {gemstone.name} with
                  exceptional {gemstone.cut} cut. This {gemstone.weight_carats}{" "}
                  carat gemstone exhibits {gemstone.clarity} clarity and
                  represents excellent value for collectors and jewelry
                  designers.
                </p>
              </CardContent>
            </Card>

            {/* Promotional Text */}
            {gemstone.promotional_text && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm  border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-3" />
                    Special Features
                  </h3>
                  <div className="text-primary/90 leading-relaxed font-medium">
                    {gemstone.promotional_text}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marketing Highlights */}
            {gemstone.marketing_highlights &&
              gemstone.marketing_highlights.length > 0 && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                      <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-3" />
                      Key Highlights
                    </h3>
                    <ul className="space-y-3">
                      {gemstone.marketing_highlights.map((highlight, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-foreground/90"
                        >
                          <div className="w-2 h-2 bg-gradient-to-br from-primary to-primary/60 rounded-full mt-2 flex-shrink-0" />
                          <span className="leading-relaxed">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!gemstone.in_stock || isAddingToCart || !user}
                className="flex-1 h-12 sm:h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px]"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isAddingToCart
                  ? "Adding..."
                  : isAlreadyInCart
                  ? `In Cart (${cartItemQuantity})`
                  : user
                  ? "Add to Cart"
                  : "Sign In to Add"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12 sm:h-12 text-base font-medium border-2 hover:border-primary/50 transition-all duration-200 min-h-[48px]"
              >
                <Info className="w-5 h-5 mr-2" />
                Request Info
              </Button>
            </div>
          </div>
        </div>

        {/* Technical Specifications - Full width below */}
        <div className="xl:col-span-5 space-y-8">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-card via-muted/20 to-card backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-2xl font-bold text-foreground">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* 4Cs */}
                <div className="bg-gradient-to-br from-muted/30 to-card p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="font-bold text-base text-foreground mb-4 flex items-center">
                    <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-2" />
                    The 4Cs
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Carat Weight
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatWeight(gemstone.weight_carats)}ct
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Color
                      </span>
                      <span className="font-semibold text-foreground capitalize">
                        {gemstone.color}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Cut</span>
                      <span className="font-semibold text-foreground capitalize">
                        {gemstone.cut}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Clarity
                      </span>
                      <span className="font-semibold text-foreground">
                        {gemstone.clarity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-gradient-to-br from-muted/30 to-card p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="font-bold text-base text-foreground mb-4 flex items-center">
                    <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-2" />
                    Dimensions
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Length
                      </span>
                      <span className="font-semibold text-foreground">
                        {gemstone.length_mm} mm
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Width
                      </span>
                      <span className="font-semibold text-foreground">
                        {gemstone.width_mm} mm
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Depth
                      </span>
                      <span className="font-semibold text-foreground">
                        {gemstone.depth_mm} mm
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Overall
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatDimensions()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Origin & Provenance */}
                <div className="bg-gradient-to-br from-muted/30 to-card p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="font-bold text-base text-foreground mb-4 flex items-center">
                    <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full mr-2" />
                    Origin & Provenance
                  </h4>
                  <div className="space-y-3">
                    {gemstone.origin ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Origin
                          </span>
                          <span className="font-semibold text-foreground">
                            {gemstone.origin.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Country
                          </span>
                          <span className="font-semibold text-foreground">
                            {gemstone.origin.country}
                          </span>
                        </div>
                        {gemstone.origin.region && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Region
                            </span>
                            <span className="font-semibold text-foreground">
                              {gemstone.origin.region}
                            </span>
                          </div>
                        )}
                        {gemstone.origin.mine_name && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Mine
                            </span>
                            <span className="font-semibold text-foreground">
                              {gemstone.origin.mine_name}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground/80 italic">
                        Origin information not available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced AI Analysis Section */}
          <AIAnalysisDisplay
            gemstoneId={gemstone.id}
            analysisData={gemstone.ai_analysis_results}
            aiAnalyzed={gemstone.ai_analyzed || false}
            aiConfidenceScore={gemstone.ai_confidence_score || undefined}
            aiAnalysisDate={gemstone.ai_analysis_date || undefined}
          />

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
