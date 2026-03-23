"use client";

import { Link } from "@/i18n/navigation";
import { useThemeContext } from "@/shared/context/theme-context";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface LogoProps {
  variant?: "inline" | "block";
  size?: "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl" | "xxxxl";
  showText?: boolean;
  href?: string;
  className?: string;
  enhancedContrast?: boolean; // New prop to enable enhanced contrast
}

/** Intrinsic pixel ratios of the files returned by `getLogoSrc` (width / height). */
const LOGO_ASPECT = {
  /** `crystallique-logo-block-white-bg-ai-v2.webp` (1041×581, light theme) */
  blockLight: 1041 / 581,
  /** `crystallique-logo-block-2.webp` (dark theme) */
  blockDark: 1536 / 1024,
  /** `crystallique-logo-inline-4_white.webp` (942×364, same width as inline-3) */
  inlineLight: 942 / 364,
  /** `crystallique-logo-inline-3.webp` */
  inlineDark: 942 / 371,
} as const;

const sizeMap = {
  sm: { targetHeight: 32, textSize: "text-sm" },
  md: { targetHeight: 48, textSize: "text-lg" },
  lg: { targetHeight: 64, textSize: "text-xl" },
  xl: { targetHeight: 120, textSize: "text-2xl" },
  xxl: { targetHeight: 160, textSize: "text-3xl" },
  xxxl: { targetHeight: 200, textSize: "text-4xl" },
  xxxxl: { targetHeight: 172, textSize: "text-5xl" },
} as const;

function getLogoAspectRatio(
  variant: "inline" | "block",
  resolvedTheme: "light" | "dark",
): number {
  if (variant === "block") {
    return resolvedTheme === "light"
      ? LOGO_ASPECT.blockLight
      : LOGO_ASPECT.blockDark;
  }
  return resolvedTheme === "light"
    ? LOGO_ASPECT.inlineLight
    : LOGO_ASPECT.inlineDark;
}

function getLogoDimensions(
  variant: "inline" | "block",
  size: keyof typeof sizeMap,
  resolvedTheme: "light" | "dark",
): { width: number; height: number } {
  const { targetHeight } = sizeMap[size];

  const aspect = getLogoAspectRatio(variant, resolvedTheme);
  return {
    width: Math.max(1, Math.round(targetHeight * aspect)),
    height: targetHeight,
  };
}

export function Logo({
  variant = "inline",
  size = "md",
  showText = true,
  href,
  className = "",
  /** When true, applies a mild filter in light mode for gold-on-transparent marks. Never use aggressive brightness — it turns the mark into a solid black box. */
  enhancedContrast = false,
}: LogoProps) {
  const { resolvedTheme } = useThemeContext();
  const t = useTranslations("common");
  const { textSize } = sizeMap[size];
  const { width, height } = getLogoDimensions(variant, size, resolvedTheme);

  // Block: light = white-plate AI v2 WebP; dark = block-2 WebP. Inline: light = inline-4 white; dark = inline-3.
  const getLogoSrc = () => {
    if (variant === "block") {
      return resolvedTheme === "light"
        ? "/crystallique-logo-block-white-bg-ai-v2.webp"
        : "/crystallique-logo-block-2.webp";
    }
    if (resolvedTheme === "light") {
      return "/crystallique-logo-inline-4_white.webp";
    }
    return "/crystallique-logo-inline-3.webp";
  };

  const logoSrc = getLogoSrc();

  const getLogoStyles = () => {
    const baseStyles = {
      objectFit: "contain" as const,
      objectPosition: "center" as const,
    };

    if (enhancedContrast && resolvedTheme === "light") {
      return {
        ...baseStyles,
        filter: "contrast(1.15) brightness(0.92) saturate(1.2)",
      };
    }

    return baseStyles;
  };

  const logoElement = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Image
        key={logoSrc}
        src={logoSrc}
        alt={t("brandName")}
        width={width}
        height={height}
        className={`logo-crisp transition-all duration-300 ${
          enhancedContrast && resolvedTheme === "light"
            ? "logo-enhanced-contrast"
            : ""
        }`}
        priority
        quality={100}
        unoptimized={size === "sm" || size === "md"}
        style={{
          ...getLogoStyles(),
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
      {showText && (
        <span
          className={`font-bold ${textSize} text-foreground transition-colors duration-300 hidden sm:block px-2 sm:px-3 text-center`}
        >
          Crystallique
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href as any}>{logoElement}</Link>;
  }

  return logoElement;
}
