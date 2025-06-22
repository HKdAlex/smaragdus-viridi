"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ExternalLink,
  FileText,
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
import type { DatabaseCertification } from "@/shared/types";

interface CertificationDisplayProps {
  certifications: DatabaseCertification[];
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
        {isHighTrust ? "Verified Authority" : "Recognized Authority"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Certifications & Authentication
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
                className={`p-4 rounded-lg border ${authority.bgColor} border-current/20`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${authority.color}`}>
                        {authority.name}
                      </h4>
                      {getTrustBadge(
                        cert.certificate_type as keyof typeof CERTIFICATE_AUTHORITIES
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {authority.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Certificate Number */}
                  {cert.certificate_number && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Certificate Number
                      </label>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {cert.certificate_number}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Issue Date */}
                  {cert.issued_date && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Issue Date
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(cert.issued_date)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Certificate Actions */}
                <div className="flex gap-3">
                  {cert.certificate_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        cert.certificate_url &&
                        window.open(cert.certificate_url, "_blank")
                      }
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Certificate
                    </Button>
                  )}

                  {cert.certificate_number &&
                    cert.certificate_type === "GIA" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://www.gia.edu/report-check?reportno=${cert.certificate_number}`,
                            "_blank"
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Verify Online
                      </Button>
                    )}
                </div>

                {/* Certificate Features */}
                <div className="mt-4 p-3 bg-white/50 rounded-md">
                  <h5 className="text-sm font-medium mb-2">
                    What this certificate validates:
                  </h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      Gemstone authenticity and natural origin
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      Accurate grading of the 4Cs (Cut, Color, Clarity, Carat)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      Professional measurements and dimensions
                    </li>
                    {cert.certificate_type === "GIA" && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-current rounded-full" />
                        Treatment detection and disclosure
                      </li>
                    )}
                    {(cert.certificate_type === "Gübelin" ||
                      cert.certificate_type === "SSEF") && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-current rounded-full" />
                        Geographic origin determination
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}

          {/* Certification Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Certification Guarantee</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All certificates are verified for authenticity. We guarantee
                  that the gemstone matches the specifications detailed in the
                  provided certificates. Our team validates each certificate
                  against the issuing laboratory's database when possible.
                </p>
                {certifications.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Multiple certifications provide additional confidence in the
                    gemstone's quality and authenticity.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
