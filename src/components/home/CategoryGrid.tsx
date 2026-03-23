import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { duration, ease, radius } from "@/lib/ux/tokens";

import { Card } from "@/shared/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export type CategoryItem = {
  title: string;
  subtitle?: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
};

export function CategoryGrid({ items }: { items: CategoryItem[] }) {
  return (
    <section className="bg-background relative overflow-hidden">
      {/* Decorative background image (non-critical) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.08] hidden md:block"
        aria-hidden
      >
        <Image
          src="/images/hero/hero-3.webp"
          alt=""
          fill
          className="object-cover"
          loading="lazy"
          sizes="100vw"
        />
      </div>
      <Container className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group focus:outline-none"
            >
              <Card
                className={cn(
                  "relative overflow-hidden border border-zinc-200 bg-white shadow-md transition-transform will-change-transform group-hover:-translate-y-1 hover:shadow-lg",
                  radius,
                  duration,
                  ease,
                  "dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md"
                )}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={false}
                  />
                </div>

                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl md:text-2xl text-foreground leading-tight">
                        {item.title}
                      </h3>
                      {item.subtitle ? (
                        <p className="mt-1 text-sm text-zinc-600 leading-relaxed sm:text-base dark:text-muted-foreground">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                    {/* <ChevronRight
                      className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    /> */}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
