-- =============================================================================
-- 008c_role_isolation_rollback.sql
--    REINTRODUCE O ESCALADARE DE PRIVILEGII. Citeste avertismentul inainte.
-- =============================================================================
--
--      ATENTIE: acest rollback reactiva stergerea membrilor si stirilor
--      de catre ORICE rol activ, inclusiv viewer.
--
--  Se foloseste doar daca stergerea celor doua politici a blocat o operatie
--  legitima si nu exista o alta cale. Inainte de a rula acest fisier,
--  verifica ce operatie e blocata: mai ales, ca nu fie vorba despre un
--  cont viewer sau editor care incearca sa faca ceva ce nu trebuie sa faca.
--
--  Dupa ce intelegi, alternativa corecta este de obicei sa creezi o politica
--  noua, nu sa reactivezi una care acorda prea mult.
-- =============================================================================

BEGIN;

-- Reface politica care acorda orice operatie oricarui rol activ pe membri.
CREATE POLICY membri_admin_all ON public.membri
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Idem pentru stiri.
CREATE POLICY stiri_admin_all ON public.stiri
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Elimina notele care descriu starea reparata.
COMMENT ON POLICY admin_delete_membri ON public.membri IS NULL;
COMMENT ON POLICY admin_delete_stiri ON public.stiri IS NULL;

COMMIT;

-- =============================================================================
-- POST-ROLLBACK: ce inseamna asta concret
--
--   membri  -> INSERT / UPDATE / DELETE  : orice rol activ (owner, editor, viewer)
--   stiri   -> INSERT / UPDATE / DELETE  : orice rol activ (owner, editor, viewer)
--
-- Politicile granulare (admin_insert_membri, admin_update_membri,
-- admin_delete_membri si echivalentele pentru stiri) raman active, dar nu mai
-- au efect: RLS combina politicile permissive cu OR, deci membri_admin_all
-- le acopera intotdeauna.
--
-- Daca ai rulat acest rollback si vrei sa revii la starea reparata, ruleaza
-- din nou 008c_role_isolation.sql. Este idempotent.
-- =============================================================================