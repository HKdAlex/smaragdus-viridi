#!/usr/bin/env node
/**
 * Russian CSV Gemstone Data Parser and Importer
 * Parses the Russian gemstone price list and updates the Supabase database
 */

import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===== MAPPING DICTIONARIES =====

/**
 * Maps Russian gemstone names to database enum values
 */
const GEMSTONE_TYPE_MAP = {
  изумруд: "emerald",
  гранат: "garnet",
  "гранат\\ родолит": "garnet",
  "гранат\\ спесартин": "garnet",
  танзанит: "tanzanite",
  сапфир: "sapphire",
  аквамарин: "aquamarine",
  перидот: "peridot",
  циркон: "zircon",
  апатит: "apatite",
  аметист: "amethyst",
  цитрин: "citrine",
  топаз: "topaz",
  турмалин: "tourmaline",
  могранит: "morganite",
  "кварц дымчатый": "quartz",
  "параиба синт": "paraiba",
  "шпинель (лаб)": "spinel",
  "александрит (лаб)": "alexandrite",
  александрит: "alexandrite",
  агат: "agate",
};

/**
 * Maps Russian cut names to database enum values
 */
const GEM_CUT_MAP = {
  фантазийная: "fantasy",
  октагон: "emerald", // Octagon is similar to emerald cut
  круг: "round",
  овал: "oval",
  принцесса: "princess",
  капля: "pear",
  маркиз: "marquise",
  кушон: "cushion",
  багет: "baguette",
  ашер: "asscher",
  ромб: "rhombus",
  трапеция: "trapezoid",
  треугольник: "triangle",
  сердце: "heart",
  кабошон: "cabochon",
  пентагон: "pentagon",
  гексагон: "hexagon",
};

// ===== UTILITY FUNCTIONS =====

/**
 * Cleans and normalizes string values
 */
function cleanString(str) {
  if (!str || str === "") return null;
  return str.toString().trim();
}

/**
 * Normalizes serial numbers for consistent lookup
 * Handles variations like "А9" vs "А 9" vs "А-9"
 * Also handles Cyrillic to Latin character mapping
 */
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

/**
 * Generates a system serial number for new gemstones
 * Format: SV-{INTERNAL_CODE}-{TIMESTAMP}-{RANDOM}
 */
function generateSerialNumber(internalCode) {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 5);
  const normalizedCode = normalizeSerialNumber(internalCode) || "UNKNOWN";

  return `SV-${normalizedCode}-${timestamp}-${random}`;
}

/**
 * Converts Russian decimal format to number
 */
function parseNumber(value) {
  if (!value || value === "") return null;

  // Handle comma as decimal separator
  const cleaned = value.toString().replace(",", ".");
  const number = parseFloat(cleaned);

  return isNaN(number) ? null : number;
}

/**
 * Parses complex dimension strings like "8,9 5,4" or "7,8\7,9"
 */
function parseDimensions(dimensionStr) {
  if (!dimensionStr || dimensionStr === "") return null;

  const str = dimensionStr.toString().trim();

  // Handle various separators and formats
  const numbers = str
    .replace(/[\\\/]/g, " ") // Replace slashes with spaces
    .split(/[\s,]+/) // Split on spaces and commas
    .map((s) => parseNumber(s))
    .filter((n) => n !== null && n > 0);

  // Return average if multiple values, single value if one
  return numbers.length > 0 ? numbers[0] : null;
}

/**
 * Parses price information handling both per-carat and lot pricing
 * Returns object with separate fields for each pricing model
 */
