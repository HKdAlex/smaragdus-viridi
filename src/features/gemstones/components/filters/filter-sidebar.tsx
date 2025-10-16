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
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { useEffect, useState } from "react";

import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
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
    if (filters.priceRange) count++;
    if (filters.weightRange) count++;
    if (filters.inStockOnly) count++;
    if (filters.hasCertification) count++;
    if (filters.hasImages) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      {/* Filter Toggle Button (Mobile FAB or Desktop Corner Button) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className={`flex items-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${
              isMobile ? "" : "rounded-lg"
            }`}
            aria-label={t("sidebar.openFilters")}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            <span
              className={`font-medium ${isMobile ? "" : "hidden sm:inline"}`}
            >
              {t("sidebar.filtersSidebar")}
            </span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary-foreground text-primary rounded-full text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Desktop Sidebar or Mobile Bottom Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className="p-0 w-full sm:w-[400px]"
        >
          {/* Header */}
          <SheetHeader className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="space-y-4">
              <SheetTitle className="text-xl font-bold">
                {t("sidebar.filtersSidebar")}
                {activeFilterCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({activeFilterCount})
                  </span>
                )}
              </SheetTitle>

              {/* Mode Toggle */}
              <div className="inline-flex rounded-lg border border-border bg-muted p-1 w-full">
                <button
                  onClick={() => setMode("standard")}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === "standard"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tCatalog("standardFilters")}
                </button>
                <button
                  onClick={() => setMode("visual")}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === "visual"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tCatalog("visualFilters")}
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* Filter Content */}
          <SheetBody className="overflow-y-auto h-full pb-20">
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
        </SheetContent>
      </Sheet>
    </>
  );
}
