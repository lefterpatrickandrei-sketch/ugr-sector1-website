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
    handleSaveMember
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
    applyFormatting
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
    openAddNewsModal,
    openPreviewNewsModal,
    handleSyncDefaultNews,
    exportMembersToCsv,
    exportRequestsToCsv,
    openMediaPickerModal,
    openAdminProfileModal,
    handleSignOut
});

// 2. Inițializare ascultători DOM
document.addEventListener('DOMContentLoaded', () => {
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
    const btnVerifyEnroll = document.getElementById('btn-verify-enroll');
    const btnCancelEnroll = document.getElementById('btn-cancel-enroll');
    const btnVerifyCode = document.getElementById('btn-verify-code');
    const btnCancelVerify = document.getElementById('btn-cancel-verify');
    const btnSidebarSignout = document.getElementById('btn-sidebar-signout');
    const btnTopbarSignout = document.getElementById('btn-topbar-signout');
    const btnUnauthReturn = document.getElementById('btn-unauth-return');
    const adminEmailInput = document.getElementById('admin-email');
    const mfaEnrollInput = document.getElementById('mfa-enroll-input');
    const mfaVerifyInput = document.getElementById('mfa-verify-input');

    if (btnSendOtp) btnSendOtp.addEventListener('click', handleSendOtp);
    if (btnVerifyEnroll) btnVerifyEnroll.addEventListener('click', handleVerifyEnroll);
    if (btnCancelEnroll) btnCancelEnroll.addEventListener('click', handleSignOut);
    if (btnVerifyCode) btnVerifyCode.addEventListener('click', handleVerifyTotp);
    if (btnCancelVerify) btnCancelVerify.addEventListener('click', handleSignOut);
    if (btnSidebarSignout) btnSidebarSignout.addEventListener('click', handleSignOut);
    if (btnTopbarSignout) btnTopbarSignout.addEventListener('click', handleSignOut);
    if (btnUnauthReturn) btnUnauthReturn.addEventListener('click', () => showAuthStep('login'));

    if (adminEmailInput) {
        adminEmailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSendOtp();
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
});
