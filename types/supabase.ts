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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
