-- ============================================================================
-- Migrare: 009_public_membri_rls.sql
-- Scop: păstrează o singură politică anon/public pentru citirea membrilor.
-- ============================================================================

BEGIN;

ALTER TABLE public.membri ENABLE ROW LEVEL SECURITY;

-- Politicile permissive se combină cu OR. Eliminăm orice politică veche care
-- acordă acces rolului anon/public, inclusiv variante create din Dashboard.
DO $$
DECLARE
    policy_row record;
BEGIN
    FOR policy_row IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'membri'
          AND roles && ARRAY['anon', 'public']::name[]
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.membri',
            policy_row.policyname
        );
    END LOOP;
END
$$;

CREATE POLICY membri_citire_anonim ON public.membri
    FOR SELECT TO anon
    USING (afisare_publica = true AND deleted_at IS NULL);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.membri TO anon;

COMMENT ON POLICY membri_citire_anonim ON public.membri IS
    'Singura politică publică pentru membri: doar rândurile marcate public și neșterse.';

COMMIT;
