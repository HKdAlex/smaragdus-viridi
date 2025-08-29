"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { AlertCircle, CheckCircle, Download, ExternalLink, Shield } from "lucide-react";
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

// Certificate authority information
const CERTIFICATE_AUTHORITIES = {
  GIA: {
    name: "Gemological Institute of America",
    description:
      "The world's foremost authority on diamonds, colored stones and pearls",
    trustLevel: "high",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  Gübelin: {
    name: "Gübelin Gem Lab",
    description:
      "Swiss gemological laboratory renowned for colored stone expertise",
    trustLevel: "high",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  SSEF: {
    name: "Swiss Gemmological Institute",
    description: "Leading European laboratory for gemstone identification",
    trustLevel: "high",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  AGS: {
    name: "American Gem Society",
    description:
      "Scientific approach to diamond grading and gemstone evaluation",
    trustLevel: "high",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  other: {
    name: "Other Certificate",
    description: "Additional certification from recognized authority",
    trustLevel: "medium",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
} as const;

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

  const getTrustBadge = (type: keyof typeof CERTIFICATE_AUTHORITIES) => {
    const authority = CERTIFICATE_AUTHORITIES[type];
    const isHighTrust = authority.trustLevel === "high";

    return (
      <Badge
        variant={isHighTrust ? "default" : "secondary"}
        className={`${
          isHighTrust
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {isHighTrust ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <AlertCircle className="w-3 h-3 mr-1" />
        )}
        {isHighTrust ? t("trustLevels.verifiedAuthority") : t("trustLevels.recognizedAuthority")}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {certifications.map((cert) => {
            const authority =
              CERTIFICATE_AUTHORITIES[
                cert.certificate_type as keyof typeof CERTIFICATE_AUTHORITIES
              ] || CERTIFICATE_AUTHORITIES.other;

            return (
              <div
                key={cert.id}
                className={`p-4 rounded-lg border ${authority.bgColor}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${authority.color} mb-1`}>
                      {t(`authorities.${cert.certificate_type}.name`, { fallback: authority.name })}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {t(`authorities.${cert.certificate_type}.description`, { fallback: authority.description })}
                    </p>
                    {getTrustBadge(
                      cert.certificate_type as keyof typeof CERTIFICATE_AUTHORITIES
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {cert.certificate_number && (
                    <p className="text-gray-700">
                      {t("certificateNumber", { number: cert.certificate_number })}
                    </p>
                  )}
                  {cert.issued_date && (
                    <p className="text-gray-700">
                      {t("issuedDate", { date: formatDate(cert.issued_date) })}
                    </p>
                  )}
                </div>

                {cert.certificate_url && (
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(cert.certificate_url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t("viewCertificate")}
                    </Button>

                    {cert.certificate_type === "GIA" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Handle GIA certificate download
                          window.open(cert.certificate_url, "_blank");
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t("downloadCertificate")}
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
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t("downloadCertificate")}
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
