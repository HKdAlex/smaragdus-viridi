"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  CSVParserService,
  type CSVParseResult,
} from "../services/csv-parser-service";
import {
  GemstoneAdminService,
  type BulkImportResult,
} from "../services/gemstone-admin-service";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: BulkImportResult) => void;
}

type ImportStep = "upload" | "preview" | "processing" | "results";

interface ProcessingState {
  currentStep: string;
  progress: number;
  totalSteps: number;
}

export function BulkImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const t = useTranslations("admin.bulkImport");
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(
    null
  );
  const [processingState, setProcessingState] =
    useState<ProcessingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setProcessingState(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);

    // Validate file
    const validation = CSVParserService.validateCSVFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setFile(selectedFile);

    // Parse CSV content
    try {
      const content = await selectedFile.text();
      const result = CSVParserService.parseCSV(content);

      setParseResult(result);

      if (result.success) {
        setStep("preview");
      } else {
        setError(t("errors.parseFailed"));
      }
    } catch (err) {
      setError(t("errors.readFailed"));
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!parseResult?.success || !parseResult.data.length) return;

    setStep("processing");
    setProcessingState({
      currentStep: "Starting import...",
      progress: 0,
      totalSteps: parseResult.data.length + 2,
    });

    try {
      // Update progress
      setProcessingState((prev) =>
        prev
          ? {
              ...prev,
              currentStep: "Validating data...",
              progress: 1,
            }
          : null
      );

      // Start import process
      setProcessingState((prev) =>
        prev
          ? {
              ...prev,
              currentStep: "Importing gemstones...",
              progress: 2,
            }
          : null
      );

      const result = await GemstoneAdminService.bulkImportGemstones(
        parseResult.data
      );

      setImportResult(result);
      setStep("results");

      if (result.success) {
        onSuccess(result);
      }
    } catch (err) {
      setError(t("errors.importFailed"));
      setStep("preview");
    } finally {
      setProcessingState(null);
    }
  };

  const downloadTemplate = () => {
    const template = CSVParserService.generateCSVTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gemstone-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("title")}
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-destructive text-sm sm:text-base">
                  {t("error")}
                </h3>
                <p className="text-destructive text-xs sm:text-sm">{error}</p>
              </div>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
                  {t("importFromCSV")}
                </h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base px-2">
                  {t("uploadDescription")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">
                      {t("downloadTemplate")}
                    </span>
                    <span className="sm:hidden">Template</span>
                  </Button>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/20 hover:bg-muted/30"
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-base sm:text-lg font-medium text-foreground mb-2">
                  {t("dropFileHere")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("fileSizeLimit")}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {step === "preview" && parseResult && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-foreground">
                    {t("fileParsedSuccessfully")}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {t("foundValidGemstones", {
                      count: parseResult.data.length,
                    })}
                  </p>
                </div>
              </div>

              {/* Preview Data */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("importPreview")}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 text-muted-foreground font-medium">
                            {t("tableHeaders.serialNumber")}
                          </th>
                          <th className="text-left p-2 text-muted-foreground font-medium">
                            {t("tableHeaders.type")}
                          </th>
                          <th className="text-left p-2 text-muted-foreground font-medium">
                            {t("tableHeaders.color")}
                          </th>
                          <th className="text-left p-2 text-muted-foreground font-medium">
                            {t("tableHeaders.weight")}
                          </th>
                          <th className="text-left p-2 text-muted-foreground font-medium">
                            {t("tableHeaders.price")}
                          </th>
                          <th className="text-left p-2 text-muted-foreground font-medium">
                            {t("tableHeaders.status")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.data.slice(0, 5).map((gemstone, index) => (
                          <tr key={index} className="border-b border-border">
                            <td className="p-2 font-medium text-foreground">
                              {gemstone.serialNumber}
                            </td>
                            <td className="p-2 capitalize text-foreground">
                              {t(`gemstones.types.${gemstone.name}` as any) ||
                                gemstone.name}
                            </td>
                            <td className="p-2 text-foreground">
                              {t(`gemstones.colors.${gemstone.color}` as any) ||
                                gemstone.color}
                            </td>
                            <td className="p-2 text-foreground">
                              {gemstone.weight_carats}крт
                            </td>
                            <td className="p-2 text-foreground">
                              {new Intl.NumberFormat("ru-RU", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(gemstone.price_amount / 100)}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  gemstone.in_stock
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                }`}
                              >
                                {gemstone.in_stock
                                  ? t("inStock")
                                  : t("outOfStock")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parseResult.data.length > 5 && (
                    <p className="text-sm text-muted-foreground mt-4">
                      ... and {parseResult.data.length - 5} more gemstones
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-yellow-900 dark:text-yellow-100 text-sm sm:text-base">
                          Warnings ({parseResult.warnings.length})
                        </h4>
                        <ul className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 mt-1 space-y-1">
                          {parseResult.warnings
                            .slice(0, 3)
                            .map((warning, index) => (
                              <li key={index} className="truncate">
                                Row {warning.row}: {warning.warning}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("upload")}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  className="min-h-[48px] w-full sm:w-auto bg-primary hover:bg-primary/90"
                >
                  Import {parseResult.data.length} Gemstones
                </Button>
              </div>
            </div>
          )}

          {step === "processing" && processingState && (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4 sm:mb-6"></div>
              <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
                Importing Gemstones...
              </h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base px-2">
                {processingState.currentStep}
              </p>
              <div className="w-full bg-muted rounded-full h-2 sm:h-3 max-w-md mx-auto">
                <div
                  className="bg-primary h-2 sm:h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (processingState.progress / processingState.totalSteps) *
                      100
                    }%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2 sm:mt-3">
                {processingState.progress} / {processingState.totalSteps}{" "}
                completed
              </p>
            </div>
          )}

          {step === "results" && importResult && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                {importResult.success ? (
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                ) : (
                  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
                )}
                <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
                  {importResult.success ? "Import Completed" : "Import Failed"}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {importResult.imported} imported, {importResult.failed} failed
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                      {importResult.imported}
                    </div>
                    <div className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                      {t("results.imported")}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                  <CardContent className="p-4 text-center">
                    <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100">
                      {importResult.failed}
                    </div>
                    <div className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                      {t("results.failed")}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                  <CardContent className="p-4 text-center">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {importResult.duplicates.length}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      {t("results.duplicates")}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-red-900 dark:text-red-100 text-sm sm:text-base">
                      {t("results.importErrors")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-xs sm:text-sm">
                          <span className="font-medium text-red-900 dark:text-red-100">
                            {t("results.row")} {error.row}:
                          </span>{" "}
                          <span className="text-red-800 dark:text-red-200">
                            {error.error}
                          </span>
                        </div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-2">
                          {t("results.moreErrors", {
                            count: importResult.errors.length - 10,
                          })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Duplicates */}
              {importResult.duplicates.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800">
                  <CardHeader>
                    <CardTitle className="text-yellow-900 dark:text-yellow-100 text-sm sm:text-base">
                      {t("results.duplicatesFound")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                      {importResult.duplicates.map((duplicate, index) => (
                        <div key={index} className="text-xs sm:text-sm">
                          <span className="font-medium text-yellow-900 dark:text-yellow-100">
                            {duplicate.serialNumber}:
                          </span>{" "}
                          <span className="text-yellow-800 dark:text-yellow-200">
                            {duplicate.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  {t("close")}
                </Button>
                {importResult.success && (
                  <Button
                    onClick={() => window.location.reload()}
                    className="min-h-[48px] w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
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
