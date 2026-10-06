-- =============================================================================
-- MIGRATION: 007_allow_invited_admin_null_user_id.sql
-- Description: Permite invitarea administratorilor noi înainte ca aceștia să aibă
--              cont creat în auth.users (user_id devine nullable).
--              Include politici RLS și funcție SECURITY DEFINER pentru asocierea
--              automată a user_id la prima conectare cu succes.
-- Autor: UGR Sector 1 Admin v4
-- Data: 2026-10-06
-- =============================================================================

BEGIN;

-- 1. Permite user_id NULL în tabela public.admini
ALTER TABLE public.admini
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Asigurare unicitate pe email dacă nu există deja
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admini_email_key' AND conrelid = 'public.admini'::regclass
  ) THEN
    ALTER TABLE public.admini ADD CONSTRAINT admini_email_key UNIQUE (email);
  END IF;
END $$;

-- 3. Politici Row Level Security pentru revendicare invitație la login
-- Permite utilizatorului autentificat să își găsească rândul de invitație după email
DROP POLICY IF EXISTS admin_select_invited ON public.admini;
CREATE POLICY admin_select_invited ON public.admini
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR user_id = auth.uid()
  );

-- Permite utilizatorului autentificat să își actualizeze user_id dacă emailul coincide
DROP POLICY IF EXISTS admin_claim_invited ON public.admini;
CREATE POLICY admin_claim_invited ON public.admini
  FOR UPDATE TO authenticated
  USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    AND (user_id IS NULL OR user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- 4. Funcție SECURITY DEFINER pentru asocierea sigură și atomică a user_id
CREATE OR REPLACE FUNCTION public.claim_admin_invite()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_admin public.admini%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Neautentificat');
  END IF;

  v_email := lower(COALESCE(auth.jwt() ->> 'email', ''));
  IF v_email = '' THEN
    SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;
  END IF;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Email indisponibil în token');
  END IF;

  -- Căutăm invitația activă
  SELECT * INTO v_admin FROM public.admini
  WHERE lower(email) = v_email AND activ = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nicio invitație activă găsită');
  END IF;

  -- Dacă user_id nu este asociat sau diferă, îl asociem acum cu noul auth.uid()
  IF v_admin.user_id IS NULL OR v_admin.user_id <> v_uid THEN
    UPDATE public.admini
    SET user_id = v_uid
    WHERE id = v_admin.id;
    v_admin.user_id := v_uid;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_admin.id,
    'email', v_admin.email,
    'rol', v_admin.rol,
    'activ', v_admin.activ,
    'user_id', v_admin.user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin_invite() TO authenticated;

COMMIT;
