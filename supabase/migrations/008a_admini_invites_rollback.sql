-- =============================================================================
-- ROLLBACK: 008a_admini_invites.sql
--
-- ⚠️  REÎNTRODUCE RISC. Rulează doar dacă vrei să revii la starea de dinainte.
--
-- Atenție: acest rollback SCHIMBĂ tabela înapoi pe user_id drept cheie
-- primară. Asta înseamnă:
--   - orice rând de invitație cu user_id IS NULL NU mai poate exista
--     (dacă există, DROP NOT NULL va eșua cu
--      "column \"user_id\" is in a primary key")
--   - fluxul de invitație redevine IMPOSIBIL, iar admin/js/views/roles.js
--     continuă să folosească .eq('id', …) pe o tabelă fără id
--
-- Prin urmare: rulează întâi interogarea de control de mai jos și șterge
-- manual rândurile de invitație (user_id IS NULL) înainte de rollback.
-- =============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- CONTROL PRELIMINAR — citește rezultatul înainte să continui
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_invitari integer;
BEGIN
  SELECT count(*) INTO v_invitari FROM public.admini WHERE user_id IS NULL;
  IF v_invitari > 0 THEN
    RAISE EXCEPTION
      'Rollback oprit: % rânduri de invitație (user_id IS NULL) există. '
      'Elimină-le manual din tabelul admini, apoi rulează din nou.', v_invitari
      USING HINT = 'SELECT id, email, rol FROM public.admini WHERE user_id IS NULL;';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- R-1  Funcția de revendicare
-- ╠══════════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.claim_admin_invite();


-- ═══════════════════════════════════════════════════════════════════════════
-- R-2  Politica de citire a invitației
-- ╠══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS admin_select_invited ON public.admini;


-- ═══════════════════════════════════════════════════════════════════════════
-- R-3  user_id își pierde unicitatea
-- ╠══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_user_id_key;


-- ═══════════════════════════════════════════════════════════════════════════
-- R-4  email își pierde unicitatea
--
--      NOTĂ: nu ștergem valorile, doar constrângerea. Handler-ul 23505 din
--      roles.js va înceta să se declanșeze pentru emailuri duplicate.
-- ╠══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_email_key;


-- ═══════════════════════════════════════════════════════════════════════════
-- R-5  PK revine pe user_id
--
--      ORDINEA OBLIGATORIE:
--        1. DROP CONSTRAINT admini_id_pkey    (eliberează user_id)
--        2. ADD PRIMARY KEY (user_id)
--        3. SET NOT NULL pe user_id
--      SET NOT NULL înainte de pasul 1 ar eșua cu
--        ERROR: column "user_id" is in a primary key
--      — exact motivul pentru care 007 nu s-a putut aplica niciodată aici.
-- ╠══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_id_pkey;

ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_pkey;
ALTER TABLE public.admini ADD  CONSTRAINT admini_pkey PRIMARY KEY (user_id);

-- Refacem starea originală: user_id NOT NULL
ALTER TABLE public.admini ALTER COLUMN user_id SET NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════
-- R-6  Se scoate coloana id
--
--      ⚠️ DECISIONE DE PROIECT: 008a adaugă id pentru că admin/js/views/roles.js
--      deja folosește .eq('id', …) în 5 locuri. Dacă ștergem id aici, revenim
--      la starea în care acele 5 apeluri sunt sortate să eșueze.
--
--      L-am șters oricum, ca rollback-ul să fie complet. Citește asta ca pe un
--      semnal: dacă vezi că revii aici regulat, problema reală e altăcolo.
-- ╠══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.admini DROP COLUMN IF EXISTS id;


COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- REZUMAT ROLLBACK
--
--   R-1  șters      claim_admin_invite()
--   R-2  șters      admin_select_invited
--   R-3  șters      admini_user_id_key
--   R-4  șters      admini_email_key
--   R-5  inversat   PK pe user_id, user_id NOT NULL
--   R-6  șters      coloana id
--
-- După rollback, RLS pe admini rămâne activ, iar politicile create din
-- Dashboard (admin_select_self, admini_select, owner_manage_admini,
-- owner_select_all_admini) rămân neatinse.
-- ═══════════════════════════════════════════════════════════════════════════