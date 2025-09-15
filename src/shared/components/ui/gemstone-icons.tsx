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

// Cut-specific icons
export function CutIcon({
  cut,
  className = "w-4 h-4",
}: {
  cut: string;
  className?: string;
}) {
  const getCutIcon = (cut: string) => {
    switch (cut.toLowerCase()) {
      case "round":
        return "⭕";
      case "oval":
        return "🏈";
      case "marquise":
        return "🏈";
      case "pear":
        return "🍐";
      case "emerald":
        return "📐";
      case "princess":
        return "💎";
      case "cushion":
        return "🟦";
      case "radiant":
        return "💠";
      case "asscher":
        return "🔷";
      case "heart":
        return "❤️";
      default:
        return "💎";
    }
  };

  return (
    <span className={className} title={cut}>
      {getCutIcon(cut)}
    </span>
  );
}

