#!/usr/bin/env node

/**
 * Hardcoded String Fixer
 * Automatically adds missing translation keys for hardcoded strings found by the scanner
 */

import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Translation mappings for common hardcoded strings
const TRANSLATION_MAPPINGS = {
  // User Profile & Orders
  "Filter by status": { key: "filterByStatus", namespace: "user.orders" },
  "All Orders": { key: "allOrders", namespace: "user.orders" },
  Pending: { key: "status.pending", namespace: "user.orders" },
  Confirmed: { key: "status.confirmed", namespace: "user.orders" },
  Processing: { key: "status.processing", namespace: "user.orders" },
  Shipped: { key: "status.shipped", namespace: "user.orders" },
  Delivered: { key: "status.delivered", namespace: "user.orders" },
  Cancelled: { key: "status.cancelled", namespace: "user.orders" },
  Overview: { key: "tabs.overview", namespace: "user.profile" },
  "Order History": { key: "tabs.orderHistory", namespace: "user.profile" },
  Activity: { key: "tabs.activity", namespace: "user.profile" },
  Settings: { key: "tabs.settings", namespace: "user.profile" },
  "View All Orders": { key: "viewAllOrders", namespace: "user.profile" },
  "Your account activity overview": {
    key: "activityOverview",
    namespace: "user.profile",
  },

  // Gemstone Types (for filter types)
  Diamond: { key: "types.diamond", namespace: "gemstones" },
  Emerald: { key: "types.emerald", namespace: "gemstones" },
  Ruby: { key: "types.ruby", namespace: "gemstones" },
  Sapphire: { key: "types.sapphire", namespace: "gemstones" },
  Price: { key: "properties.price", namespace: "gemstones" },
  Color: { key: "properties.color", namespace: "gemstones" },
  Cut: { key: "properties.cut", namespace: "gemstones" },

  // Chat
  "Attach files": { key: "attachFiles", namespace: "chat" },

  // Common UI
  Crystallique: { key: "brandName", namespace: "common" },
};

// Russian translations for the mapped keys
const RUSSIAN_TRANSLATIONS = {
  "user.orders": {
    filterByStatus: "Фильтр по статусу",
    allOrders: "Все заказы",
    status: {
      pending: "В ожидании",
      confirmed: "Подтверждён",
      processing: "В обработке",
      shipped: "Отправлен",
      delivered: "Доставлен",
      cancelled: "Отменён",
    },
  },
  "user.profile": {
    tabs: {
      overview: "Обзор",
      orderHistory: "История заказов",
      activity: "Активность",
      settings: "Настройки",
    },
    viewAllOrders: "Посмотреть все заказы",
    activityOverview: "Обзор активности вашего аккаунта",
  },
  gemstones: {
    types: {
      diamond: "Бриллиант",
      emerald: "Изумруд",
      ruby: "Рубин",
      sapphire: "Сапфир",
    },
    properties: {
      price: "Цена",
      color: "Цвет",
      cut: "Огранка",
    },
  },
  chat: {
    attachFiles: "Прикрепить файлы",
  },
  common: {
    brandName: "Crystallique",
  },
};

// English translations for the mapped keys
const ENGLISH_TRANSLATIONS = {
  "user.orders": {
    filterByStatus: "Filter by status",
    allOrders: "All Orders",
    status: {
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    },
  },
  "user.profile": {
    tabs: {
      overview: "Overview",
      orderHistory: "Order History",
      activity: "Activity",
      settings: "Settings",
    },
    viewAllOrders: "View All Orders",
    activityOverview: "Your account activity overview",
  },
  gemstones: {
    types: {
      diamond: "Diamond",
      emerald: "Emerald",
      ruby: "Ruby",
      sapphire: "Sapphire",
    },
    properties: {
      price: "Price",
      color: "Color",
      cut: "Cut",
    },
  },
  chat: {
    attachFiles: "Attach files",
  },
  common: {
    brandName: "Crystallique",
  },
};

/**
 * Load translation file
 */
