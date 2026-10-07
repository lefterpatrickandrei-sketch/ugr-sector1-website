/**
 * Authentication & MFA AAL2 Module
 */

import { state, resetState } from './state.js';
import { client } from './supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from './ui/toast.js';
import { updateBulkActionsBar } from './ui/bulkbar.js';
import { loadRequests, initRealtimeRequestsListener } from './views/requests.js';
import { loadMembers } from './views/members.js';
import { loadNews } from './views/news.js';
import { loadVisitsStats, loadTelemetryData, pingSupabaseHealth, initAdminLivePresence } from './views/telemetry.js';
import { loadSettings } from './views/settings.js';
import { loadLeadership } from './views/leadership.js';
import { loadFaq } from './views/faq.js';
import { loadDocuments } from './views/documents.js';
import { loadTrash } from './views/trash.js';
import { loadAdmins } from './views/roles.js';
import { loadSyncStatus } from './views/sync.js';
import { loadCoderView } from './views/coder.js';
import { loadPagesData } from './views/pages.js';

// T-J3 (3.3): etichete umane pentru eșecurile de încărcare parțiale.
const LOADER_LABELS = ['Cereri de înscriere', 'Membri', 'Știri', 'Statistici vizite'];

export function getPanelRedirectUrl() {
    if (window.location.protocol.startsWith('http')) {
        return window.location.origin + window.location.pathname;
    }
    return 'https://ugr-sector1.ro/admin/panou.html';
}

export function showAuthStep(stepName, detailMessage) {
    const authWrapper = document.getElementById('auth-wrapper');
    const cmsApp = document.getElementById('cms-app');
    const authSteps = {
        login: document.getElementById('step-login'),
        mfaEnroll: document.getElementById('step-mfa-enroll'),
        mfaVerify: document.getElementById('step-mfa-verify'),
        unauthorized: document.getElementById('step-unauthorized')
    };

    if (authWrapper) authWrapper.classList.add('active');
    if (cmsApp) cmsApp.classList.remove('active');

    Object.keys(authSteps).forEach(k => {
        if (authSteps[k]) {
            authSteps[k].classList.toggle('active', k === stepName);
        }
    });

    // T-J3 (3.2): pasul `unauthorized` primea doar un pas fix, fără explicație.
    // Afișăm acum motivul real (email neinvitat, cont inactiv, claim eșuat).
    const unauthorizedDetail = document.getElementById('unauthorized-detail');
    if (unauthorizedDetail) {
        unauthorizedDetail.textContent = detailMessage || '';
        unauthorizedDetail.style.display = detailMessage ? '' : 'none';
    }
}

export function showCmsDashboard() {
    const authWrapper = document.getElementById('auth-wrapper');
    const cmsApp = document.getElementById('cms-app');

    if (authWrapper) authWrapper.classList.remove('active');
    if (cmsApp) cmsApp.classList.add('active');
    switchView('overview');
}

// T-J10: vizibilitatea după rol se decide într-un singur loc, applyRoleUiGates().
// 'coder' permite editarea JSON a oricărui rând, exportul bazei complete și
// restaurarea unei versiuni de backup. Nu are sens pentru editor sau viewer:
// restore-ul ar rescrie tabele întregi, iar RLS le-ar opri oricum pe jumătate
// din operații, lăsând baza într-o stare intermediară greu de reparat.
const OWNER_ONLY_VIEWS = ['coder'];

export function applyRoleUiGates() {
    const isOwner = state.adminRecord?.rol === 'owner';

    OWNER_ONLY_VIEWS.forEach(viewName => {
        const navLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
        if (navLink) {
            navLink.style.display = isOwner ? '' : 'none';
            // setUiMode() (mode.js) scrie direct display pe elementele
            // .advanced-only, deci owner-only trebuie reaplicat după comutarea
            // de mod. Înregistrăm un flag ca acesta să poată fi verificat.
            navLink.dataset.ownerOnly = isOwner ? 'true' : 'false';
        }
    });

    // Dacă un non-owner avea deja vizualizarea deschisă dintr-o sesiune anterioară,
    // o închidem și îl trimitem înapoi la panou.
    if (!isOwner && OWNER_ONLY_VIEWS.includes(state.currentActiveView)) {
        switchView('overview');
    }
}