function parsePrice(priceStr, quantity = 1, weight = 1) {
  if (!priceStr || priceStr === "")
    return { pricePerCarat: null, totalPrice: null, isLotPricing: false };

  const str = priceStr.toString().trim().toLowerCase();

  // Handle "за лот" (for the lot) pricing
  if (str.includes("за лот")) {
    const lotPrice = parseNumber(str.replace(/[^\d,\.]/g, ""));
    if (lotPrice) {
      return {
        pricePerCarat: null, // No per-carat price for lot pricing
        totalPrice: Math.round(lotPrice * 100), // Total lot price in cents
        isLotPricing: true,
      };
    }
  }

  // Handle regular per-carat pricing
  const pricePerCarat = parseNumber(str.replace(/[^\d,\.]/g, ""));
  if (pricePerCarat && weight > 0) {
    return {
      pricePerCarat: Math.round(pricePerCarat * 100), // Per-carat price in cents
      totalPrice: Math.round(pricePerCarat * weight * 100), // Calculated total price
      isLotPricing: false,
    };
  }

  return { pricePerCarat: null, totalPrice: null, isLotPricing: false };
}

/**
 * Generates internal serial number variants for multi-stone entries
 */
function generateSerialVariants(baseSerial, quantity) {
  if (quantity <= 1) return [baseSerial];

  const variants = [];
  for (let i = 1; i <= quantity; i++) {
    variants.push(`${baseSerial}-${i}`);
  }
  return variants;
}

/**
 * Maps Russian values to database enums with fallbacks
 */
function mapGemstoneType(russianName) {
  if (!russianName) return null;

  const cleaned = russianName.toLowerCase().trim();
  const mapped = GEMSTONE_TYPE_MAP[cleaned];

  if (mapped) return mapped;

  // Fallback logic
  if (cleaned.includes("изумруд")) return "emerald";
  if (cleaned.includes("гранат")) return "garnet";
  if (cleaned.includes("сапфир")) return "sapphire";
  if (cleaned.includes("аквамарин")) return "aquamarine";

  console.warn(
    `⚠️  Unknown gemstone type: "${russianName}" - using 'quartz' as fallback`
  );
  return "quartz";
}

function mapGemCut(russianCut) {
  if (!russianCut) return "fantasy";

  const cleaned = russianCut.toLowerCase().trim();
  const mapped = GEM_CUT_MAP[cleaned];

  if (mapped) return mapped;

  console.warn(
    `⚠️  Unknown cut type: "${russianCut}" - using 'fantasy' as fallback`
  );
  return "fantasy";
}

// ===== CSV PARSING =====

/**
 * Parses a single CSV row into gemstone data
 */
function parseCsvRow(row, lineNumber) {
  const [
    photo, // Фото
    gemstoneType, // Камень
    serialNumber, // Номер
    address, // Адрес
    cut, // Огранка
    quantity, // Кол-во
    weight, // Вес ct
    length, // Длина
    width, // Ширин
    depth, // Глубин
    pricePerCarat, // Цена $ за ct
  ] = row;

  // Skip empty or invalid rows
  if (!cleanString(gemstoneType) || !cleanString(serialNumber)) {
    return { valid: false, reason: "Missing gemstone type or internal code" };
  }

  // Parse basic data
  const parsedQuantity = parseInt(quantity) || 1;
  const parsedWeight = parseNumber(weight);
  const pricingData = parsePrice(pricePerCarat, parsedQuantity, parsedWeight);

  // Skip rows without essential data
  if (!parsedWeight || parsedWeight <= 0) {
    return { valid: false, reason: "Invalid or missing weight" };
  }

  const gemstoneData = {
    name: mapGemstoneType(cleanString(gemstoneType)),
    internal_code: normalizeSerialNumber(cleanString(serialNumber)), // CSV "Номер" → internal_code (e.g., "Г 11" → "Г11")
    description: cleanString(address), // CSV "Адрес" → description field for storage location
    cut: mapGemCut(cleanString(cut)),
    weight_carats: parsedWeight,
    length_mm: parseDimensions(length) || 0, // Default to 0 if missing
    width_mm: parseDimensions(width) || 0, // Default to 0 if missing
    depth_mm: parseDimensions(depth) || 0, // Default to 0 if missing
    price_amount: pricingData.totalPrice, // Total price for the lot
    price_per_carat: pricingData.pricePerCarat, // Per-carat price (null for lot pricing)
    price_currency: "USD",
    quantity: parsedQuantity, // Keep as lot (don't split)
    in_stock: true,
    csv_line_number: lineNumber,
    pricing_type: pricingData.isLotPricing ? "lot" : "per_carat",
  };

  return { valid: true, data: gemstoneData };
}

