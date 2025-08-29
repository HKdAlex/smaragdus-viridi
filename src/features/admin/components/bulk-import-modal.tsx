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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">{t("error")}</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("importFromCSV")}
                </h3>
                <p className="text-gray-600 mb-6">{t("uploadDescription")}</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={downloadTemplate} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    {t("downloadTemplate")}
                  </Button>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {t("dropFileHere")}
                </p>
                <p className="text-gray-600">{t("fileSizeLimit")}</p>
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
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("fileParsedSuccessfully")}
                  </h3>
                  <p className="text-gray-600">
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
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Serial #</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Color</th>
                          <th className="text-left p-2">Weight</th>
                          <th className="text-left p-2">Price</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.data.slice(0, 5).map((gemstone, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">
                              {gemstone.serialNumber}
                            </td>
                            <td className="p-2 capitalize">{gemstone.name}</td>
                            <td className="p-2">{gemstone.color}</td>
                            <td className="p-2">{gemstone.weight_carats}ct</td>
                            <td className="p-2">
                              ${(gemstone.price_amount / 100).toLocaleString()}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  gemstone.in_stock
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {gemstone.in_stock
                                  ? "In Stock"
                                  : "Out of Stock"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parseResult.data.length > 5 && (
                    <p className="text-sm text-gray-600 mt-4">
                      ... and {parseResult.data.length - 5} more gemstones
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">
                          Warnings ({parseResult.warnings.length})
                        </h4>
                        <ul className="text-sm text-yellow-800 mt-1">
                          {parseResult.warnings
                            .slice(0, 3)
                            .map((warning, index) => (
                              <li key={index}>
                                Row {warning.row}: {warning.warning}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Back
                </Button>
                <Button onClick={handleImport}>
                  Import {parseResult.data.length} Gemstones
                </Button>
              </div>
            </div>
          )}

          {step === "processing" && processingState && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Importing Gemstones...
              </h3>
              <p className="text-gray-600 mb-4">
                {processingState.currentStep}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (processingState.progress / processingState.totalSteps) *
                      100
                    }%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {processingState.progress} / {processingState.totalSteps}{" "}
                completed
              </p>
            </div>
          )}

          {step === "results" && importResult && (
            <div className="space-y-6">
              <div className="text-center">
                {importResult.success ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {importResult.success ? "Import Completed" : "Import Failed"}
                </h3>
                <p className="text-gray-600">
                  {importResult.imported} imported, {importResult.failed} failed
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900">
                      {importResult.imported}
                    </div>
                    <div className="text-sm text-green-700">Imported</div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-900">
                      {importResult.failed}
                    </div>
                    <div className="text-sm text-red-700">Failed</div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-900">
                      {importResult.duplicates.length}
                    </div>
                    <div className="text-sm text-blue-700">Duplicates</div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-900">
                      Import Errors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">Row {error.row}:</span>{" "}
                          {error.error}
                        </div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-sm text-red-700">
                          ... and {importResult.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Duplicates */}
              {importResult.duplicates.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-900">
                      Duplicates Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResult.duplicates.map((duplicate, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">
                            {duplicate.serialNumber}:
                          </span>{" "}
                          {duplicate.reason}
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
                {importResult.success && (
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
