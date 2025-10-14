Alex — I unzipped Archive.zip and read the code (Node/ESM). The project is solid: multi-image batching, a rich prompt, JSON-ish consolidation, Supabase writes, and stats. Below are opinionated, high-impact upgrades to modernize it for GPT-5 (and cheaper variants) and to make it sturdier/faster.

⸻

What you already nailed
• Single-call / multi-image batching (ai-analysis/multi-image-processor.mjs) — 👌 biggest cost saver.
• Image→DB round-trip (database-operations.mjs) with primary image flagging — practical and clean.
• Validation & stats (statistics.mjs) — helpful for ops, good logs.
• Prompt (prompts.mjs) — very thorough taxonomy + scoring rubric.

⸻

Do these first (impact ↑, effort ↓)
• Switch to GPT-5 via env + fallback
• Replace hardcoded "gpt-4o" with process.env.OPENAI_MODEL || "gpt-5", and keep "gpt-4o" as fallback in CI.
• Add an env for a cheap writer (OPENAI_WRITER_MODEL=gpt-5-mini) if you later split vision vs. copy.
• Demand strict JSON from the model (no regex salvage)
• Your parseAndValidateMultiImageResponse() is fighting free-form text. Ask the API for structured JSON and refuse anything else.
• In the request, set JSON mode (Responses API or Chat with response_format) and give a JSON Schema. Then parse safely with Ajv or Zod instead of regex trimming.
• Use real token accounting for cost
• You assume 80/20 input/output and fixed 4o prices. Use response.usage.prompt_tokens & completion_tokens, multiply by a model-price map (env-driven), and store per-run costs in DB. Don’t guess.
• Resize & dedupe images before sending
• You currently base64 full images. Add a pre-step:
• Downscale longest side to ~1280–1536px (sharp/jimp), strip EXIF, JPEG 80–85.
• Perceptual hash (pHash/blockhash) to drop near-duplicates (keep the sharpest).
• Huge, easy token savings with zero quality loss.
• Numeric hygiene for RU/EN OCR
• Tell the model explicitly: treat commas in numerals as decimal points and return canonical numbers (4,56 → 4.56).
• Require unit-tagged numbers (mm, ct, g) and “uncertain: true” when not confident (no guessing).
• Primary image selection = scored rubric + tie-breakers
• You already compute primary_suitability_score. Make it deterministic:
• Sub-scores: focus, glare, framing, full-gem visibility, neutral BG, color fidelity (0–10 each).
• If tie: prefer highest resolution, then front-on, then no hands/tools.
• Store sub-scores + rationale in DB for auditability.

⸻

Concrete code changes (where & what)
• ai-analysis/multi-image-processor.mjs
• Model/env

const MODEL = process.env.OPENAI_MODEL || "gpt-5"; // fallback to 'gpt-4o' in ops

    •	Responses API + JSON schema (stop free-text):

const schema = {/_ compact GemAnalysis schema (see below) _/};

const response = await openai.responses.create({
model: MODEL,
// If you stay on chat.completions: use response_format: { type: "json_schema", json_schema: { name, schema, strict: true } }
input: [
{ role: "system", content: "You are a precise gem analyzer. Output strict JSON only." },
{ role: "user", content: [
{ type: "text", text: PROMPT_TEXT },
...imageData.map(img => ({ type: "input_image", image_data: img.base64 }))
]}
],
response_format: { type: "json_schema", json_schema: { name: "GemAnalysis", schema, strict: true } },
temperature: 0.1,
// For GPT-5: optionally hint deeper reasoning for tough sets:
// reasoning: { effort: "medium" }
// seed: hash(gemstoneId) for determinism
});

    •	Parse strictly + validate

Replace the regex/brace trimming with a validator:

const parsed = JSON.parse(response.output[0].content[0].text); // Responses API shape; adjust if using chat
const valid = ajv.validate(schema, parsed); if (!valid) throw new Error(ajv.errorsText());

    •	Accurate cost

const { prompt_tokens = 0, completion_tokens = 0 } = response.usage || {};
const pricing = getPricingForModel(MODEL); // map from env/JSON
const cost = (prompt_tokens _ pricing.input_per_token) + (completion_tokens _ pricing.output_per_token);

    •	Image detail hint

If you stick to ChatVision inputs, set detail per image ("low" for near-duplicates, "high" for the 2–3 best angles) to curb cost.

    •	ai-analysis/image-utils.mjs
    •	Add downscale + JPEG recompress after download (sharp):

