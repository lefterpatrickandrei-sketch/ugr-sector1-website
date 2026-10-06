-- ============================================================================
-- Rollback: 002_content_tables_rollback.sql
-- Scop: Revenire la starea dinaintea migrării 002_content_tables.sql
-- Data: 2026-10-06
-- ============================================================================

-- 1. Ștergere triggeri și funcție updated_at
drop trigger if exists set_updated_at_leadership on public.leadership;
drop trigger if exists set_updated_at_faq on public.faq;
drop trigger if exists set_updated_at_documente on public.documente;
drop trigger if exists set_updated_at_stiri on public.stiri;
drop trigger if exists set_updated_at_membri on public.membri;
drop function if exists public.handle_updated_at();

-- 2. Ștergere tabele noi de conținut
drop table if exists public.setari cascade;
drop table if exists public.leadership cascade;
drop table if exists public.faq cascade;
drop table if exists public.documente cascade;

-- 3. Eliminare coloane adăugate în stiri
alter table public.stiri
    drop column if exists categorie,
    drop column if exists scope,
    drop column if exists locatie,
    drop column if exists link_actiune,
    drop column if exists text_buton,
    drop column if exists slug,
    drop column if exists deleted_at;

-- 4. Eliminare coloane adăugate în membri
alter table public.membri
    drop column if exists demonstrativ,
    drop column if exists deleted_at;

-- 5. Revenire la politicile de citire anonimă din migrarea 001
drop policy if exists stiri_citire_anonim on public.stiri;
create policy stiri_citire_anonim on public.stiri
    for select to anon
    using (publicat = true);

drop policy if exists membri_citire_anonim on public.membri;
create policy membri_citire_anonim on public.membri
    for select to anon
    using (afisare_publica = true);
