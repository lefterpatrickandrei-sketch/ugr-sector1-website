-- =============================================================================
-- 000_functionii_si_trigere.sql  --  FUNCTII SI DECLANSATORI DIN DB
-- =============================================================================
-- Data extragerii: 2026-10-08
-- Surse: pg_proc + pg_get_functiondef, respectiv pg_trigger.
--
-- ACEST FOLDER NU ESTE LANT DE MIGRARI. Documentatie, nu migrare.
--
-- De ce exista
-- ------------
-- 5 functii si 20 de declansatori din baza de date nu apar in nicio migrare
-- din acest repo. Au fost create din interfata Supabase Dashboard. Fara ele,
-- o baza reconstruita din migrari s-ar desincroniza imediat de cea reala,
-- iar o revizie ulterioara nu ar sti ce s-a schimbat.
--
-- Toate sunt idempotente si pot fi rulate ca atare, dupa 001..008d.
-- =============================================================================


-- =============================================================================
-- PARTEA 1 -- FUNCTII DE SECURITATE DIN DASHBOARD
--
-- Analiza fiecareia, cu ce e corect si ce merita discutat.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- public.admin_rol() si public.is_admin() -- din 001, nu reproduse aici.
--
-- ATENTIE LA is_admin(): nu citeste coloana rol.
--
--     SELECT EXISTS(SELECT 1 FROM public.admini
--                    WHERE user_id = auth.uid() AND activ = true)
--
-- Intoarce true si pentru viewer. In politicile de SELECT e corect, pentru ca
-- un viewer trebuie sa citeasca integral registrul. Folosita insa si in
-- politici de INSERT/UPDATE/DELETE, a permis oricarui rol activ sa modifice
-- membri si stiri -- reparat in 008c prin eliminarea celor doua politici
-- suprascriitoare, nu prin schimbarea functiei.
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- public.limiteaza_cereri()  --  declansator BEFORE INSERT pe cereri_inscriere
--                               (trg_cereri_limita, confirmat in DB)
--
-- Dubla verificare anti-abuz:
--   1. acelasi email nu poate trimite doua cereri in 24 de ore
--   2. cel mult 30 de cereri in 10 minute
--
-- CE MERITA DISCUITAT: limita 2 este GLOBALA.
--
--     IF (SELECT count(*) FROM public.cereri_inscriere
--         WHERE creat_la > now() - interval '10 minutes') >= 30
--
-- Nu are niciun filtru pe IP sau sesiune. Tradus: 30 de cereri trimise de
-- orice sursa opresc formularul de inscriere al TUTUROR vizitatorilor pentru
-- 10 minute. Cu cheia anon publica, oricine poate declanșa asta din curl, in
-- bucla, fara efort.
--
-- Pana la aplicarea lui 008d aceasta limitare nu putea porni, pentru ca anon
-- nu avea GRANT de INSERT, deci formularul nu functiona deloc. Odata cu
-- 008d, formularul a devenit functional, iar odata cu el s-a activat si
-- aceasta suprafata de atac. Nu a fost evaluata inainte de a fi aplicat
-- 008d.
--
-- Remedii posibile, in ordinea preferintelor:
--   a) filtra dupa adresa client: WHERE inet_client_addr() = inet_client_addr()
--      -- imperfect in spatii cu NAT, dar elimina atacul venit de la un singur
--      -- calculator
--   b) elimina complet a doua verificare si pastra doar blocarea pe email
--   c) creste pragul si adauga o limita per IP in aplicatie
--
-- Nu s-a schimbat nimic. Decizia apartine celui care are date despre volumul
-- real de cereri si despre rata de cereri eronate pe care o primeste filiala.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.limiteaza_cereri()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.cereri_inscriere
        WHERE lower(email) = lower(NEW.email)
          AND creat_la > now() - interval '24 hours'
    ) THEN
        RAISE EXCEPTION 'cerere_duplicata' USING ERRCODE = 'P0001';
    END IF;

    IF (SELECT count(*) FROM public.cereri_inscriere
        WHERE creat_la > now() - interval '10 minutes') >= 30 THEN
        RAISE EXCEPTION 'prea_multe_cereri' USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$function$;


