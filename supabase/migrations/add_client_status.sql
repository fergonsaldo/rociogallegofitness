-- ============================================================
-- RF-E2-01: Segmentación de clientes por estado
-- Añade columna status a coach_athletes con valores active/archived.
-- Los registros existentes quedan como 'active' por defecto.
-- ============================================================

alter table public.coach_athletes
  add column status text not null default 'active'
  check (status in ('active', 'archived'));

create index idx_coach_athletes_status on public.coach_athletes(coach_id, status);