import sharp from "sharp";
// ...
const resized = await sharp(buffer).rotate().resize({ width: 1536, height: 1536, fit: "inside" }).jpeg({ quality: 82 }).toBuffer();
const base64 = resized.toString("base64");

    •	Add pHash and filter near-dupes (distance <= 6 keep one, choose higher resolution).

    •	ai-analysis/prompts.mjs
    •	Append numeric & language guardrails:
    •	“In numeric fields use dot decimals. If source uses commas, normalize. Include original_text alongside normalized numeric.”
    •	“Language hints: OCR ru (Cyrillic). Provide English translations under translation_en when you extract RU text.”
    •	“If a field is absent or illegible, return null and uncertain: true; never invent values.”
    •	Keep the rubric short; you can move long taxonomy to an external STYLE_GUIDE string to shrink tokens.
    •	ai-analysis/database-operations.mjs
    •	Save sub-scores + tie-break signals for primary image; add version field for analyzer (analyzer_version: "v3.2-gpt5").
    •	Consider a small table ai_runs (job id, model, seed, prompt hash, commit SHA) so you can reproduce any result.
    •	ai-gemstone-analyzer-v3.mjs
    •	Concurrency with p-limit (respect GPT-5 rate-limits, but don’t run sequentially):

import pLimit from "p-limit";
const limit = pLimit(Number(process.env.ANALYSIS_CONCURRENCY || 3));
await Promise.all(gemstones.map(g => limit(() => runGem(g))));

    •	Idempotency & caching
    •	Skip if latest ai_analysis_results for gem is fresh and images’ hash set unchanged.
    •	Add a --force flag to override.

⸻

Minimal JSON Schema (suggested)

Keep it compact to reduce tokens but preserve your structure:

{
"type": "object",
"required": ["consolidated", "images", "primary_image"],
"properties": {
"consolidated": {
"type": "object",
"required": ["weight_ct","dimensions_mm","shape","color","clarity","gauge_readings"],
"properties": {
"weight_ct": { "type": ["number","null"] },
"dimensions_mm": {
"type": "object",
"properties": { "length": {"type":["number","null"]},"width":{"type":["number","null"]},"depth":{"type":["number","null"]} }
},
"shape": { "type": ["string","null"] },
"color": { "type": ["string","null"] },
"clarity": { "type": ["string","null"] },
"labels_ru": { "type": "array", "items": { "type": "object", "properties": {
"text_ru": {"type":"string"}, "translation_en":{"type":"string"}
}}},
"gauge_readings": { "type": "array", "items": { "type":"object", "properties": {
"device": {"type":"string"}, "measurement": {"type":["number","null"]}, "unit":{"type":"string"}, "uncertain":{"type":"boolean"}
}}}
}
},
"images": {
"type":"array",
"items": { "type":"object", "properties": {
"index":{"type":"integer"},
"class":{"type":"string"},
"scores":{"type":"object","properties":{"focus":{"type":"number"},"glare":{"type":"number"},"framing":{"type":"number"},"color":{"type":"number"}}},
"notes":{"type":"string"}
}}
},
"primary_image": {
"type":"object",
"required":["index","score","reason"],
"properties": { "index":{"type":"integer"}, "score":{"type":"number"}, "reason":{"type":"string"} }
}
}
}

⸻

Optional but valuable
• Split models when needed (switchable)
• Keep a flag to run GPT-5 for vision → emit clean JSON, then GPT-5-mini for EN/RU prose. Saves a bit when you want longer copy.
• RU style guide for descriptions
• Short list of do/don’t (no “жемчужина” clichés; prefer cut/color clarity before romance; avoid over-promising) + 2–3 few-shot demos in RU & EN.
• Safety & networking
• rejectUnauthorized: false in image-utils.mjs is risky. Prefer a signed CDN URL and keep TLS checks on; only allow self-signed in a dev flag.

⸻

Quick wins you’ll see
• Fewer brittle parses (strict JSON) → fewer re-runs.
• Lower image token spend (downscale + dedupe + detail hint) → 20–50% less input tokens on average.
• Higher RU OCR accuracy (decimal & unit guardrails).
• Reproducible, explainable primary picks (sub-scores + tie-breakers).
• Predictable bills (true token accounting per model).

If you want, I can produce a patch for multi-image-processor.mjs, image-utils.mjs, and a compact schema file you can drop in — or wire a gpt-5 / gpt-5-mini switch with envs.
