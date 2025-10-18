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
          description_data: Json | null
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
          description_data?: Json | null
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
          description_data?: Json | null
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
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_results_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_with_best_data"
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
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_with_best_data"
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
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_with_best_data"
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
      color_translations: {
        Row: {
          color_id: number
          created_at: string
          id: number
          language_code: string
          name: string
        }
        Insert: {
          color_id: number
          created_at?: string
          id?: number
          language_code: string
          name: string
        }
        Update: {
          color_id?: number
          created_at?: string
          id?: number
          language_code?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "color_translations_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          color_code: string
          created_at: string
          hex_value: string | null
          id: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          color_code: string
          created_at?: string
          hex_value?: string | null
          id?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color_code?: string
          created_at?: string
          hex_value?: string | null
          id?: number
          sort_order?: number
          updated_at?: string
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
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_with_best_data"
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
      gem_clarity_translations: {
        Row: {
          clarity_code: string
          description: string | null
          id: string
          locale: string
          name: string
        }
        Insert: {
          clarity_code: string
          description?: string | null
          id?: string
          locale: string
          name: string
        }
        Update: {
          clarity_code?: string
          description?: string | null
          id?: string
          locale?: string
          name?: string
        }
        Relationships: []
      }
      gem_color_translations: {
        Row: {
          color_code: string
          description: string | null
          id: string
          locale: string
          name: string
        }
        Insert: {
          color_code: string
          description?: string | null
          id?: string
          locale: string
          name: string
        }
        Update: {
          color_code?: string
          description?: string | null
          id?: string
          locale?: string
          name?: string
        }
        Relationships: []
      }
      gem_cut_translations: {
        Row: {
          cut_code: string
          description: string | null
          id: string
          locale: string
          name: string
        }
        Insert: {
          cut_code: string
          description?: string | null
          id?: string
          locale: string
          name: string
        }
        Update: {
          cut_code?: string
          description?: string | null
          id?: string
          locale?: string
          name?: string
        }
        Relationships: []
      }
      gem_image_extractions: {
        Row: {
          claims: Json
          created_at: string
          gemstone_id: string
          id: string
          image_id: string
          image_type: string
          model_version: string | null
          processing_cost_usd: number | null
          processing_time_ms: number | null
          raw_response: Json | null
        }
        Insert: {
          claims?: Json
          created_at?: string
          gemstone_id: string
          id?: string
          image_id: string
          image_type: string
          model_version?: string | null
          processing_cost_usd?: number | null
          processing_time_ms?: number | null
          raw_response?: Json | null
        }
        Update: {
          claims?: Json
          created_at?: string
          gemstone_id?: string
          id?: string
          image_id?: string
          image_type?: string
          model_version?: string | null
          processing_cost_usd?: number | null
          processing_time_ms?: number | null
          raw_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "gem_image_extractions_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gem_image_extractions_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gem_image_extractions_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_with_best_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gem_image_extractions_gemstone_id_fkey"
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
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstone_images_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_with_best_data"
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
      gemstone_type_translations: {
        Row: {
          description: string | null
          id: string
          locale: string
          name: string
          type_code: string
        }
        Insert: {
          description?: string | null
          id?: string
          locale: string
          name: string
          type_code: string
        }
        Update: {
          description?: string | null
          id?: string
          locale?: string
          name?: string
          type_code?: string
        }
        Relationships: []
      }
      gemstone_videos: {
        Row: {
          ai_analysis_date: string | null
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
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstone_videos_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_with_best_data"
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
          ai_analysis_v5: boolean
          ai_analysis_v5_date: string | null
          ai_clarity: string | null
          ai_color: string | null
          ai_color_code: string | null
          ai_color_description: string | null
          ai_confidence_score: number | null
          ai_cut: string | null
          ai_data_completeness: number | null
          ai_depth_mm: number | null
          ai_description_cost_usd: number | null
          ai_description_date: string | null
          ai_description_model: string | null
          ai_extracted_date: string | null
          ai_extraction_confidence: number | null
          ai_length_mm: number | null
          ai_origin: string | null
          ai_quality_grade: string | null
          ai_text_generated_v6: boolean
          ai_text_generated_v6_date: string | null
          ai_treatment: string | null
          ai_weight_carats: number | null
          ai_width_mm: number | null
          clarity: Database["public"]["Enums"]["gem_clarity"]
          clarity_code: string
          color: Database["public"]["Enums"]["gem_color"]
          color_code: string
          created_at: string | null
          cut: Database["public"]["Enums"]["gem_cut"]
          cut_code: string
          delivery_days: number | null
          depth_mm: number
          description: string | null
          description_emotional_en: string | null
          description_emotional_ru: string | null
          description_technical_en: string | null
          description_technical_ru: string | null
          description_vector_en: unknown | null
          description_vector_ru: unknown | null
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
          narrative_story_en: string | null
          narrative_story_ru: string | null
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
          search_vector_en: unknown | null
          search_vector_ru: unknown | null
          serial_number: string
          type_code: string
          updated_at: string | null
          weight_carats: number
          width_mm: number
        }
        Insert: {
          ai_analysis_date?: string | null
          ai_analysis_v5?: boolean
          ai_analysis_v5_date?: string | null
          ai_clarity?: string | null
          ai_color?: string | null
          ai_color_code?: string | null
          ai_color_description?: string | null
          ai_confidence_score?: number | null
          ai_cut?: string | null
          ai_data_completeness?: number | null
          ai_depth_mm?: number | null
          ai_description_cost_usd?: number | null
          ai_description_date?: string | null
          ai_description_model?: string | null
          ai_extracted_date?: string | null
          ai_extraction_confidence?: number | null
          ai_length_mm?: number | null
          ai_origin?: string | null
          ai_quality_grade?: string | null
          ai_text_generated_v6?: boolean
          ai_text_generated_v6_date?: string | null
          ai_treatment?: string | null
          ai_weight_carats?: number | null
          ai_width_mm?: number | null
          clarity: Database["public"]["Enums"]["gem_clarity"]
          clarity_code: string
          color: Database["public"]["Enums"]["gem_color"]
          color_code: string
          created_at?: string | null
          cut: Database["public"]["Enums"]["gem_cut"]
          cut_code: string
          delivery_days?: number | null
          depth_mm: number
          description?: string | null
          description_emotional_en?: string | null
          description_emotional_ru?: string | null
          description_technical_en?: string | null
          description_technical_ru?: string | null
          description_vector_en?: unknown | null
          description_vector_ru?: unknown | null
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
          narrative_story_en?: string | null
          narrative_story_ru?: string | null
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
          search_vector_en?: unknown | null
          search_vector_ru?: unknown | null
          serial_number: string
          type_code: string
          updated_at?: string | null
          weight_carats: number
          width_mm: number
        }
        Update: {
          ai_analysis_date?: string | null
          ai_analysis_v5?: boolean
          ai_analysis_v5_date?: string | null
          ai_clarity?: string | null
          ai_color?: string | null
          ai_color_code?: string | null
          ai_color_description?: string | null
          ai_confidence_score?: number | null
          ai_cut?: string | null
          ai_data_completeness?: number | null
          ai_depth_mm?: number | null
          ai_description_cost_usd?: number | null
          ai_description_date?: string | null
          ai_description_model?: string | null
          ai_extracted_date?: string | null
          ai_extraction_confidence?: number | null
          ai_length_mm?: number | null
          ai_origin?: string | null
          ai_quality_grade?: string | null
          ai_text_generated_v6?: boolean
          ai_text_generated_v6_date?: string | null
          ai_treatment?: string | null
          ai_weight_carats?: number | null
          ai_width_mm?: number | null
          clarity?: Database["public"]["Enums"]["gem_clarity"]
          clarity_code?: string
          color?: Database["public"]["Enums"]["gem_color"]
          color_code?: string
          created_at?: string | null
          cut?: Database["public"]["Enums"]["gem_cut"]
          cut_code?: string
          delivery_days?: number | null
          depth_mm?: number
          description?: string | null
          description_emotional_en?: string | null
          description_emotional_ru?: string | null
          description_technical_en?: string | null
          description_technical_ru?: string | null
          description_vector_en?: unknown | null
          description_vector_ru?: unknown | null
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
          narrative_story_en?: string | null
          narrative_story_ru?: string | null
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
          search_vector_en?: unknown | null
          search_vector_ru?: unknown | null
          serial_number?: string
          type_code?: string
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
      gemstones_ai_v5: {
        Row: {
          analysis_version: string
          confidence: Json
          conflicts: string[]
          created_at: string
          final: Json
          gemstone_id: string
          images: string[]
          needs_review: boolean
          provenance: Json
          updated_at: string
        }
        Insert: {
          analysis_version?: string
          confidence: Json
          conflicts?: string[]
          created_at?: string
          final: Json
          gemstone_id: string
          images: string[]
          needs_review?: boolean
          provenance: Json
          updated_at?: string
        }
        Update: {
          analysis_version?: string
          confidence?: Json
          conflicts?: string[]
          created_at?: string
          final?: Json
          gemstone_id?: string
          images?: string[]
          needs_review?: boolean
          provenance?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gemstones_ai_v5_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: true
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstones_ai_v5_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: true
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstones_ai_v5_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: true
            referencedRelation: "gemstones_with_best_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstones_ai_v5_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: true
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
          },
        ]
      }
      gemstones_ai_v6: {
        Row: {
          care_instructions_en: string | null
          care_instructions_ru: string | null
          color_detection_confidence: number | null
          color_detection_reasoning: string | null
          color_matches_metadata: boolean | null
          confidence_score: number | null
          created_at: string
          cut_detection_confidence: number | null
          cut_detection_reasoning: string | null
          cut_matches_metadata: boolean | null
          detected_color: string | null
          detected_color_description: string | null
          detected_cut: string | null
          emotional_description_en: string | null
          emotional_description_ru: string | null
          gemstone_id: string
          generation_cost_usd: number | null
          generation_time_ms: number | null
          historical_context_en: string | null
          historical_context_ru: string | null
          image_quality_scores: Json | null
          image_urls: string[] | null
          marketing_highlights: string[] | null
          marketing_highlights_ru: string[] | null
          model_version: string
          narrative_story_en: string | null
          narrative_story_ru: string | null
          needs_review: boolean
          primary_image_selection_reasoning: string | null
          promotional_text: string | null
          promotional_text_ru: string | null
          recommended_primary_image_index: number | null
          review_notes: string | null
          selected_image_uuid: string | null
          technical_description_en: string | null
          technical_description_ru: string | null
          updated_at: string
          used_images: boolean
        }
        Insert: {
          care_instructions_en?: string | null
          care_instructions_ru?: string | null
          color_detection_confidence?: number | null
          color_detection_reasoning?: string | null
          color_matches_metadata?: boolean | null
          confidence_score?: number | null
          created_at?: string
          cut_detection_confidence?: number | null
          cut_detection_reasoning?: string | null
          cut_matches_metadata?: boolean | null
          detected_color?: string | null
          detected_color_description?: string | null
          detected_cut?: string | null
          emotional_description_en?: string | null
          emotional_description_ru?: string | null
          gemstone_id: string
          generation_cost_usd?: number | null
          generation_time_ms?: number | null
          historical_context_en?: string | null
          historical_context_ru?: string | null
          image_quality_scores?: Json | null
          image_urls?: string[] | null
          marketing_highlights?: string[] | null
          marketing_highlights_ru?: string[] | null
          model_version: string
          narrative_story_en?: string | null
          narrative_story_ru?: string | null
          needs_review?: boolean
          primary_image_selection_reasoning?: string | null
          promotional_text?: string | null
          promotional_text_ru?: string | null
          recommended_primary_image_index?: number | null
          review_notes?: string | null
          selected_image_uuid?: string | null
          technical_description_en?: string | null
          technical_description_ru?: string | null
          updated_at?: string
          used_images?: boolean
        }
        Update: {
          care_instructions_en?: string | null
          care_instructions_ru?: string | null
          color_detection_confidence?: number | null
          color_detection_reasoning?: string | null
          color_matches_metadata?: boolean | null
          confidence_score?: number | null
          created_at?: string
          cut_detection_confidence?: number | null
          cut_detection_reasoning?: string | null
          cut_matches_metadata?: boolean | null
          detected_color?: string | null
          detected_color_description?: string | null
          detected_cut?: string | null
          emotional_description_en?: string | null
          emotional_description_ru?: string | null
          gemstone_id?: string
          generation_cost_usd?: number | null
          generation_time_ms?: number | null
          historical_context_en?: string | null
          historical_context_ru?: string | null
          image_quality_scores?: Json | null
          image_urls?: string[] | null
          marketing_highlights?: string[] | null
          marketing_highlights_ru?: string[] | null
          model_version?: string
          narrative_story_en?: string | null
          narrative_story_ru?: string | null
          needs_review?: boolean
          primary_image_selection_reasoning?: string | null
          promotional_text?: string | null
          promotional_text_ru?: string | null
          recommended_primary_image_index?: number | null
          review_notes?: string | null
          selected_image_uuid?: string | null
          technical_description_en?: string | null
          technical_description_ru?: string | null
          updated_at?: string
          used_images?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gemstones_ai_v6_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: true
            referencedRelation: "gemstones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstones_ai_v6_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: true
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstones_ai_v6_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: true
            referencedRelation: "gemstones_with_best_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemstones_ai_v6_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: true
            referencedRelation: "orders_with_details"
            referencedColumns: ["gemstone_id"]
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
            referencedRelation: "gemstones_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_gemstone_id_fkey"
            columns: ["gemstone_id"]
            isOneToOne: false
            referencedRelation: "gemstones_with_best_data"
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
          order_number: string | null
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
          order_number?: string | null
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
          order_number?: string | null
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
      search_analytics: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          results_count: number
          search_query: string
          session_id: string | null
          used_fuzzy_search: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          results_count: number
          search_query: string
          session_id?: string | null
          used_fuzzy_search?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          results_count?: number
          search_query?: string
          session_id?: string | null
          used_fuzzy_search?: boolean | null
          user_id?: string | null
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
      gemstones_enriched: {
        Row: {
          ai_analyzed: boolean | null
          ai_color: string | null
          care_instructions_en: string | null
          care_instructions_ru: string | null
          clarity: string | null
          clarity_code: string | null
          color: string | null
          color_code: string | null
          color_detection_confidence: number | null
          confidence_score: number | null
          created_at: string | null
          cut: string | null
          cut_code: string | null
          cut_detection_confidence: number | null
          description: string | null
          detected_color: string | null
          detected_color_description: string | null
          detected_cut: string | null
          emotional_description_en: string | null
          emotional_description_ru: string | null
          historical_context_en: string | null
          historical_context_ru: string | null
          id: string | null
          in_stock: boolean | null
          marketing_highlights_en: string[] | null
          marketing_highlights_ru: string[] | null
          metadata_status: string | null
          model_version: string | null
          name: string | null
          narrative_story_en: string | null
          narrative_story_ru: string | null
          needs_review: boolean | null
          origin_id: string | null
          price_amount: number | null
          price_currency: string | null
          promotional_text_en: string | null
          promotional_text_ru: string | null
          recommended_primary_image_index: number | null
          selected_image_uuid: string | null
          serial_number: string | null
          technical_description_en: string | null
          technical_description_ru: string | null
          type_code: string | null
          updated_at: string | null
          weight_carats: number | null
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
      gemstones_with_best_data: {
        Row: {
          ai_analysis_date: string | null
          ai_analyzed: boolean | null
          ai_clarity: string | null
          ai_color: string | null
          ai_confidence_score: number | null
          ai_cut: string | null
          ai_data_completeness: number | null
          ai_depth_mm: number | null
          ai_description_cost_usd: number | null
          ai_description_date: string | null
          ai_description_model: string | null
          ai_extracted_date: string | null
          ai_extraction_confidence: number | null
          ai_length_mm: number | null
          ai_origin: string | null
          ai_quality_grade: string | null
          ai_treatment: string | null
          ai_weight_carats: number | null
          ai_width_mm: number | null
          best_clarity: string | null
          best_color: string | null
          best_cut: string | null
          best_depth_mm: number | null
          best_length_mm: number | null
          best_weight_carats: number | null
          best_width_mm: number | null
          clarity: Database["public"]["Enums"]["gem_clarity"] | null
          clarity_code: string | null
          color: Database["public"]["Enums"]["gem_color"] | null
          color_code: string | null
          created_at: string | null
          cut: Database["public"]["Enums"]["gem_cut"] | null
          cut_code: string | null
          delivery_days: number | null
          depth_mm: number | null
          description: string | null
          description_emotional_en: string | null
          description_emotional_ru: string | null
          description_technical_en: string | null
          description_technical_ru: string | null
          description_vector_en: unknown | null
          description_vector_ru: unknown | null
          id: string | null
          import_batch_id: string | null
          import_folder_path: string | null
          import_notes: string | null
          in_stock: boolean | null
          internal_code: string | null
          length_mm: number | null
          marketing_highlights: string[] | null
          metadata_status: Database["public"]["Enums"]["metadata_status"] | null
          name: Database["public"]["Enums"]["gemstone_type"] | null
          narrative_story_en: string | null
          narrative_story_ru: string | null
          origin_id: string | null
          premium_price_amount: number | null
          premium_price_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount: number | null
          price_currency: Database["public"]["Enums"]["currency_code"] | null
          price_per_carat: number | null
          promotional_text: string | null
          quantity: number | null
          search_vector_en: unknown | null
          search_vector_ru: unknown | null
          serial_number: string | null
          type_code: string | null
          updated_at: string | null
          weight_carats: number | null
          weight_source: string | null
          width_mm: number | null
        }
        Insert: {
          ai_analysis_date?: string | null
          ai_analyzed?: boolean | null
          ai_clarity?: string | null
          ai_color?: string | null
          ai_confidence_score?: number | null
          ai_cut?: string | null
          ai_data_completeness?: number | null
          ai_depth_mm?: number | null
          ai_description_cost_usd?: number | null
          ai_description_date?: string | null
          ai_description_model?: string | null
          ai_extracted_date?: string | null
          ai_extraction_confidence?: number | null
          ai_length_mm?: number | null
          ai_origin?: string | null
          ai_quality_grade?: string | null
          ai_treatment?: string | null
          ai_weight_carats?: number | null
          ai_width_mm?: number | null
          best_clarity?: never
          best_color?: never
          best_cut?: never
          best_depth_mm?: never
          best_length_mm?: never
          best_weight_carats?: never
          best_width_mm?: never
          clarity?: Database["public"]["Enums"]["gem_clarity"] | null
          clarity_code?: string | null
          color?: Database["public"]["Enums"]["gem_color"] | null
          color_code?: string | null
          created_at?: string | null
          cut?: Database["public"]["Enums"]["gem_cut"] | null
          cut_code?: string | null
          delivery_days?: number | null
          depth_mm?: number | null
          description?: string | null
          description_emotional_en?: string | null
          description_emotional_ru?: string | null
          description_technical_en?: string | null
          description_technical_ru?: string | null
          description_vector_en?: unknown | null
          description_vector_ru?: unknown | null
          id?: string | null
          import_batch_id?: string | null
          import_folder_path?: string | null
          import_notes?: string | null
          in_stock?: boolean | null
          internal_code?: string | null
          length_mm?: number | null
          marketing_highlights?: string[] | null
          metadata_status?:
            | Database["public"]["Enums"]["metadata_status"]
            | null
          name?: Database["public"]["Enums"]["gemstone_type"] | null
          narrative_story_en?: string | null
          narrative_story_ru?: string | null
          origin_id?: string | null
          premium_price_amount?: number | null
          premium_price_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount?: number | null
          price_currency?: Database["public"]["Enums"]["currency_code"] | null
          price_per_carat?: number | null
          promotional_text?: string | null
          quantity?: number | null
          search_vector_en?: unknown | null
          search_vector_ru?: unknown | null
          serial_number?: string | null
          type_code?: string | null
          updated_at?: string | null
          weight_carats?: number | null
          weight_source?: never
          width_mm?: number | null
        }
        Update: {
          ai_analysis_date?: string | null
          ai_analyzed?: boolean | null
          ai_clarity?: string | null
          ai_color?: string | null
          ai_confidence_score?: number | null
          ai_cut?: string | null
          ai_data_completeness?: number | null
          ai_depth_mm?: number | null
          ai_description_cost_usd?: number | null
          ai_description_date?: string | null
          ai_description_model?: string | null
          ai_extracted_date?: string | null
          ai_extraction_confidence?: number | null
          ai_length_mm?: number | null
          ai_origin?: string | null
          ai_quality_grade?: string | null
          ai_treatment?: string | null
          ai_weight_carats?: number | null
          ai_width_mm?: number | null
          best_clarity?: never
          best_color?: never
          best_cut?: never
          best_depth_mm?: never
          best_length_mm?: never
          best_weight_carats?: never
          best_width_mm?: never
          clarity?: Database["public"]["Enums"]["gem_clarity"] | null
          clarity_code?: string | null
          color?: Database["public"]["Enums"]["gem_color"] | null
          color_code?: string | null
          created_at?: string | null
          cut?: Database["public"]["Enums"]["gem_cut"] | null
          cut_code?: string | null
          delivery_days?: number | null
          depth_mm?: number | null
          description?: string | null
          description_emotional_en?: string | null
          description_emotional_ru?: string | null
          description_technical_en?: string | null
          description_technical_ru?: string | null
          description_vector_en?: unknown | null
          description_vector_ru?: unknown | null
          id?: string | null
          import_batch_id?: string | null
          import_folder_path?: string | null
          import_notes?: string | null
          in_stock?: boolean | null
          internal_code?: string | null
          length_mm?: number | null
          marketing_highlights?: string[] | null
          metadata_status?:
            | Database["public"]["Enums"]["metadata_status"]
            | null
          name?: Database["public"]["Enums"]["gemstone_type"] | null
          narrative_story_en?: string | null
          narrative_story_ru?: string | null
          origin_id?: string | null
          premium_price_amount?: number | null
          premium_price_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          price_amount?: number | null
          price_currency?: Database["public"]["Enums"]["currency_code"] | null
          price_per_carat?: number | null
          promotional_text?: string | null
          quantity?: number | null
          search_vector_en?: unknown | null
          search_vector_ru?: unknown | null
          serial_number?: string | null
          type_code?: string | null
          updated_at?: string | null
          weight_carats?: number | null
          weight_source?: never
          width_mm?: number | null
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
          order_number: string | null
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
          order_number: string | null
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
      detect_query_locale: {
        Args: { query: string }
        Returns: string
      }
      fuzzy_search_suggestions: {
        Args:
          | {
              search_locale?: string
              search_term: string
              suggestion_limit?: number
            }
          | { search_term: string; suggestion_limit?: number }
        Returns: {
          match_type: string
          similarity_score: number
          suggestion: string
        }[]
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_search_analytics_summary: {
        Args: { days_back?: number }
        Returns: {
          avg_results: number
          fuzzy_usage_count: number
          search_count: number
          search_query: string
          zero_result_count: number
        }[]
      }
      get_search_suggestions: {
        Args: { limit_count?: number; query: string; search_locale?: string }
        Returns: {
          category: string
          relevance: number
          suggestion: string
        }[]
      }
      get_search_trends: {
        Args: { bucket_size?: string; days_back?: number }
        Returns: {
          avg_results: number
          fuzzy_usage_count: number
          search_count: number
          time_bucket: string
          zero_result_count: number
        }[]
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
      search_gemstones_fulltext: {
        Args: {
          filters: Json
          page_num: number
          page_size: number
          search_query: string
        }
        Returns: {
          clarity: Database["public"]["Enums"]["gem_clarity"]
          color: Database["public"]["Enums"]["gem_color"]
          created_at: string
          cut: Database["public"]["Enums"]["gem_cut"]
          description: string
          has_ai_analysis: boolean
          has_certification: boolean
          id: string
          in_stock: boolean
          metadata_status: Database["public"]["Enums"]["metadata_status"]
          name: Database["public"]["Enums"]["gemstone_type"]
          origin_id: string
          price_amount: number
          price_currency: Database["public"]["Enums"]["currency_code"]
          relevance_score: number
          serial_number: string
          total_count: number
          updated_at: string
          weight_carats: number
        }[]
      }
      search_gemstones_multilingual: {
        Args:
          | {
              description_enabled?: boolean
              effective_locale?: string
              filters?: Json
              page_number?: number
              page_size?: number
              search_query: string
            }
          | {
              filters?: Json
              page_num?: number
              page_size?: number
              search_locale?: string
              search_query: string
            }
        Returns: {
          clarity: string
          clarity_code: string
          color: string
          color_code: string
          created_at: string
          cut: string
          cut_code: string
          description: string
          has_ai_analysis: boolean
          has_certification: boolean
          id: string
          in_stock: boolean
          metadata_status: string
          name: string
          origin_id: string
          price_amount: number
          price_currency: string
          relevance_score: number
          serial_number: string
          total_count: number
          type_code: string
          updated_at: string
          weight_carats: number
        }[]
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
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
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
