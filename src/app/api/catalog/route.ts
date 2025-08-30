import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase'

type GemstoneFilters = {
  search?: string
  gemstoneTypes?: string[]
  colors?: string[]
  cuts?: string[]
  clarities?: string[]
  origins?: string[]
  priceMin?: number
  priceMax?: number
  weightMin?: number
  weightMax?: number
  inStockOnly?: boolean
  hasImages?: boolean
  hasCertification?: boolean
  hasAIAnalysis?: boolean
  sortBy?: 'created_at' | 'price_amount' | 'weight_carats' | 'name'
  sortDirection?: 'asc' | 'desc'
}

type PaginationParams = {
  page: number
  pageSize: number
}

// Server-side filtering and pagination API
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    const supabase = supabaseAdmin

    const { searchParams } = new URL(request.url)

    // Parse filters from query parameters
    const filters: GemstoneFilters = {
      search: searchParams.get('search') || undefined,
      gemstoneTypes: searchParams.get('gemstoneTypes')?.split(',') || undefined,
      colors: searchParams.get('colors')?.split(',') || undefined,
      cuts: searchParams.get('cuts')?.split(',') || undefined,
      clarities: searchParams.get('clarities')?.split(',') || undefined,
      origins: searchParams.get('origins')?.split(',') || undefined,
      priceMin: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined,
      weightMin: searchParams.get('weightMin') ? parseFloat(searchParams.get('weightMin')!) : undefined,
      weightMax: searchParams.get('weightMax') ? parseFloat(searchParams.get('weightMax')!) : undefined,
      inStockOnly: searchParams.get('inStockOnly') === 'true',
      hasImages: searchParams.get('hasImages') === 'true',
      hasCertification: searchParams.get('hasCertification') === 'true',
      hasAIAnalysis: searchParams.get('hasAIAnalysis') === 'true',
      sortBy: (searchParams.get('sortBy') as GemstoneFilters['sortBy']) || 'created_at',
      sortDirection: (searchParams.get('sortDirection') as GemstoneFilters['sortDirection']) || 'desc',
    }

    // Parse pagination
    const pagination: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '24'), 100), // Max 100 per page
    }

    // Build the query with filters
    let query = supabase
      .from('gemstones')
      .select(`
        id,
        name,
        color,
        cut,
        weight_carats,
        clarity,
        price_amount,
        price_currency,
        premium_price_amount,
        premium_price_currency,
        in_stock,
        delivery_days,
        internal_code,
        serial_number,
        created_at,
        updated_at,
        images:gemstone_images!inner(id, image_url, is_primary),
        origin:origins(id, name, country),
        certifications:certifications(id, certificate_type),
        ai_analysis:ai_analysis_results!left(id, confidence_score, analysis_type)
      `, { count: 'exact' })

    // Apply filters
    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(`serial_number.ilike.${searchTerm},internal_code.ilike.${searchTerm},name.ilike.${searchTerm},color.ilike.${searchTerm},cut.ilike.${searchTerm}`)
    }

    if (filters.gemstoneTypes?.length) {
      // Cast to proper enum type - these should be valid gemstone types
      const validGemstoneTypes = filters.gemstoneTypes.filter(type => 
        ['emerald', 'diamond', 'ruby', 'sapphire', 'amethyst', 'topaz', 'garnet', 'peridot', 'citrine', 'tanzanite', 'aquamarine', 'morganite', 'tourmaline', 'zircon', 'apatite', 'quartz'].includes(type)
      ) as any[]
      if (validGemstoneTypes.length > 0) {
        query = query.in('name', validGemstoneTypes)
      }
    }

    if (filters.colors?.length) {
      // Cast to proper enum type - these should be valid gem colors
      const validColors = filters.colors.filter(color => 
        ['red', 'blue', 'green', 'yellow', 'pink', 'white', 'black', 'colorless', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'fancy-yellow', 'fancy-blue', 'fancy-pink', 'fancy-green'].includes(color)
      ) as any[]
      if (validColors.length > 0) {
        query = query.in('color', validColors)
      }
    }

    if (filters.cuts?.length) {
      // Cast to proper enum type - these should be valid gem cuts
      const validCuts = filters.cuts.filter(cut => 
        ['round', 'oval', 'marquise', 'pear', 'emerald', 'princess', 'cushion', 'radiant', 'fantasy'].includes(cut)
      ) as any[]
      if (validCuts.length > 0) {
        query = query.in('cut', validCuts)
      }
    }

    if (filters.clarities?.length) {
      // Cast to proper enum type - these should be valid gem clarities
      const validClarities = filters.clarities.filter(clarity => 
        ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'].includes(clarity)
      ) as any[]
      if (validClarities.length > 0) {
        query = query.in('clarity', validClarities)
      }
    }

    if (filters.origins?.length) {
      // First, get the origin IDs for the provided origin names
      const { data: originIds, error: originError } = await supabase
        .from('origins')
        .select('id')
        .in('name', filters.origins)
      
      if (originError) {
        console.error('Error fetching origin IDs:', originError)
        return NextResponse.json({ error: 'Failed to fetch origin data' }, { status: 500 })
      }
      
      if (originIds && originIds.length > 0) {
        const ids = originIds.map(origin => origin.id)
        query = query.in('origin_id', ids)
      } else {
        // If no origins found, return empty result
        query = query.eq('id', '00000000-0000-0000-0000-000000000000') // Impossible UUID
      }
    }

    if (filters.priceMin !== undefined) {
      query = query.gte('price_amount', filters.priceMin * 100) // Convert to cents
    }

    if (filters.priceMax !== undefined) {
      query = query.lte('price_amount', filters.priceMax * 100) // Convert to cents
    }

    if (filters.weightMin !== undefined) {
      query = query.gte('weight_carats', filters.weightMin)
    }

    if (filters.weightMax !== undefined) {
      query = query.lte('weight_carats', filters.weightMax)
    }

    if (filters.inStockOnly) {
      query = query.eq('in_stock', true)
    }

    if (filters.hasImages) {
      // This is handled by the inner join above
    }

    if (filters.hasCertification) {
      // This is handled by the inner join above
    }

    if (filters.hasAIAnalysis) {
      // This is handled by the left join above - we'll filter in JavaScript
    }

    // Apply sorting
    const sortColumn = filters.sortBy || 'created_at'
    const sortDirection = filters.sortDirection || 'desc'
    query = query.order(sortColumn, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (pagination.page - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    // Post-process results for complex filters
    let processedData = data || []

    // Filter for AI analysis if required
    if (filters.hasAIAnalysis) {
      processedData = processedData.filter(item =>
        item.ai_analysis &&
        Array.isArray(item.ai_analysis) &&
        item.ai_analysis.length > 0 &&
        item.ai_analysis.some((analysis: any) =>
          analysis.confidence_score && analysis.confidence_score >= 0.5
        )
      )
    }

    // Transform data to match frontend expectations
    const transformedData = processedData.map((gemstone: any) => ({
      ...gemstone,
      images: gemstone.images || [],
      origin: gemstone.origin || null,
      certifications: gemstone.certifications || [],
      ai_analysis: (gemstone.ai_analysis || []).filter((analysis: any) =>
        analysis.confidence_score >= 0.5
      ),
    }))

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / pagination.pageSize)

    return NextResponse.json({
      data: transformedData,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: count || 0,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1,
      },
      filters: filters,
    })

  } catch (error) {
    console.error('Catalog API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get filter options for the catalog
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    const supabase = supabaseAdmin

    const body = await request.json()
    const { type } = body // 'counts' or 'options'

    if (type === 'counts') {
      // Get counts for all filter options
      const [
        gemstoneTypesResult,
        colorsResult,
        cutsResult,
        claritiesResult,
        originsResult,
      ] = await Promise.all([
        supabase.from('gemstones').select('name').not('name', 'is', null),
        supabase.from('gemstones').select('color').not('color', 'is', null),
        supabase.from('gemstones').select('cut').not('cut', 'is', null),
        supabase.from('gemstones').select('clarity').not('clarity', 'is', null),
        supabase.from('origins').select('name, country').not('name', 'is', null),
      ])

      const countOccurrences = (items: any[], key: string) => {
        return items.reduce((acc, item) => {
          const value = item[key]
          acc[value] = (acc[value] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      const gemstoneTypeCounts = countOccurrences(gemstoneTypesResult.data || [], 'name')
      const colorCounts = countOccurrences(colorsResult.data || [], 'color')
      const cutCounts = countOccurrences(cutsResult.data || [], 'cut')
      const clarityCounts = countOccurrences(claritiesResult.data || [], 'clarity')
      const originCounts = countOccurrences(originsResult.data || [], 'name')

      return NextResponse.json({
        gemstoneTypes: gemstoneTypeCounts,
        colors: colorCounts,
        cuts: cutCounts,
        clarities: clarityCounts,
        origins: originCounts,
      })
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })

  } catch (error) {
    console.error('Filter options API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
