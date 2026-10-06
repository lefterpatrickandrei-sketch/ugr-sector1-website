/**
 * Main Orchestrator for UGR Sector 1 Admin Panel (ES Module)
 */

import { state } from './state.js';
import { client } from './supabase.js';
import { showToast } from './ui/toast.js';
import { updateCharCounters, updateReadingStats, isValidImageUrl } from './lib/format.js';
import { exportMembersToCsv, exportRequestsToCsv } from './lib/csv.js';
import {
    showAuthStep,
    showCmsDashboard,
    switchView,
    handleSendOtp,
    toggleAuthMethod,
    handleLoginWithPassword,
    handleVerifyEnroll,
    handleVerifyTotp,
    evaluateAuthState,
    handleSignOut
} from './auth.js';
import {
    loadRequests,
    applyRequestsFilter,
    renderRequestsWithPagination
} from './views/requests.js';
import {
    loadMembers,
    applyMembersFilter,
    renderMembersWithPagination,
    openAddMemberModal,
    openEditMemberModal,
    closeMemberModal,
    handleSaveMember,
    openCsvImportModal,
    closeCsvImportModal,
    handleProcessCsvPreview,
    handleCommitCsvImport
} from './views/members.js';
import {
    loadNews,
    applyNewsFilter,
    renderNewsWithPagination,
    openAddNewsModal,
    openEditNewsModal,
    closeNewsModal,
    openPreviewNewsModal,
    closePreviewNewsModal,
    handleSaveNews,
    handleSyncDefaultNews
} from './views/news.js';
import {
    loadTelemetryData,
    pingSupabaseHealth,
    renderTrafficChart,
    renderAuditTrail
} from './views/telemetry.js';
import {
    loadSettings,
    renderSettingsForm,
    handleSaveSettings,
    setDirty
} from './views/settings.js';
import {
    loadLeadership,
    renderLeadershipLists,
    openAddLeaderModal,
    openEditLeaderModal,
    closeLeaderModal,
    handleSaveLeader
} from './views/leadership.js';
import {
    loadFaq,
    renderFaqList,
    openAddFaqModal,
    openEditFaqModal,
    closeFaqModal,
    handleSaveFaq
} from './views/faq.js';
import {
    loadDocuments,
    renderDocumentsList,
    openAddDocModal,
    openEditDocModal,
    closeDocModal,
    handleSaveDoc
} from './views/documents.js';
import {
    loadTrash,
    renderTrashList,
    handleRestoreTrashItem,
    openPurgeModal,
    closePurgeModal,
    handleConfirmPurge,
    handlePurgeOldTrash
} from './views/trash.js';
import {
    loadAdmins,
    renderAdminsList,
    openAddAdminModal,
    closeAddAdminModal,
    handleSaveNewAdmin,
    handleUpdateAdminRole,
    handleToggleAdminActive
} from './views/roles.js';
import {
    openItemHistoryModal,
    closeItemHistoryModal
} from './views/history.js';
import { loadSyncStatus } from './views/sync.js';
import {
    loadCoderView,
    loadCoderTableData,
    openCoderJsonEditorModal,
    closeCoderJsonEditorModal,
    handleSaveCoderJson,
    exportCurrentTableJson,
    exportCurrentTableCsv,
    handleExportFullBackup
} from './views/coder.js';
import { initNotifications, updateNotificationBadge } from './ui/notifications.js';
import { initUiMode } from './ui/mode.js';
import {
    updateBulkActionsBar,
    clearAllBulkSelections,
    registerBulkReloadCallbacks
} from './ui/bulkbar.js';
import {
    openCommandPalette,
    closeCommandPalette,
    renderCommandPaletteResults,
    updateCommandPaletteHighlight,
    registerPaletteActions
} from './ui/palette.js';
import {
    openMediaPickerModal,
    closeMediaPickerModal,
    renderMediaPickerGrid,
    applyFormatting,
    handleUploadMedia
} from './ui/media.js';
import {
    openAdminProfileModal,
    closeAdminProfileModal,
    handleUpdatePassword
} from './ui/modal.js';

// 1. Înregistrare callbacks inter-module
registerBulkReloadCallbacks({
    reloadMembers: loadMembers,
    reloadRequests: loadRequests,
    reloadNews: loadNews
});

registerPaletteActions({
    switchView,
    openAddMemberModal,
    openEditMemberModal,
    openCsvImportModal,
    openAddNewsModal,
    openPreviewNewsModal,
    openAddLeaderModal,
    openAddFaqModal,
    openAddDocModal,
    openAddAdminModal,
    handleSyncDefaultNews,
    exportMembersToCsv,
    exportRequestsToCsv,
    handleExportFullBackup,
    openMediaPickerModal,
    openAdminProfileModal,
    handleSignOut
});

