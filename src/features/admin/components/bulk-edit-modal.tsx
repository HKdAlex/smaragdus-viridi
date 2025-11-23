"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { AlertTriangle, CheckCircle, Edit, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { DatabaseGemstone } from "@/shared/types";
import {
  GemstoneAdminService,
  type GemstoneFormData,
} from "../services/gemstone-admin-service";
import { useCurrency } from "@/features/currency/hooks/use-currency";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGemstones: Set<string>;
  onSuccess: (updatedCount: number) => void;
}

interface BulkEditData {
  // Pricing
  updatePrice: boolean;
  priceAmountCents?: number;
  priceAmountInput: string;
  pricePerCaratCents?: number;
  pricePerCaratInput: string;
  priceCurrency?: string;
  premium_price_currency?: string;

  // Stock
  updateStock: boolean;
  inStock?: boolean;
  deliveryDays?: number;
  quantity?: number;

  // Metadata
  updateMetadata: boolean;
  metadataStatus?: string;

  // Description
  updateDescription: boolean;
  description?: string;

  // Promotional Text
  updatePromotionalText: boolean;
  promotionalText?: string;

  // Origin (would need origin_id)
  updateOrigin: boolean;
  originId?: string;

  // Internal Code
  updateInternalCode: boolean;
  internalCode?: string;
}

