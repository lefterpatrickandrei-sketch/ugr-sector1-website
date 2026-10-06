-- ============================================================================
-- Seed: seed_from_repo.sql
-- Scop: Populare idempotentă a bazei de date Supabase cu datele oficiale din repo
--       (setari, leadership, faq, documente, stiri, membri demonstrativi).
-- Data: 2026-10-06
-- ============================================================================

-- 1. POPULARE SETĂRI INSTITUȚIONALE (public.setari)
insert into public.setari (cheie, valoare, descriere)
values
  ('organizatie', '{"name":"Uniunea Geodezilor din România (UGR)","branch":"Filiala Sector 1 București","foundingYear":1990,"address":"Bd. Lacul Tei nr. 124, Sector 2, București, România","academicCenterAddress":"Bulevardul Mărăști nr. 59, Sector 1, București (FIFIM – USAMV)","email":"filiala.ugr.s1@gmail.com","emailCentral":"office@ugr.ro","emailSecretar":"secretar@ugr.ro","president":"Alexandru Dorin PĂUN","phonePresident":"0726 390 774 / 0748 912 263","secretary":"Andra Teodora VIȘAN","phoneSecretary":"0764 572 874","cotizatiiContact":"Camelia MATEI","phoneCotizatii":"0722 684 104","phone":"0726 390 774","phoneCentral":"0723 587 081","cif":"6480330","bankAccounts":[{"bank":"BRD — Groupe Société Générale (Ag. Tei, Sector 2)","iban":"RO57 BRDE 426S V810 0757 4450","currency":"RON","purpose":"Cotizație UGR Filiala Sector 1 / Nume și CNP"}],"sgr2026FormUrl":"https://docs.google.com/forms/d/e/1FAIpQLSctDTm-Gxuph4yz2fJRiU2JOurBFgzBXriAUY6rbrtem5vrEQ/viewform?usp=header","social":{"facebook":"https://www.facebook.com/share/14xwxtFChmC/","instagram":"https://www.instagram.com/filiala.sector1.ugr"},"socialLinks":{"facebook":"https://www.facebook.com/share/14xwxtFChmC/","instagram":"https://www.instagram.com/filiala.sector1.ugr"},"affiliations":[{"name":"FIG","full":"Fédération Internationale des Géomètres (Membru Titular din 1992)"},{"name":"CLGE","full":"Council of European Geodetic Surveyors (din 2004)"},{"name":"UPLR","full":"Uniunea Profesiilor Liberale din România"}]}'::jsonb, 'Date oficiale de identificare și contact Filiala Sector 1'),
  ('ghid_aderare', '{"steps":[{"step":1,"title":"Completarea Cererii de Adeziune","desc":"Se descarcă și se completează formularul tipizat pentru persoane fizice, studenți sau companii (persoane juridice)."},{"step":2,"title":"Pregătirea Dosarului Profesional","desc":"Se anexează copia actului de identitate, copia diplomelor de studii superioare (inginer/subinginer geodez) și certificatul de autorizare ANCPI (dacă există)."},{"step":3,"title":"Achitarea Taxelor Oficiale","desc":"Plata taxei de înscriere (50 RON) și a cotizației anuale (100 RON pentru membri activi, 10 RON pentru studenți) în contul bancar UGR."},{"step":4,"title":"Validarea în Biroul Executiv (BEX)","desc":"După validarea dosarului în ședința BEX, se emite legitimația oficială de membru UGR și se atribuie numărul de înregistrare."}],"tiers":[{"id":"fizica","name":"Persoană Fizică (Geodez / Topograf Autorizat)","signupFee":"50 RON (plată unică)","annualFee":"100 RON / an","requirements":"Diplomă de licență geodezie / topografie / cadastru + Certificat ANCPI (opțional)","badge":"Recomandat Specialiști"},{"id":"student","name":"Membru Student (Facultăți de Profil)","signupFee":"10 RON (simbolică)","annualFee":"10 RON / an","requirements":"Adeverință student la zi (UTCB, UTM, USAMV etc.)","badge":"Acces Tineri Geodezi"},{"id":"juridica","name":"Persoană Juridică (Companii & Birouri de Cadastru)","signupFee":"100 RON","annualFee":"500 - 2.000 RON / an (în funcție de numărul de experți)","requirements":"Copie CUI firmă, autorizație ANCPI clasa I / II / III","badge":"Companii de Elită"}]}'::jsonb, 'Pași și taxe de adeziune UGR'),
  ('telemetrie_sector1', '{"meta":{"title":"Rețeaua Geodezică și Telemetria Teritorială — Sector 1 București","crs":"EPSG:3844 — Pulkovo 1942(58) / Stereo 70 (ANCPI)","ellipsoid":"Krassovski 1940 (a = 6378245.0 m, 1/f = 298.3)","projection":"Stereografică Oblică Conformă pe Plan Secant (Stereo 70)","centralMeridian":"25° 00'' 00.000\" E","originLatitude":"46° 00'' 00.000\" N","falseCoordinates":"X0 (Nord) = 500.000,000 m | Y0 (Est) = 500.000,000 m","scaleFactor":"k0 = 0.999750000","helmert7Towgs84":"+towgs84=2.3287,-147.0425,-92.0802,0.3092483,0.3248218,-0.4973001,5.68906266"},"branchHQ":{"name":"Sediul Filialei Sector 1 București (Pol Regional Capitală)","type":"Sediul Teritorial Executiv","sector":"Sector 1","address":"Axa Piața Victoriei — Banu Manta — Kiseleff, Sector 1, București","stereo70":{"xNord":328657.98,"yEst":586044.896,"zCota":85.42,"unit":"m"},"wgs84":{"lat":44.4526,"lon":26.0792,"latDMS":"44°27''09\" N","lonDMS":"26°04''45\" E"},"description":"Punct focal administrativ și geodezic al Capitalei, coordonare tehnică și integrare directă cu OCPI București și ANCPI."},"centralHQ":{"name":"Sediul Central UGR (Lacul Tei 124)","type":"Sediul Central Național","sector":"Sector 2","address":"Bd. Lacul Tei nr. 124, Sector 2, București","stereo70":{"xNord":334250.125,"yEst":591240.85,"zCota":78.15,"unit":"m"},"wgs84":{"lat":44.502276,"lon":26.145473,"latDMS":"44°30''08\" N","lonDMS":"26°08''44\" E"},"description":"Sediul central administrativ al Uniunii Geodezilor din România."},"academicCenter":{"name":"Facultatea de Îmbunătățiri Funciare și Ingineria Mediului (FIFIM) – USAMV București","role":"Centrul universitar și de pregătire profesională al Filialei Sector 1","sector":"Sector 1","address":"Bulevardul Mărăști nr. 59, Sector 1, București","stereo70":{"xNord":330215.45,"yEst":584980.22,"zCota":87.6,"unit":"m"},"wgs84":{"lat":44.4715,"lon":26.0698,"latDMS":"44°28''17\" N","lonDMS":"26°04''11\" E"},"description":"Parteneriat academic strategic: Centrul universitar și de pregătire profesională al filialei, dedicat sesiunilor de GIS, baze de date spațiale și comunității UGR Student Community."},"rglmbBenchmarks":[{"code":"RGLMB-S1-FIFIM","name":"FIFIM – USAMV București (Centrul Universitar & Training Sector 1)","type":"Reper Academic & Centru de Formare Profesională","location":"Bulevardul Mărăști nr. 59, Sector 1, București","stereo70":{"xNord":330215.45,"yEst":584980.22,"zCota":87.6},"wgs84":{"lat":44.4715,"lon":26.0698,"dms":"44°28''17\" N / 26°04''11\" E"},"precision":"Reper de Calibrare & Formare Geodezică","status":"Punct de instruire și workshopuri UGR Student Community"},{"code":"RGLMB-S1-VIC","name":"Piața Victoriei (Pol Administrativ Sector 1)","type":"Reper Fundamental RGLMB / Ordinul I","location":"Piața Victoriei, Sector 1, București","stereo70":{"xNord":328733.315,"yEst":586483.43,"zCota":86.2},"wgs84":{"lat":44.453225,"lon":26.084722,"dms":"44°27''12\" N / 26°05''05\" E"},"precision":"Ordinul I (Sub-centimetrică)","status":"Activ / Verificat ANCPI"},{"code":"RGLMB-S1-ARC","name":"Arcul de Triumf (Șoseaua Kiseleff)","type":"Punct Geodezic Monumental de Ordinul I","location":"Șos. Kiseleff — Bd. Mareșal Constantin Prezan, Sector 1","stereo70":{"xNord":330270.996,"yEst":585936.024,"zCota":89.45},"wgs84":{"lat":44.467128,"lon":26.078103,"dms":"44°28''02\" N / 26°04''41\" E"},"precision":"Ordinul I RGLMB","status":"Activ / Monument Geodezic Protejat"},{"code":"RGLMB-S1-OBS","name":"Observatorul Astronomic Vasile Urseanu","type":"Reper Fundamental de Nivelment Clasa I","location":"Bd. Lascăr Catargiu nr. 21, Sector 1","stereo70":{"xNord":328101.985,"yEst":586845.767,"zCota":84.1},"wgs84":{"lat":44.4475,"lon":26.089167,"dms":"44°26''51\" N / 26°05''21\" E"},"precision":"Nivelment de Înaltă Precizie (±0.5 mm/km)","status":"Activ / Punct Fundamental Istoric"},{"code":"RGLMB-S1-HER","name":"Borna Geodezică Parcul Herăstrău (Regele Mihai I)","type":"Reper Poligonație Cadastrală Clasa II","location":"Parcul Regele Mihai I (Nord), Sector 1","stereo70":{"xNord":330728.114,"yEst":586279.8,"zCota":82.7},"wgs84":{"lat":44.4712,"lon":26.0825,"dms":"44°28''16\" N / 26°04''57\" E"},"precision":"Clasa II RGLMB (±1 cm)","status":"Activ / Calibrat GPS"},{"code":"RGLMB-S1-GAR","name":"Nod Geodezic Gara de Nord — Calea Griviței","type":"Reper de Rețea Densificare Urbană","location":"Piața Gării de Nord / Calea Griviței, Sector 1","stereo70":{"xNord":327915.22,"yEst":585520.14,"zCota":83.9},"wgs84":{"lat":44.4459,"lon":26.0725,"dms":"44°26''45\" N / 26°04''21\" E"},"precision":"Clasa II RGLMB","status":"Activ / Verificat"}],"romposStations":[{"id":"BUCU","code":"ROMPOS-BUCU","name":"Stația Națională Permanentă BUCU (București - UTCB Tei)","operator":"ANCPI / Universitatea Tehnică de Construcții București","location":"Bd. Lacul Tei nr. 124 (Facultatea de Geodezie)","stereo70":{"xNord":329612.386,"yEst":588947.677,"zCota":135.2},"wgs84":{"lat":44.460833,"lon":26.115833,"dms":"44°27''39\" N / 26°06''57\" E"},"hardware":"Leica GR50 Multi-Frequency Receiver + Antenă LEIAR25.R4 LEIT (Choke Ring)","signals":"GPS (L1, L2, L5), GLONASS (L1, L2), GALILEO (E1, E5a, E5b, AltBOC), BEIDOU (B1, B2, B3)","rtkServices":"ROMPOS-RTK (VRS, MAC, Single Cell RTCM 3.2)","networkRole":"Stație Fundamentală Clasa A EUREF / EPN (European Permanent Network)","status":"ONLINE / Răspuns RTK < 1 sec"},{"id":"BUC1","code":"ROMPOS-BUC1","name":"Stația Permanentă BUC1 (București Vest / Militari)","operator":"ANCPI / Direcția Națională de Geodezie și Cartografie","location":"București Vest (Sector 6 / legătură Sector 1 Vest)","stereo70":{"xNord":326792.087,"yEst":583501.569,"zCota":120.4},"wgs84":{"lat":44.436111,"lon":26.046944,"dms":"44°26''10\" N / 26°02''49\" E"},"hardware":"Trimble NetR9 Geodetic GNSS Receiver + Antenă Zephyr Geodetic III","signals":"GPS, GLONASS, GALILEO","rtkServices":"Corecții Diferențiale RTCM 3.x / Ntrip Caster","networkRole":"Acoperire Densificare Metropolitană Vest-Nord","status":"ONLINE / 99.98% Uptime"},{"id":"BUC2","code":"ROMPOS-BUC2","name":"Stația Permanentă BUC2 (București Filaret / Astronomic)","operator":"Institutul Astronomic al Academiei Române / ANCPI","location":"Dealul Filaret (Observatorul Astronomic București)","stereo70":{"xNord":324220.972,"yEst":587473.407,"zCota":142.1},"wgs84":{"lat":44.4125,"lon":26.096389,"dms":"44°24''45\" N / 26°05''47\" E"},"hardware":"Septentrio PolaRx5 Multi-GNSS + Antenă PolaNt Choke Ring","signals":"Quad-Constellation GNSS, Servicii Geodinamice Crustale","rtkServices":"Stream Date Geodezice 1Hz & 20Hz","networkRole":"Monitorizare Geodinamică și Geodezie Spațială","status":"ONLINE / Rețea Științifică"}]}'::jsonb, 'Repere geodezice și stații ROMPOS Sector 1')
