-- ============================================================
-- FitCoach — Initial Schema Migration
-- ============================================================
-- Run with: supabase db push
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
create type user_role as enum ('coach', 'athlete');
create type weight_unit as enum ('kg', 'lb');
create type workout_status as enum ('active', 'completed', 'abandoned');
create type exercise_category as enum ('strength', 'cardio', 'flexibility', 'isometric');
create type set_type as enum ('reps', 'isometric');
create type muscle_group as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'glutes', 'quadriceps', 'hamstrings',
  'calves', 'full_body'
);

-- ── users ─────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific profile data.
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text not null,
  role          user_role not null,
  weight_unit   weight_unit not null default 'kg',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── coach_athletes ────────────────────────────────────────────
-- Many-to-many: a coach manages multiple athletes.
create table public.coach_athletes (
  coach_id    uuid not null references public.users(id) on delete cascade,
  athlete_id  uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (coach_id, athlete_id)
);

-- ── exercises ────────────────────────────────────────────────
-- Predefined catalog. Populated via seed.sql. Read-only for users.
create table public.exercises (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null unique,
  primary_muscles  muscle_group[] not null,
  secondary_muscles muscle_group[] not null default '{}',
  category         exercise_category not null,
  is_isometric     boolean not null default false,
  description      text,
  video_url        text,
  created_at       timestamptz not null default now()
);

