-- ═══════════════════════════════════════════════════════════════════════════
-- 008_security_hardening_rollback.sql
--
-- Readuce starea la cea de dinaintea lui 008_security_hardening.sql.
-- Idempotent: DROP ... IF EXISTS + CREATE OR REPLACE.
--
-- ⚠️ NU RULA AUTOMAT. Rulează manual în Supabase SQL Editor.
-- ⚠️ Citește secțiunile marcate „⚠️ REINTRODUCE RISC" înainte de aplicare:
--    câteva rollback-uri readuc exact vulnerabilitățile pe care 008 le-a
--    închis. Sunt păstrate pentru situația "am aplicat ceva și ceva nu merge",
--    nu ca variantă de folosire pe termen lung.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- R-1 (T-S7) — trigger + funcție anti pierdere ultim owner
-- Cel mai sigur rollback: nu reintroduce niciun risc.
-- ═══════════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_prevent_last_owner_loss ON public.admini;
DROP FUNCTION IF EXISTS public.prevent_last_owner_loss();


-- ═══════════════════════════════════════════════════════════════════════════
-- R-2 (T-S6) — get_table_rls_policies() → varianta din 005 (LANGUAGE sql)
--
-- ⚠️ REINTRODUCE RISC: revine la starea în care ORICE user autentificat
--    poate interoga politicile RLS. Acceptabil doar ca revenire temporară.
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT
        schemaname::text,
        tablename::text,
        policyname::text,
        permissive::text,
        roles::text[],
        cmd::text,
        qual::text,
        with_check::text
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
    ORDER BY tablename, policyname;
$$;

REVOKE ALL ON FUNCTION public.get_table_rls_policies() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_table_rls_policies() TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- R-3 (T-S8) — bucket 'media': reintroduce image/svg+xml
--
-- ⚠️ REINTRODUCE RISC: vector XSS prin SVG. media.js:77 blochează upload-ul
--    din UI, dar un client direct (curl / PostgREST) ar putea încărca SVG.
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf']
 WHERE id = 'media';


-- ═══════════════════════════════════════════════════════════════════════════
-- R-4 (T-S5) — setari: citire anonimă integrală (varianta din 002)
--
-- ⚠️ REINTRODUCE RISC: contact_email_notificari devine public.
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS setari_citire_anonim ON public.setari;
CREATE POLICY setari_citire_anonim ON public.setari
    FOR SELECT TO anon
    USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- R-5 (T-S4) — anon_select_membri / anon_select_stiri (varianta din 001)
--
-- ⚠️ REINTRODUCE RISC: rândurile din coș (deleted_at NOT NULL) devin
--    vizibile public, fiindcă aceste politici nu filtrează deleted_at.
--    ATENȚIE: politica stiri_citire_anonim rămâne în paralelă, deci
--    rândurile șterse devin publice pe stiri și membri.
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS anon_select_membri ON public.membri;
CREATE POLICY anon_select_membri ON public.membri
    FOR SELECT TO anon
    USING (afisare_publica = true);

DROP POLICY IF EXISTS anon_select_stiri ON public.stiri;
CREATE POLICY anon_select_stiri ON public.stiri
    FOR SELECT TO anon
    USING (publicat = true);


-- ═══════════════════════════════════════════════════════════════════════════
-- R-6 (T-S3) — storage: politicile DESCHISE din 006
--
-- ⚠️ REINTRODUCE RISC GRAV: orice user 'authenticated' (inclusiv un user
--    oarecare, nu doar adminii) poate insera, modifica și ȘTERGE obiecte din
--    bucket 'media'. Nu folosi acest rollback ca stare permanentă.
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS media_read ON storage.objects;
CREATE POLICY media_read ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS media_insert ON storage.objects;
CREATE POLICY media_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS media_update ON storage.objects;
CREATE POLICY media_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS media_delete ON storage.objects;
CREATE POLICY media_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'media');


-- ═══════════════════════════════════════════════════════════════════════════
-- R-7 (T-S3b) — rolul 'admin' redevine permis
--
-- NU migrăm automat rândurile înapoi la 'admin': 'editor' este un rol
-- valid, iar conversia automată ar putea acorda permisiuni greșite.
-- Dacă ai nevoie de starea exactă de dinainte, rulează MANUAL, doar dacă ai
-- notat ce rânduri erau 'admin' (comanda de verificare e în 008):
--
--   UPDATE public.admini SET rol = 'admin' WHERE id IN ( ... );
--
-- Doar constraint-ul:
ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_rol_check;
ALTER TABLE public.admini
  ADD CONSTRAINT admini_rol_check CHECK (rol IN ('owner', 'editor', 'viewer', 'admin'));


-- ═══════════════════════════════════════════════════════════════════════════
-- R-8 (T-S1) — admin_claim_invited
--
-- Versiunea ORIGINALĂ (007:40-48) permite UPDATE pe orice coloană a
-- propriului rând, deci un viewer își poate promova singur la owner:
--
--   ⚠️ REINTRODUCE RISC GRAV (escaladare de privilegii). Nu e necesar pentru
--      funcționarea aplicației: claim_admin_invite() (SECURITY DEFINER) funcționează
--      și fără această politică.
--
-- PRIN URMARE, rollback-ul de mai jos recrează o variantă RESTRÂNSĂ, care
-- lasă intact rolul de invitație dar limitează UPDATE-ul la asocierea
-- user_id. Dacă vrei varianta originală, decomentează blocul de la final.
-- ═══════════════════════════════════════════════════════════════════════════

-- Varianta sigură (recomandată):
DROP POLICY IF EXISTS admin_claim_invited ON public.admini;
CREATE POLICY admin_claim_invited ON public.admini
  FOR UPDATE TO authenticated
  USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    AND (user_id IS NULL OR user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ───────────────────────────────────────────────────────────────────────────
-- Varianta ORIGINALĂ din 007 (NECOMENTATĂ — reintroduce escaladarea):
--
-- DROP POLICY IF EXISTS admin_claim_invited ON public.admini;
-- CREATE POLICY admin_claim_invited ON public.admini
--   FOR UPDATE TO authenticated
--   USING (
--     lower(email) = lower(auth.jwt() ->> 'email')
--     AND (user_id IS NULL OR user_id = auth.uid())
--   )
--   WITH CHECK (
--     user_id = auth.uid()
--   );
--
-- Observație: relația strict limitată la user_id nu poate fi exprimată
-- într-o politică RLS (nu există comparație coloană-cu-coloană). Forma de
-- mai sus este cea mai apropiată de original, dar rămâne dependentă de
-- faptul că nicio altă politică nu permite UPDATE pe admini.
-- ───────────────────────────────────────────────────────────────────────────

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- DUPĂ ROLLBACK
--   R-1  curat
--   R-2  re-expune politicile RLS oricărui utilizator autentificat
--   R-3  re-permite SVG în media
--   R-4  re-publică cheile interne din setari
--   R-5  re-publică rândurile din coș (membri, stiri)
--   R-6  orice utilizator autentificat poate scrie/șterge în media
--   R-7  rolul 'admin' e permis din nou (rândurile rămân 'editor')
--   R-8  readucere limitată a politicii de claim (fără escaladare)
-- ═══════════════════════════════════════════════════════════════════════════