/**
 * Reads and parses the CSV file
 */
async function parseCsvFile(filePath) {
  try {
    console.log(`📖 Reading CSV file: ${filePath}`);

    const csvContent = await fs.readFile(filePath, "utf-8");
    const lines = csvContent.split("\n");

    console.log(`📊 Found ${lines.length} lines in CSV`);

    const results = {
      valid: [],
      invalid: [],
      errors: [],
    };

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const row = line.split(",");
        const parsed = parseCsvRow(row, i + 1);

        if (parsed.valid) {
          // Keep lots as single entries (no splitting)
          results.valid.push(parsed.data);
        } else {
          results.invalid.push({
            line: i + 1,
            reason: parsed.reason,
            data: row,
          });
        }
      } catch (error) {
        results.errors.push({ line: i + 1, error: error.message, data: line });
      }
    }

    console.log(`✅ Parsed ${results.valid.length} valid gemstones`);
    console.log(`⚠️  Found ${results.invalid.length} invalid entries`);
    console.log(`❌ Found ${results.errors.length} parsing errors`);

    // Show invalid entries if any
    if (results.invalid.length > 0) {
      console.log(`\n📋 Invalid entries details:`);
      results.invalid.slice(0, 10).forEach((entry) => {
        console.log(`   Line ${entry.line}: ${entry.reason}`);
        console.log(`   Data: ${entry.data.join(", ")}`);
      });
      if (results.invalid.length > 10) {
        console.log(
          `   ... and ${results.invalid.length - 10} more invalid entries`
        );
      }
    }

    // Show parsing errors if any
    if (results.errors.length > 0) {
      console.log(`\n❌ Parsing errors details:`);
      results.errors.slice(0, 5).forEach((error) => {
        console.log(`   Line ${error.line}: ${error.error}`);
        console.log(`   Data: ${error.data}`);
      });
      if (results.errors.length > 5) {
        console.log(
          `   ... and ${results.errors.length - 5} more parsing errors`
        );
      }
    }

    return results;
  } catch (error) {
    console.error(`❌ Failed to read CSV file: ${error.message}`);
    throw error;
  }
}

// ===== DATABASE OPERATIONS =====

/**
 * Checks if gemstone already exists in database
 * Uses normalized internal_code for consistent matching
 */
