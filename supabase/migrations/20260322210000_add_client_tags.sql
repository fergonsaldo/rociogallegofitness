-- ── RF-E2-05a: Etiquetas de clientes ─────────────────────────────────────────

-- Tabla de etiquetas del coach
create table public.client_tags (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#6B7280',
  created_at timestamptz not null default now(),
  unique (coach_id, name)
);

create index idx_client_tags_coach on public.client_tags(coach_id);

-- Asignación etiqueta ↔ atleta
create table public.athlete_tags (
  tag_id      uuid not null references public.client_tags(id) on delete cascade,
  athlete_id  uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (tag_id, athlete_id)
);

create index idx_athlete_tags_athlete on public.athlete_tags(athlete_id);

-- RLS: el coach solo ve y gestiona sus propias etiquetas
alter table public.client_tags enable row level security;

create policy "coach_owns_tags" on public.client_tags
  for all using (coach_id = auth.uid());

-- RLS: el coach gestiona asignaciones de sus propias etiquetas
alter table public.athlete_tags enable row level security;

create policy "coach_owns_athlete_tags" on public.athlete_tags
  for all using (
    exists (
      select 1 from public.client_tags t
      where t.id = athlete_tags.tag_id
        and t.coach_id = auth.uid()
    )
  );