-- -----------------------------------------------------------------------------
-- public.log_admin_action()  --  declansator pe membri (trg_log_membri),
--                               stiri (trg_log_stiri),
--                               cereri_inscriere (trg_log_cereri)
--
-- Scrie in jurnal_admin. Este JURNALUL SIGUR:
--
--   la INSERT si DELETE -> detalii ramane '{}'
--   la UPDATE           -> salveaza DOAR numele coloanelor care s-au schimbat:
--                          { "campuri_modificate": ["status", "telefon"] }
--
-- Adica NU copiaza valorile. La modificarea statusului unei cereri se adauga
-- doar statusul vechi si cel nou, pentru ca tranzitia e relevanta.
--
-- Daca utilizatorul nu este un administrator activ, functia renunta la
-- jurnalizare si lasa randul neatins. Corect: o actiune facuta de un
-- neadministrator nu are cine sa o semneze.
--
-- Asta inseamna ca jurnal_admin NU contine date cu caracter personal.
-- Contrast cu audit_trigger, care copiaza randul intreg. Vezi PARTEA 3.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid   uuid := auth.uid();
    v_email text;
    v_id    text;
    v_det   jsonb := '{}'::jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    SELECT email INTO v_email FROM public.admini WHERE user_id = v_uid AND activ;
    IF v_email IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'DELETE' THEN
        v_id := to_jsonb(OLD) ->> 'id';
    ELSE
        v_id := to_jsonb(NEW) ->> 'id';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        v_det := jsonb_build_object('campuri_modificate', (
            SELECT COALESCE(jsonb_agg(n.key), '[]'::jsonb)
            FROM jsonb_each(to_jsonb(NEW)) AS n(key, value)
            JOIN jsonb_each(to_jsonb(OLD)) AS o(key, value) ON n.key = o.key
            WHERE n.value IS DISTINCT FROM o.value
              AND n.key NOT IN ('updated_at', 'procesat_la', 'procesat_de')
        ));
        IF TG_TABLE_NAME = 'cereri_inscriere' AND NEW.status IS DISTINCT FROM OLD.status THEN
            v_det := v_det || jsonb_build_object('status_vechi', OLD.status,
                                                 'status_nou',  NEW.status);
        END IF;
    END IF;

    INSERT INTO public.jurnal_admin (admin_id, admin_email, tabel, actiune, rand_id, detalii)
    VALUES (v_uid, v_email, TG_TABLE_NAME, TG_OP, v_id, v_det);

    RETURN COALESCE(NEW, OLD);
END;
$function$;


-- -----------------------------------------------------------------------------
-- public.marcheaza_procesare()  --  declansator BEFORE UPDATE pe cereri_inscriere
--                                   (trg_cereri_procesare)
--
-- Completeaza procesat_la si procesat_de cand se schimba statusul, dar numai
-- daca cel care modifica este administrator activ. Un vizitator nu poate
-- decora o cerere ca fiind procesata.
--
-- Corect. Fara observatii.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marcheaza_procesare()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status AND public.is_admin() THEN
        NEW.procesat_la := now();
        NEW.procesat_de := auth.uid();
    END IF;
    RETURN NEW;
END;
$function$;


-- -----------------------------------------------------------------------------
-- public.rls_auto_enable()  --  declansator de eveniment pe ddl_command_end
--
-- Activeaza RLS automat pe orice tabel nou creat in schema public, fara a
-- crea politici. Un tabel nou ajunge asadar INTERZIS COMPLET, pana cand
-- politici sunt scrise intentionat.
--
-- Este o plasa de siguranta bine pusa: la o omisiune, tabelul inchide in loc
-- saiba deschis. Inversul obisnuit, unde RLS necreat ar insemna totul permis.
--
-- Acopera CREATE TABLE, CREATE TABLE AS si SELECT INTO. Nu acopera
-- partitioned table la nivel de subtabel, dar ramane suficient.
--
-- Corect. Fara observatii.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
       RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;


-- -----------------------------------------------------------------------------
-- public.set_updated_at()  --  declansator pe membri (trg_membri_updated) si
--                               stiri (trg_stiri_updated)
--
-- Face exact ce face handle_updated_at() din 002. Duplicat.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_membri_updated ON public.membri;
DROP TRIGGER IF EXISTS trg_stiri_updated ON public.stiri;