on conflict (cheie) do update
set valoare = excluded.valoare,
    descriere = excluded.descriere,
    actualizat_la = now();

-- 2. POPULARE LEADERSHIP (public.leadership)
-- Ștergem și recreăm sau inserăm idempotent
insert into public.leadership (grup, nume, functie, descriere, foto_url, ordine, afisare_publica)
select 'central', 'Ing. Mircea Afrăsinei', 'Președinte UGR', 'Coordonator general și reprezentant legal al Uniunii în parteneriatele strategice cu ANCPI, Guvernul României, FIG și CLGE.', 'ugr-images/Mircea-Afrsinei.jpg', 1, true
where not exists (select 1 from public.leadership where grup = 'central' and nume = 'Ing. Mircea Afrăsinei');
insert into public.leadership (grup, nume, functie, descriere, foto_url, ordine, afisare_publica)
select 'central', 'Prof. univ. dr. ing. Ana Cornelia Badea', 'Vicepreședinte Parteneriate Academice', 'Cadru didactic universitar la Facultatea de Geodezie UTCB. Responsabilă de cercetarea științifică, conferințe academice și relația cu universitățile tehnice.', 'logo_geodez.png', 2, true
where not exists (select 1 from public.leadership where grup = 'central' and nume = 'Prof. univ. dr. ing. Ana Cornelia Badea');
insert into public.leadership (grup, nume, functie, descriere, foto_url, ordine, afisare_publica)
select 'central', 'Prof. univ. dr. ing. Petre Iuliu Dragomir', 'Vicepreședinte Relații Instituționale', 'Coordonator al dialogului tehnic-legislativ cu ANCPI, responsabil de propunerile de îmbunătățire a legislației cadastrului și publicității imobiliare.', 'logo_geodez.png', 3, true
where not exists (select 1 from public.leadership where grup = 'central' and nume = 'Prof. univ. dr. ing. Petre Iuliu Dragomir');
insert into public.leadership (grup, nume, functie, descriere, foto_url, ordine, afisare_publica)
select 'central', 'Ing. Vlad Păunescu', 'Secretar Executiv UGR', 'Gestiunea operațională a asociației, relația directă cu filialele din țară și evidența membrilor activi (secretar@ugr.ro).', 'logo_geodez.png', 4, true
where not exists (select 1 from public.leadership where grup = 'central' and nume = 'Ing. Vlad Păunescu');
insert into public.leadership (grup, nume, functie, descriere, foto_url, ordine, afisare_publica)
select 'central', 'Ing. Costin Sebastian Manu', 'Trezorier Național', 'Managementul financiar, transparența bugetară, gestiunea cotizațiilor și auditul operațiunilor asociației.', 'logo_geodez.png', 5, true
where not exists (select 1 from public.leadership where grup = 'central' and nume = 'Ing. Costin Sebastian Manu');
insert into public.leadership (grup, nume, functie, descriere, telefon, email, ordine, afisare_publica)
select 'filiala', 'Alexandru Dorin PĂUN', 'Președinte Filiala Sector 1', 'Inginer geodez autorizat ANCPI, expert tehnic judiciar, coordonator teritorial al filialei.', '0726 390 774 / 0748 912 263', 'filiala.ugr.s1@gmail.com', 1, true
where not exists (select 1 from public.leadership where grup = 'filiala' and nume = 'Alexandru Dorin PĂUN');
insert into public.leadership (grup, nume, functie, descriere, telefon, email, ordine, afisare_publica)
select 'filiala', 'Andra Teodora VIȘAN', 'Secretar Filiala Sector 1', 'Inginer geodez, absolventă MTC FIFIM USAMV, coordonator secretariat și proiecte de tineret.', '0764 572 874', 'filiala.ugr.s1@gmail.com', 2, true
where not exists (select 1 from public.leadership where grup = 'filiala' and nume = 'Andra Teodora VIȘAN');
insert into public.leadership (grup, nume, functie, descriere, telefon, email, ordine, afisare_publica)
select 'filiala', 'Alexandru NELEPCU', 'Trezorier Filiala Sector 1', 'Gestiune financiară și evidență bugetară locală a asociației.', null, null, 3, true
where not exists (select 1 from public.leadership where grup = 'filiala' and nume = 'Alexandru NELEPCU');
insert into public.leadership (grup, nume, functie, descriere, telefon, email, ordine, afisare_publica)
select 'filiala', 'Ștefan Paul MATEI', 'Cenzor Filiala Sector 1', 'Control financiar și verificare conformitate statutară.', null, null, 4, true
where not exists (select 1 from public.leadership where grup = 'filiala' and nume = 'Ștefan Paul MATEI');
insert into public.leadership (grup, nume, functie, descriere, telefon, email, ordine, afisare_publica)
select 'filiala', 'Nicoleta BOBÎRCEA', 'Membru Conducere', 'Reprezentare profesională și coordonare grupuri de lucru.', null, null, 5, true
where not exists (select 1 from public.leadership where grup = 'filiala' and nume = 'Nicoleta BOBÎRCEA');
insert into public.leadership (grup, nume, functie, descriere, telefon, email, ordine, afisare_publica)
select 'filiala', 'Radu Mihai NIȚĂ', 'Membru Conducere', 'Relații instituționale și suport tehnic geodezic.', null, null, 6, true
where not exists (select 1 from public.leadership where grup = 'filiala' and nume = 'Radu Mihai NIȚĂ');