export function switchView(viewName) {
    if (OWNER_ONLY_VIEWS.includes(viewName) && state.adminRecord?.rol !== 'owner') {
        showToast('Această secțiune este rezervată rolului Owner.', 'warning');
        if (state.currentActiveView !== viewName) return;
    }

    state.currentActiveView = viewName;

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const match = link.getAttribute('data-view') === viewName;
        link.classList.toggle('active', match);
    });

    const viewPanels = {
        overview: document.getElementById('view-overview'),
        requests: document.getElementById('view-requests'),
        members: document.getElementById('view-members'),
        news: document.getElementById('view-news'),
        telemetry: document.getElementById('view-telemetry'),
        settings: document.getElementById('view-settings'),
        leadership: document.getElementById('view-leadership'),
        faq: document.getElementById('view-faq'),
        documents: document.getElementById('view-documents'),
        trash: document.getElementById('view-trash'),
        roles: document.getElementById('view-roles'),
        sync: document.getElementById('view-sync'),
        coder: document.getElementById('view-coder'),
        pages: document.getElementById('view-pages')
    };

    Object.keys(viewPanels).forEach(k => {
        if (viewPanels[k]) {
            viewPanels[k].classList.toggle('active', k === viewName);
        }
    });

    const breadcrumbCurrentLabel = document.getElementById('breadcrumb-current-label');
    const labels = {
        overview: 'Panou General',
        requests: 'Cereri Înscriere',
        members: 'Registru Membri',
        news: 'Știri & Noutăți',
        telemetry: 'Telemetrie & Audit',
        settings: 'Setări Filială',
        leadership: 'Conducere & Echipă',
        faq: 'Întrebări Frecvente',
        documents: 'Documente Oficiale',
        trash: 'Coș de Reciclate',
        roles: 'Roluri & Acces (RBAC)',
        sync: 'Stare Sincronizare',
        coder: 'Consolă Dezvoltator (Avansat)',
        pages: 'Editor Pagini Site Public'
    };
    if (breadcrumbCurrentLabel) {
        breadcrumbCurrentLabel.textContent = labels[viewName] || 'Panou';
    }

    const cmsSidebar = document.getElementById('cms-sidebar');
    if (cmsSidebar) {
        cmsSidebar.classList.remove('open');
    }

    if (viewName === 'members' && state.allMembersData.length === 0) {
        loadMembers();
    } else if (viewName === 'news' && state.allNewsData.length === 0) {
        loadNews();
    } else if (viewName === 'requests' && state.allRequestsData.length === 0) {
        loadRequests();
    } else if (viewName === 'telemetry') {
        loadTelemetryData();
        pingSupabaseHealth();
    } else if (viewName === 'settings' && !state.allSettingsData.organizatie) {
        loadSettings();
    } else if (viewName === 'leadership' && state.allLeadershipData.length === 0) {
        loadLeadership();
    } else if (viewName === 'faq' && state.allFaqData.length === 0) {
        loadFaq();
    } else if (viewName === 'documents' && state.allDocumentsData.length === 0) {
        loadDocuments();
    } else if (viewName === 'trash') {
        loadTrash();
    } else if (viewName === 'roles') {
        loadAdmins();
    } else if (viewName === 'sync') {
        loadSyncStatus();
    } else if (viewName === 'coder') {
        loadCoderView();
    } else if (viewName === 'pages') {
        loadPagesData();
    }

    updateBulkActionsBar();
}

