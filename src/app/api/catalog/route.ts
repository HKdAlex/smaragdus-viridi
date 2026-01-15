import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

// Simple in-memory cache for filter options (5 minute TTL)
const filterOptionsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedFilterOptions(key: string) {
  const cached = filterOptionsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedFilterOptions(key: string, data: any) {
  filterOptionsCache.set(key, { data, timestamp: Date.now() });
}

type GemstoneFilters = {
  search?: string;
  gemstoneTypes?: string[];
  colors?: string[];
  cuts?: string[];
  clarities?: string[];
  origins?: string[];
  treatmentStatus?: string[];
  miningCountries?: string[];
  qualityClassifications?: string[];
  hasColorChange?: boolean;
  minLength?: number;
  maxLength?: number;
  minWidth?: number;
  maxWidth?: number;
  minPricePerCarat?: number;
  maxPricePerCarat?: number;
  priceMin?: number;
  priceMax?: number;
  weightMin?: number;
  weightMax?: number;
  inStockOnly?: boolean;
  hasImages?: boolean;
  hasCertification?: boolean;
  hasAIAnalysis?: boolean;
  sortBy?: "created_at" | "price_amount" | "weight_carats" | "name";
  sortDirection?: "asc" | "desc";
};

type PaginationParams = {
  page: number;
  pageSize: number;
};

// Server-side filtering and pagination API
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }
    const supabase = supabaseAdmin;

    const { searchParams } = new URL(request.url);

    // Parse filters from query parameters
    const filters: GemstoneFilters = {
      search: searchParams.get("search") || undefined,
      gemstoneTypes: searchParams.get("gemstoneTypes")?.split(",") || undefined,
      colors: searchParams.get("colors")?.split(",") || undefined,
      cuts: searchParams.get("cuts")?.split(",") || undefined,
      clarities: searchParams.get("clarities")?.split(",") || undefined,
      origins: searchParams.get("origins")?.split(",") || undefined,
      treatmentStatus:
        searchParams.get("treatmentStatus")?.split(",") || undefined,
      miningCountries:
        searchParams.get("miningCountries")?.split(",") || undefined,
      qualityClassifications:
        searchParams.get("qualityClassifications")?.split(",") || undefined,
      hasColorChange: searchParams.get("hasColorChange") === "true",
      minLength: searchParams.get("minLength")
        ? parseFloat(searchParams.get("minLength")!)
        : undefined,
      maxLength: searchParams.get("maxLength")
        ? parseFloat(searchParams.get("maxLength")!)
        : undefined,
      minWidth: searchParams.get("minWidth")
        ? parseFloat(searchParams.get("minWidth")!)
        : undefined,
      maxWidth: searchParams.get("maxWidth")
        ? parseFloat(searchParams.get("maxWidth")!)
        : undefined,
      minPricePerCarat: searchParams.get("minPricePerCarat")
        ? parseFloat(searchParams.get("minPricePerCarat")!)
        : undefined,
      maxPricePerCarat: searchParams.get("maxPricePerCarat")
        ? parseFloat(searchParams.get("maxPricePerCarat")!)
        : undefined,
      priceMin: searchParams.get("priceMin")
        ? parseFloat(searchParams.get("priceMin")!)
        : undefined,
      priceMax: searchParams.get("priceMax")
        ? parseFloat(searchParams.get("priceMax")!)
        : undefined,
      weightMin: searchParams.get("weightMin")
        ? parseFloat(searchParams.get("weightMin")!)
        : undefined,
      weightMax: searchParams.get("weightMax")
        ? parseFloat(searchParams.get("weightMax")!)
        : undefined,
      inStockOnly: searchParams.get("inStockOnly") === "true",
      hasImages: searchParams.get("hasImages") === "true",
      hasCertification: searchParams.get("hasCertification") === "true",
      hasAIAnalysis: searchParams.get("hasAIAnalysis") === "true",
      sortBy:
        (searchParams.get("sortBy") as GemstoneFilters["sortBy"]) ||
        "created_at",
      sortDirection:
        (searchParams.get(
          "sortDirection"
        ) as GemstoneFilters["sortDirection"]) || "desc",
    };

    // Parse pagination
    const pagination: PaginationParams = {
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: Math.min(parseInt(searchParams.get("pageSize") || "24"), 100), // Max 100 per page
    };

    // If search is present, use database function (handles enum casting properly)
    // Otherwise use PostgREST query builder
    if (filters.search && filters.search.trim()) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "catalog_search_gemstones" as any,
          {
            search_query: filters.search.trim(),
            page_number: pagination.page,
            page_size: pagination.pageSize,
            filter_types: filters.gemstoneTypes || null,
            filter_colors: filters.colors || null,
            filter_cuts: filters.cuts || null,
            filter_clarities: filters.clarities || null,
            filter_origins: filters.origins || null,
            filter_price_min: filters.priceMin ? filters.priceMin * 100 : null, // Convert to cents
            filter_price_max: filters.priceMax ? filters.priceMax * 100 : null,
            filter_weight_min: filters.weightMin || null,
            filter_weight_max: filters.weightMax || null,
            filter_in_stock_only: filters.inStockOnly || null,
            filter_has_images: filters.hasImages || null,
            filter_has_certification: filters.hasCertification || null,
            filter_treatment_status: filters.treatmentStatus || null,
            filter_mining_countries: filters.miningCountries || null,
            filter_quality_classifications: filters.qualityClassifications || null,
            filter_has_color_change: filters.hasColorChange || null,
            filter_min_length: filters.minLength || null,
            filter_max_length: filters.maxLength || null,
            filter_min_width: filters.minWidth || null,
            filter_max_width: filters.maxWidth || null,
            filter_min_price_per_carat: filters.minPricePerCarat || null,
            filter_max_price_per_carat: filters.maxPricePerCarat || null,
            sort_by: filters.sortBy || "created_at",
            sort_direction: filters.sortDirection || "desc",
          }
        );

        if (rpcError) {
          console.error("[CatalogAPI] RPC search error:", rpcError);
          // Fall back to PostgREST query without search
          // Continue to regular query below
        } else if (rpcData) {
          // Transform RPC results to match expected format
          const totalCount = rpcData[0]?.total_count || 0;
          const transformedData = rpcData.map((gemstone: any) => {
            // Get origin and certifications
            const origin = gemstone.origin_id
              ? {
                  id: gemstone.origin_id,
                  name: gemstone.origin_name,
                  country: gemstone.origin_country,
                }
              : null;

            return {
              id: gemstone.id,
              name: gemstone.name,
              color: gemstone.color,
              cut: gemstone.cut,
              weight_carats: gemstone.weight_carats,
              clarity: gemstone.clarity,
              price_amount: gemstone.price_amount,
              price_currency: gemstone.price_currency,
              in_stock: gemstone.in_stock,
              serial_number: gemstone.serial_number,
              ai_color: gemstone.ai_color,
              created_at: gemstone.created_at,
              updated_at: gemstone.updated_at,
              emotional_description_en: gemstone.emotional_description_en,
              emotional_description_ru: gemstone.emotional_description_ru,
              marketing_highlights_en: gemstone.marketing_highlights_en,
              marketing_highlights_ru: gemstone.marketing_highlights_ru,
              recommended_primary_image_index:
                gemstone.recommended_primary_image_index,
              selected_image_uuid: gemstone.selected_image_uuid,
              detected_cut: gemstone.detected_cut,
              primary_image_url: gemstone.primary_image_url,
              primary_video_url: gemstone.primary_video_url,
              origin: origin,
              certifications: [], // Would need separate query
              images: gemstone.primary_image_url
                ? [
                    {
                      id: "primary",
                      gemstone_id: gemstone.id,
                      image_url: gemstone.primary_image_url,
                      is_primary: true,
                      image_order: 0,
                    },
                  ]
                : [],
              v6_text: gemstone.emotional_description_en
                ? {
                    emotional_description_en:
                      gemstone.emotional_description_en,
                    emotional_description_ru: gemstone.emotional_description_ru,
                    marketing_highlights_en:
                      gemstone.marketing_highlights_en,
                    marketing_highlights_ru: gemstone.marketing_highlights_ru,
                    recommended_primary_image_index:
                      gemstone.recommended_primary_image_index,
                    selected_image_uuid: gemstone.selected_image_uuid,
                    detected_cut: gemstone.detected_cut,
                  }
                : null,
            };
          });

          const totalPages = Math.ceil(totalCount / pagination.pageSize);

          return NextResponse.json({
            data: transformedData,
            pagination: {
              page: pagination.page,
              pageSize: pagination.pageSize,
              totalItems: totalCount,
              totalPages,
              hasNextPage: pagination.page < totalPages,
              hasPrevPage: pagination.page > 1,
            },
            filters: filters,
          });
        }
      } catch (error) {
        console.error("[CatalogAPI] RPC call failed, falling back:", error);
        // Fall through to PostgREST query
      }
    }

    // Build the query with filters using gemstones_enriched view
    let query = supabase.from("gemstones_enriched").select(
      `
        id,
        name,
        color,
        cut,
        weight_carats,
        clarity,
        price_amount,
        price_currency,
        in_stock,
        serial_number,
        ai_color,
        created_at,
        updated_at,
        emotional_description_en,
        emotional_description_ru,
        marketing_highlights_en,
        marketing_highlights_ru,
        recommended_primary_image_index,
        selected_image_uuid,
        detected_cut,
        primary_image_url,
        primary_video_url,
        origin:origins(id, name, country),
        certifications:certifications(id, certificate_type)
      `,
      { count: "exact" }
    );

    // Apply filters
    // Always filter out items with price <= 0 and no images
    query = query.gt("price_amount", 0).not("primary_image_url", "is", null);

    // If search is present but RPC function wasn't used (or failed), use ilike on view columns
    // The gemstones_enriched view casts enum columns to text, so ilike should work
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      const escapedSearch = searchTerm
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
      const pattern = `%${escapedSearch}%`;
      // Search in serial_number, name, color, and cut (all are text in the view)
      query = query.or(
        `serial_number.ilike.${pattern},name.ilike.${pattern},color.ilike.${pattern},cut.ilike.${pattern}`
      );
    }

    if (filters.gemstoneTypes?.length) {
      // Get valid gemstone types from database with caching
      let availableTypes = getCachedFilterOptions("gemstone-types");

      if (!availableTypes) {
        const { data: validTypes } = await supabase
          .from("gemstones_enriched")
          .select("name")
          .not("name", "is", null)
          .gt("price_amount", 0);

        availableTypes = new Set(
          (validTypes || []).map((t: any) => t.name).filter(Boolean)
        );
        setCachedFilterOptions("gemstone-types", availableTypes);
      }

      const validGemstoneTypes = filters.gemstoneTypes.filter((type) =>
        availableTypes.has(type)
      );

      if (validGemstoneTypes.length > 0) {
        query = query.in("name", validGemstoneTypes);
      }
    }

    if (filters.colors?.length) {
      // Get valid colors from database with caching
      let availableColors = getCachedFilterOptions("colors");

      if (!availableColors) {
        const { data: validColors } = await supabase
          .from("gemstones_enriched")
          .select("color")
          .not("color", "is", null)
          .gt("price_amount", 0);

        availableColors = new Set(
          (validColors || []).map((c: any) => c.color).filter(Boolean)
        );
        setCachedFilterOptions("colors", availableColors);
      }

      const validColorFilters = filters.colors.filter((color) =>
        availableColors.has(color)
      );

      if (validColorFilters.length > 0) {
        query = query.in("color", validColorFilters);
      }
    }

    if (filters.cuts?.length) {
      // Get valid cuts from database with caching
      let availableCuts = getCachedFilterOptions("cuts");

      if (!availableCuts) {
        const { data: validCuts } = await supabase
          .from("gemstones_enriched")
          .select("cut")
          .not("cut", "is", null)
          .gt("price_amount", 0);

        availableCuts = new Set(
          (validCuts || []).map((c: any) => c.cut).filter(Boolean)
        );
        setCachedFilterOptions("cuts", availableCuts);
      }

      const validCutFilters = filters.cuts.filter((cut) =>
        availableCuts.has(cut)
      );

      if (validCutFilters.length > 0) {
        query = query.in("cut", validCutFilters);
      }
    }

    if (filters.clarities?.length) {
      // Get valid clarities from database with caching
      let availableClarities = getCachedFilterOptions("clarities");

      if (!availableClarities) {
        const { data: validClarities } = await supabase
          .from("gemstones_enriched")
          .select("clarity")
          .not("clarity", "is", null)
          .gt("price_amount", 0);

        availableClarities = new Set(
          (validClarities || []).map((c: any) => c.clarity).filter(Boolean)
        );
        setCachedFilterOptions("clarities", availableClarities);
      }

      const validClarityFilters = filters.clarities.filter((clarity) =>
        availableClarities.has(clarity)
      );

      if (validClarityFilters.length > 0) {
        query = query.in("clarity", validClarityFilters);
      }
    }

    if (filters.origins?.length) {
      // First, get the origin IDs for the provided origin names
      const { data: originIds, error: originError } = await supabase
        .from("origins")
        .select("id")
        .in("name", filters.origins);

      if (originError) {
        console.error("Error fetching origin IDs:", originError);
        return NextResponse.json(
          { error: "Failed to fetch origin data" },
          { status: 500 }
        );
      }

      if (originIds && originIds.length > 0) {
        const ids = originIds.map((origin) => origin.id);
        query = query.in("origin_id", ids);
      } else {
        // If no origins found, return empty result
        query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // Impossible UUID
      }
    }

    if (filters.treatmentStatus?.length) {
      query = query.in("treatment_status", filters.treatmentStatus);
    }

    if (filters.miningCountries?.length) {
      query = query.in("mining_country", filters.miningCountries);
    }

    if (filters.qualityClassifications?.length) {
      query = query.in("quality_classification", filters.qualityClassifications);
    }

    if (filters.hasColorChange) {
      query = query
        .not("color_change_description", "is", null)
        .neq("color_change_description", "");
    }

    if (filters.minLength !== undefined) {
      query = query.gte("length_mm", filters.minLength);
    }

    if (filters.maxLength !== undefined) {
      query = query.lte("length_mm", filters.maxLength);
    }

    if (filters.minWidth !== undefined) {
      query = query.gte("width_mm", filters.minWidth);
    }

    if (filters.maxWidth !== undefined) {
      query = query.lte("width_mm", filters.maxWidth);
    }

    if (filters.minPricePerCarat !== undefined) {
      query = query.gte("price_per_carat", filters.minPricePerCarat);
    }

    if (filters.maxPricePerCarat !== undefined) {
      query = query.lte("price_per_carat", filters.maxPricePerCarat);
    }

    if (filters.priceMin !== undefined) {
      query = query.gte("price_amount", filters.priceMin * 100); // Convert to cents
    }

    if (filters.priceMax !== undefined) {
      query = query.lte("price_amount", filters.priceMax * 100); // Convert to cents
    }

    if (filters.weightMin !== undefined) {
      query = query.gte("weight_carats", filters.weightMin);
    }

    if (filters.weightMax !== undefined) {
      query = query.lte("weight_carats", filters.weightMax);
    }

    if (filters.inStockOnly) {
      query = query.eq("in_stock", true);
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
    const sortColumn = filters.sortBy || "created_at";
    const sortDirection = filters.sortDirection || "desc";
    query = query.order(sortColumn, { ascending: sortDirection === "asc" });

    // Apply pagination
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }

    // Post-process results for complex filters
    let processedData = data || [];

    // Filter for AI analysis if required (using gemstones_ai_v6 data)
    if (filters.hasAIAnalysis) {
      processedData = processedData.filter(
        (item: any) =>
          item.technical_description_en && // Has AI-generated content
          item.confidence_score &&
          item.confidence_score >= 0.5
      );
    }

    // Transform data to match frontend expectations
    const transformedData = processedData.map((gemstone: any) => {
      const v6 = gemstone.emotional_description_en
        ? {
            emotional_description_en: gemstone.emotional_description_en,
            emotional_description_ru: gemstone.emotional_description_ru,
            marketing_highlights_en: gemstone.marketing_highlights_en,
            marketing_highlights_ru: gemstone.marketing_highlights_ru,
            recommended_primary_image_index:
              gemstone.recommended_primary_image_index,
            selected_image_uuid: gemstone.selected_image_uuid,
            detected_cut: gemstone.detected_cut,
          }
        : null;
      const selectedImageUuid = gemstone.selected_image_uuid ?? null;
      const recommendedPrimaryIndex =
        gemstone.recommended_primary_image_index ?? null;

      // Use primary image URL for efficient list/grid display
      const primaryImage = gemstone.primary_image_url
        ? [
            {
              id: "primary",
              gemstone_id: gemstone.id,
              image_url: gemstone.primary_image_url,
              is_primary: true,
              image_order: 0,
            },
          ]
        : [];

      return {
        ...gemstone,
        images: primaryImage,
        origin: gemstone.origin || null,
        certifications: gemstone.certifications || [],
        ai_analysis: gemstone.technical_description_en
          ? [
              {
                confidence_score: gemstone.confidence_score,
                analysis_type: "comprehensive_analysis",
              },
            ]
          : [],
        v6_text: v6,
        selected_image_uuid: selectedImageUuid,
        recommended_primary_image_index: recommendedPrimaryIndex,
        primary_image_url: gemstone.primary_image_url,
        primary_video_url: gemstone.primary_video_url,
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / pagination.pageSize);

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
    });
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get filter options for the catalog
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }
    const supabase = supabaseAdmin;

    const body = await request.json();
    const { type } = body; // 'counts' or 'options'

    if (type === "counts") {
      // Use optimized database function with GROUP BY for accurate counts
      // This avoids Supabase max_rows limit and improves performance
      // Filters match catalog logic: price > 0, has images, in_stock = true
      const { data, error } = await supabase.rpc("get_catalog_filter_counts");

      if (error) {
        console.error("❌ [FilterCountsAPI] RPC error:", error);
        return NextResponse.json(
          { error: `Failed to fetch filter counts: ${error.message}` },
          { status: 500 }
        );
      }

      // Return counts from optimized database function
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "Invalid request type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Filter options API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
