-- ── RF-E4-04: Catálogo de cardios ─────────────────────────────────────────────
--
-- coach_id NULL  → cardio del catálogo base (visible a todos, no editable)
-- coach_id = uuid → cardio creado por ese coach (solo él puede editar/borrar)

create table public.cardios (
  id                   uuid primary key default gen_random_uuid(),
  coach_id             uuid references public.users(id) on delete cascade,
  name                 text not null check (char_length(name) between 1 and 100),
  type                 text not null,
  intensity            text not null,
  duration_min_minutes integer not null check (duration_min_minutes between 1 and 300),
  duration_max_minutes integer not null check (duration_max_minutes between 1 and 300),
  description          text check (char_length(description) <= 500),
  created_at           timestamptz not null default now()
);

create index idx_cardios_coach on public.cardios(coach_id);

alter table public.cardios enable row level security;

-- Coaches can read their own cardios + base catalog (coach_id IS NULL)
create policy "cardios_select" on public.cardios
  for select using (coach_id = auth.uid() or coach_id is null);

-- Coaches can only insert/update/delete their own cardios
create policy "cardios_insert" on public.cardios
  for insert with check (coach_id = auth.uid());

create policy "cardios_update" on public.cardios
  for update using (coach_id = auth.uid());

create policy "cardios_delete" on public.cardios
  for delete using (coach_id = auth.uid());

-- ── Asignaciones ───────────────────────────────────────────────────────────────

create table public.cardio_assignments (
  cardio_id   uuid not null references public.cardios(id) on delete cascade,
  athlete_id  uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (cardio_id, athlete_id)
);

create index idx_cardio_assignments_athlete on public.cardio_assignments(athlete_id);

alter table public.cardio_assignments enable row level security;

-- Coach can manage assignments for cardios they own or from the base catalog
create policy "cardio_assignments_all" on public.cardio_assignments
  for all using (
    exists (
      select 1 from public.cardios c
      where c.id = cardio_id
        and (c.coach_id = auth.uid() or c.coach_id is null)
    )
  );

-- ── Catálogo base (seed) ───────────────────────────────────────────────────────

insert into public.cardios (id, coach_id, name, type, intensity, duration_min_minutes, duration_max_minutes, description) values
  ('c0000001-0000-4000-b000-000000000001', null, 'Carrera continua suave',     'running',       'low',    20, 40,  'Trote ligero a ritmo cómodo, ideal para recuperación activa'),
  ('c0000001-0000-4000-b000-000000000002', null, 'Carrera a ritmo medio',      'running',       'medium', 25, 45,  'Ritmo de conversación difícil pero sostenible'),
  ('c0000001-0000-4000-b000-000000000003', null, 'Sprint intervals',           'running',       'high',   15, 30,  'Series de sprint con recuperación activa'),
  ('c0000001-0000-4000-b000-000000000004', null, 'Ciclismo en llano',          'cycling',       'low',    30, 60,  'Pedaleo cómodo en terreno llano'),
  ('c0000001-0000-4000-b000-000000000005', null, 'Ciclismo de montaña',        'cycling',       'high',   30, 60,  'Subidas y bajadas con cambios de ritmo'),
  ('c0000001-0000-4000-b000-000000000006', null, 'Natación estilo libre',      'swimming',      'medium', 20, 45,  'Crawl continuo con descansos breves entre largos'),
  ('c0000001-0000-4000-b000-000000000007', null, 'Elíptica ritmo constante',   'elliptical',    'low',    20, 40,  'Movimiento continuo de bajo impacto'),
  ('c0000001-0000-4000-b000-000000000008', null, 'Elíptica intervalos',        'elliptical',    'high',   20, 35,  'Alternar fases de alta y baja resistencia'),
  ('c0000001-0000-4000-b000-000000000009', null, 'Remo ergómetro',             'rowing',        'medium', 15, 30,  'Ritmo uniforme en máquina de remo'),
  ('c0000001-0000-4000-b000-000000000010', null, 'Saltar a la comba',          'jump_rope',     'medium', 10, 20,  'Saltos continuos o en series de 1 minuto'),
  ('c0000001-0000-4000-b000-000000000011', null, 'Caminata rápida',            'walking',       'low',    30, 60,  'Paso vivo, brazos activos, terreno llano o ligera pendiente'),
  ('c0000001-0000-4000-b000-000000000012', null, 'Subir escaleras',            'stair_climbing','medium', 15, 30,  'Subir y bajar escaleras o step machine a ritmo sostenido');