// Cache for gemstone lookups to avoid repeated database calls
let gemstoneCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function findExistingGemstone(internalCode) {
  const normalizedCode = normalizeSerialNumber(internalCode);

  // Check if we need to refresh the cache
  const now = Date.now();
  if (!gemstoneCache || now - cacheTimestamp > CACHE_DURATION) {
    console.log("🔄 Refreshing gemstone cache...");

    // Fetch all gemstones using pagination to get all records
    let allGemstones = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("gemstones")
        .select("*")
        .range(from, from + batchSize - 1);

      if (error) {
        console.error(`❌ Error fetching gemstones: ${error.message}`);
        return null;
      }

      if (data && data.length > 0) {
        allGemstones = allGemstones.concat(data);
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    gemstoneCache = allGemstones;
    cacheTimestamp = now;
    console.log(`✅ Cached ${gemstoneCache.length} gemstones`);
  }

  // Find gemstone with matching normalized internal_code
  const existing = gemstoneCache?.find(
    (gemstone) =>
      normalizeSerialNumber(gemstone.internal_code) === normalizedCode
  );

  return existing || null;
}

/**
 * Updates existing gemstone with CSV data
 */
async function updateGemstone(existingGemstone, csvData) {
  const updateData = {};

  // Only update fields that are missing or null in database
  if (!existingGemstone.internal_code && csvData.internal_code) {
    updateData.internal_code = csvData.internal_code;
  }

  if (!existingGemstone.description && csvData.description) {
    updateData.description = csvData.description;
  }

  if (!existingGemstone.length_mm && csvData.length_mm) {
    updateData.length_mm = csvData.length_mm;
  }

  if (!existingGemstone.width_mm && csvData.width_mm) {
    updateData.width_mm = csvData.width_mm;
  }

  if (!existingGemstone.depth_mm && csvData.depth_mm) {
    updateData.depth_mm = csvData.depth_mm;
  }

  // Always update price fields if available (CSV is more current)
  if (csvData.price_amount) {
    updateData.price_amount = csvData.price_amount;
    updateData.price_currency = csvData.price_currency;
  }

  // Update per-carat pricing (null for lot pricing)
  if (csvData.price_per_carat !== undefined) {
    updateData.price_per_carat = csvData.price_per_carat;
  }

  // Always update quantity from CSV
  if (csvData.quantity !== undefined) {
    updateData.quantity = csvData.quantity;
  }

  // Update stock status
  updateData.in_stock = csvData.in_stock;
  updateData.metadata_status = "updated"; // NEW: Mark as updated from CSV
  updateData.updated_at = new Date().toISOString();

  if (Object.keys(updateData).length === 0) {
    return { updated: false, reason: "No fields need updating" };
  }

  const { error } = await supabase
    .from("gemstones")
    .update(updateData)
    .eq("id", existingGemstone.id);

  if (error) {
    console.error(`❌ Error updating gemstone: ${error.message}`);
    return { updated: false, error: error.message };
  }

  return { updated: true, updateData };
}

/**
 * Creates new gemstone in database
 */
async function createGemstone(csvData) {
  const insertData = {
    name: csvData.name,
    serial_number: generateSerialNumber(csvData.internal_code),
    internal_code: csvData.internal_code,
    description: csvData.description,
    cut: csvData.cut,
    weight_carats: csvData.weight_carats,
    length_mm: csvData.length_mm,
    width_mm: csvData.width_mm,
    depth_mm: csvData.depth_mm,
    color: "colorless", // Default color - to be determined by AI analysis
    clarity: "SI1", // Default clarity - to be determined by AI analysis
    price_amount: csvData.price_amount,
    price_per_carat: csvData.price_per_carat, // NEW: Per-carat pricing
    price_currency: csvData.price_currency,
    quantity: csvData.quantity, // NEW: Number of stones in lot
    in_stock: csvData.in_stock,
    delivery_days: 7, // Default delivery time
    metadata_status: "needs_review", // NEW: New stones need review
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("gemstones")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error(`❌ Error creating gemstone: ${error.message}`);
    return { created: false, error: error.message };
  }

  return { created: true, data };
}

// ===== MAIN IMPORT FUNCTION =====

async function importCsvGemstones(csvPath, dryRun = false) {
  const startTime = Date.now();
  console.log(
    `🚀 Starting CSV gemstone import${dryRun ? " (DRY RUN)" : ""}...`
  );

  const results = {
    processed: 0,
    updated: 0,
    created: 0,
    skipped: 0,
    errors: [],
    notImported: [], // NEW: Track rows that didn't get imported
    updatedStones: [], // NEW: Track which stones were updated
    createdStones: [], // NEW: Track which stones were created
  };

  try {
    // Parse CSV file
    const csvData = await parseCsvFile(csvPath);

    if (csvData.valid.length === 0) {
      console.log("❌ No valid gemstones found in CSV");
      return results;
    }

    console.log(`🔄 Processing ${csvData.valid.length} gemstones...`);

    // Process each gemstone
    for (const [index, gemstoneData] of csvData.valid.entries()) {
      try {
        results.processed++;

        // Check if gemstone already exists
        const existing = await findExistingGemstone(gemstoneData.internal_code);

        if (existing) {
          // Update existing gemstone
          if (dryRun) {
            console.log(
              `🔄 [DRY RUN] Would update: ${gemstoneData.internal_code} (${existing.serial_number})`
            );
            results.updated++;
            results.updatedStones.push({
              internal_code: gemstoneData.internal_code,
              serial_number: existing.serial_number,
              name: gemstoneData.name,
              weight_carats: gemstoneData.weight_carats,
              price_amount: gemstoneData.price_amount,
            });
          } else {
            const updateResult = await updateGemstone(existing, gemstoneData);
            if (updateResult.updated) {
              results.updated++;
              results.updatedStones.push({
                internal_code: gemstoneData.internal_code,
                serial_number: existing.serial_number,
                name: gemstoneData.name,
                weight_carats: gemstoneData.weight_carats,
                price_amount: gemstoneData.price_amount,
              });
              console.log(
                `✅ Updated: ${
                  existing.serial_number || gemstoneData.internal_code
                }`
              );
            } else {
              results.skipped++;
              results.notImported.push({
                row: index + 1,
                internal_code: gemstoneData.internal_code,
                name: gemstoneData.name,
                reason: updateResult.reason,
              });
              console.log(
                `⏭️  Skipped: ${gemstoneData.internal_code} - ${updateResult.reason}`
              );
            }
          }
        } else {
          // Create new gemstone
          if (dryRun) {
            console.log(
              `🆕 [DRY RUN] Would create: ${gemstoneData.internal_code} (${
                gemstoneData.name
              }, ${gemstoneData.weight_carats}ct, $${
                gemstoneData.price_amount / 100
              })`
            );
            results.created++;
            results.createdStones.push({
              internal_code: gemstoneData.internal_code,
              name: gemstoneData.name,
              weight_carats: gemstoneData.weight_carats,
              price_amount: gemstoneData.price_amount,
            });
          } else {
            const createResult = await createGemstone(gemstoneData);
            if (createResult.created) {
              results.created++;
              results.createdStones.push({
                internal_code: gemstoneData.internal_code,
                name: gemstoneData.name,
                weight_carats: gemstoneData.weight_carats,
                price_amount: gemstoneData.price_amount,
              });
              console.log(
                `🆕 Created: ${
                  createResult.data?.serial_number || gemstoneData.internal_code
                }`
              );
            } else {
              results.errors.push({
                row: index + 1,
                internal_code: gemstoneData.internal_code,
                error: createResult.error,
              });
              results.notImported.push({
                row: index + 1,
                internal_code: gemstoneData.internal_code,
                name: gemstoneData.name,
                reason: createResult.error,
              });
            }
          }
        }

        // Progress indicator
        if (results.processed % 50 === 0) {
          console.log(
            `📈 Progress: ${results.processed}/${csvData.valid.length}`
          );
        }
      } catch (error) {
        results.errors.push({
          row: index + 1,
          internal_code: gemstoneData.internal_code,
          name: gemstoneData.name,
          error: error.message,
        });
        console.error(
          `❌ Error processing ${gemstoneData.internal_code}: ${error.message}`
        );
      }
    }

    // Final summary
    console.log(`\n📊 Import Summary${dryRun ? " (DRY RUN)" : ""}:`);
    console.log(`   Processed: ${results.processed}`);
    console.log(
      `   ${dryRun ? "Would update" : "Updated"}: ${results.updated}`
    );
    console.log(
      `   ${dryRun ? "Would create" : "Created"}: ${results.created}`
    );
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors.length}`);

    if (dryRun) {
      console.log(`\n🔍 DRY RUN DETAILED REPORT:`);
      console.log(`📋 Total CSV entries processed: ${csvData.valid.length}`);
      console.log(`🔄 Would update existing gemstones: ${results.updated}`);
      console.log(`🆕 Would create new gemstones: ${results.created}`);
      console.log(
        `📊 Database cache loaded: ${gemstoneCache?.length || 0} gemstones`
      );
      console.log(
        `⏱️  Processing time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`
      );

      // Show sample of stones that would be updated
      if (results.updatedStones.length > 0) {
        console.log(
          `\n📝 Sample stones that would be UPDATED (metadata_status: 'updated'):`
        );
        results.updatedStones.slice(0, 5).forEach((stone) => {
          console.log(
            `   • ${stone.internal_code} (${stone.serial_number}) - ${
              stone.name
            }, ${stone.weight_carats}ct, $${stone.price_amount / 100}`
          );
        });
        if (results.updatedStones.length > 5) {
          console.log(`   ... and ${results.updatedStones.length - 5} more`);
        }
      }

      // Show sample of stones that would be created
      if (results.createdStones.length > 0) {
        console.log(
          `\n🆕 Sample stones that would be CREATED (metadata_status: 'needs_review'):`
        );
        results.createdStones.slice(0, 5).forEach((stone) => {
          console.log(
            `   • ${stone.internal_code} - ${stone.name}, ${
              stone.weight_carats
            }ct, $${stone.price_amount / 100}`
          );
        });
        if (results.createdStones.length > 5) {
          console.log(`   ... and ${results.createdStones.length - 5} more`);
        }
      }

      // Show stones that would not be imported
      if (results.notImported.length > 0) {
        console.log(
          `\n⚠️  Stones that would NOT be imported (${results.notImported.length}):`
        );
        results.notImported.slice(0, 5).forEach((stone) => {
          console.log(
            `   • Row ${stone.row}: ${stone.internal_code} (${stone.name}) - ${stone.reason}`
          );
        });
        if (results.notImported.length > 5) {
          console.log(`   ... and ${results.notImported.length - 5} more`);
        }
      }

      console.log(`\n💡 To perform actual import, run without --dry-run flag`);

      // Create detailed report file for not imported rows or invalid entries
      if (
        results.notImported.length > 0 ||
        csvData.invalid.length > 0 ||
        csvData.errors.length > 0
      ) {
        const reportData = {
          summary: {
            total_processed: results.processed,
            updated: results.updated,
            created: results.created,
            not_imported: results.notImported.length,
            errors: results.errors.length,
            processing_time_seconds: ((Date.now() - startTime) / 1000).toFixed(
              2
            ),
          },
          csv_parsing: {
            valid_entries: csvData.valid.length,
            invalid_entries: csvData.invalid.length,
            parsing_errors: csvData.errors.length,
          },
          not_imported_rows: results.notImported,
          updated_stones: results.updatedStones,
          created_stones: results.createdStones,
          errors: results.errors,
          invalid_csv_entries: csvData.invalid,
          csv_parsing_errors: csvData.errors,
        };

        const fs = await import("fs");
        const reportPath = `csv-import-report-${
          new Date().toISOString().split("T")[0]
        }.json`;
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
      }
    }

    if (results.errors.length > 0) {
      console.log("\n❌ Errors:");
      results.errors.slice(0, 10).forEach((err) => {
        console.log(`   ${err.serial}: ${err.error}`);
      });
      if (results.errors.length > 10) {
        console.log(`   ... and ${results.errors.length - 10} more errors`);
      }
    }
  } catch (error) {
    console.error(`❌ Import failed: ${error.message}`);
    throw error;
  }

  return results;
}

// ===== CLI EXECUTION =====

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const csvPath =
    args.find((arg) => !arg.startsWith("--")) ||
    path.join(__dirname, "..", "docs", "прайс камни.csv");
  const dryRun = args.includes("--dry-run") || args.includes("-d");

  console.log("💎 Russian CSV Gemstone Importer");
  console.log(`📁 CSV Path: ${csvPath}`);
  console.log(
    `🔍 Mode: ${dryRun ? "DRY RUN (no database changes)" : "LIVE IMPORT"}`
  );

  importCsvGemstones(csvPath, dryRun)
    .then((results) => {
      console.log(
        `✅ Import completed successfully${dryRun ? " (dry run)" : ""}!`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Import failed:", error.message);
      process.exit(1);
    });
}

export { importCsvGemstones, parseCsvFile };
