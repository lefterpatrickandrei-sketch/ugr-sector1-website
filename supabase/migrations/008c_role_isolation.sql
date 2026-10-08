-- =============================================================================
-- 008c_role_isolation.sql
-- Reparare: politici care anuleaza ierarhia de roluri (owner/editor/viewer)
-- Data: 2026-10-08
-- Status: APLICAT manual in DB (vezi nota de mai jos), fisierul e idempotent
-- =============================================================================
--
-- PROBLEMA
-- --------
-- Tabelele membri si stiri aveau doua politici create din Supabase Dashboard,
-- absente din orice migratie din acest repo:
--
--     membri  ->  membri_admin_all   FOR ALL TO authenticated  USING (is_admin())
--     stiri   ->  stiri_admin_all    FOR ALL TO authenticated  USING (is_admin())
--
-- Functia is_admin() (001_roles_and_visibility.sql:47-58) raspunde:
--
--     SELECT EXISTS(SELECT 1 FROM public.admini
--                    WHERE user_id = auth.uid() AND activ = true)
--
-- Adica intreaba doar "exista un rand activ in admini?", fara sa verifice
-- coloana rol. Prin urmare is_admin() este TRUE si pentru rolul viewer.
--
-- Politicile RLS permissive se combina cu OR. O politica FOR ALL cu is_admin()
-- este deci suficiente pentru a acorda orice operatie oricarui rol activ,
-- iar politicile granulare care urmau sa impuna limitele rolurilor devin
-- irelevante:
--
--     operatie          politica granulata (corecta)      ce se aplica pana acum
--     ---------------   ------------------------------    --------------------------
--     DELETE membri     admin_delete_membri -> owner      membri_admin_all -> orice rol
--     UPDATE membri     admin_update_membri -> own+ed     membri_admin_all -> orice rol
--     DELETE stiri      admin_delete_stiri  -> owner      stiri_admin_all  -> orice rol
--     UPDATE stiri      admin_update_stiri  -> own+ed     stiri_admin_all  -> orice rol
--
-- Tradus: un cont cu rol viewer putea sterge membri din Registru si stiri
-- din arhiva. Iernahia de roluri scrisa cu grija in 001 era anulata de doua
-- politici create ulterior, care nu aveau cum sa fie cunoscute la scrierea
-- migrarilor.
--
-- REPARATIA
-- ---------
-- Se sterg cele doua politici suprascriitoare. NU se adauga nimic in locul
-- lor: pentru membri si stiri exista deja setul complet de politici granulare,
-- create de migrarile din repo si verificate corecte:
--
--     tabela    SELECT                INSERT                  UPDATE                  DELETE
--     -------   --------------------  ----------------------  ----------------------  ----------------------
--     membri    admin_select_membri   admin_insert_membri     admin_update_membri     admin_delete_membri
--               (is_admin)            (owner, editor)         (owner, editor)         (owner)
--     stiri     admin_select_stiri    admin_insert_stiri      admin_update_stiri      admin_delete_stiri
--               (is_admin)            (owner, editor)         (owner, editor)         (owner)
--
-- Acoperirea ramane completa: citire pentru orice rol activ, scriere pentru
-- owner si editor, stergere doar pentru owner.
--
-- CE NU SE SCHIMBA
-- ----------------
-- is_admin() ramane cum este. In politicile de SELECT ea este corecta: un
-- viewer trebuie sa poata citi integral registrul, conducerea, FAQ si
-- documentele. Problema era doar ca fusese folosita si in politici de
-- INSERT/UPDATE/DELETE.
--
-- ROLUL ROLLBACK-ULUI
-- --------------------
-- 008c_role_isolation_rollback.sql reface cele doua politici. NU il folosi
-- fara sa intelegi ce reintroduce: activeaza din nou stergerea membrilor si
-- stirilor de catre orice rol activ, inclusiv viewer.
--
-- NOTA DE APLICARE
-- ----------------
-- Cele doua DROP au fost rulate manual in Supabase SQL Editor inainte de a fi
-- scrise in acest fisier. Au returnat "Success. No rows returned", deci
-- cele doua politici au fost sterse. Rerularea acestui fisier este un no-op
-- sigur, datorita IF EXISTS.
-- =============================================================================

BEGIN;

-- R-1: politia care acorda INSERT/UPDATE/DELETE oricarui rol activ pe membri
DROP POLICY IF EXISTS membri_admin_all ON public.membri;

-- R-2: idem pentru stiri
DROP POLICY IF EXISTS stiri_admin_all ON public.stiri;

COMMENT ON POLICY admin_delete_membri ON public.membri IS
    'Stergerea unui membru este rezervata rolului owner. Politica membri_admin_all, care acorda is_admin() tuturor rolurilor active, a fost eliminata in 008c.';

COMMENT ON POLICY admin_delete_stiri ON public.stiri IS
    'Stergerea unei stiri este rezervata rolului owner. Politica stiri_admin_all, care acorda is_admin() tuturor rolurilor active, a fost eliminata in 008c.';

COMMIT;

-- =============================================================================
-- VERIFICARE
--
-- Asteapta 9 politici pe membri si stiri in total (fara *_admin_all):
--   membri -> admin_delete_membri, admin_insert_membri, admin_select_membri,
--             admin_update_membri, membri_citire_anonim            = 5
--   stiri  -> admin_delete_stiri, admin_insert_stiri, admin_select_stiri,
--             admin_update_stiri, stiri_citire_anonim              = 5
--
-- Interogare:
--   SELECT c.relname AS tabela, p.polname AS politica,
--          CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
--                         WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
--                         WHEN '*' THEN 'ALL' END AS comanda,
--          pg_get_expr(p.polqual, p.polrelid) AS calitate,
--          pg_get_expr(p.polwithcheck, p.polrelid) AS cu_check
--   FROM pg_policy p
--   JOIN pg_class c ON c.oid = p.polrelid
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relname IN ('membri','stiri')
--   ORDER BY c.relname, p.polname;
--
-- Test de efect, cu tokenul unui cont real de rol viewer (NU anon):
--   DELETE din membri  -> trebuie sa intoarca 0 rânduri, nu o eroare
--   DELETE din stiri   -> trebuie sa intoarca 0 rânduri, nu o eroare
-- Un viewer care primeste "0 rows" e corect: RLS filtreaza linia, nu da eroare.
-- =============================================================================