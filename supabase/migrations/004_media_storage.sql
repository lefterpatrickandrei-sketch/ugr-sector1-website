-- ============================================================================
-- Migrare: 004_media_storage.sql
-- Scop: Creare bucket 'media' în Supabase Storage (public read, limită 5MB),
--       politici RLS pentru upload (editor/owner) și ștergere (doar owner).
-- Data: 2026-10-06
-- ============================================================================

-- 1. CREARE BUCKET 'media' ÎN STORAGE.BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    5242880, -- 5 MB
    ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];

-- 2. POLITICI ROW LEVEL SECURITY PE STORAGE.OBJECTS

-- 2.1 Citire publică pentru oricine (anon + authenticated)
DROP POLICY IF EXISTS media_read ON storage.objects;
CREATE POLICY media_read ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'media');

-- 2.2 Încărcare (Upload) permisă pentru owner, editor și admin
DROP POLICY IF EXISTS media_insert ON storage.objects;
CREATE POLICY media_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'media' AND 
        public.admin_rol() IN ('owner', 'editor', 'admin')
    );

-- 2.3 Modificare / Suprascriere permisă pentru owner, editor și admin
DROP POLICY IF EXISTS media_update ON storage.objects;
CREATE POLICY media_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'media' AND 
        public.admin_rol() IN ('owner', 'editor', 'admin')
    )
    WITH CHECK (
        bucket_id = 'media' AND 
        public.admin_rol() IN ('owner', 'editor', 'admin')
    );

-- 2.4 Ștergere permisă exclusiv pentru owner și admin
DROP POLICY IF EXISTS media_delete ON storage.objects;
CREATE POLICY media_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'media' AND 
        public.admin_rol() IN ('owner', 'admin')
    );
