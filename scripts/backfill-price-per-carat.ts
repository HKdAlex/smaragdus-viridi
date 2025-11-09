import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/shared/types/database";

const PAGE_SIZE = 1000;
const UPDATE_BATCH_SIZE = 200;

type GemstoneRow = Pick<
  Database["public"]["Tables"]["gemstones"]["Row"],
  "id" | "price_amount" | "price_per_carat" | "weight_carats"
>;

function assertEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const supabaseUrl = assertEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const serviceRoleKey = assertEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  let page = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  console.log("🔄 Starting price_per_carat backfill…");

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("gemstones")
      .select("id, price_amount, price_per_carat, weight_carats")
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch gemstones: ${error.message}`);
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      break;
    }

    totalProcessed += rows.length;

    const updates: Array<{
      id: string;
      price_per_carat: number;
      updated_at: string;
    }> = [];

    for (const row of rows as GemstoneRow[]) {
      const { price_amount, weight_carats, price_per_carat } = row;

      if (!price_amount || !weight_carats || weight_carats <= 0) {
        totalSkipped += 1;
        continue;
      }

      const calculated = Math.round(price_amount / weight_carats);
      if (!Number.isFinite(calculated) || calculated <= 0) {
        totalSkipped += 1;
        continue;
      }

      if (price_per_carat === calculated) {
        totalSkipped += 1;
        continue;
      }

      updates.push({
        id: row.id,
        price_per_carat: calculated,
        updated_at: new Date().toISOString(),
      });
    }

    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("gemstones")
          .update({
            price_per_carat: update.price_per_carat,
            updated_at: update.updated_at,
          })
          .eq("id", update.id);

        if (updateError) {
          throw new Error(
            `Failed to update gemstone ${update.id}: ${updateError.message}`
          );
        }
      }

      totalUpdated += updates.length;
      console.log(
        `✅ Processed rows ${from}–${to} (updated ${updates.length}, skipped ${rows.length - updates.length})`
      );
    } else {
      console.log(`ℹ️  No updates required for rows ${from}–${to}.`);
    }

    page += 1;
  }

  console.log("🎉 Backfill complete!");
  console.log(`   Processed: ${totalProcessed}`);
  console.log(`   Updated:   ${totalUpdated}`);
  console.log(`   Skipped:   ${totalSkipped}`);
}

main().catch((error) => {
  console.error("❌ Backfill failed:", error);
  process.exitCode = 1;
});

