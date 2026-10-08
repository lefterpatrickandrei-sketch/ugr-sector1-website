-- =============================================================================
-- 008f_pii_redaction.sql
-- Retine datele personale din audit_log pana cand persoana nu mai este membru,
-- apoi le redimensioneaza, pastrand jurnalul util.
-- Data: 2026-10-08
-- =============================================================================
--
-- DECIZIA
-- ---------
-- "Pastreaza datele personale cat timp persoana este membru. Redimensioneaza
--  cand nu mai este."
--
-- CE SUNT DE FAPT DATELE PERSONALE
-- ---------------------------------
-- Pretentia initiala a fost ca audit_log retine, pentru membri, nume, email,
-- telefon, CNP si IBAN. Masurarea coloanelor din information_schema arata ca
-- public.membri are exact 11 coloane:
--
--     id, nume, judet, serie_autorizatie, categorie, status,
--     afisare_publica, created_at, updated_at, demonstrativ, deleted_at
--
-- Nu exista email, telefon, CNP sau IBAN. Sistemul nu stocheaza date de contact
-- per membru. Cele se afla in cereri_inscriere, tabel care NU are
-- audit_trigger, ci doar log_admin_action -- jurnalul care scrie doar numele
-- coloanelor modificate. Deci cererile nu sunt copiate integral in audit_log.
--
-- Ramase de redimensionat, in ordinea importantei:
--
--     membri.nume                 numele unei persoane reale
--     membri.serie_autorizatie     numar de serie al autorizatiei
--     admini.email                emailul unui administrator
--
-- leadership.telefon / leadership.email sunt si ele in audit_log, dar sunt
-- publicate pe site prin politica leadership_citire_anonim. Nu se ating: ar
-- distruge jurnalul fara sa elimine vreo expunere.
--
-- CE INSEAMNA "NU MAI ESTE MEMBRU"
-- -------------------------------
-- Pentru membri, statusul are doar trei valori posibile in interfata
-- (admin/panou.html:2160-2164): activ, suspendat, inactiv. Un membru nu mai
-- este membru daca:
--
--     status <> 'activ'        sau   randul a fost sters definitiv
--
-- COSUL NU CONTE. Un membru mutat in cos (deleted_at setat, status 'activ')
-- e RESTURABIL din panou (admin/js/views/trash.js, butonul de restaurare).
-- Redimensionarea lui ar stinge definitiv numele unui membru care or sa se
-- intoarca, iar numele NU poate fi recuperat din pseudonim. Deci cosul e
-- reversibil, deci nu se redacteaza.
--
-- Suspendat si inactiv trateaza la fel. Un membru temporar suspendat poate
-- reveni, dar numele lui ramane in jurnal pana la o decizie explicita de
-- mai departe. Asta e mai protector, nu mai putin.
--
-- CE LASE LA FEL
-- --------------
-- audit_log pastreaza in continuare: tabelul, actiunea, rand_id, timestampul
-- si toate coloanele nepersonale (categorie, status, afisare_publica,
-- demonstrativ, created_at, updated_at). Jurnalul ramane folosibil: se poate
-- raspunde "ce s-a intamplat cu acest membru" fara a mai sti cum il cheama.
--
-- NUMELE DE REDIMENSIONAT E UN PSEUDONIM STABIL, NU UN HASH AL NUMELUI
-- -------------------------------------------------------------------
-- nume devine  '[redat:XXXXXXXX]'  unde XXXXXXXX = primele 8 cifre ale
-- md5(id). Pseudonimul se calculeaza din id, nu din nume. Un md5 al numelui
-- ar fi tot date personala: numele romanesc are spatiu de cautare suficient
-- mic incat un dicionar sa il inverseze. Pseudonimul bazat pe id are
-- proprietatea mai putin probabila de a fi identificabil dintr-un dicionar.
--
--   membri.nume:              'Ion Popescu'  -> '[redat:3f9a1c02]'
--   membri.serie_autorizatie:  'UGR-0123'    -> '[redat]'
--   membri.judet:             neatins        (judetul singur nu identifica)
--
-- Id-UL RAMANE NEATINS
-- --------------------
-- rand_id din audit_log contine id-ul membrului, deci cineva cu acces la
-- audit_log poate lega doua intrari intre ele. Este intentionat: fara asta,
-- jurnalul nu mai poate fi folosit. Cine are acces la audit_log are oricum
-- acces la datele membrilor prin tabelele vii.
--
-- ORDINEA DECLASATORILOR -- DE CE TRG_REDACT_ SI NU AAA_
-- ---------------------------------------------------
-- PostgreSQL ruleaza declansatorii cu acelasi eveniment in ordine alfabetica
-- dupa nume. Redimensionarea trebuie sa ruleze DUPA audit_membri, pentru ca
-- randul nou sa existe deja in audit_log. Deci numele incepe cu 'trg_':
--
--     audit_membri              < trg_redact_membri_pii      (a < t)
--
-- Un nume de forma 'aaa_...' ar rula primul si ar lasa neacoperit randul tocmai
-- scris. Verificarea V3 de mai jos exista tocmai pentru a prinde asta de
-- situatie.
-- =============================================================================


