#!/usr/bin/env node
/**
 * Generates cut/shape diagram assets via OpenAI Images (gpt-image-1.5 by default).
 *
 * Phase 1 (this script): write lossless PNG under public/images/cut-shapes/source-png/
 * Optional: mirror as TIFF for archival (--also-tiff)
 * Phase 2: node scripts/normalize-cut-shape-icons.mjs  (flat palette + 58% frame + 512 webp)
 * Phase 3: npm run analyze-cut-shape-png -- --dir=public/images/cut-shapes/normalized-png
 *
 * Requires: OPENAI_API_KEY (e.g. in .env.local)
 *
 * Usage:
 *   node scripts/generate-cut-shape-icons-openai.mjs              # default: 5 canonical samples
 *   node scripts/generate-cut-shape-icons-openai.mjs --all        # all 19
 *   node scripts/generate-cut-shape-icons-openai.mjs --only=round,oval
 *   node scripts/generate-cut-shape-icons-openai.mjs --also-tiff
 *   node scripts/generate-cut-shape-icons-openai.mjs --webp       # 512x512 WebP
 *   node scripts/generate-cut-shape-icons-openai.mjs --dry-run
 *
 * Optional env:
 *   OPENAI_CUT_ICON_MODEL   default: gpt-image-1.5
 *   OPENAI_CUT_ICON_QUALITY default: high
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

const PNG_DIR = path.join(ROOT, "public/images/cut-shapes/source-png");
const TIFF_DIR = path.join(ROOT, "public/images/cut-shapes/source-tiff");
const WEBP_DIR = path.join(ROOT, "public/images/cut-shapes");

const MODEL =
  process.env.OPENAI_CUT_ICON_MODEL?.trim() || "gpt-image-1.5";
const QUALITY = process.env.OPENAI_CUT_ICON_QUALITY?.trim() || "high";

/**
 * Style lock v3 for gpt-image-1.5.
 * Plain-language color descriptions (model ignores hex codes).
 * Stronger anti-shading anchoring. Tighter centering/bbox.
 */
const STYLE_LOCK = [
  "STYLE LOCK. Apply identically to every icon in this set. Follow literally; do not interpret creatively.",
  "",
  "CANVAS: Square RGBA image. Everything outside the diagram MUST be fully transparent (alpha 0). No background of any kind: no white, no gray, no checkerboard, no grid, no drop-shadow on the canvas.",
  "",
  "WHAT TO DRAW: A flat 2D technical plan-view facet diagram, the kind shown on a jeweler's cut chart or GIA grading report. The viewer looks straight down through the table facet (orthographic top-down). This is NOT 3D, NOT perspective, NOT isometric, NOT photoreal. There are NO shadows, NO reflections, NO sparkle, NO bloom, NO gradients anywhere in the image.",
  "",
  "STROKE (same on every icon):",
  "- A single medium-light slate-blue color for ALL lines, both girdle outline and internal facet lines. The blue-gray should be clearly lighter than navy and clearly darker than sky-blue; roughly the midpoint between steel-gray and periwinkle, a muted blue-gray at about 55% lightness. NEVER use dark navy, black, or pure gray.",
  "- Uniform line weight everywhere: girdle outline is the same thickness as internal facet lines, roughly 2% of image width.",
  "",
  "FILL (same on every icon; this is the most critical rule):",
  "- Every closed polygon (facet chamber) inside the girdle must be filled with EXACTLY THE SAME very light, semi-transparent blue-gray tint, roughly 20-25% opacity of the stroke color. The fill should be barely-there, like a faint wash.",
  "- CRITICAL: Every single facet must have IDENTICAL brightness and color. There must be ZERO difference in shade, tint, or lightness between any two facets. If you sampled any pixel from any filled facet, it would be indistinguishable from a pixel in any other facet. Think of it as one single flat color applied uniformly to all polygons, like an SVG with one fill rule.",
  "- DO NOT create a 3D illusion by making some facets lighter and others darker.",
  "- DO NOT add any gradient, highlight, or shadow within or between facets.",
  "- DO NOT leave any facet unfilled (no wireframe-only areas).",
  "- SIMPLIFY facet line density: each closed facet region must be LARGE enough that the translucent fill reads clearly at small icon size. Avoid hairline spiderwebs of many tiny facets; prefer fewer, broader chambers (still recognizable for that cut).",
  "",
  "CENTERING: The diagram must be perfectly centered horizontally AND vertically on the canvas. The girdle bounding box should occupy about 58% of the canvas width and height. For elongated shapes (marquise), fit the long axis to about 58% of canvas width while preserving aspect ratio. For baguette specifically: use a moderately elongated rectangle only — about 2:1 width-to-height (landscape), not a skinny needle; the short edge must be clearly thick enough to read in a small UI tile.",
  "",
  "FORBIDDEN: text, labels, letters, logos, saturated colors (no reds, greens, yellows), decorative marks, shadows, 3D effects of any kind.",
  "",
  "SUBJECT (specific cut geometry):",
].join("\n");

