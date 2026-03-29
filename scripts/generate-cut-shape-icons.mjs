#!/usr/bin/env node
/**
 * Generates 512×512 WebP cut/shape diagram icons (transparent, consistent stroke/fill).
 * Run: node scripts/generate-cut-shape-icons.mjs
 */
import { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/images/cut-shapes");

const W = 512;
const CX = 256;
const CY = 256;

/** Cool gray diagram palette — readable on light + dark UI */
const STROKE = "#6B7C90";
const FILL = "rgba(107, 124, 144, 0.26)";
const SW = 5.5;

const wrap = (inner) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}">
  <g fill="${FILL}" stroke="${STROKE}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round">
${inner}
  </g>
</svg>`;

function polar(cx, cy, r, deg) {
  const t = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
}

function regularPolygon(cx, cy, r, n, rotDeg = -90) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rotDeg + (360 / n) * i;
    pts.push(polar(cx, cy, r, a));
  }
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

function poly(points) {
  return `<polygon points="${points}" />`;
}

function svgPath(d) {
  return `<path fill="${FILL}" d="${d}" />`;
}

function line(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" fill="none" />`;
}

function circle(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
}

function ellipse(cx, cy, rx, ry) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" />`;
}

/** Brilliant-style radial + girdle segments (8-fold) */
function brilliantFacets(cx, cy, rGirdle, rTable) {
  let s = "";
  for (let i = 0; i < 8; i++) {
    const a0 = -90 + i * 45;
    const [x0, y0] = polar(cx, cy, rGirdle, a0);
    const [xm, ym] = polar(cx, cy, (rGirdle + rTable) / 2, a0 + 22.5);
    const [xt, yt] = polar(cx, cy, rTable, a0 + 22.5);
    s += line(cx, cy, x0, y0);
    s += line(x0, y0, xm, ym);
    s += line(xm, ym, xt, yt);
  }
  s += poly(regularPolygon(cx, cy, rTable, 8, -90 + 22.5));
  return s;
}

/** Emerald / step-cut: concentric rect frames */
function emeraldSteps(cx, cy, halfW, halfH, steps = 4) {
  let s = "";
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1 || 1);
    const hw = halfW * (1 - t * 0.55);
    const hh = halfH * (1 - t * 0.55);
    s += `<rect x="${cx - hw}" y="${cy - hh}" width="${2 * hw}" height="${2 * hh}" fill="none" />`;
  }
  return s;
}

const shapes = {};

shapes.round = () =>
  wrap(
    circle(CX, CY, 178) +
      brilliantFacets(CX, CY, 178, 72) +
      circle(CX, CY, 72)
  );

shapes.oval = () => {
  const rx = 118,
    ry = 178;
  let inner = ellipse(CX, CY, rx, ry);
  for (let i = 0; i < 8; i++) {
    const a = -90 + i * 45;
    const [x, y] = polar(CX, CY, 1, a);
    inner += line(CX + x * 35, CY + y * 52, CX + x * rx, CY + y * ry);
  }
  inner += ellipse(CX, CY, rx * 0.38, ry * 0.38);
  inner += line(CX, CY - ry, CX, CY + ry);
  inner += line(CX - rx, CY, CX + rx, CY);
  return wrap(inner);
};

shapes.marquise = () => {
  const d =
    `M ${CX} ${CY - 172}` +
    `C ${CX + 195} ${CY - 40}, ${CX + 195} ${CY + 40}, ${CX} ${CY + 172}` +
    `C ${CX - 195} ${CY + 40}, ${CX - 195} ${CY - 40}, ${CX} ${CY - 172} Z`;
  let inner = svgPath(d);
  for (let i = -4; i <= 4; i++) {
    const t = i * 0.22;
    const y = CY + t * 140;
    const w = 40 + Math.abs(t) * 95;
    inner += line(CX - w, y, CX + w, y);
  }
  inner += line(CX, CY - 172, CX, CY + 172);
  inner += line(CX - 120, CY, CX + 120, CY);
  return wrap(inner);
};

