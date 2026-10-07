-- ═══════════════════════════════════════════════════════════════════════════
-- 008b_enforce_aal2.sql — PASUL DE ACTIVARE, DE REZERVAT
--
-- ⚠️⚠️ NU APLICA ACUM ⚠️⚠️
--
-- Acest fișier NU face parte din 008 și NU trebuie rulat ca parte din el.
-- Este separat pentru că impune 2FA la nivel de baza de date (decizia A2).
--
-- PRESTART — toate condițiile trebuie îndeplinite:
--   ☐ 100% din conturile de admin au TOTP activat și și-au notat secretul
--   ☐ Fiecare admin a intrat cel puțin o dată cu parolă/magic link + TOTP
--   ☐ Ai un owner de rezervă, care nu va fi blocat
--   ☐ Ai o sesiune de recuperare: acces direct la SQL Editor ca postgres,
--     pentru cazul în care funcțiile blochează toate sesiunile
--
-- ⚠️ DUPĂ APLICARE: testează login COMPLET (parolă sau magic link + TOTP)
--    ÎNAINTE să închizi sesiunea curentă. Nu te deconecta înainte să confirmi
--    că poți reveni. Dacă ceva nu merge, aplică 008b_rollback.sql.
--
-- EFECT: după aplicare, orice token fără aal='aal2' este tratat ca
-- non-admin de către TOATE politicile RLS. Un admin care intră doar cu
-- parolă va putea citi și scrie conținut public, dar nu va mai putea accesa
-- panoul. Aceasta e intenția.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Varianta 1: control strict prin admin_rol() ────────────────────────────
-- admin_rol() returnează 'none' dacă tokenul nu e aal2, deci toate
-- politicile care compară cu 'owner'/'editor' prind automat.
CREATE OR REPLACE FUNCTION public.admin_rol() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT rol FROM public.admini
    WHERE user_id = auth.uid() AND activ = true
      AND (auth.jwt() ->> 'aal') = 'aal2'
    LIMIT 1), 'none');
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.admini
    WHERE user_id = auth.uid() AND activ = true
      AND (auth.jwt() ->> 'aal') = 'aal2');
$$;

COMMIT;

-- ── VERIFICARE după aplicare ────────────────────────────────────────────────
-- Ambele trebuie să fie TRUE:
--   select pg_get_functiondef('public.admin_rol'::regproc) like '%aal2%';
--   select pg_get_functiondef('public.is_admin'::regproc) like '%aal2%';
--
-- NOTĂ despre admin_select_invited (007): folosește lower(email) vs
-- auth.jwt()->>'email' și NU depinde de admin_rol(), deci verifyAdminStatus
-- continuă să funcționeze fără aal2. Deci un admin fără TOTP vede în continuare
-- pasul 'unauthorized' în panou, nu un crash.
--
-- Dacă vrei ca și LOGIN-ul în panou să fie refuzat la nivel DB (nu doar
-- ascuns în UI), vezi secțiunea "Decizii deschise" din raport final.