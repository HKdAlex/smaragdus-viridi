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
import { FlexibleSelect } from "@/shared/components/ui/flexible-select";
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
    // CUT-C3.1: GEM_CUTS removed - using CutsService instead
    METADATA_STATUSES,
} from "@/shared/services/database-enums";
import { CutsService } from "@/shared/services/cuts-service";
import type { Cut, DatabaseGemstone, DatabaseOrigin } from "@/shared/types";
import {
    AlertCircle,
    Brain,
    DollarSign,
    FileText,
    Gem,
    Image as ImageIcon,
    Loader2,
    Minus,
    Plus,
    RefreshCw,
    Save,
    Sparkles,
    X
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    GemstoneAdminService,
    type GemstoneFormData,
    type GemstoneWithRelations,
} from "../services/gemstone-admin-service";
import {
    MediaUploadService,
    type MediaUploadResult,
} from "../services/media-upload-service";
import { CertificationManager } from "./certification-manager";
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
  const metadataStatusOptions = METADATA_STATUSES.map((status) => ({
    value: status,
    label: t(`metadataStatusOptions.${status}` as any),
  }));
  const parseCurrencyInput = (value: string): number | undefined => {
    if (value.trim() === "") {
      return undefined;
    }
    const numeric = parseFloat(value);
    // Return undefined for NaN, otherwise convert dollars to cents
    return Number.isNaN(numeric) ? undefined : Math.round(numeric * 100);
  };

  // Helper to format cents for display (convert to dollars)
  const formatCentsToDollars = (cents: number | null | undefined): string => {
    if (cents === null || cents === undefined) return "";
    return (cents / 100).toFixed(2);
  };

  const parseDimensionValue = (
    value: number | string | null | undefined
  ): number => {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const normalized = parseFloat(value.replace(",", "."));
    return Number.isFinite(normalized) ? normalized : 0;
  };

  const handlePriceAmountChange = (value: string) => {
    // parseCurrencyInput converts dollars to cents (multiplies by 100)
    // Input value is always in dollars, so this is correct
    const cents = parseCurrencyInput(value);
    setFormData((prev) => {
      const next = {
        ...prev,
        price_amount: cents ?? 0,
      };

      // Auto-calculate price_per_carat only if:
      // 1. User hasn't manually set it
      // 2. We have a valid price amount
      // 3. We have a valid weight
      if (
        !hasManualPricePerCarat &&
        cents !== undefined &&
        cents > 0 &&
        prev.weight_carats > 0
      ) {
        // Calculate cents per carat: total cents / weight
        // Both are in cents, so this is correct
        next.price_per_carat = Math.round(cents / prev.weight_carats);
      }

      return next;
    });

    if (errors.price_amount) {
      setErrors((prev) => ({ ...prev, price_amount: "" }));
    }
  };

  const handlePricePerCaratChange = (value: string) => {
    // parseCurrencyInput converts dollars to cents (multiplies by 100)
    // Input value is always in dollars, so this is correct
    const cents = parseCurrencyInput(value);
    setHasManualPricePerCarat(value.trim() !== "");
    setFormData((prev) => {
      const next = { ...prev };
      if (value.trim() === "") {
        next.price_per_carat = null;
        setHasManualPricePerCarat(false);
      } else if (cents !== undefined && cents >= 0) {
        // Store price_per_carat in cents (already converted by parseCurrencyInput)
        next.price_per_carat = cents;
        // Recalculate total price: cents per carat * weight in carats
        // Both are in correct units (cents and carats), so this is correct
        if (prev.weight_carats > 0) {
          next.price_amount = Math.round(cents * prev.weight_carats);
        }
      }
      return next;
    });

    if (errors.price_per_carat) {
      setErrors((prev) => ({ ...prev, price_per_carat: "" }));
    }
  };

  const handleWeightChange = (value: number) => {
    setFormData((prev) => {
      const next = { ...prev, weight_carats: value };
      if (
        prev.price_per_carat &&
        prev.price_per_carat > 0 &&
        value > 0 &&
        hasManualPricePerCarat
      ) {
        next.price_amount = Math.round(prev.price_per_carat * value);
      }
      return next;
    });

    if (errors.weight_carats) {
      setErrors((prev) => ({ ...prev, weight_carats: "" }));
    }
  };

  const handleAutoCalculatePricePerCarat = () => {
    if (formData.price_amount > 0 && formData.weight_carats > 0) {
      // Calculate cents per carat: total cents / weight in carats
      // formData.price_amount is in CENTS, weight_carats is in carats
      // Result is cents per carat (which will be displayed as dollars by dividing by 100)
      const calculated = Math.round(
        formData.price_amount / formData.weight_carats
      );
      setFormData((prev) => ({
        ...prev,
        price_per_carat: calculated,
      }));
      setHasManualPricePerCarat(false);
      if (errors.price_per_carat) {
        setErrors((prev) => ({ ...prev, price_per_carat: "" }));
      }
    }
  };

  const {
    translateGemstoneType,
    translateColor,
    translateCut,
    translateClarity,
    translateOrigin,
  } = useGemstoneTranslations();
  const router = useRouter();

  // Memoized options for FlexibleSelect components (FLEX-C1.x)
  const gemstoneTypeOptions = useMemo(
    () =>
      GEMSTONE_TYPES.map((type) => ({
        value: type,
        label: translateGemstoneType(type),
      })),
    [translateGemstoneType]
  );

  const colorOptions = useMemo(
    () =>
      GEM_COLORS.map((color) => ({
        value: color,
        label: translateColor(color),
      })),
    [translateColor]
  );

  const clarityOptions = useMemo(
    () =>
      GEM_CLARITIES.map((clarity) => ({
        value: clarity,
        label: translateClarity(clarity),
      })),
    [translateClarity]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [origins, setOrigins] = useState<DatabaseOrigin[]>([]);
  const [cuts, setCuts] = useState<Cut[]>([]); // CUT-C3.1: Database cuts

  // CUT-C3.1: Use database cuts with inline translations
  // Note: Must be after cuts state declaration
  const cutOptions = useMemo(
    () => {
      // Use database cuts with inline translations
      // Detect locale from translateCut output (if Russian translation exists)
      const isRussian = translateCut("round") !== "Round Brilliant";
      return cuts.map((cut) => ({
        value: cut.code,
        label: isRussian ? cut.name_ru : cut.name_en,
      }));
    },
    [cuts, translateCut]
  );
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
  const [hasManualPricePerCarat, setHasManualPricePerCarat] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGenerationStatus, setAiGenerationStatus] = useState<{
    success?: boolean;
    message?: string;
    confidence?: number;
  } | null>(null);

  const [formData, setFormData] = useState<GemstoneFormData>(() => {
    return {
      name: gemstone?.name || DEFAULT_GEMSTONE_VALUES.type,
      color: gemstone?.color || DEFAULT_GEMSTONE_VALUES.color,
      cut_code: gemstone?.cut_code || DEFAULT_GEMSTONE_VALUES.cut_code, // CUT-C3.1
      cut_id: (gemstone as any)?.cut_id || "", // FK to cuts table (required)
      clarity: gemstone?.clarity || DEFAULT_GEMSTONE_VALUES.clarity,
      // Custom text fields for flexible admin entry (FLEX-C1.x)
      name_custom: (gemstone as any)?.name_custom || undefined,
      color_custom: (gemstone as any)?.color_custom || undefined,
      cut_custom: (gemstone as any)?.cut_custom || undefined,
      clarity_custom: (gemstone as any)?.clarity_custom || undefined,
      // Detailed property fields (FLEX-C1.5)
      treatment_status: (gemstone as any)?.treatment_status || undefined,
      color_change_description: (gemstone as any)?.color_change_description || undefined,
      mining_country: (gemstone as any)?.mining_country || undefined,
      cutting_country: (gemstone as any)?.cutting_country || undefined,
      quality_classification: (gemstone as any)?.quality_classification || undefined,
      enhancement_notes: (gemstone as any)?.enhancement_notes || undefined,
      weight_carats: gemstone?.weight_carats || 0,
      length_mm: parseDimensionValue(gemstone?.length_mm),
      width_mm: parseDimensionValue(gemstone?.width_mm),
      depth_mm: parseDimensionValue(gemstone?.depth_mm),
      origin_id: gemstone?.origin_id || undefined,
      price_amount: gemstone?.price_amount || 0,
      price_currency:
        gemstone?.price_currency || DEFAULT_GEMSTONE_VALUES.currency,
      premium_price_amount: gemstone?.premium_price_amount || undefined,
      premium_price_currency: gemstone?.premium_price_currency || undefined,
      price_per_carat: gemstone?.price_per_carat ?? null,
      in_stock: gemstone?.in_stock ?? true,
      metadata_status: gemstone?.metadata_status ?? "needs_review",
      quantity: gemstone?.quantity ?? 1,
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
      // Individual stones (already transformed by API)
      individual_stones: gemstone?.individual_stones || undefined,
    };
  });

  // Load origins and cuts for dropdowns
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

    // CUT-C1.2: Load cuts from database
    const loadCuts = async () => {
      try {
        const cutsData = await CutsService.getAllCuts();
        setCuts(cutsData);
      } catch (error) {
        console.error("Failed to load cuts:", error);
      }
    };

    loadOrigins();
    loadCuts();
  }, []);

  // Update form data when gemstone changes
  useEffect(() => {
    if (gemstone) {
      setFormData({
        name: gemstone.name || DEFAULT_GEMSTONE_VALUES.type,
        color: gemstone.color || DEFAULT_GEMSTONE_VALUES.color,
        cut_code: gemstone.cut_code || DEFAULT_GEMSTONE_VALUES.cut_code, // CUT-C3.1
        cut_id: (gemstone as any)?.cut_id || "", // FK to cuts table (required)
        clarity: gemstone.clarity || DEFAULT_GEMSTONE_VALUES.clarity,
        // Custom text fields for flexible admin entry (FLEX-C1.x)
        name_custom: (gemstone as any)?.name_custom || undefined,
        color_custom: (gemstone as any)?.color_custom || undefined,
        cut_custom: (gemstone as any)?.cut_custom || undefined,
        clarity_custom: (gemstone as any)?.clarity_custom || undefined,
        // Detailed property fields (FLEX-C1.5)
        treatment_status: (gemstone as any)?.treatment_status || undefined,
        color_change_description: (gemstone as any)?.color_change_description || undefined,
        mining_country: (gemstone as any)?.mining_country || undefined,
        cutting_country: (gemstone as any)?.cutting_country || undefined,
        quality_classification: (gemstone as any)?.quality_classification || undefined,
        enhancement_notes: (gemstone as any)?.enhancement_notes || undefined,
        weight_carats: gemstone.weight_carats || 0,
        length_mm: parseDimensionValue(gemstone.length_mm),
        width_mm: parseDimensionValue(gemstone.width_mm),
        depth_mm: parseDimensionValue(gemstone.depth_mm),
        origin_id: gemstone.origin_id || undefined,
        // price_amount is stored in CENTS in the database
        price_amount: gemstone.price_amount || 0,
        price_currency:
          gemstone.price_currency || DEFAULT_GEMSTONE_VALUES.currency,
        premium_price_amount: gemstone.premium_price_amount || undefined,
        premium_price_currency: gemstone.premium_price_currency || undefined,
        // price_per_carat is also stored in CENTS in the database
        price_per_carat: gemstone.price_per_carat ?? null,
        in_stock: gemstone.in_stock ?? true,
        metadata_status: gemstone.metadata_status ?? null,
        quantity: gemstone.quantity ?? 1,
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
        // Individual stones (already transformed by API)
        individual_stones: gemstone.individual_stones || undefined,
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
      setHasManualPricePerCarat(false);
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

  /**
   * Handle flexible name field change (FLEX-C1.1)
   * - If value matches a known enum, set both `name` (enum) and `name_custom` (text)
   * - If value is custom, set `name` to default and `name_custom` to the custom value
   */
  const handleFlexibleNameChange = useCallback(
    (value: string, isKnownValue: boolean) => {
      setFormData((prev) => {
        if (isKnownValue) {
          // Value matches a known gemstone type enum
          const enumValue = GEMSTONE_TYPES.find(
            (type) =>
              type.toLowerCase() === value.toLowerCase() ||
              translateGemstoneType(type).toLowerCase() === value.toLowerCase()
          );
          return {
            ...prev,
            name: enumValue || prev.name,
            name_custom: value, // Store the display value
          };
        } else {
          // Custom value - keep the enum at a default but store the custom text
          return {
            ...prev,
            // Keep existing enum value for filtering compatibility
            name: prev.name || DEFAULT_GEMSTONE_VALUES.type,
            name_custom: value,
          };
        }
      });
      // Clear error
      if (errors.name) {
        setErrors((prev) => ({ ...prev, name: "" }));
      }
    },
    [translateGemstoneType, errors.name]
  );

  /**
   * Handle flexible color field change (FLEX-C1.2)
   */
  const handleFlexibleColorChange = useCallback(
    (value: string, isKnownValue: boolean) => {
      setFormData((prev) => {
        if (isKnownValue) {
          const enumValue = GEM_COLORS.find(
            (color) =>
              color.toLowerCase() === value.toLowerCase() ||
              translateColor(color).toLowerCase() === value.toLowerCase()
          );
          return {
            ...prev,
            color: enumValue || prev.color,
            color_custom: value,
          };
        } else {
          return {
            ...prev,
            color: prev.color || DEFAULT_GEMSTONE_VALUES.color,
            color_custom: value,
          };
        }
      });
      if (errors.color) {
        setErrors((prev) => ({ ...prev, color: "" }));
      }
    },
    [translateColor, errors.color]
  );

  /**
   * Handle flexible cut field change (FLEX-C1.3, CUT-C1.2)
   * Updated to set cut_id from database cuts table
   */
  const handleFlexibleCutChange = useCallback(
    (value: string, isKnownValue: boolean) => {
      setFormData((prev) => {
        if (isKnownValue) {
          // CUT-C1.2: First try to find in database cuts
          const dbCut = cuts.find(
            (cut) =>
              cut.code.toLowerCase() === value.toLowerCase() ||
              cut.name_en.toLowerCase() === value.toLowerCase() ||
              cut.name_ru.toLowerCase() === value.toLowerCase()
          );
          // CUT-C3.1: Use cut_code from database cuts
          return {
            ...prev,
            cut_code: dbCut?.code ?? prev.cut_code,
            cut_id: dbCut?.id ?? prev.cut_id,
            cut_custom: value,
          };
        } else {
          // Custom cut - keep existing cut_id (required field)
          return {
            ...prev,
            cut_code: prev.cut_code || DEFAULT_GEMSTONE_VALUES.cut_code,
            cut_id: prev.cut_id,
            cut_custom: value,
          };
        }
      });
      if (errors.cut) {
        setErrors((prev) => ({ ...prev, cut: "" }));
      }
    },
    [cuts, translateCut, errors.cut]
  );

  /**
   * Handle flexible clarity field change (FLEX-C1.4)
   */
  const handleFlexibleClarityChange = useCallback(
    (value: string, isKnownValue: boolean) => {
      setFormData((prev) => {
        if (isKnownValue) {
          const enumValue = GEM_CLARITIES.find(
            (clarity) =>
              clarity.toLowerCase() === value.toLowerCase() ||
              translateClarity(clarity).toLowerCase() === value.toLowerCase()
          );
          return {
            ...prev,
            clarity: enumValue || prev.clarity,
            clarity_custom: value,
          };
        } else {
          return {
            ...prev,
            clarity: prev.clarity || DEFAULT_GEMSTONE_VALUES.clarity,
            clarity_custom: value,
          };
        }
      });
      if (errors.clarity) {
        setErrors((prev) => ({ ...prev, clarity: "" }));
      }
    },
    [translateClarity, errors.clarity]
  );

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
        else if (error.includes("per carat")) errorMap.price_per_carat = error;
        else if (error.includes("Quantity")) errorMap.quantity = error;
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
      // IMPORTANT: price_amount and price_per_carat are both in CENTS
      // The database trigger will recalculate price_amount from price_per_carat if price_per_carat changes
      // So we need to ensure both values are consistent before saving
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

      // Debug logging for price values
      if (submitData.price_amount !== undefined || submitData.price_per_carat !== undefined) {
        console.log(
          `[GemstoneForm] Submitting prices: ` +
          `price_amount=${submitData.price_amount} cents ($${(submitData.price_amount / 100).toFixed(2)}), ` +
          `price_per_carat=${submitData.price_per_carat !== null && submitData.price_per_carat !== undefined ? submitData.price_per_carat + ' cents ($' + (submitData.price_per_carat / 100).toFixed(2) + '/ct)' : 'null'}, ` +
          `weight=${submitData.weight_carats}ct`
        );
      }

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
        // Don't redirect - let the parent component handle the state change
        // The AdminGemstoneManager will switch to edit mode if needed
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

  /**
   * Generate AI content for the current gemstone
   * Calls the API endpoint to generate descriptions, stories, etc.
   */
  const handleGenerateAI = async () => {
    const startTime = Date.now();
    const requestId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!gemstone?.id) {
      console.warn(`[AI Generation] [${requestId}] Cannot generate: gemstone not saved yet`);
      setAiGenerationStatus({
        success: false,
        message: t("aiGeneration.saveFirst"),
      });
      return;
    }

    console.log(`[AI Generation] [${requestId}] Starting generation for gemstone: ${gemstone.id}`);
    console.log(`[AI Generation] [${requestId}] Gemstone info:`, {
      id: gemstone.id,
      serial_number: gemstone.serial_number,
      name: gemstone.name,
      has_existing_ai: !!formData.description_technical_en,
    });

    setIsGeneratingAI(true);
    setAiGenerationStatus(null);

    try {
      const fetchStart = Date.now();
      console.log(`[AI Generation] [${requestId}] Calling API: /api/admin/gemstones/${gemstone.id}/generate-ai`);
      
      const response = await fetch(`/api/admin/gemstones/${gemstone.id}/generate-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const fetchTime = Date.now() - fetchStart;
      console.log(`[AI Generation] [${requestId}] API response received in ${fetchTime}ms, status: ${response.status}`);

      const result = await response.json();
      console.log(`[AI Generation] [${requestId}] Response data:`, {
        success: result.success,
        has_data: !!result.data,
        confidence: result.data?.confidence,
        processingTime: result.data?.processingTime,
        cost: result.data?.cost,
        usedImages: result.data?.usedImages,
        requestId: result.requestId,
      });

      if (!response.ok) {
        console.error(`[AI Generation] [${requestId}] API error:`, {
          status: response.status,
          error: result.error,
          requestId: result.requestId,
          details: result.details,
        });
        setAiGenerationStatus({
          success: false,
          message: result.error || t("aiGeneration.error"),
        });
        return;
      }

      const totalTime = Date.now() - startTime;
      console.log(`[AI Generation] [${requestId}] Generation successful! Total time: ${totalTime}ms`);
      console.log(`[AI Generation] [${requestId}] Results:`, {
        confidence: result.data?.confidence,
        confidencePercent: result.data?.confidence ? `${(result.data.confidence * 100).toFixed(0)}%` : 'N/A',
        cost: result.data?.cost ? `$${result.data.cost.toFixed(4)}` : 'N/A',
        usedImages: result.data?.usedImages,
        numImages: result.data?.numImages,
      });

      setAiGenerationStatus({
        success: true,
        message: t("aiGeneration.success"),
        confidence: result.data?.confidence,
      });

      // Reload the gemstone data to get the new AI content
      // We need to refresh the form with the new AI-generated content
      console.log(`[AI Generation] [${requestId}] Reloading page to show new content...`);
      window.location.reload();
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`[AI Generation] [${requestId}] Error after ${errorTime}ms:`, error);
      if (error instanceof Error) {
        console.error(`[AI Generation] [${requestId}] Error message:`, error.message);
        console.error(`[AI Generation] [${requestId}] Error stack:`, error.stack);
      }
      setAiGenerationStatus({
        success: false,
        message: t("aiGeneration.error"),
      });
    } finally {
      setIsGeneratingAI(false);
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
          <Tabs defaultValue="basicInfo">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="basicInfo" className="text-xs md:text-sm">
                <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">{t("tabs.basicInfo")}</span>
              </TabsTrigger>
              <TabsTrigger value="pricingInventory" className="text-xs md:text-sm">
                <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">{t("tabs.pricingInventory")}</span>
              </TabsTrigger>
              <TabsTrigger value="ai-content" className="text-xs md:text-sm">
                <Brain className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">{t("tabs.aiContent")}</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs md:text-sm">
                <ImageIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">{t("tabs.media")}</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab - Combines Basic, Properties, Dimensions, Individual Stones */}
            <TabsContent value="basicInfo" className="space-y-8 mt-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {t("sections.basicInformation")}
                </h3>

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
            
              </div>

              {/* Properties Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {t("sections.properties")}
                </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.type")}
                  </label>
                  {/* FlexibleSelect for gemstone type (FLEX-C1.1) */}
                  <FlexibleSelect
                    value={formData.name_custom || translateGemstoneType(formData.name)}
                    onChange={handleFlexibleNameChange}
                    options={gemstoneTypeOptions}
                    placeholder={t("selectTypePlaceholder")}
                    error={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.color")}
                  </label>
                  {/* FlexibleSelect for color (FLEX-C1.2) */}
                  <FlexibleSelect
                    value={formData.color_custom || translateColor(formData.color)}
                    onChange={handleFlexibleColorChange}
                    options={colorOptions}
                    placeholder={t("selectColorPlaceholder")}
                    error={!!errors.color}
                  />
                  {errors.color && (
                    <p className="text-sm text-red-600">{errors.color}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.cut")}
                  </label>
                  {/* FlexibleSelect for cut (CUT-C3.1) */}
                  <FlexibleSelect
                    value={formData.cut_custom || translateCut(formData.cut_code)}
                    onChange={handleFlexibleCutChange}
                    options={cutOptions}
                    placeholder={t("selectCutPlaceholder")}
                    error={!!errors.cut}
                  />
                  {errors.cut && (
                    <p className="text-sm text-red-600">{errors.cut}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.clarity")}
                  </label>
                  {/* FlexibleSelect for clarity (FLEX-C1.4) */}
                  <FlexibleSelect
                    value={formData.clarity_custom || translateClarity(formData.clarity)}
                    onChange={handleFlexibleClarityChange}
                    options={clarityOptions}
                    placeholder={t("selectClarityPlaceholder")}
                    error={!!errors.clarity}
                  />
                  {errors.clarity && (
                    <p className="text-sm text-red-600">{errors.clarity}</p>
                  )}
                </div>
              </div>
            
              </div>

              {/* Detailed Properties Section (FLEX-C1.5) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {t("sections.detailedProperties")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="treatment_status" className="text-sm font-medium text-foreground">
                      {t("labels.treatmentStatus")}
                    </label>
                    <Input
                      id="treatment_status"
                      value={formData.treatment_status || ""}
                      onChange={(e) =>
                        handleInputChange("treatment_status", e.target.value || null)
                      }
                      placeholder={t("placeholders.treatmentStatus")}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("hints.treatmentStatus")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="color_change_description" className="text-sm font-medium text-foreground">
                      {t("labels.colorChangeDescription")}
                    </label>
                    <Input
                      id="color_change_description"
                      value={formData.color_change_description || ""}
                      onChange={(e) =>
                        handleInputChange("color_change_description", e.target.value || null)
                      }
                      placeholder={t("placeholders.colorChangeDescription")}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("hints.colorChangeDescription")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="quality_classification" className="text-sm font-medium text-foreground">
                      {t("labels.qualityClassification")}
                    </label>
                    <Input
                      id="quality_classification"
                      value={formData.quality_classification || ""}
                      onChange={(e) =>
                        handleInputChange("quality_classification", e.target.value || null)
                      }
                      placeholder={t("placeholders.qualityClassification")}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("hints.qualityClassification")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mining_country" className="text-sm font-medium text-foreground">
                      {t("labels.miningCountry")}
                    </label>
                    <Input
                      id="mining_country"
                      value={formData.mining_country || ""}
                      onChange={(e) =>
                        handleInputChange("mining_country", e.target.value || null)
                      }
                      placeholder={t("placeholders.miningCountry")}
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("hints.miningCountry")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cutting_country" className="text-sm font-medium text-foreground">
                      {t("labels.cuttingCountry")}
                    </label>
                    <Input
                      id="cutting_country"
                      value={formData.cutting_country || ""}
                      onChange={(e) =>
                        handleInputChange("cutting_country", e.target.value || null)
                      }
                      placeholder={t("placeholders.cuttingCountry")}
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("hints.cuttingCountry")}
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <label htmlFor="enhancement_notes" className="text-sm font-medium text-foreground">
                      {t("labels.enhancementNotes")}
                    </label>
                    <Textarea
                      id="enhancement_notes"
                      value={formData.enhancement_notes || ""}
                      onChange={(e) =>
                        handleInputChange("enhancement_notes", e.target.value || null)
                      }
                      placeholder={t("placeholders.enhancementNotes")}
                      rows={3}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {t("sections.dimensions")}
                </h3>

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
                      handleWeightChange(parseFloat(e.target.value) || 0)
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
                    step="0.01"
                    min="0"
                    value={formData.length_mm}
                    onChange={(e) =>
                      handleInputChange(
                        "length_mm",
                        e.target.value === ""
                          ? 0
                          : parseDimensionValue(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="width">{t("labels.width")}</label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.width_mm}
                    onChange={(e) =>
                      handleInputChange(
                        "width_mm",
                        e.target.value === ""
                          ? 0
                          : parseDimensionValue(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="depth">{t("labels.depth")}</label>
                  <Input
                    id="depth"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.depth_mm}
                    onChange={(e) =>
                      handleInputChange(
                        "depth_mm",
                        e.target.value === ""
                          ? 0
                          : parseDimensionValue(e.target.value)
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
                {origins.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t("hints.originEmpty")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("hints.origin")}
                </p>
              </div>
            
              </div>

              {/* Individual Stones Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {t("sections.individualStones")}
                </h3>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gem className="w-5 h-5" />
                  <h3 className="text-lg font-medium">
                    {t("labels.individualStones")}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    ({formData.quantity} {t("labels.totalQuantity")})
                  </span>
                </div>

                {(formData.quantity ?? 0) > 1 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t("descriptions.individualStones")}
                    </p>

                    <div className="grid gap-4">
                      {Array.from(
                        { length: formData.quantity ?? 0 },
                        (_, index) => {
                          const stoneNumber = index + 1;
                          const existingStone =
                            formData.individual_stones?.find(
                              (stone) => stone.stone_number === stoneNumber
                            );

                          return (
                            <Card key={stoneNumber} className="p-4">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                  {t("labels.stoneNumber", {
                                    number: stoneNumber,
                                  })}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      {t("labels.length")} (mm)
                                    </label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={
                                        existingStone?.dimensions?.length_mm ||
                                        ""
                                      }
                                      onChange={(e) => {
                                        const value =
                                          parseFloat(e.target.value) || 0;
                                        setFormData((prev) => {
                                          const stones = [
                                            ...(prev.individual_stones || []),
                                          ];
                                          const existingIndex =
                                            stones.findIndex(
                                              (s) =>
                                                s.stone_number === stoneNumber
                                            );

                                          const stoneData = {
                                            id:
                                              existingStone?.id ||
                                              `temp-${stoneNumber}`,
                                            stone_number: stoneNumber,
                                            gemstone_id: gemstone?.id || "temp",
                                            dimensions: {
                                              length_mm: value,
                                              width_mm:
                                                existingStone?.dimensions
                                                  ?.width_mm || 0,
                                              depth_mm:
                                                existingStone?.dimensions
                                                  ?.depth_mm || 0,
                                            },
                                            created_at:
                                              existingStone?.created_at || null,
                                            updated_at:
                                              existingStone?.updated_at || null,
                                          };

                                          if (existingIndex >= 0) {
                                            stones[existingIndex] = stoneData;
                                          } else {
                                            stones.push(stoneData);
                                          }

                                          return {
                                            ...prev,
                                            individual_stones: stones,
                                          };
                                        });
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      {t("labels.width")} (mm)
                                    </label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={
                                        existingStone?.dimensions?.width_mm ||
                                        ""
                                      }
                                      onChange={(e) => {
                                        const value =
                                          parseFloat(e.target.value) || 0;
                                        setFormData((prev) => {
                                          const stones = [
                                            ...(prev.individual_stones || []),
                                          ];
                                          const existingIndex =
                                            stones.findIndex(
                                              (s) =>
                                                s.stone_number === stoneNumber
                                            );

                                          const stoneData = {
                                            id:
                                              existingStone?.id ||
                                              `temp-${stoneNumber}`,
                                            stone_number: stoneNumber,
                                            gemstone_id: gemstone?.id || "temp",
                                            dimensions: {
                                              length_mm:
                                                existingStone?.dimensions
                                                  ?.length_mm || 0,
                                              width_mm: value,
                                              depth_mm:
                                                existingStone?.dimensions
                                                  ?.depth_mm || 0,
                                            },
                                            created_at:
                                              existingStone?.created_at || null,
                                            updated_at:
                                              existingStone?.updated_at || null,
                                          };

                                          if (existingIndex >= 0) {
                                            stones[existingIndex] = stoneData;
                                          } else {
                                            stones.push(stoneData);
                                          }

                                          return {
                                            ...prev,
                                            individual_stones: stones,
                                          };
                                        });
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      {t("labels.depth")} (mm)
                                    </label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={
                                        existingStone?.dimensions?.depth_mm ||
                                        ""
                                      }
                                      onChange={(e) => {
                                        const value =
                                          parseFloat(e.target.value) || 0;
                                        setFormData((prev) => {
                                          const stones = [
                                            ...(prev.individual_stones || []),
                                          ];
                                          const existingIndex =
                                            stones.findIndex(
                                              (s) =>
                                                s.stone_number === stoneNumber
                                            );

                                          const stoneData = {
                                            id:
                                              existingStone?.id ||
                                              `temp-${stoneNumber}`,
                                            stone_number: stoneNumber,
                                            gemstone_id: gemstone?.id || "temp",
                                            dimensions: {
                                              length_mm:
                                                existingStone?.dimensions
                                                  ?.length_mm || 0,
                                              width_mm:
                                                existingStone?.dimensions
                                                  ?.width_mm || 0,
                                              depth_mm: value,
                                            },
                                            created_at:
                                              existingStone?.created_at || null,
                                            updated_at:
                                              existingStone?.updated_at || null,
                                          };

                                          if (existingIndex >= 0) {
                                            stones[existingIndex] = stoneData;
                                          } else {
                                            stones.push(stoneData);
                                          }

                                          return {
                                            ...prev,
                                            individual_stones: stones,
                                          };
                                        });
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gem className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t("messages.singleStoneOnly")}</p>
                  </div>
                )}
              </div>
            
              </div>
            </TabsContent>

            {/* Pricing & Inventory Tab - Combines Pricing and Inventory */}
            <TabsContent value="pricingInventory" className="space-y-8 mt-6">
              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {t("sections.pricing")}
                </h3>

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
                      value={
                        formData.price_amount > 0
                          ? formData.price_amount / 100
                          : ""
                      } // Convert from cents to dollars for display
                      onChange={(e) => handlePriceAmountChange(e.target.value)}
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
                        formData.premium_price_amount &&
                        formData.premium_price_amount > 0
                          ? formData.premium_price_amount / 100
                          : ""
                      } // Convert from cents to dollars for display
                      onChange={(e) =>
                        handleInputChange(
                          "premium_price_amount",
                          e.target.value && e.target.value.trim() !== ""
                            ? Math.round(parseFloat(e.target.value) * 100)
                            : undefined
                        )
                      }
                      placeholder={t("optionalPlaceholder")}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="price_per_carat">
                    {t("labels.pricePerCarat")}
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        id="price_per_carat"
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formData.price_per_carat !== undefined &&
                          formData.price_per_carat !== null &&
                          formData.price_per_carat > 0
                            ? formData.price_per_carat / 100
                            : ""
                        } // Convert from cents to dollars for display
                        onChange={(e) =>
                          handlePricePerCaratChange(e.target.value)
                        }
                        placeholder="0.00"
                        className={`flex-1 ${
                          errors.price_per_carat ? "border-red-500" : ""
                        }`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAutoCalculatePricePerCarat}
                        disabled={
                          !(formData.price_amount > 0 && formData.weight_carats)
                        }
                      >
                        {t("actions.autoCalculatePricePerCarat")}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("hints.pricePerCaratHelper")}
                    </p>
                    {errors.price_per_carat && (
                      <p className="text-sm text-red-600">
                        {errors.price_per_carat}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            
              </div>

              {/* Inventory Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {t("sections.inventory")}
                </h3>

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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("labels.metadataStatus")}
                  </label>
                  <Select
                    value={formData.metadata_status ?? ""}
                    onValueChange={(value) =>
                      handleInputChange("metadata_status", value || null)
                    }
                  >
                    <SelectTrigger
                      className={errors.metadata_status ? "border-red-500" : ""}
                    >
                      <span className="text-sm">
                        {formData.metadata_status
                          ? metadataStatusOptions.find(
                              (option) =>
                                option.value === formData.metadata_status
                            )?.label ?? formData.metadata_status
                          : t("metadataStatusNotSet")}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        {t("metadataStatusNotSet")}
                      </SelectItem>
                      {metadataStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.metadata_status && (
                    <p className="text-sm text-red-600">
                      {errors.metadata_status}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="quantity">{t("labels.quantity")}</label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={
                      typeof formData.quantity === "number"
                        ? formData.quantity
                        : formData.quantity ?? ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange(
                        "quantity",
                        value === ""
                          ? undefined
                          : Math.max(0, parseInt(value, 10) || 0)
                      );
                    }}
                    className={errors.quantity ? "border-red-500" : ""}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-600">{errors.quantity}</p>
                  )}
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
            
              </div>
            </TabsContent>

            {/* AI Content Tab */}
            <TabsContent value="ai-content" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gem className="w-5 h-5" />
                    <h3 className="text-lg font-medium">
                      {t("labels.aiGeneratedContent")}
                    </h3>
                  </div>
                  
                  {/* AI Generation Button */}
                  <div className="flex items-center gap-3">
                    {aiGenerationStatus && (
                      <div
                        className={`text-sm px-3 py-1 rounded-md ${
                          aiGenerationStatus.success
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {aiGenerationStatus.message}
                        {aiGenerationStatus.confidence && (
                          <span className="ml-2 text-xs opacity-75">
                            ({t("aiGeneration.confidence")}: {(aiGenerationStatus.confidence * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant={formData.description_technical_en ? "outline" : "default"}
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI || !gemstone?.id}
                      className="gap-2"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("aiGeneration.generating")}
                        </>
                      ) : formData.description_technical_en ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          {t("aiGeneration.regenerate")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {t("aiGeneration.generate")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {!gemstone?.id && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {t("aiGeneration.saveFirst")}
                  </div>
                )}

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

              {/* Certifications Section */}
              {gemstone?.id && (
                <div className="mt-8">
                  <CertificationManager gemstoneId={gemstone.id} />
                </div>
              )}
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