"use client";

import {
    COMPANY_CONTACT,
    companyMailtoHref,
    companyTelHref,
    companyWhatsAppHref,
} from "@/config/company-contact";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
    Award,
    Clock,
    Globe,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Send,
    Shield,
    Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ContactInfoSectionProps {
  className?: string;
}

export function ContactMethods({ className = "" }: ContactInfoSectionProps) {
  const t = useTranslations("contact");

  const contactMethods = [
    {
      icon: Mail,
      title: t("info.email.title"),
      items: [
        {
          label: t("info.email.general"),
          value: COMPANY_CONTACT.email,
          href: companyMailtoHref(),
          external: false,
        },
      ],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Phone,
      title: t("info.phone.title"),
      items: [
        {
          label: t("info.phone.main"),
          value: COMPANY_CONTACT.phone.display,
          href: companyTelHref(),
          external: false,
        },
      ],
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: MessageCircle,
      title: t("info.messaging.title"),
      items: [
        {
          label: t("info.messaging.whatsapp"),
          value: COMPANY_CONTACT.whatsapp.display,
          href: companyWhatsAppHref(),
          external: true,
        },
      ],
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const handleContactClick = (href: string, external = false) => {
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
  };

  return (
    <div className={`grid gap-4 md:gap-6 ${className}`}>
      {contactMethods.map((method, index) => {
        const IconComponent = method.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${method.bgColor} mb-4`}
              >
                <IconComponent className={`w-6 h-6 ${method.color}`} />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-3">
                {method.title}
              </h3>

              <div className="space-y-2">
                {method.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm text-muted-foreground break-words">
                        {item.value}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleContactClick(item.href, item.external)}
                      className="shrink-0"
                    >
                      {item.external ? (
                        <Send className="w-4 h-4" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function ContactSupportOverview({
  className = "",
}: ContactInfoSectionProps) {
  const t = useTranslations("contact");

  const businessInfo = [
    {
      icon: Clock,
      title: t("info.businessHours.title"),
      content: (
        <div className="space-y-1 text-sm">
          <p className="font-medium">{t("info.businessHours.weekdays")}</p>
          <p className="text-muted-foreground">
            {t("info.businessHours.weekdayHours")}
          </p>
          <p className="font-medium mt-2">{t("info.businessHours.weekends")}</p>
          <p className="text-muted-foreground">
            {t("info.businessHours.saturdayHours")}
          </p>
          <p className="text-muted-foreground">
            {t("info.businessHours.sundayClosed")}
          </p>
          <p className="text-muted-foreground pt-1">
            {t("info.businessHours.timezone")}
          </p>
        </div>
      ),
    },
    {
      icon: MapPin,
      title: t("info.location.title"),
      content: (
        <div className="space-y-1 text-sm">
          <p className="font-medium">{t("info.location.office")}</p>
          <p className="text-muted-foreground">
            {t("info.location.address")}
          </p>
        </div>
      ),
    },
    {
      icon: Globe,
      title: t("info.languages.title"),
      content: (
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            {t("info.languages.supported")}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-1 bg-muted rounded text-xs">
              {t("info.languages.english")}
            </span>
            <span className="px-2 py-1 bg-muted rounded text-xs">
              {t("info.languages.russian")}
            </span>
            <span className="px-2 py-1 bg-muted rounded text-xs">
              {t("info.languages.chinese")}
            </span>
            <span className="px-2 py-1 bg-muted rounded text-xs">
              {t("info.languages.french")}
            </span>
          </div>
        </div>
      ),
    },
  ];

  const serviceHighlights = [
    {
      icon: Users,
      title: t("info.services.consultation"),
      description: t("info.services.consultationDesc"),
    },
    {
      icon: Shield,
      title: t("info.services.certification"),
      description: t("info.services.certificationDesc"),
    },
    {
      icon: Award,
      title: t("info.services.appraisal"),
      description: t("info.services.appraisalDesc"),
    },
  ];

  const handleContactClick = (href: string, external = false) => {
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {businessInfo.map((info, index) => {
          const IconComponent = info.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
                    <IconComponent className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      {info.title}
                    </h3>
                    {info.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t("info.services.title")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {serviceHighlights.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div
                  key={index}
                  className="rounded-lg border border-border/60 p-4 text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-3">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">
                    {service.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("info.emergency.title")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t("info.emergency.description")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="default"
              onClick={() => handleContactClick(companyTelHref())}
              className="inline-flex items-center"
            >
              <Phone className="w-4 h-4 mr-2" />
              {t("info.emergency.call")}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                handleContactClick(
                  companyWhatsAppHref(t("info.emergency.whatsappMessage")),
                  true
                )
              }
              className="inline-flex items-center"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t("info.emergency.whatsapp")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContactInfo({ className = "" }: ContactInfoSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <ContactMethods />
      <ContactSupportOverview />
    </div>
  );
}
