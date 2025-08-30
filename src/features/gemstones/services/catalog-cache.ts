// Client-side caching service for the public catalog
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class CatalogCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // Cache keys for different data types
  getFilterOptionsKey(): string {
    return 'catalog:filter-options'
  }

  getSearchResultsKey(filters: any, page: number, pageSize: number): string {
    const filterString = JSON.stringify(filters)
    return `catalog:search:${btoa(filterString)}:${page}:${pageSize}`
  }

  getStatsKey(): string {
    return 'catalog:stats'
  }

  // Invalidate related cache entries when data changes
  invalidateSearchResults(): void {
    const keysToDelete: string[] = []
    for (const key of this.cache.keys()) {
      if (key.startsWith('catalog:search:')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  invalidateAll(): void {
    this.clear()
  }
}

export const catalogCache = new CatalogCache()
