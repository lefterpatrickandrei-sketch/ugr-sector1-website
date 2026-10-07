-- ═══════════════════════════════════════════════════════════════════════════
-- 008_preflight.sql
--
-- CHECKPOINT DE CITIRE. NU MODIFICĂ NIMIC.
-- Rulează asta ÎNAINTE de 008_security_hardening.sql, ca să verificăm că
-- presupunerile migrării se potrivesc cu datele reale din baza ta.
--
-- Dacă vreun rezultat diferă de ce e aici, NU continua cu migrarea.
-- Trimite-mi output-ul și adaptăm SQL-ul.
--
-- Cum se rulează: Supabase Dashboard → SQL Editor → New query →
--   lipește conținutul → Run. Rulează tot fișierul dintr-un singur Run.
--
-- ⚠️ Acest fișier conține DOAR obiecte a căror structură am verificat-o în
--    migrations/ (public.admini, pg_policies, pg_trigger, storage.*,
--    information_schema, auth.users). Deliberat NU atinge auth.mfa_factors
--    sau auth.mfa_amr_claims: structura lor diferă între instalări
--    Supabase, iar o singură referință greșită oprește tot fișierul la
--    primul statement eșuat și pierdem toate celelalte rezultate.
--    Verificarea 2FA e în 008_preflight_2fa.sql, de rulat separat.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- P1 — Distribuția rolurilor în tabela admini
--
-- Așteptat: minimum un rând cu rol = 'owner' și activ = true.
--
-- Rândul cu rol = 'admin' e cel care contează pentru T-S3b: migrarea îl
-- va converti automat în 'editor'. Notează numărul, pentru comparație
-- după aplicare.
-- ───────────────────────────────────────────────────────────────────────────
SELECT
    rol,
    activ,
    count(*) AS nr_conturi
FROM public.admini
GROUP BY rol, activ
ORDER BY rol, activ;


-- ───────────────────────────────────────────────────────────────────────────
-- P2 — Owner-ii ACTIVI (restrâns explicit la activ = true)
--
-- Așteptat: EXACT un rând, owner / t / 1.
--
-- De ce e blocant dacă nu există: T-S7 (triggerul anti-pierdere ultim
-- owner) respinge orice operație care ar lăsa proiectul fără owner activ.
-- Fără niciun owner activ, migrarea s-ar aplica, dar orice modificare
-- viitoare a rolurilor ar eșua — deci am prefera să știm înainte.
-- ───────────────────────────────────────────────────────────────────────────
SELECT
    rol,
    activ,
    count(*) AS nr
FROM public.admini
WHERE rol = 'owner'
  AND activ = true
GROUP BY rol, activ;


-- ───────────────────────────────────────────────────────────────────────────
-- P3 — Conturile de administrator și starea conectării
--
-- LEFT JOIN ca să apară și rândurile de invitație care nu s-au logat
-- încă. Migration 007 a făcut user_id nullable tocmai pentru cazul acesta
-- (invitat înainte să-și creeze contul în auth.users), deci ramura
-- 'invitat, nu s-a conectat' e reală, nu teoretică.
--
-- Așteptat:
--   - 'invitat, nu s-a conectat' → normal, user_id IS NULL
--   - 'conectat' + last_sign_in_at → cont activ
--   - 'user_id fara cont in auth.users' → PROBLEMĂ, spune-mi
-- ───────────────────────────────────────────────────────────────────────────
SELECT
    a.rol,
    a.activ,
    a.email                                   AS email_admin,
    CASE
        WHEN a.user_id IS NULL THEN 'invitat, nu s-a conectat'
        WHEN u.id IS NULL       THEN 'user_id fara cont in auth.users'
        ELSE 'conectat'
    END                                        AS stare_cont,
    u.last_sign_in_at
FROM public.admini a
LEFT JOIN auth.users u ON u.id = a.user_id
ORDER BY a.rol, a.email;


