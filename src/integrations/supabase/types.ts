export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      admin_settings: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          value: Json;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      artists: {
        Row: {
          apple_music_url: string | null;
          bio: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          followers_count: number | null;
          genres: string[] | null;
          id: string;
          image_url: string | null;
          monthly_listeners: number | null;
          social_links: Json | null;
          spotify_url: string | null;
          stage_name: string;
          updated_at: string | null;
          user_id: string | null;
          verified: boolean | null;
          website_url: string | null;
          youtube_url: string | null;
        };
        Insert: {
          apple_music_url?: string | null;
          bio?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          followers_count?: number | null;
          genres?: string[] | null;
          id?: string;
          image_url?: string | null;
          monthly_listeners?: number | null;
          social_links?: Json | null;
          spotify_url?: string | null;
          stage_name: string;
          updated_at?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
          website_url?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          apple_music_url?: string | null;
          bio?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          followers_count?: number | null;
          genres?: string[] | null;
          id?: string;
          image_url?: string | null;
          monthly_listeners?: number | null;
          social_links?: Json | null;
          spotify_url?: string | null;
          stage_name?: string;
          updated_at?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
          website_url?: string | null;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          author_id: string | null;
          author_name: string;
          category: string;
          content: string | null;
          created_at: string | null;
          excerpt: string | null;
          featured: boolean | null;
          id: string;
          image_url: string | null;
          published_date: string | null;
          read_time: string | null;
          slug: string | null;
          status: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          author_id?: string | null;
          author_name: string;
          category: string;
          content?: string | null;
          created_at?: string | null;
          excerpt?: string | null;
          featured?: boolean | null;
          id?: string;
          image_url?: string | null;
          published_date?: string | null;
          read_time?: string | null;
          slug?: string | null;
          status?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string | null;
          author_name?: string;
          category?: string;
          content?: string | null;
          created_at?: string | null;
          excerpt?: string | null;
          featured?: boolean | null;
          id?: string;
          image_url?: string | null;
          published_date?: string | null;
          read_time?: string | null;
          slug?: string | null;
          status?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          icon_url: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          product_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          product_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          name?: string;
          parent_id?: string | null;
          product_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      caterers: {
        Row: {
          address: string | null;
          cover_image: string | null;
          created_at: string | null;
          cuisine_types: string[] | null;
          description: string | null;
          email: string | null;
          featured: boolean | null;
          id: string;
          images: string[] | null;
          is_available: boolean | null;
          location_id: string | null;
          max_guest_capacity: number | null;
          metadata: Json | null;
          minimum_order: number | null;
          name: string;
          owner_id: string | null;
          phone: string | null;
          price_range: string | null;
          rating: number | null;
          review_count: number | null;
          service_types: string[] | null;
          special_diets: string[] | null;
          specialties: string[] | null;
          status: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          cover_image?: string | null;
          created_at?: string | null;
          cuisine_types?: string[] | null;
          description?: string | null;
          email?: string | null;
          featured?: boolean | null;
          id?: string;
          images?: string[] | null;
          is_available?: boolean | null;
          location_id?: string | null;
          max_guest_capacity?: number | null;
          metadata?: Json | null;
          minimum_order?: number | null;
          name: string;
          owner_id?: string | null;
          phone?: string | null;
          price_range?: string | null;
          rating?: number | null;
          review_count?: number | null;
          service_types?: string[] | null;
          special_diets?: string[] | null;
          specialties?: string[] | null;
          status?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          cover_image?: string | null;
          created_at?: string | null;
          cuisine_types?: string[] | null;
          description?: string | null;
          email?: string | null;
          featured?: boolean | null;
          id?: string;
          images?: string[] | null;
          is_available?: boolean | null;
          location_id?: string | null;
          max_guest_capacity?: number | null;
          metadata?: Json | null;
          minimum_order?: number | null;
          name?: string;
          owner_id?: string | null;
          phone?: string | null;
          price_range?: string | null;
          rating?: number | null;
          review_count?: number | null;
          service_types?: string[] | null;
          special_diets?: string[] | null;
          specialties?: string[] | null;
          status?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'caterers_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'caterers_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      communities: {
        Row: {
          auto_create_events: boolean | null;
          category: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          creator_id: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean | null;
          member_count: number | null;
          monthly_price_cents: number | null;
          name: string;
          next_event_date: string | null;
          rules: string[] | null;
          subscription_benefits: Json | null;
          subscription_enabled: boolean | null;
          tags: string[] | null;
          updated_at: string | null;
          yearly_price_cents: number | null;
        };
        Insert: {
          auto_create_events?: boolean | null;
          category?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          creator_id?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_private?: boolean | null;
          member_count?: number | null;
          monthly_price_cents?: number | null;
          name: string;
          next_event_date?: string | null;
          rules?: string[] | null;
          subscription_benefits?: Json | null;
          subscription_enabled?: boolean | null;
          tags?: string[] | null;
          updated_at?: string | null;
          yearly_price_cents?: number | null;
        };
        Update: {
          auto_create_events?: boolean | null;
          category?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          creator_id?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_private?: boolean | null;
          member_count?: number | null;
          monthly_price_cents?: number | null;
          name?: string;
          next_event_date?: string | null;
          rules?: string[] | null;
          subscription_benefits?: Json | null;
          subscription_enabled?: boolean | null;
          tags?: string[] | null;
          updated_at?: string | null;
          yearly_price_cents?: number | null;
        };
        Relationships: [];
      };
      community_events: {
        Row: {
          community_id: string;
          created_at: string | null;
          created_by: string;
          current_attendees: number | null;
          description: string | null;
          duration_minutes: number | null;
          event_date: string;
          id: string;
          is_subscribers_only: boolean | null;
          is_virtual: boolean | null;
          location: string | null;
          max_attendees: number | null;
          meeting_url: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          community_id: string;
          created_at?: string | null;
          created_by: string;
          current_attendees?: number | null;
          description?: string | null;
          duration_minutes?: number | null;
          event_date: string;
          id?: string;
          is_subscribers_only?: boolean | null;
          is_virtual?: boolean | null;
          location?: string | null;
          max_attendees?: number | null;
          meeting_url?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          community_id?: string;
          created_at?: string | null;
          created_by?: string;
          current_attendees?: number | null;
          description?: string | null;
          duration_minutes?: number | null;
          event_date?: string;
          id?: string;
          is_subscribers_only?: boolean | null;
          is_virtual?: boolean | null;
          location?: string | null;
          max_attendees?: number | null;
          meeting_url?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'community_events_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      community_media: {
        Row: {
          community_id: string;
          created_at: string | null;
          description: string | null;
          file_name: string;
          file_size: number | null;
          file_type: string;
          file_url: string;
          id: string;
          mime_type: string | null;
          user_id: string;
        };
        Insert: {
          community_id: string;
          created_at?: string | null;
          description?: string | null;
          file_name: string;
          file_size?: number | null;
          file_type: string;
          file_url: string;
          id?: string;
          mime_type?: string | null;
          user_id: string;
        };
        Update: {
          community_id?: string;
          created_at?: string | null;
          description?: string | null;
          file_name?: string;
          file_size?: number | null;
          file_type?: string;
          file_url?: string;
          id?: string;
          mime_type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_media_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      community_members: {
        Row: {
          community_id: string | null;
          id: string;
          joined_at: string | null;
          role: string;
          user_id: string | null;
        };
        Insert: {
          community_id?: string | null;
          id?: string;
          joined_at?: string | null;
          role?: string;
          user_id?: string | null;
        };
        Update: {
          community_id?: string | null;
          id?: string;
          joined_at?: string | null;
          role?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'community_members_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      community_posts: {
        Row: {
          attachment_urls: string[] | null;
          comments_count: number | null;
          community_id: string;
          content: string;
          created_at: string | null;
          id: string;
          image_url: string | null;
          is_pinned: boolean | null;
          likes_count: number | null;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          attachment_urls?: string[] | null;
          comments_count?: number | null;
          community_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_pinned?: boolean | null;
          likes_count?: number | null;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          attachment_urls?: string[] | null;
          comments_count?: number | null;
          community_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_pinned?: boolean | null;
          likes_count?: number | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_posts_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      community_subscription_referral_transactions: {
        Row: {
          commission_amount: number;
          commission_status: string | null;
          created_at: string | null;
          id: string;
          payout_id: string | null;
          referral_id: string;
          referred_user_id: string;
          subscription_id: string;
          updated_at: string | null;
        };
        Insert: {
          commission_amount: number;
          commission_status?: string | null;
          created_at?: string | null;
          id?: string;
          payout_id?: string | null;
          referral_id: string;
          referred_user_id: string;
          subscription_id: string;
          updated_at?: string | null;
        };
        Update: {
          commission_amount?: number;
          commission_status?: string | null;
          created_at?: string | null;
          id?: string;
          payout_id?: string | null;
          referral_id?: string;
          referred_user_id?: string;
          subscription_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'community_subscription_referral_transactions_referral_id_fkey';
            columns: ['referral_id'];
            isOneToOne: false;
            referencedRelation: 'community_subscription_referrals';
            referencedColumns: ['id'];
          },
        ];
      };
      community_subscription_referrals: {
        Row: {
          clicks: number | null;
          community_id: string;
          conversions: number | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          referral_code: string;
          referrer_user_id: string;
          total_commission_earned: number | null;
          updated_at: string | null;
        };
        Insert: {
          clicks?: number | null;
          community_id: string;
          conversions?: number | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          referral_code: string;
          referrer_user_id: string;
          total_commission_earned?: number | null;
          updated_at?: string | null;
        };
        Update: {
          clicks?: number | null;
          community_id?: string;
          conversions?: number | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          referral_code?: string;
          referrer_user_id?: string;
          total_commission_earned?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'community_subscription_referrals_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      community_subscriptions: {
        Row: {
          amount_cents: number;
          cancelled_at: string | null;
          community_id: string;
          created_at: string | null;
          currency: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          status: string;
          stripe_subscription_id: string | null;
          subscription_type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount_cents: number;
          cancelled_at?: string | null;
          community_id: string;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          status?: string;
          stripe_subscription_id?: string | null;
          subscription_type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount_cents?: number;
          cancelled_at?: string | null;
          community_id?: string;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          status?: string;
          stripe_subscription_id?: string | null;
          subscription_type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_subscriptions_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_submissions: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          message: string;
          name: string;
          priority: string | null;
          responded_at: string | null;
          response_message: string | null;
          status: string | null;
          subject: string;
          type: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          message: string;
          name: string;
          priority?: string | null;
          responded_at?: string | null;
          response_message?: string | null;
          status?: string | null;
          subject: string;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          priority?: string | null;
          responded_at?: string | null;
          response_message?: string | null;
          status?: string | null;
          subject?: string;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_submissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string | null;
          id: string;
          last_message: Json | null;
          members: Json | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_message?: Json | null;
          members?: Json | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_message?: Json | null;
          members?: Json | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      creator_program: {
        Row: {
          analytics_access_enabled: boolean | null;
          application_date: string | null;
          approval_date: string | null;
          created_at: string | null;
          custom_branding_enabled: boolean | null;
          early_access_enabled: boolean | null;
          followers_count: number | null;
          id: string;
          monetization_enabled: boolean | null;
          priority_support_enabled: boolean | null;
          rejection_reason: string | null;
          revenue_share_percentage: number | null;
          status: string;
          successful_events_count: number | null;
          total_event_attendees: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          analytics_access_enabled?: boolean | null;
          application_date?: string | null;
          approval_date?: string | null;
          created_at?: string | null;
          custom_branding_enabled?: boolean | null;
          early_access_enabled?: boolean | null;
          followers_count?: number | null;
          id?: string;
          monetization_enabled?: boolean | null;
          priority_support_enabled?: boolean | null;
          rejection_reason?: string | null;
          revenue_share_percentage?: number | null;
          status?: string;
          successful_events_count?: number | null;
          total_event_attendees?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          analytics_access_enabled?: boolean | null;
          application_date?: string | null;
          approval_date?: string | null;
          created_at?: string | null;
          custom_branding_enabled?: boolean | null;
          early_access_enabled?: boolean | null;
          followers_count?: number | null;
          id?: string;
          monetization_enabled?: boolean | null;
          priority_support_enabled?: boolean | null;
          rejection_reason?: string | null;
          revenue_share_percentage?: number | null;
          status?: string;
          successful_events_count?: number | null;
          total_event_attendees?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      creator_program_benefits: {
        Row: {
          benefit_name: string;
          benefit_type: string;
          created_at: string | null;
          creator_id: string;
          id: string;
          last_used_at: string | null;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          benefit_name: string;
          benefit_type: string;
          created_at?: string | null;
          creator_id: string;
          id?: string;
          last_used_at?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          benefit_name?: string;
          benefit_type?: string;
          created_at?: string | null;
          creator_id?: string;
          id?: string;
          last_used_at?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'creator_program_benefits_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_program';
            referencedColumns: ['user_id'];
          },
        ];
      };
      creator_program_earnings: {
        Row: {
          created_at: string | null;
          creator_earnings: number;
          creator_id: string;
          event_id: string | null;
          gross_amount: number;
          id: string;
          payout_date: string | null;
          payout_status: string | null;
          platform_fee: number;
          source_type: string;
        };
        Insert: {
          created_at?: string | null;
          creator_earnings: number;
          creator_id: string;
          event_id?: string | null;
          gross_amount: number;
          id?: string;
          payout_date?: string | null;
          payout_status?: string | null;
          platform_fee: number;
          source_type: string;
        };
        Update: {
          created_at?: string | null;
          creator_earnings?: number;
          creator_id?: string;
          event_id?: string | null;
          gross_amount?: number;
          id?: string;
          payout_date?: string | null;
          payout_status?: string | null;
          platform_fee?: number;
          source_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'creator_program_earnings_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_program';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'creator_program_earnings_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      credit_transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          description: string | null;
          id: string;
          reference_id: string | null;
          status: string | null;
          transaction_type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          reference_id?: string | null;
          status?: string | null;
          transaction_type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          reference_id?: string | null;
          status?: string | null;
          transaction_type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'credit_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      event_attendees: {
        Row: {
          cancelled_at: string | null;
          confirmed_at: string | null;
          event_id: string | null;
          expires_at: string | null;
          id: string;
          metadata: Json | null;
          payment_amount: number | null;
          payment_intent_id: string | null;
          payment_status: string | null;
          quantity: number | null;
          reserved_at: string | null;
          reserved_at_old: string | null;
          status: string | null;
          total_amount: number | null;
          user_id: string | null;
        };
        Insert: {
          cancelled_at?: string | null;
          confirmed_at?: string | null;
          event_id?: string | null;
          expires_at?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_amount?: number | null;
          payment_intent_id?: string | null;
          payment_status?: string | null;
          quantity?: number | null;
          reserved_at?: string | null;
          reserved_at_old?: string | null;
          status?: string | null;
          total_amount?: number | null;
          user_id?: string | null;
        };
        Update: {
          cancelled_at?: string | null;
          confirmed_at?: string | null;
          event_id?: string | null;
          expires_at?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_amount?: number | null;
          payment_intent_id?: string | null;
          payment_status?: string | null;
          quantity?: number | null;
          reserved_at?: string | null;
          reserved_at_old?: string | null;
          status?: string | null;
          total_amount?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'event_attendees_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      event_comments: {
        Row: {
          attachments: Json | null;
          content: string;
          created_at: string | null;
          event_id: string;
          id: string;
          is_edited: boolean | null;
          is_pinned: boolean | null;
          parent_comment_id: string | null;
          reactions: Json | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          attachments?: Json | null;
          content: string;
          created_at?: string | null;
          event_id: string;
          id?: string;
          is_edited?: boolean | null;
          is_pinned?: boolean | null;
          parent_comment_id?: string | null;
          reactions?: Json | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          attachments?: Json | null;
          content?: string;
          created_at?: string | null;
          event_id?: string;
          id?: string;
          is_edited?: boolean | null;
          is_pinned?: boolean | null;
          parent_comment_id?: string | null;
          reactions?: Json | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_comments_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_comments_parent_comment_id_fkey';
            columns: ['parent_comment_id'];
            isOneToOne: false;
            referencedRelation: 'event_comments';
            referencedColumns: ['id'];
          },
        ];
      };
      event_logs: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          event_id: string;
          id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          event_id: string;
          id?: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          event_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_logs_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      event_sponsorships: {
        Row: {
          amount: number;
          cancelled_at: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          event_id: string;
          id: string;
          metadata: Json | null;
          payment_intent_id: string | null;
          quantity: number | null;
          sponsor_company: string | null;
          sponsor_email: string;
          sponsor_id: string;
          sponsor_logo: string | null;
          sponsor_name: string;
          status: string | null;
          stripe_payment_id: string | null;
          tier_id: string;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          cancelled_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          event_id: string;
          id?: string;
          metadata?: Json | null;
          payment_intent_id?: string | null;
          quantity?: number | null;
          sponsor_company?: string | null;
          sponsor_email: string;
          sponsor_id: string;
          sponsor_logo?: string | null;
          sponsor_name: string;
          status?: string | null;
          stripe_payment_id?: string | null;
          tier_id: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          cancelled_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          event_id?: string;
          id?: string;
          metadata?: Json | null;
          payment_intent_id?: string | null;
          quantity?: number | null;
          sponsor_company?: string | null;
          sponsor_email?: string;
          sponsor_id?: string;
          sponsor_logo?: string | null;
          sponsor_name?: string;
          status?: string | null;
          stripe_payment_id?: string | null;
          tier_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'event_sponsorships_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_sponsorships_tier_id_fkey';
            columns: ['tier_id'];
            isOneToOne: false;
            referencedRelation: 'sponsorship_tiers';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          attendees_count: number | null;
          auto_extend_enabled: boolean | null;
          available_tickets: number | null;
          banner_image: string | null;
          campaign_deadline_type: string | null;
          campaign_duration: number | null;
          category: string | null;
          collaborators: Json | null;
          created_at: string | null;
          creator_id: string | null;
          current_amount: number | null;
          description: string | null;
          end_date: string | null;
          enhanced_type: string | null;
          event_type: string | null;
          funded_at: string | null;
          funding_status: string | null;
          hybrid_event_enabled: boolean | null;
          id: string;
          image_url: string | null;
          is_all_or_nothing: boolean | null;
          is_free: boolean | null;
          is_public: boolean | null;
          location: string | null;
          max_capacity: number | null;
          metadata: Json | null;
          organizer_name: string | null;
          pledge_deadline: string | null;
          price: number | null;
          recurrence_pattern: Json | null;
          referral_commission_amount: number | null;
          referral_commission_type: string | null;
          referral_enabled: boolean | null;
          referral_terms: string | null;
          reminder_days: number[] | null;
          reserved_tickets: number | null;
          short_description: string | null;
          sponsorship_enabled: boolean | null;
          start_date: string | null;
          status: string | null;
          tags: string[] | null;
          target_amount: number | null;
          tickets_sold: number | null;
          title: string;
          tour_enabled: boolean | null;
          updated_at: string | null;
          venue_id: string | null;
          virtual_event_enabled: boolean | null;
        };
        Insert: {
          attendees_count?: number | null;
          auto_extend_enabled?: boolean | null;
          available_tickets?: number | null;
          banner_image?: string | null;
          campaign_deadline_type?: string | null;
          campaign_duration?: number | null;
          category?: string | null;
          collaborators?: Json | null;
          created_at?: string | null;
          creator_id?: string | null;
          current_amount?: number | null;
          description?: string | null;
          end_date?: string | null;
          enhanced_type?: string | null;
          event_type?: string | null;
          funded_at?: string | null;
          funding_status?: string | null;
          hybrid_event_enabled?: boolean | null;
          id?: string;
          image_url?: string | null;
          is_all_or_nothing?: boolean | null;
          is_free?: boolean | null;
          is_public?: boolean | null;
          location?: string | null;
          max_capacity?: number | null;
          metadata?: Json | null;
          organizer_name?: string | null;
          pledge_deadline?: string | null;
          price?: number | null;
          recurrence_pattern?: Json | null;
          referral_commission_amount?: number | null;
          referral_commission_type?: string | null;
          referral_enabled?: boolean | null;
          referral_terms?: string | null;
          reminder_days?: number[] | null;
          reserved_tickets?: number | null;
          short_description?: string | null;
          sponsorship_enabled?: boolean | null;
          start_date?: string | null;
          status?: string | null;
          tags?: string[] | null;
          target_amount?: number | null;
          tickets_sold?: number | null;
          title: string;
          tour_enabled?: boolean | null;
          updated_at?: string | null;
          venue_id?: string | null;
          virtual_event_enabled?: boolean | null;
        };
        Update: {
          attendees_count?: number | null;
          auto_extend_enabled?: boolean | null;
          available_tickets?: number | null;
          banner_image?: string | null;
          campaign_deadline_type?: string | null;
          campaign_duration?: number | null;
          category?: string | null;
          collaborators?: Json | null;
          created_at?: string | null;
          creator_id?: string | null;
          current_amount?: number | null;
          description?: string | null;
          end_date?: string | null;
          enhanced_type?: string | null;
          event_type?: string | null;
          funded_at?: string | null;
          funding_status?: string | null;
          hybrid_event_enabled?: boolean | null;
          id?: string;
          image_url?: string | null;
          is_all_or_nothing?: boolean | null;
          is_free?: boolean | null;
          is_public?: boolean | null;
          location?: string | null;
          max_capacity?: number | null;
          metadata?: Json | null;
          organizer_name?: string | null;
          pledge_deadline?: string | null;
          price?: number | null;
          recurrence_pattern?: Json | null;
          referral_commission_amount?: number | null;
          referral_commission_type?: string | null;
          referral_enabled?: boolean | null;
          referral_terms?: string | null;
          reminder_days?: number[] | null;
          reserved_tickets?: number | null;
          short_description?: string | null;
          sponsorship_enabled?: boolean | null;
          start_date?: string | null;
          status?: string | null;
          tags?: string[] | null;
          target_amount?: number | null;
          tickets_sold?: number | null;
          title?: string;
          tour_enabled?: boolean | null;
          updated_at?: string | null;
          venue_id?: string | null;
          virtual_event_enabled?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'events_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      followers: {
        Row: {
          created_at: string | null;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      help_articles: {
        Row: {
          author_id: string | null;
          category: string;
          content: string;
          created_at: string | null;
          helpful_votes: number | null;
          id: string;
          published_at: string | null;
          status: string | null;
          subcategory: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          views_count: number | null;
        };
        Insert: {
          author_id?: string | null;
          category: string;
          content: string;
          created_at?: string | null;
          helpful_votes?: number | null;
          id?: string;
          published_at?: string | null;
          status?: string | null;
          subcategory?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          views_count?: number | null;
        };
        Update: {
          author_id?: string | null;
          category?: string;
          content?: string;
          created_at?: string | null;
          helpful_votes?: number | null;
          id?: string;
          published_at?: string | null;
          status?: string | null;
          subcategory?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          views_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'help_articles_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      jobs: {
        Row: {
          created_at: string | null;
          department: string;
          description: string;
          id: string;
          is_active: boolean | null;
          is_remote: boolean | null;
          location: string;
          requirements: string[] | null;
          salary_range: string | null;
          title: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          department: string;
          description: string;
          id?: string;
          is_active?: boolean | null;
          is_remote?: boolean | null;
          location: string;
          requirements?: string[] | null;
          salary_range?: string | null;
          title: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          department?: string;
          description?: string;
          id?: string;
          is_active?: boolean | null;
          is_remote?: boolean | null;
          location?: string;
          requirements?: string[] | null;
          salary_range?: string | null;
          title?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          address: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string | null;
          postal_code: string | null;
          state: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string | null;
          postal_code?: string | null;
          state?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string | null;
          postal_code?: string | null;
          state?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string | null;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message_type: string | null;
          metadata: Json | null;
          recipient_id: string | null;
          sender_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          recipient_id?: string | null;
          sender_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message_type?: string | null;
          metadata?: Json | null;
          recipient_id?: string | null;
          sender_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string | null;
          data: Json | null;
          id: string;
          message: string;
          read: boolean | null;
          title: string;
          type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          message: string;
          read?: boolean | null;
          title: string;
          type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          message?: string;
          read?: boolean | null;
          title?: string;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string | null;
          id: string;
          product_id: string | null;
          quantity: number;
          status: string;
          total_price: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          status?: string;
          total_price: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          status?: string;
          total_price?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_customers: {
        Row: {
          created_at: string | null;
          id: string;
          metadata: Json | null;
          stripe_customer_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          stripe_customer_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          stripe_customer_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payment_history: {
        Row: {
          amount_in_cents: number;
          created_at: string | null;
          currency: string | null;
          id: string;
          last_retry_at: string | null;
          metadata: Json | null;
          payment_intent_id: string | null;
          retry_count: number | null;
          status: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount_in_cents: number;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          last_retry_at?: string | null;
          metadata?: Json | null;
          payment_intent_id?: string | null;
          retry_count?: number | null;
          status: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount_in_cents?: number;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          last_retry_at?: string | null;
          metadata?: Json | null;
          payment_intent_id?: string | null;
          retry_count?: number | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_methods: {
        Row: {
          card_brand: string | null;
          card_exp_month: number | null;
          card_exp_year: number | null;
          card_last4: string | null;
          created_at: string | null;
          id: string;
          is_default: boolean | null;
          stripe_payment_method_id: string;
          type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          card_brand?: string | null;
          card_exp_month?: number | null;
          card_exp_year?: number | null;
          card_last4?: string | null;
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          stripe_payment_method_id: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          card_brand?: string | null;
          card_exp_month?: number | null;
          card_exp_year?: number | null;
          card_last4?: string | null;
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          stripe_payment_method_id?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_methods_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount_in_cents: number;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          payment_method: string | null;
          status: string;
          stripe_payment_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount_in_cents: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_method?: string | null;
          status: string;
          stripe_payment_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount_in_cents?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_method?: string | null;
          status?: string;
          stripe_payment_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      pledges: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string | null;
          event_id: string | null;
          id: string;
          payment_intent_id: string | null;
          status: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string | null;
          event_id?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string | null;
          event_id?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pledges_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pledges_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      podcast_analytics: {
        Row: {
          average_listen_time: number | null;
          completion_rate: number | null;
          created_at: string | null;
          device_data: Json | null;
          geographic_data: Json | null;
          id: string;
          podcast_id: string | null;
          referral_sources: Json | null;
          total_plays: number | null;
          unique_listeners: number | null;
          updated_at: string | null;
        };
        Insert: {
          average_listen_time?: number | null;
          completion_rate?: number | null;
          created_at?: string | null;
          device_data?: Json | null;
          geographic_data?: Json | null;
          id?: string;
          podcast_id?: string | null;
          referral_sources?: Json | null;
          total_plays?: number | null;
          unique_listeners?: number | null;
          updated_at?: string | null;
        };
        Update: {
          average_listen_time?: number | null;
          completion_rate?: number | null;
          created_at?: string | null;
          device_data?: Json | null;
          geographic_data?: Json | null;
          id?: string;
          podcast_id?: string | null;
          referral_sources?: Json | null;
          total_plays?: number | null;
          unique_listeners?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'podcast_analytics_podcast_id_fkey';
            columns: ['podcast_id'];
            isOneToOne: false;
            referencedRelation: 'podcasts';
            referencedColumns: ['id'];
          },
        ];
      };
      podcast_collaborators: {
        Row: {
          created_at: string | null;
          id: string;
          joined_at: string | null;
          permissions: Json | null;
          podcast_id: string | null;
          role: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          joined_at?: string | null;
          permissions?: Json | null;
          podcast_id?: string | null;
          role: string;
          status: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          joined_at?: string | null;
          permissions?: Json | null;
          podcast_id?: string | null;
          role?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'podcast_collaborators_podcast_id_fkey';
            columns: ['podcast_id'];
            isOneToOne: false;
            referencedRelation: 'podcasts';
            referencedColumns: ['id'];
          },
        ];
      };
      podcast_comments: {
        Row: {
          created_at: string | null;
          id: string;
          likes: number | null;
          parent_comment_id: string | null;
          podcast_id: string | null;
          text: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          likes?: number | null;
          parent_comment_id?: string | null;
          podcast_id?: string | null;
          text: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          likes?: number | null;
          parent_comment_id?: string | null;
          podcast_id?: string | null;
          text?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'podcast_comments_parent_comment_id_fkey';
            columns: ['parent_comment_id'];
            isOneToOne: false;
            referencedRelation: 'podcast_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'podcast_comments_podcast_id_fkey';
            columns: ['podcast_id'];
            isOneToOne: false;
            referencedRelation: 'podcasts';
            referencedColumns: ['id'];
          },
        ];
      };
      podcast_recording_sessions: {
        Row: {
          created_at: string | null;
          description: string | null;
          duration: number | null;
          end_time: string | null;
          id: string;
          participants: string[] | null;
          podcast_id: string | null;
          quality: string | null;
          recording_url: string | null;
          session_id: string;
          settings: Json | null;
          start_time: string;
          status: string;
          title: string;
          transcription_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          duration?: number | null;
          end_time?: string | null;
          id?: string;
          participants?: string[] | null;
          podcast_id?: string | null;
          quality?: string | null;
          recording_url?: string | null;
          session_id: string;
          settings?: Json | null;
          start_time: string;
          status: string;
          title: string;
          transcription_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          duration?: number | null;
          end_time?: string | null;
          id?: string;
          participants?: string[] | null;
          podcast_id?: string | null;
          quality?: string | null;
          recording_url?: string | null;
          session_id?: string;
          settings?: Json | null;
          start_time?: string;
          status?: string;
          title?: string;
          transcription_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'podcast_recording_sessions_podcast_id_fkey';
            columns: ['podcast_id'];
            isOneToOne: false;
            referencedRelation: 'podcasts';
            referencedColumns: ['id'];
          },
        ];
      };
      podcast_subscriptions: {
        Row: {
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          tier: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      podcasts: {
        Row: {
          audio_url: string | null;
          categories: string[] | null;
          comments: number | null;
          cover_image: string | null;
          created_at: string | null;
          creator_id: string | null;
          description: string | null;
          duration: number | null;
          episode_number: number | null;
          file_size: number | null;
          file_url: string | null;
          format: string | null;
          id: string;
          is_exclusive: boolean | null;
          is_private: boolean | null;
          is_pro: boolean | null;
          likes: number | null;
          plays: number | null;
          published_at: string | null;
          recorded_at: string | null;
          season: number | null;
          series_id: string | null;
          subscription_required: boolean | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          transcription: string | null;
          type: string;
          updated_at: string | null;
          video_url: string | null;
        };
        Insert: {
          audio_url?: string | null;
          categories?: string[] | null;
          comments?: number | null;
          cover_image?: string | null;
          created_at?: string | null;
          creator_id?: string | null;
          description?: string | null;
          duration?: number | null;
          episode_number?: number | null;
          file_size?: number | null;
          file_url?: string | null;
          format?: string | null;
          id?: string;
          is_exclusive?: boolean | null;
          is_private?: boolean | null;
          is_pro?: boolean | null;
          likes?: number | null;
          plays?: number | null;
          published_at?: string | null;
          recorded_at?: string | null;
          season?: number | null;
          series_id?: string | null;
          subscription_required?: boolean | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          transcription?: string | null;
          type: string;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Update: {
          audio_url?: string | null;
          categories?: string[] | null;
          comments?: number | null;
          cover_image?: string | null;
          created_at?: string | null;
          creator_id?: string | null;
          description?: string | null;
          duration?: number | null;
          episode_number?: number | null;
          file_size?: number | null;
          file_url?: string | null;
          format?: string | null;
          id?: string;
          is_exclusive?: boolean | null;
          is_private?: boolean | null;
          is_pro?: boolean | null;
          likes?: number | null;
          plays?: number | null;
          published_at?: string | null;
          recorded_at?: string | null;
          season?: number | null;
          series_id?: string | null;
          subscription_required?: boolean | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          transcription?: string | null;
          type?: string;
          updated_at?: string | null;
          video_url?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category: string | null;
          created_at: string | null;
          creator_id: string | null;
          description: string | null;
          event_id: string | null;
          id: string;
          image_url: string | null;
          images: string[] | null;
          in_stock: boolean | null;
          is_digital: boolean | null;
          metadata: Json | null;
          name: string;
          price_in_cents: number;
          quantity_remaining: number | null;
          status: string | null;
          stock_quantity: number | null;
          subcategory: string | null;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          creator_id?: string | null;
          description?: string | null;
          event_id?: string | null;
          id?: string;
          image_url?: string | null;
          images?: string[] | null;
          in_stock?: boolean | null;
          is_digital?: boolean | null;
          metadata?: Json | null;
          name: string;
          price_in_cents: number;
          quantity_remaining?: number | null;
          status?: string | null;
          stock_quantity?: number | null;
          subcategory?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          creator_id?: string | null;
          description?: string | null;
          event_id?: string | null;
          id?: string;
          image_url?: string | null;
          images?: string[] | null;
          in_stock?: boolean | null;
          is_digital?: boolean | null;
          metadata?: Json | null;
          name?: string;
          price_in_cents?: number;
          quantity_remaining?: number | null;
          status?: string | null;
          stock_quantity?: number | null;
          subcategory?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      project_members: {
        Row: {
          created_at: string | null;
          id: string;
          joined_at: string | null;
          project_id: string;
          role: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          joined_at?: string | null;
          project_id: string;
          role?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          joined_at?: string | null;
          project_id?: string;
          role?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          category: string | null;
          created_at: string | null;
          creator_id: string | null;
          current_amount: number | null;
          description: string | null;
          end_date: string | null;
          id: string;
          image_url: string | null;
          location: string | null;
          requirements: string | null;
          skills_needed: string[] | null;
          start_date: string | null;
          status: string;
          tags: string[] | null;
          target_amount: number | null;
          team_size: number | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          creator_id?: string | null;
          current_amount?: number | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string | null;
          requirements?: string | null;
          skills_needed?: string[] | null;
          start_date?: string | null;
          status?: string;
          tags?: string[] | null;
          target_amount?: number | null;
          team_size?: number | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          creator_id?: string | null;
          current_amount?: number | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string | null;
          requirements?: string | null;
          skills_needed?: string[] | null;
          start_date?: string | null;
          status?: string;
          tags?: string[] | null;
          target_amount?: number | null;
          team_size?: number | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      promotion_analytics: {
        Row: {
          clicks: number | null;
          conversions: number | null;
          cpc: number | null;
          cpm: number | null;
          created_at: string | null;
          ctr: number | null;
          date: string;
          engagements: number | null;
          id: string;
          impressions: number | null;
          promotion_id: string | null;
          spend: number | null;
          updated_at: string | null;
        };
        Insert: {
          clicks?: number | null;
          conversions?: number | null;
          cpc?: number | null;
          cpm?: number | null;
          created_at?: string | null;
          ctr?: number | null;
          date?: string;
          engagements?: number | null;
          id?: string;
          impressions?: number | null;
          promotion_id?: string | null;
          spend?: number | null;
          updated_at?: string | null;
        };
        Update: {
          clicks?: number | null;
          conversions?: number | null;
          cpc?: number | null;
          cpm?: number | null;
          created_at?: string | null;
          ctr?: number | null;
          date?: string;
          engagements?: number | null;
          id?: string;
          impressions?: number | null;
          promotion_id?: string | null;
          spend?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promotion_analytics_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      promotion_credits: {
        Row: {
          amount: number;
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          promotion_id: string | null;
          reason: string;
          remaining_amount: number;
          status: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          promotion_id?: string | null;
          reason: string;
          remaining_amount: number;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          promotion_id?: string | null;
          reason?: string;
          remaining_amount?: number;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promotion_credits_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      promotion_transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          promotion_id: string | null;
          transaction_type: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          promotion_id?: string | null;
          transaction_type: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          promotion_id?: string | null;
          transaction_type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promotion_transactions_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      promotions: {
        Row: {
          age_range_max: number | null;
          age_range_min: number | null;
          ai_delivery_tone: string | null;
          bid_amount: number | null;
          budget: number;
          created_at: string | null;
          daily_budget_limit: number | null;
          delivery_method: string | null;
          description: string;
          end_date: string | null;
          id: string;
          interest_tags: Json | null;
          location_targeting: Json | null;
          start_date: string;
          status: string;
          target_audience: Json | null;
          target_id: string;
          target_type: string;
          title: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          age_range_max?: number | null;
          age_range_min?: number | null;
          ai_delivery_tone?: string | null;
          bid_amount?: number | null;
          budget: number;
          created_at?: string | null;
          daily_budget_limit?: number | null;
          delivery_method?: string | null;
          description: string;
          end_date?: string | null;
          id?: string;
          interest_tags?: Json | null;
          location_targeting?: Json | null;
          start_date: string;
          status?: string;
          target_audience?: Json | null;
          target_id: string;
          target_type: string;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          age_range_max?: number | null;
          age_range_min?: number | null;
          ai_delivery_tone?: string | null;
          bid_amount?: number | null;
          budget?: number;
          created_at?: string | null;
          daily_budget_limit?: number | null;
          delivery_method?: string | null;
          description?: string;
          end_date?: string | null;
          id?: string;
          interest_tags?: Json | null;
          location_targeting?: Json | null;
          start_date?: string;
          status?: string;
          target_audience?: Json | null;
          target_id?: string;
          target_type?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      records: {
        Row: {
          artist_id: string | null;
          bpm: number | null;
          catalog_number: string | null;
          created_at: string | null;
          credits: Json | null;
          duration: number | null;
          id: string;
          isrc_code: string | null;
          key_signature: string | null;
          label_name: string | null;
          lyrics: string | null;
          release_id: string | null;
          royalty_splits: Json | null;
          status: string | null;
          title: string;
          upc_code: string | null;
          updated_at: string | null;
        };
        Insert: {
          artist_id?: string | null;
          bpm?: number | null;
          catalog_number?: string | null;
          created_at?: string | null;
          credits?: Json | null;
          duration?: number | null;
          id?: string;
          isrc_code?: string | null;
          key_signature?: string | null;
          label_name?: string | null;
          lyrics?: string | null;
          release_id?: string | null;
          royalty_splits?: Json | null;
          status?: string | null;
          title: string;
          upc_code?: string | null;
          updated_at?: string | null;
        };
        Update: {
          artist_id?: string | null;
          bpm?: number | null;
          catalog_number?: string | null;
          created_at?: string | null;
          credits?: Json | null;
          duration?: number | null;
          id?: string;
          isrc_code?: string | null;
          key_signature?: string | null;
          label_name?: string | null;
          lyrics?: string | null;
          release_id?: string | null;
          royalty_splits?: Json | null;
          status?: string | null;
          title?: string;
          upc_code?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'records_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'records_release_id_fkey';
            columns: ['release_id'];
            isOneToOne: false;
            referencedRelation: 'releases';
            referencedColumns: ['id'];
          },
        ];
      };
      referral_clicks: {
        Row: {
          clicked_by_user_id: string | null;
          converted: boolean | null;
          converted_at: string | null;
          created_at: string | null;
          event_id: string;
          id: string;
          ip_address: unknown | null;
          metadata: Json | null;
          referral_code_id: string;
          user_agent: string | null;
        };
        Insert: {
          clicked_by_user_id?: string | null;
          converted?: boolean | null;
          converted_at?: string | null;
          created_at?: string | null;
          event_id: string;
          id?: string;
          ip_address?: unknown | null;
          metadata?: Json | null;
          referral_code_id: string;
          user_agent?: string | null;
        };
        Update: {
          clicked_by_user_id?: string | null;
          converted?: boolean | null;
          converted_at?: string | null;
          created_at?: string | null;
          event_id?: string;
          id?: string;
          ip_address?: unknown | null;
          metadata?: Json | null;
          referral_code_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'referral_clicks_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referral_clicks_referral_code_id_fkey';
            columns: ['referral_code_id'];
            isOneToOne: false;
            referencedRelation: 'referral_codes';
            referencedColumns: ['id'];
          },
        ];
      };
      referral_codes: {
        Row: {
          code: string;
          commission_amount: number | null;
          commission_type: string | null;
          created_at: string | null;
          event_id: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          max_uses: number | null;
          metadata: Json | null;
          referrer_id: string | null;
          total_earnings: number | null;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string | null;
        };
        Insert: {
          code: string;
          commission_amount?: number | null;
          commission_type?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_uses?: number | null;
          metadata?: Json | null;
          referrer_id?: string | null;
          total_earnings?: number | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          code?: string;
          commission_amount?: number | null;
          commission_type?: string | null;
          created_at?: string | null;
          event_id?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_uses?: number | null;
          metadata?: Json | null;
          referrer_id?: string | null;
          total_earnings?: number | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'referral_codes_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referral_codes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      referral_earnings: {
        Row: {
          commission_amount: number;
          commission_rate: number | null;
          created_at: string | null;
          event_id: string;
          id: string;
          metadata: Json | null;
          paid_at: string | null;
          referral_code_id: string;
          referred_user_id: string;
          referrer_id: string;
          status: string | null;
          stripe_transfer_id: string | null;
          ticket_amount: number;
          ticket_purchase_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          commission_amount: number;
          commission_rate?: number | null;
          created_at?: string | null;
          event_id: string;
          id?: string;
          metadata?: Json | null;
          paid_at?: string | null;
          referral_code_id: string;
          referred_user_id: string;
          referrer_id: string;
          status?: string | null;
          stripe_transfer_id?: string | null;
          ticket_amount: number;
          ticket_purchase_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          commission_amount?: number;
          commission_rate?: number | null;
          created_at?: string | null;
          event_id?: string;
          id?: string;
          metadata?: Json | null;
          paid_at?: string | null;
          referral_code_id?: string;
          referred_user_id?: string;
          referrer_id?: string;
          status?: string | null;
          stripe_transfer_id?: string | null;
          ticket_amount?: number;
          ticket_purchase_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'referral_earnings_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referral_earnings_referral_code_id_fkey';
            columns: ['referral_code_id'];
            isOneToOne: false;
            referencedRelation: 'referral_codes';
            referencedColumns: ['id'];
          },
        ];
      };
      referral_links: {
        Row: {
          clicks: number | null;
          conversions: number | null;
          created_at: string | null;
          event_id: string;
          id: string;
          is_active: boolean | null;
          referral_code: string;
          referrer_user_id: string;
          total_commission_earned: number | null;
          updated_at: string | null;
        };
        Insert: {
          clicks?: number | null;
          conversions?: number | null;
          created_at?: string | null;
          event_id: string;
          id?: string;
          is_active?: boolean | null;
          referral_code: string;
          referrer_user_id: string;
          total_commission_earned?: number | null;
          updated_at?: string | null;
        };
        Update: {
          clicks?: number | null;
          conversions?: number | null;
          created_at?: string | null;
          event_id?: string;
          id?: string;
          is_active?: boolean | null;
          referral_code?: string;
          referrer_user_id?: string;
          total_commission_earned?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'referral_links_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      referral_payouts: {
        Row: {
          created_at: string | null;
          id: string;
          payout_method: string | null;
          payout_reference: string | null;
          payout_status: string | null;
          processed_at: string | null;
          referrer_user_id: string;
          total_amount: number;
          transaction_count: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          payout_method?: string | null;
          payout_reference?: string | null;
          payout_status?: string | null;
          processed_at?: string | null;
          referrer_user_id: string;
          total_amount: number;
          transaction_count: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          payout_method?: string | null;
          payout_reference?: string | null;
          payout_status?: string | null;
          processed_at?: string | null;
          referrer_user_id?: string;
          total_amount?: number;
          transaction_count?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      referral_transactions: {
        Row: {
          commission_amount: number;
          commission_status: string | null;
          created_at: string | null;
          id: string;
          order_id: string;
          payout_id: string | null;
          referral_link_id: string;
          referred_user_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          commission_amount: number;
          commission_status?: string | null;
          created_at?: string | null;
          id?: string;
          order_id: string;
          payout_id?: string | null;
          referral_link_id: string;
          referred_user_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          commission_amount?: number;
          commission_status?: string | null;
          created_at?: string | null;
          id?: string;
          order_id?: string;
          payout_id?: string | null;
          referral_link_id?: string;
          referred_user_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'referral_transactions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referral_transactions_referral_link_id_fkey';
            columns: ['referral_link_id'];
            isOneToOne: false;
            referencedRelation: 'referral_links';
            referencedColumns: ['id'];
          },
        ];
      };
      releases: {
        Row: {
          artist_id: string | null;
          cover_art_url: string | null;
          created_at: string | null;
          description: string | null;
          genre: string[] | null;
          id: string;
          metadata: Json | null;
          release_date: string | null;
          release_type: string | null;
          status: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          artist_id?: string | null;
          cover_art_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          genre?: string[] | null;
          id?: string;
          metadata?: Json | null;
          release_date?: string | null;
          release_type?: string | null;
          status?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          artist_id?: string | null;
          cover_art_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          genre?: string[] | null;
          id?: string;
          metadata?: Json | null;
          release_date?: string | null;
          release_type?: string | null;
          status?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'releases_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          admin_notes: string | null;
          content_type: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          reason: string;
          reported_content_id: string | null;
          reported_user_id: string | null;
          reporter_id: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          reason: string;
          reported_content_id?: string | null;
          reported_user_id?: string | null;
          reporter_id?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          reason?: string;
          reported_content_id?: string | null;
          reported_user_id?: string | null;
          reporter_id?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      saved_events: {
        Row: {
          created_at: string | null;
          event_id: string;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          event_id: string;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          event_id?: string;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_events_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      security_audit_log: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          ip_address: unknown | null;
          metadata: Json | null;
          resource_id: string | null;
          resource_type: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      sponsorship_tiers: {
        Row: {
          benefits: string[] | null;
          created_at: string | null;
          current_quantity: number | null;
          description: string | null;
          display_order: number | null;
          event_id: string;
          id: string;
          is_active: boolean | null;
          max_quantity: number | null;
          metadata: Json | null;
          name: string;
          price: number;
          updated_at: string | null;
        };
        Insert: {
          benefits?: string[] | null;
          created_at?: string | null;
          current_quantity?: number | null;
          description?: string | null;
          display_order?: number | null;
          event_id: string;
          id?: string;
          is_active?: boolean | null;
          max_quantity?: number | null;
          metadata?: Json | null;
          name: string;
          price: number;
          updated_at?: string | null;
        };
        Update: {
          benefits?: string[] | null;
          created_at?: string | null;
          current_quantity?: number | null;
          description?: string | null;
          display_order?: number | null;
          event_id?: string;
          id?: string;
          is_active?: boolean | null;
          max_quantity?: number | null;
          metadata?: Json | null;
          name?: string;
          price?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sponsorship_tiers_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      stores: {
        Row: {
          banner_url: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          banner_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          banner_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stores_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_customers: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          stripe_customer_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          stripe_customer_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          stripe_customer_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stripe_customers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_payment_methods: {
        Row: {
          card_brand: string | null;
          card_exp_month: number | null;
          card_exp_year: number | null;
          card_last4: string | null;
          created_at: string | null;
          id: string;
          is_default: boolean | null;
          stripe_payment_method_id: string;
          type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          card_brand?: string | null;
          card_exp_month?: number | null;
          card_exp_year?: number | null;
          card_last4?: string | null;
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          stripe_payment_method_id: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          card_brand?: string | null;
          card_exp_month?: number | null;
          card_exp_year?: number | null;
          card_last4?: string | null;
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          stripe_payment_method_id?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stripe_payment_methods_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_subscriptions: {
        Row: {
          cancel_at: string | null;
          canceled_at: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          metadata: Json | null;
          status: string;
          stripe_subscription_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          metadata?: Json | null;
          status: string;
          stripe_subscription_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          metadata?: Json | null;
          status?: string;
          stripe_subscription_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stripe_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      studios: {
        Row: {
          amenities: string[] | null;
          created_at: string | null;
          daily_rate: number | null;
          description: string | null;
          equipment: Json | null;
          hourly_rate: number | null;
          id: string;
          images: string[] | null;
          is_featured: boolean | null;
          location_id: string | null;
          metadata: Json | null;
          name: string;
          owner_id: string | null;
          status: string | null;
          studio_type: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          amenities?: string[] | null;
          created_at?: string | null;
          daily_rate?: number | null;
          description?: string | null;
          equipment?: Json | null;
          hourly_rate?: number | null;
          id?: string;
          images?: string[] | null;
          is_featured?: boolean | null;
          location_id?: string | null;
          metadata?: Json | null;
          name: string;
          owner_id?: string | null;
          status?: string | null;
          studio_type?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          amenities?: string[] | null;
          created_at?: string | null;
          daily_rate?: number | null;
          description?: string | null;
          equipment?: Json | null;
          hourly_rate?: number | null;
          id?: string;
          images?: string[] | null;
          is_featured?: boolean | null;
          location_id?: string | null;
          metadata?: Json | null;
          name?: string;
          owner_id?: string | null;
          status?: string | null;
          studio_type?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'studios_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'studios_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      system_logs: {
        Row: {
          created_at: string | null;
          id: string;
          ip_address: unknown | null;
          level: string;
          message: string;
          metadata: Json | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          level: string;
          message: string;
          metadata?: Json | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          level?: string;
          message?: string;
          metadata?: Json | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'system_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ticket_reservations: {
        Row: {
          confirmed_at: string | null;
          created_at: string | null;
          event_id: string;
          expires_at: string | null;
          id: string;
          payment_intent_id: string | null;
          quantity: number;
          status: string;
          ticket_price: number;
          total_amount: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          confirmed_at?: string | null;
          created_at?: string | null;
          event_id: string;
          expires_at?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          quantity?: number;
          status?: string;
          ticket_price?: number;
          total_amount?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          confirmed_at?: string | null;
          created_at?: string | null;
          event_id?: string;
          expires_at?: string | null;
          id?: string;
          payment_intent_id?: string | null;
          quantity?: number;
          status?: string;
          ticket_price?: number;
          total_amount?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ticket_reservations_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      tickets: {
        Row: {
          event_id: string | null;
          id: string;
          metadata: Json | null;
          price: number;
          purchase_date: string | null;
          qr_code: string | null;
          status: string;
          ticket_type: string;
          used_date: string | null;
          user_id: string | null;
        };
        Insert: {
          event_id?: string | null;
          id?: string;
          metadata?: Json | null;
          price: number;
          purchase_date?: string | null;
          qr_code?: string | null;
          status?: string;
          ticket_type: string;
          used_date?: string | null;
          user_id?: string | null;
        };
        Update: {
          event_id?: string | null;
          id?: string;
          metadata?: Json | null;
          price?: number;
          purchase_date?: string | null;
          qr_code?: string | null;
          status?: string;
          ticket_type?: string;
          used_date?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tickets_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      tour_attendees: {
        Row: {
          cancelled_at: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          event_id: string;
          id: string;
          metadata: Json | null;
          payment_intent_id: string | null;
          quantity: number | null;
          reserved_at: string | null;
          status: string | null;
          stripe_payment_id: string | null;
          total_amount: number;
          tour_date_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancelled_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          event_id: string;
          id?: string;
          metadata?: Json | null;
          payment_intent_id?: string | null;
          quantity?: number | null;
          reserved_at?: string | null;
          status?: string | null;
          stripe_payment_id?: string | null;
          total_amount: number;
          tour_date_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancelled_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          event_id?: string;
          id?: string;
          metadata?: Json | null;
          payment_intent_id?: string | null;
          quantity?: number | null;
          reserved_at?: string | null;
          status?: string | null;
          stripe_payment_id?: string | null;
          total_amount?: number;
          tour_date_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tour_attendees_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tour_attendees_tour_date_id_fkey';
            columns: ['tour_date_id'];
            isOneToOne: false;
            referencedRelation: 'tour_dates';
            referencedColumns: ['id'];
          },
        ];
      };
      tour_dates: {
        Row: {
          capacity: number | null;
          created_at: string | null;
          date: string;
          end_time: string | null;
          event_id: string;
          id: string;
          metadata: Json | null;
          special_notes: string | null;
          start_time: string | null;
          status: string | null;
          ticket_price: number | null;
          tickets_reserved: number | null;
          tickets_sold: number | null;
          updated_at: string | null;
          venue_address: string | null;
          venue_city: string | null;
          venue_country: string | null;
          venue_id: string | null;
          venue_name: string | null;
          venue_state: string | null;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string | null;
          date: string;
          end_time?: string | null;
          event_id: string;
          id?: string;
          metadata?: Json | null;
          special_notes?: string | null;
          start_time?: string | null;
          status?: string | null;
          ticket_price?: number | null;
          tickets_reserved?: number | null;
          tickets_sold?: number | null;
          updated_at?: string | null;
          venue_address?: string | null;
          venue_city?: string | null;
          venue_country?: string | null;
          venue_id?: string | null;
          venue_name?: string | null;
          venue_state?: string | null;
        };
        Update: {
          capacity?: number | null;
          created_at?: string | null;
          date?: string;
          end_time?: string | null;
          event_id?: string;
          id?: string;
          metadata?: Json | null;
          special_notes?: string | null;
          start_time?: string | null;
          status?: string | null;
          ticket_price?: number | null;
          tickets_reserved?: number | null;
          tickets_sold?: number | null;
          updated_at?: string | null;
          venue_address?: string | null;
          venue_city?: string | null;
          venue_country?: string | null;
          venue_id?: string | null;
          venue_name?: string | null;
          venue_state?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tour_dates_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tour_dates_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          amount_in_cents: number;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          status: string;
          transaction_type: string;
          updated_at: string | null;
          user_id: string | null;
          wallet_id: string | null;
        };
        Insert: {
          amount_in_cents: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          status: string;
          transaction_type: string;
          updated_at?: string | null;
          user_id?: string | null;
          wallet_id?: string | null;
        };
        Update: {
          amount_in_cents?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          status?: string;
          transaction_type?: string;
          updated_at?: string | null;
          user_id?: string | null;
          wallet_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_wallet_id_fkey';
            columns: ['wallet_id'];
            isOneToOne: false;
            referencedRelation: 'wallets';
            referencedColumns: ['id'];
          },
        ];
      };
      user_2fa_settings: {
        Row: {
          backup_codes: string[] | null;
          created_at: string | null;
          id: string;
          is_enabled: boolean | null;
          secret: string | null;
          type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          backup_codes?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          secret?: string | null;
          type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          backup_codes?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          secret?: string | null;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_followers: {
        Row: {
          created_at: string | null;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_locations: {
        Row: {
          created_at: string | null;
          id: string;
          is_primary: boolean | null;
          location_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_primary?: boolean | null;
          location_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_primary?: boolean | null;
          location_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_locations_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_locations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_posts: {
        Row: {
          comments_count: number | null;
          content: string;
          created_at: string | null;
          id: string;
          image_url: string | null;
          is_public: boolean | null;
          likes_count: number | null;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          comments_count?: number | null;
          content: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_public?: boolean | null;
          likes_count?: number | null;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          comments_count?: number | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_public?: boolean | null;
          likes_count?: number | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          account_type: string | null;
          bio: string | null;
          company: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          education: string | null;
          has_store: boolean | null;
          id: string;
          interests: string[] | null;
          is_eligible_for_subscription: boolean | null;
          is_verified: boolean | null;
          location: string | null;
          notification_preferences: Json | null;
          privacy_settings: Json | null;
          profession: string | null;
          skills: string[] | null;
          social_links: Json | null;
          stripe_connect_account_id: string | null;
          updated_at: string | null;
          user_id: string | null;
          website: string | null;
        };
        Insert: {
          account_type?: string | null;
          bio?: string | null;
          company?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          education?: string | null;
          has_store?: boolean | null;
          id?: string;
          interests?: string[] | null;
          is_eligible_for_subscription?: boolean | null;
          is_verified?: boolean | null;
          location?: string | null;
          notification_preferences?: Json | null;
          privacy_settings?: Json | null;
          profession?: string | null;
          skills?: string[] | null;
          social_links?: Json | null;
          stripe_connect_account_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          website?: string | null;
        };
        Update: {
          account_type?: string | null;
          bio?: string | null;
          company?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          education?: string | null;
          has_store?: boolean | null;
          id?: string;
          interests?: string[] | null;
          is_eligible_for_subscription?: boolean | null;
          is_verified?: boolean | null;
          location?: string | null;
          notification_preferences?: Json | null;
          privacy_settings?: Json | null;
          profession?: string | null;
          skills?: string[] | null;
          social_links?: Json | null;
          stripe_connect_account_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          created_at: string;
          id: string;
          metadata: Json | null;
          role: Database['public']['Enums']['app_role'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          display_name: string | null;
          email: string;
          id: string;
          is_admin: boolean | null;
          name: string | null;
          payment_settings: Json | null;
          preferences: Json | null;
          stripe_account_id: string | null;
          stripe_customer_id: string | null;
          subscription: Json | null;
          updated_at: string | null;
          username: string | null;
          wallet_balance_cents: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email: string;
          id?: string;
          is_admin?: boolean | null;
          name?: string | null;
          payment_settings?: Json | null;
          preferences?: Json | null;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
          subscription?: Json | null;
          updated_at?: string | null;
          username?: string | null;
          wallet_balance_cents?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email?: string;
          id?: string;
          is_admin?: boolean | null;
          name?: string | null;
          payment_settings?: Json | null;
          preferences?: Json | null;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
          subscription?: Json | null;
          updated_at?: string | null;
          username?: string | null;
          wallet_balance_cents?: number | null;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          amenities: Json | null;
          capacity: number | null;
          created_at: string | null;
          description: string | null;
          featured: boolean | null;
          id: string;
          location_id: string | null;
          metadata: Json | null;
          name: string;
          owner_id: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          amenities?: Json | null;
          capacity?: number | null;
          created_at?: string | null;
          description?: string | null;
          featured?: boolean | null;
          id?: string;
          location_id?: string | null;
          metadata?: Json | null;
          name: string;
          owner_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amenities?: Json | null;
          capacity?: number | null;
          created_at?: string | null;
          description?: string | null;
          featured?: boolean | null;
          id?: string;
          location_id?: string | null;
          metadata?: Json | null;
          name?: string;
          owner_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'venues_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'venues_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      wallet_transactions: {
        Row: {
          amount_cents: number;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          reference_id: string | null;
          reference_type: string | null;
          type: string;
          user_id: string | null;
        };
        Insert: {
          amount_cents: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          reference_id?: string | null;
          reference_type?: string | null;
          type: string;
          user_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          reference_id?: string | null;
          reference_type?: string | null;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'wallet_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      wallets: {
        Row: {
          available_balance_in_cents: number | null;
          balance_in_cents: number | null;
          created_at: string | null;
          id: string;
          pending_balance_in_cents: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          available_balance_in_cents?: number | null;
          balance_in_cents?: number | null;
          created_at?: string | null;
          id?: string;
          pending_balance_in_cents?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          available_balance_in_cents?: number | null;
          balance_in_cents?: number | null;
          created_at?: string | null;
          id?: string;
          pending_balance_in_cents?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wallets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_for_creator_program: {
        Args: { user_uuid: string };
        Returns: Json;
      };
      assign_user_role: {
        Args: {
          target_user_id: string;
          new_role: Database['public']['Enums']['app_role'];
        };
        Returns: boolean;
      };
      calculate_referral_commission: {
        Args: { p_event_id: string; p_ticket_price: number; p_quantity: number };
        Returns: number;
      };
      calculate_successful_events_count: {
        Args: { user_uuid: string };
        Returns: number;
      };
      calculate_user_event_attendees: {
        Args: { user_uuid: string };
        Returns: number;
      };
      calculate_user_followers_count: {
        Args: { user_uuid: string };
        Returns: number;
      };
      cancel_failed_event_funding: {
        Args: Record<PropertyKey, never> | { event_id_param: string };
        Returns: void;
      };
      cancel_failed_event_reservations: {
        Args: Record<PropertyKey, never> | { event_id_param: string };
        Returns: void;
      };
      check_creator_program_eligibility: {
        Args: { user_uuid: string };
        Returns: Json;
      };
      check_event_funding_goal: {
        Args: Record<PropertyKey, never> | { event_id_param: string };
        Returns: boolean;
      };
      check_rate_limit: {
        Args: {
          p_action: string;
          p_limit_count?: number;
          p_time_window?: unknown;
        };
        Returns: boolean;
      };
      check_user_role: {
        Args: {
          user_uuid: string;
          required_role: Database['public']['Enums']['app_role'];
        };
        Returns: boolean;
      };
      confirm_referral_transaction: {
        Args: { p_transaction_id: string };
        Returns: boolean;
      };
      create_referral_link: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: string;
      };
      expire_old_reservations: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      generate_community_referral_code: {
        Args: { p_community_id: string; p_user_id: string };
        Returns: string;
      };
      generate_referral_code: {
        Args:
          | { event_id: string; user_id: string }
          | {
              p_event_id: string;
              p_referrer_id: string;
              p_commission_amount?: number;
              p_commission_type?: string;
            };
        Returns: string;
      };
      get_events_near_location: {
        Args: { lat: number; lng: number; radius_km?: number };
        Returns: {
          id: string;
          title: string;
          description: string;
          creator_id: string;
          start_date: string;
          end_date: string;
          location: string;
          status: string;
          created_at: string;
          updated_at: string;
          venue_id: string;
          is_public: boolean;
          image_url: string;
          max_capacity: number;
          attendees_count: number;
          auto_extend_enabled: boolean;
          available_tickets: number;
          banner_image: string;
          campaign_deadline_type: string;
          campaign_duration: number;
          category: string;
          collaborators: Json;
          current_amount: number;
          enhanced_type: string;
          event_type: string;
          funded_at: string;
          funding_status: string;
          hybrid_event_enabled: boolean;
          is_all_or_nothing: boolean;
          is_free: boolean;
          metadata: Json;
          organizer_name: string;
          pledge_deadline: string;
          price: number;
          recurrence_pattern: Json;
          referral_commission_amount: number;
          referral_commission_type: string;
          referral_enabled: boolean;
          referral_terms: string;
          reminder_days: number[];
          reserved_tickets: number;
          short_description: string;
          sponsorship_enabled: boolean;
          tags: string[];
          target_amount: number;
          tickets_sold: number;
          tour_enabled: boolean;
          virtual_event_enabled: boolean;
        }[];
      };
      get_follower_count: {
        Args: { user_uuid: string };
        Returns: number;
      };
      get_following_count: {
        Args: { user_uuid: string };
        Returns: number;
      };
      get_referral_stats: {
        Args: { p_user_id: string };
        Returns: {
          total_earnings: number;
          pending_earnings: number;
          total_clicks: number;
          total_conversions: number;
          active_links: number;
        }[];
      };
      get_user_2fa_type: {
        Args: { user_uuid: string };
        Returns: string;
      };
      get_user_by_username: {
        Args: { search_username: string };
        Returns: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
          stripe_customer_id: string;
          stripe_account_id: string;
          preferences: Json;
          subscription: Json;
          payment_settings: Json;
          is_admin: boolean;
          name: string;
          username: string;
        }[];
      };
      get_user_posts: {
        Args: { user_uuid: string; limit_count?: number; offset_count?: number };
        Returns: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          image_url: string;
          is_public: boolean;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
          user_display_name: string;
          user_avatar_url: string;
        }[];
      };
      get_user_profile_complete: {
        Args: { search_param: string };
        Returns: {
          id: string;
          email: string;
          name: string;
          display_name: string;
          username: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
          is_admin: boolean;
          bio: string;
          location: string;
          website: string;
          profession: string;
          company: string;
          education: string;
          skills: string[];
          interests: string[];
          cover_image_url: string;
          is_verified: boolean;
          is_eligible_for_subscription: boolean;
          has_store: boolean;
        }[];
      };
      get_user_roles: {
        Args: { user_uuid?: string };
        Returns: {
          role: Database['public']['Enums']['app_role'];
        }[];
      };
      has_2fa_enabled: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      is_admin: {
        Args: { user_uuid?: string };
        Returns: boolean;
      };
      is_following: {
        Args: { follower_uuid: string; following_uuid: string };
        Returns: boolean;
      };
      log_security_event: {
        Args: {
          p_action: string;
          p_resource_type?: string;
          p_resource_id?: string;
          p_metadata?: Json;
        };
        Returns: void;
      };
      notify_event_cancelled: {
        Args: { p_event_id: string };
        Returns: number;
      };
      notify_event_funded: {
        Args: { p_event_id: string };
        Returns: number;
      };
      process_funding_goals: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      process_monthly_payouts: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      process_referral_commission: {
        Args: {
          p_referral_code: string;
          p_referred_user_id: string;
          p_ticket_purchase_id: string;
          p_ticket_amount: number;
        };
        Returns: string;
      };
      process_referral_transaction: {
        Args: { p_order_id: string; p_referral_code: string };
        Returns: string;
      };
      process_successful_event_funding: {
        Args: Record<PropertyKey, never> | { event_id_param: string };
        Returns: void;
      };
      process_successful_event_reservations: {
        Args: Record<PropertyKey, never> | { event_id_param: string };
        Returns: void;
      };
      send_bulk_notifications: {
        Args: {
          p_user_ids: string[];
          p_type: string;
          p_title: string;
          p_message: string;
          p_data?: Json;
        };
        Returns: number;
      };
      send_notification: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_title: string;
          p_message: string;
          p_data?: Json;
        };
        Returns: string;
      };
      track_community_referral_click: {
        Args: { p_referral_code: string };
        Returns: boolean;
      };
      track_referral_click: {
        Args: { p_referral_code: string };
        Returns: boolean;
      };
      update_creator_program_stats: {
        Args: { user_uuid: string };
        Returns: void;
      };
      update_user_profile: {
        Args: { user_id: string; updated_data: Json };
        Returns: Json;
      };
      update_wallet_balance: {
        Args: { p_user_id: string; p_amount_cents: number };
        Returns: void;
      };
      validate_input_length: {
        Args: { input_text: string; max_length?: number };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'user' | 'admin' | 'event_organizer' | 'venue_owner' | 'caterer' | 'moderator';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['user', 'admin', 'event_organizer', 'venue_owner', 'caterer', 'moderator'],
    },
  },
} as const;
