-- ═══════════════════════════════════════════════════════════════════════════
-- 008_security_hardening.sql
--
-- Migrare de securizare pentru panoul admin UGR Filiala Sector 1.
-- Idempotentă: DROP ... IF EXISTS + CREATE OR REPLACE.
--
-- ⚠️ NU RULA AUTOMAT. Rulează manual în Supabase SQL Editor, într-o singură
--    tranzacție. Vezi 008_verify.sql pentru verificarea de după aplicare.
--
-- Origine: C:\Users\lefpa\Downloads\ADMIN_V4_FIXES.md (Claude)
-- Adaptat: deciziile A1 (branch opencode-admin4-fixes), A2 (fără AAL2 în SQL),
--          A3 (doar owner|editor|viewer)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- T-S1 — Escaladare de privilegii prin `admin_claim_invited` (CRITIC)
--
-- Politica din 007 permite UPDATE pe ORICE coloană a propriului rând admin
-- (rol inclusiv), deci un `viewer` își poate seta singur rol = 'owner'.
-- RPC-ul `claim_admin_invite()` (SECURITY DEFINER) face deja asocierea
-- user_id ↔ rândul de invitație, deci politica e redundantă ȘI periculoasă.
--
-- De ce e suficient să o ștergem: `claim_admin_invite()` rulează cu
-- SECURITY DEFINER, deci nu depinde de politicile RLS ale utilizatorului.
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS admin_claim_invited ON public.admini;

COMMENT ON POLICY admin_select_invited ON public.admini IS
  'Citește propriul rând admin sau rândul de invitație potrivit email-ului din JWT. '
  'Reivindicarea user_id se face exclusiv prin RPC-ul claim_admin_invite() (SECURITY DEFINER).';


-- ═══════════════════════════════════════════════════════════════════════════
-- T-S2 — 2FA (AAL2) în baza de date — AMĂNAT INTENȚIONAT (decizia A2)
--
-- Documentul original cerea condiția
--     AND (auth.jwt() ->> 'aal') = 'aal2'
-- în funcțiile admin_rol() și is_admin().
--
-- NU este aplicată acum. Motive:
--   1. Nu toți administratorii au TOTP configurat. Condiția ar tăia
--      accesul imediat la aplicarea migrării, fără posibilitate de rollback
--      din UI (admin_rol() e folosită inclusiv de politicile de citire).
--   2. verifyAdminStatus citește tabela admini prin politica admin_select_invited,
--      care NU depinde de admin_rol(), deci login-ul rămâne posibil — dar
--      orice altă acțiune ar eșua, ceea ce e o stare de blocaj greu de diagnosticat.
--
-- PASUL DE ACTIVARE (după ce 100% din conturi au TOTP):
--   Rulează separat, nu în acest fișier:
--     supabase/migrations/008b_enforce_aal2.sql
--   Acesta rescrie admin_rol() și is_admin() cu clauza
--     AND (auth.jwt() ->> 'aal') = 'aal2'
--   NOTĂ: după aplicare, testează login COMPLET (parolă/magic link + TOTP)
--   înainte de a închide sesiunea curentă.
-- ═══════════════════════════════════════════════════════════════════════════

-- (funcțiile admin_rol() și is_admin() rămân cele din 001_roles_and_visibility.sql,
--  adică fără verificare AAL2. Nu le atingem aici.)


-- ═══════════════════════════════════════════════════════════════════════════
-- T-S3b — Curățare rolul legacy `admin` (decizia A3)
--
-- `admin` era permis de CHECK (001:24) dar se comporta incoerent:
--   - pe tabele nu avea drepturi de scriere (doar owner|editor)
--   - în storage și media.js era tratat ca owner
-- Rezultatul: un cont cu rol 'admin' putea șterge din media, dar nu putea
-- salva conținut. Migrăm la 'editor' (rolul cel mai apropiat ca drepturi)
-- și strângem constraint-ul la cele 3 roluri canonice.
-- ═══════════════════════════════════════════════════════════════════════════

-- Verificare pre-migrare (comentată ca să nu afișeze nimic la rulare):
-- SELECT rol, count(*) FROM public.admini GROUP BY rol;

