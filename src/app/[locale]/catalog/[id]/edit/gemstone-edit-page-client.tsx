"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { GemstoneAdminApiService } from "@/features/admin/services/gemstone-admin-api-service";
import { GemstoneForm } from "@/features/admin/components/gemstone-form";
import type { GemstoneWithRelations } from "@/features/admin/services/gemstone-admin-service";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface GemstoneEditPageClientProps {
  gemstoneId: string;
  locale: string;
}

export function GemstoneEditPageClient({
  gemstoneId,
  locale,
}: GemstoneEditPageClientProps) {
  const router = useRouter();
  const t = useTranslations("admin.gemstoneForm");
  const [gemstone, setGemstone] = useState<GemstoneWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGemstone = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await GemstoneAdminApiService.getGemstoneById(
          gemstoneId
        );
        if (result.success && result.data) {
          setGemstone(result.data as GemstoneWithRelations);
        } else {
          setError(result.error || "Failed to load gemstone");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGemstone();
  }, [gemstoneId]);

  const handleSuccess = () => {
    // Redirect back to the catalog detail page after successful save
    router.push({
      pathname: "/catalog/[id]" as const,
      params: { id: gemstoneId },
    });
  };

  const handleCancel = () => {
    // Redirect back to the catalog detail page
    router.push({
      pathname: "/catalog/[id]" as const,
      params: { id: gemstoneId },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive">{error}</p>
          <Button onClick={handleCancel} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gemstone
          </Button>
        </div>
      </div>
    );
  }

  if (!gemstone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-muted-foreground">Gemstone not found</p>
          <Button onClick={handleCancel} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="min-h-[44px] self-start"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("actions.cancel") || "Cancel"}
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("editTitle") || "Edit Gemstone"}
            </h1>
          </div>

          {/* Gemstone Form */}
          <GemstoneForm
            gemstone={gemstone}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
