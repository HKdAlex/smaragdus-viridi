import { BadgeCheck, BadgeDollarSign, Gem, Truck } from "lucide-react";

import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Hero } from "@/components/home/Hero";
import { ProCTA } from "@/components/home/ProCTA";
import { ValueProps } from "@/components/home/ValueProps";
import {
    PremiumHome,
    type PremiumContent,
} from "@/components/home/premium";
import { getTranslations } from "next-intl/server";

interface HomePageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ premium?: string }>;
}

export default async function HomePage({
  params,
  searchParams,
}: HomePageProps) {
  const { locale } = await params;
  const { premium } = searchParams ? await searchParams : {};
  const t = await getTranslations({ locale, namespace: "home" });

  const premiumFlag = premium?.toLowerCase();
  const envFlag = process.env.NEXT_PUBLIC_PREMIUM_HOME;
  const isPremium =
    premiumFlag === "0" || premiumFlag === "false"
      ? false
      : envFlag === "false"
        ? false
        : envFlag === "true" || premiumFlag === "1" || premiumFlag === "true"
          ? true
          : true;

  if (isPremium) {
    const trustItems = t.raw("premium.trust.items") as string[];
    const trustStats = t.raw("premium.trust.stats") as Array<{
      label: string;
      value: string;
    }>;
    const collectionItems = t.raw("premium.collections.items") as Array<{
      title: string;
      subtitle: string;
      imageAlt: string;
      ctaLabel: string;
    }>;

    const premiumContent: PremiumContent = {
      hero: {
        eyebrow: t("premium.hero.eyebrow"),
        title: t("premium.hero.title"),
        titleHighlight: t("premium.hero.titleHighlight"),
        subtitle: t("premium.hero.subtitle"),
        primaryLabel: t("premium.hero.primaryLabel"),
        secondaryLabel: t("premium.hero.secondaryLabel"),
        primaryHref: "/catalog",
        secondaryHref: "/contact",
        imageSrc: "/images/hero/hero-2.webp",
        imageAlt: t("premium.hero.imageAlt"),
      },
      trust: {
        label: t("premium.trust.label"),
        items: trustItems,
        stats: trustStats,
      },
      collections: {
        title: t("premium.collections.title"),
        subtitle: t("premium.collections.subtitle"),
        items: collectionItems.map((item, index) => {
          const fallbackImage = "/images/hero/hero-1.webp";
          const imageMap = [
            "/images/hero/hero-1.webp",
            "/images/hero/hero-3.webp",
            "/images/hero/hero-0.webp",
          ];
          const hrefMap = [
            { pathname: "/catalog" as const, query: { types: "emerald" } },
            { pathname: "/catalog" as const, query: { types: "diamond" } },
            { pathname: "/catalog" as const, query: { types: "sapphire" } },
          ] as const;
          return {
            ...item,
            imageSrc: imageMap[index] ?? fallbackImage,
            href: hrefMap[index] ?? ({ pathname: "/catalog" } as const),
          };
        }),
      },
      pillars: {
        eyebrow: t("premium.pillars.eyebrow"),
        title: t("premium.pillars.title"),
        items: t.raw("premium.pillars.items") as Array<{
          title: string;
          description: string;
        }>,
      },
      editorial: {
        title: t("premium.editorial.title"),
        subtitle: t("premium.editorial.subtitle"),
        body: t("premium.editorial.body"),
        imageSrc: "/images/hero/hero-4.webp",
        imageAlt: t("premium.editorial.imageAlt"),
        ctaLabel: t("premium.editorial.ctaLabel"),
        ctaHref: "/about",
      },
      expertise: {
        title: t("premium.expertise.title"),
        subtitle: t("premium.expertise.subtitle"),
        steps: t.raw("premium.expertise.steps") as Array<{
          title: string;
          description: string;
        }>,
      },
      personalization: {
        eyebrow: t("premium.personalization.eyebrow"),
        cardLabel: t("premium.personalization.cardLabel"),
        title: t("premium.personalization.title"),
        subtitle: t("premium.personalization.subtitle"),
        note: t("premium.personalization.note"),
        actions: [
          {
            label: t("premium.personalization.actions.emeralds"),
            href: { pathname: "/catalog", query: { types: "emerald" } },
          },
          {
            label: t("premium.personalization.actions.diamonds"),
            href: { pathname: "/catalog", query: { types: "diamond" } },
          },
          {
            label: t("premium.personalization.actions.sapphires"),
            href: { pathname: "/catalog", query: { types: "sapphire" } },
          },
          {
            label: t("premium.personalization.actions.bespoke"),
            href: "/contact",
          },
        ],
      },
      finalCta: {
        eyebrow: t("premium.finalCta.eyebrow"),
        title: t("premium.finalCta.title"),
        subtitle: t("premium.finalCta.subtitle"),
        primaryLabel: t("premium.finalCta.primaryLabel"),
        secondaryLabel: t("premium.finalCta.secondaryLabel"),
        primaryHref: "/catalog",
        secondaryHref: "/contact",
        imageSrc: "/images/hero/hero-3.webp",
        imageAlt: t("premium.finalCta.imageAlt"),
      },
    };

    return <PremiumHome content={premiumContent} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero
        title={`${t("hero.title")} ${t("hero.titleHighlight")}`}
        subtitle={t("hero.subtitle")}
        primaryHref="/catalog"
        secondaryHref="/contact"
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
            href: { pathname: "/catalog", query: { types: "emerald" } },
            imageSrc:
              "https://ik.imagekit.io/gemsonline/wp-content/uploads/2025/01/Emrald_gemstone-1.jpg",
            imageAlt: t("featured.emeralds.alt"),
          },
          {
            title: t("featured.diamonds.title"),
            subtitle: t("featured.diamonds.subtitle"),
            href: { pathname: "/catalog", query: { types: "diamond" } },
            imageSrc:
              "https://labgrowndiamondscalgary.com/sitefiles/wp-content/uploads/2024/02/lab-grown-diamonds.png",
            imageAlt: t("featured.diamonds.alt"),
          },
          {
            title: t("featured.sapphires.title"),
            subtitle: t("featured.sapphires.subtitle"),
            href: { pathname: "/catalog", query: { types: "sapphire" } },
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
        primaryHref="/contact"
        secondaryHref="/catalog"
        primaryLabel={t("proCta.requestSourcing")}
        secondaryLabel={t("proCta.browseCatalog")}
        backgroundImageSrc="/images/hero/hero-4.webp"
      />
    </div>
  );
}
