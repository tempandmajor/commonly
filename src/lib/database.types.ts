export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          is_pinned: boolean | null;
          likes_count: number | null;
          comments_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          is_pinned?: boolean | null;
          likes_count?: number | null;
          comments_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          is_pinned?: boolean | null;
          likes_count?: number | null;
          comments_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'post_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          display_name: string | null;
          username: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
          is_admin: boolean | null;
          stripe_customer_id: string | null;
          stripe_account_id: string | null;
          preferences: Json | null;
          subscription: Json | null;
          payment_settings: Json | null;
          wallet_balance_cents: number | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_admin?: boolean | null;
          stripe_customer_id?: string | null;
          stripe_account_id?: string | null;
          preferences?: Json | null;
          subscription?: Json | null;
          payment_settings?: Json | null;
          wallet_balance_cents?: number | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_admin?: boolean | null;
          stripe_customer_id?: string | null;
          stripe_account_id?: string | null;
          preferences?: Json | null;
          subscription?: Json | null;
          payment_settings?: Json | null;
          wallet_balance_cents?: number | null;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          bio: string | null;
          location: string | null;
          website: string | null;
          profession: string | null;
          company: string | null;
          education: string | null;
          skills: string[] | null;
          interests: string[] | null;
          cover_image_url: string | null;
          is_verified: boolean | null;
          is_eligible_for_subscription: boolean | null;
          has_store: boolean | null;
          account_type: string | null;
          social_links: Json | null;
          notification_preferences: Json | null;
          privacy_settings: Json | null;
          stripe_connect_account_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          profession?: string | null;
          company?: string | null;
          education?: string | null;
          skills?: string[] | null;
          interests?: string[] | null;
          cover_image_url?: string | null;
          is_verified?: boolean | null;
          is_eligible_for_subscription?: boolean | null;
          has_store?: boolean | null;
          account_type?: string | null;
          social_links?: Json | null;
          notification_preferences?: Json | null;
          privacy_settings?: Json | null;
          stripe_connect_account_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          profession?: string | null;
          company?: string | null;
          education?: string | null;
          skills?: string[] | null;
          interests?: string[] | null;
          cover_image_url?: string | null;
          is_verified?: boolean | null;
          is_eligible_for_subscription?: boolean | null;
          has_store?: boolean | null;
          account_type?: string | null;
          social_links?: Json | null;
          notification_preferences?: Json | null;
          privacy_settings?: Json | null;
          stripe_connect_account_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      // Add other essential tables as needed
      [key: string]: any;
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

type PublicSchema = Database[keyof Database];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;
