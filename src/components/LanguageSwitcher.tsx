"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  const switchLocale = (newLocale: string) => {
    // Use next-intl's router which handles locale switching properly
    // This preserves the current path and query parameters
    router.replace(pathname as any, { locale: newLocale });
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant={locale === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => switchLocale("en")}
        className="text-xs"
      >
        EN
      </Button>
      <Button
        variant={locale === "ru" ? "default" : "outline"}
        size="sm"
        onClick={() => switchLocale("ru")}
        className="text-xs"
      >
        RU
      </Button>
    </div>
  );
}
