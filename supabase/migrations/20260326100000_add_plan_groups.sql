-- ── RF-E6-05: Agrupaciones de planes nutricionales ────────────────────────────
--
-- plan_groups       → agrupación creada por un coach
-- plan_group_plans  → tabla de enlace many-to-many con nutrition_plans

-- ── Tabla plan_groups ─────────────────────────────────────────────────────────

create table public.plan_groups (
  id          uuid        not null default gen_random_uuid() primary key,
  coach_id    uuid        not null references public.users(id) on delete cascade,
  name        text        not null,
  description text,
  created_at  timestamptz not null default now()
);

create index idx_plan_groups_coach on public.plan_groups(coach_id);

-- ── Tabla plan_group_plans ────────────────────────────────────────────────────

create table public.plan_group_plans (
  group_id uuid not null references public.plan_groups(id)    on delete cascade,
  plan_id  uuid not null references public.nutrition_plans(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, plan_id)
);

create index idx_plan_group_plans_group on public.plan_group_plans(group_id);
create index idx_plan_group_plans_plan  on public.plan_group_plans(plan_id);

-- ── RLS plan_groups ───────────────────────────────────────────────────────────

alter table public.plan_groups enable row level security;

create policy "plan_groups_coach_all" on public.plan_groups for all
  using  (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- ── RLS plan_group_plans ──────────────────────────────────────────────────────

alter table public.plan_group_plans enable row level security;

create policy "plan_group_plans_coach_all" on public.plan_group_plans for all
  using (
    exists (
      select 1
      from public.plan_groups g
      where g.id = group_id
        and g.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.plan_groups g
      where g.id = group_id
        and g.coach_id = auth.uid()
    )
  );
