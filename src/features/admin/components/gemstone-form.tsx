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
import { Textarea } from "@/shared/components/ui/textarea";
import type { DatabaseGemstone, DatabaseOrigin } from "@/shared/types";
import { AlertCircle, Gem, Loader2, Minus, Plus, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  GemstoneAdminService,
  type GemstoneFormData,
  type GemstoneWithRelations,
} from "../services/gemstone-admin-service";

interface GemstoneFormProps {
  gemstone?: GemstoneWithRelations;
  onSuccess?: (gemstone: DatabaseGemstone) => void;
  onCancel?: () => void;
}

const GEMSTONE_TYPES = [
  "diamond",
  "emerald",
  "ruby",
  "sapphire",
  "amethyst",
  "topaz",
  "garnet",
  "peridot",
  "citrine",
  "tanzanite",
] as const;

const GEM_COLORS = [
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "fancy-yellow",
  "fancy-blue",
  "fancy-pink",
  "fancy-green",
  "red",
  "blue",
  "green",
  "yellow",
  "pink",
  "white",
  "black",
  "colorless",
] as const;

const GEM_CUTS = [
  "round",
  "princess",
  "emerald",
  "oval",
  "marquise",
  "pear",
  "cushion",
  "radiant",
  "asscher",
  "heart",
  "fantasy",
] as const;

const GEM_CLARITIES = [
  "FL",
  "IF",
  "VVS1",
  "VVS2",
  "VS1",
  "VS2",
  "SI1",
  "SI2",
  "I1",
] as const;

const CURRENCIES = ["USD", "EUR", "GBP", "RUB", "CHF", "JPY"] as const;

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
  const [currentHighlight, setCurrentHighlight] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<GemstoneFormData>({
    name: gemstone?.name || "diamond",
    color: gemstone?.color || "D",
    cut: gemstone?.cut || "round",
    clarity: gemstone?.clarity || "FL",
    weight_carats: gemstone?.weight_carats || 0,
    length_mm: gemstone?.length_mm || 0,
    width_mm: gemstone?.width_mm || 0,
    depth_mm: gemstone?.depth_mm || 0,
    origin_id: gemstone?.origin_id || undefined,
    price_amount: gemstone?.price_amount || 0,
    price_currency: gemstone?.price_currency || "USD",
    premium_price_amount: gemstone?.premium_price_amount || undefined,
    premium_price_currency: gemstone?.premium_price_currency || undefined,
    in_stock: gemstone?.in_stock ?? true,
    delivery_days: gemstone?.delivery_days || undefined,
    internal_code: gemstone?.internal_code || undefined,
    serial_number: gemstone?.serial_number || "",
    description: gemstone?.description || undefined,
    promotional_text: gemstone?.promotional_text || undefined,
    marketing_highlights: gemstone?.marketing_highlights || undefined,
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

  // Load marketing highlights if editing
  useEffect(() => {
    if (gemstone?.marketing_highlights) {
      setMarketingHighlights(gemstone.marketing_highlights);
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

          {/* Basic Information */}
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
                <p className="text-sm text-red-600">{errors.serial_number}</p>
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

          {/* Gemstone Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("labels.type")}
              </label>
              <Select
                value={formData.name}
                onValueChange={(value) => handleInputChange("name", value)}
              >
                <SelectTrigger className={errors.name ? "border-red-500" : ""}>
                  <SelectValue />
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
                <SelectTrigger className={errors.color ? "border-red-500" : ""}>
                  <SelectValue />
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
                <SelectTrigger className={errors.cut ? "border-red-500" : ""}>
                  <SelectValue />
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
                onValueChange={(value) => handleInputChange("clarity", value)}
              >
                <SelectTrigger
                  className={errors.clarity ? "border-red-500" : ""}
                >
                  <SelectValue />
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

          {/* Dimensions and Weight */}
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
                <p className="text-sm text-red-600">{errors.weight_carats}</p>
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
                  handleInputChange("width_mm", parseFloat(e.target.value) || 0)
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
                  handleInputChange("depth_mm", parseFloat(e.target.value) || 0)
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

          {/* Pricing */}
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
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
                <p className="text-sm text-red-600">{errors.price_amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="premium_price">{t("labels.premiumPrice")}</label>
              <div className="flex gap-2">
                <Select
                  value={
                    formData.premium_price_currency || formData.price_currency
                  }
                  onValueChange={(value) =>
                    handleInputChange("premium_price_currency", value)
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
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

          {/* Stock and Delivery */}
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
              <label htmlFor="delivery_days">{t("labels.deliveryDays")}</label>
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

          {/* Description and Promotional Text */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="description">{t("labels.description")}</label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder={t("descriptionPlaceholder")}
                rows={4}
              />
            </div>

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
