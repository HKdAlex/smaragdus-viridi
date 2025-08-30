"use client";

import {
  AlertCircle,
  CheckCircle,
  Download,
  ExternalLink,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";

interface Certification {
  id: string;
  certificate_type: string;
  certificate_number?: string;
  certificate_url?: string;
  issued_date?: string;
}

interface CertificationDisplayProps {
  certifications: Certification[];
}

export function CertificationDisplay({
  certifications,
}: CertificationDisplayProps) {
  const t = useTranslations("gemstones.certifications");

  if (certifications.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Certificate authority information
  const CERTIFICATE_AUTHORITIES = {
    GIA: {
      name: t("authorities.GIA.name"),
      description: t("authorities.GIA.description"),
      trustLevel: "high",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    Gübelin: {
      name: t("authorities.Gübelin.name"),
      description: t("authorities.Gübelin.description"),
      trustLevel: "high",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    SSEF: {
      name: t("authorities.SSEF.name"),
      description: t("authorities.SSEF.description"),
      trustLevel: "high",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    AGS: {
      name: t("authorities.AGS.name"),
      description: t("authorities.AGS.description"),
      trustLevel: "high",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    },
    other: {
      name: t("authorities.other.name"),
      description: t("authorities.other.description"),
      trustLevel: "medium",
      color: "text-muted-foreground",
      bgColor: "bg-muted/30",
    },
  } as const;

  const getTrustBadge = (type: keyof typeof CERTIFICATE_AUTHORITIES) => {
    const authority = CERTIFICATE_AUTHORITIES[type];
    const isHighTrust = authority.trustLevel === "high";

    return (
      <Badge
        variant={isHighTrust ? "default" : "secondary"}
        className={`min-h-[24px] ${
          isHighTrust
            ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
            : "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
        }`}
      >
        {isHighTrust ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <AlertCircle className="w-3 h-3 mr-1" />
        )}
        {isHighTrust
          ? t("trustLevels.verifiedAuthority")
          : t("trustLevels.recognizedAuthority")}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <Shield className="w-5 h-5 mr-2 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 sm:space-y-6">
          {certifications.map((cert) => {
            const authority =
              CERTIFICATE_AUTHORITIES[
                (cert.certificate_type as keyof typeof CERTIFICATE_AUTHORITIES) ||
                  "other"
              ];

            return (
              <div
                key={cert.id}
                className={`p-4 sm:p-6 rounded-lg border border-border bg-card/50`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-semibold text-base sm:text-lg ${authority.color} mb-1 truncate`}
                    >
                      {authority.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {authority.description}
                    </p>
                    {getTrustBadge(
                      cert.certificate_type as keyof typeof CERTIFICATE_AUTHORITIES
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {cert.certificate_number && (
                    <p className="text-muted-foreground">
                      {t("certificateNumber", {
                        number: cert.certificate_number,
                      })}
                    </p>
                  )}
                  {cert.issued_date && (
                    <p className="text-muted-foreground">
                      {t("issuedDate", { date: formatDate(cert.issued_date) })}
                    </p>
                  )}
                </div>

                {cert.certificate_url && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(cert.certificate_url, "_blank")
                      }
                      className="min-h-[44px] w-full sm:w-auto text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="hidden sm:inline">
                        {t("viewCertificate")}
                      </span>
                      <span className="sm:hidden">View Certificate</span>
                    </Button>

                    {cert.certificate_type === "GIA" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Handle GIA certificate download
                          window.open(cert.certificate_url, "_blank");
                        }}
                        className="min-h-[44px] w-full sm:w-auto text-sm"
                      >
                        <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">
                          {t("downloadCertificate")}
                        </span>
                        <span className="sm:hidden">Download</span>
                      </Button>
                    )}

                    {(cert.certificate_type === "SSEF" ||
                      cert.certificate_type === "Gübelin") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Handle SSEF/Gübelin certificate download
                          window.open(cert.certificate_url, "_blank");
                        }}
                        className="min-h-[44px] w-full sm:w-auto text-sm"
                      >
                        <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">
                          {t("downloadCertificate")}
                        </span>
                        <span className="sm:hidden">Download</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
