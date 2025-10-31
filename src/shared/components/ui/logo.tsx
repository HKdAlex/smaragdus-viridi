"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useThemeContext } from "@/shared/context/theme-context";
import { useTranslations } from "next-intl";

interface LogoProps {
  variant?: "inline" | "block";
  size?: "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl" | "xxxxl";
  showText?: boolean;
  href?: string;
  className?: string;
  enhancedContrast?: boolean; // New prop to enable enhanced contrast
}

const sizeMap = {
  sm: { width: 32, height: 32, textSize: "text-sm", heightClass: "h-8" },
  md: { width: 48, height: 48, textSize: "text-lg", heightClass: "h-10" },
  lg: { width: 80, height: 64, textSize: "text-xl", heightClass: "h-16" },
  xl: { width: 120, height: 120, textSize: "text-2xl", heightClass: "h-24" },
  xxl: { width: 160, height: 160, textSize: "text-3xl", heightClass: "h-32" },
  xxxl: { width: 200, height: 200, textSize: "text-4xl", heightClass: "h-40" },
  xxxxl: { width: 280, height: 172, textSize: "text-5xl", heightClass: "h-43" },
};

export function Logo({
  variant = "inline",
  size = "md",
  showText = true,
  href,
  className = "",
  enhancedContrast = true, // Default to enhanced contrast
}: LogoProps) {
  const { resolvedTheme } = useThemeContext();
  const t = useTranslations("common");
  const { width, height, textSize, heightClass } = sizeMap[size];

  // Choose logo source based on variant and size for optimization
  const getLogoSrc = () => {
    const baseName =
      variant === "inline"
        ? "crystallique-logo-inline"
        : "crystallique-logo-block-2";

    // Use smaller files for smaller sizes to optimize loading
    if (size === "sm" || size === "md") {
      return `/${baseName}.png`;
    }

    // Use optimized 512px version for larger sizes
    return `/${baseName}.png`;
  };

  const logoSrc = getLogoSrc();

  // Enhanced contrast styles for light mode
  const getLogoStyles = () => {
    const baseStyles = {
      objectFit: "contain" as const,
      objectPosition: "center" as const,
    };

    // Apply filters only in light mode and when enhanced contrast is enabled
    if (enhancedContrast && resolvedTheme === "light") {
      return {
        ...baseStyles,
        filter: "contrast(1.5) brightness(0.1) saturate(1.5)",
      };
    }

    return baseStyles;
  };

  const logoElement = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Image
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
