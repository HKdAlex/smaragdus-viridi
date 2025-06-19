export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
      gemstones: {
        Row: Gemstone
        Insert: Omit<Gemstone, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Gemstone, 'id' | 'created_at'>>
      }
      origins: {
        Row: Origin
        Insert: Omit<Origin, 'id' | 'created_at'>
        Update: Partial<Omit<Origin, 'id'>>
      }
      gemstone_images: {
        Row: GemstoneImage
        Insert: Omit<GemstoneImage, 'id' | 'created_at'>
        Update: Partial<Omit<GemstoneImage, 'id'>>
      }
      gemstone_videos: {
        Row: GemstoneVideo
        Insert: Omit<GemstoneVideo, 'id' | 'created_at'>
        Update: Partial<Omit<GemstoneVideo, 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gem_color: GemColor
      gem_cut: GemCut
      gem_clarity: GemClarity
      gemstone_type: GemstoneType
      currency_code: CurrencyCode
      user_role: UserRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type GemstoneType = 
  | 'diamond' 
  | 'emerald' 
  | 'ruby' 
  | 'sapphire' 
  | 'amethyst' 
  | 'topaz' 
  | 'garnet'
  | 'peridot'
  | 'citrine'
  | 'tanzanite'

export type GemColor =
  | 'red'
  | 'blue' 
  | 'green'
  | 'yellow'
  | 'pink'
  | 'white'
  | 'black'
  | 'colorless'
  | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'fancy-yellow' 
  | 'fancy-blue' 
  | 'fancy-pink'
  | 'fancy-green'

export type GemCut =
  | 'round'
  | 'oval'
  | 'marquise'
  | 'pear'
  | 'emerald'
  | 'princess'
  | 'cushion'
  | 'radiant'
  | 'fantasy'

export type GemClarity = 
  | 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2' | 'I1'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'RUB' | 'CHF' | 'JPY'

export type UserRole = 'admin' | 'regular_customer' | 'premium_customer' | 'guest'

export interface UserProfile {
  id: string
  user_id: string
  name: string
  phone: string
  role: UserRole
  discount_percentage: number
  preferred_currency: CurrencyCode
  created_at: string
  updated_at: string
}

export interface Origin {
  id: string
  name: string
  country: string
  region?: string
  mine_name?: string
  created_at: string
}

export interface Gemstone {
  id: string
  name: GemstoneType
  weight_carats: number
  length_mm: number
  width_mm: number
  depth_mm: number
  color: GemColor
  cut: GemCut
  clarity: GemClarity
  origin_id?: string
  price_amount: number
  price_currency: CurrencyCode
  premium_price_amount?: number
  premium_price_currency?: CurrencyCode
  in_stock: boolean
  delivery_days: number
  internal_code?: string
  serial_number: string
  created_at: string
  updated_at: string
}

export interface GemstoneImage {
  id: string
  gemstone_id: string
  image_url: string
  image_order: number
  is_primary: boolean
  has_watermark: boolean
  created_at: string
}

export interface GemstoneVideo {
  id: string
  gemstone_id: string
  video_url: string
  video_order: number
  duration_seconds?: number
  thumbnail_url?: string
  created_at: string
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      currency_code: ["USD", "EUR", "GBP", "RUB", "CHF", "JPY"],
      gem_clarity: [
        "FL",
        "IF",
        "VVS1",
        "VVS2",
        "VS1",
        "VS2",
        "SI1",
        "SI2",
        "I1",
      ],
      gem_color: [
        "red",
        "blue",
        "green",
        "yellow",
        "pink",
        "white",
        "black",
        "colorless",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "fancy-yellow",
        "fancy-blue",
        "fancy-pink",
        "fancy-green",
      ],
      gem_cut: [
        "round",
        "oval",
        "marquise",
        "pear",
        "emerald",
        "princess",
        "cushion",
        "radiant",
        "fantasy",
      ],
      gemstone_type: [
        "diamond",
        "emerald",
        "ruby",
        "sapphire",
        "amethyst",
        "topaz",
        "garnet",
        "peridot",
        "citrine",
        "tanzanite",
      ],
      user_role: ["admin", "regular_customer", "premium_customer", "guest"],
    },
  },
} as const 