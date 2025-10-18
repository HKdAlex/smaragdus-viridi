"use client";

import { useGemstoneTranslations } from "@/features/gemstones/utils/gemstone-translations";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  CURRENCY_CODES,
  DEFAULT_GEMSTONE_VALUES,
  GEMSTONE_TYPES,
  GEM_CLARITIES,
  GEM_COLORS,
  GEM_CUTS,
} from "@/shared/services/database-enums";
import type { DatabaseGemstone, DatabaseOrigin } from "@/shared/types";
import {
  AlertCircle,
  Brain,
  DollarSign,
  FileText,
  Gem,
  Image,
  Loader2,
  Minus,
  Package,
  Palette,
  Plus,
  Ruler,
  Save,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  GemstoneAdminService,
  type GemstoneFormData,
  type GemstoneWithRelations,
} from "../services/gemstone-admin-service";
import {
  MediaUploadService,
  type MediaUploadResult,
} from "../services/media-upload-service";
import { EnhancedMediaUpload } from "./enhanced-media-upload";

interface GemstoneFormProps {
  gemstone?: GemstoneWithRelations;
  onSuccess?: (gemstone: DatabaseGemstone) => void;
  onCancel?: () => void;
}

export function GemstoneForm({
  gemstone,
  onSuccess,
  onCancel,
}: GemstoneFormProps) {
  const t = useTranslations("admin.gemstoneForm");
  const tCurrencies = useTranslations("admin.currencies");
  const {
    translateGemstoneType,
    translateColor,
    translateCut,
    translateClarity,
    translateOrigin,
  } = useGemstoneTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [origins, setOrigins] = useState<DatabaseOrigin[]>([]);
  const [marketingHighlights, setMarketingHighlights] = useState<string[]>([]);
  const [marketingHighlightsEn, setMarketingHighlightsEn] = useState<string[]>(
    []
  );
  const [marketingHighlightsRu, setMarketingHighlightsRu] = useState<string[]>(
    []
  );
  const [currentHighlight, setCurrentHighlight] = useState("");
  const [currentHighlightEn, setCurrentHighlightEn] = useState("");
  const [currentHighlightRu, setCurrentHighlightRu] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResult[]>([]);

  const [formData, setFormData] = useState<GemstoneFormData>(() => {
    return {
      name: gemstone?.name || DEFAULT_GEMSTONE_VALUES.type,
      color: gemstone?.color || DEFAULT_GEMSTONE_VALUES.color,
      cut: gemstone?.cut || DEFAULT_GEMSTONE_VALUES.cut,
      clarity: gemstone?.clarity || DEFAULT_GEMSTONE_VALUES.clarity,
      weight_carats: gemstone?.weight_carats || 0,
      length_mm: gemstone?.length_mm || 0,
      width_mm: gemstone?.width_mm || 0,
      depth_mm: gemstone?.depth_mm || 0,
      origin_id: gemstone?.origin_id || undefined,
      price_amount: gemstone?.price_amount || 0,
      price_currency:
        gemstone?.price_currency || DEFAULT_GEMSTONE_VALUES.currency,
      premium_price_amount: gemstone?.premium_price_amount || undefined,
      premium_price_currency: gemstone?.premium_price_currency || undefined,
      in_stock: gemstone?.in_stock ?? true,
      delivery_days: gemstone?.delivery_days || undefined,
      internal_code: gemstone?.internal_code || undefined,
      serial_number: gemstone?.serial_number || "",
      description: gemstone?.description || undefined,
      promotional_text: gemstone?.promotional_text || undefined,
      marketing_highlights: gemstone?.marketing_highlights || undefined,
      // AI-generated fields (English)
      description_technical_en:
        gemstone?.ai_v6?.technical_description_en || undefined,
      description_emotional_en:
        gemstone?.ai_v6?.emotional_description_en || undefined,
      narrative_story_en: gemstone?.ai_v6?.narrative_story_en || undefined,
      promotional_text_en: gemstone?.ai_v6?.promotional_text || undefined,
      marketing_highlights_en:
        gemstone?.ai_v6?.marketing_highlights || undefined,
      // AI-generated fields (Russian)
      description_technical_ru:
        gemstone?.ai_v6?.technical_description_ru || undefined,
      description_emotional_ru:
        gemstone?.ai_v6?.emotional_description_ru || undefined,
      narrative_story_ru: gemstone?.ai_v6?.narrative_story_ru || undefined,
      promotional_text_ru: gemstone?.ai_v6?.promotional_text_ru || undefined,
      marketing_highlights_ru:
        gemstone?.ai_v6?.marketing_highlights_ru || undefined,
    };
  });

  // Load origins for dropdown
  useEffect(() => {
    const loadOrigins = async () => {
      try {
        const { data } = await supabase
          .from("origins")
          .select("*")
          .order("name");
        setOrigins(data || []);
      } catch (error) {
        console.error("Failed to load origins:", error);
      }
    };

    loadOrigins();
  }, []);

  // Update form data when gemstone changes
  useEffect(() => {
    if (gemstone) {
      setFormData({
        name: gemstone.name || DEFAULT_GEMSTONE_VALUES.type,
        color: gemstone.color || DEFAULT_GEMSTONE_VALUES.color,
        cut: gemstone.cut || DEFAULT_GEMSTONE_VALUES.cut,
        clarity: gemstone.clarity || DEFAULT_GEMSTONE_VALUES.clarity,
        weight_carats: gemstone.weight_carats || 0,
        length_mm: gemstone.length_mm || 0,
        width_mm: gemstone.width_mm || 0,
        depth_mm: gemstone.depth_mm || 0,
        origin_id: gemstone.origin_id || undefined,
        price_amount: gemstone.price_amount || 0,
        price_currency:
          gemstone.price_currency || DEFAULT_GEMSTONE_VALUES.currency,
        premium_price_amount: gemstone.premium_price_amount || undefined,
        premium_price_currency: gemstone.premium_price_currency || undefined,
        in_stock: gemstone.in_stock ?? true,
        delivery_days: gemstone.delivery_days || undefined,
        internal_code: gemstone.internal_code || undefined,
        serial_number: gemstone.serial_number || "",
        description: gemstone.description || undefined,
        promotional_text: gemstone.promotional_text || undefined,
        marketing_highlights: gemstone.marketing_highlights || undefined,
        // AI-generated fields (English)
        description_technical_en:
          gemstone.ai_v6?.technical_description_en || undefined,
        description_emotional_en:
          gemstone.ai_v6?.emotional_description_en || undefined,
        narrative_story_en: gemstone.ai_v6?.narrative_story_en || undefined,
        promotional_text_en: gemstone.ai_v6?.promotional_text || undefined,
        marketing_highlights_en:
          gemstone.ai_v6?.marketing_highlights || undefined,
        // AI-generated fields (Russian)
        description_technical_ru:
          gemstone.ai_v6?.technical_description_ru || undefined,
        description_emotional_ru:
          gemstone.ai_v6?.emotional_description_ru || undefined,
        narrative_story_ru: gemstone.ai_v6?.narrative_story_ru || undefined,
        promotional_text_ru: gemstone.ai_v6?.promotional_text_ru || undefined,
        marketing_highlights_ru:
          gemstone.ai_v6?.marketing_highlights_ru || undefined,
      });

      // Load marketing highlights
      if (gemstone.marketing_highlights) {
        setMarketingHighlights(gemstone.marketing_highlights);
      }
      if (gemstone.ai_v6?.marketing_highlights) {
        setMarketingHighlightsEn(gemstone.ai_v6.marketing_highlights);
      }
      if (gemstone.ai_v6?.marketing_highlights_ru) {
        setMarketingHighlightsRu(gemstone.ai_v6.marketing_highlights_ru);
      }
    }
  }, [gemstone]);

  // Load existing media if editing
  useEffect(() => {
    if (gemstone?.id) {
      MediaUploadService.getGemstoneMedia(gemstone.id).then((result) => {
        if (result.success && result.data) {
          // Convert existing media to MediaUploadResult format
          const existingMedia: MediaUploadResult[] = [
            ...(result.data.images?.map((img) => ({
              id: img.id,
              url: img.image_url,
              type: "image" as const,
              originalName: img.original_filename || "image",
              size: 0, // Size not available from database
            })) || []),
            ...(result.data.videos?.map((vid) => ({
              id: vid.id,
              url: vid.video_url,
              type: "video" as const,
              originalName: "video",
              size: 0, // Size not available from database
            })) || []),
          ];
          setUploadedMedia(existingMedia);
        }
      });
    }
  }, [gemstone]);

  const handleInputChange = (field: keyof GemstoneFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addMarketingHighlight = () => {
    if (currentHighlight.trim()) {
      setMarketingHighlights((prev) => [...prev, currentHighlight.trim()]);
      setCurrentHighlight("");
    }
  };

  const removeMarketingHighlight = (index: number) => {
    setMarketingHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const addMarketingHighlightEn = () => {
    if (currentHighlightEn.trim()) {
      setMarketingHighlightsEn((prev) => [...prev, currentHighlightEn.trim()]);
      setCurrentHighlightEn("");
    }
  };

  const removeMarketingHighlightEn = (index: number) => {
    setMarketingHighlightsEn((prev) => prev.filter((_, i) => i !== index));
  };

  const addMarketingHighlightRu = () => {
    if (currentHighlightRu.trim()) {
      setMarketingHighlightsRu((prev) => [...prev, currentHighlightRu.trim()]);
      setCurrentHighlightRu("");
    }
  };

  const removeMarketingHighlightRu = (index: number) => {
    setMarketingHighlightsRu((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = async (): Promise<boolean> => {
    const validation = GemstoneAdminService.validateGemstoneData(formData);
    if (!validation.valid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        // Map error messages to field names
        if (error.includes("Serial number")) errorMap.serial_number = error;
        else if (error.includes("Gemstone type")) errorMap.name = error;
        else if (error.includes("Color")) errorMap.color = error;
        else if (error.includes("Cut")) errorMap.cut = error;
        else if (error.includes("Clarity")) errorMap.clarity = error;
        else if (error.includes("Weight")) errorMap.weight_carats = error;
        else if (error.includes("Price")) errorMap.price_amount = error;
        else if (error.includes("currency")) errorMap.price_currency = error;
      });
      setErrors(errorMap);
      return false;
    }

    // Check for duplicate serial number
    if (formData.serial_number) {
      const exists = await GemstoneAdminService.checkSerialNumberExists(
        formData.serial_number,
        gemstone?.id // Exclude current gemstone when editing
      );
      if (exists) {
        setErrors({ serial_number: t("errors.serialNumberExists") });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const isValid = await validateForm();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Include marketing highlights in form data
      const submitData = {
        ...formData,
        marketing_highlights:
          marketingHighlights.length > 0 ? marketingHighlights : undefined,
        // Map AI v6 fields to correct database columns
        ai_v6: {
          technical_description_en: formData.description_technical_en,
          emotional_description_en: formData.description_emotional_en,
          narrative_story_en: formData.narrative_story_en,
          promotional_text: formData.promotional_text_en,
          marketing_highlights:
            marketingHighlightsEn.length > 0
              ? marketingHighlightsEn
              : undefined,
          technical_description_ru: formData.description_technical_ru,
          emotional_description_ru: formData.description_emotional_ru,
          narrative_story_ru: formData.narrative_story_ru,
          promotional_text_ru: formData.promotional_text_ru,
          marketing_highlights_ru:
            marketingHighlightsRu.length > 0
              ? marketingHighlightsRu
              : undefined,
        },
      };

      let result;
      if (gemstone) {
        // Update existing gemstone
        result = await GemstoneAdminService.updateGemstone(
          gemstone.id,
          submitData
        );
      } else {
        // Create new gemstone
        result = await GemstoneAdminService.createGemstone(submitData);
      }

      if (result.success && result.data) {
        onSuccess?.(result.data);
        if (!gemstone) {
          // Redirect to edit mode for the new gemstone
          router.push(`/admin/gemstones/${result.data.id}/edit` as any);
        }
      } else {
        setErrors({ submit: result.error || t("errors.generalError") });
      }
    } catch (error) {
      setErrors({ submit: t("errors.unexpectedError") });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gem className="w-5 h-5" />
          {gemstone ? t("editTitle") : t("createTitle")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.submit}
            </div>
          )}

          {/* Tabbed Form Sections */}
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 lg:grid-cols-7">
              <TabsTrigger value="basic" className="text-xs md:text-sm">
                <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="properties" className="text-xs md:text-sm">
                <Palette className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Properties</span>
              </TabsTrigger>
              <TabsTrigger value="dimensions" className="text-xs md:text-sm">
                <Ruler className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Dimensions</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs md:text-sm">
                <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Pricing</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs md:text-sm">
                <Package className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="ai-content" className="text-xs md:text-sm">
                <Brain className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">AI Content</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs md:text-sm">
                <Image className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">Media</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="serial_number"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("labels.serialNumber")}
                  </label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) =>
                      handleInputChange("serial_number", e.target.value)
                    }
                    placeholder={t("serialNumberPlaceholder")}
                    className={errors.serial_number ? "border-red-500" : ""}
                  />
                  {errors.serial_number && (
                    <p className="text-sm text-red-600">
                      {errors.serial_number}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="internal_code"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("labels.internalCode")}
                  </label>
                  <Input
                    id="internal_code"
                    value={formData.internal_code || ""}
                    onChange={(e) =>
                      handleInputChange("internal_code", e.target.value)
                    }
                    placeholder={t("internalCodePlaceholder")}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Gemstone Properties Tab */}
            <TabsContent value="properties" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.type")}
                  </label>
                  <Select
                    value={formData.name}
                    onValueChange={(value) => handleInputChange("name", value)}
                  >
                    <SelectTrigger
                      className={errors.name ? "border-red-500" : ""}
                    >
                      <span className="text-sm">
                        {formData.name ? (
                          translateGemstoneType(formData.name)
                        ) : (
                          <span className="text-muted-foreground">
                            {t("selectTypePlaceholder")}
                          </span>
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {GEMSTONE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {translateGemstoneType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.color")}
                  </label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => handleInputChange("color", value)}
                  >
                    <SelectTrigger
                      className={errors.color ? "border-red-500" : ""}
                    >
                      <span className="text-sm">
                        {formData.color ? (
                          translateColor(formData.color)
                        ) : (
                          <span className="text-muted-foreground">
                            {t("selectColorPlaceholder")}
                          </span>
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {GEM_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {translateColor(color)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.color && (
                    <p className="text-sm text-red-600">{errors.color}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.cut")}
                  </label>
                  <Select
                    value={formData.cut}
                    onValueChange={(value) => handleInputChange("cut", value)}
                  >
                    <SelectTrigger
                      className={errors.cut ? "border-red-500" : ""}
                    >
                      <span className="text-sm">
                        {formData.cut ? (
                          translateCut(formData.cut)
                        ) : (
                          <span className="text-muted-foreground">
                            {t("selectCutPlaceholder")}
                          </span>
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {GEM_CUTS.map((cut) => (
                        <SelectItem key={cut} value={cut}>
                          {translateCut(cut)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.cut && (
                    <p className="text-sm text-red-600">{errors.cut}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.clarity")}
                  </label>
                  <Select
                    value={formData.clarity}
                    onValueChange={(value) =>
                      handleInputChange("clarity", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.clarity ? "border-red-500" : ""}
                    >
                      <span className="text-sm">
                        {formData.clarity ? (
                          translateClarity(formData.clarity)
                        ) : (
                          <span className="text-muted-foreground">
                            {t("selectClarityPlaceholder")}
                          </span>
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {GEM_CLARITIES.map((clarity) => (
                        <SelectItem key={clarity} value={clarity}>
                          {translateClarity(clarity)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clarity && (
                    <p className="text-sm text-red-600">{errors.clarity}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Dimensions Tab */}
            <TabsContent value="dimensions" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label htmlFor="weight">{t("labels.weight")}</label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight_carats}
                    onChange={(e) =>
                      handleInputChange(
                        "weight_carats",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className={errors.weight_carats ? "border-red-500" : ""}
                  />
                  {errors.weight_carats && (
                    <p className="text-sm text-red-600">
                      {errors.weight_carats}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="length">{t("labels.length")}</label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.length_mm}
                    onChange={(e) =>
                      handleInputChange(
                        "length_mm",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="width">{t("labels.width")}</label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.width_mm}
                    onChange={(e) =>
                      handleInputChange(
                        "width_mm",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="depth">{t("labels.depth")}</label>
                  <Input
                    id="depth"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.depth_mm}
                    onChange={(e) =>
                      handleInputChange(
                        "depth_mm",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>

              {/* Origin */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("labels.origin")}
                </label>
                <Select
                  value={formData.origin_id || ""}
                  onValueChange={(value) =>
                    handleInputChange("origin_id", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectOriginPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("noOriginSpecified")}</SelectItem>
                    {origins.map((origin) => (
                      <SelectItem key={origin.id} value={origin.id}>
                        {translateOrigin(origin.name)} - {origin.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="price">{t("labels.regularPrice")}</label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.price_currency}
                      onValueChange={(value) =>
                        handleInputChange("price_currency", value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <span className="text-sm">
                          {formData.price_currency
                            ? tCurrencies(formData.price_currency as any) ||
                              formData.price_currency
                            : ""}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_CODES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {tCurrencies(currency as any) || currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_amount / 100} // Convert from cents
                      onChange={(e) =>
                        handleInputChange(
                          "price_amount",
                          Math.round(parseFloat(e.target.value) * 100)
                        )
                      }
                      placeholder="0.00"
                      className={`flex-1 ${
                        errors.price_amount ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.price_amount && (
                    <p className="text-sm text-red-600">
                      {errors.price_amount}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="premium_price">
                    {t("labels.premiumPrice")}
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={
                        formData.premium_price_currency ||
                        formData.price_currency
                      }
                      onValueChange={(value) =>
                        handleInputChange("premium_price_currency", value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <span className="text-sm">
                          {formData.premium_price_currency ||
                          formData.price_currency
                            ? tCurrencies(
                                (formData.premium_price_currency ||
                                  formData.price_currency) as any
                              ) ||
                              formData.premium_price_currency ||
                              formData.price_currency
                            : ""}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_CODES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {tCurrencies(currency as any) || currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="premium_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formData.premium_price_amount
                          ? formData.premium_price_amount / 100
                          : ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "premium_price_amount",
                          e.target.value
                            ? Math.round(parseFloat(e.target.value) * 100)
                            : undefined
                        )
                      }
                      placeholder={t("optionalPlaceholder")}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in_stock"
                    checked={formData.in_stock}
                    onCheckedChange={(checked) =>
                      handleInputChange("in_stock", checked)
                    }
                  />
                  <label htmlFor="in_stock">{t("labels.inStock")}</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="delivery_days">
                    {t("labels.deliveryDays")}
                  </label>
                  <Input
                    id="delivery_days"
                    type="number"
                    min="0"
                    value={formData.delivery_days || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "delivery_days",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder={t("deliveryDaysPlaceholder")}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="total_price">{t("labels.totalPrice")}</label>
                  <div className="text-lg font-semibold text-green-600">
                    {formData.price_amount
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: formData.price_currency,
                        }).format(formData.price_amount / 100)
                      : "$0.00"}
                  </div>
                </div>
              </div>

              {/* Promotional Text */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="promotional_text">
                    {t("labels.promotionalText")}
                  </label>
                  <Textarea
                    id="promotional_text"
                    value={formData.promotional_text || ""}
                    onChange={(e) =>
                      handleInputChange("promotional_text", e.target.value)
                    }
                    placeholder={t("promotionalTextPlaceholder")}
                    rows={4}
                  />
                </div>
              </div>

              {/* Marketing Highlights */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground">
                  {t("labels.marketingHighlights")}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={currentHighlight}
                    onChange={(e) => setCurrentHighlight(e.target.value)}
                    placeholder={t("marketingHighlightPlaceholder")}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addMarketingHighlight())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addMarketingHighlight}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                    {t("actions.addHighlight")}
                  </Button>
                </div>

                {marketingHighlights.length > 0 && (
                  <div className="space-y-2">
                    {marketingHighlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                      >
                        <span className="flex-1">{highlight}</span>
                        <Button
                          type="button"
                          onClick={() => removeMarketingHighlight(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AI Content Tab */}
            <TabsContent value="ai-content" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5" />
                  <h3 className="text-lg font-medium">
                    {t("labels.aiGeneratedContent")}
                  </h3>
                </div>

                {/* English Fields */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      🇺🇸 English Content
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="description_technical_en">
                        {t("labels.technicalDescription")} (EN)
                      </label>
                      <Textarea
                        id="description_technical_en"
                        value={formData.description_technical_en || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "description_technical_en",
                            e.target.value
                          )
                        }
                        placeholder={t("technicalDescriptionPlaceholder")}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="description_emotional_en">
                        {t("labels.emotionalDescription")} (EN)
                      </label>
                      <Textarea
                        id="description_emotional_en"
                        value={formData.description_emotional_en || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "description_emotional_en",
                            e.target.value
                          )
                        }
                        placeholder={t("emotionalDescriptionPlaceholder")}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="narrative_story_en">
                        {t("labels.narrativeStory")} (EN)
                      </label>
                      <Textarea
                        id="narrative_story_en"
                        value={formData.narrative_story_en || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "narrative_story_en",
                            e.target.value
                          )
                        }
                        placeholder={t("narrativeStoryPlaceholder")}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="promotional_text_en">
                        {t("labels.promotionalText")} (EN)
                      </label>
                      <Textarea
                        id="promotional_text_en"
                        value={formData.promotional_text_en || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "promotional_text_en",
                            e.target.value
                          )
                        }
                        placeholder={t("promotionalTextPlaceholder")}
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* AI Marketing Highlights */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-foreground">
                      {t("labels.marketingHighlights")} (EN)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={currentHighlightEn}
                        onChange={(e) => setCurrentHighlightEn(e.target.value)}
                        placeholder={t("marketingHighlightPlaceholder")}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addMarketingHighlightEn();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addMarketingHighlightEn}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t("actions.add")}
                      </Button>
                    </div>
                    {marketingHighlightsEn.length > 0 && (
                      <div className="space-y-2">
                        {marketingHighlightsEn.map((highlight, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                          >
                            <span className="flex-1">{highlight}</span>
                            <Button
                              type="button"
                              onClick={() => removeMarketingHighlightEn(index)}
                              variant="ghost"
                              size="sm"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Russian Fields */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      🇷🇺 Russian Content
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="description_technical_ru">
                        {t("labels.technicalDescription")} (RU)
                      </label>
                      <Textarea
                        id="description_technical_ru"
                        value={formData.description_technical_ru || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "description_technical_ru",
                            e.target.value
                          )
                        }
                        placeholder={t("technicalDescriptionPlaceholder")}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="description_emotional_ru">
                        {t("labels.emotionalDescription")} (RU)
                      </label>
                      <Textarea
                        id="description_emotional_ru"
                        value={formData.description_emotional_ru || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "description_emotional_ru",
                            e.target.value
                          )
                        }
                        placeholder={t("emotionalDescriptionPlaceholder")}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="narrative_story_ru">
                        {t("labels.narrativeStory")} (RU)
                      </label>
                      <Textarea
                        id="narrative_story_ru"
                        value={formData.narrative_story_ru || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "narrative_story_ru",
                            e.target.value
                          )
                        }
                        placeholder={t("narrativeStoryPlaceholder")}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="promotional_text_ru">
                        {t("labels.promotionalText")} (RU)
                      </label>
                      <Textarea
                        id="promotional_text_ru"
                        value={formData.promotional_text_ru || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "promotional_text_ru",
                            e.target.value
                          )
                        }
                        placeholder={t("promotionalTextPlaceholder")}
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Russian Marketing Highlights */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-foreground">
                      {t("labels.marketingHighlights")} (RU)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={currentHighlightRu}
                        onChange={(e) => setCurrentHighlightRu(e.target.value)}
                        placeholder={t("marketingHighlightPlaceholder")}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addMarketingHighlightRu();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addMarketingHighlightRu}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t("actions.add")}
                      </Button>
                    </div>
                    {marketingHighlightsRu.length > 0 && (
                      <div className="space-y-2">
                        {marketingHighlightsRu.map((highlight, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                          >
                            <span className="flex-1">{highlight}</span>
                            <Button
                              type="button"
                              onClick={() => removeMarketingHighlightRu(index)}
                              variant="ghost"
                              size="sm"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6 mt-6">
              <EnhancedMediaUpload
                gemstoneId={gemstone?.id}
                serialNumber={formData.serial_number}
                onUploadComplete={(results) => {
                  setUploadedMedia((prev) => [...prev, ...results]);
                }}
                onUploadError={(error) => {
                  setErrors((prev) => ({ ...prev, media: error }));
                }}
                disabled={isLoading}
              />
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {gemstone ? t("actions.update") : t("actions.create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
