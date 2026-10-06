/**
 * Authentication & MFA AAL2 Module
 */

import { state } from './state.js';
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

export function getPanelRedirectUrl() {
    if (window.location.protocol.startsWith('http')) {
        return window.location.origin + window.location.pathname;
    }
    return 'https://ugr-sector1.ro/admin/panou.html';
}

export function showAuthStep(stepName) {
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
}

export function showCmsDashboard() {
    const authWrapper = document.getElementById('auth-wrapper');
    const cmsApp = document.getElementById('cms-app');

    if (authWrapper) authWrapper.classList.remove('active');
    if (cmsApp) cmsApp.classList.add('active');
    switchView('overview');
}

export function switchView(viewName) {
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
        coder: document.getElementById('view-coder')
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
        coder: 'Consolă Dezvoltator (Avansat)'
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
        const { data: adminRecord, error: adminErr } = await client
            .from('admini')
            .select('user_id, email, rol, activ')
            .eq('user_id', user.id)
            .maybeSingle();

        if (adminErr || !adminRecord || !adminRecord.activ) {
            await client.auth.signOut();
            showAuthStep('unauthorized');
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

        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
        }

        await loadRequests();
        await loadMembers();
        await loadNews();
        await loadVisitsStats();
        initAdminLivePresence();
        initRealtimeRequestsListener();
    } catch (err) {
        await client.auth.signOut();
        showAuthStep('unauthorized');
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
    state.user = null;
    state.adminRecord = null;
    state.activeTotpFactorId = null;

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

    state.allRequestsData = [];
    state.allMembersData = [];
    state.allNewsData = [];

    if (state.adminPresenceChannel) {
        client.removeChannel(state.adminPresenceChannel);
        state.adminPresenceChannel = null;
    }
    if (state.realtimeRequestsChannel) {
        client.removeChannel(state.realtimeRequestsChannel);
        state.realtimeRequestsChannel = null;
    }

    if (topbarLiveCount) topbarLiveCount.textContent = '—';
    if (topbarLiveDot) topbarLiveDot.className = 'admin-pulse-dot offline';

    clearBannerFeedback(loginFeedback);
    clearBannerFeedback(enrollFeedback);
    clearBannerFeedback(verifyFeedback);
    showAuthStep('login');
    showToast('V-ați deconectat cu succes.', 'info');
}
