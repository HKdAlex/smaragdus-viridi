#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Read environment variables
const envPath = ".env.local";
const envContent = readFileSync(envPath, "utf8");
const envLines = envContent.split("\n");
const env = {};

envLines.forEach((line) => {
  if (line.includes("=")) {
    const [key, ...valueParts] = line.split("=");
    env[key.trim()] = valueParts.join("=").trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("Testing orders API query...");

async function testOrdersQuery() {
  try {
    // Test the query that was failing
    const { data, error, count } = await supabase
      .from("orders")
      .select(
        `
        *,
        user:user_profiles (
          id,
          name,
          email
        ),
        order_items (
          *,
          gemstones (
            id,
            name,
            color,
            cut,
            weight_carats,
            serial_number,
            in_stock
          )
        )
      `,
        { count: "exact" }
      )
      .limit(5); // Just test with a few records

    if (error) {
      console.error("❌ Query failed:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("✅ Query successful!");
    console.log(
      `Found ${count} total orders, showing ${data?.length || 0} records`
    );

    if (data && data.length > 0) {
      console.log("Sample order data:");
      console.log(JSON.stringify(data[0], null, 2));
    }

    return true;
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return false;
  }
}

testOrdersQuery();