export async function handleSendOtp() {
    const adminEmailInput = document.getElementById('admin-email');
    const btnSendOtp = document.getElementById('btn-send-otp');
    const loginFeedback = document.getElementById('login-feedback');

    const email = adminEmailInput ? adminEmailInput.value.trim() : '';
    if (!email) {
        setBannerFeedback(loginFeedback, 'Vă rugăm să introduceți adresa de email.', 'error');
        return;
    }

    if (btnSendOtp) {
        btnSendOtp.disabled = true;
        btnSendOtp.textContent = 'Se trimite...';
    }
    clearBannerFeedback(loginFeedback);

    try {
        const redirectUrl = getPanelRedirectUrl();
        const { error } = await client.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: false,
                emailRedirectTo: redirectUrl
            }
        });
        if (error) {
            setBannerFeedback(loginFeedback, 'Eroare: ' + (error.message || 'Verificați adresa sau încercați din nou.'), 'error');
            return;
        }
        setBannerFeedback(loginFeedback, 'Linkul de conectare a fost trimis! Verificați inbox-ul (și folderul Spam).', 'info');
    } catch (err) {
        setBannerFeedback(loginFeedback, 'Eroare de comunicare cu serverul.', 'error');
    } finally {
        if (btnSendOtp) {
            btnSendOtp.disabled = false;
            btnSendOtp.textContent = 'Trimite link de autentificare';
        }
    }
}

export function toggleAuthMethod() {
    const groupPassword = document.getElementById('group-admin-password');
    const btnSendOtp = document.getElementById('btn-send-otp');
    const btnLoginPassword = document.getElementById('btn-login-password');
    const btnToggle = document.getElementById('btn-toggle-auth-method');
    const loginFeedback = document.getElementById('login-feedback');
    clearBannerFeedback(loginFeedback);

    const isPasswordMode = groupPassword && groupPassword.style.display !== 'none';
    if (isPasswordMode) {
        // Comută pe Magic Link
        if (groupPassword) groupPassword.style.display = 'none';
        if (btnSendOtp) btnSendOtp.style.display = 'block';
        if (btnLoginPassword) btnLoginPassword.style.display = 'none';
        if (btnToggle) btnToggle.textContent = 'Prefer conectarea cu parolă';
    } else {
        // Comută pe Parolă
        if (groupPassword) groupPassword.style.display = 'block';
        if (btnSendOtp) btnSendOtp.style.display = 'none';
        if (btnLoginPassword) btnLoginPassword.style.display = 'block';
        if (btnToggle) btnToggle.textContent = 'Prefer conectarea cu link pe email (Magic Link)';
    }
}

export async function handleLoginWithPassword() {
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const btnLoginPassword = document.getElementById('btn-login-password');
    const loginFeedback = document.getElementById('login-feedback');

    const email = adminEmailInput ? adminEmailInput.value.trim() : '';
    const password = adminPasswordInput ? adminPasswordInput.value : '';

    if (!email || !password) {
        setBannerFeedback(loginFeedback, 'Introduceți emailul și parola.', 'error');
        return;
    }

    if (btnLoginPassword) {
        btnLoginPassword.disabled = true;
        btnLoginPassword.textContent = 'Se verifică...';
    }
    clearBannerFeedback(loginFeedback);

    try {
        const { error } = await client.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            setBannerFeedback(loginFeedback, 'Eroare: ' + (error.message || 'Credențiale incorecte.'), 'error');
            return;
        }
        await evaluateAuthState();
    } catch (err) {
        setBannerFeedback(loginFeedback, 'Eroare de comunicare cu serverul.', 'error');
    } finally {
        if (btnLoginPassword) {
            btnLoginPassword.disabled = false;
            btnLoginPassword.textContent = 'Conectează-te cu parolă';
        }
    }
}

