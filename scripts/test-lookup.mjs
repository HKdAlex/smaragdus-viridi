#!/usr/bin/env node
/**
 * Test script to verify gemstone lookup logic
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

async function testLookup() {
  console.log("🧪 Testing gemstone lookup logic...\n");

  // Test cases from CSV
  const testCases = [
    "А1",
    "А 1",
    "А10",
    "А 10",
    "Г11",
    "Г 11",
    "З1",
    "З 1",
    "Н40",
    "Н 40",
  ];

  for (const testCode of testCases) {
    console.log(`Testing: "${testCode}"`);
    const normalized = normalizeSerialNumber(testCode);
    console.log(`  Normalized: "${normalized}"`);

    // Get all gemstones and find matching normalized internal_code
    const { data, error } = await supabase
      .from("gemstones")
      .select("internal_code, serial_number, name");

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      continue;
    }

    // Find gemstone with matching normalized internal_code
    const existing = data?.find(
      (gemstone) => normalizeSerialNumber(gemstone.internal_code) === normalized
    );

    if (existing) {
      console.log(
        `  ✅ Found match: ${existing.internal_code} (${existing.name})`
      );
    } else {
      console.log("  ❌ No match found");
    }
    console.log();
  }
}

testLookup().catch(console.error);
