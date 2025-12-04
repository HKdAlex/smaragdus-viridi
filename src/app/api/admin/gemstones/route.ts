import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import type { TablesInsert } from "@/shared/types/database";

import { AdminAuthError, requireAdmin } from "../_utils/require-admin";

function ensureAdminClient() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not available");
  }
  return supabaseAdmin;
}

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
    await requireAdmin();
    const supabase = ensureAdminClient();

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
    const withoutMedia = searchParams.get("withoutMedia") === "true";
    const withoutPrice = searchParams.get("withoutPrice") === "true";

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
      withoutMedia,
      withoutPrice,
      timestamp: new Date().toISOString(),
    });

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Build the base query using gemstones_enriched view
    // Only select columns needed for the list view display (not AI descriptions, etc.)
    const listViewColumns = [
      "id",
      "serial_number",
      "internal_code",
      "name",
      "color",
      "cut",
      "clarity",
      "weight_carats",
      "price_amount",
      "price_currency",
      "premium_price_amount",
      "premium_price_currency",
      "in_stock",
      "delivery_days",
      "origin_id",
      "primary_image_url",
      "image_count",
      "video_count",
      "created_at",
    ].join(",");

    let query = supabase
      .from("gemstones_enriched")
      .select(listViewColumns, { count: "exact" });

    // Apply search filter
    if (search) {
      // Search only text columns to avoid enum casting issues
      // PostgREST doesn't support ::text casting in filters
      query = query.or(
        `serial_number.ilike.%${search}%,internal_code.ilike.%${search}%,description.ilike.%${search}%`
      );
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

    if (withoutMedia) {
      query = query.is("primary_image_url", null).is("primary_video_url", null);
    }

    if (withoutPrice) {
      query = query.or("price_amount.is.null,price_amount.eq.0");
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

    // Fetch origin data and prepare images array for each gemstone
    // Note: image_count and video_count are now computed columns in the gemstones_enriched view
    if (gemstones && gemstones.length > 0) {
      const originIds = [...new Set(gemstones.map((g: any) => g.origin_id).filter(Boolean))];
      
      // Get origin data
      const { data: originsData } = originIds.length > 0
        ? await supabase
            .from("origins")
            .select("id, name, country")
            .in("id", originIds)
        : { data: [] };
      
      // Map origins by ID
      const originMap = new Map<string, { id: string; name: string; country: string }>();
      originsData?.forEach((origin) => {
        originMap.set(origin.id, origin);
      });
      
      // Add origin data and images array to each gemstone
      gemstones.forEach((gemstone: any) => {
        // Add origin data
        if (gemstone.origin_id) {
          gemstone.origin = originMap.get(gemstone.origin_id) || null;
        }
        
        // Create images array for thumbnail display
        if (gemstone.id && gemstone.primary_image_url) {
          (gemstone as any).images = [
            {
              id: "primary",
              gemstone_id: gemstone.id,
              image_url: gemstone.primary_image_url,
              is_primary: true,
              image_order: 0,
            },
          ];
        } else {
          (gemstone as any).images = [];
        }
      });
    }

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
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const adminClient = ensureAdminClient();
    const body = await request.json();

    const requiredFields = [
      "serial_number",
      "name",
      "color",
      "cut",
      "clarity",
      "weight_carats",
      "length_mm",
      "width_mm",
      "depth_mm",
      "price_amount",
      "price_currency",
      "in_stock",
    ] as const;

    const missingField = requiredFields.find(
      (field) => typeof body[field] === "undefined" || body[field] === null
    );

    if (missingField) {
      return NextResponse.json(
        { error: `Missing required field: ${missingField}` },
        { status: 400 }
      );
    }

    const insertPayload: TablesInsert<"gemstones"> = {
      serial_number: body.serial_number,
      name: body.name,
      type_code: body.type_code ?? body.name,
      color: body.color,
      color_code: body.color_code ?? body.color,
      cut: body.cut,
      cut_code: body.cut_code ?? body.cut,
      clarity: body.clarity,
      clarity_code: body.clarity_code ?? body.clarity,
      weight_carats: Number(body.weight_carats),
      length_mm: Number(body.length_mm),
      width_mm: Number(body.width_mm),
      depth_mm: Number(body.depth_mm),
      origin_id: body.origin_id ?? null,
      price_amount: Number(body.price_amount),
      price_currency: body.price_currency,
      premium_price_amount:
        typeof body.premium_price_amount === "number"
          ? body.premium_price_amount
          : body.premium_price_amount
          ? Number(body.premium_price_amount)
          : null,
      premium_price_currency: body.premium_price_currency ?? null,
      in_stock: !!body.in_stock,
      delivery_days:
        typeof body.delivery_days === "number"
          ? body.delivery_days
          : body.delivery_days
          ? Number(body.delivery_days)
          : null,
      internal_code: body.internal_code ?? null,
      description: body.description ?? null,
      promotional_text: body.promotional_text ?? null,
      marketing_highlights: body.marketing_highlights ?? null,
      metadata_status: body.metadata_status ?? null,
      quantity:
        typeof body.quantity === "number"
          ? body.quantity
          : body.quantity
          ? Number(body.quantity)
          : null,
    };

    const { data, error } = await adminClient
      .from("gemstones")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to create gemstone: ${error.message}` },
        { status: 400 }
      );
    }

    // Handle individual stones if provided
    if (body.individual_stones && Array.isArray(body.individual_stones) && body.individual_stones.length > 0) {
      const stonesPayload = body.individual_stones.map((stone: any) => ({
        stone_number: stone.stone_number,
        length_mm: Number(stone.dimensions?.length_mm || 0),
        width_mm: Number(stone.dimensions?.width_mm || 0),
        depth_mm: Number(stone.dimensions?.depth_mm || 0),
      }));

      // Use RPC function to bypass RLS
      const { error: rpcError } = await adminClient.rpc(
        "upsert_gemstone_individual_stones",
        {
          p_gemstone_id: data.id,
          p_stones: stonesPayload,
        }
      );

      if (rpcError) {
        console.error("❌ [AdminGemstonesAPI] Failed to create individual stones:", rpcError);
        console.error("❌ [AdminGemstonesAPI] Payload:", JSON.stringify(stonesPayload, null, 2));
        // Note: We don't fail the entire request since the main gemstone was created
        // This allows admins to retry adding individual stones later
      } else {
        console.log("✅ [AdminGemstonesAPI] Successfully created individual stones:", stonesPayload.length);
      }
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("❌ [AdminGemstonesAPI] Create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
