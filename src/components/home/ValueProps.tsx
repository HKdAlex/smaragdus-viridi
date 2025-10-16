import { duration, ease, radius, shadowSoft } from "@/lib/ux/tokens";

import { Card } from "@/shared/components/ui/card";
import { Container } from "@/components/ui/Container";
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
        <img
          src="/images/hero/hero-1.webp"
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {items.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className={`p-6 md:p-7 ${radius} ${shadowSoft} transition-transform ${duration} ${ease} hover:-translate-y-0.5`}
            >
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-serif text-xl text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
