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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
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
          show_contact_info: boolean | null
          show_location: boolean | null
          skills: string[] | null
          status: Database["public"]["Enums"]["profile_status"] | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
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
          show_contact_info?: boolean | null
          show_location?: boolean | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
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
    }
    Views: {
      member_directory: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          email: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name: string | null
          graduation_year: number | null
          id: string | null
          interests: string[] | null
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
          skills: string[] | null
          status: Database["public"]["Enums"]["profile_status"] | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: never
          country?: never
          email?: never
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name?: string | null
          graduation_year?: number | null
          id?: string | null
          interests?: string[] | null
          last_name?: string | null
          linkedin_url?: never
          location?: never
          organization?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          phone?: never
          position?: string | null
          program?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: never
          country?: never
          email?: never
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name?: string | null
          graduation_year?: number | null
          id?: string | null
          interests?: string[] | null
          last_name?: string | null
          linkedin_url?: never
          location?: never
          organization?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          phone?: never
          position?: string | null
          program?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
      profile_status: "Active" | "Alumni" | "Student" | "Faculty" | "Inactive"
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
      ],
      profile_status: ["Active", "Alumni", "Student", "Faculty", "Inactive"],
    },
  },
} as const
