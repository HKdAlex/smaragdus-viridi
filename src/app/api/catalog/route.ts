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

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `serial_number.ilike.${searchTerm},internal_code.ilike.${searchTerm},name::text.ilike.${searchTerm},color::text.ilike.${searchTerm},cut::text.ilike.${searchTerm}`
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
