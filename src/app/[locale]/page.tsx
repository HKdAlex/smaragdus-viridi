import { BadgeCheck, BadgeDollarSign, Gem, Truck } from "lucide-react";

import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Hero } from "@/components/home/Hero";
import { ProCTA } from "@/components/home/ProCTA";
import { ValueProps } from "@/components/home/ValueProps";
import { getTranslations } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const withLocale = (path: string) => {
    if (path.startsWith("http")) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `/${locale}${normalized}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero
        title={`${t("hero.title")} ${t("hero.titleHighlight")}`}
        subtitle={t("hero.subtitle")}
        primaryHref={withLocale("/catalog")}
        secondaryHref={withLocale("/contact")}
        primaryLabel={t("hero.browseCatalog")}
        secondaryLabel={t("hero.contactSales")}
        imageSrc="/images/hero/hero-0.webp"
        imageAlt={t("hero.imageAlt")}
        trustItems={[
          t("featured.title"),
          t("hero.giaCertified"),
          t("hero.worldwideShipping"),
        ]}
      />

      <CategoryGrid
        items={[
          {
            title: t("featured.emeralds.title"),
            subtitle: t("featured.emeralds.subtitle"),
            href: withLocale("/catalog?types=emerald"),
            imageSrc:
              "https://ik.imagekit.io/gemsonline/wp-content/uploads/2025/01/Emrald_gemstone-1.jpg",
            imageAlt: t("featured.emeralds.alt"),
          },
          {
            title: t("featured.diamonds.title"),
            subtitle: t("featured.diamonds.subtitle"),
            href: withLocale("/catalog?types=diamond"),
            imageSrc:
              "https://labgrowndiamondscalgary.com/sitefiles/wp-content/uploads/2024/02/lab-grown-diamonds.png",
            imageAlt: t("featured.diamonds.alt"),
          },
          {
            title: t("featured.sapphires.title"),
            subtitle: t("featured.sapphires.subtitle"),
            href: withLocale("/catalog?types=sapphire"),
            imageSrc: "/images/misc/sapphires.webp",
            imageAlt: t("featured.sapphires.alt"),
          },
        ]}
      />

      <ValueProps
        items={[
          {
            icon: BadgeCheck,
            title: t("valueProps.authenticity.title"),
            description: t("valueProps.authenticity.description"),
          },
          {
            icon: Gem,
            title: t("valueProps.quality.title"),
            description: t("valueProps.quality.description"),
          },
          {
            icon: Truck,
            title: t("valueProps.delivery.title"),
            description: t("valueProps.delivery.description"),
          },
          {
            icon: BadgeDollarSign,
            title: t("valueProps.pricing.title"),
            description: t("valueProps.pricing.description"),
          },
        ]}
      />

      <ProCTA
        title={t("proCta.title")}
        subtitle={t("proCta.subtitle")}
        primaryHref={withLocale("/contact")}
        secondaryHref={withLocale("/catalog")}
        primaryLabel={t("proCta.requestSourcing")}
        secondaryLabel={t("proCta.browseCatalog")}
        backgroundImageSrc="/images/hero/hero-4.webp"
      />
    </div>
  );
}
