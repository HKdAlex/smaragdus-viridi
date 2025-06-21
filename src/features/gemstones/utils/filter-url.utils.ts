// URL Parameter Utilities for Advanced Gemstone Filtering
// Following Type Governance: Import from feature types

import type {
    AdvancedGemstoneFilters,
    FilterUrlParams,
    GemstoneSort,
    MutableAdvancedGemstoneFilters,
    PriceRange,
    WeightRange
} from '../types/filter.types'
import {
    DEFAULT_ADVANCED_FILTERS,
    DEFAULT_PRICE_RANGE,
    DEFAULT_WEIGHT_RANGE
} from '../types/filter.types'
import type { GemClarity, GemColor, GemCut, GemstoneType } from '@/shared/types'

// ===== URL SERIALIZATION =====

export const filtersToUrlParams = (filters: AdvancedGemstoneFilters): FilterUrlParams => {
  const params: Record<string, string> = {}

  // Text search
  if (filters.search) {
    params.search = filters.search
  }

  // Arrays - comma separated
  if (filters.gemstoneTypes?.length) {
    params.types = filters.gemstoneTypes.join(',')
  }
  
  if (filters.colors?.length) {
    params.colors = filters.colors.join(',')
  }
  
  if (filters.cuts?.length) {
    params.cuts = filters.cuts.join(',')
  }
  
  if (filters.clarities?.length) {
    params.clarities = filters.clarities.join(',')
  }
  
  if (filters.origins?.length) {
    params.origins = filters.origins.join(',')
  }

  // Price range
  if (filters.priceRange) {
    params.priceMin = filters.priceRange.min.toString()
    params.priceMax = filters.priceRange.max.toString()
  }

  // Weight range
  if (filters.weightRange) {
    params.weightMin = filters.weightRange.min.toString()
    params.weightMax = filters.weightRange.max.toString()
  }

  // Boolean filters
  if (filters.inStockOnly !== undefined) {
    params.inStock = filters.inStockOnly.toString()
  }
  
  if (filters.hasCertification) {
    params.certified = 'true'
  }
  
  if (filters.hasImages) {
    params.hasImages = 'true'
  }

  // Sorting
  if (filters.sortBy) {
    params.sort = filters.sortBy
  }
  
  if (filters.sortDirection) {
    params.dir = filters.sortDirection
  }

  return params as FilterUrlParams
}

// ===== URL DESERIALIZATION =====

export const urlParamsToFilters = (params: FilterUrlParams): AdvancedGemstoneFilters => {
  const filters: MutableAdvancedGemstoneFilters = { ...DEFAULT_ADVANCED_FILTERS }

  // Text search
  if (params.search) {
    filters.search = params.search
  }

  // Arrays - split comma separated values
  if (params.types) {
    filters.gemstoneTypes = params.types.split(',').filter(Boolean) as GemstoneType[]
  }
  
  if (params.colors) {
    filters.colors = params.colors.split(',').filter(Boolean) as GemColor[]
  }
  
  if (params.cuts) {
    filters.cuts = params.cuts.split(',').filter(Boolean) as GemCut[]
  }
  
  if (params.clarities) {
    filters.clarities = params.clarities.split(',').filter(Boolean) as GemClarity[]
  }
  
  if (params.origins) {
    filters.origins = params.origins.split(',').filter(Boolean)
  }

  // Price range
  if (params.priceMin || params.priceMax) {
    const priceRange: PriceRange = {
      min: params.priceMin ? parseInt(params.priceMin, 10) : DEFAULT_PRICE_RANGE.min,
      max: params.priceMax ? parseInt(params.priceMax, 10) : DEFAULT_PRICE_RANGE.max,
      currency: DEFAULT_PRICE_RANGE.currency
    }
    filters.priceRange = priceRange
  }

  // Weight range
  if (params.weightMin || params.weightMax) {
    const weightRange: WeightRange = {
      min: params.weightMin ? parseFloat(params.weightMin) : DEFAULT_WEIGHT_RANGE.min,
      max: params.weightMax ? parseFloat(params.weightMax) : DEFAULT_WEIGHT_RANGE.max
    }
    filters.weightRange = weightRange
  }

  // Boolean filters
  if (params.inStock) {
    filters.inStockOnly = params.inStock === 'true'
  }
  
  if (params.certified) {
    filters.hasCertification = params.certified === 'true'
  }
  
  if (params.hasImages) {
    filters.hasImages = params.hasImages === 'true'
  }

  // Sorting
  if (params.sort && isValidGemstoneSort(params.sort)) {
    filters.sortBy = params.sort
  }
  
  if (params.dir && (params.dir === 'asc' || params.dir === 'desc')) {
    filters.sortDirection = params.dir
  }

  return filters as AdvancedGemstoneFilters
}

