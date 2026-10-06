-- ============================================================================
-- Migrare: 006_expand_scope_and_fix_images.sql
-- Scop: 1. Extindere constrângere 'scope' pentru a include noile anverguri:
--          'local', 'national', 'international', 'academic', 'parteneriat', 'institutional'
--       2. Actualizare imagini duplicat pentru știrile oficiale existente
--       3. Asigurare creare bucket 'media' în Supabase Storage cu politici RLS
-- Data: 2026-10-06
-- ============================================================================

-- 1. EXTINDERE VERIFICARE SCOPE (STIRI)
ALTER TABLE public.stiri DROP CONSTRAINT IF EXISTS stiri_scope_check;
ALTER TABLE public.stiri ADD CONSTRAINT stiri_scope_check 
    CHECK (scope IN ('local', 'national', 'international', 'academic', 'parteneriat', 'institutional'));

-- 2. ASIGURARE CREARE BUCKET 'media' PENTRU UPLOAD FOTO DIN CALCULATOR
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

-- Politici RLS pentru storage.objects
DROP POLICY IF EXISTS media_read ON storage.objects;
CREATE POLICY media_read ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS media_insert ON storage.objects;
CREATE POLICY media_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS media_update ON storage.objects;
CREATE POLICY media_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS media_delete ON storage.objects;
CREATE POLICY media_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'media');

-- 3. ACTUALIZARE IMAGINI ȘTIRI EXISTENTE (PENTRU A NU MAI AVEA ACEEAȘI POZĂ REPETATĂ)
UPDATE public.stiri 
SET imagine_url = 'ugr-images/ig_post_5.jpg',
    scope = 'institutional'
WHERE titlu LIKE '%Masă Rotundă%' AND (imagine_url = 'ugr-images/united_1384.png' OR imagine_url IS NULL);

UPDATE public.stiri 
SET imagine_url = 'ugr-images/6a16e8a299426Comunicat-in-urma-sedintei-BEX-UGR-din-21.05.2026_Page_1.png',
    scope = 'national'
WHERE titlu LIKE '%Deciziile Biroului Executiv%' AND (imagine_url = 'ugr-images/united_1384.png' OR imagine_url IS NULL);

UPDATE public.stiri 
SET imagine_url = 'ugr-images/ISP8061.png',
    scope = 'local'
WHERE titlu LIKE '%Adunarea Generală a Membrilor%' AND (imagine_url = 'ugr-images/united_1384.png' OR imagine_url IS NULL);

UPDATE public.stiri 
SET imagine_url = 'ugr-images/ugr_student_community_meeting.jpg',
    scope = 'academic'
WHERE titlu LIKE '%Student Community%' AND (imagine_url = 'ugr-images/united_1384.png' OR imagine_url IS NULL);

UPDATE public.stiri 
SET imagine_url = 'ugr-images/ig_post_3.jpg',
    scope = 'parteneriat'
WHERE titlu LIKE '%18 Workshopuri%' AND (imagine_url = 'ugr-images/united_1384.png' OR imagine_url IS NULL);

UPDATE public.stiri 
SET imagine_url = 'ugr-images/ancpi.png',
    scope = 'institutional'
WHERE titlu LIKE '%e-Terra%' AND (imagine_url = 'ugr-images/united_1384.png' OR imagine_url IS NULL);

UPDATE public.stiri 
SET imagine_url = 'ugr-images/6a2fcf1057a4cPoster-Bursa-SGR-2026.png',
    scope = 'academic'
WHERE titlu LIKE '%Burse Complete%' AND (imagine_url = 'ugr-images/united_1384.png' OR imagine_url IS NULL);

UPDATE public.stiri 
SET imagine_url = 'ugr-images/6a0c30e4559d8Board-CLGE-Tartu-mai-2026.png',
    scope = 'international'
WHERE titlu LIKE '%CLGE%' AND (imagine_url = 'ugr-images/united_1384.png' OR imagine_url IS NULL);
