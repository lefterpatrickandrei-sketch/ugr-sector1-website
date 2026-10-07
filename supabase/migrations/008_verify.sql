-- ═══════════════════════════════════════════════════════════════════════════
-- 008_verify.sql — verificare READ-ONLY după aplicarea migrării 008
--
-- ⚠️ Nu modifică nimic. Rulează în Supabase SQL Editor după ce 008 a fost
--    aplicat cu succes. Trimite rezultatele înapoi pentru raport.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── V1 (T-S4) ───────────────────────────────────────────────────────────────
-- Așteptat: EXACT câte o politică anon per tabel.
--   membri → membri_citire_anonim
--   stiri  → stiri_citire_anonim
-- Dacă apare anon_select_membri / anon_select_stiri → 008 nu s-a aplicat complet.
select tablename, policyname, cmd, roles, qual
  from pg_policies
 where tablename in ('membri', 'stiri')
   and roles::text like '%anon%'
 order by tablename, policyname;


-- ── V2 (T-S1) ───────────────────────────────────────────────────────────────
-- Așteptat: admin_claim_invited NU apare în listă.
select policyname, cmd, roles
  from pg_policies
 where tablename = 'admini'
 order by policyname;


-- ── V3 (T-S3) ───────────────────────────────────────────────────────────────
-- Așteptat: 4 politici media_*, cu admin_rol() prezent
-- și cu șirul 'admin' ABSENT din lista de roluri.
select policyname, cmd, roles, qual, with_check
  from pg_policies
 where schemaname = 'storage'
   and tablename = 'objects'
   and policyname like 'media_%'
 order by policyname;


-- ── V4 (T-S5) ───────────────────────────────────────────────────────────────
-- Așteptat: setari_citire_anonim cu USING de tip allowlist
-- (cheie IN (...) OR cheie LIKE 'pagina\_%'), NU 'true'.
select policyname, cmd, roles, qual
  from pg_policies
 where tablename = 'setari'
 order by policyname;


-- ── V5 (T-S3b) ──────────────────────────────────────────────────────────────
-- Așteptat: doar owner, editor, viewer. Zero rânduri cu rol 'admin'.
select rol, count(*) as nr, count(*) filter (where activ) as nr_activi
  from public.admini
 group by rol
 order by rol;

-- Confirmă și că constraint-ul e restrâns (trebuie să existe 'admini_rol_check'):
select conname, pg_get_constraintdef(oid) as definitie
  from pg_constraint
 where conrelid = 'public.admini'::regclass
   and conname = 'admini_rol_check';


-- ── V6 (T-S6, T-S7) ────────────────────────────────────────────────────────
-- Așteptat: toate cele 5 funcții există.
select proname,
       prosecdef as security_definer,
       prorettype::regtype as retur
  from pg_proc
 where pronamespace = 'public'::regnamespace
   and proname in ('admin_rol', 'is_admin', 'claim_admin_invite',
                   'get_table_rls_policies', 'prevent_last_owner_loss')
 order by proname;

-- Trigger-ul anti pierdere ultim owner (trebuie să existe):
select tgname, tgrelid::regclass as tabel, tgenabled
  from pg_trigger
 where tgrelid = 'public.admini'::regclass
   and not tgisinternal
 order by tgname;


-- ── V7 (T-S8) ───────────────────────────────────────────────────────────────
-- Așteptat: fără 'image/svg+xml'.
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'media';


-- ── V8 (T-S2 amânat) ────────────────────────────────────────────────────────
-- Așteptat: FALSE pentru ambele. 2FA e verificat doar în UI (decizia A2).
-- Dacă aici apare TRUE, cineva a aplicat 008b_enforce_aal2.sql.
select
    (select pg_get_functiondef('public.admin_rol'::regproc)   like '%aal2%') as admin_rol_cere_aal2,
    (select pg_get_functiondef('public.is_admin'::regproc)   like '%aal2%') as is_admin_cere_aal2;


-- ── V9 (T-S5, efect real) ───────────────────────────────────────────────────
-- Așteptat: 0 rânduri. Dacă apare 1 rând, cheia e încă publică.
select cheie, valoare
  from public.setari
 where cheie = 'contact_email_notificari';

-- Așteptat: rânduri (site-ul public depinde de ele).
select cheie, count(*) as nr
  from public.setari
 where cheie in ('organizatie', 'ghid_aderare', 'telemetrie_sector1')
    or cheie like 'pagina\_%'
 group by cheie
 order by cheie;


-- ── V10 (T-S4, efect real) ─────────────────────────────────────────────────
-- Așteptat: 0 rânduri cu deleted_at NOT NULL.
-- Dacă apar rânduri șterse, o politică anon nu filtrează deleted_at.
select
    (select count(*) from public.membri where deleted_at is not null) as membri_in_cos,
    (select count(*) from public.stiri  where deleted_at is not null) as stiri_in_cos;


-- ── V11 (T-S6, test negativ) ───────────────────────────────────────────────
-- Rulează DUPĂ ce te-ai autentificat ca non-admin (viewer sau editor).
-- Așteptat: ERROR: forbidden: functia este rezervata administratorilor
select * from public.get_table_rls_policies() limit 1;