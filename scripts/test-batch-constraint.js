#!/usr/bin/env node

/**
 * Test script to debug import_batches constraint violation
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBatchConstraint() {
  console.log("🧪 Testing import_batches constraint...");

  try {
    // Test 1: Check if table exists and get basic info
    console.log("\n1️⃣ Checking import_batches table...");
    const { data: existingData, error: tableError } = await supabase
      .from("import_batches")
      .select("id")
      .limit(1);

    if (tableError) {
      console.error("❌ Table access failed:", tableError);
      console.log(
        "🔍 This suggests the table might not exist or there are permission issues"
      );
      return;
    }

    console.log("✅ import_batches table exists and is accessible");

    // Test 2: Check constraint violations
    console.log("\n2️⃣ Testing batch insert with valid status...");
    const testBatchId = randomUUID();

    const testData = {
      id: testBatchId,
      batch_name: "Test Batch - Constraint Check",
      source_path: "/tmp/test",
      total_folders: 1,
      status: "pending", // Should be valid
      ai_analysis_enabled: false,
      processing_started_at: new Date().toISOString(),
    };

    console.log("📝 Attempting insert with data:", testData);

    const { data, error } = await supabase
      .from("import_batches")
      .insert(testData)
      .select();

    if (error) {
      console.error("❌ Insert failed:", error);
      console.log("🔍 Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      console.log("✅ Insert successful:", data);

      // Clean up test data
      console.log("\n3️⃣ Cleaning up test data...");
      const { error: deleteError } = await supabase
        .from("import_batches")
        .delete()
        .eq("id", testBatchId);

      if (deleteError) {
        console.warn("⚠️ Cleanup failed:", deleteError);
      } else {
        console.log("✅ Test data cleaned up");
      }
    }

    // Test 3: Check existing batches
    console.log("\n4️⃣ Checking existing batches...");
    const { data: existingBatches, error: batchesError } = await supabase
      .from("import_batches")
      .select("id, batch_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (batchesError) {
      console.error("❌ Failed to fetch existing batches:", batchesError);
    } else {
      console.log("✅ Recent batches:");
      existingBatches.forEach((batch) => {
        console.log(`   ${batch.id}: ${batch.batch_name} (${batch.status})`);
      });
    }
  } catch (error) {
    console.error("💥 Test failed with exception:", error);
  }
}

testBatchConstraint();
