"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  Send, 
  Clock, 
  MapPin, 
  Globe,
  Users,
  Shield,
  Award
} from "lucide-react";

interface ContactInfoProps {
  className?: string;
}

export function ContactInfo({ className = "" }: ContactInfoProps) {
  const t = useTranslations();

  const contactMethods = [
    {
      icon: Mail,
      title: t('contact.info.email.title'),
      items: [
        { label: t('contact.info.email.general'), value: "info@crystallique.com", href: "mailto:info@crystallique.com", external: false },
        { label: t('contact.info.email.sales'), value: "sales@crystallique.com", href: "mailto:sales@crystallique.com", external: false },
        { label: t('contact.info.email.support'), value: "support@crystallique.com", href: "mailto:support@crystallique.com", external: false },
      ],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Phone,
      title: t('contact.info.phone.title'),
      items: [
        { label: t('contact.info.phone.main'), value: "+1 (555) 123-4567", href: "tel:+15551234567", external: false },
        { label: t('contact.info.phone.international'), value: "+1 (555) 123-4568", href: "tel:+15551234568", external: false },
      ],
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: MessageCircle,
      title: t('contact.info.messaging.title'),
      items: [
        { 
          label: "WhatsApp", 
          value: "+1 (555) 123-4567", 
          href: "https://wa.me/15551234567?text=Hello%20Crystallique%20team",
          external: true
        },
        { 
          label: "Telegram", 
          value: "@crystallique_gems", 
          href: "https://t.me/crystallique_gems",
          external: true
        },
      ],
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const businessInfo = [
    {
      icon: Clock,
      title: t('contact.info.businessHours.title'),
      content: (
        <div className="space-y-1 text-sm">
          <p className="font-medium">{t('contact.info.businessHours.weekdays')}</p>
          <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
          <p className="font-medium mt-2">{t('contact.info.businessHours.weekends')}</p>
          <p className="text-muted-foreground">Saturday: 10:00 AM - 4:00 PM EST</p>
          <p className="text-muted-foreground">Sunday: Closed</p>
        </div>
      ),
    },
    {
      icon: MapPin,
      title: t('contact.info.location.title'),
      content: (
        <div className="space-y-1 text-sm">
          <p className="font-medium">{t('contact.info.location.office')}</p>
          <p className="text-muted-foreground">123 Diamond District</p>
          <p className="text-muted-foreground">New York, NY 10036</p>
          <p className="text-muted-foreground">United States</p>
        </div>
      ),
    },
    {
      icon: Globe,
      title: t('contact.info.languages.title'),
      content: (
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">{t('contact.info.languages.supported')}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-1 bg-muted rounded text-xs">English</span>
            <span className="px-2 py-1 bg-muted rounded text-xs">Русский</span>
            <span className="px-2 py-1 bg-muted rounded text-xs">中文</span>
            <span className="px-2 py-1 bg-muted rounded text-xs">Français</span>
          </div>
        </div>
      ),
    },
  ];

  const serviceHighlights = [
    {
      icon: Users,
      title: t('contact.info.services.consultation'),
      description: t('contact.info.services.consultationDesc'),
    },
    {
      icon: Shield,
      title: t('contact.info.services.certification'),
      description: t('contact.info.services.certificationDesc'),
    },
    {
      icon: Award,
      title: t('contact.info.services.appraisal'),
      description: t('contact.info.services.appraisalDesc'),
    },
  ];

  const handleContactClick = (href: string, external = false) => {
    if (external) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = href;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Contact Methods */}
      <div className="grid gap-4 md:gap-6">
        {contactMethods.map((method, index) => {
          const IconComponent = method.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${method.bgColor} mb-4`}>
                  <IconComponent className={`w-6 h-6 ${method.color}`} />
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {method.title}
                </h3>
                
                <div className="space-y-2">
                  {method.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactClick(item.href, item.external)}
                        className="ml-2"
                      >
                        {item.external ? <Send className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Business Information */}
      <div className="grid gap-4 md:grid-cols-3">
        {businessInfo.map((info, index) => {
          const IconComponent = info.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{info.title}</h3>
                    {info.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service Highlights */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t('contact.info.services.title')}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {serviceHighlights.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} className="text-center p-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-3">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">{service.title}</h4>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('contact.info.emergency.title')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t('contact.info.emergency.description')}
          </p>
          <div className="space-x-4">
            <Button
              variant="default"
              onClick={() => handleContactClick('tel:+15551234567')}
              className="inline-flex items-center"
            >
              <Phone className="w-4 h-4 mr-2" />
              {t('contact.info.emergency.call')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleContactClick('https://wa.me/15551234567?text=URGENT:%20', true)}
              className="inline-flex items-center"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('contact.info.emergency.whatsapp')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
