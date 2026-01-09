/**
 * CutsService - Service for fetching cut types from database
 * Contract: CUT-C1.1
 *
 * This service replaces the hardcoded GEM_CUTS array with database queries,
 * enabling administrators to add new cut types without code changes.
 */

import { supabase } from "@/lib/supabase";
import type { Cut, DatabaseCut } from "@/shared/types";

// Cache for cuts data
let cutsCache: Cut[] | null = null;
let cutsByCodeCache: Map<string, Cut> | null = null;
let cutsByIdCache: Map<string, Cut> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Convert database row to Cut type
 */
function toCut(row: DatabaseCut): Cut {
  return {
    id: row.id,
    code: row.code,
    name_en: row.name_en,
    name_ru: row.name_ru,
    description_en: row.description_en,
    description_ru: row.description_ru,
    display_order: row.display_order ?? 0,
    is_active: row.is_active ?? true,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return cutsCache !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/**
 * Invalidate the cuts cache
 */
export function invalidateCutsCache(): void {
  cutsCache = null;
  cutsByCodeCache = null;
  cutsByIdCache = null;
  cacheTimestamp = 0;
}

/**
 * Get all active cuts from database, sorted by display_order
 */
export async function getAllCuts(): Promise<Cut[]> {
  if (isCacheValid() && cutsCache) {
    return cutsCache;
  }

  const { data, error } = await supabase
    .from("cuts")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching cuts:", error);
    // Return cached data if available, even if stale
    if (cutsCache) {
      return cutsCache;
    }
    throw new Error(`Failed to fetch cuts: ${error.message}`);
  }

  cutsCache = (data || []).map(toCut);
  cutsByCodeCache = new Map(cutsCache.map((c) => [c.code, c]));
  cutsByIdCache = new Map(cutsCache.map((c) => [c.id, c]));
  cacheTimestamp = Date.now();

  return cutsCache;
}

/**
 * Get a cut by its code (e.g., "round", "marquise")
 */
export async function getCutByCode(code: string): Promise<Cut | null> {
  // Try cache first
  if (isCacheValid() && cutsByCodeCache) {
    return cutsByCodeCache.get(code) ?? null;
  }

  // Populate cache
  await getAllCuts();

  return cutsByCodeCache?.get(code) ?? null;
}

/**
 * Get a cut by its ID (UUID)
 */
export async function getCutById(id: string): Promise<Cut | null> {
  // Try cache first
  if (isCacheValid() && cutsByIdCache) {
    return cutsByIdCache.get(id) ?? null;
  }

  // Populate cache
  await getAllCuts();

  return cutsByIdCache?.get(id) ?? null;
}

/**
 * Get cut codes as array (for backward compatibility with GEM_CUTS)
 */
export async function getCutCodes(): Promise<string[]> {
  const cuts = await getAllCuts();
  return cuts.map((c) => c.code);
}

/**
 * Get translated cut name
 */
export async function getTranslatedCutName(
  code: string,
  locale: "en" | "ru"
): Promise<string> {
  const cut = await getCutByCode(code);
  if (!cut) {
    return code; // Fallback to code if not found
  }
  return locale === "ru" ? cut.name_ru : cut.name_en;
}

/**
 * Get cuts as options for select/dropdown components
 */
export async function getCutsAsOptions(
  locale: "en" | "ru"
): Promise<Array<{ value: string; label: string }>> {
  const cuts = await getAllCuts();
  return cuts.map((cut) => ({
    value: cut.code,
    label: locale === "ru" ? cut.name_ru : cut.name_en,
  }));
}

/**
 * Check if a cut code is valid
 */
export async function isValidCutCode(code: string): Promise<boolean> {
  const cut = await getCutByCode(code);
  return cut !== null;
}

// Export as service object for consistency with other services
export const CutsService = {
  getAllCuts,
  getCutByCode,
  getCutById,
  getCutCodes,
  getTranslatedCutName,
  getCutsAsOptions,
  isValidCutCode,
  invalidateCache: invalidateCutsCache,
};

export default CutsService;
