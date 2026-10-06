/**
 * Pages View ("Editor Pagini Site Public")
 * Manages editable sections for all 5 public pages:
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

let isDirty = false;
let currentTab = 'acasa';

// Valori implicite fidele structurii din index.html
export const defaultPagesData = {
    acasa: {
        heroKicker: 'FILIALA SECTOR 1 BUCUREȘTI',
        heroTitle: 'Rețeaua profesioniștilor care măsoară viitorul',
        heroSubtitle: 'Punctul de convergență pentru inginerii geodezi, experții în cadastru și tinerii specialiști din București. Apartenență profesională, colaborare instituțională cu BCPI Sector 1 și excelență tehnică.',
        heroBtnPrimaryText: 'Lansează Înscrierea',
        heroBtnSecondaryText: 'Săptămâna Geodeziei Chișinău 2026 ↗',
        heroBtnSecondaryLink: '#evenimente',
        mapTitle: 'Infrastructura Geodezică & Rețeaua Tehnică Sector 1',
        mapDesc: 'Vizualizează rețeaua geodezică, jaloanele administrative și punctele de sprijin din Sectorul 1 București.',
        pillar1Title: 'Standarde & Etică',
        pillar1Desc: 'Promovarea bunelor practici și a integrității profesionale în lucrările de geodezie și cadastru.',
        pillar2Title: 'Reprezentare Locală',
        pillar2Desc: 'Dialog permanent cu BCPI Sector 1, ANCPI și instituțiile administrative pentru optimizarea fluxurilor tehnice.',
        pillar3Title: 'Tehnologie & Formare',
        pillar3Desc: 'Acces la conferințe internaționale (FIG, CLGE), workshop-uri GNSS/UAV și ghiduri de specialitate.'
    },
    despre: {
        heroKicker: 'DESPRE UNIUNE',
        heroTitle: 'O istorie marcată de excelență',
        heroIntro: 'Uniunea Geodezilor din România (UGR) este asociația profesională națională ce reunește specialiștii din domeniul geodeziei, cartografiei, cadastrului și teledetecției. Filiala Sector 1 concentrează expertiza academică și aplicativă din Capitală.',
        timeline: [
            { an: '1990', titlu: 'Fondarea Uniunii la București', desc: 'La 23 februarie 1990, un grup de 46 de ingineri geodezi pun bazele UGR, continuând tradiția Societății Geodezilor din România fondată în 1929.' },
            { an: '1994', titlu: 'Perioada de consolidare și extindere', desc: 'Organizarea primelor congrese tehnice naționale și crearea filialelor județene, integrând specialiștii din proiectare și cadastru.' },
            { an: '2004', titlu: 'Aderarea internațională oficială', desc: 'UGR devine membru cu drepturi depline al Federației Internaționale a Geodezilor (FIG) și al Consiliului European al Geodezilor (CLGE).' },
            { an: '2011', titlu: 'Protocolul istoric cu ANCPI', desc: 'Semnarea parteneriatului instituțional strategic cu Agenția Națională de Cadastru și Publicitate Imobiliară pentru perfecționare profesională.' },
            { an: '2018', titlu: 'Proiectul Legii Geodezului', desc: 'Inițierea cadrului legislativ național privind exercitarea profesiei de geodez și înființarea Ordinului Geodezilor din România.' },
            { an: '2023', titlu: 'Alegerea noii conduceri și relansarea SGR', desc: 'Alegerea Biroului Executiv condus de Ing. Mircea Afrăsinei și relansarea formatului de amploare Săptămâna Geodeziei Românești.' },
            { an: '2024', titlu: 'Săptămâna Geodeziei Timișoara & Filiala UTM', desc: 'Succesul răsunător al SGR Timișoara și extinderea reprezentării prin crearea Filialei Universității Tehnice a Moldovei la Chișinău.' }
        ],
        objective1Title: 'Cadastru Sistematic Riguros',
        objective1Desc: 'Sprijinirea calității tehnice în înregistrările sistematice și sporadice de cadastru.',
        objective2Title: 'Digitalizare & Tehnologii Noi',
        objective2Desc: 'Integrarea tehnologiilor GNSS moderne, scanare laser 3D, fotogrammetrie UAV și modelare GIS.',
        objective3Title: 'Dialog Instituțional BCPI',
        objective3Desc: 'Mese rotunde periodice cu Biroul de Cadastru și Publicitate Imobiliară Sector 1.'
    },
    evenimente: {
        heroKicker: 'ACTUALITATE & CALENDAR',
        heroTitle: 'Articole și Evenimente Tehnice',
        heroSubtitle: 'Conferințe de specialitate, parteneriate universitare și acțiuni profesionale ale Filialei Sector 1 București și UGR Central.',
        events: [
            {
                titlu: 'Săptămâna Geodeziei Românești (SGR) — Chișinău 2026',
                data: '11 noiembrie 2026',
                locatie: 'Chișinău, Rep. Moldova',
                desc: 'Cea mai importantă manifestare profesională a geodezilor români, găzduită în parteneriat cu Universitatea Tehnică a Moldovei.',
                link1: 'https://sgr.ugr.ro/indexr.php',
                link1Text: 'Portal Oficial SGR Chișinău ↗',
                link2: 'https://docs.google.com/forms/d/e/1FAIpQLSctDTm-Gxuph4yz2fJRiU2JOurBFgzBXriAUY6rbrtem5vrEQ/viewform',
                link2Text: 'Formular Înregistrare Rezumat ↗'
            },
            {
                titlu: 'Deschiderea Anului Universitar FIFIM USAMV București',
                data: '30 septembrie 2024',
                locatie: 'FIFIM USAMV București',
                desc: 'Prezența conducerii Filialei Sector 1 alături de studenții geodezi în Sala de Consiliu a FIFIM.',
                link1: 'https://www.instagram.com/filiala.sector1.ugr',
                link1Text: 'Vezi Galerie Instagram ↗'
            },
            {
                titlu: 'Gala Premiilor de Excelență MTC & Pachetul de 18 Workshopuri',
                data: '15 octombrie 2024',
                locatie: 'Aula Magna USAMV',
                desc: 'Recunoașterea meritelor specialiștilor în măsurători terestre și cadastru alături de 18 sesiuni aplicative.',
                link1: '#contact',
                link1Text: 'Detalii Program Tehnic & Înscrieri ↗'
            },
            {
                titlu: 'Masă Rotundă Tehnică: Filiala Sector 1 & Conducerea BCPI Sector 1',
                data: '08 noiembrie 2024',
                locatie: 'Sediul BCPI Sector 1',
                desc: 'Ședință de lucru dedicată accelerării recepțiilor tehnice și clarificării fluxurilor digitale.',
                link1: 'https://www.facebook.com/share/1C3GXdASYW/',
                link1Text: 'Comunicat Oficial Facebook ↗'
            }
        ]
    },
    membri: {
        heroKicker: 'COMUNITATE PROFESIONALĂ',
        heroTitle: 'Registrul Geodezilor & Ghidul de Aderare',
        cardTitle: 'Devino Membru al Filialei Sector 1 București',
        cardDesc: 'Alătură-te rețelei noastre profesionale. Beneficiezi de asistență tehnică, consultare instituțională și reprezentare oficială.',
        cardBtnPrimaryText: 'Lansează Înscrierea Online',
        cardBtnSecondaryText: 'Ghid Oficial Aderare UGR ↗',
        cardBtnSecondaryLink: 'https://ugr.ro/cum-devin-membru',
        mechanismTitle: 'Cum Funcționează Apartenența: Înscriere Locală cu Reprezentare Națională',
        mechanismDesc: 'Conform Statutului UGR, adeziunea la Filiala Sector 1 conferă automat calitatea de membru al Uniunii Geodezilor din România, oferind dublă recunoaștere: locală și națională.',
        step1Title: '1. Transmiterea Cererii',
        step1Desc: 'Completezi formularul online securizat de adeziune sau transmiți cererea tip la secretariatul filialei.',
        step2Title: '2. Verificarea Dosarului',
        step2Desc: 'Comisia tehnică a filialei verifică actele de studii și certificatul de autorizare ANCPI.',
        step3Title: '3. Achitarea Cotizației',
        step3Desc: 'Achitarea taxei de înscriere și a cotizației anuale statutare în contul bancar al filialei.',
        step4Title: '4. Validarea Biroului Executiv',
        step4Desc: 'Validarea deciziei în Consiliul de Conducere și emiterea certificatului de membru.',
        feeFizica: '100 RON / an (Specialiști autorizați ANCPI categoriile A, B, C, D)',
        feeStudent: '10 RON / an (Studenți la facultățile de profil: FIFIM, UTCB etc.)',
        feeJuridica: '500 - 2.000 RON / an (Societăți comerciale active în domeniu)'
    },
    contact: {
        heroKicker: 'GHID & ASISTENȚĂ',
        heroTitle: 'Întrebări Frecvente & Secretariat',
        heroSubtitle: 'Răspunsuri la cele mai comune spețe profesionale și datele de contact oficiale ale Filialei Sector 1 București.',
        triageLocalTitle: 'Spețe Locale, BCPI Sector 1 & FIFIM',
        triageLocalDesc: 'Pentru probleme legate de dosare tehnice în Sectorul 1, relația cu BCPI Sector 1, întâlniri la FIFIM USAMV și adeziuni locale.',
        triageLocalPhone: '0726 390 774',
        triageLocalEmail: 'filiala.ugr.s1@gmail.com',
        triageCentralTitle: 'Politici Naționale, ANCPI & SGR',
        triageCentralDesc: 'Pentru reprezentare internațională FIG/CLGE, organizarea SGR 2026 Chișinău și propuneri de acte normative.',
        triageCentralPhone: '0723 587 081',
        triageCentralEmail: 'office@ugr.ro',
        addressAcademic: 'Bulevardul Mărăști nr. 59, Sala de Consiliu, Sector 1, București (FIFIM – USAMV)',
        addressCentral: 'Bulevardul Lacul Tei nr. 124, Sector 2, București',
        contactPresidentPhone: '0726 390 774 / 0748 912 263',
        contactSecretaryPhone: '0764 572 874',
        contactCotizatiiPhone: '0722 684 104',
        bankName: 'BRD — Groupe Société Générale (Ag. Tei, Sector 2)',
        bankIban: 'RO57 BRDE 426S V810 0757 4450',
        bankPurpose: 'Cotizație UGR Filiala Sector 1 / Nume și CNP',
        formTitle: 'Trimite un Mesaj Secretariatului',
        formDesc: 'Ai o speță tehnică sau dorești informații despre activitatea filialei? Completează formularul de mai jos.'
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
    setVal('page-acasa-hero-kicker', a.heroKicker);
    setVal('page-acasa-hero-title', a.heroTitle);
    setVal('page-acasa-hero-subtitle', a.heroSubtitle);
    setVal('page-acasa-hero-btn-primary', a.heroBtnPrimaryText);
    setVal('page-acasa-hero-btn-secondary', a.heroBtnSecondaryText);
    setVal('page-acasa-hero-btn-secondary-link', a.heroBtnSecondaryLink);
    setVal('page-acasa-map-title', a.mapTitle);
    setVal('page-acasa-map-desc', a.mapDesc);
    setVal('page-acasa-pillar1-title', a.pillar1Title);
    setVal('page-acasa-pillar1-desc', a.pillar1Desc);
    setVal('page-acasa-pillar2-title', a.pillar2Title);
    setVal('page-acasa-pillar2-desc', a.pillar2Desc);
    setVal('page-acasa-pillar3-title', a.pillar3Title);
    setVal('page-acasa-pillar3-desc', a.pillar3Desc);

    // 2. Despre Noi
    const desp = d.despre || defaultPagesData.despre;
    setVal('page-despre-hero-kicker', desp.heroKicker);
    setVal('page-despre-hero-title', desp.heroTitle);
    setVal('page-despre-hero-intro', desp.heroIntro);
    setVal('page-despre-obj1-title', desp.objective1Title);
    setVal('page-despre-obj1-desc', desp.objective1Desc);
    setVal('page-despre-obj2-title', desp.objective2Title);
    setVal('page-despre-obj2-desc', desp.objective2Desc);
    setVal('page-despre-obj3-title', desp.objective3Title);
    setVal('page-despre-obj3-desc', desp.objective3Desc);

    renderTimelineFields(desp.timeline || defaultPagesData.despre.timeline);

    // 3. Evenimente & Media
    const ev = d.evenimente || defaultPagesData.evenimente;
    setVal('page-ev-hero-kicker', ev.heroKicker);
    setVal('page-ev-hero-title', ev.heroTitle);
    setVal('page-ev-hero-subtitle', ev.heroSubtitle);
    renderEventsNodesFields(ev.events || defaultPagesData.evenimente.events);

    // 4. Membri & Adeziune
    const m = d.membri || defaultPagesData.membri;
    setVal('page-membri-hero-kicker', m.heroKicker);
    setVal('page-membri-hero-title', m.heroTitle);
    setVal('page-membri-card-title', m.cardTitle);
    setVal('page-membri-card-desc', m.cardDesc);
    setVal('page-membri-card-btn-primary', m.cardBtnPrimaryText);
    setVal('page-membri-card-btn-secondary', m.cardBtnSecondaryText);
    setVal('page-membri-card-btn-secondary-link', m.cardBtnSecondaryLink);
    setVal('page-membri-mech-title', m.mechanismTitle);
    setVal('page-membri-mech-desc', m.mechanismDesc);
    setVal('page-membri-step1-title', m.step1Title);
    setVal('page-membri-step1-desc', m.step1Desc);
    setVal('page-membri-step2-title', m.step2Title);
    setVal('page-membri-step2-desc', m.step2Desc);
    setVal('page-membri-step3-title', m.step3Title);
    setVal('page-membri-step3-desc', m.step3Desc);
    setVal('page-membri-step4-title', m.step4Title);
    setVal('page-membri-step4-desc', m.step4Desc);
    setVal('page-membri-fee-fizica', m.feeFizica);
    setVal('page-membri-fee-student', m.feeStudent);
    setVal('page-membri-fee-juridica', m.feeJuridica);

    // 5. FAQ & Contact
    const c = d.contact || defaultPagesData.contact;
    setVal('page-contact-hero-kicker', c.heroKicker);
    setVal('page-contact-hero-title', c.heroTitle);
    setVal('page-contact-hero-subtitle', c.heroSubtitle);
    setVal('page-contact-triage-local-title', c.triageLocalTitle);
    setVal('page-contact-triage-local-desc', c.triageLocalDesc);
    setVal('page-contact-triage-local-phone', c.triageLocalPhone);
    setVal('page-contact-triage-local-email', c.triageLocalEmail);
    setVal('page-contact-triage-central-title', c.triageCentralTitle);
    setVal('page-contact-triage-central-desc', c.triageCentralDesc);
    setVal('page-contact-triage-central-phone', c.triageCentralPhone);
    setVal('page-contact-triage-central-email', c.triageCentralEmail);
    setVal('page-contact-addr-academic', c.addressAcademic);
    setVal('page-contact-addr-central', c.addressCentral);
    setVal('page-contact-phone-pres', c.contactPresidentPhone);
    setVal('page-contact-phone-sec', c.contactSecretaryPhone);
    setVal('page-contact-phone-cot', c.contactCotizatiiPhone);
    setVal('page-contact-bank-name', c.bankName);
    setVal('page-contact-bank-iban', c.bankIban);
    setVal('page-contact-bank-purpose', c.bankPurpose);
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
                    el('label', { class: 'form-label' }, [`Titlu Eveniment #${index + 1}`]),
                    el('input', { type: 'text', class: 'form-input page-ev-titlu', 'data-idx': index, value: evItem.titlu || '' })
                ]),
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, ['Dată']),
                    el('input', { type: 'text', class: 'form-input page-ev-data', 'data-idx': index, value: evItem.data || '' })
                ]),
                el('div', { class: 'form-group', style: 'margin-bottom: 0;' }, [
                    el('label', { class: 'form-label' }, ['Locație']),
                    el('input', { type: 'text', class: 'form-input page-ev-locatie', 'data-idx': index, value: evItem.locatie || '' })
                ])
            ]),
            el('div', { class: 'form-group', style: 'margin-bottom: 8px;' }, [
                el('label', { class: 'form-label' }, ['Descriere']),
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
            heroKicker: getVal('page-acasa-hero-kicker'),
            heroTitle: getVal('page-acasa-hero-title'),
            heroSubtitle: getVal('page-acasa-hero-subtitle'),
            heroBtnPrimaryText: getVal('page-acasa-hero-btn-primary'),
            heroBtnSecondaryText: getVal('page-acasa-hero-btn-secondary'),
            heroBtnSecondaryLink: getVal('page-acasa-hero-btn-secondary-link'),
            mapTitle: getVal('page-acasa-map-title'),
            mapDesc: getVal('page-acasa-map-desc'),
            pillar1Title: getVal('page-acasa-pillar1-title'),
            pillar1Desc: getVal('page-acasa-pillar1-desc'),
            pillar2Title: getVal('page-acasa-pillar2-title'),
            pillar2Desc: getVal('page-acasa-pillar2-desc'),
            pillar3Title: getVal('page-acasa-pillar3-title'),
            pillar3Desc: getVal('page-acasa-pillar3-desc')
        };
    } else if (tabKey === 'despre') {
        const timeline = [];
        document.querySelectorAll('.timeline-edit-card').forEach((card, idx) => {
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
            objective1Title: getVal('page-despre-obj1-title'),
            objective1Desc: getVal('page-despre-obj1-desc'),
            objective2Title: getVal('page-despre-obj2-title'),
            objective2Desc: getVal('page-despre-obj2-desc'),
            objective3Title: getVal('page-despre-obj3-title'),
            objective3Desc: getVal('page-despre-obj3-desc')
        };
    } else if (tabKey === 'evenimente') {
        const events = [];
        document.querySelectorAll('.event-node-edit-card').forEach(card => {
            const titlu = card.querySelector('.page-ev-titlu')?.value.trim() || '';
            const data = card.querySelector('.page-ev-data')?.value.trim() || '';
            const locatie = card.querySelector('.page-ev-locatie')?.value.trim() || '';
            const desc = card.querySelector('.page-ev-desc')?.value.trim() || '';
            const link1 = card.querySelector('.page-ev-link1')?.value.trim() || '';
            const link1Text = card.querySelector('.page-ev-link1text')?.value.trim() || '';
            events.push({ titlu, data, locatie, desc, link1, link1Text });
        });

        return {
            heroKicker: getVal('page-ev-hero-kicker'),
            heroTitle: getVal('page-ev-hero-title'),
            heroSubtitle: getVal('page-ev-hero-subtitle'),
            events
        };
    } else if (tabKey === 'membri') {
        return {
            heroKicker: getVal('page-membri-hero-kicker'),
            heroTitle: getVal('page-membri-hero-title'),
            cardTitle: getVal('page-membri-card-title'),
            cardDesc: getVal('page-membri-card-desc'),
            cardBtnPrimaryText: getVal('page-membri-card-btn-primary'),
            cardBtnSecondaryText: getVal('page-membri-card-btn-secondary'),
            cardBtnSecondaryLink: getVal('page-membri-card-btn-secondary-link'),
            mechanismTitle: getVal('page-membri-mech-title'),
            mechanismDesc: getVal('page-membri-mech-desc'),
            step1Title: getVal('page-membri-step1-title'),
            step1Desc: getVal('page-membri-step1-desc'),
            step2Title: getVal('page-membri-step2-title'),
            step2Desc: getVal('page-membri-step2-desc'),
            step3Title: getVal('page-membri-step3-title'),
            step3Desc: getVal('page-membri-step3-desc'),
            step4Title: getVal('page-membri-step4-title'),
            step4Desc: getVal('page-membri-step4-desc'),
            feeFizica: getVal('page-membri-fee-fizica'),
            feeStudent: getVal('page-membri-fee-student'),
            feeJuridica: getVal('page-membri-fee-juridica')
        };
    } else if (tabKey === 'contact') {
        return {
            heroKicker: getVal('page-contact-hero-kicker'),
            heroTitle: getVal('page-contact-hero-title'),
            heroSubtitle: getVal('page-contact-hero-subtitle'),
            triageLocalTitle: getVal('page-contact-triage-local-title'),
            triageLocalDesc: getVal('page-contact-triage-local-desc'),
            triageLocalPhone: getVal('page-contact-triage-local-phone'),
            triageLocalEmail: getVal('page-contact-triage-local-email'),
            triageCentralTitle: getVal('page-contact-triage-central-title'),
            triageCentralDesc: getVal('page-contact-triage-central-desc'),
            triageCentralPhone: getVal('page-contact-triage-central-phone'),
            triageCentralEmail: getVal('page-contact-triage-central-email'),
            addressAcademic: getVal('page-contact-addr-academic'),
            addressCentral: getVal('page-contact-addr-central'),
            contactPresidentPhone: getVal('page-contact-phone-pres'),
            contactSecretaryPhone: getVal('page-contact-phone-sec'),
            contactCotizatiiPhone: getVal('page-contact-phone-cot'),
            bankName: getVal('page-contact-bank-name'),
            bankIban: getVal('page-contact-bank-iban'),
            bankPurpose: getVal('page-contact-bank-purpose'),
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
        const { error } = await client
            .from('setari')
            .upsert({
                cheie,
                valoare: payload,
                actualizat_la: new Date().toISOString()
            }, { onConflict: 'cheie' });

        if (error) throw error;

        // Actualizare cache local
        if (!state.pagesData) state.pagesData = {};
        state.pagesData[currentTab] = payload;

        setDirtyState(false);
        showToast(`Pagina „${getTabLabel(currentTab)}” a fost salvată cu succes!`, 'success');
    } catch (err) {
        showToast(`Eroare la salvare: ${err.message}`, 'error');
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

        const { error } = await client
            .from('setari')
            .upsert(updates, { onConflict: 'cheie' });

        if (error) throw error;

        tabs.forEach(tab => {
            if (!state.pagesData) state.pagesData = {};
            state.pagesData[tab] = updates.find(u => u.cheie === `pagina_${tab}`).valoare;
        });

        setDirtyState(false);
        showToast('Toate cele 5 pagini au fost sincronizate cu succes în Supabase!', 'success');
    } catch (err) {
        showToast(`Eroare la salvare: ${err.message}`, 'error');
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
        btn.addEventListener('click', (e) => {
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
