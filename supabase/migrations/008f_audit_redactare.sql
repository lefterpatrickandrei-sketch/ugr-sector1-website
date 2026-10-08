-- =============================================================================
-- 008f_audit_redactare.sql
-- Curata datele personale din audit_log cand un membru nu mai este membru.
-- Data: 2026-10-08
-- =============================================================================
--
-- DECIZIA LUI PATRICK
-- -------------------
-- "totdeauna pana cand nu mai e membru"
--
-- Adica: datele personale ale membrului se pastreaza in jurnal cat timp
-- persoana este membru, si se curata in momentul in care este scoasa din
-- registru. Nu se curata mai devreme, pentru ca atunci jurnalul nu ar mai
-- avea valoare operationala.
--
-- CE CONTINE MEMBRI
-- ------------------
--    id | nume | judet | serie_autorizatie | categorie | status |
--    afisare_publica | created_at | updated_at | demonstrativ | deleted_at
--
-- Doar doua coloane sunt date personale:
--    nume              numele si prenumele
--    serie_autorizatie numarul de act de identitate
--
-- Nu exista email, telefon, CNP sau IBAN in acest tabel. judet este
-- localitate, nu date despre o persoana. id este pastrat intentionat, pentru
-- ca jurnalul sa ramana legabil fara sa devina ilizibil.
--
-- CUM AJUNGE IN JURNAL
-- --------------------
-- Functia audit_trigger(), creata in 003, copiaza randul intreg inainte si
-- dupa modificare:
--
--     case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end  -> vechi
--     case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end  -> nou
--
-- Deci un membru sters din registru ramane in audit_log cu numele si
-- seria de act de identitate, definitiv.
--
-- MECHANISMUL
-- -----------
-- Se modifica audit_trigger(), nu se adauga un declansator nou. Motivul: un
-- declansator separat ar trebui sa ruleze inainte sau dupa audit_*, iar
-- ordinea dintre declansatoare cu aceeasi actiune si eveniment este data de
-- ordinea alfabetica a numelor, nu de o clauza ORDER. Modificarea functiei
-- elimina intreaga problema.
--
-- audit_log nu are niciun declansator, deci actualizarea de mai jos nu
-- declanseaza recursie.
--
-- Redactarea se declanseaza la doua momente:
--
--   1. membru sters logic: deleted_at trece de la null la o valoare.
--      Membri foloseste stergerea soft, deci asta este cazul real produs de
--      panou, prin trash.js.
--
--   2. membru sters definitiv: tg_op = 'DELETE'.
--
-- La fiecare dintre ele se curata TOATE randurile din audit_log ale acelui
-- membru, nu doar randul generat de operatia curenta. Altfel, daca un membru
-- are cinci editari in istoric, numele lui ar supravietui in cele cinci
-- randuri vechi, iar curatarea ar reprezenta doar ultima stergere.
--
-- Redactarea este idempotenta: aplicata de doua ori produce acelasi rezultat,
-- pentru ca "[redat:xxxxxxxx]" este tot o valoare in cheia nume, deci o
-- a doua aplicare reconstruieste exact aceeasi valoare din același id.
-- =============================================================================


BEGIN;

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_rand_id       text;
    v_vechi         jsonb;
    v_nou           jsonb;
    v_redacta       boolean;
BEGIN
    v_rand_id := coalesce(
        to_jsonb(new)->>'id',
        to_jsonb(old)->>'id',
        to_jsonb(new)->>'cheie',
        to_jsonb(old)->>'cheie'
    );

    -- Momentul in care persoana nu mai este membru:
    --   - stergere logica: deleted_at trece de la null la o valoare
    --   - stergere definitiva
    v_redacta := (
        tg_table_name = 'membri'
        AND (
            (tg_op = 'UPDATE'
                AND to_jsonb(old)->>'deleted_at' IS NULL
                AND to_jsonb(new)->>'deleted_at' IS NOT NULL)
            OR tg_op = 'DELETE'
        )
    );

    IF tg_op IN ('UPDATE', 'DELETE') THEN
        v_vechi := to_jsonb(old);
        IF v_redacta THEN
            v_vechi := public.redacteaza_pii_membru(v_vechi);
        END IF;
    END IF;

    IF tg_op IN ('INSERT', 'UPDATE') THEN
        v_nou := to_jsonb(new);
        IF v_redacta THEN
            v_nou := public.redacteaza_pii_membru(v_nou);
        END IF;
    END IF;

    INSERT INTO public.audit_log(actiune, tabel, rand_id, vechi, nou)
    VALUES (tg_op, tg_table_name, v_rand_id, v_vechi, v_nou);

    -- Daca membrul tocmai a iesit din registru, se curata tot istoricul lui.
    -- Randul inserat mai sus este inclus, pentru ca are acelasi rand_id.
    IF v_redacta THEN
        UPDATE public.audit_log
        SET vechi = public.redacteaza_pii_membru(vechi),
            nou  = public.redacteaza_pii_membru(nou)
        WHERE tabel = 'membri'
          AND rand_id = v_rand_id;
    END IF;

    RETURN coalesce(new, old);
END;
$function$;

COMMENT ON FUNCTION public.audit_trigger() IS
    'Jurnalizare pe audit_log. Pentru membri, redacteaza numele si seria de act de identitate din toate randurile acelui membru in momentul in care acesta iese din registru, prin deleted_at sau prin DELETE. Decizia: datele se pastreaza cat timp persoana este membru.';

COMMIT;


-- =============================================================================
-- VERIFICARE
--
--   1. Inainte de a testa, noteaza un rand real de membru. NU folosi un membru
--      real: redactarea este ireversibila.
--
--   2. Sterge un membru de test din panou ( trash.js -> stergere soft ), apoi:
--
--        SELECT count(*) AS ramase_neale
--        FROM audit_log
--        WHERE tabel = 'membri'
--          AND rand_id = '<id-ul membrului de test>'
--          AND (vechi->>'nume' LIKE '[redat%'
--            OR nou->>'nume' LIKE '[redat%'
--            OR vechi->>'serie_autorizatie' LIKE '[redat%'
--            OR nou->>'serie_autorizatie' LIKE '[redat%');
--
--      Asteptat: 0.
--
--   3. Un membru care NU a fost sters are in continuare datele complete:
--
--        SELECT rand_id, nou->>'nume' AS nume
--        FROM audit_log
--        WHERE tabel = 'membri' AND rand_id = '<alt id>'
--        ORDER BY creat_la DESC LIMIT 5;
--
--      Asteptat: numele apare in clar. Daca apare "[redat]", conditia de
--      declansare e prea larga si trebuie corectata inainte de a mai
--      continua.
-- =============================================================================
--
-- ROLLBACK
--
--     CREATE OR REPLACE FUNCTION public.audit_trigger()
--     RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
--     AS $function$
--     BEGIN
--         insert into public.audit_log(actiune, tabel, rand_id, vechi, nou)
--         values (
--             tg_op,
--             tg_table_name,
--             coalesce(
--                 to_jsonb(new)->>'id',
--                 to_jsonb(old)->>'id',
--                 to_jsonb(new)->>'cheie',
--                 to_jsonb(old)->>'cheie'
--             ),
--             case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
--             case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
--         );
--         return coalesce(new, old);
--     END;
--     $function$;
--
--     ATENTIE: rollback-ul nu readuce datele deja redactate. Ce s-a sters din
--     audit_log ramase sters. Redactarea nu e reversibila prin SQL, pentru ca
--     valoarea originala nu mai exista in baza de date.
--
-- =============================================================================