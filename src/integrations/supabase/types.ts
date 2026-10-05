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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_export_log: {
        Row: {
          created_at: string
          export_type: string
          filename: string | null
          id: string
          metadata: Json | null
          range_from: string | null
          range_to: string | null
          row_count: number | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          export_type: string
          filename?: string | null
          id?: string
          metadata?: Json | null
          range_from?: string | null
          range_to?: string | null
          row_count?: number | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          export_type?: string
          filename?: string | null
          id?: string
          metadata?: Json | null
          range_from?: string | null
          range_to?: string | null
          row_count?: number | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_google_tokens: {
        Row: {
          access_token: string
          created_at: string
          email: string | null
          expiry: string
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email?: string | null
          expiry: string
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string | null
          expiry?: string
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      advisor_assessments: {
        Row: {
          answers: Json
          chat_history: Json
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          recommendation: Json
          share_code: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          chat_history?: Json
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          recommendation?: Json
          share_code: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          chat_history?: Json
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          recommendation?: Json
          share_code?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      advisor_events: {
        Row: {
          assessment_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          product_slug: string | null
          referrer: string | null
          session_id: string | null
          step_index: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          product_slug?: string | null
          referrer?: string | null
          session_id?: string | null
          step_index?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          product_slug?: string | null
          referrer?: string | null
          session_id?: string | null
          step_index?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          link_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          link_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          link_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          currency: string
          id: string
          link_id: string
          order_amount: number
          payment_id: string
          product_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          created_at?: string
          currency?: string
          id?: string
          link_id: string
          order_amount: number
          payment_id: string
          product_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          currency?: string
          id?: string
          link_id?: string
          order_amount?: number
          payment_id?: string
          product_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          clicks: number
          code: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          affiliate_id: string
          clicks?: number
          code: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          affiliate_id?: string
          clicks?: number
          code?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string | null
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          discount_code_id: string | null
          id: string
          method: string | null
          notes: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          reference: string | null
          referrer_label: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_code_id?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          referrer_label?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_code_id?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          referrer_label?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_products: {
        Row: {
          commission_percent: number
          created_at: string
          id: string
          is_active: boolean
          product_id: string
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          commission_rate_override: number | null
          created_at: string
          id: string
          motivation: string | null
          payout_details: Json | null
          payout_method: string | null
          status: string
          total_earnings: number
          total_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate_override?: number | null
          created_at?: string
          id?: string
          motivation?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          status?: string
          total_earnings?: number
          total_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate_override?: number | null
          created_at?: string
          id?: string
          motivation?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          status?: string
          total_earnings?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_scores: {
        Row: {
          application_id: string
          created_at: string
          criterion: string
          id: string
          max_score: number
          notes: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          score: number
          session_id: string | null
          stage: string
          weight: number
        }
        Insert: {
          application_id: string
          created_at?: string
          criterion: string
          id?: string
          max_score?: number
          notes?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          score: number
          session_id?: string | null
          stage?: string
          weight?: number
        }
        Update: {
          application_id?: string
          created_at?: string
          criterion?: string
          id?: string
          max_score?: number
          notes?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          score?: number
          session_id?: string | null
          stage?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          approved: boolean | null
          author_email: string
          author_name: string
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string | null
        }
        Insert: {
          approved?: boolean | null
          author_email: string
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string | null
        }
        Update: {
          approved?: boolean | null
          author_email?: string
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "public_blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          updated_at: string
          view_count: number
          view_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          view_count?: number
          view_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          view_count?: number
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_image: string | null
          published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string | null
          views: number
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_image?: string | null
          published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string | null
          views?: number
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_image?: string | null
          published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_email_log: {
        Row: {
          audience_label: string | null
          batch_id: string | null
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sender_email: string | null
          sender_id: string | null
          sent_at: string | null
          status: string
          subject: string
          test_mode: boolean
        }
        Insert: {
          audience_label?: string | null
          batch_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sender_email?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          test_mode?: boolean
        }
        Update: {
          audience_label?: string | null
          batch_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sender_email?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          test_mode?: boolean
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          created_at: string | null
          description: string
          duration: string
          id: string
          image_url: string | null
          price: number | null
          rating: number | null
          students_count: number | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          duration: string
          id?: string
          image_url?: string | null
          price?: number | null
          rating?: number | null
          students_count?: number | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          duration?: string
          id?: string
          image_url?: string | null
          price?: number | null
          rating?: number | null
          students_count?: number | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          audience: string
          created_at: string
          experiments: Json
          full_name: string
          id: string
          interest: string | null
          message: string | null
          organisation: string
          phone: string | null
          preferred_date: string
          preferred_time: string
          role: string | null
          source: string | null
          status: string
          timezone: string | null
          updated_at: string
          work_email: string
        }
        Insert: {
          audience?: string
          created_at?: string
          experiments?: Json
          full_name: string
          id?: string
          interest?: string | null
          message?: string | null
          organisation: string
          phone?: string | null
          preferred_date: string
          preferred_time: string
          role?: string | null
          source?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
          work_email: string
        }
        Update: {
          audience?: string
          created_at?: string
          experiments?: Json
          full_name?: string
          id?: string
          interest?: string | null
          message?: string | null
          organisation?: string
          phone?: string | null
          preferred_date?: string
          preferred_time?: string
          role?: string | null
          source?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
          work_email?: string
        }
        Relationships: []
      }
      discount_code_applications: {
        Row: {
          audience_size: string | null
          channel: string | null
          created_at: string
          decline_reason: string | null
          discount_code_id: string | null
          email: string
          full_name: string
          id: string
          motivation: string | null
          phone: string | null
          requested_code: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_links: string | null
          status: string
          updated_at: string
        }
        Insert: {
          audience_size?: string | null
          channel?: string | null
          created_at?: string
          decline_reason?: string | null
          discount_code_id?: string | null
          email: string
          full_name: string
          id?: string
          motivation?: string | null
          phone?: string | null
          requested_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          audience_size?: string | null
          channel?: string | null
          created_at?: string
          decline_reason?: string | null
          discount_code_id?: string | null
          email?: string
          full_name?: string
          id?: string
          motivation?: string | null
          phone?: string | null
          requested_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_applications_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_clicks: {
        Row: {
          created_at: string
          discount_code_id: string
          id: string
          ip_hash: string | null
          landing_path: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          discount_code_id: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          discount_code_id?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_clicks_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_products: {
        Row: {
          created_at: string
          discount_code_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          discount_code_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          discount_code_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_products_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_redemptions: {
        Row: {
          charged_amount: number
          commission_amount: number
          commission_paid_at: string | null
          commission_percent: number
          commission_status: string
          commission_status_updated_at: string | null
          commission_status_updated_by: string | null
          created_at: string
          currency: string
          discount_amount: number
          discount_code_id: string
          id: string
          original_amount: number
          payer_email: string | null
          payment_id: string | null
          product_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          charged_amount?: number
          commission_amount?: number
          commission_paid_at?: string | null
          commission_percent?: number
          commission_status?: string
          commission_status_updated_at?: string | null
          commission_status_updated_by?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_code_id: string
          id?: string
          original_amount?: number
          payer_email?: string | null
          payment_id?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          charged_amount?: number
          commission_amount?: number
          commission_paid_at?: string | null
          commission_percent?: number
          commission_status?: string
          commission_status_updated_at?: string | null
          commission_status_updated_by?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_code_id?: string
          id?: string
          original_amount?: number
          payer_email?: string | null
          payment_id?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_redemptions_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_redemptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_redemptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_signups: {
        Row: {
          created_at: string
          discount_code_id: string
          email: string | null
          full_name: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_code_id: string
          email?: string | null
          full_name?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_code_id?: string
          email?: string | null
          full_name?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_signups_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to_all_products: boolean
          clicks: number
          code: string
          commission_percent: number
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_redemptions: number | null
          notes: string | null
          owner_email: string | null
          owner_name: string | null
          owner_user_id: string | null
          percent_off: number
          portal_activated_at: string | null
          portal_invited_at: string | null
          portal_reminded_at: string | null
          redemptions_count: number
          signups_count: number
          starts_at: string | null
          total_commission: number
          updated_at: string
        }
        Insert: {
          applies_to_all_products?: boolean
          clicks?: number
          code: string
          commission_percent?: number
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_redemptions?: number | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_user_id?: string | null
          percent_off: number
          portal_activated_at?: string | null
          portal_invited_at?: string | null
          portal_reminded_at?: string | null
          redemptions_count?: number
          signups_count?: number
          starts_at?: string | null
          total_commission?: number
          updated_at?: string
        }
        Update: {
          applies_to_all_products?: boolean
          clicks?: number
          code?: string
          commission_percent?: number
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_redemptions?: number | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_user_id?: string | null
          percent_off?: number
          portal_activated_at?: string | null
          portal_invited_at?: string | null
          portal_reminded_at?: string | null
          redemptions_count?: number
          signups_count?: number
          starts_at?: string | null
          total_commission?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_audiences: {
        Row: {
          archived: boolean
          course_id: string | null
          course_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          filter: Json
          id: string
          last_refreshed_at: string | null
          member_count: number
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          course_id?: string | null
          course_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter?: Json
          id?: string
          last_refreshed_at?: string | null
          member_count?: number
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          course_id?: string | null
          course_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter?: Json
          id?: string
          last_refreshed_at?: string | null
          member_count?: number
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_campaign_events: {
        Row: {
          campaign_id: string | null
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          recipient_email: string | null
          recipient_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          event_type: string
          id?: string
          occurred_at?: string
          payload?: Json
          recipient_email?: string | null
          recipient_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
          payload?: Json
          recipient_email?: string | null
          recipient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          bounce_type: string | null
          bounced_at: string | null
          campaign_id: string
          click_count: number
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          email: string
          email_lower: string | null
          error_message: string | null
          id: string
          name: string | null
          open_count: number
          opened_at: string | null
          resend_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bounce_type?: string | null
          bounced_at?: string | null
          campaign_id: string
          click_count?: number
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email: string
          email_lower?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          open_count?: number
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bounce_type?: string | null
          bounced_at?: string | null
          campaign_id?: string
          click_count?: number
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email?: string
          email_lower?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          open_count?: number
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_id: string | null
          body_html: string
          body_text: string | null
          bounced_count: number
          clicked_count: number
          complained_count: number
          created_at: string
          created_by: string | null
          delivered_count: number
          failed_count: number
          from_name: string | null
          id: string
          name: string
          opened_count: number
          preheader: string | null
          recipient_count: number
          reply_to: string | null
          scheduled_for: string | null
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
          tags: string[]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          audience_id?: string | null
          body_html: string
          body_text?: string | null
          bounced_count?: number
          clicked_count?: number
          complained_count?: number
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number
          from_name?: string | null
          id?: string
          name: string
          opened_count?: number
          preheader?: string | null
          recipient_count?: number
          reply_to?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          tags?: string[]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          audience_id?: string | null
          body_html?: string
          body_text?: string | null
          bounced_count?: number
          clicked_count?: number
          complained_count?: number
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number
          from_name?: string | null
          id?: string
          name?: string
          opened_count?: number
          preheader?: string | null
          recipient_count?: number
          reply_to?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          tags?: string[]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "email_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          archived: boolean
          body_html: string
          body_text: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          preheader: string | null
          subject: string
          updated_at: string
          variables: Json
        }
        Insert: {
          archived?: boolean
          body_html: string
          body_text?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          preheader?: string | null
          subject: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          archived?: boolean
          body_html?: string
          body_text?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          preheader?: string | null
          subject?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          activated_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          last_synced_at: string | null
          metadata: Json | null
          payment_id: string | null
          product_id: string | null
          progress_percent: number | null
          status: string
          thinkific_course_id: string | null
          thinkific_enrollment_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          payment_id?: string | null
          product_id?: string | null
          progress_percent?: number | null
          status?: string
          thinkific_course_id?: string | null
          thinkific_enrollment_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          payment_id?: string | null
          product_id?: string | null
          progress_percent?: number | null
          status?: string
          thinkific_course_id?: string | null
          thinkific_enrollment_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          integration_key: string
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          integration_key: string
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          integration_key?: string
          status?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          created_at: string
          id: string
          integration_key: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          integration_key: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          integration_key?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      interview_panel_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_external: boolean
          name: string
          panel_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_external?: boolean
          name: string
          panel_id: string
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_external?: boolean
          name?: string
          panel_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_panel_members_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "interview_panels"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_panels: {
        Row: {
          created_at: string
          id: string
          job_posting_id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_posting_id: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_posting_id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_panels_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_panels_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "public_job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          format: string | null
          id: string
          location_or_url: string | null
          panel_id: string | null
          recommendation: string | null
          scheduled_at: string | null
          stage: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          format?: string | null
          id?: string
          location_or_url?: string | null
          panel_id?: string | null
          recommendation?: string | null
          scheduled_at?: string | null
          stage?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          format?: string | null
          id?: string
          location_or_url?: string | null
          panel_id?: string | null
          recommendation?: string | null
          scheduled_at?: string | null
          stage?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "interview_panels"
            referencedColumns: ["id"]
          },
        ]
      }
      jd_templates: {
        Row: {
          body: Json
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          body: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          body?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          consent_data_retention: boolean
          cover_letter: string | null
          created_at: string
          diversity_self_id: Json | null
          email: string
          full_name: string
          id: string
          job_posting_id: string
          location: string | null
          phone: string | null
          portfolio_url: string | null
          rejection_reason: string | null
          resume_path: string | null
          retain_for_future: boolean
          source: string | null
          status: string
          status_notes: string | null
          submitted_at: string
          updated_at: string
          withdrawal_reason: string | null
        }
        Insert: {
          consent_data_retention?: boolean
          cover_letter?: string | null
          created_at?: string
          diversity_self_id?: Json | null
          email: string
          full_name: string
          id?: string
          job_posting_id: string
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rejection_reason?: string | null
          resume_path?: string | null
          retain_for_future?: boolean
          source?: string | null
          status?: string
          status_notes?: string | null
          submitted_at?: string
          updated_at?: string
          withdrawal_reason?: string | null
        }
        Update: {
          consent_data_retention?: boolean
          cover_letter?: string | null
          created_at?: string
          diversity_self_id?: Json | null
          email?: string
          full_name?: string
          id?: string
          job_posting_id?: string
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rejection_reason?: string | null
          resume_path?: string | null
          retain_for_future?: boolean
          source?: string | null
          status?: string
          status_notes?: string | null
          submitted_at?: string
          updated_at?: string
          withdrawal_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "public_job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_mode: string
          approved_at: string | null
          approved_by: string | null
          closes_at: string | null
          contract_duration_months: number | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          desirable_criteria: string | null
          employment_type: string
          encourage_diversity_statement: boolean
          essential_criteria: string | null
          external_apply_url: string | null
          featured_image_url: string | null
          id: string
          internal_only: boolean
          jd_pdf_name: string | null
          jd_pdf_path: string | null
          location: string | null
          posted_at: string | null
          reports_to: string | null
          responsibilities: string | null
          safeguarding_level: string
          salary_band: string | null
          salary_visible: boolean
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          application_mode?: string
          approved_at?: string | null
          approved_by?: string | null
          closes_at?: string | null
          contract_duration_months?: number | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          desirable_criteria?: string | null
          employment_type?: string
          encourage_diversity_statement?: boolean
          essential_criteria?: string | null
          external_apply_url?: string | null
          featured_image_url?: string | null
          id?: string
          internal_only?: boolean
          jd_pdf_name?: string | null
          jd_pdf_path?: string | null
          location?: string | null
          posted_at?: string | null
          reports_to?: string | null
          responsibilities?: string | null
          safeguarding_level?: string
          salary_band?: string | null
          salary_visible?: boolean
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          application_mode?: string
          approved_at?: string | null
          approved_by?: string | null
          closes_at?: string | null
          contract_duration_months?: number | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          desirable_criteria?: string | null
          employment_type?: string
          encourage_diversity_statement?: boolean
          essential_criteria?: string | null
          external_apply_url?: string | null
          featured_image_url?: string | null
          id?: string
          internal_only?: boolean
          jd_pdf_name?: string | null
          jd_pdf_path?: string | null
          location?: string | null
          posted_at?: string | null
          reports_to?: string | null
          responsibilities?: string | null
          safeguarding_level?: string
          salary_band?: string | null
          salary_visible?: boolean
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      learning_pathways: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_features: {
        Row: {
          article_url: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_active: boolean
          outlet_logo_url: string | null
          outlet_name: string | null
          published_at: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          article_url: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          outlet_logo_url?: string | null
          outlet_name?: string | null
          published_at?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          article_url?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          outlet_logo_url?: string | null
          outlet_name?: string | null
          published_at?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_call_requests: {
        Row: {
          admin_notes: string | null
          assessment_id: string | null
          calendar_event_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          meet_link: string | null
          notes: string | null
          phone: string | null
          preferred_date: string
          preferred_time: string
          scheduled_at: string | null
          scheduled_by: string | null
          status: string
          timezone: string
          topic: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assessment_id?: string | null
          calendar_event_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          meet_link?: string | null
          notes?: string | null
          phone?: string | null
          preferred_date: string
          preferred_time: string
          scheduled_at?: string | null
          scheduled_by?: string | null
          status?: string
          timezone?: string
          topic?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assessment_id?: string | null
          calendar_event_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          meet_link?: string | null
          notes?: string | null
          phone?: string | null
          preferred_date?: string
          preferred_time?: string
          scheduled_at?: string | null
          scheduled_by?: string | null
          status?: string
          timezone?: string
          topic?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_call_requests_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "advisor_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_letters: {
        Row: {
          accepted_at: string | null
          application_id: string
          benefits: string | null
          conditions: string | null
          content: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          declined_reason: string | null
          expires_at: string | null
          id: string
          job_title: string
          probation_months: number
          reports_to: string | null
          salary: string | null
          sent_at: string | null
          signed_file_path: string | null
          start_date: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          benefits?: string | null
          conditions?: string | null
          content?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          declined_reason?: string | null
          expires_at?: string | null
          id?: string
          job_title: string
          probation_months?: number
          reports_to?: string | null
          salary?: string | null
          sent_at?: string | null
          signed_file_path?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          benefits?: string | null
          conditions?: string | null
          content?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          declined_reason?: string | null
          expires_at?: string | null
          id?: string
          job_title?: string
          probation_months?: number
          reports_to?: string | null
          salary?: string | null
          sent_at?: string | null
          signed_file_path?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_letters_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_group_members: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invite_count: number
          last_invited_at: string | null
          source: string
          thinkific_group_id: number | null
          thinkific_group_name: string
          thinkific_user_id: number | null
          user_id: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invite_count?: number
          last_invited_at?: string | null
          source?: string
          thinkific_group_id?: number | null
          thinkific_group_name: string
          thinkific_user_id?: number | null
          user_id?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invite_count?: number
          last_invited_at?: string | null
          source?: string
          thinkific_group_id?: number | null
          thinkific_group_name?: string
          thinkific_user_id?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      partner_groups: {
        Row: {
          active: boolean
          contact_email: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_name: string
          partner_user_id: string
          thinkific_group_id: number | null
          thinkific_group_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_name: string
          partner_user_id: string
          thinkific_group_id?: number | null
          thinkific_group_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_name?: string
          partner_user_id?: string
          thinkific_group_id?: number | null
          thinkific_group_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          full_name: string | null
          id: string
          logo_url: string | null
          organisation_name: string | null
          role_title: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          logo_url?: string | null
          organisation_name?: string | null
          role_title?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          logo_url?: string | null
          organisation_name?: string | null
          role_title?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      pathway_products: {
        Row: {
          created_at: string
          id: string
          pathway_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          pathway_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          pathway_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pathway_products_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "learning_pathways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_documents: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          doc_number: string
          doc_type: string
          email_attempts: number
          email_error: string | null
          email_message_id: string | null
          email_status: string
          email_to: string | null
          emailed_at: string | null
          generation_attempts: number
          id: string
          issued_at: string
          last_attempt_at: string | null
          last_error: string | null
          payment_id: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          doc_number: string
          doc_type: string
          email_attempts?: number
          email_error?: string | null
          email_message_id?: string | null
          email_status?: string
          email_to?: string | null
          emailed_at?: string | null
          generation_attempts?: number
          id?: string
          issued_at?: string
          last_attempt_at?: string | null
          last_error?: string | null
          payment_id: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          doc_number?: string
          doc_type?: string
          email_attempts?: number
          email_error?: string | null
          email_message_id?: string | null
          email_status?: string
          email_to?: string | null
          emailed_at?: string | null
          generation_attempts?: number
          id?: string
          issued_at?: string
          last_attempt_at?: string | null
          last_error?: string | null
          payment_id?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_documents_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string
          external_id: string | null
          id: string
          metadata: Json | null
          payer_email: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_method: string
          product_id: string | null
          provider_reference: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_method: string
          product_id?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_method?: string
          product_id?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          amount: number | null
          created_at: string
          currency: string | null
          field: string | null
          id: string
          new_value: string | null
          old_value: string | null
          payout_id: string | null
          referrer_label: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          amount?: number | null
          created_at?: string
          currency?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          payout_id?: string | null
          referrer_label?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          amount?: number | null
          created_at?: string
          currency?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          payout_id?: string | null
          referrer_label?: string | null
        }
        Relationships: []
      }
      popup_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          popup_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          popup_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          popup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_analytics_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "popups"
            referencedColumns: ["id"]
          },
        ]
      }
      popups: {
        Row: {
          banner_color: string | null
          body_text: string | null
          button_link: string | null
          button_text: string | null
          created_at: string
          display_delay_seconds: number | null
          end_date: string | null
          heading: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          popup_type: string
          show_once_per_session: boolean | null
          start_date: string | null
          tally_form_id: string | null
          target_pages: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_color?: string | null
          body_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          display_delay_seconds?: number | null
          end_date?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          popup_type?: string
          show_once_per_session?: boolean | null
          start_date?: string | null
          tally_form_id?: string | null
          target_pages?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_color?: string | null
          body_text?: string | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          display_delay_seconds?: number | null
          end_date?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          popup_type?: string
          show_once_per_session?: boolean | null
          start_date?: string | null
          tally_form_id?: string | null
          target_pages?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          price_ugx: number
          price_usd: number
          program_type: string | null
          slug: string
          start_date: string | null
          stripe_price_id: string | null
          thinkific_course_id: string | null
          thinkific_course_url: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_ugx: number
          price_usd: number
          program_type?: string | null
          slug: string
          start_date?: string | null
          stripe_price_id?: string | null
          thinkific_course_id?: string | null
          thinkific_course_url?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_ugx?: number
          price_usd?: number
          program_type?: string | null
          slug?: string
          start_date?: string | null
          stripe_price_id?: string | null
          thinkific_course_id?: string | null
          thinkific_course_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_field_definitions: {
        Row: {
          created_at: string
          help_text: string | null
          id: string
          input_type: string
          key: string
          label: string
          options: Json | null
          placeholder: string | null
          required: boolean
          section: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          help_text?: string | null
          id?: string
          input_type: string
          key: string
          label: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean
          section: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          help_text?: string | null
          id?: string
          input_type?: string
          key?: string
          label?: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean
          section?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          bio: string | null
          career_interests: string[] | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          current_skill_level: string | null
          cv_url: string | null
          desired_career_path: string | null
          disability_status: string | null
          district: string | null
          email: string
          employer: string | null
          employment_status: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          github_url: string | null
          highest_education: string | null
          id: string
          interests: string[] | null
          job_title: string | null
          last_name: string | null
          learner_goals: string[]
          learning_goals: string[] | null
          linkedin_url: string | null
          location: string | null
          marketing_consent: boolean | null
          notification_preferences: Json | null
          occupation: string | null
          onboarding_responses: Json
          organization: string | null
          phone: string | null
          preferred_language: string | null
          preferred_name: string | null
          preferred_schedule: string | null
          privacy_settings: Json | null
          profile_completed_at: string | null
          promo_code: string | null
          referral_source: string | null
          refugee_status: string | null
          scholarship_program: string | null
          skills: string[] | null
          thinkific_synced_at: string | null
          thinkific_user_id: number | null
          twitter_url: string | null
          updated_at: string
          website: string | null
          years_experience: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          career_interests?: string[] | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          current_skill_level?: string | null
          cv_url?: string | null
          desired_career_path?: string | null
          disability_status?: string | null
          district?: string | null
          email: string
          employer?: string | null
          employment_status?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          github_url?: string | null
          highest_education?: string | null
          id: string
          interests?: string[] | null
          job_title?: string | null
          last_name?: string | null
          learner_goals?: string[]
          learning_goals?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          marketing_consent?: boolean | null
          notification_preferences?: Json | null
          occupation?: string | null
          onboarding_responses?: Json
          organization?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_name?: string | null
          preferred_schedule?: string | null
          privacy_settings?: Json | null
          profile_completed_at?: string | null
          promo_code?: string | null
          referral_source?: string | null
          refugee_status?: string | null
          scholarship_program?: string | null
          skills?: string[] | null
          thinkific_synced_at?: string | null
          thinkific_user_id?: number | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
          years_experience?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          career_interests?: string[] | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          current_skill_level?: string | null
          cv_url?: string | null
          desired_career_path?: string | null
          disability_status?: string | null
          district?: string | null
          email?: string
          employer?: string | null
          employment_status?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          github_url?: string | null
          highest_education?: string | null
          id?: string
          interests?: string[] | null
          job_title?: string | null
          last_name?: string | null
          learner_goals?: string[]
          learning_goals?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          marketing_consent?: boolean | null
          notification_preferences?: Json | null
          occupation?: string | null
          onboarding_responses?: Json
          organization?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_name?: string | null
          preferred_schedule?: string | null
          privacy_settings?: Json | null
          profile_completed_at?: string | null
          promo_code?: string | null
          referral_source?: string | null
          refugee_status?: string | null
          scholarship_program?: string | null
          skills?: string[] | null
          thinkific_synced_at?: string | null
          thinkific_user_id?: number | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
          years_experience?: string | null
        }
        Relationships: []
      }
      recruitment_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          payload: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          payload?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      recruitment_requests: {
        Row: {
          approver_role: string
          budget_line: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          department: string | null
          funding_source: string | null
          id: string
          is_replacement: boolean
          job_posting_id: string | null
          justification: string
          proposed_grade: string | null
          proposed_salary_band: string | null
          reports_to: string | null
          requested_by: string | null
          required_start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approver_role?: string
          budget_line?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          department?: string | null
          funding_source?: string | null
          id?: string
          is_replacement?: boolean
          job_posting_id?: string | null
          justification: string
          proposed_grade?: string | null
          proposed_salary_band?: string | null
          reports_to?: string | null
          requested_by?: string | null
          required_start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approver_role?: string
          budget_line?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          department?: string | null
          funding_source?: string | null
          id?: string
          is_replacement?: boolean
          job_posting_id?: string | null
          justification?: string
          proposed_grade?: string | null
          proposed_salary_band?: string | null
          reports_to?: string | null
          requested_by?: string | null
          required_start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_requests_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_requests_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "public_job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_checks: {
        Row: {
          application_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          evidence_path: string | null
          id: string
          notes: string | null
          referee_email: string | null
          referee_name: string | null
          referee_phone: string | null
          referee_role: string | null
          requested_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          evidence_path?: string | null
          id?: string
          notes?: string | null
          referee_email?: string | null
          referee_name?: string | null
          referee_phone?: string | null
          referee_role?: string | null
          requested_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          evidence_path?: string | null
          id?: string
          notes?: string | null
          referee_email?: string | null
          referee_name?: string | null
          referee_phone?: string | null
          referee_role?: string | null
          requested_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_checks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      request_throttle: {
        Row: {
          created_at: string
          id: string
          identifier: string
          request_count: number
          scope: string
          updated_at: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          request_count?: number
          scope: string
          updated_at?: string
          window_start: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          request_count?: number
          scope?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      saved_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_templates: {
        Row: {
          created_at: string
          created_by: string | null
          criteria: Json
          id: string
          name: string
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          criteria: Json
          id?: string
          name: string
          stage?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          criteria?: Json
          id?: string
          name?: string
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tally_submissions: {
        Row: {
          created_at: string
          fields: Json
          form_id: string
          form_name: string | null
          id: string
          raw_payload: Json | null
          submitted_at: string
          tally_submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          form_id: string
          form_name?: string | null
          id?: string
          raw_payload?: Json | null
          submitted_at: string
          tally_submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fields?: Json
          form_id?: string
          form_name?: string | null
          id?: string
          raw_payload?: Json | null
          submitted_at?: string
          tally_submission_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      thinkific_sync_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          kind: string
          last_error: string | null
          max_attempts: number
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          related_enrollment_id: string | null
          related_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          kind: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          payload: Json
          processed_at?: string | null
          related_enrollment_id?: string | null
          related_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          related_enrollment_id?: string | null
          related_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thinkific_sync_queue_related_enrollment_id_fkey"
            columns: ["related_enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thinkific_sync_queue_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_blog_comments: {
        Row: {
          approved: boolean | null
          author_name: string | null
          content: string | null
          created_at: string | null
          id: string | null
          parent_id: string | null
          post_id: string | null
        }
        Insert: {
          approved?: boolean | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          parent_id?: string | null
          post_id?: string | null
        }
        Update: {
          approved?: boolean | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          parent_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "public_blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      public_job_postings: {
        Row: {
          application_mode: string | null
          closes_at: string | null
          contract_duration_months: number | null
          created_at: string | null
          department: string | null
          description: string | null
          desirable_criteria: string | null
          employment_type: string | null
          encourage_diversity_statement: boolean | null
          essential_criteria: string | null
          external_apply_url: string | null
          featured_image_url: string | null
          id: string | null
          internal_only: boolean | null
          jd_pdf_name: string | null
          jd_pdf_path: string | null
          location: string | null
          posted_at: string | null
          reports_to: string | null
          responsibilities: string | null
          safeguarding_level: string | null
          salary_band: string | null
          salary_visible: boolean | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          application_mode?: string | null
          closes_at?: string | null
          contract_duration_months?: number | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          desirable_criteria?: string | null
          employment_type?: string | null
          encourage_diversity_statement?: boolean | null
          essential_criteria?: string | null
          external_apply_url?: string | null
          featured_image_url?: string | null
          id?: string | null
          internal_only?: boolean | null
          jd_pdf_name?: string | null
          jd_pdf_path?: string | null
          location?: string | null
          posted_at?: string | null
          reports_to?: string | null
          responsibilities?: string | null
          safeguarding_level?: string | null
          salary_band?: never
          salary_visible?: boolean | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          application_mode?: string | null
          closes_at?: string | null
          contract_duration_months?: number | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          desirable_criteria?: string | null
          employment_type?: string | null
          encourage_diversity_statement?: boolean | null
          essential_criteria?: string | null
          external_apply_url?: string | null
          featured_image_url?: string | null
          id?: string | null
          internal_only?: boolean | null
          jd_pdf_name?: string | null
          jd_pdf_path?: string | null
          location?: string | null
          posted_at?: string | null
          reports_to?: string | null
          responsibilities?: string | null
          safeguarding_level?: string | null
          salary_band?: never
          salary_visible?: boolean | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_blog: { Args: never; Returns: boolean }
      can_manage_discounts: { Args: never; Returns: boolean }
      can_manage_hiring: { Args: never; Returns: boolean }
      can_manage_payouts: { Args: never; Returns: boolean }
      check_if_admin: { Args: { check_user_id: string }; Returns: boolean }
      claim_my_partner_codes: { Args: never; Returns: number }
      consume_rate_limit: {
        Args: {
          _identifier: string
          _max_requests: number
          _scope: string
          _window_seconds: number
        }
        Returns: {
          allowed: boolean
          current_count: number
          retry_after_seconds: number
        }[]
      }
      current_user_email: { Args: never; Returns: string }
      get_assessment_by_share_code: {
        Args: { _code: string }
        Returns: {
          answers: Json
          email: string
          full_name: string
          id: string
          recommendation: Json
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hr_job_postings: {
        Args: never
        Returns: {
          application_mode: string
          approved_at: string | null
          approved_by: string | null
          closes_at: string | null
          contract_duration_months: number | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          desirable_criteria: string | null
          employment_type: string
          encourage_diversity_statement: boolean
          essential_criteria: string | null
          external_apply_url: string | null
          featured_image_url: string | null
          id: string
          internal_only: boolean
          jd_pdf_name: string | null
          jd_pdf_path: string | null
          location: string | null
          posted_at: string | null
          reports_to: string | null
          responsibilities: string | null
          safeguarding_level: string
          salary_band: string | null
          salary_visible: boolean
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          views: number
        }[]
        SetofOptions: {
          from: "*"
          to: "job_postings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      increment_affiliate_clicks: {
        Args: { link_id_param: string }
        Returns: undefined
      }
      increment_affiliate_earnings: {
        Args: { affiliate_id_param: string; amount_param: number }
        Returns: undefined
      }
      increment_daily_post_views: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_post_views: { Args: { post_slug: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      job_posting_public_salary_band: {
        Args: { _posting_id: string }
        Returns: string
      }
      my_referral_redemptions: {
        Args: never
        Returns: {
          commission_amount: number
          commission_paid_at: string
          commission_status: string
          created_at: string
          currency: string
          discount_code_id: string
          id: string
          payer_email_masked: string
          product_name: string
          user_id: string
        }[]
      }
      partner_group_learners: {
        Args: { _group_name: string }
        Returns: {
          avg_progress: number
          courses_completed: number
          courses_enrolled: number
          email: string
          full_name: string
          joined_at: string
          last_activity: string
          user_id: string
        }[]
      }
      partner_group_roster: {
        Args: { _group_name: string }
        Returns: {
          account_confirmed: boolean
          avg_progress: number
          courses_completed: number
          courses_enrolled: number
          email: string
          full_name: string
          has_account: boolean
          invite_count: number
          joined_at: string
          last_activity: string
          last_invited_at: string
          thinkific_user_id: number
          user_id: string
        }[]
      }
      partner_owns_group: { Args: { _group_name: string }; Returns: boolean }
      resolve_discount_code: {
        Args: { _code: string; _product_slug?: string }
        Returns: {
          applies_to_product: boolean
          code: string
          label: string
          percent_off: number
          reason: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "blog_admin"
        | "user"
        | "hr_admin"
        | "engagement_admin"
        | "products_admin"
        | "popups_admin"
        | "advisor_admin"
        | "affiliate_admin"
        | "payments_admin"
        | "learner_admin"
        | "discount_admin"
        | "partner_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "blog_admin",
        "user",
        "hr_admin",
        "engagement_admin",
        "products_admin",
        "popups_admin",
        "advisor_admin",
        "affiliate_admin",
        "payments_admin",
        "learner_admin",
        "discount_admin",
        "partner_admin",
      ],
    },
  },
} as const
