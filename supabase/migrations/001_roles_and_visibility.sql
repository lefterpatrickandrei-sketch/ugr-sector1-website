-- =============================================================================
-- MIGRATION: 001_roles_and_visibility.sql
-- Description: Sistem de roluri RBAC (owner, editor, viewer), functii de verificare
--              si politici Row Level Security (RLS) pentru membri, stiri si admini.
-- Autor: UGR Sector 1 Admin v4
-- Data: 2026-10-06
-- =============================================================================

BEGIN;

-- 1. EXTINDERE TABELA PUBLIC.ADMINI CU COLOANA DE ROL
ALTER TABLE public.admini
  ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'editor'
  CHECK (rol IN ('owner', 'editor', 'viewer'));

ALTER TABLE public.admini
  ADD COLUMN IF NOT EXISTS activ BOOLEAN NOT NULL DEFAULT true;

-- Asigurare rol 'owner' pentru administratorul principal
UPDATE public.admini
SET rol = 'owner', activ = true
WHERE email = 'lefterpatrickandrei@gmail.com';


-- 2. FUNCTII DE SECURITATE (SECURITY DEFINER)
-- PR-001: Legatura se face prin user_id uuid references auth.users(id)
CREATE OR REPLACE FUNCTION public.admin_rol()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT rol FROM public.admini WHERE user_id = auth.uid() AND activ = true LIMIT 1),
    'none'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.admini WHERE user_id = auth.uid() AND activ = true
  );
$$;


-- 3. ROW LEVEL SECURITY — PUBLIC.ADMINI
ALTER TABLE public.admini ENABLE ROW LEVEL SECURITY;

-- Utilizatorul autentificat isi poate citi propriul rand de profil/admin
DROP POLICY IF EXISTS admin_select_self ON public.admini;
CREATE POLICY admin_select_self ON public.admini
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Doar rolul 'owner' poate citi toti administratorii
DROP POLICY IF EXISTS owner_select_all_admini ON public.admini;
CREATE POLICY owner_select_all_admini ON public.admini
  FOR SELECT TO authenticated
  USING (public.admin_rol() = 'owner');

-- Doar rolul 'owner' poate insera, modifica sau sterge administratori
DROP POLICY IF EXISTS owner_manage_admini ON public.admini;
CREATE POLICY owner_manage_admini ON public.admini
  FOR ALL TO authenticated
  USING (public.admin_rol() = 'owner')
  WITH CHECK (public.admin_rol() = 'owner');


-- 4. ROW LEVEL SECURITY — PUBLIC.MEMBRI
ALTER TABLE public.membri ENABLE ROW LEVEL SECURITY;

-- Anonim / Public: vizualizeaza strict membrii marcati cu afisare_publica = true
DROP POLICY IF EXISTS anon_select_membri ON public.membri;
CREATE POLICY anon_select_membri ON public.membri
  FOR SELECT TO anon
  USING (afisare_publica = true);

-- Administratori autentificati: citesc toti membrii (inclusiv cei ascunsi)
DROP POLICY IF EXISTS admin_select_membri ON public.membri;
CREATE POLICY admin_select_membri ON public.membri
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Adaugare membri: permisa rolurilor 'owner' si 'editor'
DROP POLICY IF EXISTS admin_insert_membri ON public.membri;
CREATE POLICY admin_insert_membri ON public.membri
  FOR INSERT TO authenticated
  WITH CHECK (public.admin_rol() IN ('owner', 'editor'));

-- Modificare membri: permisa rolurilor 'owner' si 'editor'
DROP POLICY IF EXISTS admin_update_membri ON public.membri;
CREATE POLICY admin_update_membri ON public.membri
  FOR UPDATE TO authenticated
  USING (public.admin_rol() IN ('owner', 'editor'))
  WITH CHECK (public.admin_rol() IN ('owner', 'editor'));

-- Stergere membri: permisa EXCLUSIV rolului 'owner'
DROP POLICY IF EXISTS admin_delete_membri ON public.membri;
CREATE POLICY admin_delete_membri ON public.membri
  FOR DELETE TO authenticated
  USING (public.admin_rol() = 'owner');


-- 5. ROW LEVEL SECURITY — PUBLIC.STIRI
ALTER TABLE public.stiri ENABLE ROW LEVEL SECURITY;

-- Anonim / Public: vizualizeaza strict stirile publicate
DROP POLICY IF EXISTS anon_select_stiri ON public.stiri;
CREATE POLICY anon_select_stiri ON public.stiri
  FOR SELECT TO anon
  USING (publicat = true);

-- Administratori autentificati: citesc toate stirile (inclusiv ciorne si programate)
DROP POLICY IF EXISTS admin_select_stiri ON public.stiri;
CREATE POLICY admin_select_stiri ON public.stiri
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Adaugare stiri: permisa rolurilor 'owner' si 'editor'
DROP POLICY IF EXISTS admin_insert_stiri ON public.stiri;
CREATE POLICY admin_insert_stiri ON public.stiri
  FOR INSERT TO authenticated
  WITH CHECK (public.admin_rol() IN ('owner', 'editor'));

-- Modificare stiri: permisa rolurilor 'owner' si 'editor'
DROP POLICY IF EXISTS admin_update_stiri ON public.stiri;
CREATE POLICY admin_update_stiri ON public.stiri
  FOR UPDATE TO authenticated
  USING (public.admin_rol() IN ('owner', 'editor'))
  WITH CHECK (public.admin_rol() IN ('owner', 'editor'));

-- Stergere stiri: permisa EXCLUSIV rolului 'owner'
DROP POLICY IF EXISTS admin_delete_stiri ON public.stiri;
CREATE POLICY admin_delete_stiri ON public.stiri
  FOR DELETE TO authenticated
  USING (public.admin_rol() = 'owner');


-- 6. DREPTURI EXPLICITE DE ACCES (GRANTS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public / Anon: doar SELECT pe datele publice expuse prin RLS
GRANT SELECT ON public.membri TO anon;
GRANT SELECT ON public.stiri TO anon;

-- Autentificati: operatiuni filtrate de RLS
GRANT SELECT ON public.admini TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membri TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stiri TO authenticated;

COMMIT;
