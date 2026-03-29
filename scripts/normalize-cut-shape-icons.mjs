#!/usr/bin/env node
/**
 * Post-process AI cut diagrams → technically consistent flat diagram icons.
 *
 * - Trim transparent margins
 * - Fit longest side to TARGET_MAX_FRAC of canvas (centered)
 * - One global luminance threshold (Otsu on merged histogram of all icons) so
 *   stroke vs fill splits the same way for every cut
 * - Snap opaque pixels to exact STROKE / FILL (no stray mid-tones)
 * - If fill coverage is still tiny (wireframe source), flood-fill enclosed
 *   transparent regions inside the stroke bbox, then snap again
 * - Alpha-gradient edge detection (anti-alias → stroke)
 *
 * Reads:  public/images/cut-shapes/source-png/*.png
 * Writes: public/images/cut-shapes/normalized-png/*.png
 *         public/images/cut-shapes/*.webp (512×512, alpha)
 *
 *   node scripts/normalize-cut-shape-icons.mjs
 *   node scripts/normalize-cut-shape-icons.mjs --dir=public/images/cut-shapes/source-png
 */
import fs from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const CANVAS = 1024;
const WEBP_SIZE = 512;
/** Girdle bounding box longest side / canvas (matches style-lock prompt) */
const TARGET_MAX_FRAC = 0.58;
/** Baguette only: cap width/height after trim so the bar reads chunky in UI */
const BAGUETTE_MAX_W_OVER_H = 2.12;

const STROKE = { r: 95, g: 111, b: 130, a: 255 };
/** ~35% opacity vs transparent — reads on line-heavy and dense diagrams at 5rem UI */
const FILL = { r: 107, g: 124, b: 144, a: 90 };

const ALPHA_TRANSPARENT = 14;
const ALPHA_OTSU_MIN = 72; // ignore faint fringes for histogram

function argDir() {
  const a = process.argv.find((x) => x.startsWith("--dir="));
  return a
    ? path.resolve(ROOT, a.slice("--dir=".length))
    : path.join(ROOT, "public/images/cut-shapes/source-png");
}

function otsuThreshold(hist, total) {
  if (total < 50) return 135;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let maxBetween = -1;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > maxBetween) {
      maxBetween = between;
      threshold = t;
    }
  }
  return threshold;
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Accumulate luminance histogram for one RGBA buffer (for global Otsu).
 * @param {Buffer} rgba
 * @param {number} w
 * @param {number} h
 * @param {Uint32Array} hist
 * @returns {number} count of samples added
 */
function accumulateLuminanceHist(rgba, w, h, hist) {
  let n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = rgba[i + 3];
      if (a < ALPHA_OTSU_MIN) continue;
      const r = rgba[i],
        g = rgba[i + 1],
        b = rgba[i + 2];
      const L = Math.min(255, Math.max(0, Math.round(luminance(r, g, b))));
      hist[L]++;
      n++;
    }
  }
  return n;
}

/**
 * @param {Buffer} rgba - raw RGBA
 * @param {number} w
 * @param {number} h
 * @param {number} T - stroke vs fill luminance threshold (use same T for every icon)
 */
function flattenDiagram(rgba, w, h, T) {
  const out = Buffer.alloc(w * h * 4);
  const getA = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0;
    return rgba[(y * w + x) * 4 + 3];
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = rgba[i + 3];
      if (a < ALPHA_TRANSPARENT) continue;

      const r = rgba[i],
        g = rgba[i + 1],
        b = rgba[i + 2];
      const L = luminance(r, g, b);

      const gx = Math.abs(getA(x + 1, y) - getA(x - 1, y));
      const gy = Math.abs(getA(x, y + 1) - getA(x, y - 1));
      const gAlpha = gx + gy;

      // Anti-aliased silhouette boundary → stroke
      const edge = gAlpha > 38 || (a < 235 && gAlpha > 12);

      let isStroke = L <= T || edge;

      // Very bright interior (well above threshold) → fill even if mild edge noise
      if (L > T + 28 && a > 200 && gAlpha < 25) isStroke = false;

      const dst = isStroke ? STROKE : FILL;
      out[i] = dst.r;
      out[i + 1] = dst.g;
      out[i + 2] = dst.b;
      out[i + 3] = dst.a;
    }
  }

  // Thin stroke cleanup: 1px dilate stroke onto neighbors that were fill but touch stroke
  const copy = Buffer.from(out);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (copy[i + 3] === 0) continue;
      if (copy[i + 3] === STROKE.a && copy[i] === STROKE.r) continue;
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const j = ((y + dy) * w + (x + dx)) * 4;
          if (
            copy[j + 3] === STROKE.a &&
            copy[j] === STROKE.r &&
            copy[j + 1] === STROKE.g
          ) {
            touches = true;
            break;
          }
        }
      }
      if (!touches) continue;
      const Li = luminance(rgba[i], rgba[i + 1], rgba[i + 2]);
      if (Li < T + 35) {
        out[i] = STROKE.r;
        out[i + 1] = STROKE.g;
        out[i + 2] = STROKE.b;
        out[i + 3] = STROKE.a;
      }
    }
  }

  return out;
}

