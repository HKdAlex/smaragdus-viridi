import { duration, ease, gold, radius, shadowSoft } from "@/lib/ux/tokens";

import { Button } from "@/shared/components/ui/button";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import Image from "next/image";

export type ProCTAProps = {
  title: string;
  subtitle: string;
  primaryHref: string;
  secondaryHref: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  backgroundImageSrc?: string;
};

export function ProCTA({
  title,
  subtitle,
  primaryHref,
  secondaryHref,
  primaryLabel,
  secondaryLabel,
  backgroundImageSrc,
}: ProCTAProps) {
  return (
    <section className="bg-gradient-to-b from-slate-100 via-white to-slate-50 dark:from-black dark:via-slate-950 dark:to-black">
      <Container className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div
          className={`relative ${radius} ${shadowSoft} overflow-hidden bg-white/80 dark:bg-slate-900/40 p-6 sm:p-8 md:p-10 lg:p-12`}
        >
          {backgroundImageSrc ? (
            <div
              className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15] pointer-events-none"
              aria-hidden
            >
              <Image
                src={backgroundImageSrc}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          ) : null}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `conic-gradient(from 90deg at 75% 20%, rgba(182,140,58,0.08), transparent 35%)`,
            }}
          />
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl leading-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-slate-600 dark:text-emerald-200 max-w-prose leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button asChild size="lg" className={`${duration} ${ease}`}>
              <Link
                href={primaryHref}
                aria-label={primaryLabel || "Request sourcing"}
              >
                {primaryLabel || "Request Sourcing"}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={`${duration} ${ease}`}
            >
              <Link
                href={secondaryHref}
                aria-label={secondaryLabel || "Open catalog"}
              >
                {secondaryLabel || "Browse Catalog"}
              </Link>
            </Button>
          </div>

          <div
            className="mt-6 h-px w-full"
            style={{ backgroundColor: gold, opacity: 0.25 }}
          />
        </div>
      </Container>
    </section>
  );
}
