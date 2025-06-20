// Type Management for Smaragdus Viridi
// SINGLE SOURCE OF TRUTH: Import from Supabase generated types

import type { Database } from './database'

// ===== CORE DATABASE TYPES (Imported from Supabase) =====
export type GemstoneType = Database['public']['Enums']['gemstone_type']
export type GemColor = Database['public']['Enums']['gem_color'] 
export type GemCut = Database['public']['Enums']['gem_cut']
export type GemClarity = Database['public']['Enums']['gem_clarity']
export type CurrencyCode = Database['public']['Enums']['currency_code']
export type UserRole = Database['public']['Enums']['user_role']
export type OrderStatus = Database['public']['Enums']['order_status']
export type PaymentType = Database['public']['Enums']['payment_type']

// ===== DATABASE ROW TYPES (Direct from Supabase) =====
export type DatabaseGemstone = Database['public']['Tables']['gemstones']['Row']
export type DatabaseOrigin = Database['public']['Tables']['origins']['Row']
export type DatabaseGemstoneImage = Database['public']['Tables']['gemstone_images']['Row']
export type DatabaseGemstoneVideo = Database['public']['Tables']['gemstone_videos']['Row']
export type DatabaseCertification = Database['public']['Tables']['certifications']['Row']
export type DatabaseUserProfile = Database['public']['Tables']['user_profiles']['Row']
export type DatabaseOrder = Database['public']['Tables']['orders']['Row']
export type DatabaseOrderItem = Database['public']['Tables']['order_items']['Row']
export type DatabaseCartItem = Database['public']['Tables']['cart_items']['Row']
export type DatabaseFavorite = Database['public']['Tables']['favorites']['Row']
export type DatabaseChatMessage = Database['public']['Tables']['chat_messages']['Row']

// ===== APPLICATION LAYER EXTENSIONS =====
// These extend database types with computed properties and business logic

export interface Money {
  readonly amount: number // Store in smallest currency unit (cents)
  readonly currency: CurrencyCode
}

export interface GemDimensions {
  readonly length_mm: number
  readonly width_mm: number
  readonly depth_mm: number
}

// Enhanced gemstone type with relationships and computed properties
export interface Gemstone extends DatabaseGemstone {
  readonly origin?: DatabaseOrigin
  readonly images?: DatabaseGemstoneImage[]
  readonly videos?: DatabaseGemstoneVideo[]
  readonly certifications?: DatabaseCertification[]
  readonly dimensions: GemDimensions
  readonly price: Money
  readonly premium_price?: Money
}

// Enhanced user profile with computed properties
export interface UserProfile extends DatabaseUserProfile {
  readonly is_admin: boolean
  readonly is_premium: boolean
  readonly effective_discount: number
}

// Enhanced order with items and computed totals
export interface Order extends DatabaseOrder {
  readonly items?: OrderItem[]
  readonly total_items: number
  readonly formatted_total: string
}

export interface OrderItem extends DatabaseOrderItem {
  readonly gemstone?: Gemstone
  readonly formatted_unit_price: string
  readonly formatted_line_total: string
}

// ===== BUSINESS LOGIC TYPES =====
export interface PriceCalculation {
  readonly original: number
  readonly discounted?: number
  readonly final: number
  readonly currency: CurrencyCode
  readonly savings: number
  readonly vip_discount_applied: boolean
}

export interface AvailabilityStatus {
  readonly available: boolean
  readonly reason?: string
  readonly estimated_restock?: string
  readonly estimated_available?: string
}

export interface QualityAssessment {
  readonly overall_grade: 'excellent' | 'very-good' | 'good' | 'fair' | 'poor'
  readonly individual_scores: {
    cut: number
    color: number
    clarity: number
    carat: number
  }
  readonly recommendations: string[]
  readonly investment_potential: 'high' | 'medium' | 'low'
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// ===== UTILITY TYPES =====
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

// Type guards for runtime type checking
export const isValidGemstone = (obj: unknown): obj is Gemstone => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'weight_carats' in obj &&
    typeof (obj as Record<string, unknown>).weight_carats === 'number'
  )
}

export const isAdmin = (role: UserRole): role is 'admin' => {
  return role === 'admin'
}

export const isPremiumCustomer = (role: UserRole): role is 'premium_customer' => {
  return role === 'premium_customer'
}