const SHAPES = [
  {
    file: "asscher",
    subject:
      "Asscher cut: square octagonal girdle (square with clipped corners). SIMPLIFIED step-cut with 2 wide concentric step rings only. Every enclosed area between the strokes must show the SAME translucent blue-gray fill — no empty wireframe, no white interiors. Perfectly symmetric.",
  },
  {
    file: "baguette",
    subject:
      "Baguette step cut: horizontal rectangle girdle. STRICT PROPORTION: width must be only about 1.9–2.1× the height (nearly square-ish bar, not a needle). The short vertical side must look thick and bold. Outer rect + inner table + few step lines. CRITICAL: every enclosed region FILLED with the same translucent blue-gray — not wireframe-only.",
  },
  {
    file: "cabochon",
    subject:
      "Cabochon: circular girdle from above; one smooth dome arc inside creating TWO large visible regions (cap and base). Both regions must show the same flat translucent fill clearly. No extra facet lines.",
  },
  {
    file: "code",
    subject:
      "Designer / proprietary cut: an unusual asymmetric polygon girdle with an unconventional, off-center facet layout. NOT a standard shape. Must be a flat plan-view diagram (map of facets from above), NOT 3D, NOT a shield or logo, no letters. Freeform but geometric.",
  },
  {
    file: "cushion",
    subject:
      "Cushion cut: a rounded square (pillow shape) girdle. Inside: brilliant-style facet pattern with triangular and kite-shaped facets radiating from center. All facets filled with the same flat tint, no variation.",
  },
  {
    file: "emerald",
    subject:
      "Emerald cut: rectangular octagonal girdle (rectangle with clipped corners). Inside: concentric rectangular stepped facets (step-cut pattern). All facets same flat tint.",
  },
  {
    file: "fantasy",
    subject:
      "Fantasy cut: an irregular freeform girdle outline (not any standard shape). Chaotic asymmetric facet layout inside. NOT a marquise, NOT a heart, NOT a standard round or oval. Something artistic and unique. Plan view diagram only.",
  },
  {
    file: "heart",
    subject:
      "Heart-shaped brilliant: heart outline with cleft at top and point at bottom. Inside: brilliant-style triangular facets. All facets same flat tint.",
  },
  {
    file: "hexagon",
    subject:
      "Hexagonal cut: regular hexagon girdle. Inside: facets radiating from center toward the six corners and edges. All facets same flat tint.",
  },
  {
    file: "marquise",
    subject:
      "Marquise (navette): elongated boat silhouette with two pointed ends. SIMPLIFIED brilliant diagram: fewer facet lines so kite and triangle chambers stay LARGE and readable; symmetric along the long axis. Same flat tint in every chamber.",
  },
  {
    file: "oval",
    subject:
      "Oval brilliant: elliptical girdle. Inside: oval brilliant facet pattern with triangular/kite facets radiating from center. All facets same flat tint.",
  },
  {
    file: "pear",
    subject:
      "Pear brilliant: teardrop shape, rounded end at top and pointed end at bottom. Inside: brilliant-style facets. All facets same flat tint.",
  },
  {
    file: "pentagon",
    subject:
      "Pentagonal cut: regular pentagon girdle. Inside: facets radiating from center toward the five corners. All facets same flat tint.",
  },
  {
    file: "princess",
    subject:
      "Princess cut: perfectly square girdle with sharp 90-degree corners. Inside: brilliant-style facet pattern with strong X-shaped diagonals and chevron facets. All facets same flat tint.",
  },
  {
    file: "radiant",
    subject:
      "Radiant cut: rectangular octagonal girdle (rectangle with trimmed corners), slightly elongated. Inside: brilliant-style facets (not step-cut). All facets same flat tint.",
  },
  {
    file: "rhombus",
    subject:
      "Rhombus cut: diamond/kite-shaped girdle (rotated square). Inside: facet lines radiating from center. All facets same flat tint.",
  },
  {
    file: "round",
    subject:
      "Round brilliant: perfectly circular girdle. SIMPLIFIED crown diagram from above: one octagonal table, one ring of broad kite/star facets, one ring touching the girdle — avoid dense spiderwebs; each facet region must be broad so the translucent fill reads. Same flat tint in every chamber.",
  },
  {
    file: "trapezoid",
    subject:
      "Trapezoid cut: isosceles trapezoid girdle (wider at top, narrower at bottom). Inside: step-cut facet pattern. All facets same flat tint.",
  },
  {
    file: "triangle",
    subject:
      "Triangular brilliant (trillion): equilateral triangle girdle. Inside: brilliant-style facets radiating from center to corners. All facets same flat tint.",
  },
];

