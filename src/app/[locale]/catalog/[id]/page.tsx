import type {
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
  DetailGemstone,
} from "@/shared/types";

import type { Database } from "@/shared/types/database";
import { GemstoneDetail } from "@/features/gemstones/components/gemstone-detail";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

// DetailGemstone interface is now imported from shared types

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Export params to satisfy Next.js requirements for dynamic routes
export async function generateStaticParams() {
  // Return empty array to indicate this is a fully dynamic route
  return [];
}

type V6Row = Database["public"]["Tables"]["gemstones_ai_v6"]["Row"];

async function fetchGemstoneById(
  id: string
): Promise<(DetailGemstone & { v6Text?: V6Row | null }) | null> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.log(`❌ [GemstoneDetail] Invalid UUID format: ${id}`);
      return null;
    }

    console.log(`🔍 [GemstoneDetail] Fetching gemstone with ID: ${id}`);

    if (!supabaseAdmin) {
      console.error("❌ [GemstoneDetail] Supabase admin client not available");
      return null;
    }

    // Fetch gemstone with AI content using gemstones_enriched view
    const { data: gemstone, error: gemstoneError } = (await supabaseAdmin
      .from("gemstones_enriched")
      .select("*")
      .eq("id", id)
      .gt("price_amount", 0) // Only show items with price > 0
      .single()) as {
      data: any | null;
      error: any;
    };

    if (gemstoneError || !gemstone) {
      console.error(
        `❌ [GemstoneDetail] Failed to fetch gemstone:`,
        gemstoneError
      );
      return null;
    }

    // Fetch additional related data separately (not in the view)
    const [imagesResult, videosResult, certificationsResult, individualStonesResult] =
      await Promise.all([
        supabaseAdmin.from("gemstone_images").select("*").eq("gemstone_id", id),
        supabaseAdmin.from("gemstone_videos").select("*").eq("gemstone_id", id),
        supabaseAdmin.from("certifications").select("*").eq("gemstone_id", id),
        supabaseAdmin.from("gemstone_individual_stones").select("*").eq("gemstone_id", id).order("stone_number"),
      ]);

    const images = imagesResult.data || [];
    const videos = videosResult.data || [];
    const certifications = certificationsResult.data || [];
    // Transform individual_stones from database format to application format
    const individual_stones = (individualStonesResult.data || []).map((stone: any) => ({
      id: stone.id,
      gemstone_id: stone.gemstone_id,
      stone_number: stone.stone_number,
      dimensions: {
        length_mm: Number(stone.length_mm),
        width_mm: Number(stone.width_mm),
        depth_mm: Number(stone.depth_mm),
      },
      created_at: stone.created_at,
      updated_at: stone.updated_at,
    }));

    if (imagesResult.error) {
      console.warn(
        `⚠️ [GemstoneDetail] Failed to fetch images:`,
        imagesResult.error
      );
    }
    if (videosResult.error) {
      console.warn(
        `⚠️ [GemstoneDetail] Failed to fetch videos:`,
        videosResult.error
      );
    }
    if (certificationsResult.error) {
      console.warn(
        `⚠️ [GemstoneDetail] Failed to fetch certifications:`,
        certificationsResult.error
      );
    }
    if (individualStonesResult.error) {
      console.warn(
        `⚠️ [GemstoneDetail] Failed to fetch individual stones:`,
        individualStonesResult.error
      );
    }

    // Sort images by order
    if (images && Array.isArray(images)) {
      images.sort(
        (a: DatabaseGemstoneImage, b: DatabaseGemstoneImage) =>
          a.image_order - b.image_order
      );
    }

    // Sort videos by order
    if (videos && Array.isArray(videos)) {
      videos.sort(
        (a: DatabaseGemstoneVideo, b: DatabaseGemstoneVideo) =>
          a.video_order - b.video_order
      );
    }

    console.log(`✅ [GemstoneDetail] Successfully fetched gemstone:`, {
      id: gemstone.id,
      name: gemstone.name,
      serial_number: gemstone.serial_number,
      images_count: images?.length || 0,
      videos_count: videos?.length || 0,
      has_origin: !!gemstone.origin_id,
      certifications_count: certifications?.length || 0,
      individual_stones_count: individual_stones?.length || 0,
      has_ai_content: !!gemstone.technical_description_en,
    });

    const finalGemstone = {
      ...gemstone,
      images,
      videos,
      certifications,
      individual_stones,
      ai_analysis_results: gemstone.technical_description_en
        ? [
            {
              confidence_score: gemstone.confidence_score
                ? Number(gemstone.confidence_score)
                : null,
              analysis_type: "comprehensive_analysis",
              ai_model_version: gemstone.model_version,
              created_at: gemstone.updated_at,
            },
          ]
        : [],
      ai_confidence_score: gemstone.confidence_score
        ? Number(gemstone.confidence_score)
        : null,
      v6Text: gemstone.technical_description_en
        ? {
            technical_description_en: gemstone.technical_description_en,
            technical_description_ru: gemstone.technical_description_ru,
            emotional_description_en: gemstone.emotional_description_en,
            emotional_description_ru: gemstone.emotional_description_ru,
            narrative_story_en: gemstone.narrative_story_en,
            narrative_story_ru: gemstone.narrative_story_ru,
            historical_context_en: gemstone.historical_context_en,
            historical_context_ru: gemstone.historical_context_ru,
            care_instructions_en: gemstone.care_instructions_en,
            care_instructions_ru: gemstone.care_instructions_ru,
            promotional_text: gemstone.promotional_text_en,
            promotional_text_ru: gemstone.promotional_text_ru,
            marketing_highlights: gemstone.marketing_highlights_en,
            marketing_highlights_ru: gemstone.marketing_highlights_ru,
            recommended_primary_image_index:
              gemstone.recommended_primary_image_index,
            selected_image_uuid: gemstone.selected_image_uuid,
            detected_cut: gemstone.detected_cut,
            detected_color: gemstone.detected_color,
            detected_color_description: gemstone.detected_color_description,
            model_version: gemstone.model_version,
            confidence_score: gemstone.confidence_score,
            needs_review: gemstone.needs_review,
          }
        : null,
    } as DetailGemstone & { v6Text?: V6Row | null };

    return finalGemstone;
  } catch (error) {
    console.error(`❌ [GemstoneDetail] Unexpected error:`, error);
    return null;
  }
}

