/**
 * Category Tabs Component
 *
 * Displays tabs for major gemstone categories with counts and navigation.
 */

"use client";

import { useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export interface CategoryTab {
  id: string;
  name: string;
  count: number;
  href: string;
}

export interface CategoryTabsProps {
  categories: CategoryTab[];
  activeCategory?: string;
  className?: string;
}

export function CategoryTabs({
  categories,
  activeCategory = "all",
  className,
}: CategoryTabsProps) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle tab click
  const handleTabClick = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams(searchParams);

      if (categoryId === "all") {
        params.delete("category");
      } else {
        params.set("category", categoryId);
      }

      // Reset to first page when changing category
      params.delete("page");

      const queryString = params.toString();
      const newUrl = queryString
        ? `/${locale}/catalog?${queryString}`
        : `/${locale}/catalog`;

      router.push(newUrl);
    },
    [locale, router, searchParams]
  );

  // Calculate total count
  const totalCount = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.count, 0),
    [categories]
  );

  // Add "All" tab
  const allTabs = useMemo(
    () => [
      {
        id: "all",
        name: t("allCategories"),
        count: totalCount,
        href: `/${locale}/catalog`,
      },
      ...categories,
    ],
    [categories, totalCount, t, locale]
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Tabs */}
      <div className="hidden sm:block">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav
            className="-mb-px flex space-x-8 overflow-x-auto"
            aria-label="Category tabs"
          >
            {allTabs.map((tab) => {
              const isActive = tab.id === activeCategory;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                    isActive
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="flex items-center gap-2">
                    {tab.name}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {tab.count.toLocaleString()}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <select
          value={activeCategory}
          onChange={(e) => handleTabClick(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          {allTabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.name} ({tab.count.toLocaleString()})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
