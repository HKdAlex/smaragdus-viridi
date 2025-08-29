"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import { Button } from "@/shared/components/ui/button";

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname(); // This includes the locale prefix

  const switchLocale = (newLocale: string) => {
    // Extract the locale-free path by removing the current locale prefix
    const localeFreePath = pathname.replace(`/${locale}`, '') || '/';
    const newPath = `/${newLocale}${localeFreePath}`;
    router.push(newPath);
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
