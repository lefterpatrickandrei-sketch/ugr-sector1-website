-- =============================================================================
-- ROLLBACK: 007_allow_invited_admin_null_user_id_rollback.sql
-- =============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.claim_admin_invite();
DROP POLICY IF EXISTS admin_claim_invited ON public.admini;
DROP POLICY IF EXISTS admin_select_invited ON public.admini;

-- Notă: Nu putem re-adăuga NOT NULL dacă există rânduri cu user_id IS NULL fără a le curăța
-- DELETE FROM public.admini WHERE user_id IS NULL;
-- ALTER TABLE public.admini ALTER COLUMN user_id SET NOT NULL;

COMMIT;
