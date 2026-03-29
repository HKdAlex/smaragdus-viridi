import {
    ArrowRight,
    BadgeCheck,
    Crown,
    Gem,
    HandHeart,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import Image from "next/image";

import { Container } from "@/components/ui/Container";
import type { AppIntlHref } from "@/i18n/app-href";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
    duration,
    ease,
    radius,
    radiusSm,
    sectionY,
    shadowSoft
} from "@/lib/ux/tokens";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

import { PremiumReveal } from "./PremiumReveal";

export type PremiumContent = {
  hero: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
    primaryHref: AppIntlHref;
    secondaryHref: AppIntlHref;
    imageSrc: string;
    imageAlt: string;
  };
  trust: {
    label: string;
    items: string[];
    stats: Array<{ label: string; value: string }>;
  };
  collections: {
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      subtitle: string;
      imageSrc: string;
      imageAlt: string;
      href: AppIntlHref;
      ctaLabel: string;
    }>;
  };
  pillars: {
    eyebrow: string;
    title: string;
    items: Array<{ title: string; description: string }>;
  };
  editorial: {
    title: string;
    subtitle: string;
    body: string;
    imageSrc: string;
    imageAlt: string;
    ctaLabel: string;
    ctaHref: AppIntlHref;
  };
  expertise: {
    title: string;
    subtitle: string;
    steps: Array<{ title: string; description: string }>;
  };
  personalization: {
    eyebrow: string;
    cardLabel: string;
    title: string;
    subtitle: string;
    note: string;
    actions: Array<{ label: string; href: AppIntlHref }>;
  };
  finalCta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
    primaryHref: AppIntlHref;
    secondaryHref: AppIntlHref;
    imageSrc: string;
    imageAlt: string;
  };
};

const pillarIcons = [ShieldCheck, Gem, Crown, HandHeart];

export function PremiumHome({ content }: { content: PremiumContent }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PremiumHero content={content} />
      <PremiumTrust content={content} />
      <PremiumCollections content={content} />
      <PremiumPillars content={content} />
      <PremiumEditorial content={content} />
      <PremiumExpertise content={content} />
      <PremiumPersonalization content={content} />
      <PremiumFinalCta content={content} />
    </div>
  );
}

