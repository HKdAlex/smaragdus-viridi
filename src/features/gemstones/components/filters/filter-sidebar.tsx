"use client";

import type {
  AdvancedGemstoneFilters,
  FilterOptions,
} from "../../types/filter.types";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
} from "@/shared/components/ui/sheet";
import { useEffect, useState } from "react";

import {
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { AdvancedFiltersControlled } from "./advanced-filters-controlled";
import { AdvancedFiltersV2Controlled } from "./advanced-filters-v2-controlled";
import { useTranslations } from "next-intl";

interface FilterSidebarProps {
  filters: AdvancedGemstoneFilters;
  onChange: (filters: AdvancedGemstoneFilters) => void;
  options: FilterOptions;
  loading?: boolean;
  defaultOpen?: boolean;
}

export function FilterSidebar({
  filters,
  onChange,
  options,
  loading = false,
  defaultOpen = false,
}: FilterSidebarProps) {
  const t = useTranslations("filters");
  const tCatalog = useTranslations("catalog");

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);

  // Sidebar open state - default open on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen;

    // Check localStorage first
    const stored = localStorage.getItem("filterSidebarOpen");
    if (stored !== null) {
      return stored === "true";
    }

    // Default: open on desktop, closed on mobile
    return window.innerWidth >= 768;
  });

  // Filter mode state - visual or standard
  const [mode, setMode] = useState<"visual" | "standard">(() => {
    if (typeof window === "undefined") return "visual";

    const stored = localStorage.getItem("filterSidebarMode");
    return (stored as "visual" | "standard") || "visual";
  });

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // On mobile, default to closed unless explicitly opened
      if (mobile && !localStorage.getItem("filterSidebarOpen")) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Persist sidebar open state
  useEffect(() => {
    localStorage.setItem("filterSidebarOpen", String(isOpen));
  }, [isOpen]);

  // Persist filter mode
  useEffect(() => {
    localStorage.setItem("filterSidebarMode", mode);
  }, [mode]);

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.gemstoneTypes?.length) count += filters.gemstoneTypes.length;
    if (filters.colors?.length) count += filters.colors.length;
    if (filters.cuts?.length) count += filters.cuts.length;
    if (filters.clarities?.length) count += filters.clarities.length;
    if (filters.origins?.length) count += filters.origins.length;
    if (filters.miningCountries?.length) count += filters.miningCountries.length;
    if (filters.treatmentStatus?.length)
      count += filters.treatmentStatus.length;
    if (filters.qualityClassifications?.length)
      count += filters.qualityClassifications.length;
    if (filters.priceRange) count++;
    if (filters.weightRange) count++;
    if (filters.dimensionRange) count++;
    if (filters.pricePerCaratRange) count++;
    if (filters.inStockOnly) count++;
    if (filters.hasColorChange) count++;
    if (filters.hasCertification) count++;
    if (filters.hasImages) count++;
    if (filters.hasAIAnalysis) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      {/* Premium Filter Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
            aria-label={t("sidebar.openFilters")}
          >
            <div className="relative">
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary rounded-full text-xs font-bold flex items-center justify-center shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <span className="font-semibold tracking-wide">
              {t("sidebar.filtersSidebar")}
            </span>
            <SparklesIcon className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}

      {/* Premium Desktop Sidebar or Mobile Bottom Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className="p-0 w-full sm:w-[420px] pt-16 sm:pt-0 flex flex-col"
          showClose={false}
        >
          {/* Premium Header */}
          <SheetHeader className="sticky top-0 z-10 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-sm border-b border-border/50 !py-4 !px-5">
            <div className="space-y-4">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight">
                      {t("advancedV2.title")}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {t("advancedV2.subtitle")}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/80 flex-shrink-0"
                  aria-label="Close filters"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Active Filters Badge */}
              {activeFilterCount > 0 && (
                <div className="flex items-center justify-between py-2.5 px-3.5 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary">
                      {t("sidebar.filtersActive", { count: activeFilterCount })}
                    </span>
                  </div>
                  <button
                    onClick={() => onChange({})}
                    className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
                  >
                    {t("sidebar.clearAll")}
                  </button>
                </div>
              )}

              {/* Premium Mode Toggle */}
              <div className="flex rounded-lg bg-muted/50 p-1 gap-1">
                <button
                  onClick={() => setMode("visual")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    mode === "visual"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                  <span>{tCatalog("visualFilters")}</span>
                </button>
                <button
                  onClick={() => setMode("standard")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    mode === "standard"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                  <span>{tCatalog("standardFilters")}</span>
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* Filter Content with Premium Styling */}
          <SheetBody className="flex-1 overflow-y-auto !px-4 !py-4 pb-24">
            {mode === "visual" ? (
              <AdvancedFiltersV2Controlled
                filters={filters}
                onChange={onChange}
                options={options}
                loading={loading}
              />
            ) : (
              <AdvancedFiltersControlled
                filters={filters}
                onChange={onChange}
                options={options}
                loading={loading}
              />
            )}
          </SheetBody>

          {/* Premium Mobile Action Buttons */}
          {isMobile && (
            <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/95 backdrop-blur-sm border-t border-border/50 p-5">
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-5 py-3.5 bg-muted/80 text-muted-foreground hover:text-foreground rounded-xl font-medium transition-all duration-200 hover:bg-muted"
                >
                  {t("sidebar.cancel")}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  {t("sidebar.apply")}
                  {activeFilterCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-md text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
