#!/usr/bin/env node
/**
 * Gem type filter thumbnails via OpenAI Images API (gpt-image-1.5 by default).
 * Uses API-native transparency: background=transparent + output_format=png (RGBA).
 *
 * Prompts explicitly forbid checkerboard / placeholder “transparency” patterns
 * (same approach as scripts/generate-cut-shape-icons-openai.mjs).
 *
 * Requires: OPENAI_API_KEY in .env.local or environment.
 *
 * Usage:
 *   node scripts/generate-gem-type-thumbnails-openai.mjs
 *   node scripts/generate-gem-type-thumbnails-openai.mjs --all
 *   node scripts/generate-gem-type-thumbnails-openai.mjs --only=ruby,diamond
 *   node scripts/generate-gem-type-thumbnails-openai.mjs --also-tiff
 *   node scripts/generate-gem-type-thumbnails-openai.mjs --webp
 *   node scripts/generate-gem-type-thumbnails-openai.mjs --dry-run
 *
 * Env:
 *   OPENAI_GEM_TYPE_MODEL   default: gpt-image-1.5
 *   OPENAI_GEM_TYPE_QUALITY default: high
 *   OPENAI_GEM_TYPE_SIZE    default: 1024x1024
 */
import dotenv from "dotenv";
import { mkdir } from "fs/promises";
import OpenAI from "openai";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

const PNG_DIR = path.join(ROOT, "public/gem-types/source-png");
const TIFF_DIR = path.join(ROOT, "public/gem-types/source-tiff");
const WEBP_DIR = path.join(ROOT, "public/gem-types");

const MODEL =
  process.env.OPENAI_GEM_TYPE_MODEL?.trim() || "gpt-image-1.5";
const QUALITY = process.env.OPENAI_GEM_TYPE_QUALITY?.trim() || "high";
const SIZE = process.env.OPENAI_GEM_TYPE_SIZE?.trim() || "1024x1024";

/**
 * Style lock: 3D illustrative gems, real alpha outside subject.
 * CRITICAL: repeat “no checkerboard” like the cut-shape script — models often hallucinate it.
 */
const STYLE_LOCK = `
GEM TYPE FILTER THUMBNAIL — SERIES STYLE LOCK (must match every image in this set exactly).

OUTPUT FORMAT: Square image, RGBA PNG semantics. Every pixel that is NOT part of the gemstone must be fully transparent (alpha channel = 0, completely invisible). This must be true transparency in the file — not a picture of transparency.

ABSOLUTELY FORBIDDEN BACKGROUNDS:
- Do NOT draw a checkerboard pattern, grid, gray-and-white squares, or any “transparency indicator” anywhere.
- Do NOT use a solid white, black, or gray studio backdrop.
- Do NOT fade to a color outside the gem; only full alpha-zero void.

SUBJECT: Exactly one loose gemstone (no ring, mounting, prongs, chain, hands, box, or scene). No text, watermark, or logo.

VISUAL STYLE: High-end jewelry e-commerce illustration — cohesive across the set. Soft studio lighting, gentle internal refraction, subtle specular highlights, clearly 3D. Same camera for every stone: three-quarter perspective from upper-right, slightly above horizon — you must see crown height and a hint of pavilion depth. Do NOT use a flat top-down “table” / blueprint / orthographic view. Same scale: the gem’s tight bounding box should occupy about 62–68% of the image width or height (whichever limits), centered with even transparent margin. Not a photograph, not a flat app icon, not emoji.

READABILITY: Add a very soft rim light / faint edge bloom so the silhouette reads on both white and near-black UI — but do not replace transparency with gray.

SHADOWS (critical): Do NOT paint any drop shadow, contact shadow, ground shadow, dark oval under the gem, or colored caustic / light pool on the canvas. All shading must live inside the gemstone volume only. The stone must appear to float in empty transparent space.

SUBJECT AND COLOR FOR THIS FILE ONLY:
`.trim();

const GEMS = [
  {
    file: "agate",
    subject:
      "Polished banded agate cabochon: translucent layers in warm grays, creams, and muted browns; subtle curved dome; characteristic banding visible.",
  },
  {
    file: "alexandrite",
    subject:
      "Faceted oval alexandrite: color-change teal-green and purple-violet hints across facets in one stone; crisp brilliant-style facets.",
  },
  {
    file: "amethyst",
    subject:
      "Faceted amethyst: rich purple with lighter lavender flashes; round or cushion brilliant.",
  },
  {
    file: "apatite",
    subject:
      "Faceted neon blue apatite: vivid electric blue, high saturation; brilliant or oval cut.",
  },
  {
    file: "aquamarine",
    subject:
      "Faceted aquamarine beryl: clear pale sea-blue, icy highlights; emerald or oval cut.",
  },
  {
    file: "citrine",
    subject:
      "Faceted citrine: warm golden-yellow quartz; brilliant or cushion cut.",
  },
  {
    file: "diamond",
    subject:
      "Round brilliant diamond: near-colorless with crisp spectral fire. MANDATORY camera: three-quarter oblique — the table facet must read as a tilted polygon (foreshortened), with visible crown and pavilion sides; do NOT render as a perfect circular disk as if looking straight down the culet.",
  },
  {
    file: "emerald",
    subject:
      "Step-cut emerald: saturated green with subtle internal veils (jardin) suggested, not muddy.",
  },
  {
    file: "garnet",
    subject:
      "Faceted garnet: deep red with wine undertones; cushion or round brilliant.",
  },
  {
    file: "morganite",
    subject:
      "Faceted morganite: soft peach-pink beryl; brilliant oval or cushion.",
  },
  {
    file: "paraiba",
    subject:
      "Faceted paraiba-type tourmaline: intense electric blue-green, Caribbean neon feel.",
  },
  {
    file: "peridot",
    subject:
      "Faceted peridot: lively yellow-green / olive lime; brilliant cut.",
  },
  {
    file: "quartz",
    subject:
      "Rock crystal quartz: one standard faceted brilliant round or oval — clear glassy stone with spectral glints, not a raw crystal cluster or asymmetric rough.",
  },
  {
    file: "ruby",
    subject:
      "Faceted ruby corundum: vivid pigeon-blood red; cushion or oval brilliant.",
  },
  {
    file: "sapphire",
    subject:
      "Faceted blue sapphire corundum: deep royal blue; oval brilliant.",
  },
  {
    file: "spinel",
    subject:
      "Faceted spinel: vivid magenta / hot pink (clearly NOT ruby crimson). Oval brilliant in three-quarter view — table foreshortened and tilted, visible pavilion depth; avoid flat top-down cushion that looks identical to ruby.",
  },
  {
    file: "tanzanite",
    subject:
      "Faceted tanzanite: blue-violet with subtle pleochroic violet flashes.",
  },
  {
    file: "topaz",
    subject:
      "Faceted imperial topaz: golden sherry to peach-orange tones; brilliant or emerald-style.",
  },
  {
    file: "tourmaline",
    subject:
      "Faceted green tourmaline: rich forest to mint green; brilliant oval.",
  },
  {
    file: "zircon",
    subject:
      "Faceted blue zircon (gem zircon): intense blue with strong dispersion / fire hints.",
  },
];

