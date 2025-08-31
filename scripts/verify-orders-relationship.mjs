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

console.log("🔍 Verifying orders-user relationship...");

async function verifyRelationship() {
  try {
    // Test 1: Check if foreign key constraint exists
    console.log("\n1. Checking foreign key constraints...");
    const { data: constraints, error: constraintError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `
        SELECT
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'orders'
          AND kcu.column_name = 'user_id'
      `,
      }
    );

    if (constraintError) {
      console.log(
        "⚠️  Could not verify constraints via RPC (expected for hosted Supabase)"
      );
      console.log("   This is normal - continue with query test...");
    } else if (constraints && constraints.length > 0) {
      console.log("✅ Foreign key constraint found:", constraints[0]);
    } else {
      console.log("❌ No foreign key constraint found");
    }

    // Test 2: Test the actual query that was failing
    console.log("\n2. Testing orders query with user join...");
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
      .limit(3);

    if (error) {
      console.error("❌ Query still failing:", error.message);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("✅ Query successful!");
    console.log(
      `📊 Found ${count} total orders, tested with ${data?.length || 0} records`
    );

    if (data && data.length > 0) {
      console.log("\n📋 Sample order with relationships:");
      const sample = data[0];
      console.log(`   Order ID: ${sample.id}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Total: ${sample.total_amount}`);
      console.log(`   User: ${sample.user?.name || "No user relationship"}`);
      console.log(`   Items: ${sample.order_items?.length || 0} items`);

      if (sample.order_items && sample.order_items.length > 0) {
        const item = sample.order_items[0];
        console.log(
          `   Sample Item: ${
            item.gemstones?.name || "No gemstone relationship"
          }`
        );
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Verification failed:", error);
    return false;
  }
}

verifyRelationship();


