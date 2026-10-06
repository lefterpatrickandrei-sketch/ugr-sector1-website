-- ============================================================================
-- Rollback: 004_media_storage_rollback.sql
-- Scop: Eliminare politici RLS și bucket 'media' din storage.buckets
-- Data: 2026-10-06
-- ============================================================================

DROP POLICY IF EXISTS media_delete ON storage.objects;
DROP POLICY IF EXISTS media_update ON storage.objects;
DROP POLICY IF EXISTS media_insert ON storage.objects;
DROP POLICY IF EXISTS media_read ON storage.objects;

DELETE FROM storage.buckets WHERE id = 'media';
