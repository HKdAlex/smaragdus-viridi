#!/usr/bin/env node
/**
 * Test script to check if letter-number entries are being found correctly
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

async function findExistingGemstone(internalCode) {
  const normalizedCode = normalizeSerialNumber(internalCode);

  // Get all gemstones and find matching normalized internal_code
  const { data, error } = await supabase.from("gemstones").select("*");

  if (error) {
    console.error(`❌ Error fetching gemstones: ${error.message}`);
    return null;
  }

  // Find gemstone with matching normalized internal_code
  const existing = data?.find(
    (gemstone) =>
      normalizeSerialNumber(gemstone.internal_code) === normalizedCode
  );

  return existing || null;
}

async function testLetterEntries() {
  console.log("🧪 Testing letter-number entries from CSV...\n");

  // Read CSV and find letter-number entries
  const csvPath = path.join(process.cwd(), "docs", "прайс камни.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").slice(1); // Skip header

  const letterEntries = [];
  for (const line of lines) {
    if (!line.trim()) continue;

    const columns = line.split(",");
    if (columns.length < 3) continue;

    const internalCode = columns[2]?.trim();
    if (internalCode && /^[А-Я][0-9]/.test(internalCode)) {
      letterEntries.push({
        internalCode,
        gemstone: columns[1]?.trim(),
        cut: columns[4]?.trim(),
        weight: columns[6]?.trim(),
        price: columns[10]?.trim(),
      });
    }
  }

  console.log(`Found ${letterEntries.length} letter-number entries in CSV\n`);

  let foundCount = 0;
  let notFoundCount = 0;

  for (const entry of letterEntries.slice(0, 20)) {
    // Test first 20
    console.log(`Testing: "${entry.internalCode}" (${entry.gemstone})`);

    const existing = await findExistingGemstone(entry.internalCode);

    if (existing) {
      console.log(
        `  ✅ Found match: ${existing.internal_code} (${existing.name})`
      );
      foundCount++;
    } else {
      console.log(`  ❌ No match found`);
      notFoundCount++;
    }
  }

  console.log(`\n📊 Results: ${foundCount} found, ${notFoundCount} not found`);
}

testLetterEntries().catch(console.error);
