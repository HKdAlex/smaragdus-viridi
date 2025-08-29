"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Filter,
  History,
  Save,
  Search,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useEffect, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useTranslations } from "next-intl";

export interface SearchFilters {
  query: string;
  sortBy:
    | "created_at"
    | "price_amount"
    | "weight_carats"
    | "serial_number"
    | "name";
  sortOrder: "asc" | "desc";
  priceMin?: number;
  priceMax?: number;
  weightMin?: number;
  weightMax?: number;
  types: string[];
  colors: string[];
  cuts: string[];
  clarities: string[];
  inStock?: boolean;
  origins: string[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
  lastUsed?: string;
}

interface EnhancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: (query: string) => void;
  availableOrigins?: string[];
  initialFilters?: Partial<SearchFilters>;
  savedSearches?: SavedSearch[];
  onSaveSearch?: (name: string, filters: SearchFilters) => void;
  onLoadSearch?: (search: SavedSearch) => void;
  onDeleteSearch?: (searchId: string) => void;
}

export function EnhancedSearch({
  onFiltersChange,
  onSearch,
  availableOrigins = [],
  initialFilters,
  savedSearches = [],
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
}: EnhancedSearchProps) {
  const t = useTranslations("admin.enhancedSearch");
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    sortBy: "created_at",
    sortOrder: "desc",
    types: [],
    colors: [],
    cuts: [],
    clarities: [],
    origins: [],
    ...initialFilters,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Calculate active filters count
    let count = 0;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.weightMin || filters.weightMax) count++;
    if (filters.types.length > 0) count++;
    if (filters.colors.length > 0) count++;
    if (filters.cuts.length > 0) count++;
    if (filters.clarities.length > 0) count++;
    if (filters.inStock !== undefined) count++;
    if (filters.origins.length > 0) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleQueryChange = (query: string) => {
    const newFilters = { ...filters, query };
    setFilters(newFilters);
    onSearch(query);
  };

  const handleSortChange = (value: string) => {
    setFilters({ ...filters, sortBy: value as SearchFilters["sortBy"] });
  };

  const handleSortOrderToggle = () => {
    setFilters({
      ...filters,
      sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
    });
  };

  const handleRangeChange = (
    field: "priceMin" | "priceMax" | "weightMin" | "weightMax",
    value: string
  ) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters({ ...filters, [field]: numValue });
  };

  const handleMultiSelectChange = (
    field: keyof SearchFilters,
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[field] as string[];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);

    setFilters({ ...filters, [field]: newValues });
  };

  const handleStockFilterChange = (value: string) => {
    if (value === "all") {
      setFilters({ ...filters, inStock: undefined });
    } else {
      setFilters({ ...filters, inStock: value === "in_stock" });
    }
  };

  const clearAllFilters = () => {
    setFilters({
      query: "",
      sortBy: "created_at",
      sortOrder: "desc",
      types: [],
      colors: [],
      cuts: [],
      clarities: [],
      origins: [],
    });
  };

  const saveCurrentSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim(), filters);
      setSaveSearchName("");
      setShowSaveDialog(false);
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    onLoadSearch?.(search);
  };

  const deleteSavedSearch = (searchId: string) => {
    onDeleteSearch?.(searchId);
  };

  const getSortLabel = (sortBy: SearchFilters["sortBy"]) => {
    const labels = {
      created_at: t("sortLabels.dateAdded"),
      price_amount: t("sortLabels.price"),
      weight_carats: t("sortLabels.weight"),
      serial_number: t("sortLabels.serialNumber"),
      name: t("sortLabels.gemstoneType"),
    };
    return labels[sortBy];
  };

  const gemstoneTypes = [
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
  ];

  const gemColors = [
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
  ];

  const gemCuts = [
    "round",
    "princess",
    "emerald",
    "oval",
    "marquise",
    "pear",
    "cushion",
    "radiant",
    "fantasy",
  ];

  const gemClarities = [
    "FL",
    "IF",
    "VVS1",
    "VVS2",
    "VS1",
    "VS2",
    "SI1",
    "SI2",
    "I1",
  ];

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">
              {t("sortLabels.dateAdded")}
            </SelectItem>
            <SelectItem value="price_amount">
              {t("sortLabels.price")}
            </SelectItem>
            <SelectItem value="weight_carats">
              {t("sortLabels.weight")}
            </SelectItem>
            <SelectItem value="serial_number">
              {t("sortLabels.serialNumber")}
            </SelectItem>
            <SelectItem value="name">{t("sortLabels.gemstoneType")}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSortOrderToggle}
          className="px-3"
        >
          {filters.sortOrder === "asc" ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {t("filters")}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-4 h-4" />
            {t("clearFilters")}
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.priceMin && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t("filterLabels.minPrice")}: $
              {(filters.priceMin / 100).toLocaleString()}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, priceMin: undefined })}
              />
            </Badge>
          )}
          {filters.priceMax && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t("filterLabels.maxPrice")}: $
              {(filters.priceMax / 100).toLocaleString()}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, priceMax: undefined })}
              />
            </Badge>
          )}
          {filters.weightMin && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t("filterLabels.minWeight")}: {filters.weightMin}ct
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, weightMin: undefined })}
              />
            </Badge>
          )}
          {filters.weightMax && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t("filterLabels.maxWeight")}: {filters.weightMax}ct
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, weightMax: undefined })}
              />
            </Badge>
          )}
          {filters.types.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="flex items-center gap-1 capitalize"
            >
              {t("filterLabels.type")}: {type}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleMultiSelectChange("types", type, false)}
              />
            </Badge>
          ))}
          {filters.colors.map((color) => (
            <Badge
              key={color}
              variant="secondary"
              className="flex items-center gap-1 capitalize"
            >
              {t("filterLabels.color")}: {color}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleMultiSelectChange("colors", color, false)}
              />
            </Badge>
          ))}
          {filters.cuts.map((cut) => (
            <Badge
              key={cut}
              variant="secondary"
              className="flex items-center gap-1 capitalize"
            >
              {t("filterLabels.cut")}: {cut}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleMultiSelectChange("cuts", cut, false)}
              />
            </Badge>
          ))}
          {filters.clarities.map((clarity) => (
            <Badge
              key={clarity}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {t("filterLabels.clarity")}: {clarity}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() =>
                  handleMultiSelectChange("clarities", clarity, false)
                }
              />
            </Badge>
          ))}
          {filters.origins.map((origin) => (
            <Badge
              key={origin}
              variant="secondary"
              className="flex items-center gap-1 capitalize"
            >
              {t("filterLabels.origin")}: {origin}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() =>
                  handleMultiSelectChange("origins", origin, false)
                }
              />
            </Badge>
          ))}
          {filters.inStock !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t("filterLabels.stockStatus")}:{" "}
              {filters.inStock ? t("inStock") : t("outOfStock")}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, inStock: undefined })}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("advancedFilters")}</CardTitle>
            <div className="flex items-center gap-2">
              {onSaveSearch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={activeFiltersCount === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t("saveSearch")}
                </Button>
              )}
              {savedSearches.length > 0 && (
                <Select
                  onValueChange={(value) => {
                    const search = savedSearches.find((s) => s.id === value);
                    if (search) loadSavedSearch(search);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <History className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={t("loadSearch")} />
                  </SelectTrigger>
                  <SelectContent>
                    {savedSearches.map((search) => (
                      <SelectItem key={search.id} value={search.id}>
                        {search.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price and Weight Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Price Range (USD)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Min Price
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.priceMin ? filters.priceMin / 100 : ""}
                      onChange={(e) =>
                        handleRangeChange("priceMin", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Max Price
                    </label>
                    <Input
                      type="number"
                      placeholder={t("noLimit")}
                      value={filters.priceMax ? filters.priceMax / 100 : ""}
                      onChange={(e) =>
                        handleRangeChange("priceMax", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Weight Range (carats)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Min Weight
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={filters.weightMin || ""}
                      onChange={(e) =>
                        handleRangeChange("weightMin", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Max Weight
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t("noLimit")}
                      value={filters.weightMax || ""}
                      onChange={(e) =>
                        handleRangeChange("weightMax", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div>
              <h4 className="font-medium mb-3">{t("stockStatus")}</h4>
              <Select
                value={
                  filters.inStock === undefined
                    ? "all"
                    : filters.inStock
                    ? "in_stock"
                    : "out_of_stock"
                }
                onValueChange={handleStockFilterChange}
              >
                <SelectTrigger className="w-48">
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

            {/* Origins */}
            {availableOrigins.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">{t("origin")}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableOrigins.map((origin) => (
                    <label
                      key={origin}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.origins.includes(origin)}
                        onChange={(e) =>
                          handleMultiSelectChange(
                            "origins",
                            origin,
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{origin}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Gemstone Properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Types */}
              <div>
                <h4 className="font-medium mb-3">{t("gemstoneType")}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {gemstoneTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={(e) =>
                          handleMultiSelectChange(
                            "types",
                            type,
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <h4 className="font-medium mb-3">{t("color")}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {gemColors.map((color) => (
                    <label
                      key={color}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.colors.includes(color)}
                        onChange={(e) =>
                          handleMultiSelectChange(
                            "colors",
                            color,
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cuts */}
              <div>
                <h4 className="font-medium mb-3">{t("cut")}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {gemCuts.map((cut) => (
                    <label
                      key={cut}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.cuts.includes(cut)}
                        onChange={(e) =>
                          handleMultiSelectChange("cuts", cut, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{cut}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clarities */}
              <div>
                <h4 className="font-medium mb-3">{t("clarity")}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {gemClarities.map((clarity) => (
                    <label
                      key={clarity}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.clarities.includes(clarity)}
                        onChange={(e) =>
                          handleMultiSelectChange(
                            "clarities",
                            clarity,
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{clarity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>{t("saveSearch")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("searchName")}</label>
                <Input
                  placeholder={t("searchNamePlaceholder")}
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") saveCurrentSearch();
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={saveCurrentSearch}
                  disabled={!saveSearchName.trim()}
                >
                  {t("saveSearch")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
