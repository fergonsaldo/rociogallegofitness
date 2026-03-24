-- ── RF-E6-01: Alinear nutrition_plans con el código + añadir campos nuevos ──────
--
-- Problemas del esquema original:
--   1. athlete_id NOT NULL → los planes del catálogo no tienen atleta asignado
--   2. Columnas con prefijo daily_* → el código espera calories, protein_g, etc.
--   3. notes → el código usa description
--   4. No existe columna type (deficit/maintenance/surplus/other)
--   5. No existe tabla meals (el código la referencia)
--   6. No existe tabla nutrition_assignments (el código la referencia)

-- ── 1. Hacer athlete_id nullable ─────────────────────────────────────────────

alter table public.nutrition_plans
  alter column athlete_id drop not null;

-- ── 2. Renombrar columnas de macros ──────────────────────────────────────────

alter table public.nutrition_plans rename column daily_calories  to calories;
alter table public.nutrition_plans rename column daily_protein_g to protein_g;
alter table public.nutrition_plans rename column daily_carbs_g   to carbs_g;
alter table public.nutrition_plans rename column daily_fat_g     to fat_g;

-- ── 3. Renombrar notes → description ─────────────────────────────────────────

alter table public.nutrition_plans rename column notes to description;

-- ── 4. Añadir tipo de plan ────────────────────────────────────────────────────

alter table public.nutrition_plans
  add column type text not null default 'other'
    check (type in ('deficit', 'maintenance', 'surplus', 'other'));

-- ── 5. Tabla meals ────────────────────────────────────────────────────────────

create table public.meals (
  id                uuid primary key default gen_random_uuid(),
  nutrition_plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 100),
  "order"           integer not null check ("order" >= 1),
  calories          integer not null default 0 check (calories >= 0),
  protein_g         numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g           numeric(6,1) not null default 0 check (carbs_g >= 0),
  fat_g             numeric(6,1) not null default 0 check (fat_g >= 0),
  notes             text check (char_length(notes) <= 500),
  created_at        timestamptz not null default now()
);

create index idx_meals_plan_id on public.meals(nutrition_plan_id);

alter table public.meals enable row level security;

create policy "meals_coach_all" on public.meals for all
  using (
    exists (
      select 1 from public.nutrition_plans p
      where p.id = nutrition_plan_id
        and p.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.nutrition_plans p
      where p.id = nutrition_plan_id
        and p.coach_id = auth.uid()
    )
  );

-- ── 6. Tabla nutrition_assignments ───────────────────────────────────────────

create table public.nutrition_assignments (
  nutrition_plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  athlete_id        uuid not null references public.users(id) on delete cascade,
  assigned_at       timestamptz not null default now(),
  primary key (nutrition_plan_id, athlete_id)
);

create index idx_nutrition_assignments_athlete on public.nutrition_assignments(athlete_id);

alter table public.nutrition_assignments enable row level security;

create policy "nutrition_assignments_coach" on public.nutrition_assignments for all
  using (
    exists (
      select 1 from public.nutrition_plans p
      where p.id = nutrition_plan_id
        and p.coach_id = auth.uid()
    )
  );

create policy "nutrition_assignments_athlete_select" on public.nutrition_assignments for select
  using (athlete_id = auth.uid());
