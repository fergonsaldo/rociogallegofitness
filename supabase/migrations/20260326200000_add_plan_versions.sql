-- ── RF-E6-09: Versionado de planes nutricionales ─────────────────────────────
--
-- plan_versions → snapshot de metadatos del plan al guardar cada edición.
-- Solo se versionan metadatos (nombre, tipo, descripción, macros diarios).
-- Las comidas y sus recetas vinculadas no se versionan.

create table public.plan_versions (
  id          uuid        not null default gen_random_uuid() primary key,
  plan_id     uuid        not null references public.nutrition_plans(id) on delete cascade,
  saved_at    timestamptz not null default now(),
  saved_by    uuid        not null references public.users(id),
  name        text        not null,
  type        text        not null,
  description text,
  calories    integer     not null,
  protein_g   numeric     not null,
  carbs_g     numeric     not null,
  fat_g       numeric     not null
);

create index idx_plan_versions_plan on public.plan_versions(plan_id, saved_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.plan_versions enable row level security;

create policy "plan_versions_coach_all" on public.plan_versions for all
  using (
    exists (
      select 1 from public.nutrition_plans p
      where p.id = plan_id and p.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.nutrition_plans p
      where p.id = plan_id and p.coach_id = auth.uid()
    )
  );