// Loading component for Suspense
function GemstoneDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="animate-pulse">
          {/* Breadcrumb skeleton */}
          <div className="h-4 bg-muted rounded w-64 mb-6"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image gallery skeleton */}
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-muted rounded"></div>
                ))}
              </div>
            </div>

            {/* Details skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
              <div className="flex gap-4">
                <div className="h-12 bg-muted rounded w-32"></div>
                <div className="h-12 bg-muted rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function GemstoneDetailPage({ params }: PageProps) {
  const { id } = await params;
  const gemstone = await fetchGemstoneById(id);

  if (!gemstone) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Suspense fallback={<GemstoneDetailSkeleton />}>
          <GemstoneDetail gemstone={gemstone} />
        </Suspense>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const gemstone = await fetchGemstoneById(id);
  const t = await getTranslations("catalog");

  if (!gemstone) {
    return {
      title: `${t("gemstone.notFound")} | Crystallique`,
      description: t("gemstone.notFoundDescription"),
    };
  }

  // Note: Metadata generation doesn't have access to user currency preference
  // Using database price_currency (typically USD) for SEO metadata
  // For user-facing display, client components use currency context with conversion
  const priceFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: gemstone.price_currency,
  }).format(gemstone.price_amount / 100);

  const title = t("gemstone.title", {
    weight: gemstone.weight_carats,
    color: gemstone.color,
    name: gemstone.name,
    price: priceFormatted,
  });

  const description = t("gemstone.description", {
    weight: gemstone.weight_carats,
    color: gemstone.color,
    name: gemstone.name,
    cut: gemstone.cut,
    clarity: gemstone.clarity,
    serial: gemstone.serial_number,
  });

  const keywords = [
    gemstone.name,
    gemstone.color,
    gemstone.cut,
    gemstone.clarity,
    t("gemstone.keywords.gemstone"),
    t("gemstone.keywords.jewelry"),
    t("gemstone.keywords.preciousStones"),
    gemstone.origin?.country || t("gemstone.keywords.natural"),
  ].join(", ");

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: t("gemstone.og.title", {
        weight: gemstone.weight_carats,
        color: gemstone.color,
        name: gemstone.name,
      }),
      description: t("gemstone.og.description", {
        price: priceFormatted,
        cut: gemstone.cut,
        clarity: gemstone.clarity,
      }),
      images:
        gemstone.images.length > 0
          ? [
              {
                url: gemstone.images[0].image_url,
                width: 800,
                height: 800,
                alt: t("gemstone.imageAlt", {
                  weight: gemstone.weight_carats,
                  color: gemstone.color,
                  name: gemstone.name,
                }),
              },
            ]
          : [],
    },
  };
}
