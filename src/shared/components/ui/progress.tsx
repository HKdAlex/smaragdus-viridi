"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "default" | "secondary" | "destructive";
  size?: "sm" | "default" | "lg";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = "default",
      size = "default",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-1.5",
      default: "h-2",
      lg: "h-3 sm:h-4",
    };

    const variantClasses = {
      default: "bg-primary",
      secondary: "bg-secondary-foreground",
      destructive: "bg-destructive",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          sizeClasses[size],
          className
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-in-out",
            variantClasses[variant]
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
