"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import type {
  DatabaseGemstone,
  DatabaseGemstoneImage,
  DatabaseOrigin,
} from "@/shared/types";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { SafeImage } from "@/shared/components/ui/safe-image";
import { supabase } from "@/lib/supabase";

interface RelatedGemstonesProps {
  currentGemstone: {
    id: string;
    name: DatabaseGemstone["name"];
    color: DatabaseGemstone["color"];
    price_amount: number;
  };
  gemstoneType: DatabaseGemstone["name"];
  color: DatabaseGemstone["color"];
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
}

interface RelatedGemstone extends DatabaseGemstone {
  images?: DatabaseGemstoneImage[];
  origin?: DatabaseOrigin | null;
}

export function RelatedGemstones({
  currentGemstone,
  gemstoneType,
  color,
  priceRange,
}: RelatedGemstonesProps) {
  const [relatedGemstones, setRelatedGemstones] = useState<RelatedGemstone[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch related gemstones based on similarity criteria
  useEffect(() => {
    const fetchRelatedGemstones = async () => {
      try {
        setLoading(true);

        // Build query for similar gemstones
        let query = supabase
          .from("gemstones")
          .select(
            `
            *,
            origin:origins(*),
            images:gemstone_images(*)
          `
          )
          .neq("id", currentGemstone.id) // Exclude current gemstone
          .eq("in_stock", true) // Only show available gemstones
          .limit(12);

        // Apply similarity filters in order of priority
        // 1. Same type and similar price range (highest priority)
        // 2. Same color and similar price range
        // 3. Same type only
        // 4. Similar price range only

        const { data: sameTypeAndPrice, error: error1 } = await query
          .eq("name", gemstoneType)
          .gte("price_amount", priceRange.min)
          .lte("price_amount", priceRange.max);

        if (error1) throw error1;

        let results = sameTypeAndPrice || [];

        // If we need more results, fetch same color and similar price
        if (results.length < 8) {
          const { data: sameColorAndPrice, error: error2 } = await query
            .eq("color", color)
            .gte("price_amount", priceRange.min)
            .lte("price_amount", priceRange.max);

          if (error2) throw error2;

          // Merge results, avoiding duplicates
          const existingIds = new Set(results.map((g) => g.id));
          const newResults = (sameColorAndPrice || []).filter(
            (g) => !existingIds.has(g.id)
          );
          results = [...results, ...newResults];
        }

        // If we still need more, fetch same type regardless of price
        if (results.length < 8) {
          const { data: sameType, error: error3 } = await query.eq(
            "name",
            gemstoneType
          );

          if (error3) throw error3;

          const existingIds = new Set(results.map((g) => g.id));
          const newResults = (sameType || []).filter(
            (g) => !existingIds.has(g.id)
          );
          results = [...results, ...newResults];
        }

        // Sort images by order for each gemstone
        results.forEach((gemstone) => {
          if (gemstone.images) {
            gemstone.images.sort((a, b) => a.image_order - b.image_order);
          }
        });

        // Sort results by relevance score
        const sortedResults = results.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          // Same type bonus
          if (a.name === gemstoneType) scoreA += 3;
          if (b.name === gemstoneType) scoreB += 3;

          // Same color bonus
          if (a.color === color) scoreA += 2;
          if (b.color === color) scoreB += 2;

          // Price proximity bonus
          const currentPrice = currentGemstone.price_amount;
          const priceDistanceA = Math.abs(a.price_amount - currentPrice);
          const priceDistanceB = Math.abs(b.price_amount - currentPrice);

          if (priceDistanceA < priceDistanceB) scoreA += 1;
          if (priceDistanceB < priceDistanceA) scoreB += 1;

          return scoreB - scoreA;
        });

        setRelatedGemstones(sortedResults.slice(0, 8));
      } catch (error) {
        console.error("Error fetching related gemstones:", error);
        setRelatedGemstones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedGemstones();
  }, [currentGemstone.id, gemstoneType, color, priceRange.min, priceRange.max]);

  // Handle scroll functionality
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, [relatedGemstones]);

  // Format price
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  // Get primary image
  const getPrimaryImage = (images?: DatabaseGemstoneImage[]) => {
    if (!images || images.length === 0) return null;
    return images.find((img) => img.is_primary) || images[0];
  };

  // Get similarity badge
  const getSimilarityReason = (gemstone: RelatedGemstone) => {
    if (gemstone.name === gemstoneType && gemstone.color === color) {
      return { text: "Same Type & Color", variant: "default" as const };
    }
    if (gemstone.name === gemstoneType) {
      return { text: "Same Type", variant: "secondary" as const };
    }
    if (gemstone.color === color) {
      return { text: "Same Color", variant: "outline" as const };
    }
    return { text: "Similar Price", variant: "outline" as const };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You Might Also Like</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 space-y-3">
                <div className="aspect-square bg-muted rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedGemstones.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>You Might Also Like</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className="h-9 w-9 border-2 hover:border-primary/50 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollRight}
              disabled={!canScrollRight}
              className="h-9 w-9 border-2 hover:border-primary/50 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {relatedGemstones.map((gemstone) => {
            const primaryImage = getPrimaryImage(gemstone.images);
            const similarity = getSimilarityReason(gemstone);

            return (
              <Link
                key={gemstone.id}
                href={`/catalog/${gemstone.id}`}
                className="flex-shrink-0 w-64 group"
              >
                <div className="space-y-3">
                  {/* Image */}
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    {primaryImage ? (
                      <SafeImage
                        src={primaryImage.image_url}
                        alt={`${gemstone.weight_carats}ct ${gemstone.color} ${gemstone.name}`}
                        width={256}
                        height={256}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="256px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          No Image
                        </span>
                      </div>
                    )}

                    {/* Similarity Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={similarity.variant} className="text-xs">
                        {similarity.text}
                      </Badge>
                    </div>

                    {/* Favorite Button */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log("Add to favorites:", gemstone.id);
                        }}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Stock Status */}
                    {!gemstone.in_stock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm line-clamp-1 capitalize">
                        {gemstone.weight_carats}ct {gemstone.color}{" "}
                        {gemstone.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {gemstone.cut} Cut • {gemstone.clarity} Clarity
                      </p>
                      {gemstone.origin && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {gemstone.origin.name}, {gemstone.origin.country}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {formatPrice(
                          gemstone.price_amount,
                          gemstone.price_currency
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-muted-foreground">
                          {gemstone.clarity === "FL" ||
                          gemstone.clarity === "IF"
                            ? "5.0"
                            : "4.8"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Link */}
        <div className="mt-6 text-center">
          <Link href={`/catalog?types=${gemstoneType}&colors=${color}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              View All Similar Gemstones
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
