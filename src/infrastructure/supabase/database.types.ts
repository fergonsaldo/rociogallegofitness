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

// ── coach_athletes ────────────────────────────────────────────────────────────
export type ClientStatus = 'active' | 'archived';

export interface CoachAthleteRow {
  coach_id:    string;
  athlete_id:  string;
  assigned_at: string;
  status:      ClientStatus;
}

// ── coach_exercises ───────────────────────────────────────────────────────────
// Append this block to the Tables object in Database['public']['Tables']
// (kept separate to avoid regenerating the full file)
export interface CoachExerciseRow {
  id:                string;
  coach_id:          string;
  name:              string;
  category:          'strength' | 'cardio' | 'flexibility' | 'isometric';
  primary_muscles:   string[];
  secondary_muscles: string[];
  is_isometric:      boolean;
  description:       string | null;
  video_url:         string | null;
  created_at:        string;
}

export type CoachExerciseInsert = Omit<CoachExerciseRow, 'id' | 'created_at'>;

// ── body_metrics ──────────────────────────────────────────────────────────────
export interface BodyMetricRow {
  id:               string;
  athlete_id:       string;
  recorded_at:      string;
  weight_kg:        number | null;
  waist_cm:         number | null;
  hip_cm:           number | null;
  body_fat_percent: number | null;
  notes:            string | null;
  created_at:       string;
}
export type BodyMetricInsert = Omit<BodyMetricRow, 'id' | 'created_at'>;

// ── progress_photos ───────────────────────────────────────────────────────────
export interface ProgressPhotoRow {
  id:           string;
  athlete_id:   string;
  taken_at:     string;
  tag:          'front' | 'back' | 'side';
  notes:        string | null;
  storage_path: string;
  // public_url removed — bucket is private, signed URLs are generated at read time
  created_at:   string;
}
export type ProgressPhotoInsert = Omit<ProgressPhotoRow, 'id' | 'created_at'>;

// ── client_tags ───────────────────────────────────────────────────────────────
export interface ClientTagRow {
  id:         string;
  coach_id:   string;
  name:       string;
  color:      string;
  created_at: string;
}
export type ClientTagInsert = Omit<ClientTagRow, 'id' | 'created_at'>;
export type ClientTagUpdate = Partial<Pick<ClientTagRow, 'name' | 'color'>>;

// ── athlete_tags ──────────────────────────────────────────────────────────────
export interface AthleteTagRow {
  tag_id:      string;
  athlete_id:  string;
  assigned_at: string;
}

// ── coach_sessions ────────────────────────────────────────────────────────────
export interface CoachSessionRow {
  id:               string;
  coach_id:         string;
  athlete_id:       string | null;
  title:            string | null;
  session_type:     string;
  modality:         'online' | 'in_person';
  scheduled_at:     string;
  duration_minutes: number;
  notes:            string | null;
  created_at:       string;
}
export type CoachSessionInsert = Omit<CoachSessionRow, 'id' | 'created_at'>;

// ── session_activity_log ──────────────────────────────────────────────────────
export interface SessionActivityLogRow {
  id:           string;
  coach_id:     string;
  session_id:   string | null;
  action:       'created' | 'deleted';
  title:        string | null;
  session_type: string | null;
  modality:     string | null;
  scheduled_at: string | null;
  logged_at:    string;
}
export type SessionActivityLogInsert = Omit<SessionActivityLogRow, 'id' | 'logged_at'>;

// ── schedules ─────────────────────────────────────────────────────────────────
export interface ScheduleRow {
  id:                   string;
  coach_id:             string;
  title:                string;
  start_date:           string;
  end_date:             string;
  start_time:           string;
  end_time:             string;
  slot_duration_minutes: number;
  modality:             'online' | 'in_person';
  is_active:            boolean;
  created_at:           string;
}
export type ScheduleInsert = Omit<ScheduleRow, 'id' | 'created_at'>;

// ── session_types ─────────────────────────────────────────────────────────────
export interface SessionTypeRow {
  id:         string;
  coach_id:   string;
  name:       string;
  color:      string;
  created_at: string;
}
export type SessionTypeInsert = Omit<SessionTypeRow, 'id' | 'created_at'>;
export type SessionTypeUpdate = Partial<Pick<SessionTypeRow, 'name' | 'color'>>;

// ── conversations ─────────────────────────────────────────────────────────────
export interface ConversationRow {
  id:         string;
  coach_id:   string;
  athlete_id: string;
  created_at: string;
}
export type ConversationInsert = Omit<ConversationRow, 'id' | 'created_at'>;

// ── messages ──────────────────────────────────────────────────────────────────
export interface MessageRow {
  id:              string;
  conversation_id: string;
  sender_id:       string;
  body:            string;
  sent_at:         string;
  read_at:         string | null;
}
export type MessageInsert = Omit<MessageRow, 'id' | 'sent_at'>;

export interface CoachPreferencesRow {
  coach_id:     string;
  quick_access: string[];
  updated_at:   string;
}
export type CoachPreferencesUpsert = Pick<CoachPreferencesRow, 'coach_id' | 'quick_access'>;

// ── tag_automations ───────────────────────────────────────────────────────────
export interface TagAutomationRow {
  id:                string;
  tag_id:            string;
  routine_id:        string | null;
  cardio_id:         string | null;
  nutrition_plan_id: string | null;
  created_at:        string;
}
export type TagAutomationInsert = Omit<TagAutomationRow, 'id' | 'created_at'>;
export type TagAutomationUpdate = Partial<TagAutomationInsert>;

// ── coach_groups ──────────────────────────────────────────────────────────────
export interface CoachGroupRow {
  id:          string;
  coach_id:    string;
  name:        string;
  description: string | null;
  created_at:  string;
}
export type CoachGroupInsert = Omit<CoachGroupRow, 'id' | 'created_at'>;
export type CoachGroupUpdate = Partial<Pick<CoachGroupRow, 'name' | 'description'>>;

// ── group_members ─────────────────────────────────────────────────────────────
export interface GroupMemberRow {
  group_id:   string;
  athlete_id: string;
  added_at:   string;
}