UPDATE public.admini SET rol = 'editor' WHERE rol = 'admin';

ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_rol_check;
ALTER TABLE public.admini
  ADD CONSTRAINT admini_rol_check CHECK (rol IN ('owner', 'editor', 'viewer'));


-- ═══════════════════════════════════════════════════════════════════════════
-- T-S3 — Politici storage pentru bucket 'media' (CRITIC)
--
-- 006_expand_scope_and_fix_images.sql (liniile 34-47) a suprascris semantică
-- din 004 cu variante DESCHISE oricărui user 'authenticated':
--     WITH CHECK (bucket_id = 'media')   -- fără verificare de rol
-- Practic, orice cont logat putea scrie/șterge fișiere în media.
-- Re-aplicăm varianta corectă, din 004, adaptată la decizia A3 (fără 'admin').
-- ═══════════════════════════════════════════════════════════════════════════

-- Citire publică: bucket-ul e public, deci și citirea rămâne publică.
DROP POLICY IF EXISTS media_read ON storage.objects;
CREATE POLICY media_read ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'media');

-- Upload: owner și editor.
DROP POLICY IF EXISTS media_insert ON storage.objects;
CREATE POLICY media_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'media' AND
        public.admin_rol() IN ('owner', 'editor')
    );

-- Modificare / suprascriere: owner și editor.
DROP POLICY IF EXISTS media_update ON storage.objects;
CREATE POLICY media_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'media' AND
        public.admin_rol() IN ('owner', 'editor')
    )
    WITH CHECK (
        bucket_id = 'media' AND
        public.admin_rol() IN ('owner', 'editor')
    );

-- Ștergere: exclusiv owner.
DROP POLICY IF EXISTS media_delete ON storage.objects;
CREATE POLICY media_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'media' AND
        public.admin_rol() = 'owner'
    );


-- ═══════════════════════════════════════════════════════════════════════════
-- T-S4 — Coșul nu mai ascunde date din vizualizarea publică (CRITIC)
--
-- 001 a creat anon_select_membri și anon_select_stiri (liniile 87-88, 122-123)
-- fără clauza `deleted_at IS NULL`. Când 002 a creat variantele noi
-- (membri_citire_anonim / stiri_citire_anonim, care respectă deleted_at),
-- cele vechi NU au fost șterse — doar redenumite. Rezultat: rândurile din
-- coș (deleted_at NOT NULL) rămân vizibile public prin politicile vechi.
--
-- 002_content_tables.sql:229-237 (verificat) conține corect deleted_at is null:
--     stiri_citire_anonim  -> publicat = true AND deleted_at is null
--     membri_citire_anonim -> afisare_publica = true AND deleted_at is null
-- deci după ștergerea celor vechi, singurele politici anon rămase sunt corecte.
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS anon_select_membri ON public.membri;
DROP POLICY IF EXISTS anon_select_stiri  ON public.stiri;


-- ═══════════════════════════════════════════════════════════════════════════
-- T-S5 — `setari` nu mai e citibilă integral de anon (CRITIC)
--
-- 002_content_tables.sql:127 creează setari_citire_anonim cu USING (true),
-- deci orice cheie din tabelă e publică. Inclusiv contact_email_notificari,
-- care este o adresă internă folosită de notificări.
--
-- Cheile citite efectiv de site-ul public (script.js:2960-2971, verificat):
--     organizatie, ghid_aderare, telemetrie_sector1, pagina_%
-- Panoul admin citește doar pagina_* și doar ca 'authenticated'
-- (views/pages.js:208-211), deci nu e afectat de restricție.
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS setari_citire_anonim ON public.setari;
CREATE POLICY setari_citire_anonim ON public.setari
    FOR SELECT TO anon
    USING (
        cheie IN ('organizatie', 'ghid_aderare', 'telemetrie_sector1')
        OR cheie LIKE 'pagina\_%' ESCAPE '\'
    );

COMMENT ON POLICY setari_citire_anonim ON public.setari IS
  'Citire anonimă limitată la cheile consumate de site-ul public. '
  'Cheile interne (ex. contact_email_notificari) NU sunt publice.';

