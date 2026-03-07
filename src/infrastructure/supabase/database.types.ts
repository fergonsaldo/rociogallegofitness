/**
 * TypeScript types matching the Supabase database schema.
 * These mirror the SQL tables for use in the infrastructure layer.
 *
 * To regenerate automatically after schema changes run:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/infrastructure/supabase/database.types.ts
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'coach' | 'athlete';
          weight_unit: 'kg' | 'lb';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      workout_sessions: {
        Row: {
          id: string;
          athlete_id: string;
          routine_id: string | null;
          routine_day_id: string | null;
          status: 'active' | 'completed' | 'abandoned';
          notes: string | null;
          started_at: string;
          finished_at: string | null;
          synced_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };
      exercise_sets: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          set_type: 'reps' | 'isometric';
          reps: number | null;
          weight_kg: number | null;
          duration_seconds: number | null;
          rest_after_seconds: number;
          completed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercise_sets']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['exercise_sets']['Insert']>;
      };
      routines: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          description: string | null;
          duration_weeks: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['routines']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['routines']['Insert']>;
      };
      nutrition_plans: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          name: string;
          daily_calories: number;
          daily_protein_g: number;
          daily_carbs_g: number;
          daily_fat_g: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['nutrition_plans']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['nutrition_plans']['Insert']>;
      };
    };
  };
};
