-- =============================================================================
-- 000_policies_verificat.sql  --  SNAPSHOT AL STARII REALE DIN bAZA DE DATE
-- =============================================================================
-- Data extragerii: 2026-10-08
-- Sursa: interogare directa pe catalogul PostgreSQL (pg_policy + pg_get_expr),
--        rulata pe proiectul Supabase de productie.
-- Scop:    ACEST FOLDER NU ESTE LANT DE MIGRARI.
--
-- DE CE EXISTA
-- -----------
-- O parte dintre politicile RLS din baza de date au fost create din interfata
-- Supabase Dashboard si nu apar in nicio migrare din acest repo. Concret, la
-- extractie, 9 politici si 2 tabele nu aveau nicio sursa in repo:
--
--     admini              admin_select_self, admini_select,
--                          owner_manage_admini, owner_select_all_admini
--     cereri_inscriere    cereri_admin_select, cereri_admin_update,
--                          cereri_admin_delete, cereri_public_insert
--     evenimente          evenimente_admin_select, evenimente_public_insert
--     vizite              vizite_admin_select, vizite_public_insert
--     jurnal_admin        tabela intreaga, cu politica ei
--     membri              membri_admin_all    (eliminata in 008c)
--     stiri               stiri_admin_all     (eliminata in 008c)
--
-- Consecinta: o baza de date reconstruita din migrarile acestui repo ar fi
-- arata diferit de cea reala, iar o revizie ulterioara nu ar sti ce s-a
-- schimbat. Acest fisier elimina diferenta.
--
-- CUM SE FOLOSESTE
-- ----------------
-- Fisierul este IDEMPOTENT si se poate rula oricand, inclusiv pe o baza deja
-- corecta: sterge fiecare politica pe care o redeclarationeaza si o recreeaza
-- in forma exacta de mai jos. Dupa rulare, DB-ul reproduce aceasta stare.
--
-- ATENTIE LA ORDINE
-- -----------------
-- Politicile apeleaza is_admin() si admin_rol(), definite in 001. Fisierul
-- trebuie rulat DOAR dupa 001..008c. Pe o baza goala, dupa 001 dar inainte de
-- 008a, admin_select_invited va refuza sa se creeze cu "cannot use column
-- user_id in policy expression" daca structura admini nu corespunde.
--
-- CE NU FACE ACEST FISIER
-- -----------------------
-- Nu activeaza RLS pe tabele. Nu acorda GRANT-uri. Nu atinge functiile
-- (is_admin, admin_rol, claim_admin_invite, get_table_rls_policies,
-- prevent_last_owner_loss si cele create din Dashboard). Nu declara
-- implicit ca un tabel nou sa mosteneasca politicile de mai sus.
--
-- INVENTAR: 43 politici pe 12 tabele (dupa eliminarea celor doua *_admin_all)
--
--   admini 5 | audit_log 1 | cereri_inscriere 4 | documente 5 | evenimente 2
--   faq 5 | jurnal_admin 1 | leadership 5 | membri 5 | setari 3 | stiri 5
--   vizite 2
--   = 5+1+4+5+2+5+1+5+5+3+5+2 = 43
-- =============================================================================


BEGIN;

