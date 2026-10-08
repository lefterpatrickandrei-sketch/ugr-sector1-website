-- =============================================================================
-- 008e_anti_spam.sql
-- Intareste limitarea de cereri de inscriere, care putea fi folosita pentru a
-- bloca formularul tuturor vizitatorilor.
-- Data: 2026-10-08
-- =============================================================================
--
-- PROBLEMA
-- --------
-- Functia limiteaza_cereri() (creata din Dashboard, documentata in
-- supabase/baseline/000_functionii_si_trigere.sql) aplica doua limite:
--
--   1. acelasi email nu trimite doua cereri in 24 de ore    -> corect
--   2. cel mult 30 de cereri in 10 minute, GLOBALE         -> problematic
--
-- A doua verificare nu are niciun filtru:
--
--     IF (SELECT count(*) FROM public.cereri_inscriere
--         WHERE creat_la > now() - interval '10 minutes') >= 30 THEN
--         RAISE EXCEPTION 'prea_multe_cereri' ...
--
-- Tradus: 30 de cereri trimise de orice sursa opresc formularul de inscriere
-- al tuturor vizitatorilor, pentru 10 minute. Cheia anon este publica, deci
-- oricine poate face asta din curl, in bucla.
--
-- Pana la aplicarea lui 008d ( GRANT INSERT pentru anon) limita nu putea
-- porni, pentru ca formularul nu functiona deloc. 008d a facut formularul
-- functional si,odata cu el, a activat si suprafata de atac. Implicatia nu a
-- fost evaluata inainte de aplicare.
--
-- DE CE NU SE POATE LIMITA PER IP
-- ------------------------------
-- Varianta evidenta ar fi o limita per adresa de IP. Nu e fezabila aici:
--
--   inet_client_addr()    -> intoarce adresa serverului PostgREST, nu a
--                            vizitatorului, pentru ca toate cererile trec prin
--                            infrastructura intermediară Supabase. Ar fi aceeasi
--                            valoare pentru toata lumea, deci identica cu
--                            limita globala.
--
--   x-forwarded-for       -> poate fi falsificat de client. O limita construita
--                            pe o valoare falsificabila nu ofera protectie, iar
--                            daca e prea stricta, poate bloca vizitatori
--                            legitimi cu proxy sau retea comună.
--
-- Asadar protectia ramine pe ce se poate sustine cu date reale: emailul.
--
-- CE SE SCHIMBA
-- -------------
--   1. Se pastreaza regula de 1 cerere per email la 24 de ore.
--   2. Se adauga o limita de 3 cereri per email la 24 de ore. Aceasta prinde
--      cazul in care un vizitator sau un automat trimite aceeasi adresa in
--      timp real, in timp ce regula 1 se bazeaza pe faptul ca o cerere
--      nereusita nu se salveaza.
--   3. Pragul global creste de la 30 la 100 cereri in 10 minute.
--
-- Pragul global creste intentionat. Un prag mic nu descurajeaza atacatorul --
-- 30 de cereri sunt putine -- ci blocheaza mai repede vizitatorii reali. Cu
-- 100, e nevoie de 100 de cereri false ca formularul sa devina inutilizabil,
-- iar acele cereri ajung oricum in tabel. Exact acele cereri sunt cele pe care
-- le vori ulterior sa le stergem, nu sa le pastram.
--
-- LIMITA RAMANE, SI E ONEST SA FIE SPUSA
-- ---------------------------------------
-- Fara o adresa de IP de incredere, un atacator doritor poate bloca in
-- continuare formularul, cu 100 in loc de 30. E un efort de 3,3 ori mai mare,
-- nu o interzicere. Interzicerea reala ar cere o limita per IP la nivel de
-- retea, adica o configurare in afara bazei de date.
--
-- Ce reduce cel mai mult riscul e un CAPTCHA in formular, aplicat la randul
-- lui in panou. Nu s-a atins: depinde de alegerea furnizorului.
-- =============================================================================


BEGIN;

CREATE OR REPLACE FUNCTION public.limiteaza_cereri()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_cereri_24h integer;
    v_cereri_10min integer;
