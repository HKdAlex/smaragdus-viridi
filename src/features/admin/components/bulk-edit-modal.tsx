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
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { DatabaseGemstone } from "@/shared/types";
import {
  GemstoneAdminService,
  type GemstoneFormData,
} from "../services/gemstone-admin-service";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGemstones: Set<string>;
  onSuccess: (updatedCount: number) => void;
}

interface BulkEditData {
  // Pricing
  updatePrice: boolean;
  priceAmount?: number;
  priceCurrency?: string;
  premium_price_currency?: string;

  // Stock
  updateStock: boolean;
  inStock?: boolean;
  deliveryDays?: number;

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
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    "select" | "confirm" | "processing" | "results"
  >("select");
  const [selectedGemstonesData, setSelectedGemstonesData] = useState<
    DatabaseGemstone[]
  >([]);
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({
    updatePrice: false,
    updateStock: false,
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

  // Load selected gemstones data when modal opens
  useEffect(() => {
    if (isOpen && selectedGemstones.size > 0) {
      loadSelectedGemstones();
    }
  }, [isOpen, selectedGemstones]);

  const loadSelectedGemstones = async () => {
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
      console.error("Failed to load selected gemstones:", error);
    }
  };

  const resetModal = () => {
    setStep("select");
    setSelectedGemstonesData([]);
    setBulkEditData({
      updatePrice: false,
      updateStock: false,
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

          if (
            bulkEditData.updatePrice &&
            bulkEditData.priceAmount !== undefined
          ) {
            formDataUpdates.price_amount = bulkEditData.priceAmount;
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
                `Failed to update ${gemstone.serial_number}: ${result.error}`
              );
            }
          } else {
            successCount++; // No changes needed
          }
        } catch (error) {
          failedCount++;
          errors.push(`Error updating ${gemstone.serial_number}: ${error}`);
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
        errors: ["System error occurred during bulk update"],
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Bulk Edit Gemstones
          </h2>
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
                      {selectedGemstonesData.length} Gemstones Selected
                    </h3>
                    <p className="text-sm text-blue-700">
                      Choose which fields to update for all selected gemstones
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
                      <CardTitle className="text-lg">Update Price</CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updatePrice && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Price Amount (USD)
                          </label>
                          <Input
                            type="number"
                            placeholder="12500"
                            value={bulkEditData.priceAmount || ""}
                            onChange={(e) =>
                              setBulkEditData((prev) => ({
                                ...prev,
                                priceAmount:
                                  parseInt(e.target.value) * 100 || undefined,
                              }))
                            }
                          />
                          {bulkEditData.priceAmount && (
                            <p className="text-xs text-gray-600 mt-1">
                              Will set to{" "}
                              {formatCurrency(bulkEditData.priceAmount)}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Currency
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
                              <SelectValue />
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
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Premium Currency (Optional)
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
                              <SelectValue placeholder="Same as regular" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Same as regular</SelectItem>
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
                        Update Stock Status
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updateStock && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Stock Status
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
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">In Stock</SelectItem>
                              <SelectItem value="false">
                                Out of Stock
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Delivery Days
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
                        Update Description
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updateDescription && (
                    <CardContent>
                      <Textarea
                        placeholder="Enter new description..."
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
                        Update Promotional Text
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updatePromotionalText && (
                    <CardContent>
                      <Textarea
                        placeholder="Enter promotional text..."
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
                        Update Internal Code
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {bulkEditData.updateInternalCode && (
                    <CardContent>
                      <Input
                        placeholder="Enter internal code..."
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
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  disabled={getSelectedFieldsCount() === 0}
                >
                  Review Changes
                </Button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirm Bulk Update
                </h3>
                <p className="text-gray-600 mb-6">
                  You are about to update {selectedGemstonesData.length}{" "}
                  gemstones. This action cannot be undone.
                </p>
              </div>

              {/* Changes Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Changes to Apply</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bulkEditData.updatePrice && (
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="font-medium">Price:</span>
                      <span>
                        {formatCurrency(bulkEditData.priceAmount!)} (
                        {bulkEditData.priceCurrency})
                      </span>
                    </div>
                  )}

                  {bulkEditData.updateStock && (
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="font-medium">Stock Status:</span>
                      <span>
                        {bulkEditData.inStock ? "In Stock" : "Out of Stock"}
                        {bulkEditData.deliveryDays &&
                          ` (${bulkEditData.deliveryDays} days)`}
                      </span>
                    </div>
                  )}

                  {bulkEditData.updateDescription && (
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="font-medium mb-1">Description:</div>
                      <div className="text-sm text-gray-600">
                        {bulkEditData.description}
                      </div>
                    </div>
                  )}

                  {bulkEditData.updatePromotionalText && (
                    <div className="p-2 bg-orange-50 rounded">
                      <div className="font-medium mb-1">Promotional Text:</div>
                      <div className="text-sm text-gray-600">
                        {bulkEditData.promotionalText}
                      </div>
                    </div>
                  )}

                  {bulkEditData.updateInternalCode && (
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Internal Code:</span>
                      <span>{bulkEditData.internalCode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep("select")}>
                  Back
                </Button>
                <Button onClick={handleBulkUpdate} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4 mr-2" />
                  )}
                  Apply Changes to {selectedGemstonesData.length} Gemstones
                </Button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Updating Gemstones...
              </h3>
              <p className="text-gray-600">
                Processing {selectedGemstonesData.length} gemstones
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
                  Bulk Update Complete
                </h3>
                <p className="text-gray-600">
                  {results.success} updated successfully, {results.failed}{" "}
                  failed
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
                    <div className="text-sm text-green-700">Updated</div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-900">
                      {results.failed}
                    </div>
                    <div className="text-sm text-red-700">Failed</div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {results.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-900">
                      Update Errors
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
                  Close
                </Button>
                {results.success > 0 && (
                  <Button onClick={() => window.location.reload()}>
                    View Updated List
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
