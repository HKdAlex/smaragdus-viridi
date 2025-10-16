/**
 * Seed script for colors and color_translations tables
 * This script populates the colors reference table with standard gemstone colors
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Standard gemstone colors with translations
const colors = [
  { code: "red", hex: "#DC2626", sort: 1, en: "Red", ru: "Красный" },
  { code: "pink", hex: "#EC4899", sort: 2, en: "Pink", ru: "Розовый" },
  { code: "orange", hex: "#EA580C", sort: 3, en: "Orange", ru: "Оранжевый" },
  { code: "yellow", hex: "#EAB308", sort: 4, en: "Yellow", ru: "Желтый" },
  { code: "green", hex: "#16A34A", sort: 5, en: "Green", ru: "Зеленый" },
  { code: "blue", hex: "#2563EB", sort: 6, en: "Blue", ru: "Синий" },
  { code: "purple", hex: "#9333EA", sort: 7, en: "Purple", ru: "Фиолетовый" },
  { code: "brown", hex: "#92400E", sort: 8, en: "Brown", ru: "Коричневый" },
  { code: "black", hex: "#1F2937", sort: 9, en: "Black", ru: "Черный" },
  { code: "white", hex: "#F9FAFB", sort: 10, en: "White", ru: "Белый" },
  { code: "gray", hex: "#6B7280", sort: 11, en: "Gray", ru: "Серый" },
  {
    code: "colorless",
    hex: "#F3F4F6",
    sort: 12,
    en: "Colorless",
    ru: "Бесцветный",
  },
  {
    code: "multi-color",
    hex: "#7C3AED",
    sort: 13,
    en: "Multi-color",
    ru: "Многоцветный",
  },
  { code: "smoky", hex: "#4B5563", sort: 14, en: "Smoky", ru: "Дымчатый" },
  { code: "amber", hex: "#F59E0B", sort: 15, en: "Amber", ru: "Янтарный" },
  { code: "violet", hex: "#8B5CF6", sort: 16, en: "Violet", ru: "Фиолетовый" },
  { code: "teal", hex: "#0D9488", sort: 17, en: "Teal", ru: "Бирюзовый" },
  { code: "coral", hex: "#F97316", sort: 18, en: "Coral", ru: "Коралловый" },
  { code: "peach", hex: "#FB923C", sort: 19, en: "Peach", ru: "Персиковый" },
  { code: "mint", hex: "#10B981", sort: 20, en: "Mint", ru: "Мятный" },
];

async function seedColors() {
  console.log("🌱 Seeding colors table...");

  try {
    // Insert colors (ignore conflicts)
    for (const color of colors) {
      const { data, error } = await supabase.from("colors").upsert(
        {
          color_code: color.code,
          hex_value: color.hex,
          sort_order: color.sort,
        },
        {
          onConflict: "color_code",
          ignoreDuplicates: true,
        }
      );

      if (error) {
        console.error(
          `❌ Failed to insert color ${color.code}:`,
          error.message
        );
        continue;
      }
    }

    console.log("✓ Colors inserted successfully");

    // Insert translations
    for (const color of colors) {
      // Get color ID
      const { data: colorData, error: colorError } = await supabase
        .from("colors")
        .select("id")
        .eq("color_code", color.code)
        .single();

      if (colorError || !colorData) {
        console.error(
          `❌ Failed to get color ID for ${color.code}:`,
          colorError?.message
        );
        continue;
      }

      // Insert English translation
      const { error: enError } = await supabase
        .from("color_translations")
        .upsert(
          {
            color_id: colorData.id,
            language_code: "en",
            name: color.en,
          },
          {
            onConflict: "color_id,language_code",
            ignoreDuplicates: true,
          }
        );

      if (enError) {
        console.error(
          `❌ Failed to insert EN translation for ${color.code}:`,
          enError.message
        );
      }

      // Insert Russian translation
      const { error: ruError } = await supabase
        .from("color_translations")
        .upsert(
          {
            color_id: colorData.id,
            language_code: "ru",
            name: color.ru,
          },
          {
            onConflict: "color_id,language_code",
            ignoreDuplicates: true,
          }
        );

      if (ruError) {
        console.error(
          `❌ Failed to insert RU translation for ${color.code}:`,
          ruError.message
        );
      }
    }

    console.log("✓ Color translations inserted successfully");

    // Verify the data
    const { data: colorCount, error: countError } = await supabase
      .from("colors")
      .select("id", { count: "exact" });

    const { data: translationCount, error: translationCountError } =
      await supabase
        .from("color_translations")
        .select("id", { count: "exact" });

    if (!countError && !translationCountError) {
      console.log(`📊 Final counts:`);
      console.log(`  - Colors: ${colorCount.length}`);
      console.log(`  - Translations: ${translationCount.length}`);
    }

    console.log("🎉 Color seeding completed successfully!");
  } catch (error) {
    console.error("❌ Color seeding failed:", error.message);
    throw error;
  }
}

// Run the seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedColors()
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error.message);
      process.exit(1);
    });
}

export { seedColors };
