-- ═══════════════════════════════════════════════════════════════
-- Migración: Métricas corporales y fotos de progreso
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. body_metrics ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS body_metrics (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_at      timestamptz  NOT NULL,
  weight_kg        numeric(6,2) CHECK (weight_kg        >  0 AND weight_kg        <= 500),
  waist_cm         numeric(5,1) CHECK (waist_cm         >  0 AND waist_cm         <= 300),
  hip_cm           numeric(5,1) CHECK (hip_cm           >  0 AND hip_cm           <= 300),
  body_fat_percent numeric(4,1) CHECK (body_fat_percent >= 1 AND body_fat_percent <= 70),
  notes            text         CHECK (char_length(notes) <= 300),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT at_least_one_metric CHECK (
    weight_kg IS NOT NULL OR waist_cm IS NOT NULL OR
    hip_cm    IS NOT NULL OR body_fat_percent IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_athlete_id
  ON body_metrics (athlete_id, recorded_at);

ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;

-- El atleta gestiona sus propias métricas
CREATE POLICY "athlete_manages_own_body_metrics"
  ON body_metrics FOR ALL TO authenticated
  USING  (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

-- El coach puede leer las métricas de sus atletas
-- (routine_assignments solo tiene athlete_id; el coach se llega via routines)
CREATE POLICY "coach_reads_athlete_body_metrics"
  ON body_metrics FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   routine_assignments ra
      JOIN   routines r ON r.id = ra.routine_id
      WHERE  ra.athlete_id = body_metrics.athlete_id
        AND  r.coach_id    = auth.uid()
    )
  );

-- ── 2. progress_photos ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS progress_photos (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  taken_at     timestamptz NOT NULL,
  tag          text        NOT NULL CHECK (tag IN ('front', 'back', 'side')),
  notes        text        CHECK (char_length(notes) <= 300),
  storage_path text        NOT NULL,
  public_url   text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_athlete_id
  ON progress_photos (athlete_id, taken_at);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- El atleta gestiona sus propias fotos
CREATE POLICY "athlete_manages_own_progress_photos"
  ON progress_photos FOR ALL TO authenticated
  USING  (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

-- ── 3. Supabase Storage bucket ───────────────────────────────────
-- Crear manualmente en: Storage → New bucket
--   Name:   progress-photos
--   Public: true
--
-- Storage Policy (Dashboard → Storage → Policies → New policy):
--   Nombre:    "Athletes upload to own folder"
--   Operation: INSERT
--   Check:     bucket_id = 'progress-photos'
--              AND (storage.foldername(name))[1] = auth.uid()::text