-- ───────────────────────────────────────────────────────────────────────────
-- P4 — Politica de escaladare care urmează să fie ștearsă (T-S1)
--
-- Așteptat: EXACT un rând, admin_claim_invited, cmd = UPDATE,
-- roles = {authenticated}.
--
-- Filtrarea pe schemaname evită coliziuni cu politici omonime din
-- alte scheme.
--
-- Dacă nu există, T-S1 devine no-op (harmless). Dacă există politici
-- SUPLIMENTARE pe admini care dau UPDATE, spune-mi — le-am ratat.
-- ───────────────────────────────────────────────────────────────────────────
SELECT policyname, cmd, roles, permissive, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admini'
  AND policyname = 'admin_claim_invited';


-- ───────────────────────────────────────────────────────────────────────────
-- P5a — TOATE politicile de pe membri și stiri
--
-- Nu filtrăm după nume: o politică deschisă cu alt nume decât
-- 'anon_select_*' ar trece neobservată. Așteptat: rânduri pentru
-- membri_citire_anonim, membri_*_admin, stiri_citire_anonim,
-- stiri_*_admin, plus cele două anon_select_* vechi pe care le ștergem.
-- ───────────────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('membri', 'stiri')
ORDER BY tablename, policyname;


-- ───────────────────────────────────────────────────────────────────────────
-- P5b — Doft politicile care pot citi cu rol 'anon'
--
-- 'anon' apare ca 'anon' sau 'public' în vectorul roles.
--
-- Așteptat: EXACT patru rânduri —
--   anon_select_membri (001, veche, FĂRĂ deleted_at → leak coș)
--   anon_select_stiri  (001, veche, FĂRĂ deleted_at → leak coș)
--   membri_citire_anonim (002, CORECT: include deleted_at is null)
--   stiri_citire_anonim  (002, CORECT: include deleted_at is null)
--
-- După T-S4 trebuie să rămână doar ultimele două. Dacă apar și altele,
-- trimite-mi tot output-ul — înseamnă că există o sursă de leak pe care
-- nu o avem în migrations/.
-- ───────────────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('membri', 'stiri')
  AND (roles @> ARRAY['anon'] OR roles @> ARRAY['public'])
ORDER BY tablename, policyname;


-- ───────────────────────────────────────────────────────────────────────────
-- P6a — TOATE politicile de pe storage.objects care privesc bucket 'media'
--
-- Filtrez după conținutul expresiei (bucket_id = 'media'), nu după
-- numele politicii — altfel o politică deschisă cu alt nume ar scăpa.
--
-- Așteptat: media_read, media_insert, media_update, media_delete.
-- La T-S3 le re-aplicăm cu verificare de rol.
-- ───────────────────────────────────────────────────────────────────────────
SELECT policyname, cmd, roles, permissive, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
        policyname LIKE 'media%'
     OR coalesce(qual, '')       ILIKE '%media%'
     OR coalesce(with_check, '') ILIKE '%media%'
  )
ORDER BY policyname;


-- ───────────────────────────────────────────────────────────────────────────
-- P6b — Politici storage cu rol 'anon' sau 'authenticated' care NU
--       verifică deloc rolul de administrator
--
-- Astea sunt vectorii de atac reali: un user 'authenticated' oarecare
-- (inclusiv un 'viewer') ar putea scrie sau șterge în bucket.
--
-- Așteptat: cel puțin media_insert / media_update / media_delete din 006,
-- cu admin_rol() ABSENT din qual / with_check. Asta e exact ce T-S3
-- repară — confirmă-ne problema înainte s-o reparăm.
-- ───────────────────────────────────────────────────────────────────────────
SELECT policyname, cmd, roles, qual, with_check,
       (coalesce(qual, '') ILIKE '%admin_rol%'
        OR coalesce(with_check, '') ILIKE '%admin_rol%') AS verifica_rol
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (roles @> ARRAY['anon'] OR roles @> ARRAY['authenticated'])
  AND (coalesce(qual, '') ILIKE '%media%'
       OR coalesce(with_check, '') ILIKE '%media%')
ORDER BY policyname;


