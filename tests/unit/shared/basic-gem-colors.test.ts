import { describe, expect, it } from "vitest";

import {
    BASIC_GEM_COLORS,
    categorizeGemColor,
    expandColorFilterValues,
    normalizeGemColor,
    parseColorFilterTokens,
    sanitizeColorForWrite,
} from "@/shared/config/basic-gem-colors";

describe("basic-gem-colors", () => {
  it("normalizes legacy fancy colors to basic hues", () => {
    expect(normalizeGemColor("fancy-pink")).toBe("pink");
    expect(normalizeGemColor("fancy-orange")).toBe("orange");
    expect(normalizeGemColor("Fancy-Blue")).toBe("blue");
  });

  it("keeps diamond letter grades", () => {
    expect(normalizeGemColor("D")).toBe("D");
    expect(normalizeGemColor("j")).toBe("J");
  });

  it("expands filter to include legacy stored values", () => {
    const expanded = expandColorFilterValues("pink");
    expect(expanded).toContain("pink");
    expect(expanded).toContain("fancy-pink");
  });

  it("sanitizeColorForWrite blocks fancy for non-diamond", () => {
    expect(sanitizeColorForWrite("fancy-pink", "sapphire")).toBe("pink");
    expect(sanitizeColorForWrite("D", "diamond")).toBe("D");
  });

  it("exposes twelve basic colors", () => {
    expect(BASIC_GEM_COLORS).toHaveLength(12);
    expect(BASIC_GEM_COLORS).toContain("orange");
    expect(BASIC_GEM_COLORS).toContain("violet");
  });

  it("categorizes colors without a fancy bucket", () => {
    expect(categorizeGemColor("fancy-blue")).toBe("colored");
    expect(categorizeGemColor("D")).toBe("diamond");
    expect(categorizeGemColor("pink")).toBe("colored");
  });

  it("parseColorFilterTokens canonicalizes and dedupes", () => {
    expect(parseColorFilterTokens("fancy-pink,pink")).toEqual(["pink"]);
    expect(parseColorFilterTokens("gray,violet,orange,brown")).toEqual([
      "gray",
      "violet",
      "orange",
      "brown",
    ]);
  });
});
