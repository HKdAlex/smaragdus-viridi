/**
 * Search Analytics Admin Dashboard
 *
 * Displays search behavior insights:
 * - Most searched terms
 * - Zero-result queries
 * - Fuzzy search usage
 * - Search trends over time
 */

import { SearchAnalyticsDashboard } from "@/features/admin/components/search-analytics-dashboard";
import { Suspense } from "react";

export default function SearchAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Search Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor search behavior and identify optimization opportunities
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading analytics...
              </p>
            </div>
          </div>
        }
      >
        <SearchAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
