"use client";

/**
 * Search Analytics Dashboard
 *
 * Displays comprehensive search behavior metrics:
 * - Overall statistics (total searches, unique queries, etc.)
 * - Top search terms
 * - Zero-result queries (optimization opportunities)
 * - Time-based filters (7, 30, 90 days)
 */

import { useState, useEffect } from "react";
import type { AnalyticsMetrics } from "@/features/search/services/analytics.service";

interface TimeRange {
  label: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export function SearchAnalyticsDashboard() {
  const [selectedRange, setSelectedRange] = useState<number>(30);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search/analytics?daysBack=${selectedRange}`
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Admin access required");
        }
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("[SearchAnalyticsDashboard] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
          Error Loading Analytics
        </h3>
        <p className="mt-2 text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => setSelectedRange(range.days)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedRange === range.days
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchAnalytics}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Searches"
          value={metrics.totalSearches.toLocaleString()}
          icon="🔍"
        />
        <StatCard
          title="Unique Queries"
          value={metrics.uniqueQueries.toLocaleString()}
          icon="📝"
        />
        <StatCard
          title="Avg Results"
          value={metrics.avgResultsPerSearch.toString()}
          icon="📊"
        />
        <StatCard
          title="Zero Results"
          value={`${metrics.zeroResultPercentage}%`}
          icon="❌"
          trend={metrics.zeroResultPercentage > 10 ? "warning" : "success"}
        />
        <StatCard
          title="Fuzzy Usage"
          value={`${metrics.fuzzySearchUsage}%`}
          icon="🔤"
        />
      </div>

      {/* Top Search Terms */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Top Search Terms
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Query
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Searches
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Results
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Zero Results
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Fuzzy Used
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.topQueries.slice(0, 20).map((query, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {query.search_query}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {query.search_count}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {query.avg_results}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    <span
                      className={
                        query.zero_result_count > 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }
                    >
                      {query.zero_result_count}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {query.fuzzy_usage_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zero-Result Queries */}
      {metrics.zeroResultQueries.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
          <h2 className="mb-4 text-xl font-semibold text-yellow-900 dark:text-yellow-100">
            ⚠️ Zero-Result Queries (Optimization Opportunities)
          </h2>
          <p className="mb-4 text-sm text-yellow-800 dark:text-yellow-200">
            These searches returned no results. Consider adding content or
            improving search indexing.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {metrics.zeroResultQueries.slice(0, 15).map((query, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-800"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {query.query}
                </span>
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                  {query.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h2 className="mb-4 text-xl font-semibold text-blue-900 dark:text-blue-100">
          💡 Insights
        </h2>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          {metrics.zeroResultPercentage > 10 && (
            <li>
              • High zero-result rate ({metrics.zeroResultPercentage}%) -
              consider improving product coverage or search synonyms
            </li>
          )}
          {metrics.fuzzySearchUsage > 30 && (
            <li>
              • Fuzzy search is frequently used ({metrics.fuzzySearchUsage}%) -
              users may be misspelling common terms
            </li>
          )}
          {metrics.avgResultsPerSearch < 5 && (
            <li>
              • Low average results per search ({metrics.avgResultsPerSearch}) -
              search might be too restrictive
            </li>
          )}
          {metrics.avgResultsPerSearch > 50 && (
            <li>
              • High average results per search ({metrics.avgResultsPerSearch})
              - users may need better filters
            </li>
          )}
          {metrics.zeroResultPercentage <= 5 &&
            metrics.avgResultsPerSearch >= 5 &&
            metrics.avgResultsPerSearch <= 50 && (
              <li>✅ Search performance is healthy - keep monitoring</li>
            )}
        </ul>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: "success" | "warning" | "danger";
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  const trendColors = {
    success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
    warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20",
    danger: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
  };

  const borderColor = trend
    ? trendColors[trend]
    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";

  return (
    <div
      className={`rounded-lg border p-6 shadow-sm ${borderColor}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