/** Pilot batch: color spread + hardest edge case (clear stone). */
const PILOT_FIVE = ["diamond", "ruby", "emerald", "sapphire", "quartz"];

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  const all = process.argv.includes("--all");
  const alsoTiff = process.argv.includes("--also-tiff");
  const alsoWebp = process.argv.includes("--webp");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg
    ? new Set(
        onlyArg
          .slice("--only=".length)
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      )
    : null;
  return { dryRun, all, only, alsoTiff, alsoWebp };
}

function selectGems({ all, only }) {
  if (only) {
    return GEMS.filter((g) => only.has(g.file));
  }
  if (all) {
    return [...GEMS];
  }
  return PILOT_FIVE.map((id) => GEMS.find((g) => g.file === id)).filter(Boolean);
}

async function generateOne(client, { file, subject }, { alsoTiff, alsoWebp }) {
  const prompt =
    `${STYLE_LOCK}\n${subject}\n\n` +
    `Final check: only the gemstone has opaque pixels; the rest of the canvas is alpha 0. ` +
    `No checkerboard, no grid, no backdrop color. Same camera angle and scale as every other thumbnail in this product series.`;

  const res = await client.images.generate({
    model: MODEL,
    prompt,
    size: SIZE,
    background: "transparent",
    output_format: "png",
    quality: QUALITY,
    n: 1,
  });

  const item = res.data?.[0];
  const b64 = item?.b64_json;
  if (!b64) {
    throw new Error(
      `No b64_json in response for ${file}: ${JSON.stringify(res).slice(0, 500)}`
    );
  }

  const input = Buffer.from(b64, "base64");
  await mkdir(PNG_DIR, { recursive: true });
  const pngPath = path.join(PNG_DIR, `${file}.png`);
  await sharp(input).png({ compressionLevel: 9 }).toFile(pngPath);

  if (alsoTiff) {
    await mkdir(TIFF_DIR, { recursive: true });
    const tifPath = path.join(TIFF_DIR, `${file}.tif`);
    await sharp(input)
      .tiff({ compression: "lzw", predictor: "horizontal" })
      .toFile(tifPath);
  }

  if (alsoWebp) {
    await mkdir(WEBP_DIR, { recursive: true });
    const webpPath = path.join(WEBP_DIR, `${file}.webp`);
    await sharp(input)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toFile(webpPath);
  }
}

async function main() {
  const { dryRun, all, only, alsoTiff, alsoWebp } = parseArgs();
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!dryRun && !apiKey) {
    console.error(
      "Missing OPENAI_API_KEY. Add it to .env.local or export it, then re-run.\n" +
        "Docs: https://platform.openai.com/docs/guides/image-generation"
    );
    process.exit(1);
  }

  const list = selectGems({ all, only });
  if (list.length === 0) {
    console.error("No gems match --only filter.");
    process.exit(1);
  }

  console.log(
    `Model: ${MODEL}, quality: ${QUALITY}, size: ${SIZE}\n` +
      `PNG → ${PNG_DIR} (${list.length} file(s))` +
      (alsoTiff ? `\nTIFF → ${TIFF_DIR}` : "") +
      (alsoWebp ? `\nWebP → ${WEBP_DIR}` : "")
  );

  if (dryRun) {
    for (const g of list) {
      console.log(`[dry-run] ${g.file}.png — ${g.subject.slice(0, 72)}…`);
    }
    return;
  }

  const client = new OpenAI({ apiKey });

  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    const outs = [
      "png",
      ...(alsoTiff ? ["tif"] : []),
      ...(alsoWebp ? ["webp"] : []),
    ].join("+");
    process.stdout.write(`[${i + 1}/${list.length}] ${g.file}.${outs} … `);
    try {
      await generateOne(client, g, { alsoTiff, alsoWebp });
      console.log("ok");
    } catch (e) {
      console.log("failed");
      console.error(e?.message || e);
      process.exitCode = 1;
      break;
    }
    if (i < list.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  if (!process.exitCode && list.length > 0) {
    console.log(
      "\nAnalyze alpha / margins:\n" +
        "  node scripts/analyze-gem-type-source-png.mjs\n" +
        "When satisfied, generate all with --all and optional --webp."
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