/**
 * Trim, scale to target frame, return raw RGBA + dimensions.
 * @param {string} srcPath
 * @param {string} base - filename without extension
 */
async function loadScaledRgba(srcPath, base) {
  const trimmed = await sharp(srcPath).trim().toBuffer({ resolveWithObject: true });
  let buf = trimmed.data;
  let meta = trimmed.info;

  if (
    base === "baguette" &&
    meta.width > meta.height * BAGUETTE_MAX_W_OVER_H
  ) {
    const targetH = Math.max(1, Math.round(meta.width / BAGUETTE_MAX_W_OVER_H));
    const stretched = await sharp(buf)
      .resize(meta.width, targetH, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    buf = stretched.data;
    meta = stretched.info;
  }

  const maxSide = Math.max(meta.width, meta.height);
  const targetSide = Math.round(CANVAS * TARGET_MAX_FRAC);
  const scale = targetSide / maxSide;
  const nw = Math.max(1, Math.round(meta.width * scale));
  const nh = Math.max(1, Math.round(meta.height * scale));

  const raw = await sharp(buf)
    .resize(nw, nh, { kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return raw;
}

/**
 * Snap near-stroke RGBA to exact STROKE / FILL so the set shares one look (no stray mid-tones).
 * @param {Buffer} rgba
 * @param {number} w
 * @param {number} h
 */
function snapToPalette(rgba, w, h) {
  const strokeL = luminance(STROKE.r, STROKE.g, STROKE.b);
  const fillL = luminance(FILL.r, FILL.g, FILL.b);
  const mid = (strokeL + fillL) / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (rgba[i + 3] < ALPHA_TRANSPARENT) continue;
      const L = luminance(rgba[i], rgba[i + 1], rgba[i + 2]);
      const dst = L <= mid ? STROKE : FILL;
      rgba[i] = dst.r;
      rgba[i + 1] = dst.g;
      rgba[i + 2] = dst.b;
      rgba[i + 3] = dst.a;
    }
  }
}

function isFillCell(rgba, i) {
  return (
    rgba[i + 3] >= ALPHA_TRANSPARENT &&
    rgba[i] === FILL.r &&
    rgba[i + 1] === FILL.g &&
    rgba[i + 2] === FILL.b
  );
}

/** Share of opaque pixels that are fill (not stroke). */
function fillRatioOfOpaque(rgba, w, h) {
  let opaque = 0;
  let fills = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (rgba[i + 3] < ALPHA_TRANSPARENT) continue;
      opaque++;
      if (isFillCell(rgba, i)) fills++;
    }
  }
  return opaque ? fills / opaque : 0;
}

/**
 * Rare AI wireframes: global Otsu leaves almost no fill. Lower T so fewer
 * luminance values count as stroke → more fill, matching the rest of the set.
 */
function flattenWithFillFloor(data, w, h, globalThreshold) {
  const MIN_FILL_RATIO = 0.06;
  const STEP = 14;
  const FLOOR_T = 92;
  let t = globalThreshold;
  let bestFlat = flattenDiagram(data, w, h, t);
  snapToPalette(bestFlat, w, h);
  let bestRatio = fillRatioOfOpaque(bestFlat, w, h);
  for (let k = 0; k < 8 && bestRatio < MIN_FILL_RATIO; k++) {
    t = Math.max(FLOOR_T, t - STEP);
    const next = flattenDiagram(data, w, h, t);
    snapToPalette(next, w, h);
    const r = fillRatioOfOpaque(next, w, h);
    if (r > bestRatio) {
      bestRatio = r;
      bestFlat = next;
    }
  }
  if (bestRatio < MIN_FILL_RATIO) {
    floodFillEnclosedTransparent(bestFlat, w, h);
    snapToPalette(bestFlat, w, h);
  }
  return bestFlat;
}

function isStrokeAt(flat, i) {
  return (
    flat[i + 3] >= ALPHA_TRANSPARENT &&
    flat[i] === STROKE.r &&
    flat[i + 1] === STROKE.g &&
    flat[i + 2] === STROKE.b &&
    flat[i + 3] === STROKE.a
  );
}

