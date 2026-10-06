/**
 * Settings View ("Setări Filială")
 * Manages public.setari (organizatie, ghid_aderare, telemetrie_sector1)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';

let isDirty = false;

export async function loadSettings() {
    const feedback = document.getElementById('settings-feedback');
    clearBannerFeedback(feedback);

    try {
        const { data, error } = await client
            .from('setari')
            .select('cheie, valoare, descriere, actualizat_la');

        if (error) throw error;

        const settingsMap = {};
        if (data && Array.isArray(data)) {
            data.forEach(item => {
                settingsMap[item.cheie] = item.valoare;
            });
        }

        state.allSettingsData = settingsMap;
        renderSettingsForm();
    } catch (err) {
        setBannerFeedback(feedback, `Eroare la încărcarea setărilor: ${err.message}`, 'error');
        showToast('Nu s-au putut prelua setările din baza de date.', 'error');
    }
}

export function renderSettingsForm() {
    const org = state.allSettingsData.organizatie || {};
    const ghid = state.allSettingsData.ghid_aderare || {};
    const isReadOnly = state.adminRecord?.rol === 'viewer';

    // 1. Populare câmpuri simple (Identificare & Contact)
    setVal('cfg-org-branch', org.branch || 'Filiala Sector 1 București');
    setVal('cfg-org-name', org.name || 'Uniunea Geodezilor din România (UGR)');
    setVal('cfg-org-cif', org.cif || '6480330');
    setVal('cfg-org-email', org.email || 'filiala.ugr.s1@gmail.com');
    setVal('cfg-org-email-central', org.emailCentral || 'office@ugr.ro');
    setVal('cfg-org-email-secretar', org.emailSecretar || 'secretar@ugr.ro');
    setVal('cfg-org-address', org.address || 'Bd. Lacul Tei nr. 124, Sector 2, București, România');
    setVal('cfg-org-academic-address', org.academicCenterAddress || 'Bulevardul Mărăști nr. 59, Sector 1, București (FIFIM – USAMV)');

    // Telefoane
    setVal('cfg-phone-president', org.phonePresident || '0726 390 774 / 0748 912 263');
    setVal('cfg-phone-secretary', org.phoneSecretary || '0764 572 874');
    setVal('cfg-phone-cotizatii', org.phoneCotizatii || '0722 684 104');
    setVal('cfg-phone-central', org.phoneCentral || '0723 587 081');

    // Date Bancare
    const bank = (org.bankAccounts && org.bankAccounts[0]) || {};
    setVal('cfg-bank-name', bank.bank || 'BRD — Groupe Société Générale (Ag. Tei, Sector 2)');
    setVal('cfg-bank-iban', bank.iban || 'RO57 BRDE 426S V810 0757 4450');
    setVal('cfg-bank-purpose', bank.purpose || 'Cotizație UGR Filiala Sector 1 / Nume și CNP');

    // Social Media & Link-uri
    const social = org.social || {};
    setVal('cfg-social-fb', social.facebook || 'https://www.facebook.com/share/14xwxtFChmC/');
    setVal('cfg-social-ig', social.instagram || 'https://www.instagram.com/filiala.sector1.ugr');
    setVal('cfg-sgr-form-url', org.sgr2026FormUrl || '');

    // 2. Populare Taxe Adeziune (ghid_aderare)
    const tiers = ghid.tiers || [];
    const tierFizica = tiers.find(t => t.id === 'fizica') || {};
    const tierStudent = tiers.find(t => t.id === 'student') || {};
    const tierJuridica = tiers.find(t => t.id === 'juridica') || {};

    setVal('cfg-fee-fizica-signup', tierFizica.signupFee || '50 RON (plată unică)');
    setVal('cfg-fee-fizica-annual', tierFizica.annualFee || '100 RON / an');
    setVal('cfg-fee-student-signup', tierStudent.signupFee || '10 RON (simbolică)');
    setVal('cfg-fee-student-annual', tierStudent.annualFee || '10 RON / an');
    setVal('cfg-fee-juridica-signup', tierJuridica.signupFee || '100 RON');
    setVal('cfg-fee-juridica-annual', tierJuridica.annualFee || '500 - 2.000 RON / an (în funcție de numărul de experți)');

    // 3. Populare JSON Editor (Mod Avansat)
    const jsonOrgInput = document.getElementById('cfg-json-organizatie');
    const jsonGhidInput = document.getElementById('cfg-json-ghid');
    const jsonTelemetrieInput = document.getElementById('cfg-json-telemetrie');

    if (jsonOrgInput) jsonOrgInput.value = JSON.stringify(org, null, 2);
    if (jsonGhidInput) jsonGhidInput.value = JSON.stringify(ghid, null, 2);
    if (jsonTelemetrieInput) jsonTelemetrieInput.value = JSON.stringify(state.allSettingsData.telemetrie_sector1 || {}, null, 2);

    // Read-only state
    const allInputs = document.querySelectorAll('#view-settings input, #view-settings textarea');
    allInputs.forEach(input => {
        if (isReadOnly) input.setAttribute('disabled', 'true');
        else input.removeAttribute('disabled');
    });

    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) btnSave.disabled = isReadOnly;

    setDirty(false);
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

export function setDirty(val) {
    isDirty = val;
    const stickyBar = document.getElementById('settings-sticky-bar');
    if (stickyBar) {
        stickyBar.classList.toggle('active', isDirty);
    }
}

export async function handleSaveSettings() {
    if (state.adminRecord?.rol === 'viewer') {
        showToast('Rolul de vizitator (viewer) nu are permisiuni de salvare.', 'warning');
        return;
    }

    const feedback = document.getElementById('settings-feedback');
    const btnSave = document.getElementById('btn-save-settings');
    clearBannerFeedback(feedback);

    if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = 'Se salvează...';
    }

    try {
        let updatedOrg;
        let updatedGhid;
        let updatedTelemetrie;

        if (state.uiMode === 'avansat') {
            // Mod avansat: preluare direct din JSON editors
            const jsonOrgVal = document.getElementById('cfg-json-organizatie')?.value || '{}';
            const jsonGhidVal = document.getElementById('cfg-json-ghid')?.value || '{}';
            const jsonTelemVal = document.getElementById('cfg-json-telemetrie')?.value || '{}';

            try {
                updatedOrg = JSON.parse(jsonOrgVal);
            } catch (e) {
                throw new Error(`JSON invalid în Organizatie: ${e.message}`);
            }
            try {
                updatedGhid = JSON.parse(jsonGhidVal);
            } catch (e) {
                throw new Error(`JSON invalid în Ghid Aderare: ${e.message}`);
            }
            try {
                updatedTelemetrie = JSON.parse(jsonTelemVal);
            } catch (e) {
                throw new Error(`JSON invalid în Telemetrie: ${e.message}`);
            }
        } else {
            // Mod simplu: construire obiecte din câmpuri ghidate
            const existingOrg = state.allSettingsData.organizatie || {};
            updatedOrg = {
                ...existingOrg,
                branch: getVal('cfg-org-branch'),
                name: getVal('cfg-org-name'),
                cif: getVal('cfg-org-cif'),
                email: getVal('cfg-org-email'),
                emailCentral: getVal('cfg-org-email-central'),
                emailSecretar: getVal('cfg-org-email-secretar'),
                address: getVal('cfg-org-address'),
                academicCenterAddress: getVal('cfg-org-academic-address'),
                phonePresident: getVal('cfg-phone-president'),
                phoneSecretary: getVal('cfg-phone-secretary'),
                phoneCotizatii: getVal('cfg-phone-cotizatii'),
                phoneCentral: getVal('cfg-phone-central'),
                sgr2026FormUrl: getVal('cfg-sgr-form-url'),
                bankAccounts: [
                    {
                        bank: getVal('cfg-bank-name'),
                        iban: getVal('cfg-bank-iban'),
                        currency: 'RON',
                        purpose: getVal('cfg-bank-purpose')
                    }
                ],
                social: {
                    facebook: getVal('cfg-social-fb'),
                    instagram: getVal('cfg-social-ig')
                },
                socialLinks: {
                    facebook: getVal('cfg-social-fb'),
                    instagram: getVal('cfg-social-ig')
                }
            };

            const existingGhid = state.allSettingsData.ghid_aderare || {};
            const existingTiers = existingGhid.tiers || [];
            updatedGhid = {
                ...existingGhid,
                tiers: [
                    {
                        id: 'fizica',
                        name: 'Persoană Fizică (Geodez / Topograf Autorizat)',
                        signupFee: getVal('cfg-fee-fizica-signup'),
                        annualFee: getVal('cfg-fee-fizica-annual'),
                        requirements: 'Diplomă de licență geodezie / topografie / cadastru + Certificat ANCPI (opțional)',
                        badge: 'Recomandat Specialiști'
                    },
                    {
                        id: 'student',
                        name: 'Membru Student (Facultăți de Profil)',
                        signupFee: getVal('cfg-fee-student-signup'),
                        annualFee: getVal('cfg-fee-student-annual'),
                        requirements: 'Adeverință student la zi (UTCB, UTM, USAMV etc.)',
                        badge: 'Acces Tineri Geodezi'
                    },
                    {
                        id: 'juridica',
                        name: 'Persoană Juridică (Companii & Birouri de Cadastru)',
                        signupFee: getVal('cfg-fee-juridica-signup'),
                        annualFee: getVal('cfg-fee-juridica-annual'),
                        requirements: 'Copie CUI firmă, autorizație ANCPI clasa I / II / III',
                        badge: 'Companii de Elită'
                    }
                ]
            };

            updatedTelemetrie = state.allSettingsData.telemetrie_sector1 || {};
        }

        // Salvare în public.setari
        const updates = [
            { cheie: 'organizatie', valoare: updatedOrg, descriere: 'Date oficiale de identificare și contact Filiala Sector 1' },
            { cheie: 'ghid_aderare', valoare: updatedGhid, descriere: 'Pași și taxe de adeziune UGR' },
            { cheie: 'telemetrie_sector1', valoare: updatedTelemetrie, descriere: 'Repere geodezice și stații ROMPOS Sector 1' }
        ];

        for (const item of updates) {
            const { error: upsertErr } = await client
                .from('setari')
                .upsert(item, { onConflict: 'cheie' });

            if (upsertErr) throw upsertErr;
        }

        state.allSettingsData.organizatie = updatedOrg;
        state.allSettingsData.ghid_aderare = updatedGhid;
        state.allSettingsData.telemetrie_sector1 = updatedTelemetrie;

        setDirty(false);
        renderSettingsForm();
        showToast('Setările filialei au fost salvate cu succes în Supabase!', 'success');
        setBannerFeedback(feedback, 'Toate modificările au fost sincronizate cu baza de date.', 'success');
    } catch (err) {
        showToast(`Eroare la salvare: ${err.message}`, 'error');
        setBannerFeedback(feedback, `Eroare la salvarea setărilor: ${err.message}`, 'error');
    } finally {
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.textContent = '💾 Salvează Setările Filialei';
        }
    }
}