-- ── routines ─────────────────────────────────────────────────
create table public.routines (
  id               uuid primary key default uuid_generate_v4(),
  coach_id         uuid not null references public.users(id) on delete cascade,
  name             text not null,
  description      text,
  duration_weeks   int check (duration_weeks between 1 and 52),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── routine_assignments ───────────────────────────────────────
-- A coach assigns a routine to a specific athlete.
create table public.routine_assignments (
  id          uuid primary key default uuid_generate_v4(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  athlete_id  uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (routine_id, athlete_id)
);

-- ── routine_days ─────────────────────────────────────────────
create table public.routine_days (
  id          uuid primary key default uuid_generate_v4(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  day_number  int not null check (day_number between 1 and 7),
  name        text not null,
  unique (routine_id, day_number)
);

-- ── routine_exercises ─────────────────────────────────────────
create table public.routine_exercises (
  id                        uuid primary key default uuid_generate_v4(),
  routine_day_id            uuid not null references public.routine_days(id) on delete cascade,
  exercise_id               uuid not null references public.exercises(id),
  "order"                   int not null check ("order" >= 1),
  target_sets               int not null check (target_sets between 1 and 20),
  target_reps               int check (target_reps between 1 and 999),
  target_duration_seconds   int check (target_duration_seconds >= 1),
  rest_between_sets_seconds int not null default 90 check (rest_between_sets_seconds between 0 and 600),
  notes                     text,
  unique (routine_day_id, "order")
);

-- ── workout_sessions ──────────────────────────────────────────
create table public.workout_sessions (
  id              uuid primary key default uuid_generate_v4(),
  athlete_id      uuid not null references public.users(id) on delete cascade,
  routine_id      uuid references public.routines(id) on delete set null,
  routine_day_id  uuid references public.routine_days(id) on delete set null,
  status          workout_status not null default 'active',
  notes           text,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  synced_at       timestamptz,
  created_at      timestamptz not null default now()
);

-- ── exercise_sets ─────────────────────────────────────────────
create table public.exercise_sets (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id         uuid not null references public.exercises(id),
  set_number          int not null check (set_number >= 1),
  set_type            set_type not null,
  -- reps-based fields
  reps                int check (reps between 1 and 999),
  weight_kg           numeric(6,2) check (weight_kg >= 0),
  -- isometric fields
  duration_seconds    int check (duration_seconds >= 1),
  rest_after_seconds  int not null default 0 check (rest_after_seconds between 0 and 3600),
  completed_at        timestamptz not null default now(),
  -- enforce that reps sets have reps/weight and isometric sets have duration
  constraint reps_set_fields check (
    set_type != 'reps' or (reps is not null and weight_kg is not null)
  ),
  constraint isometric_set_fields check (
    set_type != 'isometric' or duration_seconds is not null
  )
);

-- ── nutrition_plans ───────────────────────────────────────────
create table public.nutrition_plans (
  id                  uuid primary key default uuid_generate_v4(),
  coach_id            uuid not null references public.users(id) on delete cascade,
  athlete_id          uuid not null references public.users(id) on delete cascade,
  name                text not null,
  daily_calories      int not null check (daily_calories between 0 and 10000),
  daily_protein_g     numeric(6,1) not null check (daily_protein_g >= 0),
  daily_carbs_g       numeric(6,1) not null check (daily_carbs_g >= 0),
  daily_fat_g         numeric(6,1) not null check (daily_fat_g >= 0),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── progress_records ──────────────────────────────────────────
create table public.progress_records (
  id                      uuid primary key default uuid_generate_v4(),
  athlete_id              uuid not null references public.users(id) on delete cascade,
  exercise_id             uuid not null references public.exercises(id),
  session_id              uuid not null references public.workout_sessions(id) on delete cascade,
  recorded_at             timestamptz not null,
  best_weight_kg          numeric(6,2),
  best_reps               int,
  estimated_one_rep_max_kg numeric(6,2),
  total_volume_kg         numeric(10,2) not null default 0
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- Users can only access their own data or data their role permits.

alter table public.users             enable row level security;
alter table public.coach_athletes    enable row level security;
alter table public.routines          enable row level security;
alter table public.routine_assignments enable row level security;
alter table public.routine_days      enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_sessions  enable row level security;
alter table public.exercise_sets     enable row level security;
alter table public.nutrition_plans   enable row level security;
alter table public.progress_records  enable row level security;
-- exercises catalog is public read-only
alter table public.exercises         enable row level security;

-- ── Helper: get current user role ────────────────────────────
create or replace function public.current_user_role()
returns user_role
language sql stable
as $$
  select role from public.users where id = auth.uid();
$$;

-- ── users policies ───────────────────────────────────────────
create policy "Users can read their own profile"
  on public.users for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on public.users for update
  using (id = auth.uid());

-- ── exercises policies ───────────────────────────────────────
create policy "Anyone authenticated can read the exercise catalog"
  on public.exercises for select
  using (auth.uid() is not null);

-- ── routines policies ────────────────────────────────────────
create policy "Coaches can manage their own routines"
  on public.routines for all
  using (coach_id = auth.uid());

create policy "Athletes can read their assigned routines"
  on public.routines for select
  using (
    id in (
      select routine_id from public.routine_assignments
      where athlete_id = auth.uid()
    )
  );

-- ── workout_sessions policies ────────────────────────────────
create policy "Athletes can manage their own sessions"
  on public.workout_sessions for all
  using (athlete_id = auth.uid());

create policy "Coaches can read sessions of their athletes"
  on public.workout_sessions for select
  using (
    athlete_id in (
      select athlete_id from public.coach_athletes
      where coach_id = auth.uid()
    )
  );

-- ── exercise_sets policies ────────────────────────────────────
create policy "Athletes can manage sets in their own sessions"
  on public.exercise_sets for all
  using (
    session_id in (
      select id from public.workout_sessions
      where athlete_id = auth.uid()
    )
  );

-- ── nutrition_plans policies ─────────────────────────────────
create policy "Coaches can manage nutrition plans they created"
  on public.nutrition_plans for all
  using (coach_id = auth.uid());

create policy "Athletes can read their own nutrition plan"
  on public.nutrition_plans for select
  using (athlete_id = auth.uid());

-- ── progress_records policies ────────────────────────────────
create policy "Athletes can manage their own progress records"
  on public.progress_records for all
  using (athlete_id = auth.uid());

create policy "Coaches can read progress of their athletes"
  on public.progress_records for select
  using (
    athlete_id in (
      select athlete_id from public.coach_athletes
      where coach_id = auth.uid()
    )
  );

-- ── coach_athletes policies ───────────────────────────────────
create policy "Coaches can manage their athlete relationships"
  on public.coach_athletes for all
  using (coach_id = auth.uid());

create policy "Athletes can see their coach"
  on public.coach_athletes for select
  using (athlete_id = auth.uid());

-- ============================================================
-- Triggers: auto-update updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger routines_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

create trigger nutrition_plans_updated_at
  before update on public.nutrition_plans
  for each row execute function public.set_updated_at();

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
create index idx_workout_sessions_athlete_id on public.workout_sessions(athlete_id);
create index idx_exercise_sets_session_id on public.exercise_sets(session_id);
create index idx_progress_records_athlete_exercise on public.progress_records(athlete_id, exercise_id);
create index idx_routine_assignments_athlete_id on public.routine_assignments(athlete_id);
create index idx_coach_athletes_coach_id on public.coach_athletes(coach_id);