shapes.pear = () => {
  const d =
    `M ${CX} ${CY - 175}` +
    `C ${CX + 125} ${CY - 95}, ${CX + 168} ${CY + 20}, ${CX + 145} ${CY + 115}` +
    `C ${CX + 95} ${CY + 210}, ${CX + 45} ${CY + 248}, ${CX} ${CY + 255}` +
    `C ${CX - 45} ${CY + 248}, ${CX - 95} ${CY + 210}, ${CX - 145} ${CY + 115}` +
    `C ${CX - 168} ${CY + 20}, ${CX - 125} ${CY - 95}, ${CX} ${CY - 175} Z`;
  let inner = svgPath(d);
  inner += line(CX, CY - 175, CX, CY + 200);
  inner += line(CX - 130, CY - 40, CX + 130, CY - 40);
  inner += line(CX - 155, CY + 60, CX + 155, CY + 60);
  inner += line(CX - 100, CY + 140, CX + 100, CY + 140);
  return wrap(inner);
};

shapes.heart = () => {
  const d =
    `M ${CX} ${CY + 155}` +
    `C ${CX - 118} ${CY + 55}, ${CX - 152} ${CY - 35}, ${CX - 88} ${CY - 92}` +
    `C ${CX - 48} ${CY - 128}, ${CX} ${CY - 105}, ${CX} ${CY - 75}` +
    `C ${CX} ${CY - 105}, ${CX + 48} ${CY - 128}, ${CX + 88} ${CY - 92}` +
    `C ${CX + 152} ${CY - 35}, ${CX + 118} ${CY + 55}, ${CX} ${CY + 155} Z`;
  let inner = svgPath(d);
  inner += line(CX, CY - 75, CX, CY + 120);
  inner += line(CX - 95, CY - 35, CX + 95, CY - 35);
  inner += line(CX - 115, CY + 35, CX + 115, CY + 35);
  inner += line(CX - 70, CY + 95, CX + 70, CY + 95);
  return wrap(inner);
};

shapes.emerald = () => {
  const hw = 150,
    hh = 105,
    c = 52;
  const d = `M ${CX - hw + c} ${CY - hh} L ${CX + hw - c} ${CY - hh} L ${CX + hw} ${CY - hh + c} L ${CX + hw} ${CY + hh - c} L ${CX + hw - c} ${CY + hh} L ${CX - hw + c} ${CY + hh} L ${CX - hw} ${CY + hh - c} L ${CX - hw} ${CY - hh + c} Z`;
  let inner = svgPath(d);
  inner += emeraldSteps(CX, CY, hw - 18, hh - 18, 4);
  inner += line(CX, CY - hh, CX, CY + hh);
  inner += line(CX - hw, CY, CX + hw, CY);
  return wrap(inner);
};

shapes.princess = () => {
  const h = 165;
  let inner = `<rect x="${CX - h}" y="${CY - h}" width="${2 * h}" height="${2 * h}" rx="8" ry="8" />`;
  inner += line(CX - h, CY - h, CX + h, CY + h);
  inner += line(CX + h, CY - h, CX - h, CY + h);
  inner += line(CX, CY - h, CX, CY + h);
  inner += line(CX - h, CY, CX + h, CY);
  inner += `<rect x="${CX - h * 0.55}" y="${CY - h * 0.55}" width="${h * 1.1}" height="${h * 1.1}" fill="none" transform="rotate(45 ${CX} ${CY})" />`;
  return wrap(inner);
};

shapes.cushion = () => {
  const w = 168,
    r = 48;
  const d = `M ${CX - w + r} ${CY - w} L ${CX + w - r} ${CY - w} Q ${CX + w} ${CY - w} ${CX + w} ${CY - w + r} L ${CX + w} ${CY + w - r} Q ${CX + w} ${CY + w} ${CX + w - r} ${CY + w} L ${CX - w + r} ${CY + w} Q ${CX - w} ${CY + w} ${CX - w} ${CY + w - r} L ${CX - w} ${CY - w + r} Q ${CX - w} ${CY - w} ${CX - w + r} ${CY - w} Z`;
  let inner = svgPath(d);
  inner += line(CX, CY - w, CX, CY + w);
  inner += line(CX - w, CY, CX + w, CY);
  inner += line(CX - w, CY - w, CX + w, CY + w);
  inner += line(CX + w, CY - w, CX - w, CY + w);
  inner += `<rect x="${CX - w * 0.5}" y="${CY - w * 0.5}" width="${w}" height="${w}" rx="22" ry="22" fill="none" />`;
  return wrap(inner);
};

