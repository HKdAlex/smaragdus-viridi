import {
  assertIsValidFusionOutput,
  assertIsValidPerImageExtraction,
} from "./schemas.mjs";

export async function savePerImageExtractions(
  supabase,
  gemstoneId,
  extractions
) {
  const records = extractions.filter(Boolean).map((extraction) => {
    assertIsValidPerImageExtraction(extraction);
    return {
      gemstone_id: gemstoneId,
      image_id: extraction.image_id,
      image_type: extraction.image_type,
      claims: extraction.claims,
      raw_response: extraction.raw_response || null,
      model_version: extraction.model_version || null,
      processing_cost_usd: extraction.processing_cost_usd || null,
      processing_time_ms: extraction.processing_time_ms || null,
    };
  });

  if (records.length === 0) return null;

  const { error } = await supabase
    .from("gem_image_extractions")
    .upsert(records);
  if (error) {
    throw new Error(`Failed to save per-image extractions: ${error.message}`);
  }

  return records.length;
}

export async function saveFusedResult(supabase, gemstoneId, fused, images) {
  assertIsValidFusionOutput(fused);

  const payload = {
    gemstone_id: gemstoneId,
    images: images.map((img) => img.id || img.image_id),
    final: fused.final,
    confidence: fused.confidence,
    provenance: fused.provenance,
    conflicts: fused.conflicts,
    needs_review: fused.needs_review,
    analysis_version: "v5",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("gemstones_ai_v5").upsert(payload);
  if (error) {
    throw new Error(`Failed to save fused result: ${error.message}`);
  }

  return payload;
}

export async function markGemstoneAnalyzed(supabase, gemstoneId) {
  const { error } = await supabase
    .from("gemstones")
    .update({
      ai_analysis_v5: true,
      ai_analysis_v5_date: new Date().toISOString(),
    })
    .eq("id", gemstoneId);

  if (error) {
    throw new Error(`Failed to mark gemstone analyzed: ${error.message}`);
  }
}

export async function loadPerImageExtractions(supabase, gemstoneId) {
  const { data, error } = await supabase
    .from("gem_image_extractions")
    .select("*")
    .eq("gemstone_id", gemstoneId);

  if (error) {
    throw new Error(`Failed to load per-image extractions: ${error.message}`);
  }

  return data || [];
}

export async function loadFusedResult(supabase, gemstoneId) {
  const { data, error } = await supabase
    .from("gemstones_ai_v5")
    .select("*")
    .eq("gemstone_id", gemstoneId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load fused result: ${error.message}`);
  }

  return data;
}

