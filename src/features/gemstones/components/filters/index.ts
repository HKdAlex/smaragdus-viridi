// Filter Components Export Index
// Following Module Organization Patterns

export { AdvancedFilters } from './advanced-filters'
export { AdvancedFiltersV2 } from './advanced-filters-v2'
export { FilterDropdown } from './filter-dropdown'
export { RangeSlider } from './range-slider'

// Re-export types for convenience
export type {
    AdvancedGemstoneFilters, FilterAction, FilterOptions,
    FilterState, GemstoneSort, PriceRange,
    WeightRange
} from '../../types/filter.types'

// Re-export hook for convenience
export { useAdvancedFilters } from '../../hooks/use-advanced-filters'
export type { UseAdvancedFiltersReturn } from '../../hooks/use-advanced-filters'

