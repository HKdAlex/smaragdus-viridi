import type { DatabaseGemstoneImage } from "@/shared/types";

type ImageCandidate = Pick<
  DatabaseGemstoneImage,
  "id" | "image_url" | "is_primary" | "image_order" | "alt_text"
>;

export type PrimaryImageSource =
  | "selected"
  | "flagged-primary"
  | "recommended-index"
  | "first-image"
  | "fallback-url";

export interface SelectPrimaryImageInput {
  images?: ImageCandidate[] | null;
  selectedImageUuid?: string | null;
  recommendedPrimaryImageIndex?: number | null;
  primaryImageUrl?: string | null;
}

export interface PrimaryImageSelection {
  image: ImageCandidate | null;
  imageUrl: string;
  source: PrimaryImageSource;
}

/**
 * Determines the best primary image to display for a gemstone.
 *
 * Preference order:
 * 1. Explicitly selected image (selected_image_uuid)
 * 2. Image flagged with is_primary
 * 3. Recommended primary image index
 * 4. First available image in the array
 * 5. Fallback to gemstone.primary_image_url when images array is empty
 */
export function selectPrimaryImage(
  input: SelectPrimaryImageInput
): PrimaryImageSelection | null {
  const {
    images,
    selectedImageUuid,
    recommendedPrimaryImageIndex,
    primaryImageUrl,
  } = input;

  const imageList =
    images?.filter(
      (image): image is ImageCandidate =>
        Boolean(image) && typeof image.image_url === "string"
    ) ?? [];

  if (imageList.length === 0) {
    if (primaryImageUrl) {
      return {
        image: null,
        imageUrl: primaryImageUrl,
        source: "fallback-url",
      };
    }

    return null;
  }

  if (selectedImageUuid) {
    const selected = imageList.find((img) => img.id === selectedImageUuid);
    if (selected) {
      return {
        image: selected,
        imageUrl: selected.image_url,
        source: "selected",
      };
    }
  }

  const flaggedPrimary = imageList.find((img) => img.is_primary);
  if (flaggedPrimary) {
    return {
      image: flaggedPrimary,
      imageUrl: flaggedPrimary.image_url,
      source: "flagged-primary",
    };
  }

  if (
    typeof recommendedPrimaryImageIndex === "number" &&
    recommendedPrimaryImageIndex >= 0 &&
    recommendedPrimaryImageIndex < imageList.length
  ) {
    const recommended = imageList[recommendedPrimaryImageIndex];
    if (recommended) {
      return {
        image: recommended,
        imageUrl: recommended.image_url,
        source: "recommended-index",
      };
    }
  }

  const firstImage = imageList[0];
  return {
    image: firstImage,
    imageUrl: firstImage.image_url,
    source: "first-image",
  };
}


