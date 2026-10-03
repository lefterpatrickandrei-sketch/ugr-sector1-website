/**
 * =========================================================================
 * BAZĂ DE DATE INSTITUȚIONALĂ ACTUALIZATĂ — UGR FILIALA SECTOR 1 BUCUREȘTI
 * =========================================================================
 * Date oficiale sincronizate cu:
 * - ugr.ro (BEX, Cum devin membru, Statut, Organigramă)
 * - sgr.ugr.ro (Săptămâna Geodeziei Românești 11-14 Noiembrie Chișinău UTM)
 * - Canalele oficiale Social Media (Facebook, YouTube, Instagram, LinkedIn)
 * =========================================================================
 */

const ugrData = {
    // -------------------------------------------------------------------------
    // Informații Instituționale & Canale Social Media Oficiale Filiala Sector 1
    // -------------------------------------------------------------------------
    organization: {
        name: "Uniunea Geodezilor din România (UGR)",
        branch: "Filiala Sector 1 București",
        foundingYear: 1990,
        address: "Bd. Lacul Tei nr. 124, Sector 2, București, România",
        academicCenterAddress: "Bulevardul Mărăști nr. 59, Sector 1, București (FIFIM – USAMV)",
        email: "filiala.ugr.s1@gmail.com",
        emailCentral: "office@ugr.ro",
        emailSecretar: "secretar@ugr.ro",
        phone: "0720 336 736",
        phoneCentral: "0723 587 081",
        cif: "6480330",
        bankAccounts: [
            {
                bank: "BRD — Groupe Société Générale (Ag. Tei, Sector 2)",
                iban: "RO57 BRDE 426S V810 0757 4450",
                currency: "RON",
                purpose: "Cotizație UGR Filiala Sector 1 / Nume și CNP"
            },
            {
                bank: "Banca Comercială Română (BCR)",
                iban: "RO04 RNCB 0074 0104 7856 0001",
                currency: "RON",
                purpose: "Taxă înscriere & cotizație anuală"
            }
        ],
        social: {
            facebook: "https://www.facebook.com/share/14xwxtFChmC/",
            instagram: "https://www.instagram.com/filiala.sector1.ugr"
        },
        socialLinks: {
            facebook: "https://www.facebook.com/share/14xwxtFChmC/",
            instagram: "https://www.instagram.com/filiala.sector1.ugr"
        },
        affiliations: [
            { name: "FIG", full: "Fédération Internationale des Géomètres (Membru Titular din 1992)" },
            { name: "CLGE", full: "Council of European Geodetic Surveyors (din 2004)" },
            { name: "UPLR", full: "Uniunea Profesiilor Liberale din România" }
        ]
    },
    socialLinks: {
        facebook: "https://www.facebook.com/share/14xwxtFChmC/",
        instagram: "https://www.instagram.com/filiala.sector1.ugr"
    },

    // -------------------------------------------------------------------------
    // Ghid Oficial: Cum Devin Membru UGR (ugr.ro/cum-devin-membru)
    // -------------------------------------------------------------------------
    membershipGuide: {
        steps: [
            {
                step: 1,
                title: "Completarea Cererii de Adeziune",
                desc: "Se descarcă și se completează formularul tipizat pentru persoane fizice, studenți sau companii (persoane juridice)."
            },
            {
                step: 2,
                title: "Pregătirea Dosarului Profesional",
                desc: "Se anexează copia actului de identitate, copia diplomelor de studii superioare (inginer/subinginer geodez) și certificatul de autorizare ANCPI (dacă există)."
            },
            {
                step: 3,
                title: "Achitarea Taxelor Oficiale",
                desc: "Plata taxei de înscriere (50 RON) și a cotizației anuale (100 RON pentru membri activi, 10 RON pentru studenți) în contul bancar UGR."
            },
            {
                step: 4,
                title: "Validarea în Biroul Executiv (BEX)",
                desc: "După validarea dosarului în ședința BEX, se emite legitimația oficială de membru UGR și se atribuie numărul de înregistrare."
            }
        ],
        tiers: [
            {
                id: "fizica",
                name: "Persoană Fizică (Geodez / Topograf Autorizat)",
                signupFee: "50 RON (plată unică)",
                annualFee: "100 RON / an",
                requirements: "Diplomă de licență geodezie / topografie / cadastru + Certificat ANCPI (opțional)",
                badge: "Recomandat Specialiști"
            },
            {
                id: "student",
                name: "Membru Student (Facultăți de Profil)",
                signupFee: "10 RON (simbolică)",
                annualFee: "10 RON / an",
                requirements: "Adeverință student la zi (UTCB, UTM, USAMV etc.)",
                badge: "Acces Tineri Geodezi"
            },
            {
                id: "juridica",
                name: "Persoană Juridică (Companii & Birouri de Cadastru)",
                signupFee: "100 RON",
                annualFee: "500 - 2.000 RON / an (în funcție de numărul de experți)",
                requirements: "Copie CUI firmă, autorizație ANCPI clasa I / II / III",
                badge: "Companii de Elită"
            }
        ]
    },

    // -------------------------------------------------------------------------
    // Întrebări Frecvente (FAQ) Detaliate
    // -------------------------------------------------------------------------
    faqList: [
        {
            category: "aderare",
            tag: "STATUT & PROTOCOL",
            q: "Ce este Uniunea Geodezilor din România (UGR) și ce rol are Filiala Sector 1?",
            a: "UGR este asociația profesională națională neguvernamentală, apolitică și non-profit a inginerilor geodezi, topografilor și cartografilor din România, fondată în 1990. Filiala Sector 1 București asigură reprezentarea geodezilor din Capitală, facilitând dialogul legislativ cu ANCPI, OCPI București și participarea la evenimente de perfecționare tehnică."
        },
        {
            category: "aderare",
            tag: "STATUT & COTIZAȚII",
            q: "Cum devin membru UGR și care sunt pașii de înscriere?",
            a: "Conform procedurii oficiale (ugr.ro/cum-devin-membru): 1. Se completează cererea de adeziune tipizată. 2. Se trimit actele de studii și autorizația ANCPI. 3. Se achită taxa de înscriere (50 lei) și cotizația anuală (100 lei). 4. Dosarul este validat de Biroul Executiv (BEX) și se emite legitimația oficială."
        },
        {
            category: "aderare",
            tag: "CONTURI & PLĂȚI",
            q: "Care sunt datele bancare oficiale pentru achitarea cotizației?",
            a: "Plățile se efectuează în contul oficial UGR: RO57 BRDE 426S V810 0757 4450 (deschis la BRD Ag. Tei, Sector 2) sau RO04 RNCB 0074 0104 7856 0001 (BCR), menționând obligatoriu la detaliile plății: Nume Prenume, CNP și 'Cotizație Filiala Sector 1'."
        },
        {
            category: "aderare",
            tag: "BENEFICII MEMBRI",
            q: "Ce avantaje profesionale oferă apartenența la UGR?",
            a: "Membrii beneficiază de: recunoaștere în forurile europene (FIG & CLGE), tarife preferențiale la conferințe internaționale, consultanță juridică și legislativă în relația cu ANCPI, acces la cursuri de formare continuă (LiDAR, GIS, GNSS) și promovare în Registrul Geodezilor Autorizați."
        },
        {
            category: "aderare",
            tag: "HUB COMUNICARE",
            q: "Unde pot urmări noutățile operative și activitățile Filialei Sector 1?",
            a: "Toate notificările operative ANCPI privind platforma e-Terra, evenimentele din cadrul UGR Student Community la FIFIM USAMV, workshopurile de specialitate și fotografiile de la întâlniri sunt publicate pe pagina oficială de Facebook (facebook.com/share/14xwxtFChmC/) și pe contul de Instagram (@filiala.sector1.ugr). Pentru solicitări directe: filiala.ugr.s1@gmail.com sau telefonic la 0720 336 736."
        },
        {
            category: "bcpi",
            tag: "BCPI & CADASTRU",
            q: "Cum acordă Filiala Sector 1 suport tehnic în relația cu BCPI Sector 1 și platforma e-Terra?",
            a: "Filiala Sector 1 colectează și centralizează sincopele tehnice raportate de membrii săi în platforma integrată e-Terra și la BCPI Sector 1 (erori de validare CP/CF, întârzieri nejustificate la recepții, interpretări neunitare ale Ordinului ANCPI 600/2023). Acestea sunt înaintate lunar grupului de lucru ANCPI–UGR pentru rezolvare instituțională."
        },
        {
            category: "bcpi",
            tag: "SUPORT TEHNIC BCPI",
            q: "Ce asistență oferă filiala în cazul dosarelor respinse sau blocajelor de recepție la OCPI București?",
            a: "Dacă ați primit o notă de respingere neconformă cu normele tehnice ANCPI sau un referat de completare abuziv la BCPI Sector 1, puteți trimite numărul cererii și memoriul tehnic pe emailul filiala.ugr.s1@gmail.com. Comisia tehnică a filialei oferă asistență colegială și poate solicita punct de vedere oficial conducerii OCPI București."
        },
        {
            category: "bcpi",
            tag: "LEGISLAȚIE & ANCPI",
            q: "Cum influențează UGR normele tehnice și legislația ANCPI?",
            a: "Prin reprezentanții din Biroul Executiv (BEX) și comisiile de specialitate, UGR participă direct la redactarea și revizuirea Ordinelor ANCPI privind recepția planurilor cadastrale, utilizarea platformei e-Terra și tarifele oficiale pentru serviciile de cadastru."
        },
        {
            category: "studenti",
            tag: "FIFIM STUDENȚI",
            q: "Studenții la Geodezie se pot înscrie în UGR? Ce costuri implică?",
            a: "Da, studenții înmatriculați la facultățile de profil (ex: Facultatea de Geodezie UTCB, UTM Chișinău, FIFIM USAMV București) beneficiază de un regim facilitat: taxa de înscriere este de doar 10 lei, iar cotizația anuală este de 10 lei, pe baza unei adeverințe de student valabile."
        },
        {
            category: "studenti",
            tag: "COMUNITATE FIFIM",
            q: "Ce este UGR Student Community și unde se desfășoară activitățile academice?",
            a: "UGR Student Community este puntea dintre mediul universitar și practica inginerească, având punctul central de întâlnire la Facultatea de Îmbunătățiri Funciare și Ingineria Mediului (FIFIM) — USAMV București (Bd. Mărăști nr. 59). Studenții participă la demonstrații practice cu stații totale robotice, scanere LiDAR 3D și drone fotogrammetrice."
        },
        {
            category: "studenti",
            tag: "WORKSHOPURI & FORMARE",
            q: "Au studenții acces gratuit la conferințe și cursuri de formare LiDAR/GIS organizate de filială?",
            a: "Da, toți studenții membri UGR au acces gratuit sau subvenționat la workshopurile tehnice, webinariile de formare software (AutoCAD Civil 3D, QGIS, TopoLT) și beneficiază de reduceri speciale la congresele majore precum Săptămâna Geodeziei Românești."
        },
        {
            category: "evenimente",
            tag: "SGR CHIȘINĂU",
            q: "Ce este Săptămâna Geodeziei Românești (SGR) și cum pot participa la Chișinău?",
            a: "SGR este cel mai important congres tehnico-științific anual organizat de UGR. Ediția internațională se desfășoară în perioada 11–14 Noiembrie la Chișinău, la Universitatea Tehnică a Moldovei (UTM). Detaliile de înscriere, programul și transmiterea lucrărilor științifice sunt disponibile pe portalul oficial https://sgr.ugr.ro/indexr.php."
        },
        {
            category: "evenimente",
            tag: "SGR CALL FOR PAPERS",
            q: "Care este calendarul transmiterii lucrărilor științifice pentru SGR Chișinău?",
            a: "Rezumatele și lucrările in extenso se depun prin platforma sgr.ugr.ro conform calendarului oficial afișat. Lucrările acceptate de comitetul științific internațional sunt publicate în volume indexate și prezentate în cadrul sesiunilor tematice dedicate cadastrului 3D, GIS și teledetecției."
        },
        {
            category: "evenimente",
            tag: "EVENIMENTE FILIALĂ",
            q: "Cum pot participa membrii la conferințele tehnice și Adunările Generale ale Filialei Sector 1?",
            a: "Convocările pentru Adunările Generale ale Filialei Sector 1 și conferințele tehnice se transmit prin email membrilor activi și se anunță pe canalele oficiale de Facebook și Instagram cu cel puțin 15 zile înainte. Participarea poate fi cu prezență fizică sau în format hibrid (videoconferință)."
        }
    ],

    // -------------------------------------------------------------------------
    // Evenimente Oficiale & Știri de Actualitate (SGR Chișinău, BEX, Filiala Sector 1)
    // -------------------------------------------------------------------------
    newsList: [
        {
            id: "news-sgr-chisinau",
            scope: "national",
            scopeLabel: "[EVENIMENT NAȚIONAL UGR / FIG / CLGE]",
            category: "Eveniment Internațional Major",
            title: "Săptămâna Geodeziei Românești (SGR) — Chișinău (11–14 Noiembrie)",
            desc: "UGR și Universitatea Tehnică a Moldovei (UTM) organizează ediția internațională SGR la Chișinău. Congresul reunește experți ANCPI, ARFC, delegați FIG și CLGE pentru dezbateri pe tematica geodeziei moderne, scanării LiDAR și integrării europene a cadastrului.",
            location: "UTM, CHIȘINĂU, REPUBLICA MOLDOVA",
            date: "11–14 NOIEMBRIE",
            source: { org: "Portal SGR", url: "https://sgr.ugr.ro/indexr.php" },
            image: "ugr-images/united_1384.png",
            actionText: "Vezi detalii & înscriere SGR ↗"
        },
        {
            id: "news-local-ocpi-s1",
            scope: "local",
            scopeLabel: "[ACTIVITATE LOCALĂ FILIALA SECTOR 1]",
            category: "Consultare Tehnică Locală",
            title: "Masă Rotundă de Lucru: Filiala Sector 1 & Conducerea BCPI Sector 1",
            desc: "Sesiune de lucru consultativă dedicată geodezilor autorizați din Sectorul 1 București pentru uniformizarea procedurilor de recepție a planurilor de amplasament și rezolvarea necorelărilor tehnice din sistemul integrat e-Terra.",
            location: "SEDIUL OCPI BUCUREȘTI / BCPI SECTOR 1",
            date: "PROGRAM LUNAR FILIALĂ",
            source: { org: "Filiala Sector 1", url: "#contact" },
            image: "ugr-images/ig_post_5.jpg",
            actionText: "Transmite propuneri & spețe locale →"
        },
        {
            id: "news-bex-comunicat",
            scope: "national",
            scopeLabel: "[EVENIMENT NAȚIONAL UGR / FIG / CLGE]",
            category: "Comunicat Oficial BEX",
            title: "Comunicat privind Deciziile Biroului Executiv (BEX) UGR",
            desc: "Biroul Executiv al Uniunii Geodezilor din România a adoptat rezoluțiile privind optimizarea fluxurilor de lucru cu ANCPI, normele metodologice pentru lucrările de cadastru sistematic și sprijinirea formării profesionale continue a geodezilor autorizați.",
            location: "SEDIUL CENTRAL UGR, BUCUREȘTI",
            date: "ACTUALIZARE 2026",
            source: { org: "UGR Stiri", url: "https://www.ugr.ro/stiri/comunicat-privind-bex-ugr-din-21-mai-2026" },
            image: "ugr-images/6a0c30e4559d8Board-CLGE-Tartu-mai-2026.png",
            actionText: "Citește comunicatul oficial ↗"
        },
        {
            id: "news-local-adunare-s1",
            scope: "local",
            scopeLabel: "[ACTIVITATE LOCALĂ FILIALA SECTOR 1]",
            category: "Ședință Statutară Filială",
            title: "Adunarea Generală a Membrilor Filialei Sector 1 București",
            desc: "Întâlnirea anuală a comunității geodezilor din Sectorul 1: prezentarea raportului de activitate local, validarea calendarului de workshop-uri practice GNSS/LiDAR și primirea noilor absolvenți de la Facultatea de Geodezie UTCB.",
            location: "FACULTATEA DE GEODEZIE UTCB, BD. LACUL TEI 124",
            date: "CONVOCARE TERITORIALĂ",
            source: { org: "Filiala Sector 1", url: "#contact" },
            image: "ugr-images/ISP7469.png",
            actionText: "Confirmă participarea la filială →"
        },
        {
            id: "news-student-community-fifim",
            scope: "local",
            scopeLabel: "[FILIALA SECTOR 1 · COMUNITATE ACADEMICĂ]",
            category: "Workshop Studențesc & Instruire",
            title: "Ediția a II-a UGR Student Community by UGR Sector 1: GIS și baze de date spațiale",
            desc: "Întâlnirea comunității cu studenții și viitorii colegi în Sala de Consiliu FIFIM – USAMV București. Sesiuni practice de analiză și gestionare a informației spațiale, GIS și tranziția de la facultate la provocările din topografia inginerească de pe șantiere.",
            location: "SALA DE CONSILIU FIFIM – USAMV (BD. MĂRĂȘTI NR. 59, SECTOR 1)",
            date: "8 IULIE 2026",
            source: { org: "Instagram @filiala.sector1.ugr", url: "https://www.instagram.com/filiala.sector1.ugr" },
            image: "ugr-images/ig_post_1.jpg",
            actionText: "Vezi postarea pe Instagram ↗"
        },
        {
            id: "news-workshopuri-parteneriat-s1",
            scope: "local",
            scopeLabel: "[PARTENERIAT TEHNIC FILIALA SECTOR 1]",
            category: "Formare Profesională Continuă",
            title: "Premiul Filialei Sector 1 & Pachet de 18 Workshopuri Profesionale de Specialitate",
            desc: "La susținerea licențelor MTC la USAMV, Filiala Sector 1 a acordat premii de excelență și a lansat 18 workshopuri aplicate alături de partenerii KarmaCad Store (scanare laser 3D), SphereFix România și Control Survey SRL.",
            location: "FIFIM USAMV & COMPANII PARTENERE SECTOR 1",
            date: "IULIE 2026",
            source: { org: "Instagram @filiala.sector1.ugr", url: "https://www.instagram.com/filiala.sector1.ugr" },
            image: "ugr-images/ig_post_3.jpg",
            actionText: "Vezi parteneriatele pe Instagram ↗"
        },
        {
            id: "news-comunicat-ancpi-eterra",
            scope: "local",
            scopeLabel: "[COMUNICAT OPERATIV FILIALA SECTOR 1]",
            category: "Notificare Operativă ANCPI",
            title: "Comunicat Filiala Sector 1: Notificare ANCPI privind disponibilitatea sistemului e-Terra",
            desc: "Anunț operativ ANCPI transmis în timp real membrilor geodezi din Sectorul 1 privind disfuncționalitățile tehnice ale platformei e-Terra și calendarul de restabilire a serviciilor de cadastru și carte funciară.",
            location: "CANALE OFICIALE FILIALA SECTOR 1",
            date: "14 IULIE 2026",
            source: { org: "Facebook Filiala Sector 1 UGR", url: "https://www.facebook.com/share/14xwxtFChmC/" },
            image: "ugr-images/ig_post_6.jpg",
            actionText: "Citește anunțul pe Facebook ↗"
        },
        {
            id: "news-burse-sgr-chisinau",
            scope: "local",
            scopeLabel: "[OPORTUNITATE STUDENȚEASCĂ FILIALA SECTOR 1]",
            category: "Burse & Sprijin Tineri Geodezi",
            title: "Burse Complete UGR pentru Participare la Săptămâna Geodeziei Românești 2026 (Chișinău)",
            desc: "Șansă dedicată studenților de la Geodezie: UGR și Filiala Sector 1 oferă burse integrale ce acoperă taxa de participare, cazarea, mesele și transportul pentru conferința internațională SGR de la UTM Chișinău (11–14 Noiembrie).",
            location: "FIFIM USAMV / CHIȘINĂU UTM",
            date: "15 IUNIE – 15 SEPTEMBRIE 2026",
            source: { org: "Instagram @filiala.sector1.ugr", url: "https://www.instagram.com/filiala.sector1.ugr" },
            image: "ugr-images/ig_post_4.jpg",
            actionText: "Detalii burse pe Instagram ↗"
        },
        {
            id: "news-clge-tartu",
            scope: "national",
            scopeLabel: "[EVENIMENT NAȚIONAL UGR / FIG / CLGE]",
            category: "Reprezentare Europeană",
            title: "Delegația Oficială UGR la Adunarea Generală CLGE",
            desc: "România a promovat armonizarea normelor de etică și bune practici în măsurătorile cadastrale la nivelul Consiliului European al Geodezilor (CLGE), susținând drepturile geodezilor autorizați din Europa Centrală și de Est.",
            location: "TARTU, ESTONIA",
            date: "EVENIMENT EUROPEAN",
            source: { org: "CLGE", url: "https://www.clge.eu" },
            image: "ugr-images/6a0c33b42cd7bAG-CLGE-TARTU-Group-pic.png",
            actionText: "Detalii for european ↗"
        }
    ],

    // -------------------------------------------------------------------------
    // Consiliul de Conducere (Biroul Executiv - BEX UGR)
    // -------------------------------------------------------------------------
    leadership: [
        {
            name: "Ing. Mircea Afrăsinei",
            role: "Președinte UGR",
            image: "ugr-images/Mircea-Afrsinei.jpg",
            desc: "Coordonator general și reprezentant legal al Uniunii în parteneriatele strategice cu ANCPI, Guvernul României, FIG și CLGE."
        },
        {
            name: "Prof. univ. dr. ing. Ana Cornelia Badea",
            role: "Vicepreședinte Parteneriate Academice",
            image: "logo_geodez.png",
            desc: "Cadru didactic universitar la Facultatea de Geodezie UTCB. Responsabilă de cercetarea științifică, conferințe academice și relația cu universitățile tehnice."
        },
        {
            name: "Prof. univ. dr. ing. Petre Iuliu Dragomir",
            role: "Vicepreședinte Relații Instituționale",
            image: "logo_geodez.png",
            desc: "Coordonator al dialogului tehnic-legislativ cu ANCPI, responsabil de propunerile de îmbunătățire a legislației cadastrului și publicității imobiliare."
        },
        {
            name: "Ing. Vlad Păunescu",
            role: "Secretar Executiv UGR",
            image: "logo_geodez.png",
            desc: "Gestiunea operațională a asociației, relația directă cu filialele din țară și evidența membrilor activi (secretar@ugr.ro)."
        },
        {
            name: "Ing. Costin Sebastian Manu",
            role: "Trezorier Național",
            image: "logo_geodez.png",
            desc: "Managementul financiar, transparența bugetară, gestiunea cotizațiilor și auditul operațiunilor asociației."
        }
    ],

    // -------------------------------------------------------------------------
    // Telemetrie Geodezică & Repere Spațiale — Sectorul 1 București & ROMPOS
    // -------------------------------------------------------------------------
    sector1Telemetry: {
        meta: {
            title: "Rețeaua Geodezică și Telemetria Teritorială — Sector 1 București",
            crs: "EPSG:3844 — Pulkovo 1942(58) / Stereo 70 (ANCPI)",
            ellipsoid: "Krassovski 1940 (a = 6378245.0 m, 1/f = 298.3)",
            projection: "Stereografică Oblică Conformă pe Plan Secant (Stereo 70)",
            centralMeridian: "25° 00' 00.000\" E",
            originLatitude: "46° 00' 00.000\" N",
            falseCoordinates: "X0 (Nord) = 500.000,000 m | Y0 (Est) = 500.000,000 m",
            scaleFactor: "k0 = 0.999750000",
            helmert7Towgs84: "+towgs84=2.3287,-147.0425,-92.0802,0.3092483,0.3248218,-0.4973001,5.68906266"
        },
        branchHQ: {
            name: "Sediul Filialei Sector 1 București (Pol Regional Capitală)",
            type: "Sediul Teritorial Executiv",
            sector: "Sector 1",
            address: "Axa Piața Victoriei — Banu Manta — Kiseleff, Sector 1, București",
            stereo70: {
                xNord: 328657.980,
                yEst: 586044.896,
                zCota: 85.42,
                unit: "m"
            },
            wgs84: {
                lat: 44.452600,
                lon: 26.079200,
                latDMS: "44°27'09\" N",
                lonDMS: "26°04'45\" E"
            },
            description: "Punct focal administrativ și geodezic al Capitalei, coordonare tehnică și integrare directă cu OCPI București și ANCPI."
        },
        centralHQ: {
            name: "Sediul Central UGR (Lacul Tei 124)",
            type: "Sediul Central Național",
            sector: "Sector 2",
            address: "Bd. Lacul Tei nr. 124, Sector 2, București",
            stereo70: {
                xNord: 334250.125,
                yEst: 591240.850,
                zCota: 78.15,
                unit: "m"
            },
            wgs84: {
                lat: 44.502276,
                lon: 26.145473,
                latDMS: "44°30'08\" N",
                lonDMS: "26°08'44\" E"
            },
            description: "Sediul central administrativ al Uniunii Geodezilor din România."
        },
        academicCenter: {
            name: "Facultatea de Îmbunătățiri Funciare și Ingineria Mediului (FIFIM) – USAMV București",
            role: "Centrul universitar și de pregătire profesională al Filialei Sector 1",
            sector: "Sector 1",
            address: "Bulevardul Mărăști nr. 59, Sector 1, București",
            stereo70: {
                xNord: 330215.450,
                yEst: 584980.220,
                zCota: 87.60,
                unit: "m"
            },
            wgs84: {
                lat: 44.471500,
                lon: 26.069800,
                latDMS: "44°28'17\" N",
                lonDMS: "26°04'11\" E"
            },
            description: "Parteneriat academic strategic: Centrul universitar și de pregătire profesională al filialei, dedicat sesiunilor de GIS, baze de date spațiale și comunității UGR Student Community."
        },
        // Repere Cheie din Rețeaua Geodezică Locală a Municipiului București (RGLMB) - Sector 1
        rglmbBenchmarks: [
            {
                code: "RGLMB-S1-FIFIM",
                name: "FIFIM – USAMV București (Centrul Universitar & Training Sector 1)",
                type: "Reper Academic & Centru de Formare Profesională",
                location: "Bulevardul Mărăști nr. 59, Sector 1, București",
                stereo70: { xNord: 330215.450, yEst: 584980.220, zCota: 87.60 },
                wgs84: { lat: 44.471500, lon: 26.069800, dms: "44°28'17\" N / 26°04'11\" E" },
                precision: "Reper de Calibrare & Formare Geodezică",
                status: "Punct de instruire și workshopuri UGR Student Community"
            },
            {
                code: "RGLMB-S1-VIC",
                name: "Piața Victoriei (Pol Administrativ Sector 1)",
                type: "Reper Fundamental RGLMB / Ordinul I",
                location: "Piața Victoriei, Sector 1, București",
                stereo70: { xNord: 328733.315, yEst: 586483.430, zCota: 86.20 },
                wgs84: { lat: 44.453225, lon: 26.084722, dms: "44°27'12\" N / 26°05'05\" E" },
                precision: "Ordinul I (Sub-centimetrică)",
                status: "Activ / Verificat ANCPI"
            },
            {
                code: "RGLMB-S1-ARC",
                name: "Arcul de Triumf (Șoseaua Kiseleff)",
                type: "Punct Geodezic Monumental de Ordinul I",
                location: "Șos. Kiseleff — Bd. Mareșal Constantin Prezan, Sector 1",
                stereo70: { xNord: 330270.996, yEst: 585936.024, zCota: 89.45 },
                wgs84: { lat: 44.467128, lon: 26.078103, dms: "44°28'02\" N / 26°04'41\" E" },
                precision: "Ordinul I RGLMB",
                status: "Activ / Monument Geodezic Protejat"
            },
            {
                code: "RGLMB-S1-OBS",
                name: "Observatorul Astronomic Vasile Urseanu",
                type: "Reper Fundamental de Nivelment Clasa I",
                location: "Bd. Lascăr Catargiu nr. 21, Sector 1",
                stereo70: { xNord: 328101.985, yEst: 586845.767, zCota: 84.10 },
                wgs84: { lat: 44.447500, lon: 26.089167, dms: "44°26'51\" N / 26°05'21\" E" },
                precision: "Nivelment de Înaltă Precizie (±0.5 mm/km)",
                status: "Activ / Punct Fundamental Istoric"
            },
            {
                code: "RGLMB-S1-HER",
                name: "Borna Geodezică Parcul Herăstrău (Regele Mihai I)",
                type: "Reper Poligonație Cadastrală Clasa II",
                location: "Parcul Regele Mihai I (Nord), Sector 1",
                stereo70: { xNord: 330728.114, yEst: 586279.800, zCota: 82.70 },
                wgs84: { lat: 44.471200, lon: 26.082500, dms: "44°28'16\" N / 26°04'57\" E" },
                precision: "Clasa II RGLMB (±1 cm)",
                status: "Activ / Calibrat GPS"
            },
            {
                code: "RGLMB-S1-GAR",
                name: "Nod Geodezic Gara de Nord — Calea Griviței",
                type: "Reper de Rețea Densificare Urbană",
                location: "Piața Gării de Nord / Calea Griviței, Sector 1",
                stereo70: { xNord: 327915.220, yEst: 585520.140, zCota: 83.90 },
                wgs84: { lat: 44.445900, lon: 26.072500, dms: "44°26'45\" N / 26°04'21\" E" },
                precision: "Clasa II RGLMB",
                status: "Activ / Verificat"
            }
        ],
        // Stații Permanente GNSS ROMPOS de Referință (București - Ilfov)
        romposStations: [
            {
                id: "BUCU",
                code: "ROMPOS-BUCU",
                name: "Stația Națională Permanentă BUCU (București - UTCB Tei)",
                operator: "ANCPI / Universitatea Tehnică de Construcții București",
                location: "Bd. Lacul Tei nr. 124 (Facultatea de Geodezie)",
                stereo70: { xNord: 329612.386, yEst: 588947.677, zCota: 135.20 },
                wgs84: { lat: 44.460833, lon: 26.115833, dms: "44°27'39\" N / 26°06'57\" E" },
                hardware: "Leica GR50 Multi-Frequency Receiver + Antenă LEIAR25.R4 LEIT (Choke Ring)",
                signals: "GPS (L1, L2, L5), GLONASS (L1, L2), GALILEO (E1, E5a, E5b, AltBOC), BEIDOU (B1, B2, B3)",
                rtkServices: "ROMPOS-RTK (VRS, MAC, Single Cell RTCM 3.2)",
                networkRole: "Stație Fundamentală Clasa A EUREF / EPN (European Permanent Network)",
                status: "ONLINE / Răspuns RTK < 1 sec"
            },
            {
                id: "BUC1",
                code: "ROMPOS-BUC1",
                name: "Stația Permanentă BUC1 (București Vest / Militari)",
                operator: "ANCPI / Direcția Națională de Geodezie și Cartografie",
                location: "București Vest (Sector 6 / legătură Sector 1 Vest)",
                stereo70: { xNord: 326792.087, yEst: 583501.569, zCota: 120.40 },
                wgs84: { lat: 44.436111, lon: 26.046944, dms: "44°26'10\" N / 26°02'49\" E" },
                hardware: "Trimble NetR9 Geodetic GNSS Receiver + Antenă Zephyr Geodetic III",
                signals: "GPS, GLONASS, GALILEO",
                rtkServices: "Corecții Diferențiale RTCM 3.x / Ntrip Caster",
                networkRole: "Acoperire Densificare Metropolitană Vest-Nord",
                status: "ONLINE / 99.98% Uptime"
            },
            {
                id: "BUC2",
                code: "ROMPOS-BUC2",
                name: "Stația Permanentă BUC2 (București Filaret / Astronomic)",
                operator: "Institutul Astronomic al Academiei Române / ANCPI",
                location: "Dealul Filaret (Observatorul Astronomic București)",
                stereo70: { xNord: 324220.972, yEst: 587473.407, zCota: 142.10 },
                wgs84: { lat: 44.412500, lon: 26.096389, dms: "44°24'45\" N / 26°05'47\" E" },
                hardware: "Septentrio PolaRx5 Multi-GNSS + Antenă PolaNt Choke Ring",
                signals: "Quad-Constellation GNSS, Servicii Geodinamice Crustale",
                rtkServices: "Stream Date Geodezice 1Hz & 20Hz",
                networkRole: "Monitorizare Geodinamică și Geodezie Spațială",
                status: "ONLINE / Rețea Științifică"
            }
        ]
    },

    // -------------------------------------------------------------------------
    // Coordonate Noduri Geodezice & Filiale
    // -------------------------------------------------------------------------
    mapNodes: {
        bucuresti: { 
            name: "București — Filiala Sector 1 (Pol Regional Capitală)",      
            shortName: "Sector 1 (Capitală)",
            tier: "capital_hub",
            lat: 44.4532, 
            lon: 26.0847, 
            latStr: "44°27'12\" N", 
            lonStr: "26°05'05\" E", 
            stereo70Str: "X: 328733.315 m | Y: 586483.430 m",
            badge: "★ POL REGIONAL CAPITALĂ — FILIALA SECTOR 1",
            color: "#00E5FF",
            desc: "Nod strategic național și pol legislativ al Capitalei: Filiala Sector 1 reprezintă comunitatea geodezilor autorizați din București în parteneriat tehnic-legislativ direct cu ANCPI și OCPI București. Coordonează Rețeaua Geodezică Locală a Municipiului București (RGLMB) și infrastructura stațiilor GNSS permanente ROMPOS (BUCU, BUC1, BUC2).",
            telemetrySummary: {
                crs: "Stereo 70 (EPSG:3844)",
                romposRef: "BUCU (Tei) & BUC1 (Vest)",
                rglmbRef: "Piața Victoriei (328733.315 / 586483.430)",
                ordin: "Ordinul I RGLMB / Nivelment Clasa I"
            }
        },
        chisinau: { 
            name: "Chișinău — UTM (Gazda Internațională SGR)",  
            shortName: "Chișinău UTM (SGR)",
            tier: "international_host",
            lat: 47.0012, 
            lon: 28.8514, 
            latStr: "47°01'12\" N", 
            lonStr: "28°51'14\" E", 
            stereo70Str: "Sistem Național MD / MOLDREF 99",
            badge: "◆ GAZDA INTERNAȚIONALĂ SGR 2026 (11–14 NOV)",
            color: "#FF9F1C",
            desc: "Gazda Săptămânii Geodeziei Românești (11–14 Noiembrie), Filială transfrontalieră înființată la Universitatea Tehnică a Moldovei (UTM). Reunește experți ANCPI, ARFC, delegați FIG și CLGE pentru integrarea europeană a cadastrului.",
            telemetrySummary: {
                crs: "MOLDREF 99 (EPSG:4026)",
                institution: "Universitatea Tehnică a Moldovei (UTM)",
                role: "Congres Internațional SGR 2026",
                delegati: "ANCPI, ARFC, FIG, CLGE"
            }
        },
        cluj: { 
            name: "Cluj-Napoca (Filială Regională)",
            shortName: "Cluj-Napoca",
            tier: "regional_branch",
            lat: 46.7712, 
            lon: 23.6236, 
            latStr: "46°46'18\" N", 
            lonStr: "23°35'47\" E", 
            stereo70Str: "X: 586120.400 m | Y: 394210.150 m",
            badge: "● FILIALĂ REGIONALĂ TRANSILVANIA",
            color: "#40B0F0",
            desc: "Nod universitar de elită (USAMV Cluj-Napoca) și centru regional de cercetare cadastrală în Transilvania. Tehnologii avansate GIS și cadastru sistematic rural și urban.",
            telemetrySummary: {
                crs: "Stereo 70 (EPSG:3844)",
                romposRef: "Stația CLUJ (USAMV)",
                specializare: "Cadastru & GIS"
            }
        },
        iasi: { 
            name: "Iași (Filială Regională)",
            shortName: "Iași",
            tier: "regional_branch",
            lat: 47.1585, 
            lon: 27.6014, 
            latStr: "47°09'44\" N", 
            lonStr: "27°35'20\" E", 
            stereo70Str: "X: 628940.300 m | Y: 697420.800 m",
            badge: "● FILIALĂ REGIONALĂ MOLDOVA",
            color: "#40B0F0",
            desc: "Filială regională strategică la Universitatea Tehnică Gheorghe Asachi din Iași, conectată cu rețeaua geodezică din Est și proiecte transfrontaliere de cartografiere.",
            telemetrySummary: {
                crs: "Stereo 70 (EPSG:3844)",
                romposRef: "Stația IASI (UTI)",
                specializare: "Geodezie Satelitară & GNSS"
            }
        },
        timisoara: { 
            name: "Timișoara (Filială Regională)",
            shortName: "Timișoara",
            tier: "regional_branch",
            lat: 45.7537, 
            lon: 21.2257, 
            latStr: "45°45'13\" N", 
            lonStr: "21°13'43\" E", 
            stereo70Str: "X: 473510.600 m | Y: 206890.350 m",
            badge: "● FILIALĂ REGIONALĂ BANAT",
            color: "#40B0F0",
            desc: "Gazda edițiilor anterioare ale SGR și centru de excelență la Universitatea Politehnica Timișoara în scanare laser 3D terestră și aeriană (LiDAR) și fotogrammetrie UAV.",
            telemetrySummary: {
                crs: "Stereo 70 (EPSG:3844)",
                romposRef: "Stația TIM1 (UPT)",
                specializare: "Scanare Laser LiDAR & DTM"
            }
        },
        constanta: { 
            name: "Constanța (Filială Regională)",
            shortName: "Constanța",
            tier: "regional_branch",
            lat: 44.1792, 
            lon: 28.6498, 
            latStr: "44°10'42\" N", 
            lonStr: "28°38'30\" E", 
            stereo70Str: "X: 299840.200 m | Y: 791930.500 m",
            badge: "● FILIALĂ REGIONALĂ DOBROGEA",
            color: "#40B0F0",
            desc: "Specializată pe batimetrie marină, topografie portuară, proiecții costiere Marea Neagră și monitorizarea variațiilor nivelului Mării Negre prin maregraful Constanța.",
            telemetrySummary: {
                crs: "Stereo 70 / Marea Neagră 1975",
                romposRef: "Stația COST (Port Constanța)",
                specializare: "Batimetrie Marină & Coastă"
            }
        }
    },

    skillMapping: {
        toate: ["bucuresti", "chisinau", "cluj", "iasi", "timisoara", "constanta"],
        lidar: ["bucuresti", "chisinau", "cluj", "timisoara"],
        gnss: ["bucuresti", "chisinau", "cluj", "iasi", "timisoara"],
        cadastru: ["bucuresti", "chisinau", "cluj", "iasi", "timisoara", "constanta"],
        gis: ["bucuresti", "chisinau", "cluj", "iasi"],
        nivelment: ["bucuresti", "timisoara", "constanta"]
    },

    // -------------------------------------------------------------------------
    // Registru Membri Autorizați UGR
    // -------------------------------------------------------------------------
    membersList: [
        { id: "UGR-0012", name: "Andrei Popescu", judet: "București", auth: "Seria RO-B-F Nr. 0244", categorie: "Categoria A", status: "Activ" },
        { id: "UGR-0038", name: "Ioana Dumitrescu", judet: "București", auth: "Seria RO-B-F Nr. 0812", categorie: "Categoria B", status: "Activ" },
        { id: "UGR-0145", name: "Elena Munteanu", judet: "Cluj", auth: "Seria RO-CJ-F Nr. 1102", categorie: "Categoria A", status: "Activ" },
        { id: "UGR-0220", name: "Radu Ionescu", judet: "București", auth: "Seria RO-B-F Nr. 0519", categorie: "Categoria D", status: "Activ" },
        { id: "UGR-0312", name: "Vasile Lupu", judet: "Iași", auth: "Seria RO-IS-F Nr. 0984", categorie: "Categoria B", status: "Activ" },
        { id: "UGR-0402", name: "Dumitru Crișan", judet: "Timiș", auth: "Seria RO-TM-F Nr. 1290", categorie: "Categoria A", status: "Activ" },
        { id: "UGR-0589", name: "Mariana Marin", judet: "Constanța", auth: "Seria RO-CT-F Nr. 0451", categorie: "Categoria B", status: "Activ" },
        { id: "UGR-0614", name: "Alexandru Moldovan", judet: "Chișinău", auth: "Seria MD-CH-F Nr. 0115", categorie: "Categoria A", status: "Activ" }
    ],

    // -------------------------------------------------------------------------
    // Formulare Oficiale Descărcabile (ugr.ro/cum-devin-membru)
    // -------------------------------------------------------------------------
    documentsList: [
        {
            title: "Cerere de Adeziune — Persoane Fizice",
            desc: "Formular tipizat oficial pentru geodezii și topografii autorizați care solicită înscrierea în Filiala Sector 1 UGR.",
            fileUrl: "https://www.ugr.ro/assets/upload/cerere_inscriere_UGR_persoane_fizice.docx",
            format: "DOCX (Word)",
            badge: "Formular Oficial"
        },
        {
            title: "Cerere de Adeziune — Persoane Juridice",
            desc: "Formular oficial dedicat birourilor de proiectare, societăților comerciale de cadastru, geodezie și fotogrammetrie.",
            fileUrl: "https://www.ugr.ro/assets/upload/cerere_inscriere_UGR_persoane_juridice.docx",
            format: "DOCX (Word)",
            badge: "Companii"
        },
        {
            title: "Statutul Oficial UGR & Regulament de Organizare",
            desc: "Documentul fundamental care reglementează funcționarea asociației, drepturile, îndatoririle și codul deontologic.",
            fileUrl: "https://www.ugr.ro/assets/upload/statut_ugr.pdf",
            format: "PDF (Acrobat)",
            badge: "Statut Juridic"
        }
    ]
};
