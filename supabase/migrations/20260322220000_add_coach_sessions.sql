-- ── RF-E8-01 + RF-E8-03: Agenda del coach ────────────────────────────────────

create table public.coach_sessions (
  id               uuid primary key default gen_random_uuid(),
  coach_id         uuid not null references public.users(id) on delete cascade,
  athlete_id       uuid references public.users(id) on delete set null,
  title            text,
  session_type     text not null default 'Entrenamiento',
  modality         text not null default 'in_person'
                   check (modality in ('online', 'in_person')),
  scheduled_at     timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  notes            text,
  created_at       timestamptz not null default now()
);

create index idx_coach_sessions_coach_at
  on public.coach_sessions(coach_id, scheduled_at);

alter table public.coach_sessions enable row level security;

create policy "coach_owns_sessions" on public.coach_sessions
  for all using (coach_id = auth.uid());