export async function startTotpEnrollment() {
    const enrollFeedback = document.getElementById('enroll-feedback');
    const mfaEnrollInput = document.getElementById('mfa-enroll-input');
    const mfaQrImg = document.getElementById('mfa-qr-img');
    const mfaSecretCode = document.getElementById('mfa-secret-code');

    showAuthStep('mfaEnroll');
    clearBannerFeedback(enrollFeedback);
    if (mfaEnrollInput) mfaEnrollInput.value = '';

    try {
        const { data: enrollData, error: enrollErr } = await client.auth.mfa.enroll({
            factorType: 'totp'
        });

        if (enrollErr || !enrollData) {
            setBannerFeedback(enrollFeedback, 'Eroare la inițierea înrolării 2FA. Reîncercați.', 'error');
            return;
        }

        state.activeTotpFactorId = enrollData.id;

        if (enrollData.totp && enrollData.totp.qr_code && mfaQrImg) {
            mfaQrImg.setAttribute('src', enrollData.totp.qr_code);
        }
        if (enrollData.totp && enrollData.totp.secret && mfaSecretCode) {
            mfaSecretCode.textContent = enrollData.totp.secret;
        }
    } catch (err) {
        setBannerFeedback(enrollFeedback, 'Eroare de conexiune la serverul de autentificare.', 'error');
    }
}

export async function handleVerifyEnroll() {
    const enrollFeedback = document.getElementById('enroll-feedback');
    const mfaEnrollInput = document.getElementById('mfa-enroll-input');
    const btnVerifyEnroll = document.getElementById('btn-verify-enroll');

    const code = mfaEnrollInput ? mfaEnrollInput.value.replace(/\D/g, '').trim() : '';
    if (code.length !== 6) {
        setBannerFeedback(enrollFeedback, 'Introduceți codul numeric de 6 cifre.', 'error');
        return;
    }

    if (btnVerifyEnroll) {
        btnVerifyEnroll.disabled = true;
        btnVerifyEnroll.textContent = 'Se verifică...';
    }
    clearBannerFeedback(enrollFeedback);

    try {
        const { data: challengeData, error: challengeErr } = await client.auth.mfa.challenge({
            factorId: state.activeTotpFactorId
        });
        if (challengeErr || !challengeData) {
            setBannerFeedback(enrollFeedback, 'Nu s-a putut genera provocarea 2FA. Reîncercați.', 'error');
            return;
        }

        const { error: verifyErr } = await client.auth.mfa.verify({
            factorId: state.activeTotpFactorId,
            challengeId: challengeData.id,
            code: code
        });

        if (verifyErr) {
            setBannerFeedback(enrollFeedback, 'Cod incorect sau expirat. Introduceți codul actual din aplicație.', 'error');
            return;
        }

        showToast('Autentificare în 2 Pași activată cu succes!', 'success');
        await evaluateAuthState();
    } catch (err) {
        setBannerFeedback(enrollFeedback, 'Eroare la validarea codului. Reîncercați.', 'error');
    } finally {
        if (btnVerifyEnroll) {
            btnVerifyEnroll.disabled = false;
            btnVerifyEnroll.textContent = 'Verifică și activează 2FA';
        }
    }
}

export async function handleVerifyTotp() {
    const verifyFeedback = document.getElementById('verify-feedback');
    const mfaVerifyInput = document.getElementById('mfa-verify-input');
    const btnVerifyCode = document.getElementById('btn-verify-code');

    const code = mfaVerifyInput ? mfaVerifyInput.value.replace(/\D/g, '').trim() : '';
    if (code.length !== 6) {
        setBannerFeedback(verifyFeedback, 'Introduceți codul numeric de 6 cifre.', 'error');
        return;
    }

    if (btnVerifyCode) {
        btnVerifyCode.disabled = true;
        btnVerifyCode.textContent = 'Se verifică...';
    }
    clearBannerFeedback(verifyFeedback);

    try {
        const { data: challengeData, error: challengeErr } = await client.auth.mfa.challenge({
            factorId: state.activeTotpFactorId
        });
        if (challengeErr || !challengeData) {
            setBannerFeedback(verifyFeedback, 'Nu s-a putut genera provocarea de securitate.', 'error');
            return;
        }

        const { error: verifyErr } = await client.auth.mfa.verify({
            factorId: state.activeTotpFactorId,
            challengeId: challengeData.id,
            code: code
        });

        if (verifyErr) {
            setBannerFeedback(verifyFeedback, 'Cod incorect. Verificați aplicația Google Authenticator.', 'error');
            return;
        }

        showToast('Autentificare 2FA reușită!', 'success');
        await evaluateAuthState();
    } catch (err) {
        setBannerFeedback(verifyFeedback, 'Eroare la validarea codului de securitate.', 'error');
    } finally {
        if (btnVerifyCode) {
            btnVerifyCode.disabled = false;
            btnVerifyCode.textContent = 'Verifică codul';
        }
    }
}

