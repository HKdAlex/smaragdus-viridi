import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "inline" | "block";
  size?: "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { width: 32, height: 32, textSize: "text-sm", heightClass: "h-8" },
  md: { width: 40, height: 32, textSize: "text-lg", heightClass: "h-8" },
  lg: { width: 80, height: 64, textSize: "text-xl", heightClass: "h-16" },
  xl: { width: 120, height: 120, textSize: "text-2xl", heightClass: "h-24" },
  xxl: { width: 160, height: 160, textSize: "text-3xl", heightClass: "h-32" },
  xxxl: { width: 200, height: 200, textSize: "text-4xl", heightClass: "h-40" },
};

export function Logo({
  variant = "inline",
  size = "md",
  showText = true,
  href,
  className = "",
}: LogoProps) {
  const { width, height, textSize, heightClass } = sizeMap[size];
  const logoSrc =
    variant === "inline" ? "/sv-logo-inline.png" : "/sv-logo-block.png";

  const logoElement = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Image
        src={logoSrc}
        alt="Smaragdus Viridi"
        width={width}
        height={height}
        className={`${heightClass} w-auto logo-crisp`}
        priority
        quality={100}
        unoptimized={size === "sm" || size === "md"}
        style={{
          objectFit: "contain",
          objectPosition: "center",
        }}
      />
      {showText && (
        <span
          className={`font-bold ${textSize} text-foreground transition-colors duration-300 hidden sm:block`}
        >
          Smaragdus Viridi
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{logoElement}</Link>;
  }

  return logoElement;
}
