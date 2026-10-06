-- ============================================================================
-- FIX PERMISIUNI POSTGREST & LEGĂTURĂ OWNER
-- Executați în Supabase SQL Editor
-- ============================================================================

-- 1. Permisiuni depline pentru utilizatorii autentificați (filtrate de RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stiri TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membri TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setari TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leadership TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documente TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cereri_inscriere TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admini TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

-- 2. Permisiuni de citire publică pentru vizitatorii anonimi (filtrate de RLS)
GRANT SELECT ON public.stiri TO anon;
GRANT SELECT ON public.membri TO anon;
GRANT SELECT ON public.setari TO anon;
GRANT SELECT ON public.leadership TO anon;
GRANT SELECT ON public.faq TO anon;
GRANT SELECT ON public.documente TO anon;

-- 3. Asigură legătura utilizatorului administrator cu rolul de 'owner'
UPDATE public.admini
SET user_id = (SELECT id FROM auth.users WHERE email = 'lefterpatrickandrei@gmail.com' LIMIT 1),
    rol = 'owner',
    activ = true
WHERE email = 'lefterpatrickandrei@gmail.com';

-- 4. Verificare rezultat
SELECT email, user_id, rol, activ FROM public.admini WHERE email = 'lefterpatrickandrei@gmail.com';
