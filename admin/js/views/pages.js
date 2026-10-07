/**
 * Pages View ("Editor Pagini Site Public")
 * Manages editable sections for all 5 public pages 1-to-1:
 * - Acasă (pagina_acasa)
 * - Despre noi (pagina_despre)
 * - Evenimente & Media (pagina_evenimente)
 * - Membri & Adeziune (pagina_membri)
 * - FAQ & Contact (pagina_contact)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';
import { writeRows, describeDbError } from '../lib/db.js';

let isDirty = false;
let currentTab = 'acasa';

// Valori implicite fidele 1-la-1 structurii din index.html
export const defaultPagesData = {
    acasa: {
        heroTitle: 'Rețeaua profesioniștilor care măsoară România.',
        heroLead: 'Filiala Sector 1 București a Uniunii Geodezilor din România (UGR Național — asociația profesională fondată în 1990) reunește ingineri geodezi, topografi autorizați și cartografi într-o structură națională unitară dedicată preciziei matematice, integrității profesionale și dialogului legislativ permanent cu ANCPI și OCPI București.',
        heroBtnPrimaryText: 'Înscriere UGR',
        heroBtnSecondaryText: 'SGR Chișinău',
        heroBtnSecondaryLink: '#evenimente',
        spatialBadge: '★ Sector 1 București',
        spatialCoords: 'X: 328733.315 m | Y: 586483.430 m',
        spatialDesc: 'Nod strategic național și pol legislativ al Capitalei: Filiala Sector 1 reprezintă comunitatea geodezilor autorizați din București în parteneriat tehnic-legislativ direct cu ANCPI și OCPI București.',
        missionKicker: 'MISIUNEA NOASTRĂ',
        missionTitle: 'Integritate terestră, viziune spațială.',
        missionParagraph: 'Uniunea Geodezilor din România (UGR) reprezintă autoritatea profesională independentă a inginerilor măsurătorilor terestre. Ne asigurăm că normele profesionale, etica de lucru și reglementările administrative încadrează corect profesia de geodez autorizat, garantând rigurozitate tehnică în toate lucrările de infrastructură națională și cadastru general.',
        stat1Num: '1990',
        stat1Label: 'Înființare oficială',
        stat2Num: 'Județene',
        stat2Label: 'Filiale la nivel național',
        stat3Num: 'FIG & CLGE',
        stat3Label: 'Reprezentare Europeană',
        stat4Num: 'ANCPI',
        stat4Label: 'Colaborare unificată',
        ctaTitle: 'Alătură-te breslei profesionale a geodezilor',
        ctaSubtitle: 'Completează formularul digital în doar 2 minute pentru înregistrare ca membru.',
        ctaBtnText: 'FORMULAR ADERARE UGR →'
    },
    despre: {
        heroKicker: 'Despre noi și Repere',
        heroTitle: 'O istorie marcată de excelență',
        heroIntro: 'Organismele și evoluția completă a Uniunii Geodezilor de la evenimentele fondatoare din 1990 încoace.',
        timeline: [
            { an: '1990', titlu: 'Fondarea Uniunii la București', desc: 'În primăvara anului 1990, un grup entuziast de specialiști reuniți la Facultatea de Geodezie din București decide înființarea unei uniuni profesionale a geodezilor, stabilind bazele organizatorice ale asociației.' },
            { an: 'până în 2004', titlu: 'Perioada de consolidare și extindere', desc: 'Sub președinția lui Săvulescu și conducerea activă, numărul membrilor crește semnificativ, ajungând de la 400 la peste 2.500 de specialiști. Această etapă este marcată de apariția și publicarea regulată a Revistei de Geodezie, Cartografie și Cadastru.' },
            { an: '2014', titlu: 'Aderarea internațională oficială', desc: 'UGR devine un reprezentant de referință la nivel internațional, fiind afiliată activ la Federația Internațională a Geodezilor (FIG) și la Consiliul European al Geodezilor (CLGE), preluând bunele practici tehnice și etice europene.' },
            { an: '2015', titlu: 'Protocolul istoric cu ANCPI', desc: 'Uniunea semnează un protocol de colaborare strânsă cu Agenția Națională de Cadastru și Publicitate Imobiliară. Revista de profil este relansată în limba engleză pentru a oferi vizibilitate cercetării din România.' },
            { an: '2017 - 2018', titlu: 'Proiectul Legii Geodezului', desc: 'Se elaborează și se depune la comisiile de specialitate ale Camerei Deputaților proiectul legislativ istoric privind organizarea și exercitarea profesiei de geodez autorizat în România.' },
            { an: '2022', titlu: 'Alegerea noii conduceri și relansarea SGR', desc: 'Pe 10 iunie 2022 se alege o nouă structură a Biroului Executiv. În același an, evenimentul fanion Săptămâna Geodeziei Românești este relansat cu un succes de răsunet la Brașov.' },
            { an: '2025', titlu: 'Săptămâna Geodeziei Timișoara & Filiala UTM', desc: 'UGR organizează cea de-a VI-a ediție a Săptămânii Geodeziei la Timișoara în parteneriat cu universitățile de profil și marchează înființarea istorică a filialei transfrontaliere la Chișinău (UTM), extinzând comunitatea geodezică.' }
        ],
        objTag: 'Statut și misiune',
        objTitle: 'Obiectivele Uniunii',
        objCallout: 'U.G.R. este o organizație profesională independentă, neguvernamentală și apolitică, cu caracter nelucrativ, persoană juridică pe perioadă nelimitată, cu sediul în Bd. Lacul Tei nr. 124, sector 2, București.',
        obj1: 'Creșterea prestigiului geodeziei și a autorității profesionale a celor ce activează în acest domeniu.',
        obj2: 'Susținerea și apărarea intereselor profesionale și economice ale membrilor săi.',
        obj3: 'Sensibilizarea organelor de decizie și a opiniei publice față de importanța economico-socială a activităților geodezice.',
        obj4: 'Promovarea progresului tehnic și a tehnologiilor moderne, precum și încurajarea cercetării științifice în domeniul geodeziei.',
        obj5: 'Inițierea, propunerea și avizarea de acte legislative și normative privind activitățile geodezice.',
        obj6: 'Propagarea rezultatelor practicii profesionale și a studiilor membrilor Uniunii.',
        obj7: 'Crearea cadrului organizatoric pentru o mai bună cunoaștere reciprocă a membrilor Uniunii.',
        statutTag: 'Document oficial',
        statutTitle: 'Statutul Uniunii Geodezilor din România',
        statutSub: 'Aprobat în data de 24 noiembrie 2017',
        statutBtnText: 'Descarcă statutul (PDF)',
        statutPdfUrl: 'documente/statut_ugr.pdf'
    },
    evenimente: {
        heroKicker: 'Comunicare Oficială & Evenimente',
        heroTitle: 'Articole și Evenimente Tehnice',
        heroSubtitle: 'Păstrează legătura cu modificările legislative din geodezie, congresele internaționale UGR și activitățile Filialei Sector 1 București.',
        axisTag: 'Axă Temporală Geodezică',
        axisTitle: 'Calendarul Evenimentelor & Jaloanelor UGR 2026',
        axisSub: 'Sesiuni operative, consultări instituționale, parteneriate academice și congrese internaționale de referință.',
        events: [
            {
                data: '★ 11–14 NOIEMBRIE 2026',
                scope: 'CONGRES ANUAL NAȚIONAL & INTERNAȚIONAL',
                titlu: 'Săptămâna Geodeziei Românești (SGR) — Chișinău 2026',
                desc: 'Cel mai important congres științific și profesional al anului, găzduit de Universitatea Tehnică a Moldovei (UTM). Reuniune strategică la nivel înalt cu ANCPI, ARFC, FIG și CLGE, sesiuni tehnice de comunicări și expoziție de tehnologii geodezice de vârf.',
                link1: 'https://sgr.ugr.ro/indexr.php',
                link1Text: 'Înregistrare & Detalii Lucrări ↗',
                link2: 'https://docs.google.com/forms/d/e/1FAIpQLSctDTm-Gxuph4yz2fJRiU2JOurBFgzBXriAUY6rbrtem5vrEQ/viewform?usp=header',
                link2Text: 'Înscriere Bursă Studenți SGR Chișinău ↗'
            },
            {
                data: '1 OCTOMBRIE 2026',
                scope: 'ACADEMIC & STUDENȚESC',
                titlu: 'Deschiderea Anului Universitar FIFIM USAMV București',
                desc: 'Consolidarea punții dintre mediul universitar și practica profesională autorizată. Filiala Sector 1 sprijină noile generații de ingineri geodezi prin stagii de practică, mentorat direct și acces la comunitatea tehnică UGR.',
                link1: 'https://www.instagram.com/filiala.sector1.ugr',
                link1Text: 'Vezi galeria foto pe Instagram ↗'
            },
            {
                data: 'IULIE 2026',
                scope: 'FORMARE PROFESIONALĂ CONTINUĂ',
                titlu: 'Gala Premiilor de Excelență MTC & Pachetul de 18 Workshopuri',
                desc: 'Premierea celor mai merituoase lucrări de licență și disertație, însoțită de lansarea unui program intensiv de 18 workshopuri tehnice specializate în tehnologii de scanare laser 3D, fotogrammetrie cu drone și cadastru sistematic în parteneriat cu KarmaCad Store și SphereFix.',
                link1: '#contact',
                link1Text: 'Detalii Program Tehnic & Înscrieri →'
            },
            {
                data: 'IUNIE 2026',
                scope: 'DIALOG INSTITUȚIONAL LOCAL',
                titlu: 'Masă Rotundă Tehnică: Filiala Sector 1 & Conducerea BCPI Sector 1',
                desc: 'Consultare operativă directă privind optimizarea fluxurilor electronice din platforma e-Terra, clarificarea normelor de recepție a documentațiilor cadastrale și scurtarea timpilor de soluționare a dosarelor pentru geodezii autorizați.',
                link1: 'https://www.facebook.com/share/1C3GXdASYW/',
                link1Text: 'Urmărește noutățile pe Facebook ↗'
            },
            {
                data: 'MAI 2026',
                scope: 'REPREZENTARE EUROPEANĂ (CLGE)',
                titlu: 'Adunarea Generală a Asociaților CLGE & Reuniunea de Primăvară',
                desc: 'Reprezentarea oficială a Uniunii Geodezilor din România în Consiliul European al Geodezilor (CLGE). Alinierea standardelor profesionale naționale la bunele practici europene și susținerea mobilității inginerilor geodezi.',
                link1: 'https://www.clge.eu',
                link1Text: 'Portalul Oficial CLGE ↗'
            },
            {
                data: 'MARTIE 2026',
                scope: 'SĂRBĂTOARE PROFESIONALĂ NAȚIONALĂ',
                titlu: 'Eveniment Tehnic Festiv: Ziua Geodezului Român',
                desc: 'Marcarea contribuției esențiale a inginerilor geodezi la marile proiecte de infrastructură națională. Dezbateri consultative privind statutul profesional, digitalizarea cadastrului și proiectul noii Legi a Geodezului.',
                link1: 'https://ugr.ro',
                link1Text: 'Portalul UGR Național ↗'
            }
        ]
    },
    membri: {
        heroKicker: 'Comunitate & Evidență Oficială · STATUT UGR',
        heroTitle: 'Registrul Geodezilor & Ghidul de Aderare',
        heroSubtitle: 'Evidența membrilor acreditați UGR și procedura completă de înscriere conform normelor statutare oficiale de pe ugr.ro/cum-devin-membru.',
        cardKicker: '✨ ADERARE DIGITALĂ RAPIDĂ · SECTOR 1 BUCUREȘTI',
        cardTitle: 'Devino Membru al Filialei Sector 1 București',
        cardDesc: 'Bucură-te de recunoaștere națională, asistență tehnico-juridică la BCPI Sector 1, reduceri la cursurile de perfecționare și vot statutar în adunările generale UGR.',
        cardBtnPrimaryText: 'Lansează Înscrierea Acum',
        cardBtnSecondaryText: 'Ghid ugr.ro ↗',
        cardBtnSecondaryLink: 'https://ugr.ro/cum-devin-membru',
        mechKicker: 'Mecanism Statutar',
        mechanismTitle: 'Cum Funcționează Apartenența: Înscriere Locală cu Voce Națională',
        mechanismDesc: 'Geodezii autorizați și societățile de profil care activează în Sectorul 1 se înscriu direct în Filiala Sector 1 București. Prin această aderare teritorială, membrii dobândesc automat calitatea de membru deplin al Uniunii Geodezilor din România (UGR Național), participă cu drept de vot la Adunările Generale Locale, aleg conducerea filialei și mandatează delegații locali pentru forul național. Totodată, Filiala Sector 1 colectează blocajele tehnice din BCPI Sector 1 și le înaintează către Biroul Executiv (BEX) pentru susținere directă în fața ANCPI.',
        mechP1Title: '1. Înscriere în Filială',
        mechP1Desc: 'Adeziune teritorială la Filiala Sector 1 ➔ calitatea deplină de membru UGR Național.',
        mechP2Title: '2. Vot & Decizie Locală',
        mechP2Desc: 'Alegi reprezentanții filialei și mandatezi delegații oficiali pentru Congresul Național.',
        mechP3Title: '3. Escaladare la BEX / ANCPI',
        mechP3Desc: 'Sinteza spețelor BCPI Sector 1 este susținută de forul central în dialogul legislativ cu ANCPI.',
        stepsTag: 'FLUX STATUTAR',
        stepsTitle: 'Procedura Oficială de Aderare în 4 Pași',
        step1Title: '01. Cerere Adeziune',
        step1Desc: 'Descarcă și completează formularul tipizat oficial pentru persoane fizice sau societăți comerciale.',
        step2Title: '02. Dosar Profesional',
        step2Desc: 'Anexează copia actului de identitate, diplomă de licență (geodezie/topografie) și certificatul ANCPI.',
        step3Title: '03. Plată Cotizație',
        step3Desc: 'Achită taxa de înscriere (50 lei) și cotizația anuală (100 lei activi / 10 lei studenți) prin virament bancar.',
        step4Title: '04. Validare BEX',
        step4Desc: 'Dosarul este validat în ședința Biroului Executiv și se eliberează legitimația oficială cu număr național.',
        feesTag: 'GRILĂ STATUTARĂ UGR',
        feesTitle: 'Categorii de Membri & Grilă Cotizații Anuale',
        feeTitularTax: '50 LEI',
        feeTitularAnnual: '100 LEI / AN',
        feeTitularDesc: 'Drept de vot în Adunarea Generală, reprezentare la OCPI/ANCPI, legitimație oficială UGR, reduceri congrese FIG/CLGE.',
        feeStudentTax: '10 LEI',
        feeStudentAnnual: '10 LEI / AN',
        feeStudentDesc: 'Acces liber la conferințe naționale, stagii de practică la birouri membre, participare SGR Chișinău 2026.',
        feeFirmaTax: '100 LEI',
        feeFirmaAnnual: 'DIFERENȚIATĂ',
        feeFirmaDesc: 'Promovare în Registrul Firmelor Partenere UGR, consultanță juridico-tehnică în proceduri cadastrale complexe.',
        bankName: 'BRD Ag. Tei',
        bankIban: 'RO57 BRDE 426S V810 0757 4450',
        bankPurpose: 'Nume Prenume / CNP / Cotizație Filiala Sector 1'
    },
    contact: {
        heroKicker: 'GHID & ASISTENȚĂ',
        heroTitle: 'Întrebări Frecvente & Secretariat',
        heroSubtitle: 'Răspunsuri oficiale la întrebările membrilor, inginerilor geodezi și studenților privind înscrierea în UGR, spețele la BCPI Sector 1 și activitățile profesionale.',
        triageHeading: 'Unde vă adresați?',
        triageSub: 'Pentru a primi un răspuns rapid, verificați dacă speța dumneavoastră ține de competența teritorială a Filialei Sector 1 sau de nivelul național al Sediului Central UGR.',
        triageLocalTitle: 'Spețe Locale, BCPI Sector 1 & FIFIM',
        triageLocalPhone: '0726 390 774',
        triageLocalEmail: 'filiala.ugr.s1@gmail.com',
        triageCentralTitle: 'Politici Naționale, ANCPI & SGR',
        triageCentralPhone: '0723 587 081',
        triageCentralEmail: 'office@ugr.ro',
        addressAcademic: 'FIFIM — USAMV București, Bulevardul Mărăști nr. 59, Sector 1',
        contactPresidentPhone: '0726 390 774 / 0748 912 263',
        contactSecretaryPhone: '0764 572 874',
        contactCotizatiiPhone: '0722 684 104',
        contactEmailLocal: 'filiala.ugr.s1@gmail.com',
        addressCentral: 'Bulevardul Lacul Tei nr. 124, Sector 2, București',
        contactCentralPhone: '0723 587 081',
        contactCentralEmail: 'office@ugr.ro',
        formTitle: 'Trimite un Mesaj Secretariatului',
        formDesc: 'Pentru întrebări, spețe profesionale la nivel de Sector 1 sau informații privind înscrierea în asociație.'
    }
};

export async function loadPagesData() {
    const feedback = document.getElementById('pages-feedback');
    if (feedback) clearBannerFeedback(feedback);

    try {
        const { data, error } = await client
            .from('setari')
            .select('cheie, valoare')
            .in('cheie', ['pagina_acasa', 'pagina_despre', 'pagina_evenimente', 'pagina_membri', 'pagina_contact']);

        if (error) throw error;

        state.pagesData = {
            acasa: { ...defaultPagesData.acasa },
            despre: { ...defaultPagesData.despre },
            evenimente: { ...defaultPagesData.evenimente },
            membri: { ...defaultPagesData.membri },
            contact: { ...defaultPagesData.contact }
        };

        if (data && Array.isArray(data)) {
            data.forEach(item => {
                const k = item.cheie.replace('pagina_', '');
                if (state.pagesData[k]) {
                    state.pagesData[k] = { ...state.pagesData[k], ...(item.valoare || {}) };
                }
            });
        }

        renderPagesForm();
        setDirtyState(false);
    } catch (err) {
        if (feedback) setBannerFeedback(feedback, `Eroare la preluarea datelor paginilor: ${err.message}`, 'error');
        showToast('Nu s-au putut prelua paginile din Supabase.', 'error');
    }
}

export function switchPageTab(tabKey) {
    currentTab = tabKey;
    state.pagesActiveTab = tabKey;

    // Actualizare butoane tab
    document.querySelectorAll('.pages-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-page-tab') === tabKey);
    });

    // Actualizare panouri tab
    document.querySelectorAll('.page-tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-page-${tabKey}`);
    });

    // Actualizare buton previzualizare site extern
    const btnPreviewSite = document.getElementById('btn-pages-preview-site');
    if (btnPreviewSite) {
        const hash = (tabKey === 'acasa') ? '' : `#${tabKey}`;
        btnPreviewSite.href = `../index.html${hash}`;
    }
}

export function renderPagesForm() {
    const d = state.pagesData || defaultPagesData;
    const isReadOnly = state.adminRecord?.rol === 'viewer';

    // 1. Acasă
    const a = d.acasa || defaultPagesData.acasa;
    setVal('page-acasa-hero-title', a.heroTitle);
    setVal('page-acasa-hero-lead', a.heroLead);
    setVal('page-acasa-hero-btn-primary', a.heroBtnPrimaryText);
    setVal('page-acasa-hero-btn-secondary', a.heroBtnSecondaryText);
    setVal('page-acasa-hero-btn-secondary-link', a.heroBtnSecondaryLink);
    setVal('page-acasa-spatial-badge', a.spatialBadge);
    setVal('page-acasa-spatial-coords', a.spatialCoords);
    setVal('page-acasa-spatial-desc', a.spatialDesc);
    setVal('page-acasa-mission-kicker', a.missionKicker);
    setVal('page-acasa-mission-title', a.missionTitle);
    setVal('page-acasa-mission-paragraph', a.missionParagraph);
    setVal('page-acasa-stat1-num', a.stat1Num);
    setVal('page-acasa-stat1-label', a.stat1Label);
    setVal('page-acasa-stat2-num', a.stat2Num);
    setVal('page-acasa-stat2-label', a.stat2Label);
    setVal('page-acasa-stat3-num', a.stat3Num);
    setVal('page-acasa-stat3-label', a.stat3Label);
    setVal('page-acasa-stat4-num', a.stat4Num);
    setVal('page-acasa-stat4-label', a.stat4Label);
    setVal('page-acasa-cta-title', a.ctaTitle);
    setVal('page-acasa-cta-subtitle', a.ctaSubtitle);
    setVal('page-acasa-cta-btn', a.ctaBtnText);

    // 2. Despre Noi
    const desp = d.despre || defaultPagesData.despre;
    setVal('page-despre-hero-kicker', desp.heroKicker);
    setVal('page-despre-hero-title', desp.heroTitle);
    setVal('page-despre-hero-intro', desp.heroIntro);
    renderTimelineFields(desp.timeline || defaultPagesData.despre.timeline);
    setVal('page-despre-obj-tag', desp.objTag);
    setVal('page-despre-obj-title', desp.objTitle);
    setVal('page-despre-obj-callout', desp.objCallout);
    setVal('page-despre-obj-1', desp.obj1);
    setVal('page-despre-obj-2', desp.obj2);
    setVal('page-despre-obj-3', desp.obj3);
    setVal('page-despre-obj-4', desp.obj4);
    setVal('page-despre-obj-5', desp.obj5);
    setVal('page-despre-obj-6', desp.obj6);
    setVal('page-despre-obj-7', desp.obj7);
    setVal('page-despre-statut-tag', desp.statutTag);
    setVal('page-despre-statut-title', desp.statutTitle);
    setVal('page-despre-statut-sub', desp.statutSub);
    setVal('page-despre-statut-btn', desp.statutBtnText);
    setVal('page-despre-statut-pdf', desp.statutPdfUrl);

    // 3. Evenimente & Media
    const ev = d.evenimente || defaultPagesData.evenimente;
    setVal('page-ev-hero-kicker', ev.heroKicker);
    setVal('page-ev-hero-title', ev.heroTitle);
    setVal('page-ev-hero-subtitle', ev.heroSubtitle);
    setVal('page-ev-axis-tag', ev.axisTag);
    setVal('page-ev-axis-title', ev.axisTitle);
    setVal('page-ev-axis-sub', ev.axisSub);
    renderEventsNodesFields(ev.events || defaultPagesData.evenimente.events);

    // 4. Membri & Adeziune
    const m = d.membri || defaultPagesData.membri;
    setVal('page-membri-hero-kicker', m.heroKicker);
    setVal('page-membri-hero-title', m.heroTitle);
    setVal('page-membri-hero-subtitle', m.heroSubtitle);
    setVal('page-membri-card-kicker', m.cardKicker);
    setVal('page-membri-card-title', m.cardTitle);
    setVal('page-membri-card-desc', m.cardDesc);
    setVal('page-membri-card-btn-primary', m.cardBtnPrimaryText);
    setVal('page-membri-card-btn-secondary', m.cardBtnSecondaryText);
    setVal('page-membri-card-btn-secondary-link', m.cardBtnSecondaryLink);
    setVal('page-membri-mech-kicker', m.mechKicker);
    setVal('page-membri-mech-title', m.mechanismTitle);
    setVal('page-membri-mech-desc', m.mechanismDesc);
    setVal('page-membri-mech-p1-title', m.mechP1Title);
    setVal('page-membri-mech-p1-desc', m.mechP1Desc);
    setVal('page-membri-mech-p2-title', m.mechP2Title);
    setVal('page-membri-mech-p2-desc', m.mechP2Desc);
    setVal('page-membri-mech-p3-title', m.mechP3Title);
    setVal('page-membri-mech-p3-desc', m.mechP3Desc);
    setVal('page-membri-steps-tag', m.stepsTag);
    setVal('page-membri-steps-title', m.stepsTitle);
    setVal('page-membri-step1-title', m.step1Title);
    setVal('page-membri-step1-desc', m.step1Desc);
    setVal('page-membri-step2-title', m.step2Title);
    setVal('page-membri-step2-desc', m.step2Desc);
    setVal('page-membri-step3-title', m.step3Title);
    setVal('page-membri-step3-desc', m.step3Desc);
    setVal('page-membri-step4-title', m.step4Title);
    setVal('page-membri-step4-desc', m.step4Desc);
    setVal('page-membri-fees-tag', m.feesTag);
    setVal('page-membri-fees-title', m.feesTitle);
    setVal('page-membri-fee-titular-tax', m.feeTitularTax);
    setVal('page-membri-fee-titular-annual', m.feeTitularAnnual);
    setVal('page-membri-fee-titular-desc', m.feeTitularDesc);
    setVal('page-membri-fee-student-tax', m.feeStudentTax);
    setVal('page-membri-fee-student-annual', m.feeStudentAnnual);
    setVal('page-membri-fee-student-desc', m.feeStudentDesc);
    setVal('page-membri-fee-firma-tax', m.feeFirmaTax);
    setVal('page-membri-fee-firma-annual', m.feeFirmaAnnual);
    setVal('page-membri-fee-firma-desc', m.feeFirmaDesc);
    setVal('page-membri-bank-name', m.bankName);
    setVal('page-membri-bank-iban', m.bankIban);
    setVal('page-membri-bank-purpose', m.bankPurpose);

    // 5. FAQ & Contact
    const c = d.contact || defaultPagesData.contact;
    setVal('page-contact-hero-kicker', c.heroKicker);
    setVal('page-contact-hero-title', c.heroTitle);
    setVal('page-contact-hero-subtitle', c.heroSubtitle);
    setVal('page-contact-triage-heading', c.triageHeading);
    setVal('page-contact-triage-sub', c.triageSub);
    setVal('page-contact-triage-local-title', c.triageLocalTitle);
    setVal('page-contact-triage-local-phone', c.triageLocalPhone);
    setVal('page-contact-triage-local-email', c.triageLocalEmail);
    setVal('page-contact-triage-central-title', c.triageCentralTitle);
    setVal('page-contact-triage-central-phone', c.triageCentralPhone);
    setVal('page-contact-triage-central-email', c.triageCentralEmail);
    setVal('page-contact-addr-academic', c.addressAcademic);
    setVal('page-contact-email-local', c.contactEmailLocal);
    setVal('page-contact-phone-pres', c.contactPresidentPhone);
    setVal('page-contact-phone-sec', c.contactSecretaryPhone);
    setVal('page-contact-phone-cot', c.contactCotizatiiPhone);
    setVal('page-contact-addr-central', c.addressCentral);
    setVal('page-contact-central-phone', c.contactCentralPhone);
    setVal('page-contact-central-email', c.contactCentralEmail);
    setVal('page-contact-form-title', c.formTitle);
    setVal('page-contact-form-desc', c.formDesc);

    // Read-only guard
    const allInputs = document.querySelectorAll('#view-pages input, #view-pages textarea');
    allInputs.forEach(input => {
        if (isReadOnly) input.setAttribute('disabled', 'true');
        else input.removeAttribute('disabled');
    });
}

function renderTimelineFields(timeline) {
    const container = document.getElementById('pages-despre-timeline-container');
    if (!container) return;
    clearElement(container);

    timeline.forEach((item, index) => {
        const itemCard = el('div', { class: 'timeline-edit-card', style: 'background: rgba(3, 11, 23, 0.6); border: 1px solid rgba(0, 229, 255, 0.15); border-radius: 8px; padding: 14px; margin-bottom: 12px;' }, [
            el('div', { class: 'form-grid-2col', style: 'margin-bottom: 8px;' }, [
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, [`An / Perioadă #${index + 1}`]),
                    el('input', { type: 'text', class: 'form-input page-timeline-an', 'data-idx': index, value: item.an || '' })
                ]),
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, ['Titlu Jalon']),
                    el('input', { type: 'text', class: 'form-input page-timeline-titlu', 'data-idx': index, value: item.titlu || '' })
                ])
            ]),
            el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                el('label', { class: 'form-label' }, ['Descriere Jalon']),
                el('textarea', { class: 'form-textarea page-timeline-desc', 'data-idx': index, style: 'min-height: 60px;' }, [item.desc || ''])
            ])
        ]);
        container.appendChild(itemCard);
    });
}

function renderEventsNodesFields(events) {
    const container = document.getElementById('pages-ev-nodes-container');
    if (!container) return;
    clearElement(container);

    events.forEach((evItem, index) => {
        const card = el('div', { class: 'event-node-edit-card', style: 'background: rgba(3, 11, 23, 0.6); border: 1px solid rgba(0, 229, 255, 0.15); border-radius: 8px; padding: 14px; margin-bottom: 12px;' }, [
            el('div', { class: 'form-grid-3col', style: 'margin-bottom: 8px;' }, [
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, [`Dată Jalon #${index + 1}`]),
                    el('input', { type: 'text', class: 'form-input page-ev-data', 'data-idx': index, value: evItem.data || '' })
                ]),
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, ['Categorie / Domeniu (Scope)']),
                    el('input', { type: 'text', class: 'form-input page-ev-scope', 'data-idx': index, value: evItem.scope || '' })
                ]),
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, ['Titlu Eveniment']),
                    el('input', { type: 'text', class: 'form-input page-ev-titlu', 'data-idx': index, value: evItem.titlu || '' })
                ])
            ]),
            el('div', { class: 'form-group', style: 'margin-bottom: 8px;' }, [
                el('label', { class: 'form-label' }, ['Descriere Eveniment']),
                el('textarea', { class: 'form-textarea page-ev-desc', 'data-idx': index, style: 'min-height: 60px;' }, [evItem.desc || ''])
            ]),
            el('div', { class: 'form-grid-2col', style: 'margin-bottom: 0;' }, [
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, ['Link Buton 1']),
                    el('input', { type: 'text', class: 'form-input page-ev-link1', 'data-idx': index, value: evItem.link1 || '' })
                ]),
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, ['Text Buton 1']),
                    el('input', { type: 'text', class: 'form-input page-ev-link1text', 'data-idx': index, value: evItem.link1Text || '' })
                ])
            ])
        ]);
        container.appendChild(card);
    });
}

function setVal(id, val) {
    const elTarget = document.getElementById(id);
    if (elTarget) elTarget.value = val !== undefined ? val : '';
}

function getVal(id) {
    const elTarget = document.getElementById(id);
    return elTarget ? elTarget.value.trim() : '';
}

export function setDirtyState(dirty) {
    isDirty = dirty;
    state.pagesDirty = dirty;
    const stickyBar = document.getElementById('pages-sticky-bar');
    if (stickyBar) {
        if (dirty) stickyBar.classList.add('active');
        else stickyBar.classList.remove('active');
    }
}

export function gatherCurrentPagesPayload(tabKey) {
    if (tabKey === 'acasa') {
        return {
            heroTitle: getVal('page-acasa-hero-title'),
            heroLead: getVal('page-acasa-hero-lead'),
            heroBtnPrimaryText: getVal('page-acasa-hero-btn-primary'),
            heroBtnSecondaryText: getVal('page-acasa-hero-btn-secondary'),
            heroBtnSecondaryLink: getVal('page-acasa-hero-btn-secondary-link'),
            spatialBadge: getVal('page-acasa-spatial-badge'),
            spatialCoords: getVal('page-acasa-spatial-coords'),
            spatialDesc: getVal('page-acasa-spatial-desc'),
            missionKicker: getVal('page-acasa-mission-kicker'),
            missionTitle: getVal('page-acasa-mission-title'),
            missionParagraph: getVal('page-acasa-mission-paragraph'),
            stat1Num: getVal('page-acasa-stat1-num'),
            stat1Label: getVal('page-acasa-stat1-label'),
            stat2Num: getVal('page-acasa-stat2-num'),
            stat2Label: getVal('page-acasa-stat2-label'),
            stat3Num: getVal('page-acasa-stat3-num'),
            stat3Label: getVal('page-acasa-stat3-label'),
            stat4Num: getVal('page-acasa-stat4-num'),
            stat4Label: getVal('page-acasa-stat4-label'),
            ctaTitle: getVal('page-acasa-cta-title'),
            ctaSubtitle: getVal('page-acasa-cta-subtitle'),
            ctaBtnText: getVal('page-acasa-cta-btn')
        };
    } else if (tabKey === 'despre') {
        const timeline = [];
        document.querySelectorAll('.timeline-edit-card').forEach((card) => {
            const an = card.querySelector('.page-timeline-an')?.value.trim() || '';
            const titlu = card.querySelector('.page-timeline-titlu')?.value.trim() || '';
            const desc = card.querySelector('.page-timeline-desc')?.value.trim() || '';
            timeline.push({ an, titlu, desc });
        });

        return {
            heroKicker: getVal('page-despre-hero-kicker'),
            heroTitle: getVal('page-despre-hero-title'),
            heroIntro: getVal('page-despre-hero-intro'),
            timeline,
            objTag: getVal('page-despre-obj-tag'),
            objTitle: getVal('page-despre-obj-title'),
            objCallout: getVal('page-despre-obj-callout'),
            obj1: getVal('page-despre-obj-1'),
            obj2: getVal('page-despre-obj-2'),
            obj3: getVal('page-despre-obj-3'),
            obj4: getVal('page-despre-obj-4'),
            obj5: getVal('page-despre-obj-5'),
            obj6: getVal('page-despre-obj-6'),
            obj7: getVal('page-despre-obj-7'),
            statutTag: getVal('page-despre-statut-tag'),
            statutTitle: getVal('page-despre-statut-title'),
            statutSub: getVal('page-despre-statut-sub'),
            statutBtnText: getVal('page-despre-statut-btn'),
            statutPdfUrl: getVal('page-despre-statut-pdf')
        };
    } else if (tabKey === 'evenimente') {
        const events = [];
        document.querySelectorAll('.event-node-edit-card').forEach(card => {
            const data = card.querySelector('.page-ev-data')?.value.trim() || '';
            const scope = card.querySelector('.page-ev-scope')?.value.trim() || '';
            const titlu = card.querySelector('.page-ev-titlu')?.value.trim() || '';
            const desc = card.querySelector('.page-ev-desc')?.value.trim() || '';
            const link1 = card.querySelector('.page-ev-link1')?.value.trim() || '';
            const link1Text = card.querySelector('.page-ev-link1text')?.value.trim() || '';
            events.push({ data, scope, titlu, desc, link1, link1Text });
        });

        return {
            heroKicker: getVal('page-ev-hero-kicker'),
            heroTitle: getVal('page-ev-hero-title'),
            heroSubtitle: getVal('page-ev-hero-subtitle'),
            axisTag: getVal('page-ev-axis-tag'),
            axisTitle: getVal('page-ev-axis-title'),
            axisSub: getVal('page-ev-axis-sub'),
            events
        };
    } else if (tabKey === 'membri') {
        return {
            heroKicker: getVal('page-membri-hero-kicker'),
            heroTitle: getVal('page-membri-hero-title'),
            heroSubtitle: getVal('page-membri-hero-subtitle'),
            cardKicker: getVal('page-membri-card-kicker'),
            cardTitle: getVal('page-membri-card-title'),
            cardDesc: getVal('page-membri-card-desc'),
            cardBtnPrimaryText: getVal('page-membri-card-btn-primary'),
            cardBtnSecondaryText: getVal('page-membri-card-btn-secondary'),
            cardBtnSecondaryLink: getVal('page-membri-card-btn-secondary-link'),
            mechKicker: getVal('page-membri-mech-kicker'),
            mechanismTitle: getVal('page-membri-mech-title'),
            mechanismDesc: getVal('page-membri-mech-desc'),
            mechP1Title: getVal('page-membri-mech-p1-title'),
            mechP1Desc: getVal('page-membri-mech-p1-desc'),
            mechP2Title: getVal('page-membri-mech-p2-title'),
            mechP2Desc: getVal('page-membri-mech-p2-desc'),
            mechP3Title: getVal('page-membri-mech-p3-title'),
            mechP3Desc: getVal('page-membri-mech-p3-desc'),
            stepsTag: getVal('page-membri-steps-tag'),
            stepsTitle: getVal('page-membri-steps-title'),
            step1Title: getVal('page-membri-step1-title'),
            step1Desc: getVal('page-membri-step1-desc'),
            step2Title: getVal('page-membri-step2-title'),
            step2Desc: getVal('page-membri-step2-desc'),
            step3Title: getVal('page-membri-step3-title'),
            step3Desc: getVal('page-membri-step3-desc'),
            step4Title: getVal('page-membri-step4-title'),
            step4Desc: getVal('page-membri-step4-desc'),
            feesTag: getVal('page-membri-fees-tag'),
            feesTitle: getVal('page-membri-fees-title'),
            feeTitularTax: getVal('page-membri-fee-titular-tax'),
            feeTitularAnnual: getVal('page-membri-fee-titular-annual'),
            feeTitularDesc: getVal('page-membri-fee-titular-desc'),
            feeStudentTax: getVal('page-membri-fee-student-tax'),
            feeStudentAnnual: getVal('page-membri-fee-student-annual'),
            feeStudentDesc: getVal('page-membri-fee-student-desc'),
            feeFirmaTax: getVal('page-membri-fee-firma-tax'),
            feeFirmaAnnual: getVal('page-membri-fee-firma-annual'),
            feeFirmaDesc: getVal('page-membri-fee-firma-desc'),
            bankName: getVal('page-membri-bank-name'),
            bankIban: getVal('page-membri-bank-iban'),
            bankPurpose: getVal('page-membri-bank-purpose')
        };
    } else if (tabKey === 'contact') {
        return {
            heroKicker: getVal('page-contact-hero-kicker'),
            heroTitle: getVal('page-contact-hero-title'),
            heroSubtitle: getVal('page-contact-hero-subtitle'),
            triageHeading: getVal('page-contact-triage-heading'),
            triageSub: getVal('page-contact-triage-sub'),
            triageLocalTitle: getVal('page-contact-triage-local-title'),
            triageLocalPhone: getVal('page-contact-triage-local-phone'),
            triageLocalEmail: getVal('page-contact-triage-local-email'),
            triageCentralTitle: getVal('page-contact-triage-central-title'),
            triageCentralPhone: getVal('page-contact-triage-central-phone'),
            triageCentralEmail: getVal('page-contact-triage-central-email'),
            addressAcademic: getVal('page-contact-addr-academic'),
            contactEmailLocal: getVal('page-contact-email-local'),
            contactPresidentPhone: getVal('page-contact-phone-pres'),
            contactSecretaryPhone: getVal('page-contact-phone-sec'),
            contactCotizatiiPhone: getVal('page-contact-phone-cot'),
            addressCentral: getVal('page-contact-addr-central'),
            contactCentralPhone: getVal('page-contact-central-phone'),
            contactCentralEmail: getVal('page-contact-central-email'),
            formTitle: getVal('page-contact-form-title'),
            formDesc: getVal('page-contact-form-desc')
        };
    }
    return {};
}

export async function handleSaveCurrentPage() {
    if (state.adminRecord?.rol === 'viewer') {
        showToast('Rolul de vizitator nu are permisiuni de editare conținut.', 'error');
        return;
    }

    const payload = gatherCurrentPagesPayload(currentTab);
    const cheie = `pagina_${currentTab}`;

    try {
        // T-J2: .select('cheie') după upsert ca să putem confirma că rândul a fost scris
        const { error } = await writeRows(
            client
                .from('setari')
                .upsert({
                    cheie,
                    valoare: payload,
                    actualizat_la: new Date().toISOString()
                }, { onConflict: 'cheie' })
                .select('cheie'),
            { context: `salvarea paginii „${getTabLabel(currentTab)}”` }
        );

        if (error) throw error;

        // Actualizare cache local
        if (!state.pagesData) state.pagesData = {};
        state.pagesData[currentTab] = payload;

        setDirtyState(false);
        showToast(`Pagina „${getTabLabel(currentTab)}” a fost salvată cu succes!`, 'success');
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la salvare.'), 'error');
    }
}

export async function handleSaveAllPages() {
    if (state.adminRecord?.rol === 'viewer') {
        showToast('Rolul de vizitator nu are permisiuni de editare conținut.', 'error');
        return;
    }

    try {
        const tabs = ['acasa', 'despre', 'evenimente', 'membri', 'contact'];
        const updates = tabs.map(tab => ({
            cheie: `pagina_${tab}`,
            valoare: gatherCurrentPagesPayload(tab),
            actualizat_la: new Date().toISOString()
        }));

        const { error } = await writeRows(
            client
                .from('setari')
                .upsert(updates, { onConflict: 'cheie' })
                .select('cheie'),
            { context: 'salvarea tuturor paginilor', expect: updates.length }
        );

        if (error) throw error;

        tabs.forEach(tab => {
            if (!state.pagesData) state.pagesData = {};
            state.pagesData[tab] = updates.find(u => u.cheie === `pagina_${tab}`).valoare;
        });

        setDirtyState(false);
        showToast('Toate cele 5 pagini au fost sincronizate cu succes în Supabase!', 'success');
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la salvare.'), 'error');
    }
}

function getTabLabel(tabKey) {
    const labels = {
        acasa: 'Acasă',
        despre: 'Despre Noi',
        evenimente: 'Evenimente & Media',
        membri: 'Membri & Adeziune',
        contact: 'FAQ & Contact'
    };
    return labels[tabKey] || tabKey;
}

export function initPagesView() {
    // 1. Ascultători tab-uri
    document.querySelectorAll('.pages-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-page-tab');
            if (tab) switchPageTab(tab);
        });
    });

    // 2. Ascultători dirty-state pe input-uri
    const container = document.getElementById('view-pages');
    if (container) {
        container.addEventListener('input', () => {
            setDirtyState(true);
        });
    }

    // 3. Ascultători sticky save bar
    const btnSavePage = document.getElementById('btn-pages-save-current');
    const btnSaveAll = document.getElementById('btn-pages-save-all');
    const btnCancel = document.getElementById('btn-pages-cancel-changes');

    if (btnSavePage) btnSavePage.addEventListener('click', handleSaveCurrentPage);
    if (btnSaveAll) btnSaveAll.addEventListener('click', handleSaveAllPages);
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            renderPagesForm();
            setDirtyState(false);
            showToast('Modificările nesalvate au fost anulate.', 'info');
        });
    }
}
