-- =============================================================================
-- FitCoach — correcciones de base de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. POBLAR tabla exercises con el catálogo del cliente
--    Los IDs son estables y coinciden con src/shared/constants/exercises.ts
--    Usamos INSERT ... ON CONFLICT DO NOTHING para que sea idempotente
-- -----------------------------------------------------------------------------

INSERT INTO exercises (id, name, primary_muscles, secondary_muscles, category, is_isometric) VALUES
  -- Pecho
  ('11111111-0001-0000-0000-000000000001', 'Bench Press',         ARRAY['chest']::muscle_group[],       ARRAY['triceps','shoulders']::muscle_group[],        'strength'::exercise_category,  false),
  ('11111111-0001-0000-0000-000000000002', 'Incline Bench Press', ARRAY['chest']::muscle_group[],       ARRAY['triceps','shoulders']::muscle_group[],        'strength'::exercise_category,  false),
  ('11111111-0001-0000-0000-000000000003', 'Push-up',             ARRAY['chest']::muscle_group[],       ARRAY['triceps','core']::muscle_group[],             'strength'::exercise_category,  false),
  -- Espalda
  ('11111111-0002-0000-0000-000000000001', 'Deadlift',            ARRAY['back']::muscle_group[],        ARRAY['hamstrings','glutes','core']::muscle_group[], 'strength'::exercise_category,  false),
  ('11111111-0002-0000-0000-000000000002', 'Pull-up',             ARRAY['back']::muscle_group[],        ARRAY['biceps']::muscle_group[],                     'strength'::exercise_category,  false),
  ('11111111-0002-0000-0000-000000000003', 'Barbell Row',         ARRAY['back']::muscle_group[],        ARRAY['biceps']::muscle_group[],                     'strength'::exercise_category,  false),
  -- Hombros
  ('11111111-0003-0000-0000-000000000001', 'Overhead Press',      ARRAY['shoulders']::muscle_group[],   ARRAY['triceps']::muscle_group[],                    'strength'::exercise_category,  false),
  ('11111111-0003-0000-0000-000000000002', 'Lateral Raise',       ARRAY['shoulders']::muscle_group[],   ARRAY[]::muscle_group[],                             'strength'::exercise_category,  false),
  -- Bíceps / Tríceps
  ('11111111-0004-0000-0000-000000000001', 'Barbell Curl',        ARRAY['biceps']::muscle_group[],      ARRAY[]::muscle_group[],                             'strength'::exercise_category,  false),
  ('11111111-0004-0000-0000-000000000002', 'Tricep Pushdown',     ARRAY['triceps']::muscle_group[],     ARRAY[]::muscle_group[],                             'strength'::exercise_category,  false),
  -- Piernas
  ('11111111-0005-0000-0000-000000000001', 'Squat',               ARRAY['quadriceps']::muscle_group[],  ARRAY['glutes','hamstrings']::muscle_group[],        'strength'::exercise_category,  false),
  ('11111111-0005-0000-0000-000000000002', 'Romanian Deadlift',   ARRAY['hamstrings']::muscle_group[],  ARRAY['glutes','back']::muscle_group[],              'strength'::exercise_category,  false),
  ('11111111-0005-0000-0000-000000000003', 'Leg Press',           ARRAY['quadriceps']::muscle_group[],  ARRAY['glutes','hamstrings']::muscle_group[],        'strength'::exercise_category,  false),
  ('11111111-0005-0000-0000-000000000004', 'Calf Raise',          ARRAY['calves']::muscle_group[],      ARRAY[]::muscle_group[],                             'strength'::exercise_category,  false),
  -- Core isométrico
  ('11111111-0006-0000-0000-000000000001', 'Plank',               ARRAY['core']::muscle_group[],        ARRAY['shoulders']::muscle_group[],                  'isometric'::exercise_category, true),
  ('11111111-0006-0000-0000-000000000002', 'Side Plank',          ARRAY['core']::muscle_group[],        ARRAY['shoulders']::muscle_group[],                  'isometric'::exercise_category, true),
  ('11111111-0006-0000-0000-000000000003', 'Crunch',              ARRAY['core']::muscle_group[],        ARRAY[]::muscle_group[],                             'strength'::exercise_category,  false),
  -- Cardio / Full body
  ('11111111-0007-0000-0000-000000000001', 'Burpee',              ARRAY['full_body']::muscle_group[],   ARRAY[]::muscle_group[],                             'cardio'::exercise_category,    false),
  -- Isométrico piernas
  ('11111111-0007-0000-0000-000000000002', 'Wall Sit',            ARRAY['quadriceps']::muscle_group[],  ARRAY['glutes']::muscle_group[],                     'isometric'::exercise_category, true)
ON CONFLICT (id) DO NOTHING;

-- Verificar resultado:
-- SELECT id, name, primary_muscles, category FROM exercises ORDER BY name;


-- -----------------------------------------------------------------------------
-- 2. VERIFICAR si nutrition_plans.athlete_id es nullable
--    (el código no la usa — la asignación va por nutrition_assignments)
--    Si es NOT NULL sería un problema; si es nullable es inofensiva.
-- -----------------------------------------------------------------------------

SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'nutrition_plans'
  AND column_name = 'athlete_id';

-- Si is_nullable = 'NO' → ejecutar:
--   ALTER TABLE nutrition_plans ALTER COLUMN athlete_id DROP NOT NULL;
-- Si is_nullable = 'YES' → no hace falta nada.


-- -----------------------------------------------------------------------------
-- 3. VERIFICAR si hay asignaciones duplicadas en routine_assignments
--    (pueden haberse creado antes de añadir el UNIQUE constraint)
-- -----------------------------------------------------------------------------

SELECT routine_id, athlete_id, COUNT(*) AS duplicados
FROM routine_assignments
GROUP BY routine_id, athlete_id
HAVING COUNT(*) > 1;

-- Si hay duplicados, limpiarlos conservando el más reciente:
-- DELETE FROM routine_assignments
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (routine_id, athlete_id) id
--   FROM routine_assignments
--   ORDER BY routine_id, athlete_id, assigned_at DESC
-- );