export async function verifyAdminStatus(user) {
    const sidebarEmailDisplay = document.getElementById('sidebar-email-display');
    const sidebarAvatar = document.getElementById('sidebar-avatar');

    try {
        let { data: adminRecord, error: adminErr } = await client
            .from('admini')
            .select('id, user_id, email, rol, activ')
            .eq('user_id', user.id)
            .maybeSingle();

        // Motivul pentru care adminul nu a fost găsit, ca să fie afișat în pasul
        // `unauthorized` în loc de un mesaj generic.
        let claimFailureReason = null;

        // T-J3 (3.2): fallback-ul `.ilike('email', …).update({ user_id })` a fost eliminat.
        //  - cu T-S1 aplicat, politica `admin_claim_invited` nu mai există, deci
        //    scrierea ar eșua oricum prin RLS → cod mort;
        //  - `ilike` interpretează `%` și `_` ca wildcard-uri, iar `.maybeSingle()`
        //    ar putea potrivi rândul altui administrator → risc de preluare de cont.
        // Singura cale de claim rămâne RPC-ul SECURITY DEFINER `claim_admin_invite()`.
        // Eroarea lui nu mai e înghițită: e propagată la pasul `unauthorized`.
        if (!adminRecord) {
            const { data: claimData, error: claimError } = await client.rpc('claim_admin_invite');

            if (!claimError && claimData && claimData.success) {
                adminRecord = {
                    id: claimData.id,
                    user_id: claimData.user_id,
                    email: claimData.email,
                    rol: claimData.rol,
                    activ: claimData.activ
                };
            } else if (claimError) {
                claimFailureReason = claimError;
            }
        }

        if (adminErr || !adminRecord || !adminRecord.activ) {
            if (!adminRecord && !adminErr && !claimFailureReason && user.email) {
                claimFailureReason = new Error(
                    'Adresa ' + user.email + ' nu este înscrisă în tabelul administratorilor (public.admini).'
                );
            }
            await client.auth.signOut();
            showAuthStep('unauthorized', claimFailureReason ? claimFailureReason.message : null);
            return;
        }

        state.user = user;
        state.adminRecord = adminRecord;

        const emailDisplay = user.email || adminRecord.email || '';
        if (sidebarEmailDisplay) sidebarEmailDisplay.textContent = emailDisplay;
        if (sidebarAvatar) {
            const parts = emailDisplay.split('@')[0].split('.');
            const init = (parts[0] ? parts[0][0] : 'A') + (parts[1] ? parts[1][0] : 'D');
            sidebarAvatar.textContent = init.toUpperCase();
        }

        showCmsDashboard();

        // T-J10: se aplică după showCmsDashboard(), fiindcă acesta face
        // switchView('overview') înainte ca rolul să fie cunoscut în interfață.
        applyRoleUiGates();

        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
        }

        // T-J3 (3.3): `Promise.all` propaga prima excepție în catch-ul exterior, care
        // făcea signOut() → un modul cu o eroare de rețea deconecta utilizatorul.
        // allSettled izolează fiecare modul; un eșec parțial nu mai omoară sesiunea.
        const loaded = await Promise.allSettled([
            loadRequests(),
            loadMembers(),
            loadNews(),
            loadVisitsStats()
        ]);

        const failed = loaded
            .map((res, i) => (res.status === 'rejected'
                ? `${LOADER_LABELS[i]}: ${(res.reason && res.reason.message) || 'eroare necunoscută'}`
                : null))
            .filter(Boolean);

        if (failed.length > 0) {
            showToast('Unele secțiuni nu s-au putut încărca — ' + failed.join(' | '), 'warning');
        }

        // T-J3 (3.4): idempotent — dacă un canal există deja, nu se creează altul.
        initAdminLivePresence();
        initRealtimeRequestsListener();
    } catch (err) {
        await client.auth.signOut();
        showAuthStep('unauthorized', (err && err.message) ? err.message : null);
    }
}

