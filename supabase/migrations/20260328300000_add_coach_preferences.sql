-- RF-E1-02: Accesos rápidos configurables
-- Stores per-coach quick-access shortcut preferences.

create table if not exists coach_preferences (
  coach_id    uuid primary key references auth.users(id) on delete cascade,
  quick_access text[] not null default array['clients','routines','nutrition'],
  updated_at  timestamptz not null default now()
);

alter table coach_preferences enable row level security;

create policy "coach_owns_preferences"
  on coach_preferences
  for all
  using  (coach_id = auth.uid())
  with check (coach_id = auth.uid());
