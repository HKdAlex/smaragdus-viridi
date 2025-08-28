"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Activity,
  Award,
  Brain,
  Camera,
  Code2,
  Database,
  Download,
  Eye,
  FileText,
  Gem,
  Image as ImageIcon,
  Info,
  Languages,
  Ruler,
  Scale,
  Star,
  Target,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import type { DatabaseAIAnalysisResult } from "@/shared/types";
import { useState } from "react";

interface AIAnalysisDisplayProps {
  gemstoneId: string;
  analysisData: DatabaseAIAnalysisResult[];
  aiAnalyzed: boolean;
  aiConfidenceScore?: number;
  aiAnalysisDate?: string;
}

export function AIAnalysisDisplay({
  gemstoneId,
  analysisData,
  aiAnalyzed,
  aiConfidenceScore,
  aiAnalysisDate,
}: AIAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showRawData, setShowRawData] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(0);

  // More robust check for AI analysis availability
  if (!aiAnalyzed || !analysisData || analysisData.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                AI Analysis Not Available
              </h3>
              <p className="text-sm text-muted-foreground/70 max-w-md">
                This gemstone has not been analyzed by our enhanced AI system
                yet. AI analysis provides detailed gemological assessment,
                Russian/Cyrillic text extraction, and quality grading.
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-4">
              <Brain className="w-4 h-4 mr-2" />
              Request AI Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get different types of analysis results
  const comprehensiveAnalysis = analysisData.find(
    (a) =>
      a.analysis_type === "gemstone_identification" ||
      a.analysis_type === "comprehensive_analysis"
  );
  const classificationResults = analysisData.filter(
    (a) => a.analysis_type === "image_classification"
  );
  const measurementResults = analysisData.filter(
    (a) => a.analysis_type === "measurement_analysis"
  );
  const labelResults = analysisData.filter(
    (a) => a.analysis_type === "label_extraction"
  );

  const primaryAnalysis = comprehensiveAnalysis || analysisData[0];
  const data = primaryAnalysis?.extracted_data as any;

  // Calculate overall confidence
  const overallConfidence =
    Number(aiConfidenceScore) || Number(primaryAnalysis?.confidence_score) || 0;

  const confidenceColor =
    overallConfidence >= 0.9
      ? "text-green-600"
      : overallConfidence >= 0.7
      ? "text-blue-600"
      : overallConfidence >= 0.5
      ? "text-yellow-600"
      : "text-red-600";

  // Enhanced data extraction helpers
  const getExtractedText = () => {
    if (!data?.text_extraction) return null;
    return {
      raw: data.text_extraction.raw_text || "",
      translated: data.text_extraction.translated_text || "",
      language: data.text_extraction.language || "unknown",
    };
  };

  const getMeasurementData = () => {
    if (!data?.measurement_data) return null;
    return {
      device_type: data.measurement_data.device_type || "unknown",
      reading_value: data.measurement_data.reading_value || 0,
      measurement_type: data.measurement_data.measurement_type || "unknown",
      confidence: data.measurement_data.confidence || 0,
    };
  };

  const getQualityGrade = (assessment?: any) => {
    const grade = assessment?.quality_grade || assessment?.overall || "unknown";
    switch (grade.toLowerCase()) {
      case "excellent":
        return {
          grade: "Excellent",
          color: "text-green-600",
          bg: "bg-green-50 border-green-200",
        };
      case "very_good":
        return {
          grade: "Very Good",
          color: "text-blue-600",
          bg: "bg-blue-50 border-blue-200",
        };
      case "good":
        return {
          grade: "Good",
          color: "text-yellow-600",
          bg: "bg-yellow-50 border-yellow-200",
        };
      case "fair":
        return {
          grade: "Fair",
          color: "text-orange-600",
          bg: "bg-orange-50 border-orange-200",
        };
      default:
        return {
          grade: "Unknown",
          color: "text-muted-foreground",
          bg: "bg-muted/50 border-muted",
        };
    }
  };

  const qualityGrade = getQualityGrade(data?.visual_assessment);
  const extractedText = getExtractedText();
  const measurementData = getMeasurementData();

  // Tab configuration
  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "extraction", label: "Data Extraction", icon: FileText },
    { id: "classification", label: "Image Analysis", icon: ImageIcon },
    { id: "measurements", label: "Measurements", icon: Ruler },
    { id: "quality", label: "Quality Assessment", icon: Star },
    { id: "raw", label: "Raw Data", icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-full" />
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                <div>
                  <span className="text-xl font-bold">
                    Enhanced AI Analysis
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      v2.1 • {primaryAnalysis?.ai_model_version || "GPT-4o"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {analysisData.length} analysis
                      {analysisData.length !== 1 ? "es" : ""}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Confidence Score */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    AI Confidence
                  </div>
                  <div className={`text-sm font-bold ${confidenceColor}`}>
                    {Math.round(overallConfidence * 100)}%
                  </div>
                </div>
                <Progress
                  value={overallConfidence * 100}
                  className="w-16 h-2"
                />
              </div>

              {/* Analysis Date */}
              {aiAnalysisDate && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Analyzed</div>
                  <div className="text-sm font-medium">
                    {new Date(aiAnalysisDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        {/* Quick Stats */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.gemstone_code && (
              <div className="bg-white/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">
                  Gemstone Code
                </div>
                <div className="font-bold text-sm">{data.gemstone_code}</div>
              </div>
            )}

            {data?.weight && (
              <div className="bg-white/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">AI Weight</div>
                <div className="font-bold text-sm">
                  {data.weight.value} {data.weight.unit}
                </div>
              </div>
            )}

            {data?.shape_cut && (
              <div className="bg-white/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">AI Shape</div>
                <div className="font-bold text-sm capitalize">
                  {data.shape_cut.value}
                </div>
              </div>
            )}

            {data?.visual_assessment?.visual_appeal && (
              <div className="bg-white/50 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">
                  Visual Appeal
                </div>
                <div className="font-bold text-sm">
                  {Math.round(data.visual_assessment.visual_appeal * 100)}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gemstone Identification */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gem className="w-5 h-5 text-primary" />
                  Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.gemstone_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">
                      {data.gemstone_type}
                    </span>
                  </div>
                )}
                {data?.color?.grade && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color Grade</span>
                    <span className="font-medium">{data.color.grade}</span>
                  </div>
                )}
                {data?.clarity?.grade && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clarity Grade</span>
                    <span className="font-medium">{data.clarity.grade}</span>
                  </div>
                )}
                {data?.origin?.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origin</span>
                    <span className="font-medium">{data.origin.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quality Assessment */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-primary" />
                  Quality Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.visual_assessment?.quality_grade && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Overall Grade</span>
                    <Badge
                      className={`${qualityGrade.bg} ${qualityGrade.color} border`}
                    >
                      {qualityGrade.grade}
                    </Badge>
                  </div>
                )}
                {data?.visual_assessment?.visual_appeal && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Visual Appeal</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={data.visual_assessment.visual_appeal * 100}
                        className="w-16 h-2"
                      />
                      <span className="text-sm font-medium">
                        {Math.round(data.visual_assessment.visual_appeal * 100)}
                        %
                      </span>
                    </div>
                  </div>
                )}
                {data?.visual_assessment?.commercial_value && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Commercial Value
                    </span>
                    <span className="font-medium capitalize">
                      {data.visual_assessment.commercial_value}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Analysis Metadata */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-primary" />
                  Enhanced Analysis Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Analysis Type</span>
                  <Badge variant="secondary">
                    {primaryAnalysis?.analysis_type === "comprehensive_analysis"
                      ? "Multi-Image Comprehensive"
                      : primaryAnalysis?.analysis_type || "Unknown"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Images Processed
                  </span>
                  <span className="font-medium">
                    {data?.processing_metadata?.total_images_analyzed ||
                      data?.processing_metadata?.image_batch_info?.length ||
                      analysisData.length}
                  </span>
                </div>
                {primaryAnalysis?.processing_time_ms && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Processing Time
                    </span>
                    <span className="font-medium">
                      {(
                        (primaryAnalysis.processing_time_ms as number) / 1000
                      ).toFixed(2)}
                      s
                      {data?.processing_metadata?.total_images_analyzed && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (
                          {Math.round(
                            (primaryAnalysis.processing_time_ms as number) /
                              data.processing_metadata.total_images_analyzed
                          )}
                          ms/img)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {primaryAnalysis?.processing_cost_usd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis Cost</span>
                    <span className="font-medium">
                      $
                      {(primaryAnalysis.processing_cost_usd as number).toFixed(
                        4
                      )}
                      {data?.processing_metadata?.total_images_analyzed && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ($
                          {(
                            (primaryAnalysis.processing_cost_usd as number) /
                            data.processing_metadata.total_images_analyzed
                          ).toFixed(4)}
                          /img)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {data?.processing_metadata?.total_tokens && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tokens Used</span>
                    <span className="font-medium">
                      {data.processing_metadata.total_tokens.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Model</span>
                  <span className="font-medium">
                    {primaryAnalysis?.ai_model_version || "GPT-4o"}
                  </span>
                </div>
                {data?.processing_metadata?.analysis_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis Date</span>
                    <span className="font-medium text-xs">
                      {new Date(
                        data.processing_metadata.analysis_date
                      ).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Multi-Image Cost Savings */}
                {data?.processing_metadata?.total_images_analyzed > 1 &&
                  primaryAnalysis?.processing_cost_usd && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Cost Savings
                        </span>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            ~
                            {Math.round(
                              (1 -
                                1 /
                                  data.processing_metadata
                                    .total_images_analyzed) *
                                100
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            vs. single-image analysis
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Extraction Tab */}
        {activeTab === "extraction" && (
          <div className="space-y-6">
            {/* Russian/Cyrillic Text Extraction */}
            {extractedText && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-primary" />
                    Text Extraction & Translation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extractedText.raw && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Raw Text ({extractedText.language.toUpperCase()})
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                        {extractedText.raw}
                      </div>
                    </div>
                  )}
                  {extractedText.translated &&
                    extractedText.translated !== extractedText.raw && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Languages className="w-4 h-4" />
                          English Translation
                        </h4>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                          {extractedText.translated}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Extracted Gemstone Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  Extracted Gemstone Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Physical Properties */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Physical Properties
                    </h4>
                    {data?.weight && (
                      <div className="flex justify-between">
                        <span className="text-sm">Weight</span>
                        <span className="font-medium text-sm">
                          {data.weight.value} {data.weight.unit}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {data.weight.source}
                          </Badge>
                        </span>
                      </div>
                    )}
                    {data?.dimensions && (
                      <>
                        {data.dimensions.length_mm && (
                          <div className="flex justify-between">
                            <span className="text-sm">Length</span>
                            <span className="font-medium text-sm">
                              {data.dimensions.length_mm} mm
                              <Badge variant="outline" className="ml-2 text-xs">
                                {data.dimensions.source}
                              </Badge>
                            </span>
                          </div>
                        )}
                        {data.dimensions.width_mm && (
                          <div className="flex justify-between">
                            <span className="text-sm">Width</span>
                            <span className="font-medium text-sm">
                              {data.dimensions.width_mm} mm
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {data?.quantity && (
                      <div className="flex justify-between">
                        <span className="text-sm">Quantity</span>
                        <span className="font-medium text-sm">
                          {data.quantity.count} {data.quantity.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Certification Data */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Certification
                    </h4>
                    {data?.certification && (
                      <>
                        {data.certification.lab && (
                          <div className="flex justify-between">
                            <span className="text-sm">Laboratory</span>
                            <span className="font-medium text-sm">
                              {data.certification.lab}
                            </span>
                          </div>
                        )}
                        {data.certification.certificate_number && (
                          <div className="flex justify-between">
                            <span className="text-sm">Certificate #</span>
                            <span className="font-medium text-sm font-mono">
                              {data.certification.certificate_number}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {data?.gemstone_code && (
                      <div className="flex justify-between">
                        <span className="text-sm">Gemstone Code</span>
                        <span className="font-medium text-sm font-mono">
                          {data.gemstone_code}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Multi-Image Analysis Tab */}
        {activeTab === "classification" && (
          <div className="space-y-6">
            {/* Primary Image Selection */}
            {data?.primary_image_selection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Primary Image Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Selection Results
                        </h4>
                        <div className="flex justify-between">
                          <span className="text-sm">Selected Image Index</span>
                          <Badge variant="secondary">
                            #
                            {data.primary_image_selection.selected_image_index +
                              1}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Suitability Score</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={data.primary_image_selection.score}
                              className="w-16 h-2"
                            />
                            <span className="text-sm font-medium">
                              {data.primary_image_selection.score}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Batch Information
                        </h4>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Images Analyzed</span>
                          <span className="font-medium">
                            {data?.processing_metadata?.total_images_analyzed ||
                              data?.processing_metadata?.image_batch_info
                                ?.length ||
                              1}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Analysis Method</span>
                          <Badge variant="outline" className="text-xs">
                            Multi-Image Batch
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    {data.primary_image_selection.reasoning && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          AI Selection Reasoning
                        </h4>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                          {data.primary_image_selection.reasoning}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Batch Details */}
            {data?.processing_metadata?.image_batch_info && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    Image Batch Processing Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {data.processing_metadata.image_batch_info.map(
                        (img: any, index: number) => (
                          <div
                            key={img.image_id}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              data?.primary_image_selection
                                ?.selected_image_index === index
                                ? "bg-primary/5 border-primary/30"
                                : "bg-muted/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                  data?.primary_image_selection
                                    ?.selected_image_index === index
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  Image {index + 1}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Order: {img.order} • ID:{" "}
                                  {img.image_id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {data?.primary_image_selection
                                ?.selected_image_index === index && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                Processed
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legacy Single-Image Classifications (if any) */}
            {analysisData
              .filter((a) => a.analysis_type !== "comprehensive_analysis")
              .map((analysis, index) => {
                const singleAnalysisData = analysis.extracted_data as any;
                return (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-5 h-5 text-primary" />
                          Single Image Analysis #{index + 1}
                          <Badge variant="secondary" className="text-xs">
                            {analysis.analysis_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Confidence:{" "}
                          {Math.round(
                            (analysis.confidence_score as number) * 100
                          )}
                          %
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Classification */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Image Classification
                          </h4>
                          {singleAnalysisData?.image_classification && (
                            <div className="flex justify-between">
                              <span className="text-sm">Type</span>
                              <Badge variant="outline" className="text-xs">
                                {singleAnalysisData.image_classification.replace(
                                  /_/g,
                                  " "
                                )}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Primary Image Suitability */}
                        {singleAnalysisData?.primary_image_suitability && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Primary Image Suitability
                            </h4>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Score</span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={
                                    singleAnalysisData.primary_image_suitability
                                      .score
                                  }
                                  className="w-16 h-2"
                                />
                                <span className="text-sm font-medium">
                                  {
                                    singleAnalysisData.primary_image_suitability
                                      .score
                                  }
                                  /100
                                </span>
                              </div>
                            </div>
                            {singleAnalysisData.primary_image_suitability
                              .reasoning && (
                              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                {
                                  singleAnalysisData.primary_image_suitability
                                    .reasoning
                                }
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}

        {/* Measurements Tab */}
        {activeTab === "measurements" && (
          <div className="space-y-6">
            {measurementData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" />
                    Measurement Tool Reading
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Device Type</span>
                      <span className="font-medium capitalize">
                        {measurementData.device_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reading</span>
                      <span className="font-medium">
                        {measurementData.reading_value}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">
                        {measurementData.measurement_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">
                        {Math.round(measurementData.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All measurement data from analysis */}
            {analysisData
              .filter((a) => (a.extracted_data as any)?.measurement_data)
              .map((analysis, index) => {
                const measurementData = (analysis.extracted_data as any)
                  .measurement_data;
                return (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-primary" />
                        Measurement Analysis #{index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Device</span>
                          <span className="font-medium">
                            {measurementData.device_type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Value</span>
                          <span className="font-medium">
                            {measurementData.reading_value}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium">
                            {measurementData.measurement_type}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}

        {/* Quality Assessment Tab */}
        {activeTab === "quality" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  AI Quality Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visual Assessment */}
                  {data?.visual_assessment && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Visual Assessment
                      </h4>
                      {data.visual_assessment.quality_grade && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Quality Grade</span>
                          <Badge
                            className={`${qualityGrade.bg} ${qualityGrade.color} border`}
                          >
                            {qualityGrade.grade}
                          </Badge>
                        </div>
                      )}
                      {data.visual_assessment.visual_appeal && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Visual Appeal</span>
                            <span className="text-sm font-medium">
                              {Math.round(
                                data.visual_assessment.visual_appeal * 100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={data.visual_assessment.visual_appeal * 100}
                            className="h-2"
                          />
                        </div>
                      )}
                      {data.visual_assessment.commercial_value && (
                        <div className="flex justify-between">
                          <span className="text-sm">Commercial Value</span>
                          <span className="font-medium capitalize">
                            {data.visual_assessment.commercial_value}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Color & Clarity Assessment */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Gemological Assessment
                    </h4>
                    {data?.color && (
                      <>
                        {data.color.grade && (
                          <div className="flex justify-between">
                            <span className="text-sm">Color Grade</span>
                            <span className="font-medium">
                              {data.color.grade}
                            </span>
                          </div>
                        )}
                        {data.color.description && (
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">
                              Description
                            </span>
                            <p className="text-xs bg-muted/50 p-2 rounded">
                              {data.color.description}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {data?.clarity && (
                      <>
                        {data.clarity.grade && (
                          <div className="flex justify-between">
                            <span className="text-sm">Clarity Grade</span>
                            <span className="font-medium">
                              {data.clarity.grade}
                            </span>
                          </div>
                        )}
                        {data.clarity.description && (
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">
                              Clarity Notes
                            </span>
                            <p className="text-xs bg-muted/50 p-2 rounded">
                              {data.clarity.description}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Raw Data Tab */}
        {activeTab === "raw" && (
          <div className="space-y-6">
            {/* Analysis Selector */}
            {analysisData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Select Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.map((analysis, index) => (
                      <Button
                        key={analysis.id}
                        variant={
                          selectedAnalysis === index ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedAnalysis(index)}
                      >
                        Analysis #{index + 1} ({analysis.analysis_type})
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Data Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Raw AI Response Data
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const dataStr = JSON.stringify(
                          analysisData[selectedAnalysis],
                          null,
                          2
                        );
                        navigator.clipboard.writeText(dataStr);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 text-green-400 p-4 rounded-lg overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(analysisData[selectedAnalysis], null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Analysis Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis ID</span>
                    <span className="font-mono text-xs">
                      {analysisData[selectedAnalysis].id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gemstone ID</span>
                    <span className="font-mono text-xs">
                      {analysisData[selectedAnalysis].gemstone_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis Type</span>
                    <span className="font-medium">
                      {analysisData[selectedAnalysis].analysis_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">
                      {Math.round(
                        (analysisData[selectedAnalysis]
                          .confidence_score as number) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium">
                      {analysisData[selectedAnalysis].ai_model_version}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {analysisData[selectedAnalysis].created_at
                        ? new Date(
                            analysisData[selectedAnalysis].created_at
                          ).toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
