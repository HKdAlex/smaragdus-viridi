#!/usr/bin/env node
/**
 * Alpha QA for gem-type source PNGs (OpenAI transparent generations).
 *
 * - transparentPct: pixels with alpha < 16 (should be large; outside gem).
 * - borderMeanAlpha: mean alpha in outer 8% frame (should be ~0 for real transparency).
 * - opaqueFillPct: pixels with alpha > 240 (subject + any junk).
 *
 *   node scripts/analyze-gem-type-source-png.mjs
 *   node scripts/analyze-gem-type-source-png.mjs --dir=public/gem-types/source-png
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function argDir() {
  const a = process.argv.find((x) => x.startsWith("--dir="));
  return a
    ? path.resolve(ROOT, a.slice("--dir=".length))
    : path.join(ROOT, "public/gem-types/source-png");
}

async function analyzeFile(filePath) {
  const meta = await sharp(filePath).metadata();
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const border = Math.max(8, Math.floor(Math.min(w, h) * 0.08));

  let transparent = 0;
  let opaque = 0;
  let borderSumA = 0;
  let borderN = 0;
  /** Suspect: high-alpha pixel in border ring with near-neutral RGB (fake gray backdrop / checker cell) */
  let borderOpaqueNeutral = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (a < 16) transparent++;
      if (a > 240) opaque++;

      const inBorder =
        x < border || x >= w - border || y < border || y >= h - border;
      if (inBorder) {
        borderSumA += a;
        borderN++;
        const maxc = Math.max(r, g, b);
        const minc = Math.min(r, g, b);
        const sat = maxc < 1 ? 0 : (maxc - minc) / maxc;
        if (a > 200 && sat < 0.12 && maxc < 240) {
          borderOpaqueNeutral++;
        }
      }
    }
  }

  const total = w * h;
  const transparentPct = (100 * transparent) / total;
  const opaqueFillPct = (100 * opaque) / total;
  const borderMeanAlpha = borderN ? borderSumA / borderN : 0;
  const borderJunkPct = borderN ? (100 * borderOpaqueNeutral) / borderN : 0;

  let status = "ok";
  if (borderMeanAlpha > 18) status = "warn:border_not_transparent";
  if (transparentPct < 35) status = "warn:low_transparency_area";
  if (borderJunkPct > 8) status = "warn:border_gray_opaque";

  return {
    name: path.basename(filePath, ".png"),
    w,
    h,
    bytes: fs.statSync(filePath).size,
    hasAlpha: meta.hasAlpha === true,
    transparentPct: Number(transparentPct.toFixed(2)),
    opaqueFillPct: Number(opaqueFillPct.toFixed(2)),
    borderMeanAlpha: Number(borderMeanAlpha.toFixed(2)),
    borderJunkPct: Number(borderJunkPct.toFixed(2)),
    status,
  };
}

async function main() {
  const dir = argDir();
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .sort()
    .map((f) => path.join(dir, f));

  if (files.length === 0) {
    console.error(`No PNG files in ${dir}`);
    process.exit(1);
  }

  const rows = [];
  for (const f of files) {
    rows.push(await analyzeFile(f));
  }

  console.table(
    rows.map((r) => ({
      file: r.name,
      WxH: `${r.w}×${r.h}`,
      alpha: r.hasAlpha ? "yes" : "NO",
      trans_pct: r.transparentPct,
      opaque_pct: r.opaqueFillPct,
      borderA: r.borderMeanAlpha,
      junk_pct: r.borderJunkPct,
      status: r.status,
    }))
  );

  const bad = rows.filter((r) => r.status !== "ok");
  if (bad.length) {
    console.log(
      `\n${bad.length} file(s) need review (checkerboard / gray backdrop often → high borderMeanAlpha or borderJunk%). Regenerate with tightened prompt or --only=file.`
    );
    process.exitCode = 2;
  } else {
    console.log("\nAll files passed basic alpha checks.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
