-- RF-E8-06: Historial de actividad de agenda
-- Stores a snapshot of session data at creation/deletion time so history
-- remains intact even after the session itself is deleted.

create table if not exists session_activity_log (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references auth.users(id) on delete cascade,
  session_id   uuid references coach_sessions(id) on delete set null,
  action       text not null check (action in ('created', 'deleted')),
  title        text,
  session_type text,
  modality     text,
  scheduled_at timestamptz,
  logged_at    timestamptz not null default now()
);

create index if not exists session_activity_log_coach_id_logged_at_idx
  on session_activity_log (coach_id, logged_at desc);

alter table session_activity_log enable row level security;

create policy "coach_owns_activity_log"
  on session_activity_log
  for all
  using  (coach_id = auth.uid())
  with check (coach_id = auth.uid());