// ===== URL QUERY STRING UTILITIES =====

export const filtersToQueryString = (filters: AdvancedGemstoneFilters): string => {
  const params = filtersToUrlParams(filters)
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value)
    }
  })

  return searchParams.toString()
}

export const queryStringToFilters = (queryString: string): AdvancedGemstoneFilters => {
  const searchParams = new URLSearchParams(queryString)
  const params: Record<string, string> = {}

  // Convert URLSearchParams to our FilterUrlParams interface
  for (const [key, value] of searchParams.entries()) {
    if (isValidFilterParam(key)) {
      params[key] = value
    }
  }

  return urlParamsToFilters(params as FilterUrlParams)
}

// ===== VALIDATION UTILITIES =====

const isValidGemstoneSort = (sort: string): sort is GemstoneSort => {
  const validSorts: GemstoneSort[] = [
    'created_at', 'price_amount', 'weight_carats', 'name', 'color', 'cut'
  ]
  return validSorts.includes(sort as GemstoneSort)
}

const isValidFilterParam = (param: string): boolean => {
  const validParams = [
    'search', 'types', 'colors', 'cuts', 'clarities', 'origins',
    'priceMin', 'priceMax', 'weightMin', 'weightMax',
    'inStock', 'certified', 'hasImages', 'sort', 'dir'
  ]
  return validParams.includes(param)
}

// ===== BROWSER HISTORY UTILITIES =====

export const updateUrlWithFilters = (
  filters: AdvancedGemstoneFilters,
  replace: boolean = false
): void => {
  if (typeof window === 'undefined') return

  const queryString = filtersToQueryString(filters)
  const url = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname

  if (replace) {
    window.history.replaceState({}, '', url)
  } else {
    window.history.pushState({}, '', url)
  }
}

export const getFiltersFromCurrentUrl = (): AdvancedGemstoneFilters => {
  if (typeof window === 'undefined') return DEFAULT_ADVANCED_FILTERS

  return queryStringToFilters(window.location.search.slice(1))
}

// ===== FILTER COMPARISON UTILITIES =====

export const areFiltersEqual = (
  filters1: AdvancedGemstoneFilters,
  filters2: AdvancedGemstoneFilters
): boolean => {
  // Simple deep comparison for filter objects
  return JSON.stringify(filters1) === JSON.stringify(filters2)
}

export const getFilterDifferences = (
  oldFilters: AdvancedGemstoneFilters,
  newFilters: AdvancedGemstoneFilters
): Partial<AdvancedGemstoneFilters> => {
  const differences: Partial<AdvancedGemstoneFilters> = {}

  // Compare each filter property
  const keys = Object.keys(newFilters) as Array<keyof AdvancedGemstoneFilters>
  
  keys.forEach(key => {
    const oldValue = oldFilters[key]
    const newValue = newFilters[key]

    // Handle array comparisons
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort())) {
        ;(differences as Record<string, unknown>)[key] = newValue
      }
    } 
    // Handle object comparisons (price/weight ranges)
    else if (typeof oldValue === 'object' && typeof newValue === 'object') {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        ;(differences as Record<string, unknown>)[key] = newValue
      }
    }
    // Handle primitive comparisons
    else if (oldValue !== newValue) {
      ;(differences as Record<string, unknown>)[key] = newValue
    }
  })

  return differences
}

// ===== CLEAN URL UTILITIES =====

export const cleanUrlParams = (params: FilterUrlParams): FilterUrlParams => {
  const cleaned: Record<string, string> = {}

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'false') {
      cleaned[key] = value
    }
  })

  return cleaned as FilterUrlParams
}

export const getMinimalUrlParams = (filters: AdvancedGemstoneFilters): FilterUrlParams => {
  const params = filtersToUrlParams(filters)
  const defaults = filtersToUrlParams(DEFAULT_ADVANCED_FILTERS)
  const minimal: Record<string, string> = {}

  // Only include params that differ from defaults
  Object.entries(params).forEach(([key, value]) => {
    const defaultValue = defaults[key as keyof FilterUrlParams]
    if (value !== defaultValue && value !== undefined && value !== '') {
      minimal[key] = value
    }
  })

  return minimal as FilterUrlParams
} 