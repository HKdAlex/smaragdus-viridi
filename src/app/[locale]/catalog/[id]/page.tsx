import type {
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
  DetailGemstone,
} from "@/shared/types";

import { GemstoneDetail } from "@/features/gemstones/components/gemstone-detail";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

async function fetchGemstoneById(id: string): Promise<DetailGemstone | null> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.log(`❌ [GemstoneDetail] Invalid UUID format: ${id}`);
      return null;
    }

    console.log(`🔍 [GemstoneDetail] Fetching gemstone with ID: ${id}`);

    // Fetch gemstone with all related data
    const { data: gemstone, error: gemstoneError } = await supabase
      .from("gemstones")
      .select(
        `
        *,
        origin:origins(*),
        images:gemstone_images(*),
        videos:gemstone_videos(*),
        certifications:certifications(*)
      `
      )
      .eq("id", id)
      .single();

    if (gemstoneError || !gemstone) {
      console.error(
        `❌ [GemstoneDetail] Failed to fetch gemstone:`,
        gemstoneError
      );
      return null;
    }

    // Fetch AI analysis results separately
    const { data: aiAnalysisResults, error: aiError } = await supabase
      .from("ai_analysis_results")
      .select("*")
      .eq("gemstone_id", id)
      .order("created_at", { ascending: false });

    if (aiError) {
      console.warn(`⚠️ [GemstoneDetail] Failed to fetch AI analysis:`, aiError);
    }

    // Sort images by order
    if (gemstone.images) {
      gemstone.images.sort(
        (a: DatabaseGemstoneImage, b: DatabaseGemstoneImage) =>
          a.image_order - b.image_order
      );
    }

    // Sort videos by order
    if (gemstone.videos) {
      gemstone.videos.sort(
        (a: DatabaseGemstoneVideo, b: DatabaseGemstoneVideo) =>
          a.video_order - b.video_order
      );
    }

    console.log(`✅ [GemstoneDetail] Successfully fetched gemstone:`, {
      id: gemstone.id,
      name: gemstone.name,
      serial_number: gemstone.serial_number,
      images_count: gemstone.images?.length || 0,
      videos_count: gemstone.videos?.length || 0,
      has_origin: !!gemstone.origin,
      certifications_count: gemstone.certifications?.length || 0,
      ai_analysis_count: aiAnalysisResults?.length || 0,
    });

    const finalGemstone = {
      ...gemstone,
      ai_analysis_results:
        aiAnalysisResults?.map((result) => ({
          ...result,
          confidence_score: result.confidence_score
            ? Number(result.confidence_score)
            : null,
          processing_cost_usd: result.processing_cost_usd
            ? Number(result.processing_cost_usd)
            : null,
          processing_time_ms: result.processing_time_ms
            ? Number(result.processing_time_ms)
            : null,
        })) || [],
      ai_confidence_score: gemstone.ai_confidence_score
        ? Number(gemstone.ai_confidence_score)
        : null,
    } as DetailGemstone;

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
      <div className="container mx-auto px-4 py-8">
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
      <div className="container mx-auto px-4 py-8">
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

  if (!gemstone) {
    return {
      title: "Gemstone Not Found | Smaragdus Viridi",
      description: "The requested gemstone could not be found.",
    };
  }

  const priceFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: gemstone.price_currency,
  }).format(gemstone.price_amount / 100);

  return {
    title: `${gemstone.weight_carats}ct ${gemstone.color} ${gemstone.name} - ${priceFormatted} | Smaragdus Viridi`,
    description: `Exquisite ${gemstone.weight_carats} carat ${gemstone.color} ${gemstone.name} with ${gemstone.cut} cut and ${gemstone.clarity} clarity. Serial: ${gemstone.serial_number}. Premium quality gemstone from our curated collection.`,
    keywords: [
      gemstone.name,
      gemstone.color,
      gemstone.cut,
      gemstone.clarity,
      "gemstone",
      "jewelry",
      "precious stones",
      gemstone.origin?.country || "natural",
    ].join(", "),
    openGraph: {
      title: `${gemstone.weight_carats}ct ${gemstone.color} ${gemstone.name}`,
      description: `${priceFormatted} - ${gemstone.cut} cut, ${gemstone.clarity} clarity`,
      images:
        gemstone.images.length > 0
          ? [
              {
                url: gemstone.images[0].image_url,
                width: 800,
                height: 800,
                alt: `${gemstone.weight_carats}ct ${gemstone.color} ${gemstone.name}`,
              },
            ]
          : [],
    },
  };
}