export async function evaluateAuthState() {
    if (state.isEvaluatingSession) return;
    state.isEvaluatingSession = true;

    const verifyFeedback = document.getElementById('verify-feedback');
    const mfaVerifyInput = document.getElementById('mfa-verify-input');

    try {
        const { data: sessionData } = await client.auth.getSession();
        const session = sessionData ? sessionData.session : null;

        if (!session || !session.user) {
            showAuthStep('login');
            return;
        }

        const user = session.user;
        const { data: aalData } = await client.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalData && aalData.currentLevel === 'aal2') {
            await verifyAdminStatus(user);
            return;
        }

        const { data: factorsData } = await client.auth.mfa.listFactors();
        const totpList = (factorsData && factorsData.totp) ? factorsData.totp : [];
        const verifiedTotp = totpList.find(f => f.status === 'verified');

        if (verifiedTotp) {
            state.activeTotpFactorId = verifiedTotp.id;
            if (mfaVerifyInput) mfaVerifyInput.value = '';
            clearBannerFeedback(verifyFeedback);
            showAuthStep('mfaVerify');
        } else {
            await startTotpEnrollment();
        }
    } finally {
        state.isEvaluatingSession = false;
    }
}

export async function handleSignOut() {
    await client.auth.signOut();

    const adminEmailInput = document.getElementById('admin-email');
    const mfaEnrollInput = document.getElementById('mfa-enroll-input');
    const mfaVerifyInput = document.getElementById('mfa-verify-input');
    const loginFeedback = document.getElementById('login-feedback');
    const enrollFeedback = document.getElementById('enroll-feedback');
    const verifyFeedback = document.getElementById('verify-feedback');
    const topbarLiveCount = document.getElementById('topbar-live-count');
    const topbarLiveDot = document.getElementById('topbar-live-dot');

    if (adminEmailInput) adminEmailInput.value = '';
    if (mfaEnrollInput) mfaEnrollInput.value = '';
    if (mfaVerifyInput) mfaVerifyInput.value = '';

    // Canalele trebuie scoase de pe client **înainte** de reset: după
    // `resetState()` referințele din state.devin null și nu mai avem ce scoate.
    if (state.adminPresenceChannel) {
        client.removeChannel(state.adminPresenceChannel);
    }
    if (state.realtimeRequestsChannel) {
        client.removeChannel(state.realtimeRequestsChannel);
    }

    // T-J3 (3.5): reset complet al stării. Înainte se goleau doar
    // allRequestsData / allMembersData / allNewsData, deci setările, conducerea,
    // FAQ, documentele, lista de admini, coșul, media și selecțiile bulk rămâneau
    // în memorie și apăreau pentru următorul utilizator autentificat pe același browser.
    resetState();

    // T-J10: resetState() a golit și adminRecord, deci vizibilitatea trebuie
    // recalculată. Altfel, după deconectarea unui owner, linkul spre Consola
    // Dezvoltator rămâne vizibil pentru următorul utilizator (editor sau viewer)
    // care se autentifică pe același browser.
    applyRoleUiGates();

    if (topbarLiveCount) topbarLiveCount.textContent = '—';
    if (topbarLiveDot) topbarLiveDot.className = 'admin-pulse-dot offline';

    clearBannerFeedback(loginFeedback);
    clearBannerFeedback(enrollFeedback);
    clearBannerFeedback(verifyFeedback);
    showAuthStep('login');
    showToast('V-ați deconectat cu succes.', 'info');
}
