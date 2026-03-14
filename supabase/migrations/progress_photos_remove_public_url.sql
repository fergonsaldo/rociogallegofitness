-- ═══════════════════════════════════════════════════════════════
-- Migración: Eliminar public_url de progress_photos
-- El bucket pasa a ser privado; las URLs se generan como signed URLs en runtime
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Eliminar la columna public_url (ya no se necesita)
ALTER TABLE progress_photos DROP COLUMN IF EXISTS public_url;

-- 2. Cambiar el bucket a privado desde el Dashboard:
--    Storage → progress-photos → Edit bucket → Public: OFF
--
-- 3. Añadir política de Storage para que solo el atleta pueda leer sus ficheros:
--    Storage → Policies → progress-photos → New policy
--
--    SELECT (leer/descargar):
--      (storage.foldername(name))[1] = auth.uid()::text
--
--    INSERT (subir):
--      (storage.foldername(name))[1] = auth.uid()::text
--
--    DELETE (borrar):
--      (storage.foldername(name))[1] = auth.uid()::text
