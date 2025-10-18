import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

interface PaginatedGemstonesResponse {
  gemstones: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  error?: string;
}

// Server-side filtering and pagination for admin gemstone management
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not available");
    }
    const supabase = supabaseAdmin;

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const requestedPageSize = parseInt(searchParams.get("pageSize") || "50");

    // Validate and limit page size to allowed values
    const allowedPageSizes = [25, 50, 100, 250, 500, 1000];
    const pageSize = allowedPageSizes.includes(requestedPageSize)
      ? requestedPageSize
      : 50;
    const search = searchParams.get("search") || "";
    const types = searchParams.get("types")?.split(",").filter(Boolean) || [];
    const colors = searchParams.get("colors")?.split(",").filter(Boolean) || [];
    const cuts = searchParams.get("cuts")?.split(",").filter(Boolean) || [];
    const clarities =
      searchParams.get("clarities")?.split(",").filter(Boolean) || [];
    const origins =
      searchParams.get("origins")?.split(",").filter(Boolean) || [];
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    const priceMin = searchParams.get("priceMin")
      ? parseInt(searchParams.get("priceMin")!)
      : undefined;
    const priceMax = searchParams.get("priceMax")
      ? parseInt(searchParams.get("priceMax")!)
      : undefined;
    const weightMin = searchParams.get("weightMin")
      ? parseFloat(searchParams.get("weightMin")!)
      : undefined;
    const weightMax = searchParams.get("weightMax")
      ? parseFloat(searchParams.get("weightMax")!)
      : undefined;
    const inStock = searchParams.get("inStock")
      ? searchParams.get("inStock") === "true"
      : undefined;

    console.log("🔍 [AdminGemstonesAPI] Processing request:", {
      page,
      pageSize,
      search,
      types,
      colors,
      cuts,
      clarities,
      origins,
      sortBy,
      sortDirection,
      priceMin,
      priceMax,
      weightMin,
      weightMax,
      inStock,
      timestamp: new Date().toISOString(),
    });

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Build the base query with joins
    let query = supabase.from("gemstones").select(
      `
        *,
        origin:origins(*),
        images:gemstone_images(*),
        certifications:certifications(*)
      `,
      { count: "exact" }
    );

    // Apply search filter
    if (search) {
      query = query.or(`
        serial_number.ilike.%${search}%,
        internal_code.ilike.%${search}%,
        name.ilike.%${search}%,
        color.ilike.%${search}%,
        cut.ilike.%${search}%
      `);
    }

    // Apply categorical filters
    if (types.length > 0) {
      // Cast to proper enum type - these should be valid gemstone types
      const validTypes = types.filter((type) =>
        [
          "emerald",
          "diamond",
          "ruby",
          "sapphire",
          "amethyst",
          "topaz",
          "garnet",
          "peridot",
          "citrine",
          "tanzanite",
          "aquamarine",
          "morganite",
          "tourmaline",
          "zircon",
          "apatite",
          "quartz",
        ].includes(type)
      ) as any[];
      if (validTypes.length > 0) {
        query = query.in("name", validTypes);
      }
    }
    if (colors.length > 0) {
      // Cast to proper enum type - these should be valid gem colors
      const validColors = colors.filter((color) =>
        [
          "red",
          "blue",
          "green",
          "yellow",
          "pink",
          "white",
          "black",
          "colorless",
          "D",
          "E",
          "F",
          "G",
          "H",
          "I",
          "J",
          "K",
          "L",
          "M",
          "fancy-yellow",
          "fancy-blue",
          "fancy-pink",
          "fancy-green",
        ].includes(color)
      ) as any[];
      if (validColors.length > 0) {
        query = query.in("color", validColors);
      }
    }
    if (cuts.length > 0) {
      // Cast to proper enum type - these should be valid gem cuts
      const validCuts = cuts.filter((cut) =>
        [
          "round",
          "oval",
          "marquise",
          "pear",
          "emerald",
          "princess",
          "cushion",
          "radiant",
          "fantasy",
        ].includes(cut)
      ) as any[];
      if (validCuts.length > 0) {
        query = query.in("cut", validCuts);
      }
    }
    if (clarities.length > 0) {
      // Cast to proper enum type - these should be valid gem clarities
      const validClarities = clarities.filter((clarity) =>
        ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1"].includes(
          clarity
        )
      ) as any[];
      if (validClarities.length > 0) {
        query = query.in("clarity", validClarities);
      }
    }

    // Apply range filters
    if (priceMin !== undefined) {
      query = query.gte("price_amount", priceMin);
    }
    if (priceMax !== undefined) {
      query = query.lte("price_amount", priceMax);
    }
    if (weightMin !== undefined) {
      query = query.gte("weight_carats", weightMin);
    }
    if (weightMax !== undefined) {
      query = query.lte("weight_carats", weightMax);
    }

    // Apply stock filter
    if (inStock !== undefined) {
      query = query.eq("in_stock", inStock);
    }

    // Apply origin filter
    if (origins.length > 0) {
      query = query.in("origin_id", origins);
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "price_amount",
      "weight_carats",
      "serial_number",
      "name",
    ];
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortDirection === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    console.log("📊 [AdminGemstonesAPI] Executing query...");

    // Execute the query
    const { data: gemstones, error: queryError, count } = await query;

    if (queryError) {
      console.error("❌ [AdminGemstonesAPI] Query error:", queryError);
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    console.log("✅ [AdminGemstonesAPI] Query successful:", {
      count: gemstones?.length || 0,
      totalCount: count,
      page,
      pageSize,
    });

    // Get statistics
    const { data: statsData, error: statsError } = await supabase
      .from("gemstones")
      .select("in_stock")
      .eq("in_stock", true);

    let totalCount = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;

    if (!statsError && statsData) {
      totalCount = count || 0;
      inStockCount = statsData.length;
      outOfStockCount = totalCount - inStockCount;
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response: PaginatedGemstonesResponse = {
      gemstones: gemstones || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      stats: {
        total: totalCount,
        inStock: inStockCount,
        lowStock: 0, // TODO: Implement low stock logic
        outOfStock: outOfStockCount,
      },
    };

    console.log("📤 [AdminGemstonesAPI] Sending response:", {
      gemstonesCount: response.gemstones.length,
      totalItems: response.pagination.totalItems,
      totalPages: response.pagination.totalPages,
      page: response.pagination.page,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ [AdminGemstonesAPI] Unexpected error:", error);

    const errorResponse: PaginatedGemstonesResponse = {
      gemstones: [],
      pagination: {
        page: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      stats: {
        total: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
      },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