/**
 * Fill transparent pixels reachable from a seed inside the diagram's bbox,
 * blocked by stroke lines (fixes AI wireframes with no interior color).
 */
function floodFillEnclosedTransparent(flat, w, h) {
  let minX = w,
    maxX = -1,
    minY = h,
    maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (flat[i + 3] < ALPHA_TRANSPARENT) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX) return;

  const idx = (xx, yy) => (yy * w + xx) * 4;

  let seed = null;
  for (let y = minY; y <= maxY && !seed; y++) {
    for (let x = minX; x <= maxX && !seed; x++) {
      const i = idx(x, y);
      if (flat[i + 3] < ALPHA_TRANSPARENT) seed = { x, y };
    }
  }
  if (!seed) return;

  const q = [seed];
  const seen = new Uint8Array(w * h);
  const tryVisit = (x, y) => {
    if (x < minX || x > maxX || y < minY || y > maxY) return;
    const j = idx(x, y);
    if (isStrokeAt(flat, j)) return;
    if (isFillCell(flat, j)) return;
    const k = y * w + x;
    if (seen[k]) return;
    seen[k] = 1;
    q.push({ x, y });
  };
  tryVisit(seed.x, seed.y);

  while (q.length) {
    const { x, y } = q.pop();
    const i = idx(x, y);
    if (isStrokeAt(flat, i)) continue;
    if (isFillCell(flat, i)) continue;

    if (flat[i + 3] < ALPHA_TRANSPARENT) {
      flat[i] = FILL.r;
      flat[i + 1] = FILL.g;
      flat[i + 2] = FILL.b;
      flat[i + 3] = FILL.a;
    }

    tryVisit(x - 1, y);
    tryVisit(x + 1, y);
    tryVisit(x, y - 1);
    tryVisit(x, y + 1);
  }
}

async function processFileScaled(
  base,
  data,
  w,
  h,
  threshold,
  outPngDir,
  outWebpDir
) {
  const flat = flattenWithFillFloor(data, w, h, threshold);

  const left = Math.floor((CANVAS - w) / 2);
  const top = Math.floor((CANVAS - h) / 2);

  const canvas = await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: flat,
        raw: { width: w, height: h, channels: 4 },
        left,
        top,
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await mkdir(outPngDir, { recursive: true });
  await mkdir(outWebpDir, { recursive: true });

  const pngPath = path.join(outPngDir, `${base}.png`);
  await fs.promises.writeFile(pngPath, canvas);

  const webpPath = path.join(outWebpDir, `${base}.webp`);
  await sharp(canvas)
    .resize(WEBP_SIZE, WEBP_SIZE, { kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(webpPath);

  return { base, pngPath, webpPath };
}

async function main() {
  const srcDir = argDir();
  if (!fs.existsSync(srcDir)) {
    console.error("Missing source dir:", srcDir);
    process.exit(1);
  }
  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith(".png"))
    .sort();

  if (!files.length) {
    console.error("No PNG files in", srcDir);
    process.exit(1);
  }

  const outPngDir = path.join(ROOT, "public/images/cut-shapes/normalized-png");
  const outWebpDir = path.join(ROOT, "public/images/cut-shapes");

  console.log(
    `Normalize ${files.length} file(s): ${srcDir} → normalized-png + webp (${WEBP_SIZE}px)`
  );

  /** @type {{ base: string, data: Buffer, w: number, h: number }[]} */
  const scaled = [];
  for (const f of files) {
    const base = path.basename(f, ".png");
    const raw = await loadScaledRgba(path.join(srcDir, f), base);
    scaled.push({
      base,
      data: raw.data,
      w: raw.info.width,
      h: raw.info.height,
    });
  }

  const mergedHist = new Uint32Array(256);
  let mergedN = 0;
  for (const s of scaled) {
    mergedN += accumulateLuminanceHist(s.data, s.w, s.h, mergedHist);
  }
  let threshold = otsuThreshold(mergedHist, mergedN);
  threshold = Math.min(220, threshold + 4);
  console.log(`Global stroke/fill luminance threshold (batch Otsu): ${threshold}`);

  for (const s of scaled) {
    const r = await processFileScaled(
      s.base,
      s.data,
      s.w,
      s.h,
      threshold,
      outPngDir,
      outWebpDir
    );
    console.log("ok", r.base);
  }

  console.log("\nRun: npm run analyze-cut-shape-png -- --dir=public/images/cut-shapes/normalized-png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
