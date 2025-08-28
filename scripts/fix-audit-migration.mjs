#!/usr/bin/env node

/**
 * Fix Audit Migration
 * Runs the batch audit migration to create missing tables
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runAuditMigration() {
  console.log("🔧 FIXING AUDIT MIGRATION");
  console.log("==========================");

  try {
    // Read the migration SQL file
    const migrationSQL = await fs.readFile(
      "scripts/batch-audit-migration.sql",
      "utf8"
    );

    console.log("📄 Read migration file successfully");

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === "") continue;

      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });

        if (error) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} failed:`, err.message);
      }
    }

    console.log("\\n🎉 AUDIT MIGRATION COMPLETED!");
    console.log("=============================");

    // Verify tables were created
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ["audit_sessions", "audit_log"]);

    if (tables && tables.length >= 2) {
      console.log("✅ Audit tables created successfully:");
      tables.forEach((table) => {
        console.log(`   • ${table.table_name}`);
      });
    } else {
      console.log("⚠️  Tables may not have been created properly");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  }
}

runAuditMigration();
