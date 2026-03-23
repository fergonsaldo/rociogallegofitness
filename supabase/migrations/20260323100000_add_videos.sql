-- ── Tabla videos ──────────────────────────────────────────────────────────────

create table videos (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  url         text not null,
  tags        text[] not null default '{}',
  description text check (char_length(description) <= 500),
  created_at  timestamptz not null default now()
);

create index idx_videos_coach_id on videos (coach_id, created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table videos enable row level security;

create policy "Coach manages own videos" on videos for all
  using  (coach_id = auth.uid())
  with check (coach_id = auth.uid());
