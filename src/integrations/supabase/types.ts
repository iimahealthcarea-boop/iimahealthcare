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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          domain: string | null
          id: string
          is_verified: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          created_at: string
          email: string | null
          expires_at: string
          id: string
          otp_code: string
          phone: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          otp_code: string
          phone?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          phone?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          approval_status:
            | Database["public"]["Enums"]["profile_approval_status"]
            | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          change_history: Json | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name: string | null
          graduation_year: number | null
          id: string
          interests: string[] | null
          is_public: boolean | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          organization: string | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          phone: string | null
          position: string | null
          program: string | null
          rejection_reason: string | null
          show_contact_info: boolean | null
          show_location: boolean | null
          skills: string[] | null
          status: Database["public"]["Enums"]["profile_status"] | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          approval_status?:
            | Database["public"]["Enums"]["profile_approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          change_history?: Json | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          is_public?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          organization?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          phone?: string | null
          position?: string | null
          program?: string | null
          rejection_reason?: string | null
          show_contact_info?: boolean | null
          show_location?: boolean | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          approval_status?:
            | Database["public"]["Enums"]["profile_approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          change_history?: Json | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          is_public?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          organization?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          phone?: string | null
          position?: string | null
          program?: string | null
          rejection_reason?: string | null
          show_contact_info?: boolean | null
          show_location?: boolean | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_directory: {
        Row: {
          created_at: string
          id: string
          member_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_directory_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_changes: {
        Row: {
          id: string
          profile_user_id: string
          changed_by: string
          changed_by_name: string
          changed_at: string
          change_type: string
          changed_fields: Json
          created_at: string
        }
        Insert: {
          id?: string
          profile_user_id: string
          changed_by: string
          changed_by_name: string
          changed_at?: string
          change_type: string
          changed_fields?: Json
          created_at?: string
        }
        Update: {
          id?: string
          profile_user_id?: string
          changed_by?: string
          changed_by_name?: string
          changed_at?: string
          change_type?: string
          changed_fields?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_changes_profile_user_id_fkey"
            columns: ["profile_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_changes_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user_profile: {
        Args: { profile_user_id: string }
        Returns: undefined
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_user_approved: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      reject_user_profile: {
        Args: { profile_user_id: string; reason?: string }
        Returns: undefined
      }
      add_profile_change: {
        Args: { 
          profile_user_id: string
          changed_by: string
          changed_by_name: string
          changed_fields: Json
          change_type?: string
        }
        Returns: string
      }
      get_profile_changes: {
        Args: { profile_user_id: string }
        Returns: {
          id: string
          changed_by: string
          changed_by_name: string
          changed_at: string
          change_type: string
          changed_fields: Json
        }[]
      }
      get_user_name: {
        Args: { user_id: string }
        Returns: string
      }
    }
    Enums: {
      experience_level:
        | "Entry Level"
        | "Mid Level"
        | "Senior Level"
        | "Executive"
        | "Student"
        | "Recent Graduate"
      organization_type:
        | "Corporate"
        | "Startup"
        | "Non-Profit"
        | "Government"
        | "Consulting"
        | "Education"
        | "Healthcare"
        | "Technology"
        | "Finance"
        | "Other"
        | "Hospital/Clinic"
        | "HealthTech"
        | "Pharmaceutical"
        | "Biotech"
        | "Medical Devices"
        | "Public Health/Policy"
        | "Health Insurance"
        | "Academic/Research"
        | "VC"
      profile_approval_status: "pending" | "approved" | "rejected"
      profile_status: "Active" | "Alumni" | "Student" | "Faculty" | "Inactive"
      user_role: "admin" | "normal_user"
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
      experience_level: [
        "Entry Level",
        "Mid Level",
        "Senior Level",
        "Executive",
        "Student",
        "Recent Graduate",
      ],
      organization_type: [
        "Corporate",
        "Startup",
        "Non-Profit",
        "Government",
        "Consulting",
        "Education",
        "Healthcare",
        "Technology",
        "Finance",
        "Other",
        "Hospital/Clinic",
        "HealthTech",
        "Pharmaceutical",
        "Biotech",
        "Medical Devices",
        "Public Health/Policy",
        "Health Insurance",
        "Academic/Research",
        "VC",
      ],
      profile_approval_status: ["pending", "approved", "rejected"],
      profile_status: ["Active", "Alumni", "Student", "Faculty", "Inactive"],
      user_role: ["admin", "normal_user"],
    },
  },
} as const
