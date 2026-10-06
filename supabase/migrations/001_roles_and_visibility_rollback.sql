-- =============================================================================
-- ROLLBACK: 001_roles_and_visibility_rollback.sql
-- Description: Anularea migratiei 001_roles_and_visibility.sql si readucerea
--              politicilor RLS la starea anterioara.
-- =============================================================================

BEGIN;

-- 1. Eliminare politici STIRI
DROP POLICY IF EXISTS anon_select_stiri ON public.stiri;
DROP POLICY IF EXISTS admin_select_stiri ON public.stiri;
DROP POLICY IF EXISTS admin_insert_stiri ON public.stiri;
DROP POLICY IF EXISTS admin_update_stiri ON public.stiri;
DROP POLICY IF EXISTS admin_delete_stiri ON public.stiri;

-- 2. Eliminare politici MEMBRI
DROP POLICY IF EXISTS anon_select_membri ON public.membri;
DROP POLICY IF EXISTS admin_select_membri ON public.membri;
DROP POLICY IF EXISTS admin_insert_membri ON public.membri;
DROP POLICY IF EXISTS admin_update_membri ON public.membri;
DROP POLICY IF EXISTS admin_delete_membri ON public.membri;

-- 3. Eliminare politici ADMINI
DROP POLICY IF EXISTS admin_select_self ON public.admini;
DROP POLICY IF EXISTS owner_select_all_admini ON public.admini;
DROP POLICY IF EXISTS owner_manage_admini ON public.admini;

-- 4. Eliminare functii
DROP FUNCTION IF EXISTS public.admin_rol();
-- Pastram is_admin() daca era definit anterior, sau il readucem la forma minimala:
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.admini WHERE user_id = auth.uid() AND activ = true
  );
$$;

-- 5. Coloanele adaugate in admini (nu stergem rol/activ daca contin date de baza, dar putem elimina constraint-ul daca e nevoie)
-- ALTER TABLE public.admini DROP COLUMN IF EXISTS rol;

COMMIT;
