#!/usr/bin/env node
/**
 * Test script to verify specific gemstone lookup cases
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeSerialNumber(serial) {
  if (!serial) return null;

  // Cyrillic to Latin character mapping
  const cyrillicToLatin = {
    А: "A",
    Б: "B",
    В: "V",
    Г: "G",
    Д: "D",
    Е: "E",
    Ё: "E",
    Ж: "ZH",
    З: "Z",
    И: "I",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "H",
    Ц: "TS",
    Ч: "CH",
    Ш: "SH",
    Щ: "SCH",
    Ъ: "",
    Ы: "Y",
    Ь: "",
    Э: "E",
    Ю: "YU",
    Я: "YA",
  };

  let normalized = serial.toString().toUpperCase().trim();

  // Convert Cyrillic to Latin
  for (const [cyrillic, latin] of Object.entries(cyrillicToLatin)) {
    normalized = normalized.replace(new RegExp(cyrillic, "g"), latin);
  }

  // Remove all spaces, dashes, and underscores
  return normalized.replace(/[\s\-_]+/g, "");
}

async function testSpecificLookup() {
  console.log("🧪 Testing specific gemstone lookup cases...\n");

  // Test cases from CSV vs Database
  const testCases = [
    { csv: "А1", db: "А 1" },
    { csv: "А10", db: "А 10" },
    { csv: "Н40", db: "Н 40" },
    { csv: "Г11", db: "Г 11" },
  ];

  for (const testCase of testCases) {
    console.log(`Testing: CSV "${testCase.csv}" vs DB "${testCase.db}"`);

    const csvNormalized = normalizeSerialNumber(testCase.csv);
    const dbNormalized = normalizeSerialNumber(testCase.db);

    console.log(`  CSV normalized: "${csvNormalized}"`);
    console.log(`  DB normalized: "${dbNormalized}"`);
    console.log(`  Match: ${csvNormalized === dbNormalized}`);

    // Try to find the database entry
    const { data, error } = await supabase
      .from("gemstones")
      .select("internal_code, name")
      .eq("internal_code", testCase.db)
      .maybeSingle();

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } else if (data) {
      console.log(`  ✅ Found in DB: ${data.internal_code} (${data.name})`);
    } else {
      console.log(`  ❌ Not found in DB`);
    }

    console.log();
  }
}

testSpecificLookup().catch(console.error);
