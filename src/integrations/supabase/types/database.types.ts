export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
