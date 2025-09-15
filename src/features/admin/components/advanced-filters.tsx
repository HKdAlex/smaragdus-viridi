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
import { ChevronDown, ChevronUp, Filter, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useGemstoneTranslations } from "@/features/gemstones/utils/gemstone-translations";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { useTranslations } from "next-intl";

export interface AdvancedFiltersState {
  types: string[];
  colors: string[];
  cuts: string[];
  clarities: string[];
  priceMin?: number;
  priceMax?: number;
  weightMin?: number;
  weightMax?: number;
  stockStatus: "all" | "in_stock" | "out_of_stock";
  origins: string[];
}

interface AdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  isOpen: boolean;
  onToggle: () => void;
  availableOrigins?: string[];
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

export function AdvancedFilters({
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
  availableOrigins = [],
}: AdvancedFiltersProps) {
  const t = useTranslations("admin.advancedFilters");
  const {
    translateGemstoneType,
    translateColor,
    translateCut,
    translateClarity,
    translateOrigin,
  } = useGemstoneTranslations();
  const [localFilters, setLocalFilters] =
    useState<AdvancedFiltersState>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof AdvancedFiltersState, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMultiSelectChange = (
    key: "types" | "colors" | "cuts" | "clarities" | "origins",
    value: string,
    checked: boolean
  ) => {
    const currentValues = localFilters[key] as string[];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);

    handleFilterChange(key, newValues);
  };

  const handlePriceRangeChange = (min?: number, max?: number) => {
    const newFilters = {
      ...localFilters,
      priceMin: min,
      priceMax: max,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleWeightRangeChange = (min?: number, max?: number) => {
    const newFilters = {
      ...localFilters,
      weightMin: min,
      weightMax: max,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: AdvancedFiltersState = {
      types: [],
      colors: [],
      cuts: [],
      clarities: [],
      priceMin: undefined,
      priceMax: undefined,
      weightMin: undefined,
      weightMax: undefined,
      stockStatus: "all",
      origins: [],
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.types.length > 0) count++;
    if (localFilters.colors.length > 0) count++;
    if (localFilters.cuts.length > 0) count++;
    if (localFilters.clarities.length > 0) count++;
    if (localFilters.priceMin || localFilters.priceMax) count++;
    if (localFilters.weightMin || localFilters.weightMax) count++;
    if (localFilters.stockStatus !== "all") count++;
    if (localFilters.origins.length > 0) count++;
    return count;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)}крт`;
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {t("title")}
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFiltersCount()}
            </Badge>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {t("resetAll")}
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t("filterGemstones")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type Filter */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {t("gemstoneType")}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {GEMSTONE_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={localFilters.types.includes(type)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange(
                          "types",
                          type,
                          checked as boolean
                        )
                      }
                    />
                    <span className="text-sm">
                      {translateGemstoneType(type)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t("color")}</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {GEM_COLORS.map((color) => (
                  <label
                    key={color}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={localFilters.colors.includes(color)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange(
                          "colors",
                          color,
                          checked as boolean
                        )
                      }
                    />
                    <span className="text-sm">{translateColor(color)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cut Filter */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t("cut")}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GEM_CUTS.map((cut) => (
                  <label
                    key={cut}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={localFilters.cuts.includes(cut)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange("cuts", cut, checked as boolean)
                      }
                    />
                    <span className="text-sm">{translateCut(cut)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clarity Filter */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t("clarity")}</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {GEM_CLARITIES.map((clarity) => (
                  <label
                    key={clarity}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={localFilters.clarities.includes(clarity)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange(
                          "clarities",
                          clarity,
                          checked as boolean
                        )
                      }
                    />
                    <span className="text-sm">{translateClarity(clarity)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {t("priceRange")}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t("minPrice")}
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={localFilters.priceMin || ""}
                    onChange={(e) =>
                      handlePriceRangeChange(
                        e.target.value
                          ? parseInt(e.target.value) * 100
                          : undefined,
                        localFilters.priceMax
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t("maxPrice")}
                  </label>
                  <Input
                    type="number"
                    placeholder={t("noLimit")}
                    value={localFilters.priceMax || ""}
                    onChange={(e) =>
                      handlePriceRangeChange(
                        localFilters.priceMin,
                        e.target.value
                          ? parseInt(e.target.value) * 100
                          : undefined
                      )
                    }
                  />
                </div>
              </div>
              {(localFilters.priceMin || localFilters.priceMax) && (
                <p className="text-sm text-gray-600 mt-2">
                  {localFilters.priceMin
                    ? formatCurrency(localFilters.priceMin)
                    : "$0"}{" "}
                  -{" "}
                  {localFilters.priceMax
                    ? formatCurrency(localFilters.priceMax)
                    : "No limit"}
                </p>
              )}
            </div>

            {/* Weight Range */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {t("weightRange")}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t("minWeight")}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={localFilters.weightMin || ""}
                    onChange={(e) =>
                      handleWeightRangeChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                        localFilters.weightMax
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t("maxWeight")}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t("noLimit")}
                    value={localFilters.weightMax || ""}
                    onChange={(e) =>
                      handleWeightRangeChange(
                        localFilters.weightMin,
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              </div>
              {(localFilters.weightMin || localFilters.weightMax) && (
                <p className="text-sm text-gray-600 mt-2">
                  {localFilters.weightMin
                    ? formatWeight(localFilters.weightMin)
                    : "0ct"}{" "}
                  -{" "}
                  {localFilters.weightMax
                    ? formatWeight(localFilters.weightMax)
                    : "No limit"}
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {t("stockStatus")}
              </h4>
              <Select
                value={localFilters.stockStatus}
                onValueChange={(value) =>
                  handleFilterChange(
                    "stockStatus",
                    value as "all" | "in_stock" | "out_of_stock"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allItems")}</SelectItem>
                  <SelectItem value="in_stock">{t("inStockOnly")}</SelectItem>
                  <SelectItem value="out_of_stock">
                    {t("outOfStockOnly")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Origin Filter */}
            {availableOrigins.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {t("origin")}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableOrigins.map((origin) => (
                    <label
                      key={origin}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={localFilters.origins.includes(origin)}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange(
                            "origins",
                            origin,
                            checked as boolean
                          )
                        }
                      />
                      <span className="text-sm">{translateOrigin(origin)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {getActiveFiltersCount() > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">
                  Active Filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {localFilters.types.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Type: {type}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          handleMultiSelectChange("types", type, false)
                        }
                      />
                    </Badge>
                  ))}
                  {localFilters.colors.map((color) => (
                    <Badge
                      key={color}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Color: {color}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          handleMultiSelectChange("colors", color, false)
                        }
                      />
                    </Badge>
                  ))}
                  {localFilters.cuts.map((cut) => (
                    <Badge
                      key={cut}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Cut: {cut}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          handleMultiSelectChange("cuts", cut, false)
                        }
                      />
                    </Badge>
                  ))}
                  {localFilters.clarities.map((clarity) => (
                    <Badge
                      key={clarity}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Clarity: {clarity}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          handleMultiSelectChange("clarities", clarity, false)
                        }
                      />
                    </Badge>
                  ))}
                  {(localFilters.priceMin || localFilters.priceMax) && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Price:{" "}
                      {localFilters.priceMin
                        ? formatCurrency(localFilters.priceMin)
                        : "$0"}{" "}
                      -{" "}
                      {localFilters.priceMax
                        ? formatCurrency(localFilters.priceMax)
                        : "∞"}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          handlePriceRangeChange(undefined, undefined)
                        }
                      />
                    </Badge>
                  )}
                  {(localFilters.weightMin || localFilters.weightMax) && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Weight:{" "}
                      {localFilters.weightMin
                        ? formatWeight(localFilters.weightMin)
                        : "0ct"}{" "}
                      -{" "}
                      {localFilters.weightMax
                        ? formatWeight(localFilters.weightMax)
                        : "∞"}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          handleWeightRangeChange(undefined, undefined)
                        }
                      />
                    </Badge>
                  )}
                  {localFilters.stockStatus !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Stock:{" "}
                      {localFilters.stockStatus === "in_stock"
                        ? "In Stock"
                        : "Out of Stock"}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleFilterChange("stockStatus", "all")}
                      />
                    </Badge>
                  )}
                  {localFilters.origins.map((origin) => (
                    <Badge
                      key={origin}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      Origin: {origin}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          handleMultiSelectChange("origins", origin, false)
                        }
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
