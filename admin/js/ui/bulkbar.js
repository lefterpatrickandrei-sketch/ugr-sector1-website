/**
 * Floating Bulk Actions Bar (Filament / AdminLTE style)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast } from './toast.js';
import { exportArrayToCsv } from '../lib/csv.js';

let reloadMembersCallback = null;
let reloadRequestsCallback = null;
let reloadNewsCallback = null;

export function registerBulkReloadCallbacks({ reloadMembers, reloadRequests, reloadNews }) {
    if (reloadMembers) reloadMembersCallback = reloadMembers;
    if (reloadRequests) reloadRequestsCallback = reloadRequests;
    if (reloadNews) reloadNewsCallback = reloadNews;
}

export function updateBulkActionsBar() {
    const bulkActionsBar = document.getElementById('bulk-actions-bar') || document.getElementById('cms-bulk-actions-bar');
    const bulkSelectedCount = document.getElementById('bulk-selected-count');
    const bulkActionsButtons = document.getElementById('bulk-actions-buttons');
    if (!bulkActionsBar || !bulkSelectedCount || !bulkActionsButtons) return;

    let count = 0;
    if (state.currentActiveView === 'members') count = state.selectedMemberIds.size;
    else if (state.currentActiveView === 'requests') count = state.selectedRequestIds.size;
    else if (state.currentActiveView === 'news') count = state.selectedNewsIds.size;

    bulkSelectedCount.textContent = count;

    while (bulkActionsButtons.firstChild) {
        bulkActionsButtons.removeChild(bulkActionsButtons.firstChild);
    }

    if (count === 0) {
        bulkActionsBar.classList.remove('active');
        return;
    }

    bulkActionsBar.classList.add('active');

    if (state.currentActiveView === 'members') {
        const btnExportSel = document.createElement('button');
        btnExportSel.type = 'button';
        btnExportSel.className = 'btn btn-secondary btn-sm';
        btnExportSel.textContent = '📥 Exportă CSV';
        btnExportSel.addEventListener('click', handleBulkExportMembers);
        bulkActionsButtons.appendChild(btnExportSel);

        const btnDelSel = document.createElement('button');
        btnDelSel.type = 'button';
        btnDelSel.className = 'btn btn-danger btn-sm';
        btnDelSel.textContent = '🗑️ Șterge Selectați';
        btnDelSel.addEventListener('click', handleBulkDeleteMembers);
        bulkActionsButtons.appendChild(btnDelSel);
    } else if (state.currentActiveView === 'requests') {
        const btnApproveSel = document.createElement('button');
        btnApproveSel.type = 'button';
        btnApproveSel.className = 'btn btn-primary btn-sm';
        btnApproveSel.textContent = '✓ Aprobă Cererile';
        btnApproveSel.addEventListener('click', handleBulkApproveRequests);
        bulkActionsButtons.appendChild(btnApproveSel);

        const btnRejectSel = document.createElement('button');
        btnRejectSel.type = 'button';
        btnRejectSel.className = 'btn btn-danger btn-sm';
        btnRejectSel.textContent = '✗ Respinge';
        btnRejectSel.addEventListener('click', handleBulkRejectRequests);
        bulkActionsButtons.appendChild(btnRejectSel);

        const btnExportReqSel = document.createElement('button');
        btnExportReqSel.type = 'button';
        btnExportReqSel.className = 'btn btn-secondary btn-sm';
        btnExportReqSel.textContent = '📥 Exportă CSV';
        btnExportReqSel.addEventListener('click', handleBulkExportRequests);
        bulkActionsButtons.appendChild(btnExportReqSel);
    } else if (state.currentActiveView === 'news') {
        const btnDelNewsSel = document.createElement('button');
        btnDelNewsSel.type = 'button';
        btnDelNewsSel.className = 'btn btn-danger btn-sm';
        btnDelNewsSel.textContent = '🗑️ Șterge Știrile Selectate';
        btnDelNewsSel.addEventListener('click', handleBulkDeleteNews);
        bulkActionsButtons.appendChild(btnDelNewsSel);
    }
}

export function clearAllBulkSelections() {
    state.selectedMemberIds.clear();
    state.selectedRequestIds.clear();
    state.selectedNewsIds.clear();

    const selectAllMembers = document.getElementById('select-all-members');
    const selectAllNews = document.getElementById('select-all-news');
    if (selectAllMembers) selectAllMembers.checked = false;
    if (selectAllNews) selectAllNews.checked = false;

    updateBulkActionsBar();
    if (state.currentActiveView === 'members' && reloadMembersCallback) reloadMembersCallback();
    else if (state.currentActiveView === 'requests' && reloadRequestsCallback) reloadRequestsCallback();
    else if (state.currentActiveView === 'news' && reloadNewsCallback) reloadNewsCallback();
}

export function handleBulkExportMembers() {
    const subset = state.allMembersData.filter(m => state.selectedMemberIds.has(m.id));
    if (subset.length === 0) return;
    const headers = ['ID Membru', 'Nume Complet', 'Județ', 'Serie ANCPI', 'Categorie', 'Status', 'Afișare Publică'];
    const rows = subset.map(m => [
        m.id || '',
        m.nume || '',
        m.judet || '',
        m.serie_autorizatie || '',
        m.categorie || '',
        m.status || 'activ',
        m.afisare_publica ? 'Da' : 'Nu'
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportArrayToCsv(`ugr_membri_selectati_${dateStr}.csv`, headers, rows);
}

export function handleBulkExportRequests() {
    const subset = state.allRequestsData.filter(r => state.selectedRequestIds.has(r.id));
    if (subset.length === 0) return;
    const headers = ['ID Cerere', 'Nume Candidat', 'Email', 'Telefon', 'Județ', 'Certificat ANCPI', 'Status', 'Dată Depunere'];
    const rows = subset.map(r => [
        r.id || '',
        r.nume_complet || '',
        r.email || '',
        r.telefon || '',
        r.judet || '',
        r.certificat_ancpi || '',
        r.status || 'in_asteptare',
        r.creat_la ? r.creat_la.split('T')[0] : ''
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportArrayToCsv(`ugr_cereri_selectate_${dateStr}.csv`, headers, rows);
}

export async function handleBulkDeleteMembers() {
    const count = state.selectedMemberIds.size;
    if (count === 0) return;
    if (!confirm(`Sigur dorești să ștergi definitiv cei ${count} membri selectați? Acțiunea este ireversibilă.`)) return;

    showToast(`Se șterg ${count} membri...`, 'info');
    try {
        const ids = Array.from(state.selectedMemberIds);
        const { error } = await client.from('membri').delete().in('id', ids);
        if (error) throw error;
        state.selectedMemberIds.clear();
        updateBulkActionsBar();
        showToast(`Au fost șterși ${count} membri din registru.`, 'success');
        if (reloadMembersCallback) await reloadMembersCallback();
    } catch (err) {
        showToast('Eroare la ștergerea în masă: ' + (err.message || 'Server indisponibil'), 'error');
    }
}

export async function handleBulkApproveRequests() {
    const count = state.selectedRequestIds.size;
    if (count === 0) return;
    showToast(`Se validează ${count} cereri...`, 'info');
    try {
        const ids = Array.from(state.selectedRequestIds);
        const { error } = await client.from('cereri_inscriere').update({
            status: 'aprobat',
            procesat_la: new Date().toISOString()
        }).in('id', ids);
        if (error) throw error;
        state.selectedRequestIds.clear();
        updateBulkActionsBar();
        showToast(`Au fost aprobate ${count} cereri de înscriere.`, 'success');
        if (reloadRequestsCallback) await reloadRequestsCallback();
    } catch (err) {
        showToast('Eroare la aprobare: ' + (err.message || 'Server indisponibil'), 'error');
    }
}

export async function handleBulkRejectRequests() {
    const count = state.selectedRequestIds.size;
    if (count === 0) return;
    showToast(`Se resping ${count} cereri...`, 'info');
    try {
        const ids = Array.from(state.selectedRequestIds);
        const { error } = await client.from('cereri_inscriere').update({
            status: 'respins',
            procesat_la: new Date().toISOString()
        }).in('id', ids);
        if (error) throw error;
        state.selectedRequestIds.clear();
        updateBulkActionsBar();
        showToast(`Au fost respinse ${count} cereri.`, 'success');
        if (reloadRequestsCallback) await reloadRequestsCallback();
    } catch (err) {
        showToast('Eroare la respingere: ' + (err.message || 'Server indisponibil'), 'error');
    }
}

export async function handleBulkDeleteNews() {
    const count = state.selectedNewsIds.size;
    if (count === 0) return;
    if (!confirm(`Sigur dorești să ștergi definitiv cele ${count} știri selectate?`)) return;

    showToast(`Se șterg ${count} articole...`, 'info');
    try {
        const ids = Array.from(state.selectedNewsIds);
        const { error } = await client.from('stiri').delete().in('id', ids);
        if (error) throw error;
        state.selectedNewsIds.clear();
        updateBulkActionsBar();
        showToast(`Au fost șterse ${count} știri din baza de date.`, 'success');
        if (reloadNewsCallback) await reloadNewsCallback();
    } catch (err) {
        showToast('Eroare la ștergerea știrilor: ' + (err.message || 'Server indisponibil'), 'error');
    }
}
