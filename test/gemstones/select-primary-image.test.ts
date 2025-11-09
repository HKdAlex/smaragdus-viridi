import { describe, expect, it } from "vitest";

import type { DatabaseGemstoneImage } from "@/shared/types";
import { selectPrimaryImage } from "@/features/gemstones/utils/select-primary-image";

let imageCounter = 0;

const createImage = (
  overrides: Partial<DatabaseGemstoneImage>
): DatabaseGemstoneImage => ({
  ai_analysis_date: null,
  ai_primary_reasoning: null,
  ai_primary_score: null,
  alt_text: null,
  created_at: null,
  gemstone_id: overrides.gemstone_id ?? "gem-1",
  has_watermark: null,
  id: overrides.id ?? `image-${imageCounter++}`,
  image_order: overrides.image_order ?? 0,
  image_type: overrides.image_type ?? "photo",
  image_url: overrides.image_url ?? "https://example.com/image.jpg",
  is_primary: overrides.is_primary ?? false,
  original_filename: overrides.original_filename ?? null,
  original_path: overrides.original_path ?? null,
  ...overrides,
});

describe("selectPrimaryImage", () => {
  it("returns explicitly selected image when selected_image_uuid matches", () => {
    const selected = createImage({
      id: "selected-image",
      image_order: 1,
      image_url: "https://example.com/selected.jpg",
    });
    const images = [
      createImage({ id: "first-image", image_order: 0 }),
      selected,
    ];

    const result = selectPrimaryImage({
      images,
      selectedImageUuid: "selected-image",
      recommendedPrimaryImageIndex: 0,
      primaryImageUrl: null,
    });

    expect(result).not.toBeNull();
    expect(result?.image?.id).toBe("selected-image");
    expect(result?.source).toBe("selected");
  });

  it("returns image flagged as primary when no explicit selection", () => {
    const flagged = createImage({
      id: "flagged",
      is_primary: true,
      image_order: 1,
      image_url: "https://example.com/flagged.jpg",
    });
    const images = [
      createImage({ id: "first-image", image_order: 0 }),
      flagged,
    ];

    const result = selectPrimaryImage({
      images,
      selectedImageUuid: null,
      recommendedPrimaryImageIndex: 0,
      primaryImageUrl: null,
    });

    expect(result).not.toBeNull();
    expect(result?.image?.id).toBe("flagged");
    expect(result?.source).toBe("flagged-primary");
  });

  it("uses recommended index when provided and no primary flag or selection", () => {
    const recommended = createImage({
      id: "recommended",
      image_order: 1,
      image_url: "https://example.com/recommended.jpg",
    });
    const images = [
      createImage({ id: "first-image", image_order: 0 }),
      recommended,
    ];

    const result = selectPrimaryImage({
      images,
      selectedImageUuid: null,
      recommendedPrimaryImageIndex: 1,
      primaryImageUrl: null,
    });

    expect(result).not.toBeNull();
    expect(result?.image?.id).toBe("recommended");
    expect(result?.source).toBe("recommended-index");
  });

  it("falls back to first image when no other signals are present", () => {
    const first = createImage({
      id: "first-image",
      image_order: 0,
      image_url: "https://example.com/first.jpg",
    });
    const images = [first, createImage({ id: "second-image", image_order: 1 })];

    const result = selectPrimaryImage({
      images,
      selectedImageUuid: null,
      recommendedPrimaryImageIndex: null,
      primaryImageUrl: null,
    });

    expect(result).not.toBeNull();
    expect(result?.image?.id).toBe("first-image");
    expect(result?.source).toBe("first-image");
  });

  it("falls back to primary_image_url when no images are available", () => {
    const fallbackUrl = "https://example.com/fallback.jpg";
    const result = selectPrimaryImage({
      images: [],
      selectedImageUuid: null,
      recommendedPrimaryImageIndex: null,
      primaryImageUrl: fallbackUrl,
    });

    expect(result).not.toBeNull();
    expect(result?.image).toBeNull();
    expect(result?.imageUrl).toBe(fallbackUrl);
    expect(result?.source).toBe("fallback-url");
  });

  it("returns null when no images or fallback URL are provided", () => {
    const result = selectPrimaryImage({
      images: [],
      selectedImageUuid: null,
      recommendedPrimaryImageIndex: null,
      primaryImageUrl: null,
    });

    expect(result).toBeNull();
  });
});