-- -----------------------------------------------------------------------------
-- admini  (5 politici)
-- Rolurile: owner pastreaza controlul total, fiecare cont isi vede propriul rand.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS admin_select_invited ON public.admini;
-- Adresa introdusa in panou, inainte de a avea cont. Fara user_id, si doar
-- daca adresa din token coincide. Varianta aceasta e cea din 008a: permitea
-- enumerarea de conturi in varianta din 007.
CREATE POLICY admin_select_invited ON public.admini
    FOR SELECT TO authenticated
    USING (user_id IS NULL AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS admin_select_self ON public.admini;
CREATE POLICY admin_select_self ON public.admini
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS admini_select ON public.admini;
CREATE POLICY admini_select ON public.admini
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS owner_manage_admini ON public.admini;
CREATE POLICY owner_manage_admini ON public.admini
    FOR ALL TO authenticated
    USING (admin_rol() = 'owner')
    WITH CHECK (admin_rol() = 'owner');

DROP POLICY IF EXISTS owner_select_all_admini ON public.admini;
CREATE POLICY owner_select_all_admini ON public.admini
    FOR SELECT TO authenticated
    USING (admin_rol() = 'owner');


-- -----------------------------------------------------------------------------
-- audit_log  (1 politica)
-- Jurnalul e citit de orice rol activ. Nu are politica de scriere: scrierea
-- se face exclusiv din triggerul audit_trigger, cu SECURITY DEFINER, ca
-- aplicatia sa nu poata insera sau modifica intrari de audit.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS audit_read ON public.audit_log;
CREATE POLICY audit_read ON public.audit_log
    FOR SELECT TO authenticated
    USING (is_admin());


-- -----------------------------------------------------------------------------
-- cereri_inscriere  (4 politici)
-- Singurul tabel din schema public fara RLS activata in migrari; GRANT-urile
-- vin din fix_permissions_and_owner.sql. Politicile de mai jos exista in DB si
-- functioneaza, dar provin din Dashboard.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS cereri_admin_select ON public.cereri_inscriere;
CREATE POLICY cereri_admin_select ON public.cereri_inscriere
    FOR SELECT TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS cereri_admin_update ON public.cereri_inscriere;
CREATE POLICY cereri_admin_update ON public.cereri_inscriere
    FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS cereri_admin_delete ON public.cereri_inscriere;
CREATE POLICY cereri_admin_delete ON public.cereri_inscriere
    FOR DELETE TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS cereri_public_insert ON public.cereri_inscriere;
-- Singura cale prin care un vizitator scrie in baza. Nu poate insera un rand
-- cu alt status decat 'in_asteptare', pentru ca valoarea vine din coloana, nu
-- din corpul inserat: sursa de adevar ramane in server.
CREATE POLICY cereri_public_insert ON public.cereri_inscriere
    FOR INSERT TO anon, authenticated
    WITH CHECK (consimtamant_gdpr IS TRUE AND status = 'in_asteptare');


-- -----------------------------------------------------------------------------
-- documente  (5 politici)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS documente_citire_anonim ON public.documente;
CREATE POLICY documente_citire_anonim ON public.documente
    FOR SELECT TO anon
    USING (publicat = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS documente_citire_admin ON public.documente;
CREATE POLICY documente_citire_admin ON public.documente
    FOR SELECT TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS documente_scriere_admin ON public.documente;
CREATE POLICY documente_scriere_admin ON public.documente
    FOR INSERT TO authenticated
    WITH CHECK (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS documente_actualizare_admin ON public.documente;
CREATE POLICY documente_actualizare_admin ON public.documente
    FOR UPDATE TO authenticated
    USING (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS documente_stergere_admin ON public.documente;
CREATE POLICY documente_stergere_admin ON public.documente
    FOR DELETE TO authenticated
    USING (admin_rol() = 'owner');


-- -----------------------------------------------------------------------------
-- evenimente  (2 politici)
-- NEVERIFICAT: tabela nu apare in migrari, iar evenimente_public_insert are
-- WITH CHECK (true), deci orice vizitator neautentificat poate insera randuri
-- arbitrare. Nu s-a atins nimic. Necesita decizie (vezi raportul, D4).
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS evenimente_public_insert ON public.evenimente;
CREATE POLICY evenimente_public_insert ON public.evenimente
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS evenimente_admin_select ON public.evenimente;
CREATE POLICY evenimente_admin_select ON public.evenimente
    FOR SELECT TO authenticated
    USING (is_admin());


-- -----------------------------------------------------------------------------
-- faq  (5 politici)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS faq_citire_anonim ON public.faq;
CREATE POLICY faq_citire_anonim ON public.faq
    FOR SELECT TO anon
    USING (publicat = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS faq_citire_admin ON public.faq;
CREATE POLICY faq_citire_admin ON public.faq
    FOR SELECT TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS faq_scriere_admin ON public.faq;
CREATE POLICY faq_scriere_admin ON public.faq
    FOR INSERT TO authenticated
    WITH CHECK (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS faq_actualizare_admin ON public.faq;
CREATE POLICY faq_actualizare_admin ON public.faq
    FOR UPDATE TO authenticated
    USING (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS faq_stergere_admin ON public.faq;
CREATE POLICY faq_stergere_admin ON public.faq
    FOR DELETE TO authenticated
    USING (admin_rol() = 'owner');


-- -----------------------------------------------------------------------------
-- jurnal_admin  (1 politica)
-- Tabela nu apare in nicio migrare. CREATE TABLE a fost rulat din Dashboard.
-- RLS e activata, pentru ca policies exista si se aplica. Grantedges-urile si
-- structura coloanelor nu au fost extrase. Necesita decizie (vezi raportul, D4).
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS jurnal_admin_select ON public.jurnal_admin;
CREATE POLICY jurnal_admin_select ON public.jurnal_admin
    FOR SELECT TO authenticated
    USING (is_admin());


-- -----------------------------------------------------------------------------
-- leadership  (5 politici)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS leadership_citire_anonim ON public.leadership;
CREATE POLICY leadership_citire_anonim ON public.leadership
    FOR SELECT TO anon
    USING (afisare_publica = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS leadership_citire_admin ON public.leadership;
CREATE POLICY leadership_citire_admin ON public.leadership
    FOR SELECT TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS leadership_scriere_admin ON public.leadership;
CREATE POLICY leadership_scriere_admin ON public.leadership
    FOR INSERT TO authenticated
    WITH CHECK (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS leadership_actualizare_admin ON public.leadership;
CREATE POLICY leadership_actualizare_admin ON public.leadership
    FOR UPDATE TO authenticated
    USING (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS leadership_stergere_admin ON public.leadership;
CREATE POLICY leadership_stergere_admin ON public.leadership
    FOR DELETE TO authenticated
    USING (admin_rol() = 'owner');


-- -----------------------------------------------------------------------------
-- membri  (5 politici, dupa eliminarea membri_admin_all in 008c)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS membri_citire_anonim ON public.membri;
CREATE POLICY membri_citire_anonim ON public.membri
    FOR SELECT TO anon
    USING (afisare_publica = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS admin_select_membri ON public.membri;
CREATE POLICY admin_select_membri ON public.membri
    FOR SELECT TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS admin_insert_membri ON public.membri;
CREATE POLICY admin_insert_membri ON public.membri
    FOR INSERT TO authenticated
    WITH CHECK (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS admin_update_membri ON public.membri;
CREATE POLICY admin_update_membri ON public.membri
    FOR UPDATE TO authenticated
    USING (admin_rol() = ANY (ARRAY['owner', 'editor']))
    WITH CHECK (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS admin_delete_membri ON public.membri;
CREATE POLICY admin_delete_membri ON public.membri
    FOR DELETE TO authenticated
    USING (admin_rol() = 'owner');

-- Refuza sa revina policies suprascriitoare in DB prin rularea acestui fisier
-- intr-o baza unde 008c nu a fost aplicat.
DROP POLICY IF EXISTS membri_admin_all ON public.membri;


-- -----------------------------------------------------------------------------
-- setari  (3 politici)
-- setari_citire_anonim a fost rescrisa in 008 cu o lista explicita de chei.
-- Inainte era USING (true): orice cheie din tabel era descarcabila public,
-- inclusiv contact_email_notificari.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS setari_citire_anonim ON public.setari;
CREATE POLICY setari_citire_anonim ON public.setari
    FOR SELECT TO anon
    USING (
        cheie = ANY (ARRAY['organizatie', 'ghid_aderare', 'telemetrie_sector1'])
        OR cheie LIKE 'pagina\_%' ESCAPE '\'
    );

DROP POLICY IF EXISTS setari_citire_admin ON public.setari;
CREATE POLICY setari_citire_admin ON public.setari
    FOR SELECT TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS setari_modificare_admin ON public.setari;
CREATE POLICY setari_modificare_admin ON public.setari
    FOR ALL TO authenticated
    USING (admin_rol() = ANY (ARRAY['owner', 'editor']))
    WITH CHECK (admin_rol() = ANY (ARRAY['owner', 'editor']));


-- -----------------------------------------------------------------------------
-- stiri  (5 politici, dupa eliminarea stiri_admin_all in 008c)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS stiri_citire_anonim ON public.stiri;
CREATE POLICY stiri_citire_anonim ON public.stiri
    FOR SELECT TO anon
    USING (publicat = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS admin_select_stiri ON public.stiri;
CREATE POLICY admin_select_stiri ON public.stiri
    FOR SELECT TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS admin_insert_stiri ON public.stiri;
CREATE POLICY admin_insert_stiri ON public.stiri
    FOR INSERT TO authenticated
    WITH CHECK (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS admin_update_stiri ON public.stiri;
CREATE POLICY admin_update_stiri ON public.stiri
    FOR UPDATE TO authenticated
    USING (admin_rol() = ANY (ARRAY['owner', 'editor']))
    WITH CHECK (admin_rol() = ANY (ARRAY['owner', 'editor']));

DROP POLICY IF EXISTS admin_delete_stiri ON public.stiri;
CREATE POLICY admin_delete_stiri ON public.stiri
    FOR DELETE TO authenticated
    USING (admin_rol() = 'owner');

DROP POLICY IF EXISTS stiri_admin_all ON public.stiri;


-- -----------------------------------------------------------------------------
-- vizite  (2 politici)
-- Tabela nu apare in migrari. vizite_public_insert are WITH CHECK (true), deci
-- orice vizitator poate insera contoruri false. Necesita decizie (vezi D4).
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS vizite_public_insert ON public.vizite;
CREATE POLICY vizite_public_insert ON public.vizite
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS vizite_admin_select ON public.vizite;
CREATE POLICY vizite_admin_select ON public.vizite
    FOR SELECT TO authenticated
    USING (is_admin());

COMMIT;


-- =============================================================================
-- VERIFICARE DUPA RULARE
--
--   SELECT c.relname AS tabela, count(*) AS politici
--   FROM pg_policy p
--   JOIN pg_class c ON c.oid = p.polrelid
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public'
--   GROUP BY c.relname ORDER BY c.relname;
--
-- Asteptat: admini 5, audit_log 1, cereri_inscriere 4, documente 5,
--           evenimente 2, faq 5, jurnal_admin 1, leadership 5, membri 5,
--           setari 3, stiri 5, vizite 2. Total 43.
--
-- Daca apar membri_admin_all sau stiri_admin_all, 008c nu a fost aplicat.
-- =============================================================================