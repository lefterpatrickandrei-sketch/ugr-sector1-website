-- ============================================================================
-- Migrare: 005_operations_and_conversion.sql
-- Scop: Suport conversie cerere -> membru, configurare email notificări,
--       și RPC inspectare politici RLS pentru Modul Dezvoltator (Avansat).
-- Data: 2026-10-06
-- ============================================================================

-- 1. Coloană de legătură cerere -> membru
ALTER TABLE public.cereri_inscriere
    ADD COLUMN IF NOT EXISTS membru_id text REFERENCES public.membri(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cereri_inscriere_membru_id
    ON public.cereri_inscriere(membru_id);

-- 2. Asigurare cheie setări pentru email notificări în setari
INSERT INTO public.setari (cheie, valoare, descriere)
VALUES (
    'contact_email_notificari',
    '"lefterpatrickandrei@gmail.com"'::jsonb,
    'Adresa de email pentru notificări automate privind cereri noi de înscriere (Patrick)'
)
ON CONFLICT (cheie) DO NOTHING;

-- 3. Funcție RPC pentru inspectarea politicilor RLS (read-only, pentru modul Dezvoltator)
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

-- Permisiuni execuție RPC
REVOKE ALL ON FUNCTION public.get_table_rls_policies() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_table_rls_policies() TO authenticated;
