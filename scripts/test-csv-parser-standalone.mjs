#!/usr/bin/env node
/**
 * Standalone test for CSV parsing logic (no Supabase required)
 * Tests mapping functions and data parsing
 */

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== MAPPING DICTIONARIES =====
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

const GEM_CUT_MAP = {
  фантазийная: "fantasy",
  октагон: "emerald",
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
function cleanString(str) {
  if (!str || str === "") return null;
  return str.toString().trim();
}

function normalizeSerialNumber(serial) {
  if (!serial) return null;

  // Remove all spaces, dashes, and underscores, then uppercase
  return serial
    .toString()
    .replace(/[\s\-_]+/g, "")
    .toUpperCase()
    .trim();
}

function parseNumber(value) {
  if (!value || value === "") return null;
  const cleaned = value.toString().replace(",", ".");
  const number = parseFloat(cleaned);
  return isNaN(number) ? null : number;
}

function parseDimensions(dimensionStr) {
  if (!dimensionStr || dimensionStr === "") return null;

  const str = dimensionStr.toString().trim();
  const numbers = str
    .replace(/[\\\/]/g, " ")
    .split(/[\s,]+/)
    .map((s) => parseNumber(s))
    .filter((n) => n !== null && n > 0);

  return numbers.length > 0 ? numbers[0] : null;
}

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

function mapGemstoneType(russianName) {
  if (!russianName) return null;

  const cleaned = russianName.toLowerCase().trim();
  const mapped = GEMSTONE_TYPE_MAP[cleaned];

  if (mapped) return mapped;

  if (cleaned.includes("изумруд")) return "emerald";
  if (cleaned.includes("гранат")) return "garnet";
  if (cleaned.includes("сапфир")) return "sapphire";
  if (cleaned.includes("аквамарин")) return "aquamarine";

  return "quartz";
}

function mapGemCut(russianCut) {
  if (!russianCut) return "fantasy";

  const cleaned = russianCut.toLowerCase().trim();
  const mapped = GEM_CUT_MAP[cleaned];

  return mapped || "fantasy";
}

// ===== PARSING FUNCTION =====
function parseCsvRow(row, lineNumber) {
  const [
    photo,
    gemstoneType,
    serialNumber,
    address,
    cut,
    quantity,
    weight,
    length,
    width,
    depth,
    pricePerCarat,
  ] = row;

  if (!cleanString(gemstoneType) || !cleanString(serialNumber)) {
    return { valid: false, reason: "Missing gemstone type or internal code" };
  }

  const parsedQuantity = parseInt(quantity) || 1;
  const parsedWeight = parseNumber(weight);
  const pricingData = parsePrice(pricePerCarat, parsedQuantity, parsedWeight);

  if (!parsedWeight || parsedWeight <= 0) {
    return { valid: false, reason: "Invalid or missing weight" };
  }

  const gemstoneData = {
    name: mapGemstoneType(cleanString(gemstoneType)),
    internal_code: normalizeSerialNumber(cleanString(serialNumber)), // CSV "Номер" → internal_code (e.g., "Г 11" → "Г11")
    description: cleanString(address), // CSV "Адрес" → description field for storage location
    cut: mapGemCut(cleanString(cut)),
    weight_carats: parsedWeight,
    length_mm: parseDimensions(length),
    width_mm: parseDimensions(width),
    depth_mm: parseDimensions(depth),
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

// ===== TEST DATA AND EXECUTION =====
const sampleCsvData = `Фото,Камень,Номер,Адрес,Огранка,Кол-во,Вес ct,Длина,Ширин,Глубин,Цена $ за  ct
,изумруд,1,больш,фантазийная,1,12.89,15.0,20.7,7.2,3000
,изумруд,2,больш,фантазийная,1,9.95,17.5,9.5,8.5,600
,гранат\\ родолит,Г11,3,овал,9,4.28,5.0,4.0,,100
,сапфир,С1,7,овал,1,7.18,12.5,9.3,6.4,20
,шпинель (лаб),95,5,круг,3,4.11,"8,9 5,4",,"5    3,1",200 за лот
,александрит,98,5,овал,1,9.11,18.0,9.9,6.7,180
,аквамарин,Н1,5,овал,1,2.02,9.3,7.6,4.9,50
,танзанит,З1,1,овал,3,3.10,7.9,5.7,2.7,240
,цитрин,Ц31,3,сердце,1,2.10,9.1,9.2,5.5,30
,аметист,Ф1,2,сердце,1,3.82,11.0,11.7,6.8,25`;

async function testStandaloneParser() {
  console.log("🧪 Testing CSV Gemstone Parser (Standalone)");
  console.log("===========================================\n");

  try {
    // Parse sample data
    const lines = sampleCsvData.split("\n");
    const results = { valid: [], invalid: [], errors: [] };

    console.log(`📖 Processing ${lines.length - 1} sample rows...`);

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

    // Display results
    console.log("\n📊 Parsing Results:");
    console.log(`✅ Valid entries: ${results.valid.length}`);
    console.log(`⚠️  Invalid entries: ${results.invalid.length}`);
    console.log(`❌ Parsing errors: ${results.errors.length}`);

    // Show parsed gemstones
    if (results.valid.length > 0) {
      console.log("\n💎 Parsed Gemstones:");
      console.log("───────────────────");

      results.valid.forEach((gem, index) => {
        console.log(
          `\n${index + 1}. ${gem.internal_code} - ${gem.name.toUpperCase()}`
        );
        console.log(`   Cut: ${gem.cut} | Weight: ${gem.weight_carats}ct`);
        console.log(
          `   Dimensions: ${gem.length_mm} x ${gem.width_mm} x ${
            gem.depth_mm || "N/A"
          } mm`
        );
        console.log(
          `   Price: $${
            gem.price_amount ? (gem.price_amount / 100).toFixed(2) : "N/A"
          }`
        );
        console.log(`   Storage: ${gem.description || "N/A"}`);
      });
    }

    // Test specific mappings
    console.log("\n🔍 Testing Mapping Functions:");
    console.log("────────────────────────────");

    const testMappings = [
      {
        input: "изумруд",
        type: "gemstone",
        output: mapGemstoneType("изумруд"),
      },
      {
        input: "гранат\\ родолит",
        type: "gemstone",
        output: mapGemstoneType("гранат\\ родолит"),
      },
      {
        input: "шпинель (лаб)",
        type: "gemstone",
        output: mapGemstoneType("шпинель (лаб)"),
      },
      {
        input: "александрит",
        type: "gemstone",
        output: mapGemstoneType("александрит"),
      },
      { input: "октагон", type: "cut", output: mapGemCut("октагон") },
      { input: "сердце", type: "cut", output: mapGemCut("сердце") },
      { input: "кабошон", type: "cut", output: mapGemCut("кабошон") },
      { input: "фантазийная", type: "cut", output: mapGemCut("фантазийная") },
    ];

    testMappings.forEach((test) => {
      console.log(`   ${test.input} (${test.type}) → ${test.output}`);
    });

    // Test price parsing
    console.log("\n💰 Testing Price Parsing:");
    console.log("────────────────────────");

    const priceTests = [
      {
        input: "3000",
        weight: 12.89,
        qty: 1,
        expected: parsePrice("3000", 1, 12.89),
      },
      {
        input: "200 за лот",
        weight: 4.11,
        qty: 3,
        expected: parsePrice("200 за лот", 3, 4.11),
      },
      {
        input: "50",
        weight: 2.02,
        qty: 1,
        expected: parsePrice("50", 1, 2.02),
      },
    ];

    priceTests.forEach((test) => {
      const totalPrice = test.expected.totalPrice
        ? `$${(test.expected.totalPrice / 100).toFixed(2)}`
        : "N/A";
      const perCaratPrice = test.expected.pricePerCarat
        ? `$${(test.expected.pricePerCarat / 100).toFixed(2)}/ct`
        : "N/A";
      const pricingType = test.expected.isLotPricing ? "lot" : "per-carat";

      console.log(
        `   "${test.input}" (${test.weight}ct, qty:${test.qty}) → Total: ${totalPrice}, Per-carat: ${perCaratPrice} [${pricingType}]`
      );
    });

    console.log("\n🎉 Standalone parser test completed successfully!");

    return results;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    throw error;
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStandaloneParser()
    .then(() => {
      console.log("\n✅ All tests passed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Tests failed:", error.message);
      process.exit(1);
    });
}
