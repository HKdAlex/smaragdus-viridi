import type { SearchFilters } from "../components/enhanced-search";

// Admin-specific caching service
class AdminCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Cache duration constants
  private readonly FILTER_OPTIONS_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly GEMSTONE_STATS_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly SEARCH_RESULTS_TTL = 1 * 60 * 1000; // 1 minute

  // Generate cache key for filter options
  private getFilterOptionsKey(): string {
    return 'admin:filter-options';
  }

  // Generate cache key for gemstone stats
  private getGemstoneStatsKey(): string {
    return 'admin:gemstone-stats';
  }

  // Generate cache key for search results
  private getSearchResultsKey(filters: SearchFilters, page: number): string {
    const filterString = JSON.stringify({
      query: filters.query,
      types: filters.types?.sort(),
      colors: filters.colors?.sort(),
      cuts: filters.cuts?.sort(),
      clarities: filters.clarities?.sort(),
      origins: filters.origins?.sort(),
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      weightMin: filters.weightMin,
      weightMax: filters.weightMax,
      inStock: filters.inStock,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
    return `admin:search:${filterString}:page:${page}`;
  }

  // Check if cache entry is expired
  private isExpired(entry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Get cached filter options
  getCachedFilterOptions() {
    const key = this.getFilterOptionsKey();
    const entry = this.cache.get(key);

    if (entry && !this.isExpired(entry)) {
      console.log('🔄 [AdminCache] Using cached filter options');
      return entry.data;
    }

    // Clean up expired entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  // Cache filter options
  setCachedFilterOptions(data: any) {
    const key = this.getFilterOptionsKey();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.FILTER_OPTIONS_TTL,
    });
    console.log('💾 [AdminCache] Cached filter options');
  }

  // Get cached gemstone stats
  getCachedGemstoneStats() {
    const key = this.getGemstoneStatsKey();
    const entry = this.cache.get(key);

    if (entry && !this.isExpired(entry)) {
      console.log('🔄 [AdminCache] Using cached gemstone stats');
      return entry.data;
    }

    // Clean up expired entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  // Cache gemstone stats
  setCachedGemstoneStats(data: any) {
    const key = this.getGemstoneStatsKey();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.GEMSTONE_STATS_TTL,
    });
    console.log('💾 [AdminCache] Cached gemstone stats');
  }

  // Get cached search results
  getCachedSearchResults(filters: SearchFilters, page: number) {
    const key = this.getSearchResultsKey(filters, page);
    const entry = this.cache.get(key);

    if (entry && !this.isExpired(entry)) {
      console.log('🔄 [AdminCache] Using cached search results', { page });
      return entry.data;
    }

    // Clean up expired entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  // Cache search results
  setCachedSearchResults(filters: SearchFilters, page: number, data: any) {
    const key = this.getSearchResultsKey(filters, page);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.SEARCH_RESULTS_TTL,
    });
    console.log('💾 [AdminCache] Cached search results', { page });
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
    console.log('🗑️ [AdminCache] Cleared all cache');
  }

  // Clear expired entries
  clearExpired() {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 [AdminCache] Cleared ${cleared} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const totalEntries = this.cache.size;
    const now = Date.now();
    let expiredEntries = 0;
    let activeEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      totalEntries,
      activeEntries,
      expiredEntries,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length,
    };
  }
}

// Export singleton instance
export const adminCache = new AdminCacheService();

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    adminCache.clearExpired();
  }, 5 * 60 * 1000);
}
