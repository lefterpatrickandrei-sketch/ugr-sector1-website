-- Rollback pentru 009_public_membri_rls.sql.
-- Politica publică nu este recreată automat pentru a evita reintroducerea
-- politicilor conflictuale; restaurează migrarea dorită explicit.

BEGIN;

DROP POLICY IF EXISTS membri_citire_anonim ON public.membri;

COMMIT;
