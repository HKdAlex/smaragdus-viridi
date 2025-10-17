"use client";

import { Gem, Palette, Scissors } from "lucide-react";

interface GemstoneIconProps {
  className?: string;
  size?: number;
}

export function GemstoneTypeIcon({
  className = "w-4 h-4",
  size,
}: GemstoneIconProps) {
  return <Gem className={className} size={size} />;
}

export function GemstoneColorIcon({
  className = "w-4 h-4",
  size,
}: GemstoneIconProps) {
  return <Palette className={className} size={size} />;
}

export function GemstoneCutIcon({
  className = "w-4 h-4",
  size,
}: GemstoneIconProps) {
  return <Scissors className={className} size={size} />;
}

// Color-specific icons for different gemstone colors
export function ColorIndicator({
  color,
  className = "w-3 h-3",
}: {
  color: string;
  className?: string;
}) {
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      // Diamond colors
      D: "bg-white border-gray-300",
      E: "bg-gray-50 border-gray-200",
      F: "bg-gray-100 border-gray-300",
      G: "bg-gray-200 border-gray-400",
      H: "bg-gray-300 border-gray-500",
      I: "bg-gray-400 border-gray-600",
      J: "bg-gray-500 border-gray-700",
      K: "bg-gray-600 border-gray-800",
      L: "bg-gray-700 border-gray-900",
      M: "bg-gray-800 border-black",

      // Fancy colors
      "fancy-yellow": "bg-yellow-400 border-yellow-600",
      "fancy-blue": "bg-blue-400 border-blue-600",
      "fancy-pink": "bg-pink-400 border-pink-600",
      "fancy-green": "bg-green-400 border-green-600",

      // Basic colors
      red: "bg-red-500 border-red-700",
      blue: "bg-blue-500 border-blue-700",
      green: "bg-green-500 border-green-700",
      yellow: "bg-yellow-500 border-yellow-700",
      pink: "bg-pink-500 border-pink-700",
      white: "bg-white border-gray-300",
      black: "bg-black border-gray-800",
      colorless: "bg-gray-100 border-gray-300",
    };

    return colorMap[color] || "bg-gray-400 border-gray-600";
  };

  return (
    <div
      className={`rounded-full border-2 ${getColorClass(color)} ${className}`}
      title={color}
    />
  );
}

// Cut-specific icons with improved SVG shapes
export function CutIcon({
  cut,
  className = "w-5 h-5",
}: {
  cut: string;
  className?: string;
}) {
  const getCutSVG = (cut: string) => {
    switch (cut.toLowerCase()) {
      case "round":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="7" fill="currentColor" fillOpacity="0.2" />
            <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );
      case "oval":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <ellipse cx="12" cy="12" rx="10" ry="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <ellipse cx="12" cy="12" rx="7" ry="4" fill="currentColor" fillOpacity="0.2" />
            <ellipse cx="12" cy="12" rx="4" ry="2.5" fill="currentColor" fillOpacity="0.4" />
            <ellipse cx="12" cy="12" rx="1.5" ry="1" fill="currentColor" />
          </svg>
        );
      case "marquise":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2 L20 12 L12 22 L4 12 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 5 L17 12 L12 19 L7 12 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 8 L14 12 L12 16 L10 12 Z" fill="currentColor" fillOpacity="0.4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );
      case "pear":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2 C8 2, 4 6, 4 10 C4 14, 8 18, 12 20 C16 18, 20 14, 20 10 C20 6, 16 2, 12 2 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 4 C9 4, 6 7, 6 10 C6 13, 9 16, 12 18 C15 16, 18 13, 18 10 C18 7, 15 4, 12 4 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 6 C10 6, 8 8, 8 10 C8 12, 10 14, 12 16 C14 14, 16 12, 16 10 C16 8, 14 6, 12 6 Z" fill="currentColor" fillOpacity="0.4" />
            <circle cx="12" cy="10" r="1.5" fill="currentColor" />
          </svg>
        );
      case "emerald":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="7" y="7" width="10" height="10" fill="currentColor" fillOpacity="0.1" />
            <rect x="8" y="8" width="8" height="8" fill="currentColor" fillOpacity="0.2" />
            <rect x="9" y="9" width="6" height="6" fill="currentColor" fillOpacity="0.3" />
            <rect x="10" y="10" width="4" height="4" fill="currentColor" fillOpacity="0.5" />
            <rect x="11" y="11" width="2" height="2" fill="currentColor" />
          </svg>
        );
      case "princess":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2 L22 12 L12 22 L2 12 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 5 L19 12 L12 19 L5 12 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 8 L16 12 L12 16 L8 12 Z" fill="currentColor" fillOpacity="0.4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );
      case "cushion":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M6 6 C6 6, 6 18, 6 18 C6 18, 18 18, 18 18 C18 18, 18 6, 18 6 C18 6, 6 6, 6 6 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 8 C8 8, 8 16, 8 16 C8 16, 16 16, 16 16 C16 16, 16 8, 16 8 C16 8, 8 8, 8 8 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M10 10 C10 10, 10 14, 10 14 C10 14, 14 14, 14 14 C14 14, 14 10, 14 10 C14 10, 10 10, 10 10 Z" fill="currentColor" fillOpacity="0.4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );
      case "radiant":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2 L20 8 L20 16 L12 22 L4 16 L4 8 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 5 L17 8 L17 16 L12 19 L7 16 L7 8 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 8 L14 10 L14 14 L12 16 L10 14 L10 10 Z" fill="currentColor" fillOpacity="0.4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );
      case "asscher":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="7" y="7" width="10" height="10" fill="currentColor" fillOpacity="0.1" />
            <rect x="8" y="8" width="8" height="8" fill="currentColor" fillOpacity="0.2" />
            <rect x="9" y="9" width="6" height="6" fill="currentColor" fillOpacity="0.3" />
            <rect x="10" y="10" width="4" height="4" fill="currentColor" fillOpacity="0.5" />
            <rect x="11" y="11" width="2" height="2" fill="currentColor" />
          </svg>
        );
      case "heart":
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor" fillOpacity="0.4" />
            <circle cx="12" cy="10" r="1.5" fill="currentColor" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2 L22 12 L12 22 L2 12 Z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 5 L19 12 L12 19 L5 12 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 8 L16 12 L12 16 L8 12 Z" fill="currentColor" fillOpacity="0.4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        );
    }
  };

  return <span title={cut}>{getCutSVG(cut)}</span>;
}

// Weight icon component
export function WeightIcon({
  className = "w-5 h-5",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
