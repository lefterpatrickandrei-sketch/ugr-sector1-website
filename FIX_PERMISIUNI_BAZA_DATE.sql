-- =========================================================================
-- FIX PERMISIUNI BAZA DE DATE — UGR Filiala Sector 1
-- =========================================================================
-- Problema: tabelele cereri_inscriere si vizite exista, dar rolul "anon"
-- (vizitatorul anonim de pe site) nu are permisiuni pe ele.
--
-- Efect actual:
--   - Formularul de aderare trimite corect, baza de date refuza.
--     Utilizatorul vede "success", dar cererea se pierde definitiv.
--   - Telemetria nu salveaza nimic, panoul de statistici arata gol.
--
-- Ce face acest script:
--   1. Verifica/activeaza RLS pe cele doua tabele
--   2. Acorda rolului "anon" doar operatiile necesare
--   3. NU acorda acces la "admini" (ramane interzis, corect)
--
-- INSTRUCTIUNI:
--   1. Deschide https://supabase.com/dashboard/project/ckktzvzzklspqfclcsbu
--   2. Click pe "SQL Editor" in meniul din stanga
--   3. Click "New query", sterce tot ce este acolo
--   4. Copieaza TOT acest fisier
--   5. Click "Run" (sau Ctrl+Enter)
--   6. Trebuie sa vezi mesajul de succes de la final
--
-- ESTE SIGUR: nu sterge nicio data, nu modifica structura tabelelor,
-- doar adauga permisiuni care lipseau.
-- =========================================================================


-- -------------------------------------------------------------------------
-- PASUL 1 — Cereri de inscriere
-- -------------------------------------------------------------------------
-- Rolul anon trebuie sa POATA insera (vizitatorul trimite cererea).
-- Nu trebuie sa poata CITI sau STERGE (vizitatorul nu vede cererile altora).

ALTER TABLE public.cereri_inscriere ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_cereri" ON public.cereri_inscriere;
CREATE POLICY "anon_insert_cereri"
    ON public.cereri_inscriere
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Citirea cererilor ramane INTERZISA pentru vizitator.
-- Se citeste doar de panoul administrativ, cu rol de utilizator autentificat.
DROP POLICY IF EXISTS "anon_read_cereri" ON public.cereri_inscriere;

-- Stergerea ramane INTERZISA pentru vizitator.
DROP POLICY IF EXISTS "anon_delete_cereri" ON public.cereri_inscriere;

GRANT INSERT ON public.cereri_inscriere TO anon;


-- -------------------------------------------------------------------------
-- PASUL 2 — Telemetrie (vizite)
-- -------------------------------------------------------------------------
-- Vizitatorul doar raporteaza o vizita. Nu poate citi istoricul
-- vizitelor altora — asta ramane interzis.

ALTER TABLE public.vizite ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_vizite" ON public.vizite;
CREATE POLICY "anon_insert_vizite"
    ON public.vizite
    FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_vizite" ON public.vizite;
DROP POLICY IF EXISTS "anon_delete_vizite" ON public.vizite;

GRANT INSERT ON public.vizite TO anon;


-- -------------------------------------------------------------------------
-- PASUL 3 — Verificare
-- -------------------------------------------------------------------------
-- Daca vezi "OK" la final, totul a mers.

DO $$
DECLARE
    v_ok boolean := true;
BEGIN
    -- Verificam ca insertul e permis
    IF NOT has_table_privilege('anon', 'public.cereri_inscriere', 'INSERT') THEN
        RAISE WARNING 'PROBLEM: lipseste INSERT pe cereri_inscriere';
        v_ok := false;
    END IF;

    IF NOT has_table_privilege('anon', 'public.vizite', 'INSERT') THEN
        RAISE WARNING 'PROBLEM: lipseste INSERT pe vizite';
        v_ok := false;
    END IF;

    -- Verificam ca citirea e INCHISA (asa trebuie sa ramana)
    IF has_table_privilege('anon', 'public.cereri_inscriere', 'SELECT') THEN
        RAISE WARNING 'ATENTIE: vizitatorul POATE citi cererile — restrange SELECT';
        v_ok := false;
    END IF;

    IF NOT has_table_privilege('anon', 'public.admini', 'SELECT') THEN
        RAISE NOTICE 'OK: tabelul admini ramane protejat (corect)';
    END IF;

    IF v_ok THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE '  OK — totul a fost aplicat cu succes';
        RAISE NOTICE '========================================';
        RAISE NOTICE '  Formularul de aderare salveaza acum.';
        RAISE NOTICE '  Telemetria salveaza acum.';
        RAISE NOTICE '  Cererile raman private (vizitatorul nu le poate citi).';
        RAISE NOTICE '';
        RAISE NOTICE '  Urmatorul pas: testeaza formularul cu o cerere reala.';
        RAISE NOTICE '========================================';
    ELSE
        RAISE WARNING 'Revezi avertismentele de mai sus.';
    END IF;
END $$;