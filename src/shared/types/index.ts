// Type Management for Crystallique
// SINGLE SOURCE OF TRUTH: Import from Supabase generated types

import type { Database } from "./database";

// ===== CORE DATABASE TYPES (Imported from Supabase) =====
/* eslint-disable no-restricted-syntax */
export type GemstoneType = Database["public"]["Enums"]["gemstone_type"];
export type GemColor = Database["public"]["Enums"]["gem_color"];
// CUT-C3.1: GemCut enum removed - use Cut type from cuts table instead
export type GemClarity = Database["public"]["Enums"]["gem_clarity"];
export type CurrencyCode = Database["public"]["Enums"]["currency_code"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentType = Database["public"]["Enums"]["payment_type"];
/* eslint-enable no-restricted-syntax */

// ===== DATABASE ROW TYPES (Direct from Supabase) =====
export type DatabaseGemstone = Database["public"]["Tables"]["gemstones"]["Row"];
export type DatabaseOrigin = Database["public"]["Tables"]["origins"]["Row"];
export type DatabaseGemstoneImage =
  Database["public"]["Tables"]["gemstone_images"]["Row"];
export type DatabaseGemstoneVideo =
  Database["public"]["Tables"]["gemstone_videos"]["Row"];
export type DatabaseGemstoneIndividualStone =
  Database["public"]["Tables"]["gemstone_individual_stones"]["Row"];
export type DatabaseCertification =
  Database["public"]["Tables"]["certifications"]["Row"];
export type DatabaseUserProfile =
  Database["public"]["Tables"]["user_profiles"]["Row"];
export type DatabaseOrder = Database["public"]["Tables"]["orders"]["Row"];
export type DatabaseOrderItem =
  Database["public"]["Tables"]["order_items"]["Row"];
export type DatabaseCartItem =
  Database["public"]["Tables"]["cart_items"]["Row"];
export type DatabaseFavorite = Database["public"]["Tables"]["favorites"]["Row"];
export type DatabaseChatMessage =
  Database["public"]["Tables"]["chat_messages"]["Row"];
// ai_analysis_results table has been removed
export type DatabaseImageClassification =
  Database["public"]["Tables"]["image_classifications"]["Row"];
export type DatabaseImportBatch =
  Database["public"]["Tables"]["import_batches"]["Row"];
export type DatabaseCut = Database["public"]["Tables"]["cuts"]["Row"];

// ===== CUT TYPES (CUT-C1.1) =====
// Cut type for application use
export interface Cut {
  readonly id: string;
  readonly code: string;
  readonly name_en: string;
  readonly name_ru: string;
  readonly description_en: string | null;
  readonly description_ru: string | null;
  readonly display_order: number;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

// Helper type for cut codes
export type CutCode = string;

// ===== APPLICATION LAYER EXTENSIONS =====
// These extend database types with computed properties and business logic

export interface Money {
  readonly amount: number; // Store in smallest currency unit (cents)
  readonly currency: CurrencyCode;
}

export interface GemDimensions {
  readonly length_mm: number;
  readonly width_mm: number;
  readonly depth_mm: number;
}

// Individual stone specifications
export interface IndividualStone {
  readonly id: string;
  readonly stone_number: number;
  readonly gemstone_id: string;
  readonly dimensions: GemDimensions;
  readonly created_at: string | null;
  readonly updated_at: string | null;
}

// Enhanced gemstone type with relationships and computed properties
export interface Gemstone extends DatabaseGemstone {
  // CUT-C3.1: cut field is now derived from cuts table via cut_id
  // Views provide this field, but the base table doesn't have it
  readonly cut?: string;
  // DISPLAY FIELDS (Contract: DISPLAY-C5.0)
  // Resolved values with precedence: Admin Custom > AI > Enum
  readonly display_name?: string;
  readonly display_color?: string;
  readonly display_cut?: string;
  readonly display_clarity?: string;
  readonly origin?: DatabaseOrigin;
  readonly images?: DatabaseGemstoneImage[];
  readonly videos?: DatabaseGemstoneVideo[];
  readonly certifications?: DatabaseCertification[];
  readonly individual_stones?: IndividualStone[];
  readonly dimensions: GemDimensions;
  readonly price: Money;
  readonly premium_price?: Money;
}

// Enhanced user profile with computed properties
export interface UserProfile extends DatabaseUserProfile {
  readonly is_admin: boolean;
  readonly is_premium: boolean;
  readonly effective_discount: number;
}

// Enhanced order with items and computed totals
export interface Order extends DatabaseOrder {
  readonly items?: OrderItem[];
  readonly total_items: number;
  readonly formatted_total: string;
  readonly user?: {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly email: string;
  };
}

export interface OrderItem extends DatabaseOrderItem {
  readonly gemstone?: Gemstone;
  readonly formatted_unit_price: string;
  readonly formatted_line_total: string;
}

// ===== GEMSTONE DETAIL TYPES =====

// Enhanced gemstone interface for detail page
// Import generated database types

// Use generated types for consistency (defined above)

export interface DetailGemstone {
  id: string;
  name: GemstoneType;
  weight_carats: number;
  color: GemColor;
  ai_color: string | null; // AI-detected color (overrides manual color if present)
  // CUT-C3.1: cut is now derived from cuts table via cut_id
  cut: string; // Cut code (from cuts.code via cut_id)
  cut_id: string; // FK to cuts table (required)
  cut_code: string; // Cut code for filtering/display (same as cut)
  clarity: GemClarity;
  // DISPLAY FIELDS (Contract: DISPLAY-C5.0)
  // Resolved values with precedence: Admin Custom > AI > Enum
  // Use these fields for display instead of raw enum values
  display_name: string; // Resolved name (custom > enum)
  display_color: string; // Resolved color (custom > AI > enum)
  display_cut: string; // Resolved cut (custom > AI > cut code)
  display_clarity: string; // Resolved clarity (custom > enum)
  price_amount: number;
  price_currency: CurrencyCode;
  price_per_carat?: number | null;
  premium_price_amount: number | null;
  premium_price_currency: CurrencyCode | null;
  length_mm: number;
  width_mm: number;
  depth_mm: number;
  serial_number: string;
  internal_code: string | null;
  in_stock: boolean | null;
  quantity: number | null;
  delivery_days: number | null;
  origin_id: string | null;
  ai_text_generated_v6: boolean;
  ai_confidence_score: number | null;
  ai_analysis_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  import_batch_id: string | null;
  import_folder_path: string | null;
  import_notes: string | null;
  description: string | null;
  promotional_text: string | null;
  marketing_highlights: string[] | null;
  images: DatabaseGemstoneImage[];
  videos: DatabaseGemstoneVideo[];
  origin: DatabaseOrigin | null;
  certifications: DatabaseCertification[];
  individual_stones?: IndividualStone[];
  // Flexible property fields (FLEX-C1.x, FLEX-C3.x)
  name_custom?: string | null;
  name_custom_en?: string | null;
  name_custom_ru?: string | null;
  type_code?: string | null;
  color_custom?: string | null;
  cut_custom?: string | null;
  clarity_custom?: string | null;
  treatment_status?: string | null;
  color_change_description?: string | null;
  mining_country?: string | null;
  cutting_country?: string | null;
  quality_classification?: string | null;
  enhancement_notes?: string | null;
  // ai_analysis_results table has been removed
}

// ===== CART SYSTEM TYPES =====

// Enhanced cart item with gemstone relationship
export interface CartItem {
  readonly id: string;
  readonly user_id: string;
  readonly gemstone_id: string;
  readonly quantity: number;
  readonly added_at: string | null;
  readonly updated_at: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly gemstone?: Gemstone;
  readonly unit_price: Money;
  readonly line_total: Money;
  readonly formatted_unit_price: string;
  readonly formatted_line_total: string;
}

// Cart summary for display
export interface CartSummary {
  readonly items: CartItem[];
  readonly total_items: number;
  readonly subtotal: Money;
  readonly formatted_subtotal: string;
  readonly last_updated: string;
}

// Cart item with selection state
export interface CartItemWithSelection extends CartItem {
  readonly isSelected: boolean;
  readonly onSelectionChange: (selected: boolean) => void;
}

// Cart summary with selection functionality
export interface CartSummaryWithSelection extends CartSummary {
  readonly selectedItems: CartItem[];
  readonly selectedItemsCount: number;
  readonly selectedTotal: Money;
  readonly formatted_selected_total: string;
  readonly allSelected: boolean;
  readonly onSelectAll: () => void;
  readonly onOrderSelected: () => Promise<boolean>;
}

// Cart operation results
export interface CartOperationResult {
  readonly success: boolean;
  readonly item?: CartItem;
  readonly error?: string;
  readonly cart_summary?: CartSummary;
}

// User preferences types
export interface UserPreferences {
  readonly theme: "light" | "dark" | "system";
  readonly preferred_currency: CurrencyCode;
  readonly email_notifications: boolean;
  readonly cart_updates: boolean;
  readonly order_updates: boolean;
  readonly marketing_emails: boolean;
  readonly profile_visibility: "public" | "private";
  readonly data_sharing: boolean;
}

// Cart validation rules
export interface CartValidationRules {
  readonly max_items: number;
  readonly max_quantity_per_item: number;
  readonly cart_expiration_days: number;
  readonly max_total_value: number;
  readonly min_item_price: number;
  readonly max_item_price: number;
}

// Cart validation result
export interface CartValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

// ===== BUSINESS LOGIC TYPES =====
export interface PriceCalculation {
  readonly original: number;
  readonly discounted?: number;
  readonly final: number;
  readonly currency: CurrencyCode;
  readonly savings: number;
  readonly vip_discount_applied: boolean;
}

export interface AvailabilityStatus {
  readonly available: boolean;
  readonly reason?: string;
  readonly estimated_restock?: string;
  readonly estimated_available?: string;
}

export interface QualityAssessment {
  readonly overall_grade: "excellent" | "very-good" | "good" | "fair" | "poor";
  readonly individual_scores: {
    cut: number;
    color: number;
    clarity: number;
    carat: number;
  };
  readonly recommendations: string[];
  readonly investment_potential: "high" | "medium" | "low";
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ===== UTILITY TYPES =====
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Type guards for runtime type checking
export const isValidGemstone = (obj: unknown): obj is Gemstone => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj &&
    "weight_carats" in obj &&
    typeof (obj as Record<string, unknown>).weight_carats === "number"
  );
};

export const isAdmin = (role: UserRole): role is "admin" => {
  return role === "admin";
};

export const isPremiumCustomer = (
  role: UserRole
): role is "premium_customer" => {
  return role === "premium_customer";
};
