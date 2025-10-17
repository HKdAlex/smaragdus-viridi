import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Container<T extends ElementType = "div">(
  props: PolymorphicProps<T>
) {
  const { as, className, children, ...rest } =
    props as PolymorphicProps<ElementType>;
  const Tag = (as || "div") as ElementType;
  return (
    <Tag
      className={cn(
        "container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl",
        className
      )}
      {...(rest as object)}
    >
      {children}
    </Tag>
  );
}