BEGIN
    -- 1. Un email nu poate cere de doua ori in 24 de ore.
    IF EXISTS (
        SELECT 1 FROM public.cereri_inscriere
        WHERE lower(email) = lower(NEW.email)
          AND creat_la > now() - interval '24 hours'
    ) THEN
        RAISE EXCEPTION 'cerere_duplicata' USING ERRCODE = 'P0001';
    END IF;

    -- 2. acelasi email, cel mult 3 cereri in 24 de ore.
    --    Prinde retragerile repetate si automatele care nu reusesc sa trimita
    --    o cerere valida.
    SELECT count(*) INTO v_cereri_24h
    FROM public.cereri_inscriere
    WHERE lower(email) = lower(NEW.email)
      AND creat_la > now() - interval '24 hours';

    IF v_cereri_24h >= 3 THEN
        RAISE EXCEPTION 'prea_multe_cereri_acelasi_email' USING ERRCODE = 'P0001';
    END IF;

    -- 3. Prag global. Protejeaza baza de date de inundatie, fara a opri
    --   /formularul la primele 30 de cereri ale zilei.
    SELECT count(*) INTO v_cereri_10min
    FROM public.cereri_inscriere
    WHERE creat_la > now() - interval '10 minutes';

    IF v_cereri_10min >= 100 THEN
        RAISE EXCEPTION 'prea_multe_cereri' USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.limiteaza_cereri() IS
    'Anti-abuz la inscriere: 1 cerere per email la 24h, maxim 3 per email la 24h, maxim 100 cereri in total la 10 minute. Limita per IP nu e posibila: inet_client_addr() intoarce adresa PostgREST, iar x-forwarded-for se falsifica. Pragul global a crescut de la 30 la 100 intentionat, pentru ca un prag mic nu descurajeaza atacatorul, ci blocheaza mai repede vizitatorii reali.';

COMMIT;


-- =============================================================================
-- ROLLBACK
--
--     REVOKE ... nu se aplica; se ruleaza functia initiala:
--
--     CREATE OR REPLACE FUNCTION public.limiteaza_cereri()
--     RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
--     AS $function$
--     BEGIN
--         IF EXISTS (SELECT 1 FROM public.cereri_inscriere
--                    WHERE lower(email) = lower(NEW.email)
--                      AND creat_la > now() - interval '24 hours') THEN
--             RAISE EXCEPTION 'cerere_duplicata' USING ERRCODE = 'P0001';
--         END IF;
--         IF (SELECT count(*) FROM public.cereri_inscriere
--             WHERE creat_la > now() - interval '10 minutes') >= 30 THEN
--             RAISE EXCEPTION 'prea_multe_cereri' USING ERRCODE = 'P0001';
--         END IF;
--         RETURN NEW;
--     END;
--     $function$;
--
-- =============================================================================
-- VERIFICARE
--
--   1. Ca sa nu se blocheze, verifica inainte numarul de cereri din ultimele
--      10 minute:
--        SELECT count(*) FROM cereri_inscriere
--        WHERE creat_la > now() - interval '10 minutes';
--      Daca e peste 90, asteapta sau curata randurile de test.
--
--   2. Test de efect, cu cheie anon, dupa ce nu exista cereri recente:
--        POST /rest/v1/cereri_inscriere
--          {"nume_complet":"test spam","email":"test@exemplu.ro", ...}
--      Adauga conditiile pe care le cere politica cereri_public_insert:
--      consimtamant_gdpr = true si status = 'in_asteptare'.
--      Asteptat la primul: 201.
--
--   3. Trimite din nou cu aceeasi adresa, imediat:
--      Asteptat: 401 cerere_duplicata.
--      Asta era si inainte de 008e, deci nu dovedeste nimic nou.
--
--   4. Pentru regula noua de 3 la 24 de ore e nevoie de 3 cereri REUSITE cu
--      aceeasi adresa, dar regula 1 o blocheaza la prima. Testul nu se poate
--      face fara a modifica functia. E o regula de siguranta, nu ceva care
--      trebuie demonstrat.
-- =============================================================================