-- Notă: dacă vreun trigger / Edge Function consumă contact_email_notificari
-- cu rol anon, va înceta să funcționeze. Verifică înainte de aplicare
-- (vezi secțiunea "Decizii deschise" din raport).


-- ═══════════════════════════════════════════════════════════════════════════
-- T-S6 — get_table_rls_policies() doar pentru admini
--
-- 005_operations_and_conversion.sql:25 definește funcția ca LANGUAGE sql,
-- fără nicio verificare de rol → orice user 'authenticated' poate citi
-- toate politicile RLS din schemă (informație de arhitectură a bazei).
-- Rescriem în plpgsql cu verificare explicită.
--
-- Extindem și la schemă 'storage' (005 filtra doar 'public'), pentru că
-- views/coder.js afișează politicile de storage în consola dezvoltator.
--
-- Alias-ul 'p.' evită "column reference is ambiguous" în plpgsql.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_table_rls_policies()
RETURNS TABLE (
    schemaname text,
    tablename text,
    policyname text,
    permissive text,
    roles text[],
    cmd text,
    qual text,
    with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'forbidden: functia este rezervata administratorilor'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        p.schemaname::text,
        p.tablename::text,
        p.policyname::text,
        p.permissive::text,
        p.roles::text[],
        p.cmd::text,
        p.qual::text,
        p.with_check::text
    FROM pg_policies p
    WHERE p.schemaname IN ('public', 'storage')
    ORDER BY p.tablename, p.policyname;
END;
$$;

REVOKE ALL ON FUNCTION public.get_table_rls_policies() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_table_rls_policies() TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- T-S7 — Ultimul owner activ nu poate dispărea (CRITIC)
--
-- Fără acest trigger, un owner poate degradea/dezactiva/șterge inclusiv
-- ultimul rând cu rol 'owner' → proiectul rămâne fără niciun administrator
-- cu drepturi de țintă, iar recuperarea necesită intervenție manuală în DB.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.prevent_last_owner_loss() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.rol = 'owner' AND OLD.activ AND (
         TG_OP = 'DELETE'
         OR (TG_OP = 'UPDATE' AND (NEW.rol <> 'owner' OR NEW.activ = false))
       ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.admini
            WHERE rol = 'owner' AND activ AND id <> OLD.id
        ) THEN
            RAISE EXCEPTION 'Nu se poate elimina sau dezactiva ultimul owner activ.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_owner_loss ON public.admini;
CREATE TRIGGER trg_prevent_last_owner_loss
    BEFORE UPDATE OR DELETE ON public.admini
    FOR EACH ROW EXECUTE FUNCTION public.prevent_last_owner_loss();


-- ═══════════════════════════════════════════════════════════════════════════
-- T-S8 — Scoaterea SVG-ului din bucket-ul 'media'
--
-- Verificat înainte de aplicare:
--   - admin/js/ui/media.js:77 respinge deja 'image/svg+xml' la upload
--   - nu există referințe .svg din bucket 'media' în script.js / index.html /
--     data.js (grep: storage/v1/object/public/media/*.svg → 0 rezultate)
-- Prin urmare eliminarea tipului MIME nu întrerupe nimic funcțional și
-- închide vectorul de XSS prin SVG upload (marcajul de content inline).
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'application/pdf']
 WHERE id = 'media';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- REZUMAT
--
--   T-S1   șters        admin_claim_invited (escaladare viewer → owner)
--   T-S2   AMÂNAT        AAL2 în SQL (vezi 008b_enforce_aal2.sql)
--   T-S3   aplicat       storage media_* cu admin_rol(), fără 'admin'
--   T-S3b  aplicat       'admin' → 'editor'; CHECK restrâns la 3 roluri
--   T-S4   aplicat       șterse anon_select_membri / anon_select_stiri
--   T-S5   aplicat       setari anon limitat la allowlist
--   T-S6   aplicat       get_table_rls_policies() cere is_admin()
--   T-S7   aplicat       trigger anti pierdere ultim owner
--   T-S8   aplicat       'image/svg+xml' scos din bucket
--
-- VERIFICARE: rulează 008_verify.sql (read-only).
-- ROLLBACK: 008_security_hardening_rollback.sql
-- ═══════════════════════════════════════════════════════════════════════════