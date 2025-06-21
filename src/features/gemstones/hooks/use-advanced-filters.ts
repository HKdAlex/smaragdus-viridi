// Advanced Filter State Management Hook
// Following React Hook Patterns and Type Governance

'use client'

import type { GemClarity, GemColor, GemCut, GemstoneType } from '@/shared/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type {
    AdvancedGemstoneFilters,
    FilterAction,
    FilterState,
    GemstoneSort,
    PriceRange,
    WeightRange
} from '../types/filter.types'
import {
    DEFAULT_ADVANCED_FILTERS,
    clearAllFilters,
    getActiveFilterCount,
    hasActiveFilters
} from '../types/filter.types'
import {
    filtersToQueryString,
    queryStringToFilters
} from '../utils/filter-url.utils'

// ===== FILTER REDUCER =====

const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case 'SET_SEARCH':
      return {
        ...state,
        filters: { ...state.filters, search: action.payload || undefined },
        appliedFilterCount: getActiveFilterCount({ ...state.filters, search: action.payload || undefined })
      }

    case 'TOGGLE_GEMSTONE_TYPE': {
      const currentTypes = state.filters.gemstoneTypes || []
      const newTypes = currentTypes.includes(action.payload)
        ? currentTypes.filter(type => type !== action.payload)
        : [...currentTypes, action.payload]
      
      const newFilters = { ...state.filters, gemstoneTypes: newTypes.length ? newTypes : undefined }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'TOGGLE_COLOR': {
      const currentColors = state.filters.colors || []
      const newColors = currentColors.includes(action.payload)
        ? currentColors.filter(color => color !== action.payload)
        : [...currentColors, action.payload]
      
      const newFilters = { ...state.filters, colors: newColors.length ? newColors : undefined }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'TOGGLE_CUT': {
      const currentCuts = state.filters.cuts || []
      const newCuts = currentCuts.includes(action.payload)
        ? currentCuts.filter(cut => cut !== action.payload)
        : [...currentCuts, action.payload]
      
      const newFilters = { ...state.filters, cuts: newCuts.length ? newCuts : undefined }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'TOGGLE_CLARITY': {
      const currentClarities = state.filters.clarities || []
      const newClarities = currentClarities.includes(action.payload)
        ? currentClarities.filter(clarity => clarity !== action.payload)
        : [...currentClarities, action.payload]
      
      const newFilters = { ...state.filters, clarities: newClarities.length ? newClarities : undefined }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'TOGGLE_ORIGIN': {
      const currentOrigins = state.filters.origins || []
      const newOrigins = currentOrigins.includes(action.payload)
        ? currentOrigins.filter(origin => origin !== action.payload)
        : [...currentOrigins, action.payload]
      
      const newFilters = { ...state.filters, origins: newOrigins.length ? newOrigins : undefined }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'SET_PRICE_RANGE': {
      const newFilters = { ...state.filters, priceRange: action.payload }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'SET_WEIGHT_RANGE': {
      const newFilters = { ...state.filters, weightRange: action.payload }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'TOGGLE_IN_STOCK_ONLY': {
      const newFilters = { ...state.filters, inStockOnly: action.payload }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'TOGGLE_HAS_CERTIFICATION': {
      const newFilters = { ...state.filters, hasCertification: action.payload }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'TOGGLE_HAS_IMAGES': {
      const newFilters = { ...state.filters, hasImages: action.payload }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'SET_SORT': {
      const newFilters = { 
        ...state.filters, 
        sortBy: action.payload.sortBy,
        sortDirection: action.payload.sortDirection
      }
      return {
        ...state,
        filters: newFilters,
        appliedFilterCount: getActiveFilterCount(newFilters)
      }
    }

    case 'RESET_FILTERS': {
      const resetFilters = clearAllFilters()
      return {
        ...state,
        filters: resetFilters,
        appliedFilterCount: getActiveFilterCount(resetFilters)
      }
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_RESULT_COUNT':
      return { ...state, resultCount: action.payload }

    default:
      return state
  }
}

// ===== HOOK INTERFACE =====

export interface UseAdvancedFiltersReturn {
  // State
  filters: AdvancedGemstoneFilters
  isLoading: boolean
  resultCount: number
  appliedFilterCount: number
  hasFilters: boolean

  // Actions
  setSearch: (search: string) => void
  toggleGemstoneType: (type: GemstoneType) => void
  toggleColor: (color: GemColor) => void
  toggleCut: (cut: GemCut) => void
  toggleClarity: (clarity: GemClarity) => void
  toggleOrigin: (origin: string) => void
  setPriceRange: (range: PriceRange) => void
  setWeightRange: (range: WeightRange) => void
  toggleInStockOnly: (inStock: boolean) => void
  toggleHasCertification: (hasCertification: boolean) => void
  toggleHasImages: (hasImages: boolean) => void
  setSort: (sortBy: GemstoneSort, sortDirection: 'asc' | 'desc') => void
  resetFilters: () => void
  setLoading: (loading: boolean) => void
  setResultCount: (count: number) => void

  // Utilities
  isFilterActive: (filterType: keyof AdvancedGemstoneFilters, value?: unknown) => boolean
  getQueryString: () => string
}

// ===== MAIN HOOK =====

export const useAdvancedFilters = (
  initialFilters?: Partial<AdvancedGemstoneFilters>,
  syncWithUrl: boolean = true
): UseAdvancedFiltersReturn => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Track if we're updating URL to prevent circular updates
  const isUpdatingUrl = useRef(false)
  const hasInitialized = useRef(false)

  // Initialize state from URL or defaults - ONLY ONCE
  const getInitialState = useCallback((): FilterState => {
    let filters = { ...DEFAULT_ADVANCED_FILTERS, ...initialFilters }
    
    if (syncWithUrl && searchParams && !hasInitialized.current) {
      try {
        const urlFilters = queryStringToFilters(searchParams.toString())
        filters = { ...filters, ...urlFilters }
        console.log('🔄 [AdvancedFilters] Initial filters from URL:', {
          searchParams: searchParams.toString(),
          urlFilters,
          finalFilters: filters
        })
      } catch (error) {
        console.warn('Failed to parse URL filters:', error)
      }
      hasInitialized.current = true
    }
    
    return { 
      filters,
      isLoading: false,
      resultCount: 0,
      appliedFilterCount: getActiveFilterCount(filters)
    }
  }, [initialFilters, syncWithUrl, searchParams])

  // Initialize state only once
  const [state, dispatch] = useReducer(filterReducer, undefined, getInitialState)

  // Sync filters to URL only when filters actually change
  useEffect(() => {
    if (!syncWithUrl || isUpdatingUrl.current || !hasInitialized.current) {
      return
    }

    const queryString = filtersToQueryString(state.filters)
    const currentQuery = searchParams?.toString() || ''
    
    console.log('🔍 [AdvancedFilters] URL sync check:', {
      queryString,
      currentQuery,
      areEqual: queryString === currentQuery,
      filters: state.filters
    })

    if (queryString !== currentQuery) {
      console.log('🌐 [AdvancedFilters] Updating URL:', { queryString })
      isUpdatingUrl.current = true
      
      const newUrl = queryString ? `/catalog?${queryString}` : '/catalog'
      router.replace(newUrl, { scroll: false })
      
      // Reset flag after URL update
      setTimeout(() => {
        isUpdatingUrl.current = false
      }, 100)
    }
  }, [state.filters, syncWithUrl, router, searchParams])

  // Action creators
  const setSearch = useCallback((search: string) => {
    dispatch({ type: 'SET_SEARCH', payload: search })
  }, [])

  const toggleGemstoneType = useCallback((type: GemstoneType) => {
    dispatch({ type: 'TOGGLE_GEMSTONE_TYPE', payload: type })
  }, [])

  const toggleColor = useCallback((color: GemColor) => {
    dispatch({ type: 'TOGGLE_COLOR', payload: color })
  }, [])

  const toggleCut = useCallback((cut: GemCut) => {
    dispatch({ type: 'TOGGLE_CUT', payload: cut })
  }, [])

  const toggleClarity = useCallback((clarity: GemClarity) => {
    dispatch({ type: 'TOGGLE_CLARITY', payload: clarity })
  }, [])

  const toggleOrigin = useCallback((origin: string) => {
    dispatch({ type: 'TOGGLE_ORIGIN', payload: origin })
  }, [])

  const setPriceRange = useCallback((range: PriceRange) => {
    dispatch({ type: 'SET_PRICE_RANGE', payload: range })
  }, [])

  const setWeightRange = useCallback((range: WeightRange) => {
    dispatch({ type: 'SET_WEIGHT_RANGE', payload: range })
  }, [])

  const toggleInStockOnly = useCallback((inStock: boolean) => {
    dispatch({ type: 'TOGGLE_IN_STOCK_ONLY', payload: inStock })
  }, [])

  const toggleHasCertification = useCallback((hasCertification: boolean) => {
    dispatch({ type: 'TOGGLE_HAS_CERTIFICATION', payload: hasCertification })
  }, [])

  const toggleHasImages = useCallback((hasImages: boolean) => {
    dispatch({ type: 'TOGGLE_HAS_IMAGES', payload: hasImages })
  }, [])

  const setSort = useCallback((sortBy: GemstoneSort, sortDirection: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortDirection } })
  }, [])

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setResultCount = useCallback((count: number) => {
    dispatch({ type: 'SET_RESULT_COUNT', payload: count })
  }, [])

  // Utility functions
  const isFilterActive = useCallback((
    filterType: keyof AdvancedGemstoneFilters, 
    value?: unknown
  ): boolean => {
    const filterValue = state.filters[filterType]

    if (value === undefined) {
      // Check if filter has any value
      if (Array.isArray(filterValue)) {
        return filterValue.length > 0
      }
      return filterValue !== undefined && filterValue !== null
    }

    // Check if specific value is active
    if (Array.isArray(filterValue)) {
      return filterValue.includes(value as never)
    }

    return filterValue === value
  }, [state.filters])

  const getQueryString = useCallback((): string => {
    return filtersToQueryString(state.filters)
  }, [state.filters])

  // Computed values
  const hasFilters = useMemo(() => hasActiveFilters(state.filters), [state.filters])

  return {
    // State
    filters: state.filters,
    isLoading: state.isLoading,
    resultCount: state.resultCount,
    appliedFilterCount: state.appliedFilterCount,
    hasFilters,

    // Actions
    setSearch,
    toggleGemstoneType,
    toggleColor,
    toggleCut,
    toggleClarity,
    toggleOrigin,
    setPriceRange,
    setWeightRange,
    toggleInStockOnly,
    toggleHasCertification,
    toggleHasImages,
    setSort,
    resetFilters,
    setLoading,
    setResultCount,

    // Utilities
    isFilterActive,
    getQueryString
  }
} 