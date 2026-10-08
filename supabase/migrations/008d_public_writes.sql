-- =============================================================================
-- 008d_public_writes.sql
-- Reparare: cheile anon nu poate insera, deci formularul public de inscriere
--           si telemetria site-ului sunt functionale doar in aparenta.
-- Data: 2026-10-08
-- =============================================================================
--
-- SIMPTOM
-- -------
-- Politicile RLS pentru scrierea publica existau si erau corecte, dar rolul
-- anon nu avea GRANT-urile corespunzatoare. In PostgreSQL, RLS decide CE
-- operatii sunt permise IN DENTRU GRANT-uri; daca GRANT-ul lipseste, accesul
-- e refuzat inainte ca RLS sa fie evaluat.
--
-- Verificat prin REST cu cheia anon, pe baza reala:
--
--   POST /rest/v1/cereri_inscriere
--     -> 401 {"code":"42501","message":"permission denied for table cereri_inscriere"}
--   POST /rest/v1/vizite
--     -> 401 {"code":"42501","message":"permission denied for table vizite"}
--
-- Tradus:
--
--   1. FORMULARUL PUBLIC DE INSCRIERE NU FUNCTIONA. Niciun vizitator nu putea
--      trimite o cerere. Singurul rand existent a fost creat manual din
--      Dashboard. Politica cereri_public_insert nu a fost niciodata consultata,
--      pentru ca PostgreSQL respinge apelul mai inainte, la verificarea
--      GRANT-ului.
--
--   2. TELEMETRIA ERA MOARTA. script.js:3631 si script.js:3652 trimit INSERT cu
--      cheia anon, iar ambele apeluri sunt "fire-and-forget":
--          client.from('vizite').insert([...]).then(() => {}).catch(() => {});
--      Eroarea 401 e prinsa si aruncata. Fiecare acces de pagina si fiecare
--      eveniment de telemetrie se pierdeau in taceri, fara urma. Panelul
--      Telemetrie din panou citeste corect, dar tabela ramane goala.
--
--   Aceeasi clasa de defect ca pingSupabaseHealth cu latente inventate
--   (raportul, T-J10.2): panoul afirma ceva ce nu poate fi adevarat.
--
-- REPARATIE
-- ---------
-- Se acorda exclusiv INSERT, si numai pe cele trei tabele pe care site-ul
-- public le scrie. Nu se acorda SELECT, pentru ca publicul nu trebuie sa
-- citeasca cereri de inscriere sau contoruri de vizite.
--
-- CU CHECK al politicilor existente:
--
--   cereri_inscriere  cereri_public_insert   consimtamant_gdpr IS TRUE
--                                            AND status = 'in_asteptare'
--                                            -> vizitatorul nu poate crea o
--                                               cerere cu alt status. GRANT-ul
--                                               deschide posibilitatea incercarii,
--                                               politica decide daca e acceptata.
--
--   vizite            vizite_public_insert   WITH CHECK (true)
--   evenimente        evenimente_public_insert WITH CHECK (true)
--                                            -> orice continut, deci riscul de
--                                               spam ramane (vezi raportul, D12).
--                                               Nu poate fi eliminat: scriptul
--                                               ruleaza in browserul vizitatorului,
--                                               unde cheia anon e publica.
--
-- DESPRE SECVENTE
-- ---------------
-- Coloanele id ale celor trei tabele sunt NOT NULL. Daca sunt definite cu
-- SERIAL, inserarea fara id explicit are nevoie de USAGE pe secventa
-- corespunzatoare. Blocul de mai jos acorda USAGE doar pe secventele care
-- apartin acestor trei tabele, nu pe toate secventele din schema.
-- Daca id-urile sunt IDENTITY, secventele nu sunt folosite la inserare si
-- blocul nu face nimic.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- GRANT-urile principale
-- -----------------------------------------------------------------------------

-- Formularul public de inregistrare. Politica cereri_public_insert decide ce
-- continut e acceptat; aici doar se permite tentativa.
GRANT INSERT ON public.cereri_inscriere TO anon;

-- Contor de acces la pagini. Scris de script.js:3631.
GRANT INSERT ON public.vizite TO anon;

-- Evenimente de telemetrie. Scris de script.js:3652.
GRANT INSERT ON public.evenimente TO anon;

-- -----------------------------------------------------------------------------
-- Secvente, doar pentru cele trei tabele de mai sus
--
-- Bucla cauta secventele din schema public al caror nume incepe cu numele
-- tabelului, deci nu atinge secventele celorlalte tabele.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_seq text;
BEGIN
    FOREACH v_seq IN ARRAY ARRAY['cereri_inscriere', 'vizite', 'evenimente']
    LOOP
        FOR v_seq IN
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relkind = 'S'
              AND c.relname LIKE v_seq || '\_%'
        LOOP
            EXECUTE format('GRANT USAGE ON SEQUENCE public.%I TO anon', v_seq);
            RAISE NOTICE 'USAGE acordat pe secventa %', v_seq;
        END LOOP;
    END LOOP;
END $$;

COMMIT;


-- =============================================================================
-- VERIFICARE 1 - GRANT-urile (interogare SQL Editor)
--
--   SELECT c.relname AS tabela, r.rolname AS rol, t.privilege_type
--   FROM information_schema.table_privileges t
--   JOIN pg_class c ON c.relname = t.table_name
--   JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
--   WHERE t.grantee = 'anon' AND t.table_name IN ('cereri_inscriere','vizite','evenimente')
--   ORDER BY c.relname;
--
-- Asteptat: trei randuri, toate INSERT. Daca apare SELECT sau DELETE,
-- acordarea a fost prea larga.
--
-- VERIFICARE 2 - efect real, cu cheie anon (test hotarat: lasa un rand real)
--
--   POST /rest/v1/vizite   cu {"pagina":"test-008d","sesiune":"test"}
--     -> asteptat 201
--
--   Randul ramane in tabela si apare in panelul Telemetrie. Poate fi sters
--   ulterior din panou sau cu:
--     DELETE FROM vizite WHERE pagina = 'test-008d';
--
--   POST /rest/v1/cereri_inscriere  - NU se ruleaza ca test, pentru ca
--   lasa o cerere de inscriere reala in tabel, care apare in panou si poate
--   ajunge la un membru. Daca formularul public trebuie probat de la un
--   calculator, atunci merge de la sine.
-- =============================================================================