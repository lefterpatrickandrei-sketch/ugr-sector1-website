-- =============================================================================
-- MIGRATION: 008a_admini_invites.sql
-- Descriere: Repară schema tabelei public.admini și activează fluxul de
--            invitație pentru administratori noi.
--
-- ⚠️  RULEAZĂ ACEASTA MIGRARE **ÎNAINTE** de 008_security_hardening.sql
--
-- De ce există: migrarea 007 (007_allow_invited_admin_null_user_id.sql) NU a
-- fost aplicată niciodată în această bază și nici nu putea fi aplicată.
-- 007 face `ALTER TABLE admini ALTER COLUMN user_id DROP NOT NULL`, dar în
-- baza reală user_id este CHEIA PRIMARĂ:
--
--     admini_pkey  PRIMARY KEY (user_id)
--
-- Postgres respinge DROP NOT NULL pe o coloană din cheia primară, deci 007
-- ar fi picat cu:
--     ERROR: column "user_id" is in a primary key
--
-- Tabela admini nu este creată de nicio migrare din acest repo (001 doar
-- inserează rânduri și creează politici), a fost creată din Supabase
-- Dashboard. Rezultatul este o divergență completă între cod și bază:
--
--   COLOANA      lipsă           motiv
--   ──────────────────────────────────────────────────────────────────────────
--   id           LIPSA           dar admin/js/views/roles.js folosește
--                               .eq('id', …), .select('id'), data-id
--   user_id      NOT NULL + PK   blocăm orice invitație (fluxul e imposibil)
--   email        NEUNIC         23505 nu poate niciodată să apară în roles.js
--
-- Politici și funcții existente în DB create din Dashboard, ABSENTE din repo:
--   admin_select_self, admini_select, owner_manage_admini,
--   owner_select_all_admini, limiteaza_cereri, log_admin_action,
--   marcheaza_procesare, rls_auto_enable, set_updated_at
--
-- Toate au fost evaluate în preflight și sunt sigure / utile — nu e
-- anulată niciuna.
--
-- Autor: OpenCode, pentru UGR Filiala Sector 1 București
-- Data: 2026-10-07
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Verificări precondiție — oprim migrarea curat dacă nu sunt îndeplinite
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_dup_email integer;
  v_dup_user  integer;
BEGIN
  -- email trebuie să poată deveni UNIQUE pentru tratarea codului 23505
  SELECT count(*) INTO v_dup_email
    FROM (SELECT email FROM public.admini
           GROUP BY lower(email) HAVING count(*) > 1) d;
  IF v_dup_email > 0 THEN
    RAISE EXCEPTION
      '008a oprit: % email-uri duplicate (diferenta doar de majuscule/minuscule). '
      'Rezolva manual inainte de a rula din nou.', v_dup_email
      USING HINT = 'SELECT email, count(*) FROM public.admini GROUP BY lower(email) HAVING count(*) > 1;';
  END IF;

  -- user_id trebuie să poată deveni UNIQUE pentru ca .maybeSingle() să fie sigur
  SELECT count(*) INTO v_dup_user
    FROM (SELECT user_id FROM public.admini
           WHERE user_id IS NOT NULL
           GROUP BY user_id HAVING count(*) > 1) d;
  IF v_dup_user > 0 THEN
    RAISE EXCEPTION
      '008a oprit: % user_id-uri duplicate. Rezolva manual inainte de a rula din nou.',
      v_dup_user
      USING HINT = 'SELECT user_id, count(*) FROM public.admini GROUP BY user_id HAVING count(*) > 1;';
  END IF;

  RAISE NOTICE '008a: preconditii OK (fara email-uri sau user_id-uri duplicate)';
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. T-S3b-pre — Introdu coloana `id`, pe care codul admin o folosește deja
--
-- O coadă de invite poate avea user_id IS NULL, deci `id` devine cheia
-- primară stabilă, iar user_id devine o cheie unică opțională. Aceasta este
-- forma standard Supabase pentru tabele de roluri cu invitații.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.admini ADD COLUMN IF NOT EXISTS id uuid;

-- Backfill explicit, deși DEFAULT ar umple rândurile noi. Idempotent.
UPDATE public.admini SET id = gen_random_uuid() WHERE id IS NULL;

