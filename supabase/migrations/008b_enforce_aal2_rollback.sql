-- ═══════════════════════════════════════════════════════════════════════════
-- 008b_enforce_aal2_rollback.sql
--
-- Readuce admin_rol() și is_admin() la varianta fără verificare AAL2
-- (adică cea din 001_roles_and_visibility.sql).
--
-- ⚠️ Folosește DOAR dacă 008b_enforce_aal2.sql a blocat accesul și nu poți
--    reveni. Altfel nu e necesar.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_rol() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT rol FROM public.admini
    WHERE user_id = auth.uid() AND activ = true
    LIMIT 1), 'none');
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.admini
    WHERE user_id = auth.uid() AND activ = true);
$$;

COMMIT;

-- Verificare: ambele trebuie FALSE
--   select pg_get_functiondef('public.admin_rol'::regproc) like '%aal2%';
--   select pg_get_functiondef('public.is_admin'::regproc) like '%aal2%';