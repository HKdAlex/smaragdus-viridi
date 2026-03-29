#!/usr/bin/env node
/**
 * Consistency check for source PNGs (pre-WebP).
 *
 *   node scripts/analyze-cut-shape-source-png.mjs
 *   node scripts/analyze-cut-shape-source-png.mjs --dir=public/images/cut-shapes/source-png
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
    : path.join(ROOT, "public/images/cut-shapes/source-png");
}

async function metricsForFile(filePath) {
  const meta = await sharp(filePath).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const { data } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let n = 0;
  let sumY = 0;
  let sumY2 = 0;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 16) continue;
      n++;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sumY += lum;
      sumY2 += lum * lum;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const fillPct = w * h ? (100 * n) / (w * h) : 0;
  const meanY = n ? sumY / n : 0;
  const varY = n ? sumY2 / n - meanY * meanY : 0;
  const sigY = Math.sqrt(Math.max(0, varY));

  let bboxFrac = null;
  if (n && minX <= maxX) {
    const bw = (maxX - minX + 1) / w;
    const bh = (maxY - minY + 1) / h;
    bboxFrac = Math.max(bw, bh);
  }

  return {
    name: path.basename(filePath, ".png"),
    w: meta.width,
    h: meta.height,
    bytes: fs.statSync(filePath).size,
    fillPct,
    meanLum: meanY,
    lumStdev: sigY,
    bboxMaxDimFrac: bboxFrac,
  };
}

function stats(vals) {
  const n = vals.length;
  if (!n) return { mean: 0, stdev: 0, min: 0, max: 0 };
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const v =
    vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1);
  return {
    mean,
    stdev: Math.sqrt(v),
    min: Math.min(...vals),
    max: Math.max(...vals),
  };
}

async function main() {
  const dir = argDir();
  if (!fs.existsSync(dir)) {
    console.error("Directory not found:", dir);
    process.exit(1);
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .sort();
  if (!files.length) {
    console.error("No PNG files in", dir);
    process.exit(1);
  }

  const rows = [];
  for (const f of files) {
    rows.push(await metricsForFile(path.join(dir, f)));
  }

  console.log("File", dir);
  for (const r of rows) {
    console.log(
      `${r.name.padEnd(12)} ${String(r.w)}×${String(r.h)}  fill ${r.fillPct.toFixed(1).padStart(5)}%  lumμ ${r.meanLum.toFixed(1).padStart(6)}  lumσ ${r.lumStdev.toFixed(1).padStart(5)}  bbox/max ${r.bboxMaxDimFrac == null ? "n/a" : (r.bboxMaxDimFrac * 100).toFixed(1) + "%"}`
    );
  }

  const fills = rows.map((r) => r.fillPct);
  const lums = rows.map((r) => r.meanLum);
  const bboxes = rows.map((r) => r.bboxMaxDimFrac).filter((x) => x != null);
  const lumSigmas = rows.map((r) => r.lumStdev);

  console.log("\n--- Batch spread (lower = more consistent) ---");
  console.log("fill %     ", stats(fills));
  console.log("mean lum   ", stats(lums));
  console.log(
    "lum stdev  ",
    stats(lumSigmas),
    "(~0 for flat fills; >14 suggests gradients or many mid-tones)"
  );
  if (bboxes.length) {
    console.log(
      "bbox / max side",
      stats(bboxes),
      "(target ~56–65% if uniform padding)"
    );
  } else {
    console.log("bbox / max side: n/a");
  }

  const warn = [];
  if (stats(fills).stdev > 12)
    warn.push("fill % varies a lot → scale/padding drift");
  if (stats(lums).stdev > 15)
    warn.push("mean luminance varies → palette or density drift");
  if (lumSigmas.some((s) => s > 14))
    warn.push(
      "some files have high internal lum variance → likely gradients or off-palette rendering"
    );
  if (new Set(rows.map((r) => `${r.w}×${r.h}`)).size > 1)
    warn.push("mixed dimensions");

  if (warn.length) {
    console.log("\n⚠ Consistency warnings:");
    warn.forEach((w) => console.log("  -", w));
  } else {
    console.log("\n✓ No automatic red flags (still review pixels by eye).");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
