-- ── RF-E6-10: Vincular recetas a comidas de un plan ──────────────────────────
--
-- meal_recipes → tabla de enlace entre meals y recipes
-- Un trigger recalcula los macros de la comida al insertar/eliminar vínculos.

-- ── Tabla meal_recipes ────────────────────────────────────────────────────────

create table public.meal_recipes (
  meal_id   uuid        not null references public.meals(id)   on delete cascade,
  recipe_id uuid        not null references public.recipes(id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (meal_id, recipe_id)
);

create index idx_meal_recipes_meal   on public.meal_recipes(meal_id);
create index idx_meal_recipes_recipe on public.meal_recipes(recipe_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.meal_recipes enable row level security;

-- Coach puede gestionar vínculos si es dueño del plan padre
create policy "meal_recipes_coach" on public.meal_recipes for all
  using (
    exists (
      select 1
      from public.meals m
      join public.nutrition_plans p on p.id = m.nutrition_plan_id
      where m.id = meal_id
        and p.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.meals m
      join public.nutrition_plans p on p.id = m.nutrition_plan_id
      where m.id = meal_id
        and p.coach_id = auth.uid()
    )
  );

-- Atleta puede ver vínculos si tiene el plan asignado
create policy "meal_recipes_athlete_select" on public.meal_recipes for select
  using (
    exists (
      select 1
      from public.meals m
      join public.nutrition_assignments na on na.nutrition_plan_id = m.nutrition_plan_id
      where m.id = meal_id
        and na.athlete_id = auth.uid()
    )
  );

-- ── Trigger: recalcular macros de la comida al vincular/desvincular ───────────

create or replace function public.sync_meal_macros_from_recipes()
returns trigger language plpgsql security definer as $$
declare
  target_meal_id uuid;
begin
  target_meal_id := coalesce(new.meal_id, old.meal_id);

  update public.meals set
    calories  = coalesce((
      select round(sum(ri.quantity_g / 100.0 * f.calories_per_100g))::integer
      from   public.meal_recipes mr
      join   public.recipe_ingredients ri on ri.recipe_id = mr.recipe_id
      join   public.foods f on f.id = ri.food_id
      where  mr.meal_id = target_meal_id
    ), 0),
    protein_g = coalesce((
      select round(sum(ri.quantity_g / 100.0 * f.protein_g), 1)
      from   public.meal_recipes mr
      join   public.recipe_ingredients ri on ri.recipe_id = mr.recipe_id
      join   public.foods f on f.id = ri.food_id
      where  mr.meal_id = target_meal_id
    ), 0),
    carbs_g   = coalesce((
      select round(sum(ri.quantity_g / 100.0 * f.carbs_g), 1)
      from   public.meal_recipes mr
      join   public.recipe_ingredients ri on ri.recipe_id = mr.recipe_id
      join   public.foods f on f.id = ri.food_id
      where  mr.meal_id = target_meal_id
    ), 0),
    fat_g     = coalesce((
      select round(sum(ri.quantity_g / 100.0 * f.fat_g), 1)
      from   public.meal_recipes mr
      join   public.recipe_ingredients ri on ri.recipe_id = mr.recipe_id
      join   public.foods f on f.id = ri.food_id
      where  mr.meal_id = target_meal_id
    ), 0)
  where id = target_meal_id;

  return null;
end;
$$;

create trigger meal_recipes_sync_macros
  after insert or delete on public.meal_recipes
  for each row execute function public.sync_meal_macros_from_recipes();