-- ───────────────────────────────────────────────────────────────────────────
-- P7 — Chei din `setari` în afara allowlist-ului (T-S5)
--
-- Așteptat: un singur rând, contact_email_notificari.
--
-- Motivul verificării: după migrare, anon NU mai poate citi decât
-- organizatie, ghid_aderare, telemetrie_sector1 și pagina_%. Am căutat în
-- repo și NU există Edge Function, trigger sau cod JS care să citească
-- contact_email_notificari cu rol anon (audit_trigger citește valorile
-- OLD/NEW, nu prin RLS). Deci e sigur — dar tu ai singurul cuvânt dacă
-- între timp ai construit altceva în afara repo-ului (ex. Zapier, Make,
-- un endpoint extern care citește setari cu anon key).
--
-- ✅ Răspuns așteptat: contact_email_notificari și NIMIC altceva.
-- ───────────────────────────────────────────────────────────────────────────
SELECT cheie, descriere
FROM public.setari
WHERE cheie NOT IN ('organizatie', 'ghid_aderare', 'telemetrie_sector1')
  AND cheie NOT LIKE 'pagina\_%' ESCAPE '\'
ORDER BY cheie;


-- ───────────────────────────────────────────────────────────────────────────
-- P8 — Tipuri MIME permise în bucket 'media' (T-S8)
--
-- Așteptat: 'image/svg+xml' prezent în listă. Migrarea îl elimină.
-- Am verificat în repo că nu există niciun .svg referit din acest bucket,
-- deci eliminarea nu întrerupe nimic funcțional.
-- ───────────────────────────────────────────────────────────────────────────
SELECT id, name, public, allowed_mime_types
FROM storage.buckets
WHERE id = 'media';


-- ───────────────────────────────────────────────────────────────────────────
-- P9 — Fișiere .svg existente în bucket 'media'
--
-- Așteptat: 0 rânduri. Dacă apar rânduri, NU continua — ar însemna că
-- există imagini SVG deja publicate care s-ar rupe.
-- ───────────────────────────────────────────────────────────────────────────
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'media'
  AND name ~* '\.svg$'
ORDER BY name
LIMIT 50;


-- ───────────────────────────────────────────────────────────────────────────
-- P10 — Există deja trigger-ul din 008? (idempotență)
--
-- Filtrare pe tgrelid, ca să nu prindem un trigger cu același nume de
-- pe altă tabelă, și NOT tgisinternal pentru a ignora trigger-ele
-- interne ale Postgre-ului.
--
-- Așteptat: 0 rânduri la prima rulare.
-- ───────────────────────────────────────────────────────────────────────────
SELECT tgname,
       tgrelid::regclass AS tabela,
       tgisinternal,
       pg_get_triggerdef(oid) AS definitie
FROM pg_trigger
WHERE tgname = 'trg_prevent_last_owner_loss'
  AND tgrelid = 'public.admini'::regclass
  AND NOT tgisinternal;


-- ───────────────────────────────────────────────────────────────────────────
-- REZUMAT — spune-mi pe scurt:
--   P1  distributia rolurilor? cate conturi cu rol 'admin' (legacy)?
--   P2  exact un rand owner/activ/1?
--   P3  toti apar 'conectat' sau 'invitat'? niciun 'user_id fara cont'?
--   P4  admin_claim_invited exista, cu UPDATE + authenticated?
--   P5a ce politici sunt pe membri si stiri, in total?
--   P5b exact cele 4 politici anon asteptate?
--   P6a ce politici storage ating bucket 'media'?
--   P6b care NU verifica rolul (verifica_rol = false)?
--   P7  apare doar contact_email_notificari?
--   P8  svg e in allowed_mime_types?
--   P9  zero .svg in bucket?
--   P10 zero triggere?
--
-- PASUL URMĂTOR: 008_preflight_2fa.sql (2FA), apoi
--              008_security_hardening.sql (migrarea propriu-zisă).
-- ═══════════════════════════════════════════════════════════════════════════