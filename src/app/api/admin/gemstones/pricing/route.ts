import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import type { Tables } from "@/shared/types/database";

import { AdminAuthError, requireAdmin } from "../../_utils/require-admin";

type GemstoneRow = Tables<"gemstones">;

interface PriceUpdatePayload {
  gemstoneId: string;
  regularPrice?: number;
  premiumPrice?: number;
  currency: string;
  reason?: string;
}

interface BulkPriceUpdatePayload {
  gemstoneIds: string[];
  priceIncrease?: number;
  fixedPrice?: number;
  currency: string;
  reason: string;
}

function ensureAdminClient() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not available");
  }
  return supabaseAdmin;
}

function calculatePriceDistribution(prices: number[]) {
  const ranges = [
    { min: 0, max: 50000, label: "$0 - $500" },
    { min: 50000, max: 100000, label: "$500 - $1,000" },
    { min: 100000, max: 250000, label: "$1,000 - $2,500" },
    { min: 250000, max: 500000, label: "$2,500 - $5,000" },
    { min: 500000, max: 1000000, label: "$5,000 - $10,000" },
    { min: 1000000, max: Number.POSITIVE_INFINITY, label: "$10,000+" },
  ];

  return ranges.map((range) => ({
    range: range.label,
    count: prices.filter(
      (price) => price >= range.min && price < range.max
    ).length,
  }));
}

function calculateCurrencyBreakdown(
  gemstones: Array<{
    price_currency: string | null;
    price_amount: number | null;
  }>
) {
  const currencyGroups = gemstones.reduce(
    (acc, gem) => {
      const currency = gem.price_currency;
      if (!currency) {
        return acc;
      }

      if (!acc[currency]) {
        acc[currency] = { prices: [] as number[], count: 0 };
      }

      if (typeof gem.price_amount === "number") {
        acc[currency].prices.push(gem.price_amount);
      }
      acc[currency].count += 1;

      return acc;
    },
    {} as Record<string, { prices: number[]; count: number }>
  );

  return Object.entries(currencyGroups).map(([currency, data]) => ({
    currency,
    count: data.count,
    avgPrice: Math.round(
      data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length
    ),
  }));
}

async function updateGemstonePrice({
  gemstoneId,
  regularPrice,
  premiumPrice,
  currency,
}: PriceUpdatePayload) {
  const adminClient = ensureAdminClient();

  const { data: gemstone, error: fetchError } = await adminClient
    .from("gemstones")
    .select(
      "price_amount, price_currency, premium_price_amount, premium_price_currency"
    )
    .eq("id", gemstoneId)
    .single();

  if (fetchError) {
    return {
      success: false,
      error: `Gemstone not found: ${fetchError.message}`,
    };
  }

  const updatePayload: Partial<GemstoneRow> = {};

  // Validate currency
  const validCurrencies = ["USD", "EUR", "GBP", "RUB", "CHF", "JPY"] as const;
  const currencyValue = validCurrencies.includes(
    currency as (typeof validCurrencies)[number]
  )
    ? (currency as (typeof validCurrencies)[number])
    : "USD";

  if (typeof regularPrice === "number") {
    updatePayload.price_amount = regularPrice;
    updatePayload.price_currency = currencyValue;
  }

  if (typeof premiumPrice === "number") {
    updatePayload.premium_price_amount = premiumPrice;
    updatePayload.premium_price_currency = currencyValue;
  }

  if (Object.keys(updatePayload).length === 0) {
    return { success: false, error: "No price fields provided" };
  }

  updatePayload.updated_at = new Date().toISOString();

  const { error: updateError } = await adminClient
    .from("gemstones")
    .update(updatePayload)
    .eq("id", gemstoneId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update gemstone: ${updateError.message}`,
    };
  }

  return { success: true };
}

export async function GET() {
  try {
    await requireAdmin();
    const adminClient = ensureAdminClient();

    const { data: gemstones, error } = await adminClient
      .from("gemstones")
      .select(
        "id, price_amount, price_currency, premium_price_amount, premium_price_currency, updated_at"
      )
      .not("price_amount", "is", null);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!gemstones || gemstones.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          priceDistribution: [],
          recentChanges: [],
          currencyBreakdown: [],
        },
      });
    }

    const prices = gemstones
      .map((gem) => gem.price_amount)
      .filter((price): price is number => typeof price === "number");

    const averagePrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const { data: recentChangesData } = await adminClient
      .from("gemstones")
      .select("id, price_amount, price_currency, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10);

    const recentChanges =
      recentChangesData?.map((gem) => ({
        id: `change-${gem.id}-${gem.updated_at}`,
        gemstone_id: gem.id,
        old_price: 0,
        new_price: gem.price_amount ?? 0,
        currency: gem.price_currency ?? "USD",
        change_type: "manual" as const,
        reason: "Recent update",
        created_at: gem.updated_at ?? new Date().toISOString(),
        created_by: "system",
      })) ?? [];

    return NextResponse.json({
      success: true,
      data: {
        averagePrice: Math.round(averagePrice),
        priceRange: { min: minPrice, max: maxPrice },
        priceDistribution: calculatePriceDistribution(prices),
        recentChanges,
        currencyBreakdown: calculateCurrencyBreakdown(gemstones),
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin/gemstones/pricing] GET failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = (await request.json()) as PriceUpdatePayload;

    if (!body.gemstoneId || !body.currency) {
      return NextResponse.json(
        { success: false, error: "gemstoneId and currency are required" },
        { status: 400 }
      );
    }

    const result = await updateGemstonePrice(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin/gemstones/pricing] POST failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = (await request.json()) as BulkPriceUpdatePayload;

    if (!Array.isArray(body.gemstoneIds) || body.gemstoneIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "gemstoneIds array is required" },
        { status: 400 }
      );
    }

    if (!body.currency) {
      return NextResponse.json(
        { success: false, error: "currency is required" },
        { status: 400 }
      );
    }

    if (
      typeof body.priceIncrease !== "number" &&
      typeof body.fixedPrice !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide priceIncrease percentage or fixedPrice amount",
        },
        { status: 400 }
      );
    }

    let updated = 0;
    let failed = 0;

    for (const gemstoneId of body.gemstoneIds) {
      const adminClient = ensureAdminClient();

      const { data: gemstone, error: fetchError } = await adminClient
        .from("gemstones")
        .select("price_amount")
        .eq("id", gemstoneId)
        .single();

      if (fetchError || !gemstone) {
        failed += 1;
        continue;
      }

      let newPrice: number | undefined;

      if (typeof body.fixedPrice === "number") {
        newPrice = body.fixedPrice;
      } else if (typeof body.priceIncrease === "number") {
        newPrice = Math.round(
          (gemstone.price_amount ?? 0) * (1 + body.priceIncrease / 100)
        );
      }

      if (typeof newPrice !== "number" || Number.isNaN(newPrice)) {
        failed += 1;
        continue;
      }

      const result = await updateGemstonePrice({
        gemstoneId,
        regularPrice: newPrice,
        currency: body.currency,
        reason: body.reason,
      });

      if (result.success) {
        updated += 1;
      } else {
        failed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      failed,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin/gemstones/pricing] PATCH failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

