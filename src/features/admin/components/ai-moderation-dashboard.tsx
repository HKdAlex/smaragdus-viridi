"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/shared/types/database";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Edit2,
  Save,
  X,
} from "lucide-react";

type AIData = Tables<"gemstones_ai_v6">;
type Gemstone = Tables<"gemstones">;

interface AIDataWithGemstone extends AIData {
  gemstone: Gemstone | null;
}

interface ConfidenceScore {
  field: string;
  score: number | null;
  label: string;
}

const APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_revision",
] as const;

export function AIModerationDashboard() {
  const t = useTranslations("admin");
  const [aiData, setAiData] = useState<AIDataWithGemstone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterNeedsReview, setFilterNeedsReview] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<AIDataWithGemstone | null>(
    null
  );
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Partial<AIData>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAIData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("gemstones_ai_v6")
        .select(
          `
          *,
          gemstone:gemstones(*)
        `
        )
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("approval_status", filterStatus);
      }

      if (filterNeedsReview === "true") {
        query = query.eq("needs_review", true);
      } else if (filterNeedsReview === "false") {
        query = query.eq("needs_review", false);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setAiData((data as any) || []);
    } catch (err) {
      console.error("Error loading AI data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load AI data"
      );
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterNeedsReview]);

  useEffect(() => {
    loadAIData();
  }, [loadAIData]);

  const getConfidenceScores = (item: AIDataWithGemstone): ConfidenceScore[] => {
    return [
      {
        field: "overall",
        score: item.confidence_score ? Number(item.confidence_score) : null,
        label: "Overall Confidence",
      },
      {
        field: "cut",
        score: item.cut_detection_confidence
          ? Number(item.cut_detection_confidence)
          : null,
        label: "Cut Detection",
      },
      {
        field: "color",
        score: item.color_detection_confidence
          ? Number(item.color_detection_confidence)
          : null,
        label: "Color Detection",
      },
    ];
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "needs_revision":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            Needs Revision
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const handleSelectItem = (item: AIDataWithGemstone) => {
    setSelectedItem(item);
    setEditedData({});
    setEditMode(false);
    setError(null);
    setSuccess(null);
  };

  const handleEditField = (field: keyof AIData, value: any) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdits = async () => {
    if (!selectedItem) return;

    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from("gemstones_ai_v6")
        .update({
          ...editedData,
          updated_at: new Date().toISOString(),
        })
        .eq("gemstone_id", selectedItem.gemstone_id);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Changes saved successfully");
      setEditMode(false);
      await loadAIData();
      
      // Update selected item
      const updatedItem = aiData.find(
        (item) => item.gemstone_id === selectedItem.gemstone_id
      );
      if (updatedItem) {
        setSelectedItem(updatedItem);
      }
    } catch (err) {
      console.error("Error saving edits:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (item: AIDataWithGemstone) => {
    try {
      setSaving(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from("gemstones_ai_v6")
        .update({
          approval_status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          needs_review: false,
        })
        .eq("gemstone_id", item.gemstone_id);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Content approved successfully");
      await loadAIData();
    } catch (err) {
      console.error("Error approving content:", err);
      setError(err instanceof Error ? err.message : "Failed to approve content");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (item: AIDataWithGemstone) => {
    try {
      setSaving(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from("gemstones_ai_v6")
        .update({
          approval_status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          needs_review: true,
        })
        .eq("gemstone_id", item.gemstone_id);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Content rejected");
      await loadAIData();
    } catch (err) {
      console.error("Error rejecting content:", err);
      setError(err instanceof Error ? err.message : "Failed to reject content");
    } finally {
      setSaving(false);
    }
  };

  const renderConfidenceBar = (score: number | null) => {
    if (score === null) return <span className="text-gray-400">N/A</span>;

    const percentage = Math.round(score * 100);
    const color =
      percentage >= 80
        ? "bg-green-500"
        : percentage >= 60
          ? "bg-yellow-500"
          : "bg-red-500";

    return (
      <div className="flex items-center gap-2">
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("aiModeration.title")}</h2>
        <Button onClick={loadAIData} disabled={loading}>
          {t("aiModeration.refresh")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {APPROVAL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ").toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterNeedsReview} onValueChange={setFilterNeedsReview}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by review flag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="true">Needs Review</SelectItem>
            <SelectItem value="false">Reviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List Panel */}
        <Card>
          <CardHeader>
            <CardTitle>{t("aiModeration.aiGeneratedContent", { count: aiData.length })}</CardTitle>
            <CardDescription>
              {t("aiModeration.clickToView")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">{t("aiModeration.loading")}</div>
            ) : aiData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t("aiModeration.noItems")}
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {aiData.map((item) => (
                  <div
                    key={item.gemstone_id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedItem?.gemstone_id === item.gemstone_id
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {item.gemstone?.serial_number || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.gemstone?.name || "N/A"}
                        </p>
                      </div>
                      {getStatusBadge(item.approval_status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Confidence:{" "}
                        {item.confidence_score
                          ? `${Math.round(Number(item.confidence_score) * 100)}%`
                          : "N/A"}
                      </span>
                      {item.needs_review && (
                        <Badge variant="outline" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Review Needed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedItem ? "Content Details" : t("aiModeration.selectItem")}
            </CardTitle>
            {selectedItem && (
              <div className="flex gap-2 mt-2">
                {!editMode ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setEditMode(true)}
                      variant="outline"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(selectedItem)}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReject(selectedItem)}
                      disabled={saving}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSaveEdits}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditMode(false);
                        setEditedData({});
                      }}
                      variant="outline"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedItem ? (
              <div className="text-center py-8 text-gray-500">
                {t("aiModeration.selectItemDescription")}
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {/* Confidence Scores */}
                <div>
                  <h3 className="font-semibold mb-3">Confidence Scores</h3>
                  <div className="space-y-2">
                    {getConfidenceScores(selectedItem).map((score) => (
                      <div key={score.field}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{score.label}</span>
                        </div>
                        {renderConfidenceBar(score.score)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detection Results */}
                <div>
                  <h3 className="font-semibold mb-3">AI Detection Results</h3>
                  <div className="space-y-2 text-sm">
                    {selectedItem.detected_cut && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Detected Cut:</span>
                        <span className="font-medium">
                          {selectedItem.detected_cut}
                          {selectedItem.cut_matches_metadata !== null && (
                            <Badge
                              variant={
                                selectedItem.cut_matches_metadata
                                  ? "default"
                                  : "destructive"
                              }
                              className="ml-2"
                            >
                              {selectedItem.cut_matches_metadata
                                ? "Matches"
                                : "Mismatch"}
                            </Badge>
                          )}
                        </span>
                      </div>
                    )}
                    {selectedItem.detected_color && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Detected Color:</span>
                        <span className="font-medium">
                          {selectedItem.detected_color}
                          {selectedItem.color_matches_metadata !== null && (
                            <Badge
                              variant={
                                selectedItem.color_matches_metadata
                                  ? "default"
                                  : "destructive"
                              }
                              className="ml-2"
                            >
                              {selectedItem.color_matches_metadata
                                ? "Matches"
                                : "Mismatch"}
                            </Badge>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Content Tabs */}
                <Tabs defaultValue="descriptions">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
                    <TabsTrigger value="marketing">Marketing</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  </TabsList>

                  <TabsContent value="descriptions" className="space-y-4">
                    {/* Technical Description EN */}
                    <div>
                      <label className="text-sm font-medium">
                        Technical Description (EN)
                      </label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.technical_description_en ??
                            selectedItem.technical_description_en ??
                            ""
                          }
                          onChange={(e) =>
                            handleEditField(
                              "technical_description_en",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedItem.technical_description_en || "N/A"}
                        </p>
                      )}
                    </div>

                    {/* Technical Description RU */}
                    <div>
                      <label className="text-sm font-medium">
                        Technical Description (RU)
                      </label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.technical_description_ru ??
                            selectedItem.technical_description_ru ??
                            ""
                          }
                          onChange={(e) =>
                            handleEditField(
                              "technical_description_ru",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedItem.technical_description_ru || "N/A"}
                        </p>
                      )}
                    </div>

                    {/* Emotional Description EN */}
                    <div>
                      <label className="text-sm font-medium">
                        Emotional Description (EN)
                      </label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.emotional_description_en ??
                            selectedItem.emotional_description_en ??
                            ""
                          }
                          onChange={(e) =>
                            handleEditField(
                              "emotional_description_en",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedItem.emotional_description_en || "N/A"}
                        </p>
                      )}
                    </div>

                    {/* Emotional Description RU */}
                    <div>
                      <label className="text-sm font-medium">
                        Emotional Description (RU)
                      </label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.emotional_description_ru ??
                            selectedItem.emotional_description_ru ??
                            ""
                          }
                          onChange={(e) =>
                            handleEditField(
                              "emotional_description_ru",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedItem.emotional_description_ru || "N/A"}
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="marketing" className="space-y-4">
                    {/* Marketing Highlights EN */}
                    <div>
                      <label className="text-sm font-medium">
                        Marketing Highlights (EN)
                      </label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.marketing_highlights
                              ? (editedData.marketing_highlights as string[]).join(
                                  "\n"
                                )
                              : selectedItem.marketing_highlights
                                ? selectedItem.marketing_highlights.join("\n")
                                : ""
                          }
                          onChange={(e) =>
                            handleEditField(
                              "marketing_highlights",
                              e.target.value.split("\n")
                            )
                          }
                          rows={5}
                          placeholder="One highlight per line"
                          className="mt-1"
                        />
                      ) : (
                        <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
                          {selectedItem.marketing_highlights?.map(
                            (highlight, idx) => (
                              <li key={idx}>{highlight}</li>
                            )
                          ) || <li>N/A</li>}
                        </ul>
                      )}
                    </div>

                    {/* Marketing Highlights RU */}
                    <div>
                      <label className="text-sm font-medium">
                        Marketing Highlights (RU)
                      </label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.marketing_highlights_ru
                              ? (editedData.marketing_highlights_ru as string[]).join(
                                  "\n"
                                )
                              : selectedItem.marketing_highlights_ru
                                ? selectedItem.marketing_highlights_ru.join("\n")
                                : ""
                          }
                          onChange={(e) =>
                            handleEditField(
                              "marketing_highlights_ru",
                              e.target.value.split("\n")
                            )
                          }
                          rows={5}
                          placeholder="One highlight per line"
                          className="mt-1"
                        />
                      ) : (
                        <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
                          {selectedItem.marketing_highlights_ru?.map(
                            (highlight, idx) => (
                              <li key={idx}>{highlight}</li>
                            )
                          ) || <li>N/A</li>}
                        </ul>
                      )}
                    </div>

                    {/* Promotional Text EN */}
                    <div>
                      <label className="text-sm font-medium">
                        Promotional Text (EN)
                      </label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.promotional_text ??
                            selectedItem.promotional_text ??
                            ""
                          }
                          onChange={(e) =>
                            handleEditField("promotional_text", e.target.value)
                          }
                          rows={4}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedItem.promotional_text || "N/A"}
                        </p>
                      )}
                    </div>

                    {/* Promotional Text RU */}
                    <div>
                      <label className="text-sm font-medium">
                        Promotional Text (RU)
                      </label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.promotional_text_ru ??
                            selectedItem.promotional_text_ru ??
                            ""
                          }
                          onChange={(e) =>
                            handleEditField("promotional_text_ru", e.target.value)
                          }
                          rows={4}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedItem.promotional_text_ru || "N/A"}
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="metadata" className="space-y-4">
                    {/* Review Notes */}
                    <div>
                      <label className="text-sm font-medium">Review Notes</label>
                      {editMode ? (
                        <Textarea
                          value={
                            editedData.review_notes ??
                            selectedItem.review_notes ??
                            ""
                          }
                          onChange={(e) =>
                            handleEditField("review_notes", e.target.value)
                          }
                          rows={3}
                          placeholder="Add notes about this AI content..."
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedItem.review_notes || "No notes"}
                        </p>
                      )}
                    </div>

                    {/* Metadata Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Model Version:</span>
                        <p className="font-medium">
                          {selectedItem.model_version || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Used Images:</span>
                        <p className="font-medium">
                          {selectedItem.used_images ? "Yes" : "No"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Generation Cost:</span>
                        <p className="font-medium">
                          {selectedItem.generation_cost_usd
                            ? `$${Number(selectedItem.generation_cost_usd).toFixed(4)}`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Generation Time:</span>
                        <p className="font-medium">
                          {selectedItem.generation_time_ms
                            ? `${selectedItem.generation_time_ms}ms`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <p className="font-medium">
                          {new Date(selectedItem.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Updated:</span>
                        <p className="font-medium">
                          {new Date(selectedItem.updated_at).toLocaleString()}
                        </p>
                      </div>
                      {selectedItem.reviewed_at && (
                        <>
                          <div>
                            <span className="text-gray-600">Reviewed At:</span>
                            <p className="font-medium">
                              {new Date(
                                selectedItem.reviewed_at
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Reviewed By:</span>
                            <p className="font-medium">
                              {selectedItem.reviewed_by || "N/A"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

