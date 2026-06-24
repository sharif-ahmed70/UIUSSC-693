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
      blood_donation_status_history: {
        Row: {
          blood_donation_id: string
          changed_at: string
          changed_by: string | null
          id: string
          metadata: Json
          new_status: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          blood_donation_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json
          new_status: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          blood_donation_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json
          new_status?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_donation_status_history_blood_donation_id_fkey"
            columns: ["blood_donation_id"]
            isOneToOne: false
            referencedRelation: "blood_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donation_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donations: {
        Row: {
          blood_match_id: string | null
          blood_request_id: string
          created_at: string
          donation_date: string | null
          donation_status: string
          donor_profile_id: string
          hospital_reference: string | null
          id: string
          rejection_reason: string | null
          reported_by: string | null
          reported_units: number
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          verified_units: number
        }
        Insert: {
          blood_match_id?: string | null
          blood_request_id: string
          created_at?: string
          donation_date?: string | null
          donation_status?: string
          donor_profile_id: string
          hospital_reference?: string | null
          id?: string
          rejection_reason?: string | null
          reported_by?: string | null
          reported_units: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          verified_units?: number
        }
        Update: {
          blood_match_id?: string | null
          blood_request_id?: string
          created_at?: string
          donation_date?: string | null
          donation_status?: string
          donor_profile_id?: string
          hospital_reference?: string | null
          id?: string
          rejection_reason?: string | null
          reported_by?: string | null
          reported_units?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          verified_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "blood_donations_blood_match_id_fkey"
            columns: ["blood_match_id"]
            isOneToOne: false
            referencedRelation: "blood_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donations_blood_request_id_fkey"
            columns: ["blood_request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donations_donor_profile_id_fkey"
            columns: ["donor_profile_id"]
            isOneToOne: false
            referencedRelation: "blood_donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donations_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donations_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donor_contacts: {
        Row: {
          alternate_phone: string | null
          contact_notes: string | null
          created_at: string
          donor_profile_id: string
          email: string | null
          id: string
          normalized_email: string | null
          normalized_phone: string | null
          phone: string | null
          preferred_contact_method: string
          updated_at: string
        }
        Insert: {
          alternate_phone?: string | null
          contact_notes?: string | null
          created_at?: string
          donor_profile_id: string
          email?: string | null
          id?: string
          normalized_email?: string | null
          normalized_phone?: string | null
          phone?: string | null
          preferred_contact_method?: string
          updated_at?: string
        }
        Update: {
          alternate_phone?: string | null
          contact_notes?: string | null
          created_at?: string
          donor_profile_id?: string
          email?: string | null
          id?: string
          normalized_email?: string | null
          normalized_phone?: string | null
          phone?: string | null
          preferred_contact_method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_donor_contacts_donor_profile_id_fkey"
            columns: ["donor_profile_id"]
            isOneToOne: true
            referencedRelation: "blood_donor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donor_duplicate_reviews: {
        Row: {
          created_at: string
          donor_profile_id: string
          id: string
          match_reason: string
          possible_duplicate_donor_id: string
          resolution_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          created_at?: string
          donor_profile_id: string
          id?: string
          match_reason: string
          possible_duplicate_donor_id: string
          resolution_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          created_at?: string
          donor_profile_id?: string
          id?: string
          match_reason?: string
          possible_duplicate_donor_id?: string
          resolution_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_donor_duplicate_reviews_donor_profile_id_fkey"
            columns: ["donor_profile_id"]
            isOneToOne: false
            referencedRelation: "blood_donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donor_duplicate_reviews_possible_duplicate_donor_id_fkey"
            columns: ["possible_duplicate_donor_id"]
            isOneToOne: false
            referencedRelation: "blood_donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donor_duplicate_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donor_profiles: {
        Row: {
          archived_at: string | null
          area: string | null
          availability_status: string
          blood_group: string
          consent_recorded_at: string | null
          consent_to_contact: boolean
          created_at: string
          display_name: string
          district: string | null
          duplicate_review_required: boolean
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          self_reported_available_from: string | null
          self_reported_last_donation_date: string | null
          source: string
          updated_at: string
          verification_status: string
          volunteer_profile_id: string | null
        }
        Insert: {
          archived_at?: string | null
          area?: string | null
          availability_status?: string
          blood_group: string
          consent_recorded_at?: string | null
          consent_to_contact?: boolean
          created_at?: string
          display_name: string
          district?: string | null
          duplicate_review_required?: boolean
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          self_reported_available_from?: string | null
          self_reported_last_donation_date?: string | null
          source?: string
          updated_at?: string
          verification_status?: string
          volunteer_profile_id?: string | null
        }
        Update: {
          archived_at?: string | null
          area?: string | null
          availability_status?: string
          blood_group?: string
          consent_recorded_at?: string | null
          consent_to_contact?: boolean
          created_at?: string
          display_name?: string
          district?: string | null
          duplicate_review_required?: boolean
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          self_reported_available_from?: string | null
          self_reported_last_donation_date?: string | null
          source?: string
          updated_at?: string
          verification_status?: string
          volunteer_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_donor_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donor_profiles_volunteer_profile_id_fkey"
            columns: ["volunteer_profile_id"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donor_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          donor_profile_id: string
          id: string
          metadata: Json
          new_status: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          donor_profile_id: string
          id?: string
          metadata?: Json
          new_status: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          donor_profile_id?: string
          id?: string
          metadata?: Json
          new_status?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_donor_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donor_status_history_donor_profile_id_fkey"
            columns: ["donor_profile_id"]
            isOneToOne: false
            referencedRelation: "blood_donor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_match_status_history: {
        Row: {
          blood_match_id: string
          changed_at: string
          changed_by: string | null
          id: string
          metadata: Json
          new_status: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          blood_match_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json
          new_status: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          blood_match_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json
          new_status?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_match_status_history_blood_match_id_fkey"
            columns: ["blood_match_id"]
            isOneToOne: false
            referencedRelation: "blood_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_match_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_matches: {
        Row: {
          blood_request_id: string
          cancellation_reason: string | null
          completed_at: string | null
          confirmation_at: string | null
          contact_authorized_at: string | null
          contact_authorized_by: string | null
          contacted_at: string | null
          contacted_by: string | null
          created_at: string
          donor_profile_id: string
          donor_response_at: string | null
          id: string
          match_status: string
          notes: string | null
          reviewed_by: string | null
          suggested_by: string | null
          updated_at: string
        }
        Insert: {
          blood_request_id: string
          cancellation_reason?: string | null
          completed_at?: string | null
          confirmation_at?: string | null
          contact_authorized_at?: string | null
          contact_authorized_by?: string | null
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string
          donor_profile_id: string
          donor_response_at?: string | null
          id?: string
          match_status?: string
          notes?: string | null
          reviewed_by?: string | null
          suggested_by?: string | null
          updated_at?: string
        }
        Update: {
          blood_request_id?: string
          cancellation_reason?: string | null
          completed_at?: string | null
          confirmation_at?: string | null
          contact_authorized_at?: string | null
          contact_authorized_by?: string | null
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string
          donor_profile_id?: string
          donor_response_at?: string | null
          id?: string
          match_status?: string
          notes?: string | null
          reviewed_by?: string | null
          suggested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_matches_blood_request_id_fkey"
            columns: ["blood_request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_matches_contact_authorized_by_fkey"
            columns: ["contact_authorized_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_matches_contacted_by_fkey"
            columns: ["contacted_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_matches_donor_profile_id_fkey"
            columns: ["donor_profile_id"]
            isOneToOne: false
            referencedRelation: "blood_donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_matches_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_matches_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_request_contacts: {
        Row: {
          alternate_phone: string | null
          blood_request_id: string
          created_at: string
          email: string | null
          id: string
          normalized_email: string | null
          normalized_phone: string
          phone: string
          preferred_contact_method: string
          requester_name: string
          updated_at: string
        }
        Insert: {
          alternate_phone?: string | null
          blood_request_id: string
          created_at?: string
          email?: string | null
          id?: string
          normalized_email?: string | null
          normalized_phone: string
          phone: string
          preferred_contact_method?: string
          requester_name: string
          updated_at?: string
        }
        Update: {
          alternate_phone?: string | null
          blood_request_id?: string
          created_at?: string
          email?: string | null
          id?: string
          normalized_email?: string | null
          normalized_phone?: string
          phone?: string
          preferred_contact_method?: string
          requester_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_request_contacts_blood_request_id_fkey"
            columns: ["blood_request_id"]
            isOneToOne: true
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_request_status_history: {
        Row: {
          blood_request_id: string
          changed_at: string
          changed_by: string | null
          id: string
          metadata: Json
          new_status: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          blood_request_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json
          new_status: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          blood_request_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json
          new_status?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_request_status_history_blood_request_id_fkey"
            columns: ["blood_request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_request_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_requests: {
        Row: {
          archived_at: string | null
          blood_group: string
          cancellation_reason: string | null
          component_type: string
          created_at: string
          district: string | null
          expires_at: string | null
          hospital_area: string | null
          hospital_name: string
          id: string
          needed_at: string
          patient_reference: string | null
          public_reference_code: string
          rejection_reason: string | null
          request_status: string
          requester_relationship: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          units_fulfilled: number
          units_requested: number
          updated_at: string
          urgency: string
        }
        Insert: {
          archived_at?: string | null
          blood_group: string
          cancellation_reason?: string | null
          component_type?: string
          created_at?: string
          district?: string | null
          expires_at?: string | null
          hospital_area?: string | null
          hospital_name: string
          id?: string
          needed_at: string
          patient_reference?: string | null
          public_reference_code?: string
          rejection_reason?: string | null
          request_status?: string
          requester_relationship?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          units_fulfilled?: number
          units_requested: number
          updated_at?: string
          urgency?: string
        }
        Update: {
          archived_at?: string | null
          blood_group?: string
          cancellation_reason?: string | null
          component_type?: string
          created_at?: string
          district?: string | null
          expires_at?: string | null
          hospital_area?: string | null
          hospital_name?: string
          id?: string
          needed_at?: string
          patient_reference?: string | null
          public_reference_code?: string
          rejection_reason?: string | null
          request_status?: string
          requester_relationship?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          units_fulfilled?: number
          units_requested?: number
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_support_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_support_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      club_positions: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_core_panel: boolean
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_core_panel?: boolean
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_core_panel?: boolean
          name?: string
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
      membership_application_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          membership_application_id: string
          new_status: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          membership_application_id: string
          new_status: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          membership_application_id?: string
          new_status?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_application_status_hi_membership_application_id_fkey"
            columns: ["membership_application_id"]
            isOneToOne: false
            referencedRelation: "membership_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
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
      volunteer_club_positions: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          club_position_id: string
          created_at: string
          ended_at: string | null
          ended_by: string | null
          id: string
          is_primary: boolean
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          term_end: string | null
          term_start: string
          updated_at: string
          volunteer_profile_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          club_position_id: string
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          is_primary?: boolean
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          term_end?: string | null
          term_start?: string
          updated_at?: string
          volunteer_profile_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          club_position_id?: string
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          is_primary?: boolean
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          term_end?: string | null
          term_start?: string
          updated_at?: string
          volunteer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_club_positions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_club_positions_club_position_id_fkey"
            columns: ["club_position_id"]
            isOneToOne: false
            referencedRelation: "club_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_club_positions_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_club_positions_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_club_positions_volunteer_profile_id_fkey"
            columns: ["volunteer_profile_id"]
            isOneToOne: false
            referencedRelation: "volunteer_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      approve_department_membership: {
        Args: { p_membership_id: string; p_reason?: string }
        Returns: {
          membership_id: string
          membership_status: string
        }[]
      }
      approve_volunteer_profile: {
        Args: { p_profile_id: string; p_reason?: string }
        Returns: {
          account_status: string
          onboarding_status: string
          profile_id: string
        }[]
      }
      archive_blood_donor: {
        Args: { p_donor_id: string; p_reason: string }
        Returns: {
          donor_profile_id: string
          verification_status: string
        }[]
      }
      archive_blood_request: {
        Args: { p_reason: string; p_request_id: string }
        Returns: {
          blood_request_id: string
          request_status: string
        }[]
      }
      archive_club_department: {
        Args: { p_department_id: string; p_reason: string }
        Returns: {
          department_id: string
          status: string
        }[]
      }
      archive_club_position: {
        Args: { p_position_id: string; p_reason: string }
        Returns: {
          position_id: string
          status: string
        }[]
      }
      assign_platform_role: {
        Args: { p_profile_id: string; p_reason: string; p_role: string }
        Returns: {
          profile_id: string
          role: string
          status: string
        }[]
      }
      assign_volunteer_club_position: {
        Args: {
          p_is_primary?: boolean
          p_position_id: string
          p_profile_id: string
          p_reason?: string
          p_term_start?: string
        }
        Returns: {
          assignment_id: string
          status: string
        }[]
      }
      authorize_blood_match_contact: {
        Args: { p_match_id: string; p_reason?: string }
        Returns: {
          match_id: string
          match_status: string
        }[]
      }
      blood_department_id: { Args: never; Returns: string }
      can_manage_blood_donors: { Args: never; Returns: boolean }
      can_manage_blood_matches: { Args: never; Returns: boolean }
      can_manage_blood_requests: { Args: never; Returns: boolean }
      can_manage_blood_settings: { Args: never; Returns: boolean }
      can_manage_departments: { Args: never; Returns: boolean }
      can_manage_platform_roles: { Args: never; Returns: boolean }
      can_manage_volunteers: { Args: never; Returns: boolean }
      can_review_membership_applications: { Args: never; Returns: boolean }
      can_verify_blood_donations: { Args: never; Returns: boolean }
      can_view_audit_logs: { Args: never; Returns: boolean }
      can_view_blood_operations: { Args: never; Returns: boolean }
      change_blood_donor_availability: {
        Args: { p_donor_id: string; p_new_status: string; p_reason?: string }
        Returns: {
          availability_status: string
          donor_profile_id: string
        }[]
      }
      change_blood_match_status: {
        Args: { p_match_id: string; p_new_status: string; p_reason?: string }
        Returns: {
          match_id: string
          match_status: string
        }[]
      }
      change_blood_request_status: {
        Args: { p_new_status: string; p_reason?: string; p_request_id: string }
        Returns: {
          blood_request_id: string
          request_status: string
        }[]
      }
      change_department_role: {
        Args: {
          p_department_role: string
          p_membership_id: string
          p_reason: string
        }
        Returns: {
          department_role: string
          membership_id: string
        }[]
      }
      change_primary_club_position: {
        Args: { p_assignment_id: string; p_reason?: string }
        Returns: {
          assignment_id: string
          is_primary: boolean
        }[]
      }
      complete_volunteer_club_position: {
        Args: {
          p_assignment_id: string
          p_reason?: string
          p_term_end?: string
        }
        Returns: {
          assignment_id: string
          status: string
        }[]
      }
      create_blood_match: {
        Args: { p_donor_id: string; p_notes?: string; p_request_id: string }
        Returns: {
          match_id: string
          match_status: string
        }[]
      }
      create_club_department: {
        Args: {
          p_display_order?: number
          p_name: string
          p_short_description?: string
          p_slug: string
        }
        Returns: {
          department_id: string
          slug: string
        }[]
      }
      create_club_position: {
        Args: {
          p_description?: string
          p_display_order?: number
          p_is_core_panel?: boolean
          p_name: string
          p_slug: string
        }
        Returns: {
          position_id: string
          slug: string
        }[]
      }
      current_volunteer_profile_id: { Args: never; Returns: string }
      generate_blood_request_reference: { Args: never; Returns: string }
      get_authorized_blood_match_contacts: {
        Args: { p_match_id: string }
        Returns: {
          blood_request_id: string
          donor_email: string
          donor_phone: string
          donor_preferred_contact_method: string
          donor_profile_id: string
          match_id: string
          requester_email: string
          requester_name: string
          requester_phone: string
          requester_preferred_contact_method: string
        }[]
      }
      has_active_department_role: {
        Args: { allowed_roles: string[]; target_department_id: string }
        Returns: boolean
      }
      has_active_platform_role: {
        Args: { role_name: string }
        Returns: boolean
      }
      has_any_active_platform_role: {
        Args: { role_names: string[] }
        Returns: boolean
      }
      has_blood_department_role: {
        Args: { allowed_roles: string[] }
        Returns: boolean
      }
      is_active_approved_volunteer: { Args: never; Returns: boolean }
      is_blood_department_member: { Args: never; Returns: boolean }
      recalculate_blood_request_fulfilment: {
        Args: { p_request_id: string }
        Returns: {
          blood_request_id: string
          request_status: string
          units_fulfilled: number
        }[]
      }
      record_blood_donation: {
        Args: {
          p_donation_date?: string
          p_donor_id: string
          p_hospital_reference?: string
          p_match_id: string
          p_reported_units: number
          p_request_id: string
        }
        Returns: {
          donation_id: string
          donation_status: string
        }[]
      }
      reject_department_membership: {
        Args: { p_membership_id: string; p_reason: string }
        Returns: {
          membership_id: string
          membership_status: string
        }[]
      }
      reject_volunteer_profile: {
        Args: { p_profile_id: string; p_reason: string }
        Returns: {
          account_status: string
          onboarding_status: string
          profile_id: string
        }[]
      }
      remove_department_membership: {
        Args: { p_membership_id: string; p_reason: string }
        Returns: {
          membership_id: string
          membership_status: string
        }[]
      }
      restore_volunteer_profile: {
        Args: { p_profile_id: string; p_reason: string }
        Returns: {
          account_status: string
          profile_id: string
        }[]
      }
      review_blood_donor: {
        Args: { p_donor_id: string; p_new_status: string; p_reason?: string }
        Returns: {
          donor_profile_id: string
          verification_status: string
        }[]
      }
      review_blood_request: {
        Args: { p_new_status: string; p_reason?: string; p_request_id: string }
        Returns: {
          blood_request_id: string
          request_status: string
        }[]
      }
      review_department_membership: {
        Args: { p_membership_id: string; p_reason?: string; p_status: string }
        Returns: {
          membership_id: string
          membership_status: string
        }[]
      }
      review_membership_application: {
        Args: {
          p_admin_notes?: string
          p_application_id: string
          p_reason?: string
          p_status: string
        }
        Returns: {
          application_id: string
          status: string
        }[]
      }
      revoke_platform_role: {
        Args: { p_platform_role_id: string; p_reason: string }
        Returns: {
          platform_role_id: string
          status: string
        }[]
      }
      revoke_volunteer_club_position: {
        Args: { p_assignment_id: string; p_reason: string }
        Returns: {
          assignment_id: string
          status: string
        }[]
      }
      set_primary_department: {
        Args: { p_membership_id: string; p_reason?: string }
        Returns: {
          primary_department_id: string
          profile_id: string
        }[]
      }
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
      suspend_department_membership: {
        Args: { p_membership_id: string; p_reason: string }
        Returns: {
          membership_id: string
          membership_status: string
        }[]
      }
      suspend_volunteer_profile: {
        Args: { p_profile_id: string; p_reason: string }
        Returns: {
          account_status: string
          profile_id: string
        }[]
      }
      update_club_department: {
        Args: {
          p_department_id: string
          p_display_order: number
          p_name: string
          p_reason?: string
          p_short_description: string
          p_slug: string
          p_status: string
        }
        Returns: {
          department_id: string
          slug: string
          status: string
        }[]
      }
      update_club_position: {
        Args: {
          p_description: string
          p_display_order: number
          p_is_core_panel: boolean
          p_name: string
          p_position_id: string
          p_reason?: string
          p_slug: string
          p_status: string
        }
        Returns: {
          position_id: string
          slug: string
          status: string
        }[]
      }
      verify_blood_donation: {
        Args: {
          p_donation_id: string
          p_new_status?: string
          p_reason?: string
          p_verified_units: number
        }
        Returns: {
          donation_id: string
          donation_status: string
          verified_units: number
        }[]
      }
      write_club_audit_log: {
        Args: {
          p_action: string
          p_department_id: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: string
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
