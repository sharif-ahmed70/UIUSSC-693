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
      club_audit_logs: {
        Row: {
          action: string
          actor_auth_user_id: string | null
          actor_profile_id: string | null
          created_at: string
          department_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_auth_user_id?: string | null
          actor_profile_id?: string | null
          created_at?: string
          department_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_auth_user_id?: string | null
          actor_profile_id?: string | null
          created_at?: string
          department_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "club_audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_audit_logs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "club_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      club_departments: {
        Row: {
          archived_at: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          short_description: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          short_description?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          short_description?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      department_membership_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          department_membership_id: string
          id: string
          new_role: string | null
          new_status: string
          previous_role: string | null
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          department_membership_id: string
          id?: string
          new_role?: string | null
          new_status: string
          previous_role?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          department_membership_id?: string
          id?: string
          new_role?: string | null
          new_status?: string
          previous_role?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_membership_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_membership_history_department_membership_id_fkey"
            columns: ["department_membership_id"]
            isOneToOne: false
            referencedRelation: "volunteer_department_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          blood_group: string | null
          email: string
          event_id: string
          full_name: string
          id: string
          motivation: string | null
          phone: string
          registered_at: string
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          blood_group?: string | null
          email: string
          event_id: string
          full_name: string
          id?: string
          motivation?: string | null
          phone: string
          registered_at?: string
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          blood_group?: string | null
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          motivation?: string | null
          phone?: string
          registered_at?: string
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          capacity: number | null
          category: string
          created_at: string
          description: string
          end_time: string | null
          event_date: string
          id: string
          location: string
          published_at: string | null
          registration_open: boolean
          slug: string
          start_time: string | null
          status: string
          summary: string
          title: string
          updated_at: string
          volunteer_requirements: string | null
        }
        Insert: {
          banner_url?: string | null
          capacity?: number | null
          category: string
          created_at?: string
          description: string
          end_time?: string | null
          event_date: string
          id?: string
          location: string
          published_at?: string | null
          registration_open?: boolean
          slug: string
          start_time?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
          volunteer_requirements?: string | null
        }
        Update: {
          banner_url?: string | null
          capacity?: number | null
          category?: string
          created_at?: string
          description?: string
          end_time?: string | null
          event_date?: string
          id?: string
          location?: string
          published_at?: string | null
          registration_open?: boolean
          slug?: string
          start_time?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          volunteer_requirements?: string | null
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          display_order: number
          event_id: string | null
          id: string
          image_url: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          category: string
          created_at?: string
          display_order?: number
          event_id?: string | null
          id?: string
          image_url: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          display_order?: number
          event_id?: string | null
          id?: string
          image_url?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_applications: {
        Row: {
          admin_notes: string | null
          blood_group: string
          department: string
          email: string
          full_name: string
          id: string
          interested_department: string
          motivation: string
          phone: string
          reviewed_at: string | null
          skills: string | null
          status: string
          student_id: string
          submitted_at: string
          trimester: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          blood_group: string
          department: string
          email: string
          full_name: string
          id?: string
          interested_department: string
          motivation: string
          phone: string
          reviewed_at?: string | null
          skills?: string | null
          status?: string
          student_id: string
          submitted_at?: string
          trimester: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          blood_group?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          interested_department?: string
          motivation?: string
          phone?: string
          reviewed_at?: string | null
          skills?: string | null
          status?: string
          student_id?: string
          submitted_at?: string
          trimester?: string
          updated_at?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          is_pinned: boolean
          priority: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          excerpt: string
          id?: string
          is_pinned?: boolean
          priority?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          is_pinned?: boolean
          priority?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_department_memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          department_id: string
          department_role: string
          id: string
          is_primary: boolean
          membership_status: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          removal_reason: string | null
          removed_at: string | null
          removed_by: string | null
          requested_at: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          volunteer_profile_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department_id: string
          department_role?: string
          id?: string
          is_primary?: boolean
          membership_status?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          requested_at?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          volunteer_profile_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department_id?: string
          department_role?: string
          id?: string
          is_primary?: boolean
          membership_status?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          requested_at?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          volunteer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_department_memberships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_department_memberships_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "club_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_department_memberships_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_department_memberships_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_department_memberships_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_department_memberships_volunteer_profile_id_fkey"
            columns: ["volunteer_profile_id"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_platform_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role: string
          status: string
          updated_at: string
          volunteer_profile_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role: string
          status?: string
          updated_at?: string
          volunteer_profile_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          volunteer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_platform_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_platform_roles_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_platform_roles_volunteer_profile_id_fkey"
            columns: ["volunteer_profile_id"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_profiles: {
        Row: {
          academic_department: string | null
          account_status: string
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          auth_user_id: string
          blood_group: string | null
          created_at: string
          email: string
          email_normalized: string | null
          full_name: string
          id: string
          joined_at: string | null
          onboarding_status: string
          phone: string | null
          phone_normalized: string | null
          primary_department_id: string | null
          profile_photo_path: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          student_id: string | null
          student_id_normalized: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          trimester: string | null
          updated_at: string
        }
        Insert: {
          academic_department?: string | null
          account_status?: string
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          auth_user_id: string
          blood_group?: string | null
          created_at?: string
          email: string
          email_normalized?: string | null
          full_name: string
          id?: string
          joined_at?: string | null
          onboarding_status?: string
          phone?: string | null
          phone_normalized?: string | null
          primary_department_id?: string | null
          profile_photo_path?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          student_id?: string | null
          student_id_normalized?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          trimester?: string | null
          updated_at?: string
        }
        Update: {
          academic_department?: string | null
          account_status?: string
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          auth_user_id?: string
          blood_group?: string | null
          created_at?: string
          email?: string
          email_normalized?: string | null
          full_name?: string
          id?: string
          joined_at?: string | null
          onboarding_status?: string
          phone?: string | null
          phone_normalized?: string | null
          primary_department_id?: string | null
          profile_photo_path?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          student_id?: string | null
          student_id_normalized?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          trimester?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_profiles_primary_department_id_fkey"
            columns: ["primary_department_id"]
            isOneToOne: false
            referencedRelation: "club_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_profiles_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_profiles_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          previous_status: string | null
          reason: string | null
          volunteer_profile_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          previous_status?: string | null
          reason?: string | null
          volunteer_profile_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          previous_status?: string | null
          reason?: string | null
          volunteer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_status_history_volunteer_profile_id_fkey"
            columns: ["volunteer_profile_id"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      submit_volunteer_onboarding: {
        Args: {
          p_academic_department: string
          p_blood_group: string
          p_email: string
          p_full_name: string
          p_phone: string
          p_preferred_department_id: string
          p_student_id: string
          p_trimester: string
        }
        Returns: {
          department_membership_id: string
          membership_status: string
          onboarding_status: string
          volunteer_profile_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
