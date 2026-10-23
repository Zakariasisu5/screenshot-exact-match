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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          details: Json | null
          id: string
          reason: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          reason?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          reason?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couriers: {
        Row: {
          active: boolean
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          staff_profile_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          staff_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          staff_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couriers_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customs_records: {
        Row: {
          cleared_at: string | null
          created_at: string
          hold_reason: string | null
          id: string
          notes: string | null
          recorded_by: string | null
          shipment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cleared_at?: string | null
          created_at?: string
          hold_reason?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          shipment_id: string
          status: string
          updated_at?: string
        }
        Update: {
          cleared_at?: string | null
          created_at?: string
          hold_reason?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          shipment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customs_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customs_records_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "public_tracking_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customs_records_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          city: string
          code: string
          country: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          updated_at: string
        }
        Insert: {
          city: string
          code: string
          country: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          city?: string
          code?: string
          country?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      proof_of_delivery: {
        Row: {
          created_at: string
          delivered_at: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          photo_url: string | null
          received_by_name: string | null
          recorded_by: string | null
          shipment_id: string
          signature_url: string | null
        }
        Insert: {
          created_at?: string
          delivered_at: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          photo_url?: string | null
          received_by_name?: string | null
          recorded_by?: string | null
          shipment_id: string
          signature_url?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          photo_url?: string | null
          received_by_name?: string | null
          recorded_by?: string | null
          shipment_id?: string
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proof_of_delivery_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_of_delivery_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "public_tracking_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_of_delivery_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_events: {
        Row: {
          country: string | null
          created_at: string
          description: string
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          latitude: number | null
          location: string | null
          longitude: number | null
          occurred_at: string
          reason: string | null
          recorded_by: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"] | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description: string
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          occurred_at: string
          reason?: string | null
          recorded_by?: string | null
          shipment_id: string
          status?: Database["public"]["Enums"]["shipment_status"] | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          occurred_at?: string
          reason?: string | null
          recorded_by?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "public_tracking_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_legs: {
        Row: {
          arrived_at: string | null
          created_at: string
          departed_at: string | null
          destination_facility_id: string | null
          id: string
          leg_sequence: number
          origin_facility_id: string | null
          shipment_id: string
          status: string
          transport_mode: string
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          created_at?: string
          departed_at?: string | null
          destination_facility_id?: string | null
          id?: string
          leg_sequence: number
          origin_facility_id?: string | null
          shipment_id: string
          status?: string
          transport_mode?: string
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          created_at?: string
          departed_at?: string | null
          destination_facility_id?: string | null
          id?: string
          leg_sequence?: number
          origin_facility_id?: string | null
          shipment_id?: string
          status?: string
          transport_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_legs_destination_facility_id_fkey"
            columns: ["destination_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_legs_origin_facility_id_fkey"
            columns: ["origin_facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_legs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "public_tracking_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_legs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_notification_outbox: {
        Row: {
          attempt_count: number
          attempts_in_cycle: number
          test_mode: boolean
          created_at: string
          delivery_status: string
          destination_city: string | null
          destination_country: string | null
          error_message: string | null
          estimated_delivery_at: string | null
          event_at: string
          event_description: string | null
          event_type: string
          id: string
          last_attempt_at: string | null
          location: string | null
          locked_until: string | null
          new_status: Database["public"]["Enums"]["shipment_status"]
          next_retry_at: string | null
          origin_city: string | null
          origin_country: string | null
          parcel_description: string | null
          previous_status: Database["public"]["Enums"]["shipment_status"] | null
          provider_message_id: string | null
          provider_status: string | null
          recipient_email: string | null
          recipient_name: string | null
          sender_name: string | null
          sent_at: string | null
          shipment_created_at: string
          shipment_id: string | null
          source_event_id: string | null
          tracking_number: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          attempts_in_cycle?: number
          test_mode?: boolean
          created_at?: string
          delivery_status?: string
          destination_city?: string | null
          destination_country?: string | null
          error_message?: string | null
          estimated_delivery_at?: string | null
          event_at: string
          event_description?: string | null
          event_type: string
          id?: string
          last_attempt_at?: string | null
          location?: string | null
          locked_until?: string | null
          new_status: Database["public"]["Enums"]["shipment_status"]
          next_retry_at?: string
          origin_city?: string | null
          origin_country?: string | null
          parcel_description?: string | null
          previous_status?:
            | Database["public"]["Enums"]["shipment_status"]
            | null
          provider_message_id?: string | null
          provider_status?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sender_name?: string | null
          sent_at?: string | null
          shipment_created_at: string
          shipment_id?: string | null
          source_event_id?: string | null
          tracking_number: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          attempts_in_cycle?: number
          test_mode?: boolean
          created_at?: string
          delivery_status?: string
          destination_city?: string | null
          destination_country?: string | null
          error_message?: string | null
          estimated_delivery_at?: string | null
          event_at?: string
          event_description?: string | null
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          location?: string | null
          locked_until?: string | null
          new_status?: Database["public"]["Enums"]["shipment_status"]
          next_retry_at?: string
          origin_city?: string | null
          origin_country?: string | null
          parcel_description?: string | null
          previous_status?:
            | Database["public"]["Enums"]["shipment_status"]
            | null
          provider_message_id?: string | null
          provider_status?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sender_name?: string | null
          sent_at?: string | null
          shipment_created_at?: string
          shipment_id?: string | null
          source_event_id?: string | null
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_notification_outbox_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "public_tracking_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_notification_outbox_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_notification_outbox_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "public_tracking_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_notification_outbox_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "shipment_events"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_notification_webhook_events: {
        Row: {
          event_type: string
          provider_event_id: string
          received_at: string
        }
        Insert: {
          event_type: string
          provider_event_id: string
          received_at?: string
        }
        Update: {
          event_type?: string
          provider_event_id?: string
          received_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          assigned_courier_id: string | null
          assigned_vehicle_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customs_status: string | null
          declared_value: number | null
          destination_city: string
          destination_country: string
          estimated_delivery_at: string | null
          height_cm: number | null
          id: string
          is_demo: boolean
          last_event_at: string | null
          length_cm: number | null
          notes_internal: string | null
          origin_city: string
          origin_country: string
          parcel_description: string | null
          pieces: number
          recipient_company: string | null
          recipient_email: string | null
          recipient_name: string
          recipient_phone: string | null
          sender_company: string | null
          sender_email: string | null
          sender_name: string
          sender_phone: string | null
          service_type: string
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string
          updated_at: string
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          assigned_courier_id?: string | null
          assigned_vehicle_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customs_status?: string | null
          declared_value?: number | null
          destination_city: string
          destination_country: string
          estimated_delivery_at?: string | null
          height_cm?: number | null
          id?: string
          is_demo?: boolean
          last_event_at?: string | null
          length_cm?: number | null
          notes_internal?: string | null
          origin_city: string
          origin_country: string
          parcel_description?: string | null
          pieces?: number
          recipient_company?: string | null
          recipient_email?: string | null
          recipient_name: string
          recipient_phone?: string | null
          sender_company?: string | null
          sender_email?: string | null
          sender_name: string
          sender_phone?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          assigned_courier_id?: string | null
          assigned_vehicle_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customs_status?: string | null
          declared_value?: number | null
          destination_city?: string
          destination_country?: string
          estimated_delivery_at?: string | null
          height_cm?: number | null
          id?: string
          is_demo?: boolean
          last_event_at?: string | null
          length_cm?: number | null
          notes_internal?: string | null
          origin_city?: string
          origin_country?: string
          parcel_description?: string | null
          pieces?: number
          recipient_company?: string | null
          recipient_email?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          sender_company?: string | null
          sender_email?: string | null
          sender_name?: string
          sender_phone?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_assigned_courier_id_fkey"
            columns: ["assigned_courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      status_transitions: {
        Row: {
          from_status: Database["public"]["Enums"]["shipment_status"]
          to_status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          from_status: Database["public"]["Enums"]["shipment_status"]
          to_status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          from_status?: Database["public"]["Enums"]["shipment_status"]
          to_status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          courier_id: string
          created_at: string
          id: string
          plate: string
          status: string
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          courier_id: string
          created_at?: string
          id?: string
          plate: string
          status?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          courier_id?: string
          created_at?: string
          id?: string
          plate?: string
          status?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_tracking_events: {
        Row: {
          country: string | null
          description: string | null
          id: string | null
          kind: string | null
          location: string | null
          occurred_at: string | null
          shipment_id: string | null
          status: string | null
        }
        Insert: {
          country?: string | null
          description?: string | null
          id?: string | null
          kind?: never
          location?: string | null
          occurred_at?: string | null
          shipment_id?: string | null
          status?: never
        }
        Update: {
          country?: string | null
          description?: string | null
          id?: string | null
          kind?: never
          location?: string | null
          occurred_at?: string | null
          shipment_id?: string | null
          status?: never
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "public_tracking_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      public_tracking_shipments: {
        Row: {
          created_at: string | null
          customs_status: string | null
          destination_city: string | null
          destination_country: string | null
          estimated_delivery_at: string | null
          id: string | null
          is_demo: boolean | null
          last_event_at: string | null
          origin_city: string | null
          origin_country: string | null
          pieces: number | null
          service_type: string | null
          status: string | null
          tracking_number: string | null
        }
        Insert: {
          created_at?: string | null
          customs_status?: string | null
          destination_city?: string | null
          destination_country?: string | null
          estimated_delivery_at?: string | null
          id?: string | null
          is_demo?: boolean | null
          last_event_at?: string | null
          origin_city?: string | null
          origin_country?: string | null
          pieces?: number | null
          service_type?: string | null
          status?: never
          tracking_number?: string | null
        }
        Update: {
          created_at?: string | null
          customs_status?: string | null
          destination_city?: string | null
          destination_country?: string | null
          estimated_delivery_at?: string | null
          id?: string | null
          is_demo?: boolean | null
          last_event_at?: string | null
          origin_city?: string | null
          origin_country?: string | null
          pieces?: number | null
          service_type?: string | null
          status?: never
          tracking_number?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_first_super_admin: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      claim_shipment_notifications: {
        Args: { p_batch_size?: number; p_lease_seconds?: number }
        Returns: {
          attempt_count: number
          created_at: string
          delivery_status: string
          destination_city: string | null
          destination_country: string | null
          error_message: string | null
          estimated_delivery_at: string | null
          event_at: string
          event_description: string | null
          event_type: string
          id: string
          last_attempt_at: string | null
          location: string | null
          locked_until: string | null
          new_status: Database["public"]["Enums"]["shipment_status"]
          next_retry_at: string
          origin_city: string | null
          origin_country: string | null
          parcel_description: string | null
          previous_status: Database["public"]["Enums"]["shipment_status"] | null
          provider_message_id: string | null
          provider_status: string | null
          recipient_email: string | null
          recipient_name: string | null
          sender_name: string | null
          sent_at: string | null
          shipment_created_at: string
          shipment_id: string | null
          source_event_id: string | null
          tracking_number: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "shipment_notification_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_tracking_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["staff_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_resend_notification_webhook: {
        Args: {
          p_event_type: string
          p_provider_event_id: string
          p_provider_message_id: string
        }
        Returns: boolean
      }
      record_shipment_event: {
        Args: {
          p_country?: string
          p_description?: string
          p_kind?: Database["public"]["Enums"]["event_kind"]
          p_latitude?: number
          p_location?: string
          p_longitude?: number
          p_occurred_at?: string
          p_reason?: string
          p_shipment_id: string
          p_status: Database["public"]["Enums"]["shipment_status"]
        }
        Returns: string
      }
      request_shipment_notification_retry: {
        Args: { p_notification_id: string }
        Returns: string
      }
    }
    Enums: {
      event_kind: "verified" | "estimate" | "customs" | "internal"
      shipment_status:
        | "shipment_registered"
        | "pickup_scheduled"
        | "collected"
        | "at_origin_facility"
        | "ready_for_dispatch"
        | "in_transit"
        | "arrived_in_destination_country"
        | "customs_clearance"
        | "customs_hold"
        | "at_destination_facility"
        | "out_for_delivery"
        | "delivery_attempted"
        | "delivered"
        | "exception"
        | "returned_to_sender"
        | "delayed"
        | "cancelled"
      staff_role: "super_admin" | "operations_manager" | "courier"
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
      event_kind: ["verified", "estimate", "customs", "internal"],
      shipment_status: [
        "shipment_registered",
        "pickup_scheduled",
        "collected",
        "at_origin_facility",
        "ready_for_dispatch",
        "in_transit",
        "arrived_in_destination_country",
        "customs_clearance",
        "customs_hold",
        "at_destination_facility",
        "out_for_delivery",
        "delivery_attempted",
        "delivered",
        "exception",
        "returned_to_sender",
        "delayed",
        "cancelled",
      ],
      staff_role: ["super_admin", "operations_manager", "courier"],
    },
  },
} as const
