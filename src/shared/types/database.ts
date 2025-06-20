export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cart_items: {
        Row: {
          added_at: string | null
          gemstone_id: string
          id: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          gemstone_id: string
          id?: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          gemstone_id?: string
          id?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          certificate_number: string | null
          certificate_type: string
          certificate_url: string | null
          created_at: string | null
          gemstone_id: string
          id: string
          issued_date: string | null
        }
        Insert: {
          certificate_number?: string | null
          certificate_type: string
          certificate_url?: string | null
          created_at?: string | null
          gemstone_id: string
          id?: string
          issued_date?: string | null
        }
        Update: {
          certificate_number?: string | null
          certificate_type?: string
          certificate_url?: string | null
          created_at?: string | null
          gemstone_id?: string
          id?: string
          issued_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          admin_id: string | null
          attachments: string[] | null
          content: string
          created_at: string | null
          id: string
          is_auto_response: boolean | null
          is_read: boolean | null
          sender_type: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          attachments?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          is_auto_response?: boolean | null
          is_read?: boolean | null
          sender_type: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          attachments?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          is_auto_response?: boolean | null
          is_read?: boolean | null
          sender_type?: string
          user_id?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          base_currency: Database["public"]["Enums"]["currency_code"]
          id: string
          rate: number
          target_currency: Database["public"]["Enums"]["currency_code"]
          updated_at: string | null
        }
        Insert: {
          base_currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          rate: number
          target_currency: Database["public"]["Enums"]["currency_code"]
          updated_at?: string | null
        }
        Update: {
          base_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          rate?: number
          target_currency?: Database["public"]["Enums"]["currency_code"]
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          gemstone_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gemstone_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          gemstone_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
        ]
      }
      gemstone_images: {
        Row: {
          created_at: string | null
          gemstone_id: string
          has_watermark: boolean | null
          id: string
          image_order: number
          image_url: string
          is_primary: boolean | null
        }
        Insert: {
          created_at?: string | null
          gemstone_id: string
          has_watermark?: boolean | null
          id?: string
          image_order: number
          image_url: string
          is_primary?: boolean | null
        }
        Update: {
          created_at?: string | null
          gemstone_id?: string
          has_watermark?: boolean | null
          id?: string
          image_order?: number
          image_url?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "gemstone_images_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
        ]
      }
      gemstone_videos: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          gemstone_id: string
          id: string
          thumbnail_url: string | null
          video_order: number
          video_url: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          gemstone_id: string
          id?: string
          thumbnail_url?: string | null
          video_order: number
          video_url: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          gemstone_id?: string
          id?: string
          thumbnail_url?: string | null
          video_order?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gemstone_videos_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
        ]
      }
      gemstones: {
        Row: {
          clarity: Database["public"]["Enums"]["gem_clarity"]
          color: Database["public"]["Enums"]["gem_color"]
          created_at: string | null
          cut: Database["public"]["Enums"]["gem_cut"]
          delivery_days: number | null
          depth_mm: number
          id: string
          in_stock: boolean | null
          internal_code: string | null
          length_mm: number
          name: Database["public"]["Enums"]["gemstone_type"]
          origin_id: string | null
          premium_price_amount: number | null
          premium_price_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount: number
          price_currency: Database["public"]["Enums"]["currency_code"]
          serial_number: string
          updated_at: string | null
          weight_carats: number
          width_mm: number
        }
        Insert: {
          clarity: Database["public"]["Enums"]["gem_clarity"]
          color: Database["public"]["Enums"]["gem_color"]
          created_at?: string | null
          cut: Database["public"]["Enums"]["gem_cut"]
          delivery_days?: number | null
          depth_mm: number
          id?: string
          in_stock?: boolean | null
          internal_code?: string | null
          length_mm: number
          name: Database["public"]["Enums"]["gemstone_type"]
          origin_id?: string | null
          premium_price_amount?: number | null
          premium_price_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount: number
          price_currency: Database["public"]["Enums"]["currency_code"]
          serial_number: string
          updated_at?: string | null
          weight_carats: number
          width_mm: number
        }
        Update: {
          clarity?: Database["public"]["Enums"]["gem_clarity"]
          color?: Database["public"]["Enums"]["gem_color"]
          created_at?: string | null
          cut?: Database["public"]["Enums"]["gem_cut"]
          delivery_days?: number | null
          depth_mm?: number
          id?: string
          in_stock?: boolean | null
          internal_code?: string | null
          length_mm?: number
          name?: Database["public"]["Enums"]["gemstone_type"]
          origin_id?: string | null
          premium_price_amount?: number | null
          premium_price_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount?: number
          price_currency?: Database["public"]["Enums"]["currency_code"]
          serial_number?: string
          updated_at?: string | null
          weight_carats?: number
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "gemstones_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "origins"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          gemstone_id: string
          id: string
          line_total: number
          order_id: string
          quantity: number | null
          unit_price: number
        }
        Insert: {
          gemstone_id: string
          id?: string
          line_total: number
          order_id: string
          quantity?: number | null
          unit_price: number
        }
        Update: {
          gemstone_id?: string
          id?: string
          line_total?: number
          order_id?: string
          quantity?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency_code: Database["public"]["Enums"]["currency_code"] | null
          delivery_address: Json | null
          id: string
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency_code?: Database["public"]["Enums"]["currency_code"] | null
          delivery_address?: Json | null
          id?: string
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency_code?: Database["public"]["Enums"]["currency_code"] | null
          delivery_address?: Json | null
          id?: string
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      origins: {
        Row: {
          country: string
          created_at: string | null
          id: string
          mine_name: string | null
          name: string
          region: string | null
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          mine_name?: string | null
          name: string
          region?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          mine_name?: string | null
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          id: string
          name: string
          phone: string | null
          preferred_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          name: string
          phone?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          name?: string
          phone?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      currency_code: "USD" | "EUR" | "GBP" | "RUB" | "CHF" | "JPY"
      gem_clarity:
        | "FL"
        | "IF"
        | "VVS1"
        | "VVS2"
        | "VS1"
        | "VS2"
        | "SI1"
        | "SI2"
        | "I1"
      gem_color:
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
        | "fancy-green"
      gem_cut:
        | "round"
        | "oval"
        | "marquise"
        | "pear"
        | "emerald"
        | "princess"
        | "cushion"
        | "radiant"
        | "fantasy"
      gemstone_type:
        | "diamond"
        | "emerald"
        | "ruby"
        | "sapphire"
        | "amethyst"
        | "topaz"
        | "garnet"
        | "peridot"
        | "citrine"
        | "tanzanite"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_type: "bank_transfer" | "crypto" | "cash" | "stripe"
      user_role: "admin" | "regular_customer" | "premium_customer" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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