function PremiumHero({ content }: { content: PremiumContent }) {
  const { hero, trust } = content;
  return (
    <section className="relative overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-neutral-950 dark:text-white">
      <div
        className="absolute inset-0 opacity-100 dark:hidden"
        style={{
          background:
            "radial-gradient(80% 60% at 70% 20%, rgba(182,140,58,0.14) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 hidden opacity-70 dark:block"
        style={{
          background:
            "radial-gradient(80% 60% at 70% 20%, rgba(182,140,58,0.25) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,244,245,0.96) 55%, rgb(244,244,245) 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.88) 60%, rgba(9,9,11,1) 100%)",
        }}
        aria-hidden
      />
      <Container className="relative grid items-center gap-6 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] py-8 sm:py-16 lg:py-28">
        <div className="text-center lg:text-left">
          <PremiumReveal>
            <Badge
              variant="outline"
              className="border-zinc-300/90 text-zinc-600 uppercase tracking-[0.3em] text-[11px] px-4 py-2 dark:border-white/20 dark:text-white/80"
            >
              {hero.eyebrow}
            </Badge>
          </PremiumReveal>
          <PremiumReveal delayMs={80}>
            <h1 className="mt-3 sm:mt-6 font-serif tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-tight">
              {hero.title}{" "}
              <span className="text-amber-800 dark:text-amber-200">
                {hero.titleHighlight}
              </span>
            </h1>
          </PremiumReveal>
          <PremiumReveal delayMs={140}>
            <p className="mt-3 sm:mt-5 text-base sm:text-lg text-zinc-600 max-w-xl mx-auto lg:mx-0 leading-relaxed dark:text-white/75">
              {hero.subtitle}
            </p>
          </PremiumReveal>
          <PremiumReveal delayMs={200}>
            <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className={cn(duration, ease)}>
                <Link href={hero.primaryHref} aria-label={hero.primaryLabel}>
                  {hero.primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-zinc-300 text-zinc-900 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/30 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Link href={hero.secondaryHref} aria-label={hero.secondaryLabel}>
                  {hero.secondaryLabel}
                </Link>
              </Button>
            </div>
          </PremiumReveal>
          <PremiumReveal delayMs={260}>
            <div className="mt-6 sm:mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
              {trust.items.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs tracking-wide text-zinc-700 shadow-sm dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:shadow-none"
                >
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-200" />
                  {item}
                </div>
              ))}
            </div>
          </PremiumReveal>
        </div>
        <PremiumReveal delayMs={160} className="relative">
          <div
            className={cn(
              "relative overflow-hidden bg-zinc-200/90 dark:bg-black/70",
              radius,
              shadowSoft
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-300/40 via-transparent to-transparent dark:from-black/70 dark:via-transparent dark:to-black/10" />
            <div className="relative aspect-[4/5] sm:aspect-[5/6]">
              <Image
                src={hero.imageSrc}
                alt={hero.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
        </PremiumReveal>
      </Container>
    </section>
  );
}

function PremiumTrust({ content }: { content: PremiumContent }) {
  const { trust } = content;
  return (
    <section className="bg-zinc-50 dark:bg-background">
      <Container className={cn("grid items-stretch gap-4 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]", sectionY)}>
        <PremiumReveal className="h-full">
          <div className="grid h-full gap-4 sm:grid-cols-3">
            {trust.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col justify-center rounded-2xl border border-zinc-300 bg-white px-5 py-6 shadow-md dark:border-border/60 dark:bg-card/60 dark:shadow-none"
              >
                <p className="text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </PremiumReveal>
        <PremiumReveal delayMs={120} className="h-full">
          <div className="flex h-full flex-col justify-center rounded-2xl border border-zinc-300 bg-white p-6 shadow-md dark:border-border/60 dark:bg-muted/40 dark:shadow-none">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-600 dark:text-muted-foreground">
              {trust.label}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {trust.items.map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="border-border/60 bg-background/70 text-foreground"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </PremiumReveal>
      </Container>
    </section>
  );
}

function PremiumCollections({ content }: { content: PremiumContent }) {
  const { collections } = content;
  return (
    <section className="bg-zinc-100 text-zinc-950 dark:bg-neutral-950 dark:text-white">
      <Container className={sectionY}>
        <PremiumReveal>
          <SectionHeading
            eyebrow={collections.subtitle}
            title={collections.title}
            align="center"
          />
        </PremiumReveal>
        <div className="mt-6 sm:mt-10 grid gap-6 lg:grid-cols-3">
          {collections.items.map((item, index) => (
            <PremiumReveal key={item.title} delayMs={100 + index * 80}>
              <Link
                href={item.href}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border border-zinc-300 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:shadow-none",
                  duration,
                  ease
                )}
              >
                <div
                  className={cn(
                    "relative overflow-hidden",
                    radiusSm,
                    "aspect-[4/3] bg-zinc-200 dark:bg-black/60"
                  )}
                >
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-5 flex flex-1 flex-col">
                  <p className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
                    {item.subtitle}
                  </p>
                  <span className="mt-auto inline-flex items-center pt-4 text-sm font-medium text-amber-800 dark:text-amber-200">
                    {item.ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </Link>
            </PremiumReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function PremiumPillars({ content }: { content: PremiumContent }) {
  const { pillars } = content;
  return (
    <section className="bg-white dark:bg-background">
      <Container className={sectionY}>
        <PremiumReveal>
          <SectionHeading
            eyebrow={pillars.eyebrow}
            title={pillars.title}
            align="left"
          />
        </PremiumReveal>
        <div className="mt-6 sm:mt-10 grid grid-rows-subgrid gap-6 md:grid-cols-2 lg:grid-cols-4 [&>*]:h-full">
          {pillars.items.map((item, index) => {
            const Icon = pillarIcons[index % pillarIcons.length];
            return (
              <PremiumReveal key={item.title} delayMs={80 + index * 80} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-zinc-300 bg-white px-6 py-7 shadow-md dark:border-border/60 dark:bg-card/60 dark:shadow-none">
                  <div className="flex items-center gap-3 text-amber-700 dark:text-amber-500">
                    <Icon className="h-5 w-5 shrink-0" />
                    <p className="text-sm uppercase tracking-[0.2em] text-zinc-700 dark:text-muted-foreground">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-4 flex-1 text-sm text-zinc-600 leading-relaxed dark:text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </PremiumReveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function PremiumEditorial({ content }: { content: PremiumContent }) {
  const { editorial } = content;
  return (
    <section className="bg-zinc-100 dark:bg-muted/30">
      <Container className={cn("grid gap-6 sm:gap-10 lg:grid-cols-[1fr_1.1fr]", sectionY)}>
        <PremiumReveal>
          <div className="flex flex-col justify-center">
            <SectionHeading
              eyebrow={editorial.subtitle}
              title={editorial.title}
              align="left"
            />
            <p className="mt-6 text-sm sm:text-base text-zinc-600 leading-relaxed dark:text-muted-foreground">
              {editorial.body}
            </p>
            <div className="mt-6">
              <Button asChild variant="link" className="px-0">
                <Link href={editorial.ctaHref}>
                  {editorial.ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </PremiumReveal>
        <PremiumReveal delayMs={120}>
          <div
            className={cn(
              "relative overflow-hidden bg-neutral-900/80",
              radius,
              shadowSoft
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-black/10" />
            <div className="relative aspect-[4/3]">
              <Image
                src={editorial.imageSrc}
                alt={editorial.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </PremiumReveal>
      </Container>
    </section>
  );
}

function PremiumExpertise({ content }: { content: PremiumContent }) {
  const { expertise } = content;
  return (
    <section className="bg-white dark:bg-background">
      <Container className={sectionY}>
        <PremiumReveal>
          <SectionHeading
            eyebrow={expertise.subtitle}
            title={expertise.title}
            align="center"
          />
        </PremiumReveal>
        <div className="mt-6 sm:mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4 [&>*]:h-full">
          {expertise.steps.map((step, index) => (
            <PremiumReveal key={step.title} delayMs={100 + index * 80} className="h-full">
              <div className="flex h-full flex-col rounded-2xl border border-zinc-300 bg-white p-6 shadow-md dark:border-border/60 dark:bg-card/60 dark:shadow-none">
                <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-muted-foreground">
                  <span>0{index + 1}</span>
                  <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-500" />
                </div>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {step.title}
                </p>
                <p className="mt-2 flex-1 text-sm text-zinc-600 leading-relaxed dark:text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </PremiumReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function PremiumPersonalization({ content }: { content: PremiumContent }) {
  const { personalization } = content;
  return (
    <section className="bg-zinc-100 text-zinc-950 dark:bg-neutral-950 dark:text-white">
      <Container className={cn("grid gap-4 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]", sectionY)}>
        <PremiumReveal>
          <div>
            <SectionHeading
              eyebrow={personalization.eyebrow}
              title={personalization.title}
              align="left"
            />
            <p className="mt-4 text-sm text-zinc-600 leading-relaxed dark:text-white/70">
              {personalization.subtitle}
            </p>
          </div>
        </PremiumReveal>
        <PremiumReveal delayMs={120}>
          <div className="rounded-2xl border border-zinc-300 bg-white p-6 shadow-md dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-600 dark:text-white/60">
              {personalization.cardLabel}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {personalization.actions.map((action) => (
                <Button
                  key={action.label}
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-zinc-300 text-zinc-900 hover:bg-zinc-50 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
            <p className="mt-6 text-sm text-zinc-600 dark:text-white/70">
              {personalization.note}
            </p>
          </div>
        </PremiumReveal>
      </Container>
    </section>
  );
}

function PremiumFinalCta({ content }: { content: PremiumContent }) {
  const { finalCta } = content;
  return (
    <section className="bg-background">
      <Container className={sectionY}>
        <PremiumReveal>
          <div className={cn("relative overflow-hidden", radius, shadowSoft)}>
            <div className="absolute inset-0">
              <Image
                src={finalCta.imageSrc}
                alt={finalCta.imageAlt}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/60" aria-hidden />
            <div className="relative px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16 text-white">
              <p className="text-sm uppercase tracking-[0.25em] text-white/70">
                {finalCta.eyebrow}
              </p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-serif">
                {finalCta.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/75 max-w-xl">
                {finalCta.subtitle}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className={cn(duration, ease)}>
                  <Link href={finalCta.primaryHref}>
                    {finalCta.primaryLabel}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className={cn(
                    duration,
                    ease,
                    // Outline variant uses bg-background (white in light theme); force glass-on-image so label stays visible
                    "border-white/50 bg-transparent text-white shadow-none",
                    "hover:bg-white/15 hover:text-white",
                    "focus-visible:ring-white/50"
                  )}
                >
                  <Link href={finalCta.secondaryHref}>
                    {finalCta.secondaryLabel}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </PremiumReveal>
      </Container>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
  tone?: "default" | "inverse";
};

function SectionHeading({
  eyebrow,
  title,
  align = "left",
  tone = "default",
}: SectionHeadingProps) {
  const isCentered = align === "center";
  const isInverse = tone === "inverse";
  return (
    <div className={isCentered ? "text-center" : "text-left"}>
      <p
        className={cn(
          "text-xs uppercase tracking-[0.3em]",
          isInverse ? "text-white/60" : "text-zinc-600 dark:text-muted-foreground"
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 text-3xl sm:text-4xl font-serif",
          isInverse ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </h2>
    </div>
  );
}
