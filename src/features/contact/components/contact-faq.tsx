"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface ContactFAQProps {
  className?: string;
}

export function ContactFAQ({ className = "" }: ContactFAQProps) {
  const t = useTranslations('contact.faq');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const faqItems = [
    'response_time',
    'languages', 
    'minimum_order',
    'certification',
    'shipping'
  ];

  const toggleItem = (itemKey: string) => {
    setOpenItems(prev => 
      prev.includes(itemKey)
        ? prev.filter(key => key !== itemKey)
        : [...prev, itemKey]
    );
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            {t('title')}
          </h3>
        </div>
        
        <div className="space-y-4">
          {faqItems.map((item) => {
            const isOpen = openItems.includes(item);
            return (
              <div key={item} className="border rounded-lg">
                <button
                  onClick={() => toggleItem(item)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${item}`}
                >
                  <span className="font-medium text-foreground">
                    {t(`items.${item}.question`)}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div 
                    id={`faq-${item}`}
                    className="px-4 pb-3 text-muted-foreground"
                  >
                    {t(`items.${item}.answer`)}
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
