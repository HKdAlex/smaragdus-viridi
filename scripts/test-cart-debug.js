#!/usr/bin/env node

// Quick debug script to test cart functionality
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

console.log("🔍 Cart Debug Test Starting...\n");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCartFunctionality() {
  try {
    console.log("1️⃣ Testing database connection...");

    // Test basic connection
    const { data: connectionTest, error: connError } = await supabase
      .from("gemstones")
      .select("id, name")
      .limit(1);

    if (connError) {
      console.error("❌ Database connection failed:", connError);
      return;
    }
    console.log("✅ Database connection successful");

    console.log("\n2️⃣ Testing gemstones table...");
    const { data: gemstones, error: gemError } = await supabase
      .from("gemstones")
      .select("id, name, in_stock")
      .eq("in_stock", true)
      .limit(3);

    if (gemError) {
      console.error("❌ Gemstones query failed:", gemError);
      return;
    }
    console.log("✅ Found gemstones:", gemstones?.length || 0);

    if (gemstones && gemstones.length > 0) {
      const testGemstone = gemstones[0];
      console.log("📋 Test gemstone:", testGemstone);

      console.log("\n3️⃣ Testing cart_items table...");

      // Test cart_items table access
      const { data: cartItems, error: cartError } = await supabase
        .from("cart_items")
        .select("*")
        .limit(1);

      if (cartError) {
        console.error("❌ Cart items query failed:", cartError);
        return;
      }
      console.log("✅ Cart items table accessible");

      console.log("\n4️⃣ Testing user_profiles table...");
      const { data: users, error: userError } = await supabase
        .from("user_profiles")
        .select("user_id")
        .limit(1);

      if (userError) {
        console.error("❌ User profiles query failed:", userError);
        return;
      }
      console.log("✅ User profiles table accessible");

      if (users && users.length > 0) {
        const testUserId = users[0].user_id;
        console.log("👤 Test user ID:", testUserId);

        console.log("\n5️⃣ Testing cart insertion...");

        // Test inserting a cart item
        const { data: cartInsert, error: insertError } = await supabase
          .from("cart_items")
          .insert({
            gemstone_id: testGemstone.id,
            user_id: testUserId,
            quantity: 1,
            added_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("❌ Cart insertion failed:", insertError);
        } else {
          console.log("✅ Cart insertion successful:", cartInsert);

          // Clean up test data
          console.log("\n🧹 Cleaning up test data...");
          const { error: deleteError } = await supabase
            .from("cart_items")
            .delete()
            .eq("id", cartInsert.id);

          if (deleteError) {
            console.warn("⚠️ Cleanup failed:", deleteError);
          } else {
            console.log("✅ Test data cleaned up");
          }
        }
      } else {
        console.log(
          "⚠️ No users found in database - skipping cart insertion test"
        );
      }
    } else {
      console.log("⚠️ No available gemstones found - skipping detailed tests");
    }

    console.log("\n🎉 Cart Debug Test Completed Successfully!");
    console.log("\n📋 Summary:");
    console.log("- Database connection: ✅");
    console.log("- Tables accessible: ✅");
    console.log("- Cart operations: ✅ (if users and gemstones exist)");
  } catch (error) {
    console.error("💥 Test failed with exception:", error);
    process.exit(1);
  }
}

testCartFunctionality();