async function loadTranslationFile(locale, filename) {
  try {
    const filePath = path.join(
      projectRoot,
      "src",
      "messages",
      locale,
      filename
    );
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
 * Save translation file
 */
async function saveTranslationFile(locale, filename, data) {
  try {
    const filePath = path.join(
      projectRoot,
      "src",
      "messages",
      locale,
      filename
    );
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  } catch (error) {
    console.error(`Error saving ${locale}/${filename}:`, error.message);
    return false;
  }
}

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Add missing translation keys to files
 */
async function addMissingTranslationKeys() {
  console.log("🔧 Adding missing translation keys...\n");

  const filesToUpdate = {
    "user.json": ["user.orders", "user.profile"],
    "gemstones.json": ["gemstones"],
    "chat.json": ["chat"],
    "common.json": ["common"],
  };

  let totalKeysAdded = 0;

  for (const [filename, namespaces] of Object.entries(filesToUpdate)) {
    console.log(`📄 Processing ${filename}...`);

    // Load existing files
    const enData = await loadTranslationFile("en", filename);
    const ruData = await loadTranslationFile("ru", filename);

    let enUpdated = { ...enData };
    let ruUpdated = { ...ruData };
    let keysAddedToFile = 0;

    // Add translations for each namespace
    for (const namespace of namespaces) {
      if (ENGLISH_TRANSLATIONS[namespace]) {
        enUpdated = deepMerge(enUpdated, ENGLISH_TRANSLATIONS[namespace]);
        ruUpdated = deepMerge(ruUpdated, RUSSIAN_TRANSLATIONS[namespace]);

        const keyCount = countKeys(ENGLISH_TRANSLATIONS[namespace]);
        keysAddedToFile += keyCount;
        totalKeysAdded += keyCount;
      }
    }

    if (keysAddedToFile > 0) {
      // Save updated files
      await saveTranslationFile("en", filename, enUpdated);
      await saveTranslationFile("ru", filename, ruUpdated);
      console.log(`  ✅ Added ${keysAddedToFile} keys to ${filename}`);
    } else {
      console.log(`  ℹ️  No new keys needed for ${filename}`);
    }
  }

  console.log(`\n🎯 Total keys added: ${totalKeysAdded}`);
  return totalKeysAdded;
}

/**
 * Count keys in nested object
 */
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

/**
 * Generate component fix suggestions
 */
function generateComponentFixSuggestions() {
  console.log("\n📝 COMPONENT FIX SUGGESTIONS:");
  console.log("=".repeat(50));

  const suggestions = [
    {
      file: "src/features/chat/components/file-upload.tsx",
      fixes: [
        'Add: import { useTranslations } from "next-intl";',
        'Add: const t = useTranslations("chat");',
        'Replace: title="Attach files" → title={t("attachFiles")}',
      ],
    },
    {
      file: "src/features/user/components/order-history.tsx",
      fixes: [
        'Add: import { useTranslations } from "next-intl";',
        'Add: const t = useTranslations("user.orders");',
        'Replace: placeholder="Filter by status" → placeholder={t("filterByStatus")}',
        'Replace: "All Orders" → {t("allOrders")}',
        'Replace: "Pending" → {t("status.pending")}',
        'Replace: "Confirmed" → {t("status.confirmed")}',
        'Replace: "Processing" → {t("status.processing")}',
        'Replace: "Shipped" → {t("status.shipped")}',
        'Replace: "Delivered" → {t("status.delivered")}',
        'Replace: "Cancelled" → {t("status.cancelled")}',
      ],
    },
    {
      file: "src/features/user/components/user-profile-page.tsx",
      fixes: [
        'Add: import { useTranslations } from "next-intl";',
        'Add: const t = useTranslations("user.profile");',
        'Replace: "Overview" → {t("tabs.overview")}',
        'Replace: "Order History" → {t("tabs.orderHistory")}',
        'Replace: "Activity" → {t("tabs.activity")}',
        'Replace: "Settings" → {t("tabs.settings")}',
        'Replace: "View All Orders" → {t("viewAllOrders")}',
        'Replace: "Your account activity overview" → {t("activityOverview")}',
      ],
    },
  ];

  suggestions.forEach((suggestion) => {
    console.log(`\n📄 ${suggestion.file}:`);
    suggestion.fixes.forEach((fix) => {
      console.log(`  • ${fix}`);
    });
  });

  console.log("\n💡 After making these changes, run:");
  console.log("   npm run i18n:validate");
  console.log("   npm run i18n:scan");
  console.log("   npm run build");
}

/**
 * Main execution
 */
async function main() {
  console.log("🔧 Hardcoded String Fixer\n");
  console.log("=".repeat(50));

  try {
    // Add missing translation keys
    const keysAdded = await addMissingTranslationKeys();

    // Generate component fix suggestions
    generateComponentFixSuggestions();

    console.log("\n✅ Translation keys have been added to translation files.");
    console.log(
      "📋 Follow the component fix suggestions above to complete the localization."
    );
  } catch (error) {
    console.error("❌ Error during fix process:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { addMissingTranslationKeys, generateComponentFixSuggestions };