// 2. Inițializare ascultători DOM
function bootAdminApp() {
    // Mod de Lucru (Simplu / Avansat)
    initUiMode();

    // Navigație Sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const view = link.getAttribute('data-view');
            if (view) switchView(view);
        });
    });

    const btnMobileSidebarToggle = document.getElementById('btn-mobile-sidebar-toggle');
    const cmsSidebar = document.getElementById('cms-sidebar');
    if (btnMobileSidebarToggle && cmsSidebar) {
        btnMobileSidebarToggle.addEventListener('click', () => {
            cmsSidebar.classList.toggle('open');
        });
    }

    // Autentificare & MFA
    const btnSendOtp = document.getElementById('btn-send-otp');
    const btnLoginPassword = document.getElementById('btn-login-password');
    const btnToggleAuthMethod = document.getElementById('btn-toggle-auth-method');
    const btnVerifyEnroll = document.getElementById('btn-verify-enroll');
    const btnCancelEnroll = document.getElementById('btn-cancel-enroll');
    const btnVerifyCode = document.getElementById('btn-verify-code');
    const btnCancelVerify = document.getElementById('btn-cancel-verify');
    const btnSidebarSignout = document.getElementById('btn-sidebar-signout');
    const btnTopbarSignout = document.getElementById('btn-topbar-signout');
    const btnUnauthReturn = document.getElementById('btn-unauth-return');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const mfaEnrollInput = document.getElementById('mfa-enroll-input');
    const mfaVerifyInput = document.getElementById('mfa-verify-input');

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const groupPassword = document.getElementById('group-admin-password');
            if (groupPassword && groupPassword.style.display !== 'none') {
                handleLoginWithPassword();
            } else {
                handleSendOtp();
            }
        });
    }

    if (btnToggleAuthMethod) btnToggleAuthMethod.addEventListener('click', toggleAuthMethod);
    if (btnSendOtp) btnSendOtp.addEventListener('click', handleSendOtp);
    if (btnLoginPassword) btnLoginPassword.addEventListener('click', handleLoginWithPassword);
    if (btnVerifyEnroll) btnVerifyEnroll.addEventListener('click', handleVerifyEnroll);
    if (btnCancelEnroll) btnCancelEnroll.addEventListener('click', handleSignOut);
    if (btnVerifyCode) btnVerifyCode.addEventListener('click', handleVerifyTotp);
    if (btnCancelVerify) btnCancelVerify.addEventListener('click', handleSignOut);
    if (btnSidebarSignout) btnSidebarSignout.addEventListener('click', handleSignOut);
    if (btnTopbarSignout) btnTopbarSignout.addEventListener('click', handleSignOut);
    if (btnUnauthReturn) btnUnauthReturn.addEventListener('click', () => showAuthStep('login'));

    if (adminEmailInput) {
        adminEmailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const groupPassword = document.getElementById('group-admin-password');
                if (groupPassword && groupPassword.style.display !== 'none') {
                    if (adminPasswordInput) adminPasswordInput.focus();
                } else {
                    handleSendOtp();
                }
            }
        });
    }
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLoginWithPassword();
        });
    }
    if (mfaEnrollInput) {
        mfaEnrollInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleVerifyEnroll();
        });
    }
    if (mfaVerifyInput) {
        mfaVerifyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleVerifyTotp();
        });
    }

    // Cereri: Filtre, Căutare, Paginare, Export
    const requestsSearchInput = document.getElementById('requests-search-input');
    const requestsStatusFilter = document.getElementById('requests-status-filter');
    const btnRefreshRequests = document.getElementById('btn-refresh-requests');
    const btnExportRequestsCsv = document.getElementById('btn-export-requests-csv');

    document.querySelectorAll('.filter-pill[data-filter-req]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-filter-req]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            if (requestsStatusFilter) requestsStatusFilter.value = pill.getAttribute('data-filter-req');
            applyRequestsFilter();
        });
    });

    if (requestsSearchInput) requestsSearchInput.addEventListener('input', applyRequestsFilter);
    if (requestsStatusFilter) {
        requestsStatusFilter.addEventListener('change', () => {
            const val = requestsStatusFilter.value;
            document.querySelectorAll('.filter-pill[data-filter-req]').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-filter-req') === val);
            });
            applyRequestsFilter();
        });
    }
    if (btnRefreshRequests) btnRefreshRequests.addEventListener('click', loadRequests);
    if (btnExportRequestsCsv) btnExportRequestsCsv.addEventListener('click', exportRequestsToCsv);

    // Membri: Filtre, Căutare, Paginare, Modal, Salvare, Export
    const membersSearchInput = document.getElementById('members-search-input');
    const membersStatusFilter = document.getElementById('members-status-filter');
    const membersJudetFilter = document.getElementById('members-judet-filter');
    const btnRefreshMembers = document.getElementById('btn-refresh-members');
    const btnExportMembersCsv = document.getElementById('btn-export-members-csv');
    const btnOpenAddMember = document.getElementById('btn-open-add-member');
    const btnCloseMemberModal = document.getElementById('btn-close-member-modal');
    const btnCancelMemberModal = document.getElementById('btn-cancel-member-modal');
    const btnSaveMember = document.getElementById('btn-save-member');
    const memberInputNume = document.getElementById('member-input-nume');
    const memberInputSerie = document.getElementById('member-input-serie');
    const modalMember = document.getElementById('modal-member');

    document.querySelectorAll('.filter-pill[data-filter-mem]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-filter-mem]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            if (membersStatusFilter) membersStatusFilter.value = pill.getAttribute('data-filter-mem');
            applyMembersFilter();
        });
    });

    if (membersSearchInput) membersSearchInput.addEventListener('input', applyMembersFilter);
    if (membersStatusFilter) {
        membersStatusFilter.addEventListener('change', () => {
            const val = membersStatusFilter.value;
            document.querySelectorAll('.filter-pill[data-filter-mem]').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-filter-mem') === val);
            });
            applyMembersFilter();
        });
    }
    if (membersJudetFilter) membersJudetFilter.addEventListener('change', applyMembersFilter);
    if (btnRefreshMembers) btnRefreshMembers.addEventListener('click', loadMembers);
    if (btnExportMembersCsv) btnExportMembersCsv.addEventListener('click', exportMembersToCsv);
    if (btnOpenAddMember) btnOpenAddMember.addEventListener('click', openAddMemberModal);
    if (btnCloseMemberModal) btnCloseMemberModal.addEventListener('click', closeMemberModal);
    if (btnCancelMemberModal) btnCancelMemberModal.addEventListener('click', closeMemberModal);
    if (btnSaveMember) btnSaveMember.addEventListener('click', handleSaveMember);
    if (memberInputNume) memberInputNume.addEventListener('input', updateCharCounters);
    if (memberInputSerie) memberInputSerie.addEventListener('input', updateCharCounters);
    if (modalMember) {
        modalMember.addEventListener('click', (e) => {
            if (e.target === modalMember) closeMemberModal();
        });
    }

    // Membri: Import CSV în masă
    const btnOpenImportCsv = document.getElementById('btn-open-import-csv');
    const btnCloseCsvModal = document.getElementById('btn-close-csv-modal');
    const btnCancelCsvImport = document.getElementById('btn-cancel-csv-import');
    const btnCommitCsvImport = document.getElementById('btn-commit-csv-import');
    const csvFileInput = document.getElementById('csv-file-input');
    const modalCsvImport = document.getElementById('modal-csv-import');

    if (btnOpenImportCsv) btnOpenImportCsv.addEventListener('click', openCsvImportModal);
    if (btnCloseCsvModal) btnCloseCsvModal.addEventListener('click', closeCsvImportModal);
    if (btnCancelCsvImport) btnCancelCsvImport.addEventListener('click', closeCsvImportModal);
    if (btnCommitCsvImport) btnCommitCsvImport.addEventListener('click', handleCommitCsvImport);
    if (modalCsvImport) {
        modalCsvImport.addEventListener('click', (e) => {
            if (e.target === modalCsvImport) closeCsvImportModal();
        });
    }
    if (csvFileInput) {
        csvFileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    handleProcessCsvPreview(evt.target?.result || '');
                };
                reader.readAsText(file, 'UTF-8');
            }
        });
    }

    // Știri: Filtre, Grilă vs Tabel, Căutare, Modale, Salvare
    const newsSearchInput = document.getElementById('news-search-input');
    const newsStatusFilter = document.getElementById('news-status-filter');
    const btnRefreshNews = document.getElementById('btn-refresh-news');
    const btnOpenAddNews = document.getElementById('btn-open-add-news');
    const btnCloseNewsModal = document.getElementById('btn-close-news-modal');
    const btnCancelNewsModal = document.getElementById('btn-cancel-news-modal');
    const btnSaveNews = document.getElementById('btn-save-news');
    const btnSyncNewsAction = document.getElementById('btn-sync-news-action');
    const btnNewsModeGrid = document.getElementById('btn-news-mode-grid');
    const btnNewsModeTable = document.getElementById('btn-news-mode-table');
    const btnClosePreviewModal = document.getElementById('btn-close-preview-modal');
    const btnClosePreviewAction = document.getElementById('btn-close-preview-action');
    const newsInputTitlu = document.getElementById('news-input-titlu');
    const newsInputImagine = document.getElementById('news-input-imagine');
    const newsInputContinut = document.getElementById('news-input-continut');
    const modalNews = document.getElementById('modal-news');
    const modalPreviewNews = document.getElementById('modal-preview-news');

    document.querySelectorAll('.filter-pill[data-filter-news]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-filter-news]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            if (newsStatusFilter) newsStatusFilter.value = pill.getAttribute('data-filter-news');
            applyNewsFilter();
        });
    });

    if (btnNewsModeGrid && btnNewsModeTable) {
        btnNewsModeGrid.addEventListener('click', () => {
            state.newsViewMode = 'grid';
            btnNewsModeGrid.classList.add('active');
            btnNewsModeTable.classList.remove('active');
            applyNewsFilter();
        });
        btnNewsModeTable.addEventListener('click', () => {
            state.newsViewMode = 'table';
            btnNewsModeTable.classList.add('active');
            btnNewsModeGrid.classList.remove('active');
            applyNewsFilter();
        });
    }

    if (newsSearchInput) newsSearchInput.addEventListener('input', applyNewsFilter);
    if (newsStatusFilter) {
        newsStatusFilter.addEventListener('change', () => {
            const val = newsStatusFilter.value;
            document.querySelectorAll('.filter-pill[data-filter-news]').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-filter-news') === val);
            });
            applyNewsFilter();
        });
    }
    if (btnRefreshNews) btnRefreshNews.addEventListener('click', loadNews);
    if (btnOpenAddNews) btnOpenAddNews.addEventListener('click', openAddNewsModal);
    if (btnCloseNewsModal) btnCloseNewsModal.addEventListener('click', closeNewsModal);
    if (btnCancelNewsModal) btnCancelNewsModal.addEventListener('click', closeNewsModal);
    if (btnSaveNews) btnSaveNews.addEventListener('click', handleSaveNews);
    if (btnSyncNewsAction) btnSyncNewsAction.addEventListener('click', () => handleSyncDefaultNews(btnSyncNewsAction));
    if (btnClosePreviewModal) btnClosePreviewModal.addEventListener('click', closePreviewNewsModal);
    if (btnClosePreviewAction) btnClosePreviewAction.addEventListener('click', closePreviewNewsModal);
    if (newsInputTitlu) newsInputTitlu.addEventListener('input', updateCharCounters);
    if (newsInputImagine) {
        newsInputImagine.addEventListener('input', () => {
            updateNewsImageLivePreview(newsInputImagine.value.trim(), '');
            updateCharCounters();
        });
    }
    if (newsInputContinut) newsInputContinut.addEventListener('input', updateReadingStats);
    if (modalNews) {
        modalNews.addEventListener('click', (e) => {
            if (e.target === modalNews) closeNewsModal();
        });
    }
    if (modalPreviewNews) {
        modalPreviewNews.addEventListener('click', (e) => {
            if (e.target === modalPreviewNews) closePreviewNewsModal();
        });
    }

    // Scurtături Panou General (Overview)
    const btnQuickSyncNews = document.getElementById('btn-quick-sync-news');
    const btnShortcutSyncNews = document.getElementById('btn-shortcut-sync-news');
    const btnQuickAddMember = document.getElementById('btn-quick-add-member');
    const btnQuickAddNews = document.getElementById('btn-quick-add-news');
    const btnShortcutExportMembers = document.getElementById('btn-shortcut-export-members');
    const btnShortcutExportRequests = document.getElementById('btn-shortcut-export-requests');
    const btnShortcutViewRequests = document.getElementById('btn-shortcut-view-requests');

    if (btnQuickSyncNews) btnQuickSyncNews.addEventListener('click', () => handleSyncDefaultNews(btnQuickSyncNews));
    if (btnShortcutSyncNews) btnShortcutSyncNews.addEventListener('click', () => handleSyncDefaultNews(btnShortcutSyncNews));
    if (btnQuickAddMember) btnQuickAddMember.addEventListener('click', openAddMemberModal);
    if (btnQuickAddNews) btnQuickAddNews.addEventListener('click', openAddNewsModal);
    if (btnShortcutExportMembers) btnShortcutExportMembers.addEventListener('click', exportMembersToCsv);
    if (btnShortcutExportRequests) btnShortcutExportRequests.addEventListener('click', exportRequestsToCsv);
    if (btnShortcutViewRequests) btnShortcutViewRequests.addEventListener('click', () => switchView('requests'));

    // Command Palette (Ctrl+K)
    const btnTriggerCmdPalette = document.getElementById('btn-trigger-cmd-palette');
    const btnCloseCmdPalette = document.getElementById('btn-close-cmd-palette');
    const cmdPaletteSearchInput = document.getElementById('cmd-palette-search-input');
    const modalCommandPalette = document.getElementById('modal-command-palette');

    if (btnTriggerCmdPalette) btnTriggerCmdPalette.addEventListener('click', openCommandPalette);
    if (btnCloseCmdPalette) btnCloseCmdPalette.addEventListener('click', closeCommandPalette);
    if (cmdPaletteSearchInput) {
        cmdPaletteSearchInput.addEventListener('input', (e) => {
            renderCommandPaletteResults(e.target.value);
        });
    }
    if (modalCommandPalette) {
        modalCommandPalette.addEventListener('click', (e) => {
            if (e.target === modalCommandPalette) closeCommandPalette();
        });
    }

    // Media Asset Picker & Ghost Formatting Toolbar
    const btnOpenMediaPicker = document.getElementById('btn-open-media-picker');
    const btnCloseMediaModal = document.getElementById('btn-close-media-modal');
    const btnCancelMediaPicker = document.getElementById('btn-cancel-media-picker');
    const mediaSearchInput = document.getElementById('media-search-input');
    const mediaCustomUrlInput = document.getElementById('media-custom-url-input');
    const btnApplyCustomImageUrl = document.getElementById('btn-apply-custom-image-url');
    const btnClearNewsImage = document.getElementById('btn-clear-news-image');
    const modalMediaPicker = document.getElementById('modal-media-picker');

    if (btnOpenMediaPicker) btnOpenMediaPicker.addEventListener('click', openMediaPickerModal);
    if (btnCloseMediaModal) btnCloseMediaModal.addEventListener('click', closeMediaPickerModal);
    if (btnCancelMediaPicker) btnCancelMediaPicker.addEventListener('click', closeMediaPickerModal);
    if (mediaSearchInput) {
        mediaSearchInput.addEventListener('input', (e) => {
            renderMediaPickerGrid(e.target.value);
        });
    }
    if (btnApplyCustomImageUrl) {
        btnApplyCustomImageUrl.addEventListener('click', () => {
            const u = mediaCustomUrlInput ? mediaCustomUrlInput.value.trim() : '';
            if (!u) {
                showToast('Introduceți o adresă URL validă.', 'error');
                return;
            }
            if (!isValidImageUrl(u)) {
                showToast('Adresa trebuie să înceapă cu https:// sau ugr-images/.', 'error');
                return;
            }
            if (newsInputImagine) newsInputImagine.value = u;
            updateNewsImageLivePreview(u, 'Imagine externă');
            updateCharCounters();
            closeMediaPickerModal();
            showToast('Imaginea a fost asociată articolului.', 'success');
        });
    }
    if (btnClearNewsImage) {
        btnClearNewsImage.addEventListener('click', () => {
            if (newsInputImagine) newsInputImagine.value = '';
            updateNewsImageLivePreview('', '');
            updateCharCounters();
            showToast('Imaginea a fost ștearsă din articol.', 'info');
        });
    }
    if (modalMediaPicker) {
        modalMediaPicker.addEventListener('click', (e) => {
            if (e.target === modalMediaPicker) closeMediaPickerModal();
        });
    }

    document.querySelectorAll('.fmt-btn[data-fmt]').forEach(b => {
        b.addEventListener('click', () => applyFormatting(b.getAttribute('data-fmt')));
    });

    // Profil & Securitate Admin
    const btnSidebarProfile = document.getElementById('btn-sidebar-profile');
    const btnTopbarProfile = document.getElementById('btn-topbar-profile');
    const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
    const btnCancelProfileModal = document.getElementById('btn-cancel-profile-modal');
    const formUpdatePassword = document.getElementById('form-update-password');
    const btnSavePassword = document.getElementById('btn-save-password');
    const modalAdminProfile = document.getElementById('modal-admin-profile');

    if (btnSidebarProfile) btnSidebarProfile.addEventListener('click', openAdminProfileModal);
    if (btnTopbarProfile) btnTopbarProfile.addEventListener('click', openAdminProfileModal);
    if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', closeAdminProfileModal);
    if (btnCancelProfileModal) btnCancelProfileModal.addEventListener('click', closeAdminProfileModal);
    if (formUpdatePassword) {
        formUpdatePassword.addEventListener('submit', (e) => {
            e.preventDefault();
            handleUpdatePassword();
        });
    }
    if (btnSavePassword) btnSavePassword.addEventListener('click', handleUpdatePassword);
    if (modalAdminProfile) {
        modalAdminProfile.addEventListener('click', (e) => {
            if (e.target === modalAdminProfile) closeAdminProfileModal();
        });
    }

    // Acțiuni în Masă (Bulk Bar)
    const selectAllMembers = document.getElementById('select-all-members');
    const selectAllNews = document.getElementById('select-all-news');
    const btnClearBulkSelection = document.getElementById('btn-clear-bulk-selection');

    if (selectAllMembers) {
        selectAllMembers.addEventListener('change', () => {
            const checked = selectAllMembers.checked;
            state.allMembersData.forEach(m => {
                if (checked) state.selectedMemberIds.add(m.id);
                else state.selectedMemberIds.delete(m.id);
            });
            renderMembersWithPagination();
            updateBulkActionsBar();
        });
    }
    if (selectAllNews) {
        selectAllNews.addEventListener('change', () => {
            const checked = selectAllNews.checked;
            state.allNewsData.forEach(n => {
                if (checked) state.selectedNewsIds.add(n.id);
                else state.selectedNewsIds.delete(n.id);
            });
            renderNewsWithPagination();
            updateBulkActionsBar();
        });
    }
    if (btnClearBulkSelection) {
        btnClearBulkSelection.addEventListener('click', clearAllBulkSelections);
    }

    // Telemetrie & Audit
    const btnRefreshTelemetry = document.getElementById('btn-refresh-telemetry');
    if (btnRefreshTelemetry) {
        btnRefreshTelemetry.addEventListener('click', async () => {
            btnRefreshTelemetry.disabled = true;
            btnRefreshTelemetry.textContent = '↻ Se actualizează...';
            await loadTelemetryData();
            await pingSupabaseHealth();
            btnRefreshTelemetry.disabled = false;
            btnRefreshTelemetry.textContent = '↻ Reîmprospătează';
            showToast('Metricile de telemetrie și jurnalul de audit au fost sincronizate.', 'info');
        });
    }

    document.querySelectorAll('.time-range-pill[data-telemetry-range]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.time-range-pill[data-telemetry-range]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.currentTelemetryRange = pill.getAttribute('data-telemetry-range') || '7d';
            renderTrafficChart(state.currentTelemetryRange);
            showToast(`Perioada a fost schimbată la: ${pill.textContent}`, 'info', 2000);
        });
    });

    const auditSearchInput = document.getElementById('telemetry-audit-search');
    if (auditSearchInput) auditSearchInput.addEventListener('input', renderAuditTrail);
    const auditFilterSelect = document.getElementById('telemetry-audit-filter');
    if (auditFilterSelect) auditFilterSelect.addEventListener('change', renderAuditTrail);

    // Setări Filială (public.setari)
    const btnRefreshSettings = document.getElementById('btn-refresh-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnStickySaveSettings = document.getElementById('btn-sticky-save-settings');
    const btnCancelSettingsChanges = document.getElementById('btn-cancel-settings-changes');

    if (btnRefreshSettings) btnRefreshSettings.addEventListener('click', loadSettings);
    if (btnSaveSettings) btnSaveSettings.addEventListener('click', handleSaveSettings);
    if (btnStickySaveSettings) btnStickySaveSettings.addEventListener('click', handleSaveSettings);
    if (btnCancelSettingsChanges) btnCancelSettingsChanges.addEventListener('click', () => {
        renderSettingsForm();
        setDirty(false);
    });

    const settingsInputs = document.querySelectorAll('#view-settings input, #view-settings textarea');
    settingsInputs.forEach(input => {
        input.addEventListener('input', () => setDirty(true));
    });

    // Conducere (public.leadership)
    const btnRefreshLeadership = document.getElementById('btn-refresh-leadership');
    const btnAddLeader = document.getElementById('btn-add-leader');
    const btnCloseLeaderModal = document.getElementById('btn-close-leader-modal');
    const btnCancelLeaderModal = document.getElementById('btn-cancel-leader-modal');
    const btnSaveLeader = document.getElementById('btn-save-leader');
    const modalLeader = document.getElementById('modal-leader');

    if (btnRefreshLeadership) btnRefreshLeadership.addEventListener('click', loadLeadership);
    if (btnAddLeader) btnAddLeader.addEventListener('click', openAddLeaderModal);
    if (btnCloseLeaderModal) btnCloseLeaderModal.addEventListener('click', closeLeaderModal);
    if (btnCancelLeaderModal) btnCancelLeaderModal.addEventListener('click', closeLeaderModal);
    if (btnSaveLeader) btnSaveLeader.addEventListener('click', handleSaveLeader);
    if (modalLeader) {
        modalLeader.addEventListener('click', (e) => {
            if (e.target === modalLeader) closeLeaderModal();
        });
    }

    // Întrebări Frecvente (public.faq)
    const btnRefreshFaq = document.getElementById('btn-refresh-faq');
    const btnAddFaq = document.getElementById('btn-add-faq');
    const btnCloseFaqModal = document.getElementById('btn-close-faq-modal');
    const btnCancelFaqModal = document.getElementById('btn-cancel-faq-modal');
    const btnSaveFaq = document.getElementById('btn-save-faq');
    const modalFaq = document.getElementById('modal-faq');
    const faqSearchInput = document.getElementById('faq-search-input');

    if (btnRefreshFaq) btnRefreshFaq.addEventListener('click', loadFaq);
    if (btnAddFaq) btnAddFaq.addEventListener('click', openAddFaqModal);
    if (btnCloseFaqModal) btnCloseFaqModal.addEventListener('click', closeFaqModal);
    if (btnCancelFaqModal) btnCancelFaqModal.addEventListener('click', closeFaqModal);
    if (btnSaveFaq) btnSaveFaq.addEventListener('click', handleSaveFaq);
    if (modalFaq) {
        modalFaq.addEventListener('click', (e) => {
            if (e.target === modalFaq) closeFaqModal();
        });
    }
    if (faqSearchInput) {
        faqSearchInput.addEventListener('input', (e) => {
            state.faqSearchQuery = e.target.value;
            renderFaqList();
        });
    }
    document.querySelectorAll('.filter-pill[data-faq-cat]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-faq-cat]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.faqFilterCategory = pill.getAttribute('data-faq-cat') || 'toate';
            renderFaqList();
        });
    });

    // Documente Oficiale (public.documente)
    const btnRefreshDocuments = document.getElementById('btn-refresh-documents');
    const btnAddDocument = document.getElementById('btn-add-document');
    const btnCloseDocModal = document.getElementById('btn-close-doc-modal');
    const btnCancelDocModal = document.getElementById('btn-cancel-doc-modal');
    const btnSaveDoc = document.getElementById('btn-save-doc');
    const modalDoc = document.getElementById('modal-doc');
    const documentsSearchInput = document.getElementById('documents-search-input');

    if (btnRefreshDocuments) btnRefreshDocuments.addEventListener('click', loadDocuments);
    if (btnAddDocument) btnAddDocument.addEventListener('click', openAddDocModal);
    if (btnCloseDocModal) btnCloseDocModal.addEventListener('click', closeDocModal);
    if (btnCancelDocModal) btnCancelDocModal.addEventListener('click', closeDocModal);
    if (btnSaveDoc) btnSaveDoc.addEventListener('click', handleSaveDoc);
    if (modalDoc) {
        modalDoc.addEventListener('click', (e) => {
            if (e.target === modalDoc) closeDocModal();
        });
    }
    if (documentsSearchInput) {
        documentsSearchInput.addEventListener('input', (e) => {
            state.documentsSearchQuery = e.target.value;
            renderDocumentsList();
        });
    }

    // Media Dropzone & Upload (Supabase Storage)
    const mediaDropzone = document.getElementById('media-dropzone');
    const mediaFileInput = document.getElementById('media-file-input');
    const btnTriggerMediaFile = document.getElementById('btn-trigger-media-file');

    if (btnTriggerMediaFile && mediaFileInput) {
        btnTriggerMediaFile.addEventListener('click', () => mediaFileInput.click());
    }
    if (mediaFileInput) {
        mediaFileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadMedia(file);
        });
    }
    if (mediaDropzone) {
        mediaDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            mediaDropzone.style.borderColor = 'var(--cyan)';
        });
        mediaDropzone.addEventListener('dragleave', () => {
            mediaDropzone.style.borderColor = 'var(--border-subtle)';
        });
        mediaDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            mediaDropzone.style.borderColor = 'var(--border-subtle)';
            const file = e.dataTransfer.files?.[0];
            if (file) handleUploadMedia(file);
        });
    }
    document.querySelectorAll('.filter-pill[data-media-tab]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-media-tab]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.mediaActiveTab = pill.getAttribute('data-media-tab') || 'all';
            renderMediaPickerGrid(document.getElementById('media-search-input')?.value || '');
        });
    });

    // Coș de Reciclate (Trash)
    const btnRefreshTrash = document.getElementById('btn-refresh-trash');
    const btnPurgeOldTrash = document.getElementById('btn-purge-old-trash');
    const trashSearchInput = document.getElementById('trash-search-input');
    const btnClosePurgeModal = document.getElementById('btn-close-purge-modal');
    const btnCancelPurgeModal = document.getElementById('btn-cancel-purge-modal');
    const btnConfirmPurge = document.getElementById('btn-confirm-purge');
    const purgeConfirmInput = document.getElementById('purge-confirm-input');
    const modalPurgeConfirm = document.getElementById('modal-purge-confirm');

    if (btnRefreshTrash) btnRefreshTrash.addEventListener('click', loadTrash);
    if (btnPurgeOldTrash) btnPurgeOldTrash.addEventListener('click', handlePurgeOldTrash);
    if (trashSearchInput) {
        trashSearchInput.addEventListener('input', (e) => {
            state.trashSearchQuery = e.target.value;
            renderTrashList();
        });
    }
    document.querySelectorAll('.filter-pill[data-trash-type]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-trash-type]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.trashFilterType = pill.getAttribute('data-trash-type') || 'toate';
            renderTrashList();
        });
    });
    if (btnClosePurgeModal) btnClosePurgeModal.addEventListener('click', closePurgeModal);
    if (btnCancelPurgeModal) btnCancelPurgeModal.addEventListener('click', closePurgeModal);
    if (btnConfirmPurge) btnConfirmPurge.addEventListener('click', handleConfirmPurge);
    if (purgeConfirmInput && btnConfirmPurge) {
        purgeConfirmInput.addEventListener('input', (e) => {
            btnConfirmPurge.disabled = (e.target.value.trim().toUpperCase() !== 'STERGE');
        });
    }
    if (modalPurgeConfirm) {
        modalPurgeConfirm.addEventListener('click', (e) => {
            if (e.target === modalPurgeConfirm) closePurgeModal();
        });
    }

    // Roluri & Securitate Acces (RBAC)
    const btnRefreshRoles = document.getElementById('btn-refresh-roles');
    const btnOpenAddAdmin = document.getElementById('btn-open-add-admin');
    const btnCloseAddAdmin = document.getElementById('btn-close-add-admin');
    const btnCancelAddAdmin = document.getElementById('btn-cancel-add-admin');
    const formAddAdmin = document.getElementById('form-add-admin');
    const btnSaveNewAdmin = document.getElementById('btn-save-new-admin');
    const modalAddAdmin = document.getElementById('modal-add-admin');

    if (btnRefreshRoles) btnRefreshRoles.addEventListener('click', loadAdmins);
    if (btnOpenAddAdmin) btnOpenAddAdmin.addEventListener('click', openAddAdminModal);
    if (btnCloseAddAdmin) btnCloseAddAdmin.addEventListener('click', closeAddAdminModal);
    if (btnCancelAddAdmin) btnCancelAddAdmin.addEventListener('click', closeAddAdminModal);
    if (formAddAdmin) formAddAdmin.addEventListener('submit', handleSaveNewAdmin);
    if (btnSaveNewAdmin) btnSaveNewAdmin.addEventListener('click', handleSaveNewAdmin);
    if (modalAddAdmin) {
        modalAddAdmin.addEventListener('click', (e) => {
            if (e.target === modalAddAdmin) closeAddAdminModal();
        });
    }

    // Istoric Modificări & Audit Diff
    const btnCloseHistoryModal = document.getElementById('btn-close-history-modal');
    const btnCloseHistoryAction = document.getElementById('btn-close-history-action');
    const modalItemHistory = document.getElementById('modal-item-history');

    if (btnCloseHistoryModal) btnCloseHistoryModal.addEventListener('click', closeItemHistoryModal);
    if (btnCloseHistoryAction) btnCloseHistoryAction.addEventListener('click', closeItemHistoryModal);
    if (modalItemHistory) {
        modalItemHistory.addEventListener('click', (e) => {
            if (e.target === modalItemHistory) closeItemHistoryModal();
        });
    }

    window.addEventListener('ugr:item-restored', (e) => {
        const { table } = e.detail || {};
        if (table === 'membri') loadMembers();
        else if (table === 'stiri') loadNews();
        else if (table === 'leadership') loadLeadership();
        else if (table === 'faq') loadFaq();
        else if (table === 'documente') loadDocuments();
        else if (table === 'setari') loadSettings();
    });

    // ─── P6: NOTIFICĂRI & REALTIME BELL ──────────────────────────────
    initNotifications();

    // ─── P6: SYNC STATUS ─────────────────────────────────────────────
    const btnRefreshSync = document.getElementById('btn-refresh-sync');
    if (btnRefreshSync) {
        btnRefreshSync.addEventListener('click', loadSyncStatus);
    }

    // ─── P6: CODER MODE & DEV TOOLS ──────────────────────────────────
    const coderTableSelect = document.getElementById('coder-table-select');
    if (coderTableSelect) {
        coderTableSelect.addEventListener('change', (e) => {
            loadCoderTableData(e.target.value);
        });
    }

    const btnRefreshCoderTable = document.getElementById('btn-refresh-coder-table');
    if (btnRefreshCoderTable) {
        btnRefreshCoderTable.addEventListener('click', () => {
            const tbl = coderTableSelect ? coderTableSelect.value : 'membri';
            loadCoderTableData(tbl);
        });
    }

    const btnCoderExportJson = document.getElementById('btn-coder-export-json');
    if (btnCoderExportJson) {
        btnCoderExportJson.addEventListener('click', exportCurrentTableJson);
    }

    const btnCoderExportCsv = document.getElementById('btn-coder-export-csv');
    if (btnCoderExportCsv) {
        btnCoderExportCsv.addEventListener('click', exportCurrentTableCsv);
    }

    const btnExportFullBackup = document.getElementById('btn-export-full-backup');
    if (btnExportFullBackup) {
        btnExportFullBackup.addEventListener('click', handleExportFullBackup);
    }

    const modalCoderJsonClose = document.getElementById('modal-coder-json-close');
    if (modalCoderJsonClose) {
        modalCoderJsonClose.addEventListener('click', closeCoderJsonEditorModal);
    }

    const modalCoderJsonCancel = document.getElementById('modal-coder-json-cancel');
    if (modalCoderJsonCancel) {
        modalCoderJsonCancel.addEventListener('click', closeCoderJsonEditorModal);
    }

    const btnSaveCoderJson = document.getElementById('btn-save-coder-json');
    if (btnSaveCoderJson) {
        btnSaveCoderJson.addEventListener('click', handleSaveCoderJson);
    }

    // Tastatură globală (Ctrl+K, Escape)
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (modalCommandPalette && modalCommandPalette.classList.contains('active')) {
                closeCommandPalette();
            } else {
                openCommandPalette();
            }
            return;
        }

        if (e.key === 'Escape') {
            closeMemberModal();
            closeNewsModal();
            closePreviewNewsModal();
            closeCommandPalette();
            closeMediaPickerModal();
            closeAdminProfileModal();
            closeLeaderModal();
            closeFaqModal();
            closeDocModal();
            closeCsvImportModal();
            closePurgeModal();
            closeAddAdminModal();
            closeItemHistoryModal();
            closeCoderJsonEditorModal();
        }
    });

    // Supabase Auth State Change Listener
    client.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            await evaluateAuthState();
        } else if (event === 'SIGNED_OUT') {
            showAuthStep('login');
        }
    });

    // Boot evaluare sesiune
    evaluateAuthState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAdminApp);
} else {
    bootAdminApp();
}
