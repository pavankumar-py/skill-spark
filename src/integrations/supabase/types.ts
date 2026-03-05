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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anticheat_logs: {
        Row: {
          candidate_id: string
          created_at: string
          details: string | null
          event_type: string
          id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          details?: string | null
          event_type: string
          id?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          details?: string | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anticheat_logs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          allow_execution: boolean | null
          anti_cheat: boolean | null
          aptitude_count: number | null
          aptitude_difficulty: string | null
          coding_count: number | null
          coding_difficulty: string | null
          coding_topics: string[] | null
          company_id: string
          created_at: string
          duration_minutes: number | null
          experience_level: string | null
          id: string
          role: string
          status: string
          tech_stack: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_execution?: boolean | null
          anti_cheat?: boolean | null
          aptitude_count?: number | null
          aptitude_difficulty?: string | null
          coding_count?: number | null
          coding_difficulty?: string | null
          coding_topics?: string[] | null
          company_id: string
          created_at?: string
          duration_minutes?: number | null
          experience_level?: string | null
          id?: string
          role: string
          status?: string
          tech_stack?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_execution?: boolean | null
          anti_cheat?: boolean | null
          aptitude_count?: number | null
          aptitude_difficulty?: string | null
          coding_count?: number | null
          coding_difficulty?: string | null
          coding_topics?: string[] | null
          company_id?: string
          created_at?: string
          duration_minutes?: number | null
          experience_level?: string | null
          id?: string
          role?: string
          status?: string
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_responses: {
        Row: {
          answer_index: number | null
          candidate_id: string
          code_answer: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          language: string | null
          question_id: string
        }
        Insert: {
          answer_index?: number | null
          candidate_id: string
          code_answer?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          language?: string | null
          question_id: string
        }
        Update: {
          answer_index?: number | null
          candidate_id?: string
          code_answer?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          language?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_responses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_scores: {
        Row: {
          ai_summary: string | null
          aptitude_score: number | null
          candidate_id: string
          coding_score: number | null
          created_at: string
          id: string
          total_score: number | null
        }
        Insert: {
          ai_summary?: string | null
          aptitude_score?: number | null
          candidate_id: string
          coding_score?: number | null
          created_at?: string
          id?: string
          total_score?: number | null
        }
        Update: {
          ai_summary?: string | null
          aptitude_score?: number | null
          candidate_id?: string
          coding_score?: number | null
          created_at?: string
          id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_scores_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          assessment_id: string
          completed_at: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          assessment_id: string
          completed_at?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          assessment_id?: string
          completed_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_name: string
          created_at: string
          employee_count: string | null
          hiring_role: string | null
          id: string
          industry: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          employee_count?: string | null
          hiring_role?: string | null
          id?: string
          industry?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          employee_count?: string | null
          hiring_role?: string | null
          id?: string
          industry?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          assessment_id: string
          coding_description: string | null
          coding_difficulty: string | null
          coding_title: string | null
          coding_topic: string | null
          correct_answer: number | null
          created_at: string
          id: string
          options: Json | null
          question_text: string
          sort_order: number | null
          starter_code: Json | null
          test_cases: Json | null
          type: string
        }
        Insert: {
          assessment_id: string
          coding_description?: string | null
          coding_difficulty?: string | null
          coding_title?: string | null
          coding_topic?: string | null
          correct_answer?: number | null
          created_at?: string
          id?: string
          options?: Json | null
          question_text: string
          sort_order?: number | null
          starter_code?: Json | null
          test_cases?: Json | null
          type: string
        }
        Update: {
          assessment_id?: string
          coding_description?: string | null
          coding_difficulty?: string | null
          coding_title?: string | null
          coding_topic?: string | null
          correct_answer?: number | null
          created_at?: string
          id?: string
          options?: Json | null
          question_text?: string
          sort_order?: number | null
          starter_code?: Json | null
          test_cases?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
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
  public: {
    Enums: {},
  },
} as const
