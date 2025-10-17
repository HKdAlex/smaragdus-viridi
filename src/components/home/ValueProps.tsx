import { duration, ease, radius, shadowSoft } from "@/lib/ux/tokens";

import { Card } from "@/shared/components/ui/card";
import { Container } from "@/components/ui/Container";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";

export type ValueItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function ValueProps({ items }: { items: ValueItem[] }) {
  return (
    <section className="bg-background relative overflow-hidden">
      {/* Decorative background image (non-critical) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05] hidden md:block"
        aria-hidden
      >
        <Image
          src="/images/hero/hero-1.webp"
          alt=""
          fill
          className="object-cover"
          loading="lazy"
          sizes="100vw"
        />
      </div>
      <Container className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {items.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className={`p-4 sm:p-5 md:p-6 lg:p-7 ${radius} bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-lg transition-transform ${duration} ${ease} hover:-translate-y-0.5`}
            >
              <Icon
                className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                aria-hidden
              />
              <h3 className="mt-3 sm:mt-4 font-serif text-lg sm:text-xl text-white leading-tight">
                {title}
              </h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
