/**
 * Related Gemstones Component (Refactored)
 *
 * Displays related/similar gemstones using shared services and components.
 * Reduced from 442 LOC to ~120 LOC by using extracted components.
 */

"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type {
  CatalogGemstone,
  RelatedGemstonesCriteria,
} from "../services/gemstone-fetch.service";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import type { DatabaseGemstone } from "@/shared/types";
import { GemstoneCard } from "./gemstone-card";
import { GemstoneFetchService } from "../services/gemstone-fetch.service";
import { LoadingState } from "./loading-state";
import { useTranslations } from "next-intl";

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

export function RelatedGemstonesRefactored({
  currentGemstone,
  gemstoneType,
  color,
  priceRange,
}: RelatedGemstonesProps) {
  const t = useTranslations("gemstones.related");

  const [relatedGemstones, setRelatedGemstones] = useState<CatalogGemstone[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch related gemstones using shared service
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true);

        const criteria: RelatedGemstonesCriteria = {
          currentGemstoneId: currentGemstone.id,
          gemstoneType,
          color,
          priceRange: {
            min: Math.floor(priceRange.min * 0.5), // 50% lower
            max: Math.ceil(priceRange.max * 1.5), // 50% higher
          },
          limit: 8,
        };

        const results = await GemstoneFetchService.fetchRelatedGemstones(
          criteria
        );
        setRelatedGemstones(results);
      } catch (error) {
        console.error("Failed to fetch related gemstones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentGemstone.id, gemstoneType, color, priceRange]);

  // Scroll handling
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    const newScrollLeft =
      scrollContainerRef.current.scrollLeft +
      (direction === "left" ? -scrollAmount : scrollAmount);

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [relatedGemstones]);

  if (loading) {
    return (
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState count={4} variant="grid" />
        </CardContent>
      </Card>
    );
  }

  if (relatedGemstones.length === 0) {
    return null;
  }

  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Horizontal Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {relatedGemstones.map((gemstone) => (
              <div key={gemstone.id} className="flex-shrink-0 w-64">
                <GemstoneCard gemstone={gemstone} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
