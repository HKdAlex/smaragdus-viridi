export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_analysis_results: {
        Row: {
          ai_model_version: string | null
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          extracted_data: Json | null
          gemstone_id: string
          id: string
          input_data: Json
          processing_cost_usd: number | null
          processing_time_ms: number | null
          raw_response: Json
          updated_at: string | null
        }
        Insert: {
          ai_model_version?: string | null
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          extracted_data?: Json | null
          gemstone_id: string
          id?: string
          input_data: Json
          processing_cost_usd?: number | null
          processing_time_ms?: number | null
          raw_response: Json
          updated_at?: string | null
        }
        Update: {
          ai_model_version?: string | null
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          extracted_data?: Json | null
          gemstone_id?: string
          id?: string
          input_data?: Json
          processing_cost_usd?: number | null
          processing_time_ms?: number | null
          raw_response?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_results_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_results_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          created_at: string | null
          data: Json | null
          event_type: string
          id: string
          level: string
          message: string
          performance_data: Json | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          event_type: string
          id?: string
          level: string
          message: string
          performance_data?: Json | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          event_type?: string
          id?: string
          level?: string
          message?: string
          performance_data?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "audit_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_log_session_id"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "audit_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_sessions: {
        Row: {
          audit_log: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          session_type: string
          started_at: string
          status: string
          summary: Json | null
          updated_at: string | null
        }
        Insert: {
          audit_log?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_type?: string
          started_at?: string
          status?: string
          summary?: Json | null
          updated_at?: string | null
        }
        Update: {
          audit_log?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_type?: string
          started_at?: string
          status?: string
          summary?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string | null
          gemstone_id: string
          id: string
          metadata: Json | null
          quantity: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          gemstone_id: string
          id?: string
          metadata?: Json | null
          quantity?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          gemstone_id?: string
          id?: string
          metadata?: Json | null
          quantity?: number | null
          updated_at?: string | null
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
          {
            foreignKeyName: "cart_items_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
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
          {
            foreignKeyName: "certifications_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
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
      contact_messages: {
        Row: {
          admin_notes: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          inquiry_type: string
          ip_address: unknown | null
          is_spam: boolean | null
          locale: string | null
          message: string
          name: string
          phone: string | null
          preferred_contact_method: string | null
          referrer_url: string | null
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string | null
          urgency_level: string
          user_agent: string | null
        }
        Insert: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          inquiry_type: string
          ip_address?: unknown | null
          is_spam?: boolean | null
          locale?: string | null
          message: string
          name: string
          phone?: string | null
          preferred_contact_method?: string | null
          referrer_url?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          urgency_level?: string
          user_agent?: string | null
        }
        Update: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          inquiry_type?: string
          ip_address?: unknown | null
          is_spam?: boolean | null
          locale?: string | null
          message?: string
          name?: string
          phone?: string | null
          preferred_contact_method?: string | null
          referrer_url?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          urgency_level?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "orders_with_user_details"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_messages_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "favorites_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
          },
        ]
      }
      gemstone_images: {
        Row: {
          ai_analysis_date: string | null
          ai_analyzed: boolean | null
          ai_primary_reasoning: string | null
          ai_primary_score: number | null
          alt_text: string | null
          created_at: string | null
          gemstone_id: string
          has_watermark: boolean | null
          id: string
          image_order: number
          image_type: string | null
          image_url: string
          is_primary: boolean | null
          original_filename: string | null
          original_path: string | null
        }
        Insert: {
          ai_analysis_date?: string | null
          ai_analyzed?: boolean | null
          ai_primary_reasoning?: string | null
          ai_primary_score?: number | null
          alt_text?: string | null
          created_at?: string | null
          gemstone_id: string
          has_watermark?: boolean | null
          id?: string
          image_order: number
          image_type?: string | null
          image_url: string
          is_primary?: boolean | null
          original_filename?: string | null
          original_path?: string | null
        }
        Update: {
          ai_analysis_date?: string | null
          ai_analyzed?: boolean | null
          ai_primary_reasoning?: string | null
          ai_primary_score?: number | null
          alt_text?: string | null
          created_at?: string | null
          gemstone_id?: string
          has_watermark?: boolean | null
          id?: string
          image_order?: number
          image_type?: string | null
          image_url?: string
          is_primary?: boolean | null
          original_filename?: string | null
          original_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gemstone_images_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstone_images_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
          },
        ]
      }
      gemstone_videos: {
        Row: {
          ai_analysis_date: string | null
          ai_analyzed: boolean | null
          created_at: string | null
          duration_seconds: number | null
          gemstone_id: string
          id: string
          original_filename: string | null
          original_path: string | null
          thumbnail_url: string | null
          title: string | null
          video_order: number
          video_url: string
        }
        Insert: {
          ai_analysis_date?: string | null
          ai_analyzed?: boolean | null
          created_at?: string | null
          duration_seconds?: number | null
          gemstone_id: string
          id?: string
          original_filename?: string | null
          original_path?: string | null
          thumbnail_url?: string | null
          title?: string | null
          video_order: number
          video_url: string
        }
        Update: {
          ai_analysis_date?: string | null
          ai_analyzed?: boolean | null
          created_at?: string | null
          duration_seconds?: number | null
          gemstone_id?: string
          id?: string
          original_filename?: string | null
          original_path?: string | null
          thumbnail_url?: string | null
          title?: string | null
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
          {
            foreignKeyName: "gemstone_videos_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
          },
        ]
      }
      gemstones: {
        Row: {
          ai_analysis_date: string | null
          ai_analyzed: boolean | null
          ai_confidence_score: number | null
          ai_data_completeness: number | null
          clarity: Database["public"]["Enums"]["gem_clarity"]
          color: Database["public"]["Enums"]["gem_color"]
          created_at: string | null
          cut: Database["public"]["Enums"]["gem_cut"]
          delivery_days: number | null
          depth_mm: number
          description: string | null
          id: string
          import_batch_id: string | null
          import_folder_path: string | null
          import_notes: string | null
          in_stock: boolean | null
          internal_code: string | null
          length_mm: number
          marketing_highlights: string[] | null
          metadata_status: Database["public"]["Enums"]["metadata_status"] | null
          name: Database["public"]["Enums"]["gemstone_type"]
          origin_id: string | null
          premium_price_amount: number | null
          premium_price_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount: number
          price_currency: Database["public"]["Enums"]["currency_code"]
          price_per_carat: number | null
          promotional_text: string | null
          quantity: number
          serial_number: string
          updated_at: string | null
          weight_carats: number
          width_mm: number
        }
        Insert: {
          ai_analysis_date?: string | null
          ai_analyzed?: boolean | null
          ai_confidence_score?: number | null
          ai_data_completeness?: number | null
          clarity: Database["public"]["Enums"]["gem_clarity"]
          color: Database["public"]["Enums"]["gem_color"]
          created_at?: string | null
          cut: Database["public"]["Enums"]["gem_cut"]
          delivery_days?: number | null
          depth_mm: number
          description?: string | null
          id?: string
          import_batch_id?: string | null
          import_folder_path?: string | null
          import_notes?: string | null
          in_stock?: boolean | null
          internal_code?: string | null
          length_mm: number
          marketing_highlights?: string[] | null
          metadata_status?:
            | Database["public"]["Enums"]["metadata_status"]
            | null
          name: Database["public"]["Enums"]["gemstone_type"]
          origin_id?: string | null
          premium_price_amount?: number | null
          premium_price_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount: number
          price_currency: Database["public"]["Enums"]["currency_code"]
          price_per_carat?: number | null
          promotional_text?: string | null
          quantity?: number
          serial_number: string
          updated_at?: string | null
          weight_carats: number
          width_mm: number
        }
        Update: {
          ai_analysis_date?: string | null
          ai_analyzed?: boolean | null
          ai_confidence_score?: number | null
          ai_data_completeness?: number | null
          clarity?: Database["public"]["Enums"]["gem_clarity"]
          color?: Database["public"]["Enums"]["gem_color"]
          created_at?: string | null
          cut?: Database["public"]["Enums"]["gem_cut"]
          delivery_days?: number | null
          depth_mm?: number
          description?: string | null
          id?: string
          import_batch_id?: string | null
          import_folder_path?: string | null
          import_notes?: string | null
          in_stock?: boolean | null
          internal_code?: string | null
          length_mm?: number
          marketing_highlights?: string[] | null
          metadata_status?:
            | Database["public"]["Enums"]["metadata_status"]
            | null
          name?: Database["public"]["Enums"]["gemstone_type"]
          origin_id?: string | null
          premium_price_amount?: number | null
          premium_price_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount?: number
          price_currency?: Database["public"]["Enums"]["currency_code"]
          price_per_carat?: number | null
          promotional_text?: string | null
          quantity?: number
          serial_number?: string
          updated_at?: string | null
          weight_carats?: number
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_gemstones_import_batch_id"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstones_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstones_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "origins"
            referencedColumns: ["id"]
          },
        ]
      }
      image_classifications: {
        Row: {
          ai_description: string | null
          classification: string
          confidence_score: number | null
          created_at: string | null
          extracted_data: Json | null
          extracted_text: string | null
          id: string
          image_id: string
        }
        Insert: {
          ai_description?: string | null
          classification: string
          confidence_score?: number | null
          created_at?: string | null
          extracted_data?: Json | null
          extracted_text?: string | null
          id?: string
          image_id: string
        }
        Update: {
          ai_description?: string | null
          classification?: string
          confidence_score?: number | null
          created_at?: string | null
          extracted_data?: Json | null
          extracted_text?: string | null
          id?: string
          image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_classifications_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "gemstone_images"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          ai_analysis_enabled: boolean | null
          batch_metadata: Json | null
          batch_name: string
          created_at: string | null
          error_message: string | null
          id: string
          processed_files: number | null
          processed_folders: number | null
          processed_gemstones: number | null
          processing_completed_at: string | null
          processing_started_at: string | null
          source_path: string
          status: string | null
          total_cost_usd: number | null
          total_files: number | null
          total_folders: number
          total_gemstones: number | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis_enabled?: boolean | null
          batch_metadata?: Json | null
          batch_name: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_files?: number | null
          processed_folders?: number | null
          processed_gemstones?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          source_path: string
          status?: string | null
          total_cost_usd?: number | null
          total_files?: number | null
          total_folders: number
          total_gemstones?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis_enabled?: boolean | null
          batch_metadata?: Json | null
          batch_name?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_files?: number | null
          processed_folders?: number | null
          processed_gemstones?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          source_path?: string
          status?: string | null
          total_cost_usd?: number | null
          total_files?: number | null
          total_folders?: number
          total_gemstones?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_events: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          id: string
          is_internal: boolean | null
          metadata: Json | null
          order_id: string
          performed_at: string | null
          performed_by: string | null
          severity: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          is_internal?: boolean | null
          metadata?: Json | null
          order_id: string
          performed_at?: string | null
          performed_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          is_internal?: boolean | null
          metadata?: Json | null
          order_id?: string
          performed_at?: string | null
          performed_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_user_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "orders_with_user_details"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "order_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
            foreignKeyName: "order_items_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_details"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_user_details"
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
      user_preferences: {
        Row: {
          cart_updates: boolean | null
          created_at: string | null
          data_sharing: boolean | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          order_updates: boolean | null
          preferred_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          profile_visibility: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cart_updates?: boolean | null
          created_at?: string | null
          data_sharing?: boolean | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          order_updates?: boolean | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          profile_visibility?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cart_updates?: boolean | null
          created_at?: string | null
          data_sharing?: boolean | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          order_updates?: boolean | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          profile_visibility?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
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
      catalog_performance_metrics: {
        Row: {
          metric: string | null
          value: string | null
        }
        Relationships: []
      }
      orders_with_details: {
        Row: {
          created_at: string | null
          currency_code: Database["public"]["Enums"]["currency_code"] | null
          gemstone_color: Database["public"]["Enums"]["gem_color"] | null
          gemstone_cut: Database["public"]["Enums"]["gem_cut"] | null
          gemstone_id: string | null
          gemstone_name: Database["public"]["Enums"]["gemstone_type"] | null
          in_stock: boolean | null
          line_total: number | null
          notes: string | null
          order_id: string | null
          order_item_id: string | null
          quantity: number | null
          serial_number: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
          unit_price: number | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
          user_phone: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          weight_carats: number | null
        }
        Relationships: []
      }
      orders_with_user_details: {
        Row: {
          created_at: string | null
          currency_code: Database["public"]["Enums"]["currency_code"] | null
          delivery_address: Json | null
          discount_percentage: number | null
          email: string | null
          id: string | null
          name: string | null
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          phone: string | null
          preferred_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          profile_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_cart_total: {
        Args: { p_user_id: string }
        Returns: {
          currency: string
          total_amount: number
          total_items: number
        }[]
      }
      cleanup_audit_data: {
        Args: { days_old?: number }
        Returns: number
      }
      cleanup_expired_cart_items: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_batch_statistics: {
        Args: { batch_uuid: string }
        Returns: Json
      }
      get_catalog_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_import_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      search_gemstones_optimized: {
        Args: {
          clarities?: string[]
          colors?: string[]
          cuts?: string[]
          gemstone_types?: string[]
          has_ai_analysis?: boolean
          has_certifications?: boolean
          has_images?: boolean
          in_stock_only?: boolean
          max_price?: number
          max_weight?: number
          min_price?: number
          min_weight?: number
          origins?: string[]
          page_limit?: number
          page_offset?: number
          search_term?: string
          sort_by?: string
          sort_direction?: string
        }
        Returns: {
          ai_analysis_count: number
          certifications_count: number
          clarity: string
          color: string
          created_at: string
          cut: string
          delivery_days: number
          id: string
          in_stock: boolean
          internal_code: string
          name: string
          origin_country: string
          origin_name: string
          premium_price_amount: number
          premium_price_currency: string
          price_amount: number
          price_currency: string
          primary_image_url: string
          serial_number: string
          total_count: number
          updated_at: string
          weight_carats: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      validate_cart_item: {
        Args: { p_gemstone_id: string; p_quantity: number; p_user_id: string }
        Returns: boolean
      }
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
        | "baguette"
        | "asscher"
        | "rhombus"
        | "trapezoid"
        | "triangle"
        | "heart"
        | "cabochon"
        | "pentagon"
        | "hexagon"
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
        | "aquamarine"
        | "morganite"
        | "tourmaline"
        | "zircon"
        | "apatite"
        | "quartz"
        | "paraiba"
        | "spinel"
        | "alexandrite"
        | "agate"
      metadata_status:
        | "needs_review"
        | "updated"
        | "needs_updating"
        | "verified"
        | "rejected"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
        "baguette",
        "asscher",
        "rhombus",
        "trapezoid",
        "triangle",
        "heart",
        "cabochon",
        "pentagon",
        "hexagon",
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
        "aquamarine",
        "morganite",
        "tourmaline",
        "zircon",
        "apatite",
        "quartz",
        "paraiba",
        "spinel",
        "alexandrite",
        "agate",
      ],
      metadata_status: [
        "needs_review",
        "updated",
        "needs_updating",
        "verified",
        "rejected",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_type: ["bank_transfer", "crypto", "cash", "stripe"],
      user_role: ["admin", "regular_customer", "premium_customer", "guest"],
    },
  },
} as const
