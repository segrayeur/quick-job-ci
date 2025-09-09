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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_sessions: {
        Row: {
          created_at: string
          id: string
          messages: Json
          session_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          session_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          session_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          status: string | null
          status_updated_at: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          status_updated_at?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          status_updated_at?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_favorites: {
        Row: {
          candidate_id: string
          created_at: string | null
          id: string
          recruiter_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          id?: string
          recruiter_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          id?: string
          recruiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_favorites_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_favorites_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_posts: {
        Row: {
          availability: string | null
          candidate_id: string
          commune: string | null
          created_at: string
          currency: string | null
          description: string
          hourly_rate: number | null
          id: string
          location: string | null
          quartier: string | null
          skills: string[] | null
          status: string | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          availability?: string | null
          candidate_id: string
          commune?: string | null
          created_at?: string
          currency?: string | null
          description: string
          hourly_rate?: number | null
          id?: string
          location?: string | null
          quartier?: string | null
          skills?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          availability?: string | null
          candidate_id?: string
          commune?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          hourly_rate?: number | null
          id?: string
          location?: string | null
          quartier?: string | null
          skills?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_candidate_posts_candidate_id"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_ratings: {
        Row: {
          application_id: string | null
          candidate_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          recruiter_id: string
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          candidate_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          recruiter_id: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          candidate_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          recruiter_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_ratings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interaction_logs: {
        Row: {
          anonymous_user_id: string | null
          created_at: string
          id: string
          interaction_type: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          amount: number
          applications_count: number | null
          category: string | null
          company_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          currency: string
          description: string
          district: string | null
          id: string
          location: string
          recruiter_id: string
          status: Database["public"]["Enums"]["job_status"]
          tenant_id: string | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          amount: number
          applications_count?: number | null
          category?: string | null
          company_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          currency?: string
          description: string
          district?: string | null
          id?: string
          location: string
          recruiter_id: string
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          amount?: number
          applications_count?: number | null
          category?: string | null
          company_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          currency?: string
          description?: string
          district?: string | null
          id?: string
          location?: string
          recruiter_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          keywords: string[] | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          jobs_limit: number | null
          jobs_published: number | null
          next_payment_date: string | null
          paystack_subscription_id: string | null
          plan: string
          plan_id: string | null
          renew_date: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_days: number | null
          trial_end_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          jobs_limit?: number | null
          jobs_published?: number | null
          next_payment_date?: string | null
          paystack_subscription_id?: string | null
          plan: string
          plan_id?: string | null
          renew_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_days?: number | null
          trial_end_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          jobs_limit?: number | null
          jobs_published?: number | null
          next_payment_date?: string | null
          paystack_subscription_id?: string | null
          plan?: string
          plan_id?: string | null
          renew_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_days?: number | null
          trial_end_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          applications_created_count: number | null
          availability: string | null
          commune: string | null
          created_at: string
          cv_url: string | null
          email: string
          experience: string | null
          first_name: string | null
          id: string
          is_verified: boolean | null
          is_vip_candidate: boolean | null
          last_name: string | null
          location: string | null
          phone: string | null
          profile_complete: boolean | null
          quartier: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills: string[] | null
          tenant_id: string | null
          updated_at: string
          user_id: string
          vip_expiry_date: string | null
          whatsapp: string | null
        }
        Insert: {
          applications_created_count?: number | null
          availability?: string | null
          commune?: string | null
          created_at?: string
          cv_url?: string | null
          email: string
          experience?: string | null
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          is_vip_candidate?: boolean | null
          last_name?: string | null
          location?: string | null
          phone?: string | null
          profile_complete?: boolean | null
          quartier?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          vip_expiry_date?: string | null
          whatsapp?: string | null
        }
        Update: {
          applications_created_count?: number | null
          availability?: string | null
          commune?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string
          experience?: string | null
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          is_vip_candidate?: boolean | null
          last_name?: string | null
          location?: string | null
          phone?: string | null
          profile_complete?: boolean | null
          quartier?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          vip_expiry_date?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      application_status: "pending" | "accepted" | "rejected"
      job_status: "open" | "closed" | "in_progress" | "accomplished"
      subscription_status:
        | "active"
        | "inactive"
        | "cancelled"
        | "past_due"
        | "trialing"
      user_role: "admin" | "recruiter" | "candidate"
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
      application_status: ["pending", "accepted", "rejected"],
      job_status: ["open", "closed", "in_progress", "accomplished"],
      subscription_status: [
        "active",
        "inactive",
        "cancelled",
        "past_due",
        "trialing",
      ],
      user_role: ["admin", "recruiter", "candidate"],
    },
  },
} as const
