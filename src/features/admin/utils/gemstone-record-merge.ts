import type { Database } from "@/shared/types/database";

type GemstoneRow = Database["public"]["Tables"]["gemstones"]["Row"];
type EnrichedGemstoneRow =
  Database["public"]["Views"]["gemstones_enriched"]["Row"] | null;

export type MergedAdminGemstoneRecord =
  Database["public"]["Tables"]["gemstones"]["Row"] &
    Database["public"]["Views"]["gemstones_enriched"]["Row"];

/**
 * Merge the canonical gemstones row with the gemstones_enriched view row.
 * Base table values win over null/undefined values from the view while
 * preserving AI/derived fields that only exist in the view.
 */
export function mergeAdminGemstoneRecords(
  base: GemstoneRow,
  enriched: EnrichedGemstoneRow
): MergedAdminGemstoneRecord {
  if (!enriched) {
    return { ...(base as MergedAdminGemstoneRecord) };
  }

  return {
    ...enriched,
    ...base,
  } as MergedAdminGemstoneRecord;
}

