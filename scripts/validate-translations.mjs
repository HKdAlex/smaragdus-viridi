#!/usr/bin/env node

/**
 * Translation Validation Script
 * Validates completeness and consistency of translation files
 */

import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Configuration
const LOCALES = ["en", "ru"];
const MESSAGES_DIR = path.join(projectRoot, "src", "messages");

/**
 * Recursively get all keys from a nested object
 */
function getAllKeys(obj, prefix = "") {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Load translation file
 */
async function loadTranslationFile(locale, filename) {
  try {
    const filePath = path.join(MESSAGES_DIR, locale, filename);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(
      `Warning: Could not load ${locale}/${filename}: ${error.message}`
    );
    return {};
  }
}

/**
 * Get all translation files in a locale directory
 */
async function getTranslationFiles(locale) {
  try {
    const localeDir = path.join(MESSAGES_DIR, locale);
    const files = await fs.readdir(localeDir);
    return files.filter((file) => file.endsWith(".json"));
  } catch (error) {
    console.error(`Error reading locale directory ${locale}:`, error.message);
    return [];
  }
}

/**
 * Validate translation completeness
 */
async function validateTranslations() {
  console.log("🔍 Validating translation completeness...\n");

  const results = {
    missingKeys: {},
    extraKeys: {},
    totalKeys: {},
    files: [],
  };

  // Get all translation files from English (reference locale)
  const translationFiles = await getTranslationFiles("en");

  for (const filename of translationFiles) {
    console.log(`📄 Checking ${filename}...`);

    const fileResults = {
      filename,
      locales: {},
      missingInLocales: {},
      extraInLocales: {},
    };

    // Load all locales for this file
    const localeData = {};
    for (const locale of LOCALES) {
      localeData[locale] = await loadTranslationFile(locale, filename);
    }

    // Get all keys from English (reference)
    const enKeys = getAllKeys(localeData.en);
    fileResults.locales.en = enKeys.length;

    // Check other locales against English
    for (const locale of LOCALES) {
      if (locale === "en") continue;

      const localeKeys = getAllKeys(localeData[locale]);
      fileResults.locales[locale] = localeKeys.length;

      // Find missing keys (in EN but not in locale)
      const missingKeys = enKeys.filter((key) => !localeKeys.includes(key));
      fileResults.missingInLocales[locale] = missingKeys;

      // Find extra keys (in locale but not in EN)
      const extraKeys = localeKeys.filter((key) => !enKeys.includes(key));
      fileResults.extraInLocales[locale] = extraKeys;

      if (missingKeys.length > 0) {
        console.log(`  ❌ ${locale}: Missing ${missingKeys.length} keys`);
        missingKeys.forEach((key) => console.log(`    - ${key}`));
      }

      if (extraKeys.length > 0) {
        console.log(`  ⚠️  ${locale}: Extra ${extraKeys.length} keys`);
        extraKeys.forEach((key) => console.log(`    + ${key}`));
      }

      if (missingKeys.length === 0 && extraKeys.length === 0) {
        console.log(`  ✅ ${locale}: Complete (${localeKeys.length} keys)`);
      }
    }

    results.files.push(fileResults);
    console.log("");
  }

  return results;
}

/**
 * Generate missing translation template
 */
function generateMissingTranslations(results) {
  console.log("📝 Generating missing translation templates...\n");

  for (const fileResult of results.files) {
    for (const [locale, missingKeys] of Object.entries(
      fileResult.missingInLocales
    )) {
      if (missingKeys.length === 0) continue;

      console.log(
        `\n📄 Missing translations for ${locale}/${fileResult.filename}:`
      );
      console.log("```json");

      // Create nested object structure for missing keys
      const template = {};
      for (const key of missingKeys) {
        const keyParts = key.split(".");
        let current = template;

        for (let i = 0; i < keyParts.length - 1; i++) {
          if (!current[keyParts[i]]) {
            current[keyParts[i]] = {};
          }
          current = current[keyParts[i]];
        }

        current[keyParts[keyParts.length - 1]] = `[TRANSLATE: ${key}]`;
      }

      console.log(JSON.stringify(template, null, 2));
      console.log("```\n");
    }
  }
}

/**
 * Generate Russian translations for missing keys
 */
function generateRussianTranslations(missingKeys) {
  const translations = {
    // Orders-specific translations
    back: "Назад",
    calculatedAtCheckout: "Рассчитывается при оформлении",
    cancelOrder: "Отменить Заказ",
    continueShopping: "Продолжить Покупки",
    currency: "Валюта",
    customerEmail: "Email Клиента",
    customerInfo: "Информация о Клиенте",
    customerName: "Имя Клиента",
    customerPhone: "Телефон Клиента",
    lastUpdated: "Последнее Обновление",
    loading: "Загрузка...",
    orderDate: "Дата Заказа",
    orderDetails: "Детали Заказа",
    orderHistory: "История Заказов",
    orderId: "ID Заказа",
    orderItems: "Товары в Заказе",
    orderSummary: "Сводка Заказа",
    serialNumber: "Серийный Номер",
    shipping: "Доставка",
    subtotal: "Промежуточный Итог",
    system: "Система",
    tax: "Налог",
    total: "Итого",
    notes: "Примечания",
    noItems: "Нет товаров",
    confirmCancel: "Вы уверены, что хотите отменить этот заказ?",
    orderCancellationNotImplemented: "Отмена заказа пока не реализована",

    // Error messages
    "error.title": "Заказ не найден",
    "error.notFound": "Заказ не найден или у вас нет доступа к нему",
    "error.viewAllOrders": "Посмотреть все заказы",
    "error.continueShopping": "Продолжить покупки",
  };

  const result = {};
  for (const key of missingKeys) {
    if (translations[key]) {
      const keyParts = key.split(".");
      let current = result;

      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }

      current[keyParts[keyParts.length - 1]] = translations[key];
    }
  }

  return result;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("🌐 Translation Validation Tool\n");
    console.log("Checking locales:", LOCALES.join(", "));
    console.log("Messages directory:", MESSAGES_DIR);
    console.log("=".repeat(50) + "\n");

    const results = await validateTranslations();

    // Generate templates for missing translations
    generateMissingTranslations(results);

    // Summary
    console.log("\n📊 SUMMARY");
    console.log("=".repeat(50));

    let totalMissing = 0;
    let totalExtra = 0;

    for (const fileResult of results.files) {
      console.log(`\n📄 ${fileResult.filename}:`);

      for (const locale of LOCALES) {
        if (locale === "en") continue;

        const missing = fileResult.missingInLocales[locale]?.length || 0;
        const extra = fileResult.extraInLocales[locale]?.length || 0;

        totalMissing += missing;
        totalExtra += extra;

        const status = missing === 0 && extra === 0 ? "✅" : "❌";
        console.log(
          `  ${status} ${locale}: ${missing} missing, ${extra} extra`
        );
      }
    }

    console.log(`\n🎯 TOTALS:`);
    console.log(`   Missing translations: ${totalMissing}`);
    console.log(`   Extra translations: ${totalExtra}`);

    if (totalMissing === 0 && totalExtra === 0) {
      console.log("\n🎉 All translations are complete and consistent!");
    } else {
      console.log("\n⚠️  Translation issues found. Please review and fix.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during validation:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateRussianTranslations, validateTranslations };
