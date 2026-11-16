-- ============================================================================
-- Migrare: 010_public_content_rls.sql
-- Scop: păstrează o singură politică publică de citire pentru fiecare tabel
--       consumat de site și elimină politici istorice permisive/conflictuale.
-- ============================================================================

begin;

-- Politicile istorice pot rămâne în baza reală după modificări făcute din
-- Dashboard. Politicile PostgreSQL sunt OR-uite, de aceea toate variantele
-- publice cunoscute trebuie eliminate înainte de recrearea celor canonice.
drop policy if exists anon_select_leadership on public.leadership;
drop policy if exists leadership_public_select on public.leadership;
drop policy if exists leadership_citire_publica on public.leadership;
drop policy if exists anon_select_faq on public.faq;
drop policy if exists faq_public_select on public.faq;
drop policy if exists faq_citire_publica on public.faq;
drop policy if exists anon_select_documente on public.documente;
drop policy if exists documente_public_select on public.documente;
drop policy if exists documente_citire_publica on public.documente;
drop policy if exists anon_select_setari on public.setari;
drop policy if exists setari_public_select on public.setari;

drop policy if exists leadership_citire_anonim on public.leadership;
create policy leadership_citire_anonim on public.leadership
    for select to anon
    using (afisare_publica = true and deleted_at is null);

drop policy if exists faq_citire_anonim on public.faq;
create policy faq_citire_anonim on public.faq
    for select to anon
    using (publicat = true and deleted_at is null);

drop policy if exists documente_citire_anonim on public.documente;
create policy documente_citire_anonim on public.documente
    for select to anon
    using (publicat = true and deleted_at is null);

drop policy if exists setari_citire_anonim on public.setari;
create policy setari_citire_anonim on public.setari
    for select to anon
    using (
        cheie in ('organizatie', 'ghid_aderare', 'telemetrie_sector1')
        or cheie like 'pagina\_%' escape '\'
    );

grant select on public.leadership to anon;
grant select on public.faq to anon;
grant select on public.documente to anon;
grant select on public.setari to anon;

commit;