-- =============================================================================
-- PARTEA 2 -- DECLANSATORII EXISTENTI, 20 in total
--
-- Confirmati prin interogare pe pg_trigger, 8 octombrie 2026. Nu exista
-- definitii de declansatori (WHEN, ordine) extrase; forma standard BEFORE/AFTER
-- ROW se deduce din nume si din comportament.
--
--   tabel              declansator                 functie              rol
--   -----------------  --------------------------  -------------------  ------------------
--   admini             audit_admini                audit_trigger        jurnal complet
--   admini             trg_prevent_last_owner_loss prevent_last_owner_loss  008, blocheaza
--   cereri_inscriere   trg_cereri_limita           limiteaza_cereri     1xx, anti-abuz
--   cereri_inscriere   trg_cereri_procesare        marcheaza_procesare  1xx, procesare
--   cereri_inscriere   trg_log_cereri              log_admin_action     1xx, jurnal sigur
--   documente          audit_documente             audit_trigger        jurnal complet
--   documente          set_updated_at_documente    handle_updated_at    002
--   faq                audit_faq                   audit_trigger        jurnal complet
--   faq                set_updated_at_faq          handle_updated_at    002
--   leadership         audit_leadership            audit_trigger        jurnal complet
--   leadership         set_updated_at_leadership   handle_updated_at    002
--   membri             audit_membri                audit_trigger        jurnal complet
--   membri             set_updated_at_membri       handle_updated_at    002
--   membri             trg_log_membri              log_admin_action     1xx, jurnal sigur
--   setari             audit_setari                audit_trigger        jurnal complet
--   stiri              audit_stiri                 audit_trigger        jurnal complet
--   stiri              set_updated_at_stiri        handle_updated_at    002
--   stiri              trg_log_stiri               log_admin_action     1xx, jurnal sigur
--
-- OBSERVATIE: redundanta pe membri si stiri
--
--   membri are DOUA declansatori care seteaza updated_at:
--       set_updated_at_membri  -> handle_updated_at()   din 002
--       trg_membri_updated     -> set_updated_at()     din Dashboard
--   la fel stiri:
--       set_updated_at_stiri   -> handle_updated_at()   din 002
--       trg_stiri_updated      -> set_updated_at()     din Dashboard
--
-- Functiile sunt identice ca efect. Rularea de doua ori a aceluiasi
-- updated_at = now() este inofensiva. Deci NU este un defect functional, ci
-- doar o dublare, si un declansator in plus la mentinut.
--
-- Declansatorii de mai sus au fost eliminati din partea 1 a acestui fisier.
--
-- Tabele fara niciun declansator: evenimente, vizite, audit_log, jurnal_admin.
-- Corect pentru primele doua (telemetrie, fara nevoie de audit) si pentru
-- ultimele doua (sunt chiar tinta jurnalizarii).
-- =============================================================================


-- =============================================================================
-- PARTEA 3 -- INCONSISTENTA INTRE CELE DOUA JURNALE
--
-- Exista doua mecanisme de audit, cu proprietati opuse.
--
--   jurnal_admin   via log_admin_action()
--                   la UPDATE salveaza DOAR numele coloanelor schimbate.
--                   Nu contine date cu caracter personal.
--
--   audit_log      via audit_trigger()
--                   salveaza randul INTREG inainte si dupa:
--                       to_jsonb(OLD) -> vechi
--                       to_jsonb(NEW) -> nou
--                   Pentru membri, asta inseamna nume, email, telefon, CNP,
--                   IBAN, adresa. Copiate integral, definitiv.
--
-- Ambele sunt scrise de declansatori SECURITY DEFINER, deci nu pot fi
-- ocolite din aplicatie, si nici nu pot fi manipulate de ea.
--
-- Consecinta pentru D3: daca un membru cere stergerea datelor sale, poate fi
-- eliminat din tabelul membri, dar numele, emailul, telefonul si IBAN-ul lui
-- raman in audit_log pe termen nelimitat. Jurnalul sigur, jurnal_admin, ar
-- fi suficient si pentru investigarea dreptului de stergere, deoarece
-- retine cine a sters ce si ce coloane au fost atinse.
--
-- Nu s-a schimbat nimic. Decizia apartine celui care are obligatii legale
-- fata de filiala.
-- =============================================================================