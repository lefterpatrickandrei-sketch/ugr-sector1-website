-- ============================================================================
-- PATCH PERMISIUNI POSTGREST (ANON & AUTHENTICATED)
-- Executat pentru completarea Fazei P3
-- ============================================================================

-- Permisiuni citire publică (filtrate prin RLS: afisare_publica = true / publicat = true / deleted_at is null)
GRANT SELECT ON public.setari TO anon, authenticated;
GRANT SELECT ON public.leadership TO anon, authenticated;
GRANT SELECT ON public.faq TO anon, authenticated;
GRANT SELECT ON public.documente TO anon, authenticated;

-- Permisiuni modificare administrator (filtrate prin RLS: is_admin() / admin_rol())
GRANT INSERT, UPDATE, DELETE ON public.setari TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.leadership TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faq TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.documente TO authenticated;

-- Permisiune citire audit log pentru administratori autentificați (filtrat de RLS is_admin())
GRANT SELECT ON public.audit_log TO authenticated;
