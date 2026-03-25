-- ── RF-E6-03: Recetas ─────────────────────────────────────────────────────────
--
-- recipes             → biblioteca de recetas del coach
-- recipe_ingredients  → ingredientes de cada receta (FK a foods)
--
-- Storage bucket: recipe-images (privado, URLs firmadas)

-- ── Tabla recipes ─────────────────────────────────────────────────────────────

create table public.recipes (
  id                  uuid        primary key default gen_random_uuid(),
  coach_id            uuid        not null references public.users(id) on delete cascade,
  name                text        not null check (char_length(name) between 1 and 100),
  instructions        text,
  image_path          text,
  tags                text[]      not null default '{}',
  show_macros         boolean     not null default true,
  visible_to_clients  boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_recipes_coach on public.recipes(coach_id);

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function set_updated_at();

alter table public.recipes enable row level security;

create policy "recipes_select" on public.recipes
  for select using (coach_id = auth.uid());

create policy "recipes_insert" on public.recipes
  for insert with check (coach_id = auth.uid());

create policy "recipes_update" on public.recipes
  for update using (coach_id = auth.uid());

create policy "recipes_delete" on public.recipes
  for delete using (coach_id = auth.uid());

-- ── Tabla recipe_ingredients ──────────────────────────────────────────────────

create table public.recipe_ingredients (
  id          uuid        primary key default gen_random_uuid(),
  recipe_id   uuid        not null references public.recipes(id) on delete cascade,
  food_id     uuid        not null references public.foods(id),
  quantity_g  numeric(7,2) not null check (quantity_g > 0),
  created_at  timestamptz not null default now()
);

create index idx_recipe_ingredients_recipe on public.recipe_ingredients(recipe_id);

alter table public.recipe_ingredients enable row level security;

-- Ingredientes: accesibles si el coach es dueño de la receta padre
create policy "recipe_ingredients_select" on public.recipe_ingredients
  for select using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.coach_id = auth.uid()
    )
  );

create policy "recipe_ingredients_insert" on public.recipe_ingredients
  for insert with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.coach_id = auth.uid()
    )
  );

create policy "recipe_ingredients_delete" on public.recipe_ingredients
  for delete using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.coach_id = auth.uid()
    )
  );

-- ── Storage bucket: recipe-images ─────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-images',
  'recipe-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Coaches can read their own recipe images (path: {coachId}/...)
create policy "recipe_images_select" on storage.objects
  for select using (
    bucket_id = 'recipe-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "recipe_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'recipe-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "recipe_images_delete" on storage.objects
  for delete using (
    bucket_id = 'recipe-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
