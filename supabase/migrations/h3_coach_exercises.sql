-- ─────────────────────────────────────────────────────────────────────────────
-- Historia 3: Ejercicios personalizados del coach
-- Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coach_exercises (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id          uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  category          exercise_category NOT NULL,
  primary_muscles   text[]      NOT NULL,
  secondary_muscles text[]      NOT NULL DEFAULT '{}',
  is_isometric      boolean     NOT NULL DEFAULT false,
  description       text        CHECK (char_length(description) <= 500),
  video_url         text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Índice para acelerar las consultas por coach
CREATE INDEX IF NOT EXISTS idx_coach_exercises_coach_id
  ON coach_exercises (coach_id);

-- RLS: cada coach solo gestiona sus propios ejercicios
ALTER TABLE coach_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manages_own_exercises"
  ON coach_exercises
  FOR ALL
  TO authenticated
  USING  (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