-- 3. POPULARE FAQ (public.faq)
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'aderare', 'STATUT & PROTOCOL', 'Ce este Uniunea Geodezilor din România (UGR) și ce rol are Filiala Sector 1?', 'UGR este asociația profesională națională neguvernamentală, apolitică și non-profit a inginerilor geodezi, topografilor și cartografilor din România, fondată în 1990. Filiala Sector 1 București asigură reprezentarea geodezilor din Capitală, facilitând dialogul legislativ cu ANCPI, OCPI București și participarea la evenimente de perfecționare tehnică.', 1, true
where not exists (select 1 from public.faq where intrebare = 'Ce este Uniunea Geodezilor din România (UGR) și ce rol are Filiala Sector 1?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'aderare', 'STATUT & COTIZAȚII', 'Cum devin membru UGR și care sunt pașii de înscriere?', 'Conform procedurii oficiale (ugr.ro/cum-devin-membru): 1. Se completează cererea de adeziune tipizată. 2. Se trimit actele de studii și autorizația ANCPI. 3. Se achită taxa de înscriere (50 lei) și cotizația anuală (100 lei). 4. Dosarul este validat de Biroul Executiv (BEX) și se emite legitimația oficială.', 2, true
where not exists (select 1 from public.faq where intrebare = 'Cum devin membru UGR și care sunt pașii de înscriere?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'aderare', 'CONTURI & PLĂȚI', 'Care sunt datele bancare oficiale pentru achitarea cotizației?', 'Plățile se efectuează în contul oficial UGR: RO57 BRDE 426S V810 0757 4450 (deschis la BRD Ag. Tei, Sector 2), menționând obligatoriu la detaliile plății: Nume Prenume, CNP și ''Cotizație Filiala Sector 1''.', 3, true
where not exists (select 1 from public.faq where intrebare = 'Care sunt datele bancare oficiale pentru achitarea cotizației?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'aderare', 'BENEFICII MEMBRI', 'Ce avantaje profesionale oferă apartenența la UGR?', 'Membrii beneficiază de: recunoaștere în forurile europene (FIG & CLGE), tarife preferențiale la conferințe internaționale, consultanță juridică și legislativă în relația cu ANCPI, acces la cursuri de formare continuă (LiDAR, GIS, GNSS) și promovare în Registrul Geodezilor Autorizați.', 4, true
where not exists (select 1 from public.faq where intrebare = 'Ce avantaje profesionale oferă apartenența la UGR?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'aderare', 'HUB COMUNICARE', 'Unde pot urmări noutățile operative și activitățile Filialei Sector 1?', 'Toate notificările operative ANCPI privind platforma e-Terra, evenimentele din cadrul UGR Student Community la FIFIM USAMV, workshopurile de specialitate și fotografiile de la întâlniri sunt publicate pe pagina oficială de Facebook (facebook.com/share/14xwxtFChmC/) și pe contul de Instagram (@filiala.sector1.ugr). Pentru solicitări directe: filiala.ugr.s1@gmail.com sau la telefoanele: Președinte 0726 390 774 / Secretar 0764 572 874.', 5, true
where not exists (select 1 from public.faq where intrebare = 'Unde pot urmări noutățile operative și activitățile Filialei Sector 1?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'bcpi', 'BCPI & CADASTRU', 'Cum acordă Filiala Sector 1 suport tehnic în relația cu BCPI Sector 1 și platforma e-Terra?', 'Filiala Sector 1 colectează și centralizează sincopele tehnice raportate de membrii săi în platforma integrată e-Terra și la BCPI Sector 1 (erori de validare CP/CF, întârzieri nejustificate la recepții, interpretări neunitare ale Ordinului ANCPI 600/2023). Acestea sunt înaintate lunar grupului de lucru ANCPI–UGR pentru rezolvare instituțională.', 6, true
where not exists (select 1 from public.faq where intrebare = 'Cum acordă Filiala Sector 1 suport tehnic în relația cu BCPI Sector 1 și platforma e-Terra?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'bcpi', 'SUPORT TEHNIC BCPI', 'Ce asistență oferă filiala în cazul dosarelor respinse sau blocajelor de recepție la OCPI București?', 'Dacă ați primit o notă de respingere neconformă cu normele tehnice ANCPI sau un referat de completare abuziv la BCPI Sector 1, puteți trimite numărul cererii și memoriul tehnic pe emailul filiala.ugr.s1@gmail.com. Comisia tehnică a filialei oferă asistență colegială și poate solicita punct de vedere oficial conducerii OCPI București.', 7, true
where not exists (select 1 from public.faq where intrebare = 'Ce asistență oferă filiala în cazul dosarelor respinse sau blocajelor de recepție la OCPI București?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'bcpi', 'LEGISLAȚIE & ANCPI', 'Cum influențează UGR normele tehnice și legislația ANCPI?', 'Prin reprezentanții din Biroul Executiv (BEX) și comisiile de specialitate, UGR participă direct la redactarea și revizuirea Ordinelor ANCPI privind recepția planurilor cadastrale, utilizarea platformei e-Terra și tarifele oficiale pentru serviciile de cadastru.', 8, true
where not exists (select 1 from public.faq where intrebare = 'Cum influențează UGR normele tehnice și legislația ANCPI?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'studenti', 'FIFIM STUDENȚI', 'Studenții la Geodezie se pot înscrie în UGR? Ce costuri implică?', 'Da, studenții înmatriculați la facultățile de profil (ex: Facultatea de Geodezie UTCB, UTM Chișinău, FIFIM USAMV București) beneficiază de un regim facilitat: taxa de înscriere este de doar 10 lei, iar cotizația anuală este de 10 lei, pe baza unei adeverințe de student valabile.', 9, true
where not exists (select 1 from public.faq where intrebare = 'Studenții la Geodezie se pot înscrie în UGR? Ce costuri implică?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'studenti', 'COMUNITATE FIFIM', 'Ce este UGR Student Community și unde se desfășoară activitățile academice?', 'UGR Student Community este puntea dintre mediul universitar și practica inginerească, având punctul central de întâlnire la Facultatea de Îmbunătățiri Funciare și Ingineria Mediului (FIFIM) — USAMV București (Bd. Mărăști nr. 59). Studenții participă la demonstrații practice cu stații totale robotice, scanere LiDAR 3D și drone fotogrammetrice.', 10, true
where not exists (select 1 from public.faq where intrebare = 'Ce este UGR Student Community și unde se desfășoară activitățile academice?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'studenti', 'WORKSHOPURI & FORMARE', 'Au studenții acces gratuit la conferințe și cursuri de formare LiDAR/GIS organizate de filială?', 'Da, toți studenții membri UGR au acces gratuit sau subvenționat la workshopurile tehnice, webinariile de formare software (AutoCAD Civil 3D, QGIS, TopoLT) și beneficiază de reduceri speciale la congresele majore precum Săptămâna Geodeziei Românești.', 11, true
where not exists (select 1 from public.faq where intrebare = 'Au studenții acces gratuit la conferințe și cursuri de formare LiDAR/GIS organizate de filială?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'evenimente', 'SGR CHIȘINĂU', 'Ce este Săptămâna Geodeziei Românești (SGR) și cum pot participa la Chișinău?', 'SGR este cel mai important congres tehnico-științific anual organizat de UGR. Ediția internațională se desfășoară în perioada 11–14 Noiembrie la Chișinău, la Universitatea Tehnică a Moldovei (UTM). Detaliile de înscriere, programul și transmiterea lucrărilor științifice sunt disponibile pe portalul oficial https://sgr.ugr.ro/indexr.php.', 12, true
where not exists (select 1 from public.faq where intrebare = 'Ce este Săptămâna Geodeziei Românești (SGR) și cum pot participa la Chișinău?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'evenimente', 'SGR CALL FOR PAPERS', 'Care este calendarul transmiterii lucrărilor științifice pentru SGR Chișinău?', 'Rezumatele și lucrările in extenso se depun prin platforma sgr.ugr.ro conform calendarului oficial afișat. Lucrările acceptate de comitetul științific internațional sunt publicate în volume indexate și prezentate în cadrul sesiunilor tematice dedicate cadastrului 3D, GIS și teledetecției.', 13, true
where not exists (select 1 from public.faq where intrebare = 'Care este calendarul transmiterii lucrărilor științifice pentru SGR Chișinău?');
insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select 'evenimente', 'EVENIMENTE FILIALĂ', 'Cum pot participa membrii la conferințele tehnice și Adunările Generale ale Filialei Sector 1?', 'Convocările pentru Adunările Generale ale Filialei Sector 1 și conferințele tehnice se transmit prin email membrilor activi și se anunță pe canalele oficiale de Facebook și Instagram cu cel puțin 15 zile înainte. Participarea poate fi cu prezență fizică sau în format hibrid (videoconferință).', 14, true
where not exists (select 1 from public.faq where intrebare = 'Cum pot participa membrii la conferințele tehnice și Adunările Generale ale Filialei Sector 1?');

-- 4. POPULARE DOCUMENTE (public.documente)
insert into public.documente (titlu, descriere, tip, badge, fisier_url, ordine, publicat)
select 'Cerere de Adeziune — Persoane Fizice', 'Formular tipizat oficial UGR Filiala Sector 1 București pentru ingineri geodezi și topografi autorizați ANCPI.', 'DOCX (Word)', 'Sector 1 Oficial', 'documente/cerere_inscriere_UGR_persoane_fizice_sector1.docx', 1, true
where not exists (select 1 from public.documente where titlu = 'Cerere de Adeziune — Persoane Fizice');
insert into public.documente (titlu, descriere, tip, badge, fisier_url, ordine, publicat)
select 'Cerere de Adeziune — Persoane Juridice', 'Formular tipizat oficial UGR Filiala Sector 1 dedicat birourilor de proiectare, societăților de cadastru și geodezie.', 'DOCX (Word)', 'Companii Sector 1', 'documente/cerere_inscriere_UGR_persoane_juridice_sector1.docx', 2, true
where not exists (select 1 from public.documente where titlu = 'Cerere de Adeziune — Persoane Juridice');
insert into public.documente (titlu, descriere, tip, badge, fisier_url, ordine, publicat)
select 'Statutul Oficial UGR & Regulament de Organizare', 'Documentul fundamental care reglementează funcționarea asociației, drepturile, îndatoririle și codul deontologic.', 'PDF (Acrobat)', 'Statut Juridic', 'documente/statut_ugr.pdf', 3, true
where not exists (select 1 from public.documente where titlu = 'Statutul Oficial UGR & Regulament de Organizare');

-- 5. ACTUALIZARE FLAG DEMONSTRATIV PE CEI 8 MEMBRI EXISTENȚI
update public.membri
set demonstrativ = true
where id in ('UGR-0012', 'UGR-0038', 'UGR-0145', 'UGR-0220', 'UGR-0312', 'UGR-0402', 'UGR-0589', 'UGR-0614');

-- 6. ÎMBOGĂȚIRE ȘTIRI EXISTENTE CU SCOPE, CATEGORIE, LOCAȚIE
update public.stiri
set scope = 'national',
    categorie = 'Eveniment Internațional Major',
    locatie = 'UTM, CHIȘINĂU, REPUBLICA MOLDOVA',
    text_buton = 'Vezi detalii & înscriere SGR ↗',
    link_actiune = 'https://sgr.ugr.ro/indexr.php'
where titlu like '%Săptămâna Geodeziei Românești %';
update public.stiri
set scope = 'local',
    categorie = 'Consultare Tehnică Locală',
    locatie = 'SEDIUL OCPI BUCUREȘTI / BCPI SECTOR 1',
    text_buton = 'Transmite propuneri & spețe locale →',
    link_actiune = '#contact'
where titlu like '%Masă Rotundă de Lucru: Filiala%';
update public.stiri
set scope = 'national',
    categorie = 'Comunicat Oficial BEX',
    locatie = 'SEDIUL CENTRAL UGR, BUCUREȘTI',
    text_buton = 'Citește comunicatul oficial ↗',
    link_actiune = 'https://www.ugr.ro/stiri/comunicat-privind-bex-ugr-din-21-mai-2026'
where titlu like '%Comunicat privind Deciziile Bi%';
update public.stiri
set scope = 'local',
    categorie = 'Ședință Statutară Filială',
    locatie = 'FACULTATEA DE GEODEZIE UTCB, BD. LACUL TEI 124',
    text_buton = 'Confirmă participarea la filială →',
    link_actiune = '#contact'
where titlu like '%Adunarea Generală a Membrilor %';
update public.stiri
set scope = 'local',
    categorie = 'Workshop Studențesc & Instruire',
    locatie = 'SALA DE CONSILIU FIFIM – USAMV (BD. MĂRĂȘTI NR. 59, SECTOR 1)',
    text_buton = 'Vezi postarea pe Instagram ↗',
    link_actiune = 'https://www.instagram.com/filiala.sector1.ugr'
where titlu like '%Ediția a II-a UGR Student Comm%';
update public.stiri
set scope = 'local',
    categorie = 'Formare Profesională Continuă',
    locatie = 'FIFIM USAMV & COMPANII PARTENERE SECTOR 1',
    text_buton = 'Vezi parteneriatele pe Instagram ↗',
    link_actiune = 'https://www.instagram.com/filiala.sector1.ugr'
where titlu like '%Premiul Filialei Sector 1 & Pa%';
update public.stiri
set scope = 'local',
    categorie = 'Notificare Operativă ANCPI',
    locatie = 'CANALE OFICIALE FILIALA SECTOR 1',
    text_buton = 'Citește anunțul pe Facebook ↗',
    link_actiune = 'https://www.facebook.com/share/14xwxtFChmC/'
where titlu like '%Comunicat Filiala Sector 1: No%';
update public.stiri
set scope = 'local',
    categorie = 'Burse & Sprijin Tineri Geodezi',
    locatie = 'FIFIM USAMV / CHIȘINĂU UTM',
    text_buton = 'Formular Înscriere Bursă SGR ↗',
    link_actiune = 'https://docs.google.com/forms/d/e/1FAIpQLSctDTm-Gxuph4yz2fJRiU2JOurBFgzBXriAUY6rbrtem5vrEQ/viewform?usp=header'
where titlu like '%Burse Complete UGR pentru Part%';
update public.stiri
set scope = 'national',
    categorie = 'Reprezentare Europeană',
    locatie = 'TARTU, ESTONIA',
    text_buton = 'Detalii for european ↗',
    link_actiune = 'https://www.clge.eu'
where titlu like '%Delegația Oficială UGR la Adun%';
