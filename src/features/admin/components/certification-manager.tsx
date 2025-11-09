"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { Tables } from "@/shared/types/database";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Plus, Edit2, Trash2, FileText, Upload } from "lucide-react";

type Certification = Tables<"certifications">;

interface CertificationManagerProps {
  gemstoneId: string;
}

interface CertificationFormData {
  certificate_type: string;
  certificate_number: string;
  certificate_url: string;
  issued_date: string;
}

export function CertificationManager({
  gemstoneId,
}: CertificationManagerProps) {
  const t = useTranslations("admin");
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [formData, setFormData] = useState<CertificationFormData>({
    certificate_type: "",
    certificate_number: "",
    certificate_url: "",
    issued_date: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCertifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/certifications?gemstone_id=${gemstoneId}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load certifications");
      }

      setCertifications(result.data || []);
    } catch (err) {
      console.error("Error loading certifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load certifications"
      );
    } finally {
      setLoading(false);
    }
  }, [gemstoneId]);

  useEffect(() => {
    loadCertifications();
  }, [loadCertifications]);

  const handleOpenDialog = (cert?: Certification) => {
    if (cert) {
      setEditingCert(cert);
      setFormData({
        certificate_type: cert.certificate_type,
        certificate_number: cert.certificate_number || "",
        certificate_url: cert.certificate_url || "",
        issued_date: cert.issued_date || "",
      });
    } else {
      setEditingCert(null);
      setFormData({
        certificate_type: "",
        certificate_number: "",
        certificate_url: "",
        issued_date: "",
      });
    }
    setShowDialog(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCert(null);
    setFormData({
      certificate_type: "",
      certificate_number: "",
      certificate_url: "",
      issued_date: "",
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      // Create a unique file path
      const timestamp = Date.now();
      const fileName = `${gemstoneId}/${timestamp}_${file.name}`;
      const filePath = `certifications/${fileName}`;

      // Upload to Supabase storage via API
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("path", filePath);

      const response = await fetch("/api/admin/storage/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      // Update form data with the uploaded file URL
      setFormData((prev) => ({
        ...prev,
        certificate_url: result.publicUrl,
      }));

      setSuccess("File uploaded successfully");
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.certificate_type.trim()) {
        setError("Certificate type is required");
        return;
      }

      const payload = {
        gemstone_id: gemstoneId,
        certificate_type: formData.certificate_type,
        certificate_number: formData.certificate_number || null,
        certificate_url: formData.certificate_url || null,
        issued_date: formData.issued_date || null,
      };

      let response;
      if (editingCert) {
        // Update existing certification
        response = await fetch(`/api/admin/certifications/${editingCert.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new certification
        response = await fetch("/api/admin/certifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save certification");
      }

      setSuccess(
        editingCert
          ? t("certifications.success.updated")
          : t("certifications.success.created")
      );
      handleCloseDialog();
      await loadCertifications();
    } catch (err) {
      console.error("Error saving certification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save certification"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (certId: string) => {
    if (!confirm(t("certifications.confirmDelete"))) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/certifications/${certId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete certification");
      }

      setSuccess(t("certifications.success.deleted"));
      await loadCertifications();
    } catch (err) {
      console.error("Error deleting certification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete certification"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t("certifications.title")}</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          {t("certifications.addCertification")}
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

      {loading ? (
        <div className="text-center py-8">{t("certifications.loading")}</div>
      ) : certifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>{t("certifications.noCertifications")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certifications.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {cert.certificate_type}
                    </CardTitle>
                    {cert.certificate_number && (
                      <CardDescription>
                        #{cert.certificate_number}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(cert)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(cert.id)}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {cert.issued_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued Date:</span>
                      <span className="font-medium">
                        {new Date(cert.issued_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {cert.certificate_url && (
                    <div>
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Certificate
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      Created: {new Date(cert.created_at!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCert ? t("certifications.editCertification") : t("certifications.addCertification")}
            </DialogTitle>
            <DialogDescription>
              {editingCert
                ? "Update the certification details"
                : "Add a new certification for this gemstone"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Certificate Type <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.certificate_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    certificate_type: e.target.value,
                  }))
                }
                placeholder="e.g., GIA, IGI, AGS"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Certificate Number</label>
              <Input
                value={formData.certificate_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    certificate_number: e.target.value,
                  }))
                }
                placeholder="Certificate number"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Issued Date</label>
              <Input
                type="date"
                value={formData.issued_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    issued_date: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Certificate File</label>
              <div className="mt-1 space-y-2">
                {formData.certificate_url && (
                  <div className="text-sm text-green-600">
                    ✓ File uploaded
                    <a
                      href={formData.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && (
                    <span className="text-sm text-gray-500">Uploading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, JPG, PNG (max 10MB)
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Or paste URL</label>
              <Input
                value={formData.certificate_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    certificate_url: e.target.value,
                  }))
                }
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? "Saving..." : editingCert ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

