// Gemstone Filter Types - Smaragdus Viridi
// Following workspace rules: strict typing for filtering and search

import { CurrencyCode, GemClarity, GemColor, GemCut, GemstoneType } from '@/shared/types'

export type SortField = 
  | 'price_amount'
  | 'weight_carats'
  | 'created_at'
  | 'name'
  | 'color'
  | 'cut'

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  readonly field: SortField
  readonly direction: SortDirection
}

export interface PriceRange {
  readonly min: number // In smallest currency unit (cents)
  readonly max: number
  readonly currency: CurrencyCode
}

export interface WeightRange {
  readonly min: number // In carats
  readonly max: number
}

export interface GemstoneFilters {
  readonly search?: string
  readonly types?: GemstoneType[]
  readonly colors?: GemColor[]
  readonly cuts?: GemCut[]
  readonly clarity?: GemClarity[]
  readonly price_range?: PriceRange
  readonly weight_range?: WeightRange
  readonly origins?: string[] // Origin IDs
  readonly in_stock_only?: boolean
  readonly has_certification?: boolean
  readonly has_images?: boolean
  readonly has_videos?: boolean
}

export interface FilterOption<T = string> {
  readonly value: T
  readonly label: string
  readonly count?: number // Number of gemstones matching this filter
  readonly disabled?: boolean
}

export interface FilterSection {
  readonly key: keyof GemstoneFilters
  readonly label: string
  readonly type: 'checkbox' | 'radio' | 'range' | 'search' | 'toggle'
  readonly options?: FilterOption[]
  readonly min?: number
  readonly max?: number
  readonly step?: number
}

export interface CatalogQuery {
  readonly filters: GemstoneFilters
  readonly sort: SortConfig
  readonly page: number
  readonly per_page: number
}

export interface FilterState {
  readonly activeFilters: GemstoneFilters
  readonly availableFilters: FilterSection[]
  readonly isLoading: boolean
  readonly hasActiveFilters: boolean
}

// Quick filter presets for common searches
export interface QuickFilter {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly filters: GemstoneFilters
  readonly sort?: SortConfig
}

export const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'premium-diamonds',
    label: 'Premium Diamonds',
    description: 'High-quality diamonds with excellent cuts',
    filters: {
      types: ['diamond'],
      colors: ['D', 'E', 'F', 'G'],
      cuts: ['round', 'princess', 'emerald'],
      clarity: ['FL', 'IF', 'VVS1', 'VVS2'],
      in_stock_only: true
    },
    sort: { field: 'price_amount', direction: 'desc' }
  },
  {
    id: 'colored-gemstones',
    label: 'Colored Gemstones',
    description: 'Beautiful colored stones',
    filters: {
      types: ['ruby', 'emerald', 'sapphire', 'tanzanite'],
      in_stock_only: true
    },
    sort: { field: 'weight_carats', direction: 'desc' }
  },
  {
    id: 'investment-grade',
    label: 'Investment Grade',
    description: 'High-value gems for investment',
    filters: {
      price_range: { min: 100000000, max: 999999999, currency: 'USD' }, // $1M+
      has_certification: true,
      in_stock_only: true
    },
    sort: { field: 'price_amount', direction: 'desc' }
  },
  {
    id: 'under-100k',
    label: 'Under $100k',
    description: 'Affordable luxury stones',
    filters: {
      price_range: { min: 0, max: 10000000, currency: 'USD' }, // Under $100k
      in_stock_only: true
    },
    sort: { field: 'price_amount', direction: 'asc' }
  }
]

// Default filter values
export const DEFAULT_FILTERS: GemstoneFilters = {
  in_stock_only: false,
  has_certification: false,
  has_images: false,
  has_videos: false
}

export const DEFAULT_SORT: SortConfig = {
  field: 'created_at',
  direction: 'desc'
}

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  filters: DEFAULT_FILTERS,
  sort: DEFAULT_SORT,
  page: 1,
  per_page: 20
}

// Helper functions for filter validation
export const isValidSortField = (field: string): field is SortField => {
  const validFields: SortField[] = [
    'price_amount', 'weight_carats', 'created_at', 'name', 'color', 'cut'
  ]
  return validFields.includes(field as SortField)
}

export const isValidSortDirection = (direction: string): direction is SortDirection => {
  return direction === 'asc' || direction === 'desc'
}

// Filter utility functions
export const hasActiveFilters = (filters: GemstoneFilters): boolean => {
  return !!(
    filters.search ||
    filters.types?.length ||
    filters.colors?.length ||
    filters.cuts?.length ||
    filters.clarity?.length ||
    filters.price_range ||
    filters.weight_range ||
    filters.origins?.length ||
    filters.in_stock_only ||
    filters.has_certification ||
    filters.has_images ||
    filters.has_videos
  )
}

export const getActiveFilterCount = (filters: GemstoneFilters): number => {
  let count = 0
  if (filters.search) count++
  if (filters.types?.length) count++
  if (filters.colors?.length) count++
  if (filters.cuts?.length) count++
  if (filters.clarity?.length) count++
  if (filters.price_range) count++
  if (filters.weight_range) count++
  if (filters.origins?.length) count++
  if (filters.in_stock_only) count++
  if (filters.has_certification) count++
  if (filters.has_images) count++
  if (filters.has_videos) count++
  return count
}

export const clearAllFilters = (): GemstoneFilters => DEFAULT_FILTERS 