shapes.radiant = () => {
  const hw = 155,
    hh = 118,
    c = 40;
  const d = `M ${CX - hw + c} ${CY - hh} L ${CX + hw - c} ${CY - hh} L ${CX + hw} ${CY - hh + c} L ${CX + hw} ${CY + hh - c} L ${CX + hw - c} ${CY + hh} L ${CX - hw + c} ${CY + hh} L ${CX - hw} ${CY + hh - c} L ${CX - hw} ${CY - hh + c} Z`;
  let inner = svgPath(d);
  inner += line(CX, CY - hh, CX, CY + hh);
  inner += line(CX - hw, CY, CX + hw, CY);
  inner += line(CX - hw + c, CY - hh, CX + hw - c, CY + hh);
  inner += line(CX + hw - c, CY - hh, CX - hw + c, CY + hh);
  inner += `<rect x="${CX - hw * 0.55}" y="${CY - hh * 0.55}" width="${hw * 1.1}" height="${hh * 1.1}" fill="none" />`;
  inner += `<rect x="${CX - hw * 0.28}" y="${CY - hh * 0.28}" width="${hw * 0.56}" height="${hh * 0.56}" fill="none" />`;
  return wrap(inner);
};

shapes.asscher = () => {
  const h = 158,
    c = 58;
  const d = `M ${CX - h + c} ${CY - h} L ${CX + h - c} ${CY - h} L ${CX + h} ${CY - h + c} L ${CX + h} ${CY + h - c} L ${CX + h - c} ${CY + h} L ${CX - h + c} ${CY + h} L ${CX - h} ${CY + h - c} L ${CX - h} ${CY - h + c} Z`;
  let inner = svgPath(d);
  inner += line(CX - h, CY - h, CX + h, CY + h);
  inner += line(CX + h, CY - h, CX - h, CY + h);
  inner += `<polygon points="${regularPolygon(CX, CY, h * 0.65, 8)}" fill="none" />`;
  inner += `<polygon points="${regularPolygon(CX, CY, h * 0.32, 8, -90 + 22.5)}" fill="none" />`;
  return wrap(inner);
};

shapes.baguette = () => {
  const hw = 195,
    hh = 58;
  let inner = `<rect x="${CX - hw}" y="${CY - hh}" width="${2 * hw}" height="${2 * hh}" rx="6" ry="6" />`;
  for (let i = -3; i <= 3; i++) {
    const x = CX + i * 52;
    inner += line(x, CY - hh, x, CY + hh);
  }
  inner += line(CX - hw, CY, CX + hw, CY);
  return wrap(inner);
};

shapes.triangle = () => {
  const r = 185;
  const pts = regularPolygon(CX, CY, r, 3, -90);
  let inner = poly(pts);
  for (let i = 0; i < 3; i++) {
    const a = -90 + i * 120;
    const [x, y] = polar(CX, CY, r, a);
    inner += line(CX, CY, x, y);
  }
  inner += line(CX - r * 0.866, CY + r * 0.5, CX + r * 0.866, CY + r * 0.5);
  return wrap(inner);
};

shapes.trapezoid = () => {
  const tw = 95,
    bw = 165,
    h = 155;
  const pts = `${CX - tw},${CY - h} ${CX + tw},${CY - h} ${CX + bw},${CY + h} ${CX - bw},${CY + h}`;
  let inner = poly(pts);
  inner += line(CX, CY - h, CX, CY + h);
  inner += line(CX - tw, CY - h, CX - bw, CY + h);
  inner += line(CX + tw, CY - h, CX + bw, CY + h);
  inner += line(CX - (tw + bw) / 2, CY, CX + (tw + bw) / 2, CY);
  return wrap(inner);
};

shapes.rhombus = () => {
  const h = 175;
  const pts = `${CX},${CY - h} ${CX + h * 0.92},${CY} ${CX},${CY + h} ${CX - h * 0.92},${CY}`;
  let inner = poly(pts);
  inner += line(CX, CY - h, CX, CY + h);
  inner += line(CX - h * 0.92, CY, CX + h * 0.92, CY);
  inner += line(CX, CY, CX + h * 0.92, CY);
  inner += line(CX, CY, CX, CY + h);
  inner += line(CX, CY, CX - h * 0.92, CY);
  inner += line(CX, CY, CX, CY - h);
  return wrap(inner);
};

shapes.pentagon = () => {
  const pts = regularPolygon(CX, CY, 172, 5, -90);
  let inner = poly(pts);
  for (let i = 0; i < 5; i++) {
    const a = -90 + i * 72;
    const [x, y] = polar(CX, CY, 172, a);
    inner += line(CX, CY, x, y);
  }
  inner += poly(regularPolygon(CX, CY, 88, 5, -90));
  return wrap(inner);
};

