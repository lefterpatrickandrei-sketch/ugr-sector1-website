-- ============================================================================
-- COMBINED MIGRATION: 004 & 005 (Media Storage, Conversion & Operations)
-- Rulați acest script în Supabase SQL Editor (1 singur click):
-- https://supabase.com/dashboard/project/ckktzvzzklspqfclcsbu/sql
-- ============================================================================

-- ─── 1. BUCKET 'media' ȘI RLS PE STORAGE.OBJECTS ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    5242880, -- 5 MB
    ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];

DROP POLICY IF EXISTS media_read ON storage.objects;
CREATE POLICY media_read ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS media_insert ON storage.objects;
CREATE POLICY media_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'media' AND 
        public.admin_rol() IN ('owner', 'editor', 'admin')
    );

DROP POLICY IF EXISTS media_update ON storage.objects;
CREATE POLICY media_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'media' AND 
        public.admin_rol() IN ('owner', 'editor', 'admin')
    )
    WITH CHECK (
        bucket_id = 'media' AND 
        public.admin_rol() IN ('owner', 'editor', 'admin')
    );

DROP POLICY IF EXISTS media_delete ON storage.objects;
CREATE POLICY media_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'media' AND 
        public.admin_rol() IN ('owner', 'admin')
    );

-- ─── 2. CONVERSIE CERERI & NOTIFICĂRI ─────────────────────────────────────────
ALTER TABLE public.cereri_inscriere
    ADD COLUMN IF NOT EXISTS membru_id text REFERENCES public.membri(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cereri_inscriere_membru_id
    ON public.cereri_inscriere(membru_id);

INSERT INTO public.setari (cheie, valoare, descriere)
VALUES (
    'contact_email_notificari',
    '"lefterpatrickandrei@gmail.com"'::jsonb,
    'Adresa de email pentru notificări automate privind cereri noi de înscriere (Patrick)'
)
ON CONFLICT (cheie) DO NOTHING;

-- ─── 3. RPC PENTRU INSPECTOR RLS (CODER MODE) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_table_rls_policies()
RETURNS TABLE (
    schemaname text,
    tablename text,
    policyname text,
    permissive text,
    roles text[],
    cmd text,
    qual text,
    with_check text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT
        schemaname::text,
        tablename::text,
        policyname::text,
        permissive::text,
        roles::text[],
        cmd::text,
        qual::text,
        with_check::text
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
$$;

REVOKE ALL ON FUNCTION public.get_table_rls_policies() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_table_rls_policies() TO authenticated;
