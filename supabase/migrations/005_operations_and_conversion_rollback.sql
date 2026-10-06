-- ============================================================================
-- Rollback: 005_operations_and_conversion_rollback.sql
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_table_rls_policies();

DELETE FROM public.setari WHERE cheie = 'contact_email_notificari';

DROP INDEX IF EXISTS public.idx_cereri_inscriere_membru_id;

ALTER TABLE public.cereri_inscriere
    DROP COLUMN IF EXISTS membru_id;
