import { duration, ease, radius, shadowSoft } from "@/lib/ux/tokens";

import { Button } from "@/shared/components/ui/button";
import { Container } from "@/components/ui/Container";
import Image from "next/image";
import Link from "next/link";

export type HeroProps = {
  title: string;
  subtitle: string;
  primaryHref: string;
  secondaryHref: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  imageSrc: string;
  imageAlt: string;
  trustItems: string[];
};

export function Hero({
  title,
  subtitle,
  primaryHref,
  secondaryHref,
  primaryLabel,
  secondaryLabel,
  imageSrc,
  imageAlt,
  trustItems,
}: HeroProps) {
  return (
    <section className="bg-background">
      <Container className="grid items-center gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 py-12 sm:py-16 md:py-20 lg:py-24">
        {/* Copy */}
        <div className="text-center lg:text-left flex flex-col h-full">
          <h1 className="font-serif tracking-tight text-4xl sm:text-3xl md:text-5xl lg:text-6xl leading-tight text-foreground px-2">
            {title}
          </h1>
          <p className="mt-3 sm:mt-4 md:mt-6 text-lg sm:text-base md:text-base lg:text-base text-muted-foreground max-w-prose leading-relaxed text-center px-4 sm:px-6 md:px-8">
            {subtitle}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
            <Button asChild size="lg" className={`${duration} ${ease}`}>
              <Link
                href={primaryHref}
                aria-label={primaryLabel || "Browse catalog"}
              >
                {primaryLabel || "Browse Catalog"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={`${duration} ${ease}`}
            >
              <Link
                href={secondaryHref}
                aria-label={secondaryLabel || "Contact sales"}
              >
                {secondaryLabel || "Contact Sales"}
              </Link>
            </Button>
          </div>

          {/* Trust strip */}
          {trustItems?.length ? (
            <div className="mt-8 sm:mt-10 md:mt-12 flex flex-grow items-center justify-center">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 sm:gap-x-6 sm:gap-y-2 text-sm sm:text-base text-foreground">
                {trustItems.map((label, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-lg"
                  >
                    <span className="leading-relaxed font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Visual */}
        <div className="relative mx-auto max-w-sm sm:max-w-md md:max-w-none w-full order-first lg:order-last">
          <div
            className={`relative ${radius} ${shadowSoft} overflow-hidden bg-black dark:bg-black`}
            aria-hidden="true"
          >
            {/* Subtle overlay for light mode to soften black */}
            <div
              className="absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-100/5 via-transparent to-transparent dark:from-transparent"
              aria-hidden
            />
            {/* Gold accent glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(60% 60% at 70% 30%, rgba(182,140,58,0.12) 0%, transparent 60%)",
              }}
            />
            <div className="relative aspect-[4/3] sm:aspect-[4/3] md:aspect-[5/3]">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