/** Pilot batch: distinct silhouettes for consistency testing */
const DEFAULT_FIVE = ["round", "emerald", "heart", "marquise", "cushion"];

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

function selectShapes({ all, only }) {
  if (only) {
    return SHAPES.filter((s) => only.has(s.file));
  }
  if (all) {
    return [...SHAPES];
  }
  return DEFAULT_FIVE.map((id) => SHAPES.find((s) => s.file === id)).filter(
    Boolean
  );
}

const FINAL_REMINDER =
  "Reminder: all lines are the same medium slate-blue gray; " +
  "every facet chamber has identical flat semi-transparent fill with zero brightness variation between facets; " +
  "strict flat top-down view; transparent canvas outside the girdle.";

async function generateOne(client, { file, subject }, { alsoTiff, alsoWebp }) {
  const prompt = `${STYLE_LOCK}\n${subject}\n\n${FINAL_REMINDER}`;

  const res = await client.images.generate({
    model: MODEL,
    prompt,
    size: "1024x1024",
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

  const list = selectShapes({ all, only });
  if (list.length === 0) {
    console.error("No shapes match --only filter.");
    process.exit(1);
  }

  console.log(
    `Model: ${MODEL}, quality: ${QUALITY}, PNG dir: ${PNG_DIR} (${list.length} file(s))` +
      (alsoTiff ? `, TIFF dir: ${TIFF_DIR}` : "") +
      (alsoWebp ? `, WebP dir: ${WEBP_DIR}` : "")
  );

  if (dryRun) {
    for (const s of list) {
      console.log(`[dry-run] ${s.file}.png`);
      console.log(`  subject: ${s.subject.slice(0, 80)}...`);
    }
    return;
  }

  const client = new OpenAI({ apiKey });

  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    const outs = [
      "png",
      ...(alsoTiff ? ["tif"] : []),
      ...(alsoWebp ? ["webp"] : []),
    ].join("+");
    process.stdout.write(`[${i + 1}/${list.length}] ${s.file}.${outs} ... `);
    try {
      await generateOne(client, s, { alsoTiff, alsoWebp });
      console.log("ok");
    } catch (e) {
      console.log("failed");
      console.error(e?.message || e);
      process.exitCode = 1;
      break;
    }
    if (i < list.length - 1) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  if (!process.exitCode && list.length > 0) {
    console.log(
      "\nQA: node scripts/analyze-cut-shape-source-png.mjs --dir=public/images/cut-shapes/source-png"
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