ALTER TABLE public.admini ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.admini ALTER COLUMN id SET NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Cheia primară trece de pe user_id pe id
--
-- user_id nu mai poate rămâne PK dacă vrem să-l facem nullable.
-- Nicio tabelă nu referențiază admini, deci DROP CONSTRAINT e sigur.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_pkey;
ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_id_pkey;
ALTER TABLE public.admini ADD  CONSTRAINT admini_id_pkey PRIMARY KEY (id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. user_id devine NULLABLE + UNIQUE
--
-- Nullable  = permite rânduri de invitație, înainte de a exista contul
-- Unique     = garantează cel mult un rând per utilizator, deci
--              .maybeSingle() din auth.js nu poate întoarce multiplu
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.admini ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_user_id_key;
ALTER TABLE public.admini ADD  CONSTRAINT admini_user_id_key UNIQUE (user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. email devine UNIQUE
--
-- Necesar pentru două lucruri:
--   - admin/js/views/roles.js:431 tratează error.code === '23505' drept
--     „Acest email este deja înregistrat ca administrator" — imposibil
--     declanșat cât timp emailul nu e unic
--   - public.claim_admin_invite() caută după email cu LIMIT 1; fără unicitate
--     ar putea revendica un rând arbitrar
--
-- Unicitatea este pe valoarea exactă. Dacă vrei ca "Ion@x.ro" și
-- "ion@x.ro" să fie considerate același cont, spune-mi și trec
-- constrângerea pe o coloană generată, case-insensitive.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_email_key;
ALTER TABLE public.admini ADD  CONSTRAINT admini_email_key UNIQUE (email);


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Politică RLS: invitația poate fi găsită la prima conectare
--
-- ⚠️ DEVIERE INTENȚIONATĂ față de 007.
--
-- 007 folosea:
--     USING (lower(email) = lower(auth.jwt() ->> 'email') OR user_id = auth.uid())
--
-- Asta lăsa ORICE utilizator autentificat să verifice dacă o adresă
-- arbitrară este sau nu înregistrată ca administrator — enumerare de conturi.
-- Restrângem la rândurile care încă nu au fost revendicate:
--
--     user_id IS NULL  AND  emailul coincide cu cel din token
--
-- Revendicarea propriu-zisă o face claim_admin_invite() (SECURITY DEFINER),
-- care ocolește RLS, deci această politică nu blochează fluxul.
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS admin_select_invited ON public.admini;
CREATE POLICY admin_select_invited ON public.admini
  FOR SELECT TO authenticated
  USING (
    user_id IS NULL
    AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

COMMENT ON POLICY admin_select_invited ON public.admini IS
  'Permite utilizatorului autentificat sa isi vada propria invitare '
  '(user_id IS NULL) doar daca emailul coincide cu cel din token JWT. '
  'Restrictia user_id IS NULL exista ca sa nu se poata enumera ce alte '
  'adrese sunt inregistrate ca administratori.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Funcția SECURITY DEFINER de revendicare a invitației
--
-- Text preluat identic din 007:51-104. Singura diferență relevantă: 007
-- făcea UPDATE ... WHERE id = v_admin.id, iar coloana id nu exista în DB.
-- Acum există (pasul 1), deci funcția devine corectă pentru prima dată.
--
-- SECURITY DEFINER + search_path fixat = funcția rulează cu drepturile
-- proprietarului și ocolește RLS, exact cât trebuie pentru o singură
-- operație atomică.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.claim_admin_invite()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_admin public.admini%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Neautentificat');
  END IF;

  v_email := lower(COALESCE(auth.jwt() ->> 'email', ''));
  IF v_email = '' THEN
    SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;
  END IF;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Email indisponibil în token');
  END IF;

  -- Căutăm invitația activă, ne-revendicată, pentru emailul din token.
  -- user_id IS NULL evită ca un utilizator deja înregistrat să preia
  -- rândul altcuia prin schimbarea adresei de e-mail în cont.
  SELECT * INTO v_admin FROM public.admini
  WHERE lower(email) = v_email
    AND activ = true
    AND user_id IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nicio invitație activă găsită');
  END IF;

  UPDATE public.admini
    SET user_id = v_uid
   WHERE id = v_admin.id
     AND user_id IS NULL;   -- verificare optimistă, protejează contra cursei

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invitația a fost deja revendicată');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_admin.id,
    'email', v_admin.email,
    'rol', v_admin.rol,
    'activ', v_admin.activ,
    'user_id', v_uid
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_invite() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_admin_invite() TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. admin_claim_invited — NU se creează
--
-- 007:39-48 crea o politică UPDATE cu
--     USING (lower(email) = lower(jwt.email) AND (user_id IS NULL OR user_id = auth.uid()))
--     WITH CHECK (user_id = auth.uid())
--
-- Cu RLS, USING nu poate compara coloane între ele (RLS vede rândul nou, nu
-- vechi), deci WITH CHECK singur NU împiedica un utilizator să își
-- revendice rândul cu rol = 'owner'. Relația viewer → owner era posibilă.
-- Este exact riscul pe care T-S1 din 008 î elimină.
--
-- claim_admin_invite() de mai sus înlocuiește complet mecanismul, fiind
-- singurul UPDATE permis și doar pe coloana user_id.
--
-- NEAPĂRAT NU adăuga:
--     CREATE POLICY admin_claim_invited ON public.admini ...
--
-- Politicile existente în DB, create din Dashboard, se păstrează:
--     admin_select_self        SELECT  user_id = auth.uid()
--     admini_select            SELECT  (user_id = auth.uid()) OR is_admin()
--     owner_manage_admini      ALL     admin_rol() = 'owner'
--     owner_select_all_admini  SELECT  admin_rol() = 'owner'
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. Confirmare că schema e acum cea așteptată de cod
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.admini ORDER BY created_at LIMIT 1;
  IF v_id IS NULL THEN
    RAISE EXCEPTION '008a oprit: tabelul admini a ramas goala.'
      USING HINT = 'Verifica DELETE accidental sau RLS strict pe tabela.';
  END IF;
  RAISE NOTICE '008a: OK. id primar, user_id nullable+unic, email unic, policy+RPC create.';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- REZUMAT
--
--   PAS 1   id uuid PK, gen_random_uuid()       → repară admin/js/views/roles.js
--   PAS 2   PK mutată de pe user_id pe id       → face posibil DROP NOT NULL
--   PAS 3   user_id nullable + UNIQUE           → permite invitații, sigur pentru maybeSingle
--   PAS 4   email UNIQUE                        → activează tratamentul 23505 din roles.js
--   PAS 5   admin_select_invited, restrânsă      → fără enumerare de conturi
--   PAS 6   claim_admin_invite() SECURITY DEFINER→ revendicare atomică la login
--   PAS 7   admin_claim_invited NU se creează    → fără escaladare viewer → owner
--
-- VERIFICARE: 008_verify.sql, secțiunea V5 (structura admini) și V12 (invitații).
-- ROLLBACK:   008a_admini_invites_rollback.sql
-- APOI:       rulează 008_security_hardening.sql
-- ═══════════════════════════════════════════════════════════════════════════