shapes.hexagon = () => {
  const pts = regularPolygon(CX, CY, 172, 6, -90);
  let inner = poly(pts);
  for (let i = 0; i < 6; i++) {
    const a = -90 + i * 60;
    const [x, y] = polar(CX, CY, 172, a);
    inner += line(CX, CY, x, y);
  }
  inner += poly(regularPolygon(CX, CY, 95, 6, -90));
  return wrap(inner);
};

shapes.cabochon = () => {
  const r = 168;
  let inner = circle(CX, CY, r);
  inner += `<g fill="none" stroke="${STROKE}" stroke-width="${SW * 0.85}" stroke-opacity="0.82" stroke-dasharray="14 10">`;
  inner += `<ellipse cx="${CX}" cy="${CY + 28}" rx="${r * 0.72}" ry="${r * 0.38}" />`;
  inner += `</g>`;
  inner += `<g fill="none" stroke="${STROKE}" stroke-width="${SW * 0.75}" stroke-opacity="0.78" stroke-dasharray="12 8">`;
  inner += `<path d="M ${CX - r * 0.65} ${CY - 35} Q ${CX} ${CY - 118} ${CX + r * 0.65} ${CY - 35}" />`;
  inner += `</g>`;
  inner += line(CX, CY - r, CX, CY);
  inner += line(CX - r, CY, CX + r, CY);
  inner += circle(CX, CY, r * 0.42);
  return wrap(inner);
};

shapes.fantasy = () => {
  const d =
    `M ${CX - 40} ${CY - 165}` +
    `L ${CX + 95} ${CY - 130} L ${CX + 168} ${CY - 25} L ${CX + 142} ${CY + 55}` +
    `L ${CX + 175} ${CY + 145} L ${CX + 35} ${CY + 178} L ${CX - 125} ${CY + 152}` +
    `L ${CX - 178} ${CY + 40} L ${CX - 155} ${CY - 55} L ${CX - 120} ${CY - 125} Z`;
  let inner = svgPath(d);
  inner += line(CX - 40, CY - 165, CX + 35, CY + 178);
  inner += line(CX + 95, CY - 130, CX - 125, CY + 152);
  inner += line(CX + 168, CY - 25, CX - 178, CY + 40);
  inner += line(CX + 142, CY + 55, CX - 155, CY - 55);
  inner += line(CX - 120, CY - 125, CX + 175, CY + 145);
  inner += poly(`${CX - 20},${CY - 40} ${CX + 110},${CY + 10} ${CX + 20},${CY + 95} ${CX - 90},${CY + 25}`);
  return wrap(inner);
};

/** Designer / proprietary cut — asymmetric modern facet layout */
shapes.code = () => {
  const d =
    `M ${CX - 95} ${CY - 155}` +
    `L ${CX + 135} ${CY - 128} L ${CX + 172} ${CY + 22} L ${CX + 88} ${CY + 165}` +
    `L ${CX - 152} ${CY + 142} L ${CX - 175} ${CY - 18} Z`;
  let inner = svgPath(d);
  inner += line(CX - 30, CY - 140, CX + 120, CY + 80);
  inner += line(CX + 150, CY - 60, CX - 130, CY + 100);
  inner += line(CX - 95, CY - 155, CX + 88, CY + 165);
  inner += line(CX + 135, CY - 128, CX - 152, CY + 142);
  inner += poly(`${CX + 15},${CY - 55} ${CX + 105},${CY + 15} ${CX + 25},${CY + 88} ${CX - 75},${CY + 35} ${CX - 35},${CY - 25}`);
  inner += line(CX + 15, CY - 55, CX + 25, CY + 88);
  inner += line(CX + 105, CY + 15, CX - 75, CY + 35);
  return wrap(inner);
};

const ORDER = [
  "asscher",
  "baguette",
  "cabochon",
  "code",
  "cushion",
  "emerald",
  "fantasy",
  "heart",
  "hexagon",
  "marquise",
  "oval",
  "pear",
  "pentagon",
  "princess",
  "radiant",
  "rhombus",
  "round",
  "trapezoid",
  "triangle",
];

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const name of ORDER) {
    const gen = shapes[name];
    if (!gen) {
      console.error("Missing shape:", name);
      process.exit(1);
    }
    const svg = gen();
    const fp = path.join(OUT, `${name}.webp`);
    await sharp(Buffer.from(svg))
      .resize(W, W)
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toFile(fp);
    console.log("Wrote", path.relative(process.cwd(), fp));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
