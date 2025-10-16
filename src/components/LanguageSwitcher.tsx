"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

import { Button } from "@/shared/components/ui/button";
import { useParams } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations("common");

  const switchLocale = (newLocale: string) => {
    // Use next-intl's router which handles locale switching properly
    // This preserves the current path and query parameters
    // Extract route params (excluding locale) to pass to router.replace
    const routeParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (key !== "locale") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    router.replace(
      // @ts-ignore - next-intl types can be complex with dynamic routes
      { pathname, params: routeParams },
      { locale: newLocale }
    );
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
