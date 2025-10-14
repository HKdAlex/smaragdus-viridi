/**
 * Gemstone Image Thumbnail Component - Phase 6
 *
 * Uses React Query caching and BlurPlaceholder for optimal image loading.
 * Provides consistent image display across admin and public components.
 */

import {
  useImagePrefetch,
  useImageQuery,
} from "@/features/gemstones/hooks/use-image-query";

import { BlurPlaceholder } from "@/shared/components/blur-placeholder";
import { Gem } from "lucide-react";

interface GemstoneImageThumbnailProps {
  gemstone: {
    images?: Array<{
      image_url: string;
      is_primary?: boolean | null;
      [key: string]: any; // Allow additional database fields
    }> | null;
    name?: string;
  };
  size?: "xs" | "sm" | "md" | "lg";
  alt: string;
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  xs: "w-8 h-8",
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

export function GemstoneImageThumbnail({
  gemstone,
  size = "md",
  alt,
  className = "",
  priority = false,
}: GemstoneImageThumbnailProps) {
  const primaryImage =
    gemstone.images?.find((img) => img.is_primary) || gemstone.images?.[0];

  // Use React Query for long-lived caching
  const { data: imageData, isLoading } = useImageQuery(
    primaryImage?.image_url || ""
  );

  // Use prefetch hook for hover functionality
  const { prefetchImage } = useImagePrefetch();

  const sizeClass = sizeClasses[size];
  const baseClasses = `${sizeClass} rounded-lg object-cover border border-border`;

  // Prefetch on hover for better UX
  const handleMouseEnter = () => {
    if (primaryImage?.image_url) {
      prefetchImage(primaryImage.image_url);
    }
  };

  if (!primaryImage) {
    // No image available - show placeholder
    return (
      <div
        className={`${baseClasses} bg-muted flex items-center justify-center ${className}`}
        onMouseEnter={handleMouseEnter}
      >
        <Gem className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onMouseEnter={handleMouseEnter}>
      <BlurPlaceholder
        src={imageData?.url || primaryImage.image_url}
        alt={alt}
        className={baseClasses}
        priority={priority}
        // blurDataURL could be provided from database in future
      />
    </div>
  );
}
