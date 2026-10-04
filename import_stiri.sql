-- =========================================================================
-- SCRIPT IMPORT IDEMPOTENT: 9 ȘTIRI OFICIALE — UGR FILIALA SECTOR 1
-- =========================================================================
-- Populează tabela public.stiri cu cele 9 comunicate și articole oficiale
-- existente în content/news.json (SGR Chișinău, BEX UGR, USAMV FIFIM etc.)
-- =========================================================================

INSERT INTO public.stiri (id, titlu, continut, imagine_url, data_publicare, publicat, created_at)
VALUES
(
    'a1111111-1111-4111-8111-111111111111',
    'Săptămâna Geodeziei Românești (SGR) — Chișinău (11–14 Noiembrie)',
    'UGR și Universitatea Tehnică a Moldovei (UTM) organizează ediția internațională SGR la Chișinău. Congresul reunește experți ANCPI, ARFC, delegați FIG și CLGE pentru dezbateri pe tematica geodeziei moderne, scanării LiDAR și integrării europene a cadastrului.',
    'ugr-images/united_1384.png',
    '2026-11-11',
    true,
    NOW()
),
(
    'a2222222-2222-4222-8222-222222222222',
    'Masă Rotundă de Lucru: Filiala Sector 1 & Conducerea BCPI Sector 1',
    'Sesiune de lucru consultativă dedicată geodezilor autorizați din Sectorul 1 București pentru uniformizarea procedurilor de recepție a planurilor de amplasament și rezolvarea necorelărilor tehnice din sistemul integrat e-Terra.',
    'ugr-images/united_1384.png',
    '2026-09-15',
    true,
    NOW()
),
(
    'a3333333-3333-4333-8333-333333333333',
    'Comunicat privind Deciziile Biroului Executiv (BEX) UGR',
    'Biroul Executiv al Uniunii Geodezilor din România a adoptat rezoluțiile privind optimizarea fluxurilor de lucru cu ANCPI, normele metodologice pentru lucrările de cadastru sistematic și sprijinirea formării profesionale continue a geodezilor autorizați.',
    'ugr-images/united_1384.png',
    '2026-05-21',
    true,
    NOW()
),
(
    'a4444444-4444-4444-8444-444444444444',
    'Adunarea Generală a Membrilor Filialei Sector 1 București',
    'Întâlnirea anuală a comunității geodezilor din Sectorul 1: prezentarea raportului de activitate local, validarea calendarului de workshop-uri practice GNSS/LiDAR și primirea noilor absolvenți de la Facultatea de Geodezie UTCB.',
    'ugr-images/united_1384.png',
    '2026-04-10',
    true,
    NOW()
),
(
    'a5555555-5555-4555-8555-555555555555',
    'Ediția a II-a UGR Student Community by UGR Sector 1: GIS și baze de date spațiale',
    'Întâlnirea comunității cu studenții și viitorii colegi în Sala de Consiliu FIFIM – USAMV București. Sesiuni practice de analiză și gestionare a informației spațiale, GIS și tranziția de la facultate la provocările din topografia inginerească de pe șantiere.',
    'ugr-images/united_1384.png',
    '2026-07-08',
    true,
    NOW()
),
(
    'a6666666-6666-4666-8666-666666666666',
    'Premiul Filialei Sector 1 & Pachet de 18 Workshopuri Profesionale de Specialitate',
    'La susținerea licențelor MTC la USAMV, Filiala Sector 1 a acordat premii de excelență și a lansat 18 workshopuri aplicate alături de partenerii KarmaCad Store (scanare laser 3D), SphereFix România și Control Survey SRL.',
    'ugr-images/united_1384.png',
    '2026-07-10',
    true,
    NOW()
),
(
    'a7777777-7777-4777-8777-777777777777',
    'Comunicat Filiala Sector 1: Notificare ANCPI privind disponibilitatea sistemului e-Terra',
    'Anunț operativ ANCPI transmis în timp real membrilor geodezi din Sectorul 1 privind disfuncționalitățile tehnice ale platformei e-Terra și calendarul de restabilire a serviciilor de cadastru și carte funciară.',
    'ugr-images/united_1384.png',
    '2026-07-14',
    true,
    NOW()
),
(
    'a8888888-8888-4888-8888-888888888888',
    'Burse Complete UGR pentru Participare la Săptămâna Geodeziei Românești 2026 (Chișinău)',
    'Șansă dedicată studenților de la Geodezie: UGR și Filiala Sector 1 oferă burse integrale ce acoperă taxa de participare, cazarea, mesele și transportul pentru conferința internațională SGR de la UTM Chișinău (11–14 Noiembrie).',
    'ugr-images/united_1384.png',
    '2026-06-15',
    true,
    NOW()
),
(
    'a9999999-9999-4999-8999-999999999999',
    'Delegația Oficială UGR la Adunarea Generală CLGE',
    'România a promovat armonizarea normelor de etică și bune practici în măsurătorile cadastrale la nivelul Consiliului European al Geodezilor (CLGE), susținând drepturile geodezilor autorizați din Europa Centrală și de Est.',
    'ugr-images/united_1384.png',
    '2026-05-05',
    true,
    NOW()
)
ON CONFLICT (id) DO NOTHING;
