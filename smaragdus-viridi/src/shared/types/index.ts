// Core domain types
export type GemstoneType =
  | "diamond"
  | "emerald"
  | "ruby"
  | "sapphire"
  | "amethyst"
  | "topaz"
  | "garnet"
  | "peridot"
  | "citrine"
  | "tanzanite";

export type GemColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "pink"
  | "white"
  | "black"
  | "colorless"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "fancy-yellow"
  | "fancy-blue"
  | "fancy-pink"
  | "fancy-green";

export type GemCut =
  | "round"
  | "oval"
  | "marquise"
  | "pear"
  | "emerald"
  | "princess"
  | "cushion"
  | "radiant"
  | "fantasy";

export type GemClarity =
  | "FL"
  | "IF"
  | "VVS1"
  | "VVS2"
  | "VS1"
  | "VS2"
  | "SI1"
  | "SI2"
  | "I1";

export type UserRole =
  | "admin"
  | "regular_customer"
  | "premium_customer"
  | "guest";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "RUB" | "CHF" | "JPY";

export interface Money {
  readonly amount: number; // Store in smallest currency unit (cents)
  readonly currency: CurrencyCode;
}

export interface GemDimensions {
  readonly length_mm: number;
  readonly width_mm: number;
  readonly depth_mm: number;
}

export interface Certification {
  readonly id: string;
  readonly type: "GIA" | "Gübelin" | "SSEF" | "AGS" | "other";
  readonly certificate_number?: string;
  readonly certificate_url?: string;
  readonly issued_date?: string;
}

export interface Gemstone {
  readonly id: string;
  readonly name: GemstoneType;
  readonly color: GemColor;
  readonly cut: GemCut;
  readonly weight_carats: number;
  readonly dimensions: GemDimensions;
  readonly origin: string;
  readonly clarity: GemClarity;
  readonly price: Money;
  readonly premium_price?: Money; // For premium customers
  readonly price_per_carat: Money;
  readonly in_stock: boolean;
  readonly delivery_days: number;
  readonly internal_code: string; // For admin identification
  readonly serial_number: string;
  readonly certifications: Certification[];
  readonly created_at: string;
  readonly updated_at: string;
}
