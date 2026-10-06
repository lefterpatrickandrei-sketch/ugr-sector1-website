-- ============================================================================
-- Rollback: 003_audit_and_trash_rollback.sql
-- Scop: Revenire la starea dinaintea migrării 003_audit_and_trash.sql
-- Data: 2026-10-06
-- ============================================================================

-- 1. Ștergere triggeri de audit
drop trigger if exists audit_membri on public.membri;
drop trigger if exists audit_stiri on public.stiri;
drop trigger if exists audit_leadership on public.leadership;
drop trigger if exists audit_faq on public.faq;
drop trigger if exists audit_documente on public.documente;
drop trigger if exists audit_setari on public.setari;
drop trigger if exists audit_admini on public.admini;

-- 2. Ștergere funcție trigger
drop function if exists public.audit_trigger();

-- 3. Ștergere tabelă audit_log
drop table if exists public.audit_log cascade;
