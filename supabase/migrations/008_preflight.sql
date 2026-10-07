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
--   lipește conținutul → Run. Output-ul apare într-un tabel jos.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- P1 — Distribuția rolurilor în tabela admini
--
-- Așteptat: cel puțin un rând cu rol 'owner' și activ = true.
-- Observă coloana "legacy_admin" — asta e câte rânduri cu rol 'admin'
-- pe care migrarea T-S3b le va converti automat în 'editor'.
-- ───────────────────────────────────────────────────────────────────────────
SELECT
    rol,
    activ,
    count(*) AS nr_conturi
FROM public.admini
GROUP BY rol, activ
ORDER BY rol, activ;


-- ───────────────────────────────────────────────────────────────────────────
-- P2 — Cine sunt owner-ii activi (nu anonimizat, doar rol + activ)
--
-- Așteptat: minimum un rând. Dacă lista e goală, T-S7 (triggerul
-- anti-pierdere ultim owner) nu are ce proteja și migrarea ar bloca
-- orice modificare viitoare a rolurilor. Anunță-mă înainte de a continua.
-- ───────────────────────────────────────────────────────────────────────────
SELECT rol, activ, count(*) AS nr
FROM public.admini
WHERE rol = 'owner'
GROUP BY rol, activ;


-- ───────────────────────────────────────────────────────────────────────────
-- P3 — Starea TOTP (2FA) per cont
--
-- Așteptat: 'configured' pentru conturile care au deja 2FA.
-- NULL sau 'unconfigured' înseamnă că unele conturi NU au 2FA.
--
-- ⚠️ NU e blocant pentru 008_security_hardening.sql (acela nu atinge AAL2).
--    E informativ: îți spune când va deveni sigur să rulezi
--    008b_enforce_aal2.sql. Răspunsul așteptat de mine: "am nevoie de asta".
-- ───────────────────────────────────────────────────────────────────────────
SELECT
    u.email,
    a.rol,
    a.activ,
    CASE
        WHEN u.factor IS NULL OR u.factor = 'null'
          OR NOT EXISTS (
                SELECT 1 FROM auth.mfa_amr_claims c
                WHERE c.user_id = a.user_id
                  AND c.amr @> ARRAY['totp']
              )
        THEN 'NU are 2FA'
        ELSE 'are 2FA'
    END AS stare_2fa
FROM public.admini a
JOIN auth.users u ON u.id = a.user_id
WHERE a.user_id IS NOT NULL
ORDER BY a.rol, u.email;


-- ───────────────────────────────────────────────────────────────────────────
-- P4 — Politica de escaladare care urmează să fie ștearsă (T-S1)
--
-- Așteptat: EXACT un rând, admin_claim_invited, cmd = UPDATE, roles = {authenticated}.
-- Dacă nu există, T-S1 e no-op (harmless). Dacă există mai multe politici
-- anon/authenticated pe admini, spune-mi.
-- ───────────────────────────────────────────────────────────────────────────
SELECT policyname, cmd, roles, permissive, qual, with_check
FROM pg_policies
WHERE tablename = 'admini'
  AND policyname = 'admin_claim_invited';


-- ───────────────────────────────────────────────────────────────────────────
-- P5 — Politici anon pe membri și stiri (T-S4)
--
-- Așteptat: anon_select_membri și anon_select_stiri, ambele fără
-- deleted_at IS NULL în qual. Exact asta e leak-ul pe care le ștergem.
-- După migrare, singurele politici anon rămase trebuie să conțină
-- deleted_at IS NULL.
-- ───────────────────────────────────────────────────────────────────────────
SELECT tablename, policyname, qual
FROM pg_policies
WHERE tablename IN ('membri', 'stiri')
  AND policyname LIKE 'anon%'
ORDER BY tablename;


-- ───────────────────────────────────────────────────────────────────────────
-- P6 — Politici storage pe bucket 'media' (T-S3)
--
-- Așteptat: media_insert / media_update / media_delete cu qual FĂRĂ
-- nicio referință la admin_rol() — deci deschise oricărui user
-- 'authenticated'. Exact starea creată de 006.
-- ───────────────────────────────────────────────────────────────────────────
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'media%'
ORDER BY policyname;


-- ───────────────────────────────────────────────────────────────────────────
-- P7 — Chei din `setari` în afara allowlist-ului (T-S5)
--
-- Așteptat: un singur rând, contact_email_notificari.
--
-- Motivul verificării: după migrare, anon NU mai poate citi decât
-- organizatie, ghid_aderare, telemetrie_sector1 și pagina_%. Am căutat în
-- repo și NU există Edge Function, trigger sau cod JS care să citească
-- contact_email_notificare cu rol anon (audit_trigger citește valorile
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
SELECT name, (storage.foldername(name))[1] AS folder
FROM storage.objects
WHERE bucket_id = 'media'
  AND name ~* '\.svg$'
LIMIT 50;


-- ───────────────────────────────────────────────────────────────────────────
-- P10 — Există deja trigger-ul din 008? (idempotență)
--
-- Așteptat: 0 rânduri la prima rulare.
-- ───────────────────────────────────────────────────────────────────────────
SELECT tgname, tgrelid::regclass AS tabela
FROM pg_trigger
WHERE tgname = 'trg_prevent_last_owner_loss';


-- ───────────────────────────────────────────────────────────────────────────
-- REZUMAT — spune-mi pe scurt:
--   P1  câți 'owner' activi există?
--   P2  lista nu e goală?
--   P3  cine nu are 2FA?
--   P4  admin_claim_invited există?
--   P5  cele două politici anon există?
--   P6  cele trei politici media_* sunt deschise?
--   P7  apare doar contact_email_notificari?
--   P8  svg e în allowed_mime_types?
--   P9  zero .svg în bucket?
--   P10 zero triggere?
--
-- Dacă toate răspunsurile sunt cele așteptate,PASUL URMĂTOR e 008_security_hardening.sql.
-- ═══════════════════════════════════════════════════════════════════════════