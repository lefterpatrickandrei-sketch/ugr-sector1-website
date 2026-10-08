-- =============================================================================
-- 008d_public_writes_rollback.sql
-- =============================================================================
-- ATENTIE: acest rollback OPRESTE DIN FUNCTIONARE doua lucruri care inainte
-- erau deja stricate, dar pot sa para "functionau" daca nu stii ce s-a schimbat:
--
--   - formularul public de inregistrare nu mai trimite cereri (401)
--   - telemetria acceselor de pagina si evenimentelor nu mai inregistreaza nimic,
--     fara niciun mesaj de eroare, pentru ca apelurile sunt fire-and-forget
--
-- ROLLBACK COMPLET
--   REVOKE INSERT ON public.vizite, public.evenimente, public.cereri_inscriere FROM anon;
--
-- ROLLBACK PARTIAL
--   Daca telemetria e inutila (vezi raportul, D12) dar formularul de inregistrare
--   trebuie sa functioneze, retrage doar tabelele de telemetrie:
--     REVOKE INSERT ON public.vizite, public.evenimente FROM anon;
--
-- SECVENTE
--   008d a acordat si USAGE pe secventele celor trei tabele, prin cautare
--   automata dupa nume. Daca revii asupra GRANT-urilor, retrage si acese secvente:
--     REVOKE USAGE ON SEQUENCE public.cereri_inscriere_id_seq FROM anon;
--     REVOKE USAGE ON SEQUENCE public.vizite_id_seq FROM anon;
--     REVOKE USAGE ON SEQUENCE public.evenimente_id_seq FROM anon;
--   Inainte de a rula aceste trei linii, verifica ce secvente exista:
--     SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--     WHERE n.nspname = 'public' AND c.relkind = 'S' ORDER BY c.relname;
--
-- =============================================================================

BEGIN;

REVOKE INSERT ON public.cereri_inscriere FROM anon;
REVOKE INSERT ON public.vizite FROM anon;
REVOKE INSERT ON public.evenimente FROM anon;

COMMIT;

-- =============================================================================
-- Dupa rollback, starea revine la cea de la 8 octombrie 2026, inainte de
-- aplicarea lui 008d: politici RLS corecte si nefolosite, GRANT-uri absente,
-- formularul public si telemetria moarte. 008d este idempotent, deci se poate
-- reaplica fara probleme.
-- =============================================================================