BEGIN;


-- 1. Redimensionarea unui singur rand de audit_log.
--
-- Primește jsonb, întoarce jsonb. Cheile din lista PII sunt înlocuite, restul
-- rămân exact cum erau, inclusiv cheile pe care le va adăuga un viitor
-- update la tabelul membri -- motiv pentru care nu se folosește o listă de
-- "ce păstrăm", ci una de "ce eliminăm".
CREATE OR REPLACE FUNCTION public.redacteaza_pii_membru(p_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
    r_rezultat jsonb;
    r_pseudonim text;
BEGIN
    IF p_json IS NULL THEN
        RETURN NULL;
    END IF;

    -- Pseudonimul se bazeaza pe id. Daca id lipseste, md5('') ar fi acelasi
    -- pentru toate randurile, deci toate ar parea aceeasi persoana. In cazul
    -- acesta se renunta la pseudonim si se foloseste doar '[redat]'.
    r_pseudonim := '[redat]';
    IF p_json->>'id' IS NOT NULL AND p_json->>'id' <> '' THEN
        r_pseudonim := '[redat:' || left(md5(p_json->>'id'), 8) || ']';
    END IF;

    -- Se modifica doar cheile care exista deja. create_missing = true la
    -- jsonb_set NU e corect aici: ar ADAUGA chei inexistente in randul vechi
    -- sau nou, inventand coloane care nu au existat niciodata in acel rand.
    r_rezultat := p_json;

    IF p_json ? 'nume' THEN
        r_rezultat := jsonb_set(r_rezultat, '{nume}', to_jsonb(r_pseudonim), true);
    END IF;

    IF p_json ? 'serie_autorizatie' THEN
        r_rezultat := jsonb_set(r_rezultat, '{serie_autorizatie}', '"[redat]"'::jsonb, true);
    END IF;

    RETURN r_rezultat;
END;
$function$;

COMMENT ON FUNCTION public.redacteaza_pii_membru(jsonb) IS
    'Redimensioneaza datele personale dintr-un rand de audit_log pentru membri: nume devine un pseudonim stabil derivat din id (nu un hash al numelui), serie_autorizatie devine [redat]. Toate celelalte coloane raman neatinse, inclusiv cele necunoscute.';


-- 2. Declansatorul.
--
-- AFTER, pentru ca randul nou din audit_log sa fie deja scris.
CREATE OR REPLACE FUNCTION public.redacteaza_pii_la_dezmembrare()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_id text;
BEGIN
    -- REDIMENSIONAREA E IRREVERSIBILA, deci se face doar cand dezmembrarea e
    -- irreversibila. Doua conditii de iesire:
    --
    --   1. Randul nou are tot status 'activ'. Asta include si randul mutat in
    --      cos (deleted_at setat, status neatins): cosul e RESTURABIL din
    --      panou, deci persoana e inca membru si poate reveni. Redimensionarea
    --      in acest moment ar stinge definitiv numele unui membru care or sa se
    --      intoarca.
    --   2. DELETE: stergerea definitiva, singurul caz fara intoarcere.
    --
    -- Testul e pe starea CURENTA (NEW), nu pe cea anterioara: o redactare
    -- ratata se repara singura la urmatoarea editare, in loc sa depinda de
    -- faptul ca declansatorul a vazut exact tranzitia.
    IF TG_OP <> 'DELETE' AND NEW.status = 'activ' THEN
        RETURN NEW;
    END IF;

    -- La DELETE si la UPDATE id-ul e acelasi. OLD il acopera pe DELETE, unde
    -- NEW.status n-ar putea fi citit ("record new is not assigned yet").
    v_id := OLD.id::text;

    -- Conditia de la final face operatia idempotenta: randurile deja
    -- redimensionate nu sunt atinse din nou, deci se pot rescrie oricat.
    UPDATE public.audit_log
    SET vechi = public.redacteaza_pii_membru(vechi),
        nou   = public.redacteaza_pii_membru(nou)
    WHERE tabel = 'membri'
      AND rand_id = v_id
      AND (coalesce(vechi->>'nume', '') NOT LIKE '[redat%'
        OR coalesce(nou->>'nume', '') NOT LIKE '[redat%');

    RETURN coalesce(NEW, OLD);
END;
$function$;

COMMENT ON FUNCTION public.redacteaza_pii_la_dezmembrare() IS
    'Redimensioneaza datele personale din audit_log pentru membrii care nu mai sunt membri: status diferit de activ, sau rand sters definitiv. Randul mutat in cos (deleted_at setat, status activ) NU se redimensioneaza, fiindca e restaurabil. Declansator AFTER, declansat de trg_redact_membri_pii, care ruleaza dupa audit_membri.';


DROP TRIGGER IF EXISTS trg_redact_membri_pii ON public.membri;
CREATE TRIGGER trg_redact_membri_pii
    AFTER UPDATE OR DELETE ON public.membri
    FOR EACH ROW EXECUTE FUNCTION public.redacteaza_pii_la_dezmembrare();


-- 3. email-ul unui administrator, la fel: cat timp e activ, se pastreaza.
--
-- La dezactivare sau stergere, emailul din audit_log este redimensionat.
-- Fara asta, un administrator demis ar lasa adresa lui de e-mail in jurnal
-- pentru totdeauna, pe cand toate celelalte urme ale lui pot fi sterse.
CREATE OR REPLACE FUNCTION public.redacteaza_pii_admin(p_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
    IF p_json IS NULL THEN
        RETURN NULL;
    END IF;

    IF p_json ? 'email' THEN
        RETURN jsonb_set(p_json, '{email}', '"[redat]"'::jsonb, true);
    END IF;

    RETURN p_json;
END;
$function$;

CREATE OR REPLACE FUNCTION public.redacteaza_pii_la_dezactivare_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_id text;
BEGIN
    -- Acelasi principiu ca la membri: se testeaza starea curenta, nu tranzitia.
    --
    -- INSERT e si el acoperit, pentru ca o invitatie se creeaza direct cu
    -- activ = false (admin/js/views/roles.js). Adresa ei ajunge in audit_log
    -- la inserare si, fara INSERT in declansator, ar ramane neatinsa pana la
    -- prima modificare. Nu se pierde nimic: adresa e in continuare in
    -- admini.email, randul viu.
    IF TG_OP <> 'DELETE' AND NEW.activ IS NOT FALSE THEN
        RETURN NEW;
    END IF;

    -- audit_trigger foloseste to_jsonb(NEW)->>'id'. Dupa 008a, admini are
    -- coloana id (uuid, cheie primaria), iar user_id e nullable. Deci rand_id
    -- din audit_log este id, nu user_id.
    --
    -- OLD nu exista la INSERT, iar referirea lui acolo ar ridica erori
    -- ("record old is not assigned yet"). Deci la INSERT se citeste din NEW.
    IF TG_OP = 'DELETE' THEN
        v_id := OLD.id::text;
    ELSE
        v_id := NEW.id::text;
    END IF;

    UPDATE public.audit_log
    SET vechi = public.redacteaza_pii_admin(vechi),
        nou   = public.redacteaza_pii_admin(nou)
    WHERE tabel = 'admini'
      AND rand_id = v_id
      AND (coalesce(vechi->>'email', '') <> '[redat]'
        OR coalesce(nou->>'email', '') <> '[redat]');

    RETURN coalesce(NEW, OLD);
END;
$function$;

COMMENT ON FUNCTION public.redacteaza_pii_admin(jsonb) IS
    'Redimensioneaza emailul dintr-un rand de audit_log pentru admini: devine [redat]. Restul randului ramane neatins.';

COMMENT ON FUNCTION public.redacteaza_pii_la_dezactivare_admin() IS
    'Redimensioneaza emailul din audit_log pentru administratorii care nu mai sunt activi (activ = false) sau stersi definitiv. Declansator AFTER, pe INSERT OR UPDATE OR DELETE, declansat de trg_redact_admini, care ruleaza dupa audit_admini.';


DROP TRIGGER IF EXISTS trg_redact_admini ON public.admini;
CREATE TRIGGER trg_redact_admini
    AFTER INSERT OR UPDATE OR DELETE ON public.admini
    FOR EACH ROW EXECUTE FUNCTION public.redacteaza_pii_la_dezactivare_admin();


-- 4. Randuri deja existente in baza de date care ar trebui redimensionate.
--
-- Migratia nu rescrie istoricul deja acumulat. Redimensionarea istoricului
-- este o operatie deliberata, cu rezultat asumat, nu un efect secundar al unei
-- migratii: cineva trebuie sa stie ce devine ireversibil inainte sa se intample.
-- Interogarea de mai jos gaseste ce ar fi atins, daca se decide.
--
--   SELECT id, ts, actiune, rand_id, vechi->>'nume' AS nume_vechi, nou->>'status' AS status_nou
--   FROM audit_log
--   WHERE tabel = 'membri' AND coalesce(nou->>'nume', vechi->>'nume', '') NOT LIKE '[redat%'
--     AND coalesce(nou->>'status', '') <> 'activ'
--   ORDER BY ts DESC;
--
-- Dupa decizie, redimensionarea se ruleaza cu:
--
--   UPDATE audit_log
--   SET vechi = public.redacteaza_pii_membru(vechi),
--       nou   = public.redacteaza_pii_membru(nou)
--   WHERE tabel = 'membri'
--     AND coalesce(nou->>'nume', vechi->>'nume', '') NOT LIKE '[redat%'
--     AND coalesce(nou->>'status', '') <> 'activ';
-- =============================================================================


COMMIT;


-- =============================================================================
-- ROLLBACK
--
--     DROP TRIGGER IF EXISTS trg_redact_membri_pii ON public.membri;
--     DROP TRIGGER IF EXISTS trg_redact_admini ON public.admini;
--     DROP FUNCTION IF EXISTS public.redacteaza_pii_la_dezmembrare();
--     DROP FUNCTION IF EXISTS public.redacteaza_pii_la_dezactivare_admin();
--     DROP FUNCTION IF EXISTS public.redacteaza_pii_admin(jsonb);
--     DROP FUNCTION IF EXISTS public.redacteaza_pii_membru(jsonb);
--
-- ATENTIE: rollback-ul opreste redimensionarea viitoare. NU poate readuce
-- numele deja redimensionate, pentru ca pseudonimul nu poate fi inversat.
-- Ce s-a pierdut, s-a pierdut.
-- =============================================================================
--
-- VERIFICARE
--
--   V1. Declaratorii sunt atasati:
--       SELECT tgname, tgrelid::regclass, tgenabled
--       FROM pg_trigger
--       WHERE tgname IN ('trg_redact_membri_pii', 'trg_redact_admini');
--       Asteptat: 2 randuri, ambele enabled = 'O'.
--
--   V2. Functiile exista:
--       SELECT proname FROM pg_proc
--       WHERE proname LIKE 'redacteaza_pii%' ORDER BY proname;
--       Asteptat: 4 randuri.
--
--   V3. Ca sa nu se fi ratat ceva prin ordinea declansatorilor, cauta randuri
--       de membri neatinse pentru care dezmembrarea e IRREVERSIBILA.
--       Randurile de DELETE au nou = NULL, deci statusul nu se citeste din
--       'nou'; de aceea se testeaza si 'vechi'. Randurile in cos (status
--       'activ') NU se numara, fiindca e reversibile prin design.
--       SELECT count(*) FROM audit_log
--       WHERE tabel = 'membri'
--         AND coalesce(nou->>'status', vechi->>'status', '') <> 'activ'
--         AND coalesce(nou->>'nume', vechi->>'nume', '') NOT LIKE '[redat%';
--       Asteptat: 0. Daca nu e 0, declansatorul a rulat inaintea lui
--       audit_membri. Verifica numele: trebuie sa inceapa cu 'trg_'.
--
--   V4. Functional, fara a atinge un membru real:
--       INSERT INTO membri (id, nume, judet, serie_autorizatie, categorie, status)
--       VALUES ('TEST-PII-001', 'Persoana Test', 'Bucuresti', 'UGR-TEST-999', 'test', 'activ');
--
--       UPDATE membri SET deleted_at = now() WHERE id = 'TEST-PII-001';
--       SELECT count(*) FROM audit_log
--       WHERE tabel = 'membri' AND rand_id = 'TEST-PII-001'
--         AND (vechi->>'nume' = 'Persoana Test' OR nou->>'nume' = 'Persoana Test');
--       Asteptat: 0. COSUL NU REDIMENSIONEAZA. Daca iese diferit de 0, se
--       redacteaza la mutarea in cos, ceea ce ar stinge numele unui membru
--       care or sa fie restaurat.
--
--       UPDATE membri SET deleted_at = NULL, status = 'inactiv' WHERE id = 'TEST-PII-001';
--       SELECT actiune, vechi->>'nume' AS nume_vechi, nou->>'nume' AS nume_nou,
--              nou->>'serie_autorizatie' AS serie_noua
--       FROM audit_log
--       WHERE tabel = 'membri' AND rand_id = 'TEST-PII-001' ORDER BY ts;
--       Asteptat: 'Persoana Test' nu apare niciodata. apar doar
--       '[redat:XXXXXXXX]' si '[redat]'.
--
--       DELETE FROM membri WHERE id = 'TEST-PII-001';
--       SELECT count(*) FROM audit_log
--       WHERE tabel = 'membri' AND rand_id = 'TEST-PII-001'
--         AND (vechi->>'nume' = 'Persoana Test' OR nou->>'nume' = 'Persoana Test');
--       Asteptat: 0. Randul de DELETE se redacteaza si el: stergerea
--       definitiva inseamna tot "nu mai este membru".
--
--       Curatare (randurile din audit_log raman, dar sunt redimensionate):
--       DELETE FROM audit_log WHERE tabel = 'membri' AND rand_id = 'TEST-PII-001';
--
--   V5. La fel pentru admini. Se foloseste o adresa de test, care ramane in
--       admini.email (randul viu), deci nu se pierde nimic. Se retine id-ul
--       randului creat, ca sa nu se curate decat intrarile lui:
--       INSERT INTO admini (email, rol, activ)
--       VALUES ('test-pii@exemplu.ro', 'viewer', false) RETURNING id;
--       (noteaza id-ul, inlocuieste-l mai jos cu <ID>)
--
--       SELECT actiune, vechi->>'email' AS email_vechi, nou->>'email' AS email_nou
--       FROM audit_log
--       WHERE tabel = 'admini' AND rand_id = '<ID>' ORDER BY ts;
--       Asteptat: 0 randuri cu adresa reala. Invitatia s-a creat direct cu
--       activ = false, deci INSERT-ul ei trebuie redimensionat imediat.
--
--       Curatare (id-ul se ia din randul creat, nu se cauta dupa email, ca sa
--       nu se ating[a] jurnalul altui administrator):
--       DELETE FROM admini WHERE email = 'test-pii@exemplu.ro';
--       DELETE FROM audit_log WHERE tabel = 'admini' AND rand_id = '<ID>';
-- =============================================================================