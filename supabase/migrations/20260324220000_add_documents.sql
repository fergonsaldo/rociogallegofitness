-- ── RF-E7-02: Depósito de documentos coach-atleta ────────────────────────────
--
-- documents → ficheros compartidos entre un coach y un atleta concreto.
-- Visibles solo para el par (coach_id, athlete_id).
-- Extensiones ejecutables bloqueadas en cliente antes del upload.

create table public.documents (
  id          uuid        primary key default gen_random_uuid(),
  coach_id    uuid        not null references public.users(id)  on delete cascade,
  athlete_id  uuid        not null references public.users(id)  on delete cascade,
  name        text        not null check (char_length(name) between 1 and 200),
  file_path   text        not null,
  file_size   bigint      not null check (file_size > 0),
  mime_type   text        not null,
  uploaded_by uuid        not null references public.users(id),
  created_at  timestamptz not null default now()
);

create index idx_documents_pair on public.documents(coach_id, athlete_id);

alter table public.documents enable row level security;

-- Coach y atleta del par pueden ver los documentos compartidos entre ellos
create policy "documents_select" on public.documents
  for select using (
    coach_id = auth.uid() or athlete_id = auth.uid()
  );

-- Solo pueden subir quienes forman parte del par y la relación coach-atleta existe
create policy "documents_insert" on public.documents
  for insert with check (
    (coach_id = auth.uid() or athlete_id = auth.uid())
    and exists (
      select 1 from public.coach_athletes ca
      where ca.coach_id = documents.coach_id
        and ca.athlete_id = documents.athlete_id
    )
  );

-- Solo quien subió el fichero puede eliminarlo
create policy "documents_delete" on public.documents
  for delete using (uploaded_by = auth.uid());

-- ── Storage bucket: documents ─────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800); -- 50 MB limit

-- Acceso de lectura: el usuario debe ser coach o atleta del path {coachId}/{athleteId}/...
create policy "documents_storage_select" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or auth.uid()::text = (storage.foldername(name))[2]
    )
  );

create policy "documents_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or auth.uid()::text = (storage.foldername(name))[2]
    )
  );

create policy "documents_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or auth.uid()::text = (storage.foldername(name))[2]
    )
  );
