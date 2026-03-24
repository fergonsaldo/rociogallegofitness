-- ── RF-E6-04: Base de alimentos ──────────────────────────────────────────────
--
-- coach_id NULL  → alimento del catálogo base (visible a todos, no editable)
-- coach_id = uuid → alimento creado por ese coach (solo él puede editar/borrar)
--
-- Todos los valores nutricionales son por 100g de alimento.

create table public.foods (
  id                uuid primary key default gen_random_uuid(),
  coach_id          uuid references public.users(id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 100),
  type              text not null check (type in ('generic', 'specific', 'supplement')),
  calories_per_100g numeric(7,2) not null default 0 check (calories_per_100g >= 0),
  protein_g         numeric(6,2) not null default 0 check (protein_g >= 0),
  carbs_g           numeric(6,2) not null default 0 check (carbs_g >= 0),
  fat_g             numeric(6,2) not null default 0 check (fat_g >= 0),
  fiber_g           numeric(6,2) not null default 0 check (fiber_g >= 0),
  created_at        timestamptz not null default now()
);

create index idx_foods_coach on public.foods(coach_id);
create index idx_foods_type  on public.foods(type);

alter table public.foods enable row level security;

-- Coaches ven catálogo base + sus propios alimentos
create policy "foods_select" on public.foods
  for select using (coach_id = auth.uid() or coach_id is null);

create policy "foods_insert" on public.foods
  for insert with check (coach_id = auth.uid());

create policy "foods_update" on public.foods
  for update using (coach_id = auth.uid());

create policy "foods_delete" on public.foods
  for delete using (coach_id = auth.uid());

-- ── Seed: catálogo base ───────────────────────────────────────────────────────
-- Valores por 100g. Fuente: tablas nutricionales estándar (aproximados).

insert into public.foods (name, type, calories_per_100g, protein_g, carbs_g, fat_g, fiber_g) values

-- Genéricos — carnes y pescados
('Pechuga de pollo', 'generic', 165, 31.0, 0.0, 3.6, 0.0),
('Atún en lata (al natural)', 'generic', 116, 25.5, 0.0, 1.0, 0.0),
('Salmón', 'generic', 208, 20.0, 0.0, 13.0, 0.0),
('Ternera magra', 'generic', 143, 26.0, 0.0, 4.0, 0.0),
('Huevo entero', 'generic', 155, 13.0, 1.1, 11.0, 0.0),
('Clara de huevo', 'generic', 52, 11.0, 0.7, 0.2, 0.0),

-- Genéricos — lácteos
('Leche entera', 'generic', 61, 3.2, 4.8, 3.3, 0.0),
('Yogur natural desnatado', 'generic', 56, 5.7, 7.7, 0.1, 0.0),
('Queso cottage', 'generic', 98, 11.1, 3.4, 4.3, 0.0),
('Queso fresco 0%', 'generic', 62, 11.8, 2.7, 0.2, 0.0),

-- Genéricos — cereales y legumbres
('Arroz blanco (cocido)', 'generic', 130, 2.7, 28.2, 0.3, 0.4),
('Avena en copos', 'generic', 379, 13.2, 67.7, 6.9, 10.1),
('Pan integral', 'generic', 247, 8.5, 41.3, 3.5, 6.9),
('Pasta (cocida)', 'generic', 131, 5.0, 25.0, 1.1, 1.8),
('Patata (cocida)', 'generic', 86, 1.9, 20.0, 0.1, 1.8),
('Lentejas (cocidas)', 'generic', 116, 9.0, 20.1, 0.4, 7.9),
('Garbanzos (cocidos)', 'generic', 164, 8.9, 27.4, 2.6, 7.6),

-- Genéricos — verduras y frutas
('Brócoli', 'generic', 34, 2.8, 7.0, 0.4, 2.6),
('Espinacas', 'generic', 23, 2.9, 3.6, 0.4, 2.2),
('Plátano', 'generic', 89, 1.1, 22.8, 0.3, 2.6),
('Manzana', 'generic', 52, 0.3, 14.0, 0.2, 2.4),
('Frutos rojos (mix)', 'generic', 57, 0.8, 14.5, 0.5, 2.0),

-- Genéricos — grasas saludables
('Aceite de oliva virgen extra', 'generic', 884, 0.0, 0.0, 100.0, 0.0),
('Aguacate', 'generic', 160, 2.0, 9.0, 14.7, 6.7),
('Almendras', 'generic', 579, 21.2, 21.6, 49.9, 12.5),

-- Específicos — productos elaborados comunes
('Tortilla de trigo (wrap)', 'specific', 306, 8.0, 50.7, 7.3, 2.3),
('Bebida de avena', 'specific', 46, 1.0, 8.0, 1.0, 0.8),
('Yogur griego 0%', 'specific', 57, 10.0, 3.6, 0.4, 0.0),
('Requesón', 'specific', 74, 11.5, 1.9, 2.5, 0.0),

-- Suplementos
('Proteína de suero (whey)', 'supplement', 380, 80.0, 8.0, 5.0, 0.0),
('Proteína vegana (guisante)', 'supplement', 370, 75.0, 10.0, 5.5, 3.0),
('Creatina monohidrato', 'supplement', 0, 0.0, 0.0, 0.0, 0.0),
('Maltodextrina', 'supplement', 380, 0.0, 95.0, 0.0, 0.0),
('Caseína', 'supplement', 360, 78.0, 8.0, 2.0, 0.0);
