"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { useTranslations } from "next-intl";
import Image from "next/image";

interface RelatedGemstonesProps {
  gemstone: {
    id: string;
    name: DatabaseGemstone["name"];
    color: DatabaseGemstone["color"];
    cut: DatabaseGemstone["cut"];
    clarity: DatabaseGemstone["clarity"];
    weight_carats: number;
    price_amount: number;
    price_currency: string;
    serial_number: string;
    in_stock: boolean;
    images?: DatabaseGemstoneImage[];
    origin?: DatabaseOrigin | null;
  };
  className?: string;
}

interface RelatedGemstone extends DatabaseGemstone {
  images?: DatabaseGemstoneImage[];
  origin?: DatabaseOrigin | null;
}

export function RelatedGemstones({
  gemstone,
  className,
}: RelatedGemstonesProps) {
  const [relatedGemstones, setRelatedGemstones] = useState<RelatedGemstone[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("gemstones.related");

  // Fetch related gemstones based on similarity criteria
  useEffect(() => {
    const fetchRelatedGemstones = async () => {
      try {
        // Build query for similar gemstones
        const { data, error } = await supabase
          .from("gemstones")
          .select(
            `
            id,
            name,
            color,
            cut,
            clarity,
            weight_carats,
            price_amount,
            price_currency,
            serial_number,
            in_stock,
            images (
              id,
              image_url,
              is_primary
            ),
            origin (
              id,
              name,
              country
            )
          `
          )
          .eq("in_stock", true) // Only show available gemstones
          .neq("id", gemstone.id) // Exclude current gemstone
          .eq("name", gemstone.name) // Same gemstone type
          .limit(8);

        if (error) throw error;

        // Sort by similarity (same color, cut, clarity)
        const sortedResults = (data || []).sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          // Color similarity
          if (a.color === gemstone.color) scoreA += 3;
          if (b.color === gemstone.color) scoreB += 3;

          // Cut similarity
          if (a.cut === gemstone.cut) scoreA += 2;
          if (b.cut === gemstone.cut) scoreB += 2;

          // Clarity similarity
          if (a.clarity === gemstone.clarity) scoreA += 1;
          if (b.clarity === gemstone.clarity) scoreB += 1;

          return scoreB - scoreA;
        });

        setRelatedGemstones(sortedResults.slice(0, 8));
      } catch (error) {
        console.error("Error fetching related gemstones:", error);
        setRelatedGemstones([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedGemstones();
  }, [gemstone.id, gemstone.name, gemstone.color, gemstone.cut, gemstone.clarity]);

  // Get similarity badge for each gemstone
  const getSimilarityBadge = (gemstone: RelatedGemstone) => {
    const similarities = [];

    if (gemstone.color === gemstone.color) similarities.push("color");
    if (gemstone.cut === gemstone.cut) similarities.push("cut");
    if (gemstone.clarity === gemstone.clarity) similarities.push("clarity");

    if (similarities.length >= 3) {
      return {
        text: "Very Similar",
        variant: "default" as const,
      };
    } else if (similarities.length >= 2) {
      return {
        text: "Similar",
        variant: "secondary" as const,
      };
    } else {
      return {
        text: "Related",
        variant: "outline" as const,
      };
    }
  };

  // Get primary image
  const getPrimaryImage = (images: any[]) => {
    return (
      images?.find((img) => img.is_primary) || images?.[0]
    );
  };

  // Format price
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-muted rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
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

  const gemstoneType = gemstone.name;
  const color = gemstone.color;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          Discover similar gemstones that match your preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {relatedGemstones.map((gemstone) => {
            const primaryImage = getPrimaryImage(gemstone.images);
            const similarity = getSimilarityBadge(gemstone);

            return (
              <Link
                key={(gemstone as DatabaseGemstone).id}
                href={`/catalog/${(gemstone as DatabaseGemstone).id}`}
                className="group block"
              >
                <div className="space-y-3">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden rounded-lg border">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.image_url}
                        alt={`${gemstone.name} ${gemstone.color} ${gemstone.cut}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="256px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          {t("noImage")}
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
                          console.log(
                            "Add to favorites:",
                            (gemstone as DatabaseGemstone).id
                          );
                        }}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Stock Status */}
                    {!(gemstone as DatabaseGemstone).in_stock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">{t("outOfStock")}</Badge>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm line-clamp-1 capitalize">
                        {(gemstone as DatabaseGemstone).weight_carats}ct{" "}
                        {(gemstone as DatabaseGemstone).color}{" "}
                        {(gemstone as DatabaseGemstone).name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {(gemstone as DatabaseGemstone).cut} {t("cut")} •{" "}
                        {(gemstone as DatabaseGemstone).clarity} {t("clarity")}
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
                          (gemstone as DatabaseGemstone).price_amount,
                          (gemstone as DatabaseGemstone).price_currency
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-muted-foreground">
                          {(gemstone as DatabaseGemstone).clarity === "FL" ||
                          (gemstone as DatabaseGemstone).clarity === "IF"
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
              {t("viewAllSimilar")}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
