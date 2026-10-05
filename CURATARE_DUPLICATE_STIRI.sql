-- =========================================================================
-- CURATARE DUPLICATE DIN TABELA stiri — UGR Filiala Sector 1
-- =========================================================================
-- Problema: tabela public.stiri contine 27 randuri, dar doar 9 stiri
-- distincte. Fiecare stire apare de exact 3 ori.
--
-- Cauza: scriptul import_stiri.sql a fost rulat de 3 ori. Nu are
-- protectie ON CONFLICT, deci fiecare rulare insera din nou.
--
-- CE FACE ACEST SCRIPT:
--   Pastreaza cel mai vechi rand pentru fiecare titlu (randul original)
--   si sterge celelalte 2 copii.
--
-- INSTRUCTIUNI:
--   1. RULOCI INTAI FIX_PERMISIUNI_BAZA_DATE.sql (daca nu l-ai rulat)
--   2. Deschide Supabase Dashboard -> SQL Editor -> New query
--   3. Sterce tot ce este acolo
--   4. IMPORTANT: insereaza tabelul de rezultat inainte de a rula STERGEREA
--      (vezi PASUL 2 de mai jos) — asa vezi ce va fi sters
--   5. Ruleaza PASUL 1 (verificare) odata
--   6. Ruleaza PASUL 2 (stergere) odata
--   7. Ruleaza PASUL 3 (verificare finala)
--
-- ATENTIE: PASUL 2 STERGE DEFINITIV 18 RANDURI. Datele stergerii
-- sunt identice cu cele pastrate, deci nu pierzi nimic unic.
-- =========================================================================


-- -------------------------------------------------------------------------
-- PASUL 1 — VERIFICARE (sigur, nu modifica nimic)
-- -------------------------------------------------------------------------

SELECT
    COUNT(*) AS total_randuri,
    COUNT(DISTINCT titlu) AS stiri_distincte,
    COUNT(*) - COUNT(DISTINCT titlu) AS randuri_de_sters
FROM public.stiri;


-- -------------------------------------------------------------------------
-- PASUL 2 — STERGEREA DUPLICATELOR
-- -------------------------------------------------------------------------
-- Randeaza fiecare stire dupa data_publicare, apoi dupa created_at.
-- Randul cu created_at cel mai mic este cel original (prima importare)
-- si se pastreaza. Restul se sterg.

DELETE FROM public.stiri
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY titlu
                ORDER BY created_at ASC
            ) AS nr
        FROM public.stiri
    ) AS dubluri
    WHERE dubluri.nr > 1
);


-- -------------------------------------------------------------------------
-- PASUL 3 — VERIFICARE FINALA
-- -------------------------------------------------------------------------
-- Trebuie sa arate: total_randuri = 9, stiri_distincte = 9,
-- randuri_de_sters = 0

SELECT
    COUNT(*) AS total_randuri,
    COUNT(DISTINCT titlu) AS stiri_distincte,
    COUNT(*) - COUNT(DISTINCT titlu) AS randuri_de_sters
FROM public.stiri;

SELECT titlu, data_publicare FROM public.stiri
ORDER BY data_publicare DESC;


-- =========================================================================
-- PASUL 4 — PREVENIREA REAPARITII PROBLEMEI (optional, recomandat)
-- =========================================================================
-- Problema nu mai apare daca stiri are o constrangere de unicitate.
-- Ruleaza asta DOAR daca PASUL 3 a aratat 0 randuri de sters, adica
-- tabelul este curat acum.
--
-- NOTA: UNIQUE pe titlu e corect aici pentru ca fiecare stire publica
-- o singura data. Daca ai nevoie de a republica aceeasi stire, nu rula.

-- ALTER TABLE public.stiri ADD CONSTRAINT stiri_titlu_unique UNIQUE (titlu);