export function BulkEditModal({
  isOpen,
  onClose,
  selectedGemstones,
  onSuccess,
}: BulkEditModalProps) {
  const t = useTranslations("admin.bulkEdit");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    "select" | "confirm" | "processing" | "results"
  >("select");
  const [selectedGemstonesData, setSelectedGemstonesData] = useState<
    DatabaseGemstone[]
  >([]);
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({
    updatePrice: false,
    priceAmountInput: "",
    pricePerCaratInput: "",
    updateStock: false,
    updateMetadata: false,
    updateDescription: false,
    updatePromotionalText: false,
    updateOrigin: false,
    updateInternalCode: false,
  });
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const loadSelectedGemstones = useCallback(async () => {
    try {
      const gemstoneIds = Array.from(selectedGemstones);
      const gemstones: DatabaseGemstone[] = [];

      // Load each gemstone (in a real app, you'd want a batch endpoint)
      for (const id of gemstoneIds) {
        const result = await GemstoneAdminService.getGemstoneById(id);
        if (result.success && result.data) {
          gemstones.push(result.data);
        }
      }

      setSelectedGemstonesData(gemstones);
    } catch (error) {
      console.error(t("errors.loadFailed"), error);
    }
  }, [selectedGemstones, t]);

  // Load selected gemstones data when modal opens
  useEffect(() => {
    if (isOpen && selectedGemstones.size > 0) {
      loadSelectedGemstones();
    }
  }, [isOpen, loadSelectedGemstones, selectedGemstones.size]);

  const resetModal = () => {
    setStep("select");
    setSelectedGemstonesData([]);
    setBulkEditData({
      updatePrice: false,
      priceAmountInput: "",
      pricePerCaratInput: "",
      updateStock: false,
      updateMetadata: false,
      updateDescription: false,
      updatePromotionalText: false,
      updateOrigin: false,
      updateInternalCode: false,
    });
    setResults(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleBulkUpdate = async () => {
    if (selectedGemstonesData.length === 0) return;

    setLoading(true);
    setStep("processing");

    try {
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process each gemstone
      for (const gemstone of selectedGemstonesData) {
        try {
          const updates: Partial<DatabaseGemstone> = {};

          // Build update object based on selected fields
          const formDataUpdates: Partial<GemstoneFormData> = {};

          if (bulkEditData.updatePrice) {
            if (bulkEditData.priceAmountCents !== undefined) {
              formDataUpdates.price_amount = bulkEditData.priceAmountCents;
            }
            if (bulkEditData.pricePerCaratCents !== undefined) {
              formDataUpdates.price_per_carat = bulkEditData.pricePerCaratCents;
            }
            if (bulkEditData.priceCurrency) {
              formDataUpdates.price_currency =
                bulkEditData.priceCurrency as DatabaseGemstone["price_currency"];
            }
          }

          if (bulkEditData.updateStock) {
            if (bulkEditData.inStock !== undefined) {
              formDataUpdates.in_stock = bulkEditData.inStock;
            }
            if (bulkEditData.deliveryDays !== undefined) {
              formDataUpdates.delivery_days = bulkEditData.deliveryDays;
            }
            if (bulkEditData.quantity !== undefined) {
              formDataUpdates.quantity = bulkEditData.quantity;
            }
          }

          if (bulkEditData.updateMetadata && bulkEditData.metadataStatus) {
            formDataUpdates.metadata_status =
              bulkEditData.metadataStatus as any;
          }

          if (
            bulkEditData.updateDescription &&
            bulkEditData.description !== undefined
          ) {
            formDataUpdates.description = bulkEditData.description;
          }

          if (
            bulkEditData.updatePromotionalText &&
            bulkEditData.promotionalText !== undefined
          ) {
            formDataUpdates.promotional_text = bulkEditData.promotionalText;
          }

          if (bulkEditData.updateOrigin && bulkEditData.originId) {
            formDataUpdates.origin_id = bulkEditData.originId;
          }

          if (
            bulkEditData.updateInternalCode &&
            bulkEditData.internalCode !== undefined
          ) {
            formDataUpdates.internal_code = bulkEditData.internalCode;
          }

          // Only update if there are changes
          if (Object.keys(formDataUpdates).length > 0) {
            const result = await GemstoneAdminService.updateGemstone(
              gemstone.id,
              formDataUpdates
            );
            if (result.success) {
              successCount++;
            } else {
              failedCount++;
              errors.push(
                t("errors.updateFailed", {
                  serialNumber: gemstone.serial_number,
                  error: result.error || "Unknown error",
                })
              );
            }
          } else {
            successCount++; // No changes needed
          }
        } catch (error) {
          failedCount++;
          errors.push(
            t("errors.updateError", {
              serialNumber: gemstone.serial_number,
              error: String(error),
            })
          );
        }
      }

      setResults({ success: successCount, failed: failedCount, errors });
      setStep("results");

      if (successCount > 0) {
        onSuccess(successCount);
      }
    } catch (error) {
      console.error("Bulk update failed:", error);
      setResults({
        success: 0,
        failed: selectedGemstonesData.length,
        errors: [t("errors.systemError")],
      });
      setStep("results");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedFieldsCount = () => {
    let count = 0;
    if (bulkEditData.updatePrice) count++;
    if (bulkEditData.updateStock) count++;
    if (bulkEditData.updateDescription) count++;
    if (bulkEditData.updatePromotionalText) count++;
    if (bulkEditData.updateOrigin) count++;
    if (bulkEditData.updateInternalCode) count++;
    return count;
  };

  // Use currency context for price formatting
  const { formatPrice, convertPrice } = useCurrency();
  
  const formatCurrency = (amount: number) => {
    // formatPrice handles conversion internally
    return formatPrice(amount, "USD");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === "select" && (
            <div className="space-y-6">
              {/* Selection Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Edit className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {t("selectedCount", {
                        count: selectedGemstonesData.length,
                      })}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {t("selectionDescription")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Field Selection */}
              <div className="space-y-4">
                {/* Price Update */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={bulkEditData.updatePrice}
                        onCheckedChange={(checked) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            updatePrice: checked as boolean,
                          }))
                        }
                      />
                      <CardTitle className="text-lg">
                        {t("updatePrice")}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updatePrice && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t("priceAmount")}
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="12500"
                            value={bulkEditData.priceAmountInput}
                            onChange={(e) =>
                              setBulkEditData((prev) => ({
                                ...prev,
                                priceAmountInput: e.target.value,
                                priceAmountCents:
                                  e.target.value.trim() === ""
                                    ? undefined
                                    : Number.isNaN(parseFloat(e.target.value))
                                    ? prev.priceAmountCents
                                    : Math.round(
                                        parseFloat(e.target.value) * 100
                                      ),
                              }))
                            }
                          />
                          {typeof bulkEditData.priceAmountCents ===
                            "number" && (
                            <p className="text-xs text-gray-600 mt-1">
                              {t("willSetTo", {
                                amount: formatCurrency(
                                  bulkEditData.priceAmountCents
                                ),
                              })}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t("currency")}
                          </label>
                          <Select
                            value={bulkEditData.priceCurrency || "USD"}
                            onValueChange={(value) =>
                              setBulkEditData((prev) => ({
                                ...prev,
                                priceCurrency: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <span className="text-sm">
                                {bulkEditData.priceCurrency || "USD"}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="RUB">RUB</SelectItem>
                              <SelectItem value="CHF">CHF</SelectItem>
                              <SelectItem value="JPY">JPY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">
                            {t("pricePerCarat")}
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1250.00"
                            value={bulkEditData.pricePerCaratInput}
                            onChange={(e) =>
                              setBulkEditData((prev) => ({
                                ...prev,
                                pricePerCaratInput: e.target.value,
                                pricePerCaratCents:
                                  e.target.value.trim() === ""
                                    ? undefined
                                    : Number.isNaN(parseFloat(e.target.value))
                                    ? prev.pricePerCaratCents
                                    : Math.round(
                                        parseFloat(e.target.value) * 100
                                      ),
                              }))
                            }
                          />
                          {typeof bulkEditData.pricePerCaratCents ===
                            "number" && (
                            <p className="text-xs text-gray-600 mt-1">
                              {t("pricePerCaratWillSetTo", {
                                amount: formatCurrency(
                                  bulkEditData.pricePerCaratCents
                                ),
                              })}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("pricePerCaratHint")}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t("premiumCurrency")}
                          </label>
                          <Select
                            value={bulkEditData.premium_price_currency || ""}
                            onValueChange={(value) =>
                              setBulkEditData((prev) => ({
                                ...prev,
                                premium_price_currency: value || undefined,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("sameAsRegular")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">
                                {t("sameAsRegular")}
                              </SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="RUB">RUB</SelectItem>
                              <SelectItem value="CHF">CHF</SelectItem>
                              <SelectItem value="JPY">JPY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Stock Update */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={bulkEditData.updateStock}
                        onCheckedChange={(checked) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            updateStock: checked as boolean,
                          }))
                        }
                      />
                      <CardTitle className="text-lg">
                        {t("updateStockStatus")}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updateStock && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t("stockStatus")}
                          </label>
                          <Select
                            value={bulkEditData.inStock?.toString() || "true"}
                            onValueChange={(value) =>
                              setBulkEditData((prev) => ({
                                ...prev,
                                inStock: value === "true",
                              }))
                            }
                          >
                            <SelectTrigger>
                              <span className="text-sm">
                                {bulkEditData.inStock === true
                                  ? t("inStock")
                                  : bulkEditData.inStock === false
                                  ? t("outOfStock")
                                  : t("inStock")}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">
                                {t("inStock")}
                              </SelectItem>
                              <SelectItem value="false">
                                {t("outOfStock")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t("deliveryDays")}
                          </label>
                          <Input
                            type="number"
                            placeholder="7"
                            value={bulkEditData.deliveryDays || ""}
                            onChange={(e) =>
                              setBulkEditData((prev) => ({
                                ...prev,
                                deliveryDays:
                                  parseInt(e.target.value) || undefined,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Description Update */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={bulkEditData.updateDescription}
                        onCheckedChange={(checked) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            updateDescription: checked as boolean,
                          }))
                        }
                      />
                      <CardTitle className="text-lg">
                        {t("updateDescription")}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updateDescription && (
                    <CardContent>
                      <Textarea
                        placeholder={t("descriptionPlaceholder")}
                        value={bulkEditData.description || ""}
                        onChange={(e) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            description: e.target.value || undefined,
                          }))
                        }
                        rows={3}
                      />
                    </CardContent>
                  )}
                </Card>

                {/* Promotional Text Update */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={bulkEditData.updatePromotionalText}
                        onCheckedChange={(checked) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            updatePromotionalText: checked as boolean,
                          }))
                        }
                      />
                      <CardTitle className="text-lg">
                        {t("updatePromotionalText")}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updatePromotionalText && (
                    <CardContent>
                      <Textarea
                        placeholder={t("promotionalTextPlaceholder")}
                        value={bulkEditData.promotionalText || ""}
                        onChange={(e) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            promotionalText: e.target.value || undefined,
                          }))
                        }
                        rows={2}
                      />
                    </CardContent>
                  )}
                </Card>

                {/* Internal Code Update */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={bulkEditData.updateInternalCode}
                        onCheckedChange={(checked) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            updateInternalCode: checked as boolean,
                          }))
                        }
                      />
                      <CardTitle className="text-lg">
                        {t("updateInternalCode")}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updateInternalCode && (
                    <CardContent>
                      <Input
                        placeholder={t("internalCodePlaceholder")}
                        value={bulkEditData.internalCode || ""}
                        onChange={(e) =>
                          setBulkEditData((prev) => ({
                            ...prev,
                            internalCode: e.target.value || undefined,
                          }))
                        }
                      />
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  disabled={getSelectedFieldsCount() === 0}
                >
                  {t("reviewChanges")}
                </Button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("confirmBulkUpdate")}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t("confirmBulkUpdateDescription", {
                    count: selectedGemstonesData.length,
                  })}
                </p>
              </div>

              {/* Changes Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("changesToApply")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bulkEditData.updatePrice && (
                    <div className="flex justify-between items-start gap-4 p-2 bg-blue-50 rounded">
                      <span className="font-medium">{t("price")}:</span>
                      <div className="text-right space-y-1">
                        {bulkEditData.priceAmountCents !== undefined && (
                          <div>
                            {formatCurrency(bulkEditData.priceAmountCents)} (
                            {bulkEditData.priceCurrency || "USD"})
                          </div>
                        )}
                        {bulkEditData.pricePerCaratCents !== undefined && (
                          <div className="text-sm text-blue-700">
                            {t("pricePerCaratSummary", {
                              amount: formatCurrency(
                                bulkEditData.pricePerCaratCents
                              ),
                            })}
                          </div>
                        )}
                        {bulkEditData.pricePerCaratCents === undefined &&
                          bulkEditData.priceAmountCents === undefined &&
                          bulkEditData.priceCurrency && (
                            <div>
                              {t("currencyOnlyUpdate", {
                                currency: bulkEditData.priceCurrency,
                              })}
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {bulkEditData.updateStock && (
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="font-medium">{t("stockStatus")}:</span>
                      <span>
                        {bulkEditData.inStock ? t("inStock") : t("outOfStock")}
                        {bulkEditData.deliveryDays &&
                          ` (${bulkEditData.deliveryDays} ${t("days")})`}
                      </span>
                    </div>
                  )}

                  {bulkEditData.updateDescription && (
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="font-medium mb-1">
                        {t("description")}:
                      </div>
                      <div className="text-sm text-gray-600">
                        {bulkEditData.description}
                      </div>
                    </div>
                  )}

                  {bulkEditData.updatePromotionalText && (
                    <div className="p-2 bg-orange-50 rounded">
                      <div className="font-medium mb-1">
                        {t("promotionalText")}:
                      </div>
                      <div className="text-sm text-gray-600">
                        {bulkEditData.promotionalText}
                      </div>
                    </div>
                  )}

                  {bulkEditData.updateInternalCode && (
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{t("internalCode")}:</span>
                      <span>{bulkEditData.internalCode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep("select")}>
                  {t("back")}
                </Button>
                <Button onClick={handleBulkUpdate} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4 mr-2" />
                  )}
                  {t("applyChangesToGemstones", {
                    count: selectedGemstonesData.length,
                  })}
                </Button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("updatingGemstones")}
              </h3>
              <p className="text-gray-600">
                {t("processingGemstones", {
                  count: selectedGemstonesData.length,
                })}
              </p>
            </div>
          )}

          {step === "results" && results && (
            <div className="space-y-6">
              <div className="text-center">
                {results.failed === 0 ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("bulkUpdateComplete")}
                </h3>
                <p className="text-gray-600">
                  {t("bulkUpdateResults", {
                    success: results.success,
                    failed: results.failed,
                  })}
                </p>
              </div>

              {/* Results Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900">
                      {results.success}
                    </div>
                    <div className="text-sm text-green-700">{t("updated")}</div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-900">
                      {results.failed}
                    </div>
                    <div className="text-sm text-red-700">{t("failed")}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {results.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-900">
                      {t("updateErrors")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {results.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-700">
                          {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  {t("close")}
                </Button>
                {results.success > 0 && (
                  <Button onClick={() => window.location.reload()}>
                    {t("viewUpdatedList")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
