-- ═══════════════════════════════════════════════════════════════════════════
-- 008_preflight_2fa.sql
--
-- PASUL 2, după 008_preflight.sql. CITIRE, nu modifică nimic.
--
-- Rulat SEPARAT deoarece structura tabelelor MFA din schemata auth diferă
-- între instalări Supabase, iar o singură referință la o coloană inexistentă
-- oprește întregul batch și pierdem rezultatele celorlalte întrebări.
-- Așa, dacă P14 sau P15 pică, primele trei rezultate rămân valide.
--
-- De ce contează: 008b_enforce_aal2.sql NU trebuie aplicat până când
-- fiecare cont de administrator are TOTP verificat. Aceste întrebări îți
-- spun când e sigur.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- P11 — Structura reală a tabelelor MFA din schemata auth
--
-- Rulează asta PRIMA. Nu presupune niciun nume de coloană, deci nu poate
-- eșua cu 42703.
--
-- Așteptat: câteva rânduri, table_name de forma
--   auth.mfa_amr_claims / auth.mfa_factors / auth.mfa_challenge
--
-- Dacă lista e goală, proiectul nu are infrastructură MFA deloc.
-- Trimite-mi coloanele exact așa cum apar — rulez P12 cu numele reale.
-- ───────────────────────────────────────────────────────────────────────────
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name LIKE '%mfa%'
ORDER BY table_name, ordinal_position;


-- ───────────────────────────────────────────────────────────────────────────
-- P12 — TOTP per cont de administrator
--
-- ⚠️ Rulează DOAR dacă P11 a raportat coloanele user_id, factor_type și
--    status într-un table_name de tip auth.mfa_factors.
--
-- Sursa de adevăr e auth.mfa_factors cu status = 'verified': un factor
-- 'unverified' înseamnă că utilizatorul a început înscrierea TOTP dar nu a
-- confirmat codul, deci NU poate trece prin AAL2. Vectorul AMR dintr-un
-- auth.mfa_amr_claims descrie metodele folosite într-o SESIUNE, nu
-- factorii înscriși — de aceea verificarea pe factor e cea corectă.
--
-- LEFT JOIN ca să apară și invitații fără user_id.
--
-- Așteptat: 'are TOTP verificat' pentru fiecare cont conectat, înainte de
-- a ruleza vreodată 008b_enforce_aal2.sql.
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
    coalesce(f.nr_factori, 0)                  AS nr_factori_mfa,
    coalesce(f.nr_totp_verificati, 0)          AS nr_totp_verificati,
    CASE
        WHEN a.user_id IS NULL THEN 'nu se poate verifica'
        WHEN u.id IS NULL       THEN 'PROBLEMA'
        WHEN coalesce(f.nr_totp_verificati, 0) > 0 THEN 'are TOTP verificat'
        ELSE 'NU are TOTP verificat'
    END                                        AS stare_2fa
FROM public.admini a
LEFT JOIN auth.users u ON u.id = a.user_id
LEFT JOIN (
        SELECT
            user_id,
            count(*)                                                   AS nr_factori,
            count(*) FILTER (WHERE factor_type = 'totp'
                               AND status = 'verified')                AS nr_totp_verificati
        FROM auth.mfa_factors
        GROUP BY user_id
     ) f ON f.user_id = a.user_id
ORDER BY a.rol, a.email;