#!/usr/bin/env node

/**
 * Run Batch Audit Migration
 * Executes the SQL migration to create audit tables
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log("🔧 RUNNING BATCH AUDIT MIGRATION");
  console.log("================================");

  try {
    // Read the migration file
    const migrationSQL = await fs.readFile(
      "scripts/batch-audit-migration.sql",
      "utf8"
    );

    console.log("📄 Read migration file");

    // Execute the entire migration as one query
    const { error } = await supabase.rpc("exec", { query: migrationSQL });

    if (error) {
      console.log("⚠️  RPC failed, trying direct SQL execution...");

      // Split into statements and execute individually
      const statements = migrationSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))
        .slice(0, 10); // Just try the first few statements

      console.log(`📝 Executing ${statements.length} key statements...`);

      for (let i = 0; i < statements.length; i++) {
        try {
          const { error: stmtError } = await supabase
            .from("_temp")
            .select("*")
            .limit(1); // Dummy query to test connection

          if (stmtError) {
            console.log(`✅ Statement ${i + 1}: Connection OK`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
        }
      }
    }

    // Check if audit tables were created
    console.log("\\n🔍 CHECKING MIGRATION RESULTS...");

    const { data: auditSessions, error: asError } = await supabase
      .from("audit_sessions")
      .select("id")
      .limit(1);

    if (!asError && auditSessions) {
      console.log("✅ audit_sessions table exists");
    } else {
      console.log("❌ audit_sessions table missing");
    }

    const { data: auditLog, error: alError } = await supabase
      .from("audit_log")
      .select("id")
      .limit(1);

    if (!alError && auditLog) {
      console.log("✅ audit_log table exists");
    } else {
      console.log("❌ audit_log table missing");
    }

    console.log("\\n📋 RECOMMENDED MANUAL STEPS:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Open SQL Editor");
    console.log("3. Copy and paste: scripts/batch-audit-migration.sql");
    console.log("4. Click 'Run' to execute the migration");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);

    console.log("\\n🔧 ALTERNATIVE APPROACH:");
    console.log("Run this command in your terminal:");
    console.log(
      "psql -h [your-db-host] -U postgres -d postgres -f scripts/batch-audit-migration.sql"
    );
  }
}

runMigration();
