/**
 * Requests View (Gestiune Cereri Înscriere)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from '../ui/toast.js';
import { formatStatusLabel, formatDateTimeRo } from '../lib/format.js';
import { renderPaginationControls } from '../ui/pagination.js';
import { updateBulkActionsBar } from '../ui/bulkbar.js';
import { openConvertMemberModal } from './members.js';

let currentFilteredRequests = [];

export async function loadRequests() {
    const requestsFeedback = document.getElementById('requests-feedback');
    const btnRefreshRequests = document.getElementById('btn-refresh-requests');

    clearBannerFeedback(requestsFeedback);
    if (btnRefreshRequests) {
        btnRefreshRequests.disabled = true;
        btnRefreshRequests.textContent = '↻ Se încarcă...';
    }

    try {
        const { data, error } = await client
            .from('cereri_inscriere')
            .select('id, nume_complet, email, telefon, judet, certificat_ancpi, categorie_dorita, mesaj, consimtamant_gdpr, status, notite_interne, creat_la, procesat_la, procesat_de')
            .order('creat_la', { ascending: false });

        if (error) {
            setBannerFeedback(requestsFeedback, 'Eroare la citirea cererilor: ' + error.message, 'error');
            return;
        }

        state.allRequestsData = data || [];
        updateRequestsKpi();
        applyRequestsFilter();
    } catch (err) {
        setBannerFeedback(requestsFeedback, 'Eroare de comunicare la citirea cererilor.', 'error');
    } finally {
        if (btnRefreshRequests) {
            btnRefreshRequests.disabled = false;
            btnRefreshRequests.textContent = '↻ Reîmprospătează';
        }
    }
}

export function updateRequestsKpi() {
    const badgeNavRequests = document.getElementById('badge-nav-requests');
    const kpiValRequestsPending = document.getElementById('kpi-val-requests-pending');
    const kpiSubtextRequests = document.getElementById('kpi-subtext-requests');

    const total = state.allRequestsData.length;
    const pending = state.allRequestsData.filter(r => (r.status || 'in_asteptare') === 'in_asteptare').length;

    if (badgeNavRequests) {
        badgeNavRequests.textContent = pending > 0 ? `${pending} noi` : total;
        badgeNavRequests.classList.toggle('has-pending', pending > 0);
    }
    if (kpiValRequestsPending) kpiValRequestsPending.textContent = pending;
    if (kpiSubtextRequests) kpiSubtextRequests.textContent = `Total cereri înregistrate: ${total}`;
}

export function applyRequestsFilter() {
    const requestsStatusFilter = document.getElementById('requests-status-filter');
    const requestsSearchInput = document.getElementById('requests-search-input');

    const selectedStatus = requestsStatusFilter ? requestsStatusFilter.value : 'toate';
    const searchTerm = requestsSearchInput ? requestsSearchInput.value.toLowerCase().trim() : '';

    currentFilteredRequests = state.allRequestsData.filter(item => {
        if (selectedStatus !== 'toate') {
            const curStatus = item.status || 'in_asteptare';
            if (curStatus !== selectedStatus) return false;
        }

        if (searchTerm) {
            const name = (item.nume_complet || '').toLowerCase();
            const email = (item.email || '').toLowerCase();
            const serie = (item.certificat_ancpi || '').toLowerCase();
            if (!name.includes(searchTerm) && !email.includes(searchTerm) && !serie.includes(searchTerm)) {
                return false;
            }
        }
        return true;
    });

    renderRequestsWithPagination();
}

export function renderRequestsWithPagination() {
    const paginationRequests = document.getElementById('pagination-requests');
    const total = currentFilteredRequests.length;
    const isAll = state.requestsLimit === 'toate';
    const numSize = isAll ? total : parseInt(state.requestsLimit, 10);
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / numSize));
    if (state.requestsPage > totalPages) state.requestsPage = 1;

    const start = isAll ? 0 : (state.requestsPage - 1) * numSize;
    const end = isAll ? total : start + numSize;
    const pageItems = currentFilteredRequests.slice(start, end);

    renderRequestsList(pageItems, total);
    renderPaginationControls(paginationRequests, total, state.requestsPage, state.requestsLimit, (newPage) => {
        state.requestsPage = newPage;
        renderRequestsWithPagination();
    }, (newSize) => {
        state.requestsLimit = newSize;
        state.requestsPage = 1;
        renderRequestsWithPagination();
    });
}

export function renderRequestsList(items, totalCount) {
    const requestsListContainer = document.getElementById('requests-list-container');
    const requestsCounterBadge = document.getElementById('requests-counter-badge');
    if (!requestsListContainer) return;

    while (requestsListContainer.firstChild) {
        requestsListContainer.removeChild(requestsListContainer.firstChild);
    }

    const cnt = totalCount !== undefined ? totalCount : items.length;
    if (requestsCounterBadge) {
        requestsCounterBadge.textContent = cnt + (cnt === 1 ? ' cerere' : ' cereri');
    }

    if (items.length === 0) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'empty-state-card';

        const icon = document.createElement('div');
        icon.className = 'empty-state-icon';
        icon.textContent = '📋';
        emptyCard.appendChild(icon);

        const title = document.createElement('h3');
        title.className = 'empty-state-title';
        title.textContent = 'Nicio cerere conform filtrelor';
        emptyCard.appendChild(title);

        const desc = document.createElement('p');
        desc.className = 'empty-state-desc';
        desc.textContent = 'Nu există cereri de înscriere care să corespundă criteriilor selectate. Încearcă să resetezi filtrele.';
        emptyCard.appendChild(desc);

        const btnReset = document.createElement('button');
        btnReset.type = 'button';
        btnReset.className = 'btn btn-secondary btn-sm';
        btnReset.textContent = 'Resetează filtrele';
        btnReset.addEventListener('click', () => {
            const reqSearch = document.getElementById('requests-search-input');
            const reqFilter = document.getElementById('requests-status-filter');
            if (reqSearch) reqSearch.value = '';
            if (reqFilter) reqFilter.value = 'toate';
            document.querySelectorAll('.filter-pill[data-filter-req]').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-filter-req') === 'toate');
            });
            applyRequestsFilter();
        });
        emptyCard.appendChild(btnReset);

        requestsListContainer.appendChild(emptyCard);
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card-item';

        const topRow = document.createElement('div');
        topRow.className = 'card-item-top';

        // Checkbox de selecție în masă
        const cbWrap = document.createElement('div');
        cbWrap.style.cssText = 'display: flex; align-items: center; margin-right: 12px;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'table-checkbox';
        cb.checked = state.selectedRequestIds.has(item.id);
        cb.title = 'Selectează cerere';
        cb.addEventListener('change', () => {
            if (cb.checked) state.selectedRequestIds.add(item.id);
            else state.selectedRequestIds.delete(item.id);
            updateBulkActionsBar();
        });
        cbWrap.appendChild(cb);
        topRow.appendChild(cbWrap);

        const titleWrap = document.createElement('div');
        titleWrap.style.flex = '1';
        const titleEl = document.createElement('div');
        titleEl.className = 'card-item-title';
        titleEl.textContent = item.nume_complet || 'Fără nume menționat';
        titleWrap.appendChild(titleEl);

        const subDate = document.createElement('div');
        subDate.className = 'card-item-subtitle';
        subDate.textContent = 'Depusă la: ' + formatDateTimeRo(item.creat_la);
        titleWrap.appendChild(subDate);
        topRow.appendChild(titleWrap);

        const st = item.status || 'in_asteptare';
        const statusBadge = document.createElement('span');
        statusBadge.className = 'status-badge ' + st;
        statusBadge.textContent = formatStatusLabel(st);
        topRow.appendChild(statusBadge);

        card.appendChild(topRow);

        // Grid detalii
        const detailsGrid = document.createElement('div');
        detailsGrid.className = 'card-details-grid';

        function addCell(label, val, isLink, linkHref) {
            const cell = document.createElement('div');
            cell.className = 'detail-cell';
            const l = document.createElement('span');
            l.className = 'detail-label';
            l.textContent = label;
            cell.appendChild(l);

            const v = document.createElement('span');
            v.className = 'detail-val';
            if (isLink && val && val !== '—') {
                const a = document.createElement('a');
                a.setAttribute('href', linkHref);
                a.textContent = val;
                v.appendChild(a);
            } else {
                v.textContent = val || '—';
            }
            cell.appendChild(v);
            detailsGrid.appendChild(cell);
        }

        addCell('Email', item.email, true, 'mailto:' + (item.email || ''));
        addCell('Telefon', item.telefon, true, 'tel:' + (item.telefon || ''));
        addCell('Județ', item.judet || '—');
        addCell('Serie ANCPI', item.certificat_ancpi || '—');
        addCell('Categorie', item.categorie_dorita || '—');
        if (item.procesat_la) {
            addCell('Procesat', formatDateTimeRo(item.procesat_la));
        }
        card.appendChild(detailsGrid);

        if (item.mesaj) {
            const msgBox = document.createElement('div');
            msgBox.className = 'callout-box';
            const msgLabel = document.createElement('div');
            msgLabel.style.fontSize = '11px';
            msgLabel.style.fontWeight = '700';
            msgLabel.style.marginBottom = '3px';
            msgLabel.style.color = 'var(--cyan)';
            msgLabel.textContent = 'Mesaj solicitant:';
            msgBox.appendChild(msgLabel);

            const msgText = document.createElement('div');
            msgText.textContent = item.mesaj;
            msgBox.appendChild(msgText);
            card.appendChild(msgBox);
        }

        // Notițe interne Birou Executiv
        const notesSection = document.createElement('div');
        notesSection.className = 'notes-wrap';

        const notesLabel = document.createElement('label');
        notesLabel.className = 'detail-label';
        notesLabel.textContent = 'Notițe interne Birou Executiv:';
        notesSection.appendChild(notesLabel);

        const notesTextarea = document.createElement('textarea');
        notesTextarea.className = 'form-textarea';
        notesTextarea.style.minHeight = '60px';
        notesTextarea.style.marginTop = '4px';
        notesTextarea.setAttribute('maxlength', '4000');
        notesTextarea.placeholder = 'Adaugă observații interne despre această cerere...';
        notesTextarea.value = item.notite_interne || '';
        notesSection.appendChild(notesTextarea);

        const saveNotesBtnWrap = document.createElement('div');
        saveNotesBtnWrap.style.display = 'flex';
        saveNotesBtnWrap.style.justifyContent = 'flex-end';
        saveNotesBtnWrap.style.marginTop = '6px';

        const btnSaveNotes = document.createElement('button');
        btnSaveNotes.type = 'button';
        btnSaveNotes.className = 'btn btn-secondary btn-sm';
        btnSaveNotes.textContent = 'Salvează notițe';
        btnSaveNotes.addEventListener('click', async () => {
            await handleSaveNotes(item.id, notesTextarea.value, btnSaveNotes);
        });
        saveNotesBtnWrap.appendChild(btnSaveNotes);
        notesSection.appendChild(saveNotesBtnWrap);
        card.appendChild(notesSection);

        // Bara de acțiuni
        const actionsBar = document.createElement('div');
        actionsBar.className = 'card-actions-bar';

        const statusGroup = document.createElement('div');
        statusGroup.style.display = 'flex';
        statusGroup.style.gap = '8px';

        const btnApprove = document.createElement('button');
        btnApprove.type = 'button';
        btnApprove.className = 'btn btn-success btn-sm';
        btnApprove.textContent = '✓ Aprobă';
        if (item.status === 'aprobat') {
            btnApprove.disabled = true;
            btnApprove.title = 'Cererea este deja aprobată';
        } else {
            btnApprove.addEventListener('click', async () => {
                await handleSetRequestStatus(item.id, 'aprobat', btnApprove);
            });
        }
        statusGroup.appendChild(btnApprove);

        const btnReject = document.createElement('button');
        btnReject.type = 'button';
        btnReject.className = 'btn btn-warning btn-sm';
        btnReject.textContent = '✕ Respinge';
        if (item.status === 'respins') {
            btnReject.disabled = true;
            btnReject.title = 'Cererea este deja respinsă';
        } else {
            btnReject.addEventListener('click', async () => {
                await handleSetRequestStatus(item.id, 'respins', btnReject);
            });
        }
        statusGroup.appendChild(btnReject);

        // Buton conversie în membru oficial
        const btnConvert = document.createElement('button');
        btnConvert.type = 'button';
        btnConvert.className = 'btn btn-primary btn-sm';
        btnConvert.textContent = '👤 Convertește în Membru';
        btnConvert.title = 'Generează fișă de membru în registru din această cerere';
        if (item.membru_id) {
            btnConvert.textContent = `✓ Membru (${item.membru_id})`;
            btnConvert.className = 'btn btn-secondary btn-sm';
            btnConvert.disabled = true;
            btnConvert.title = `Cererea a fost deja convertită în membrul ${item.membru_id}`;
        } else {
            btnConvert.addEventListener('click', () => {
                openConvertMemberModal(item);
            });
        }
        statusGroup.appendChild(btnConvert);

        actionsBar.appendChild(statusGroup);

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.textContent = '🗑 Șterge';
        btnDelete.addEventListener('click', async () => {
            const applicant = item.nume_complet || 'acest aplicant';
            if (confirm(`Ștergi definitiv cererea depusă de ${applicant}?`)) {
                await handleDeleteRequest(item.id, btnDelete);
            }
        });
        actionsBar.appendChild(btnDelete);

        card.appendChild(actionsBar);
        requestsListContainer.appendChild(card);
    });
}

export async function handleSaveNotes(reqId, notesVal, btn) {
    if (notesVal && notesVal.length > 4000) {
        showToast('Notițele interne nu pot depăși 4000 de caractere.', 'error');
        return;
    }

    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'Salvare...';

    try {
        const { error } = await client
            .from('cereri_inscriere')
            .update({ notite_interne: notesVal })
            .eq('id', reqId);

        if (error) {
            showToast('Eroare la salvare: ' + error.message, 'error');
            return;
        }

        showToast('Notițele interne au fost salvate!', 'success');
        await loadRequests();
    } catch (err) {
        showToast('Eroare de conexiune la salvarea notițelor.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = prev;
    }
}

export async function handleSetRequestStatus(reqId, newStatus, btn) {
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'Actualizare...';

    try {
        const { data: { user } } = await client.auth.getUser();
        const currentUserId = user ? user.id : null;

        const { error } = await client
            .from('cereri_inscriere')
            .update({
                status: newStatus,
                procesat_la: new Date().toISOString(),
                procesat_de: currentUserId
            })
            .eq('id', reqId);

        if (error) {
            showToast('Eroare la actualizare: ' + error.message, 'error');
            return;
        }

        showToast(`Cerere actualizată: ${formatStatusLabel(newStatus)}`, 'success');
        await loadRequests();
    } catch (err) {
        showToast('Eroare de conexiune la modificarea statusului.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = prev;
    }
}

export async function handleDeleteRequest(reqId, btn) {
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'Ștergere...';

    try {
        const { error } = await client
            .from('cereri_inscriere')
            .delete()
            .eq('id', reqId);

        if (error) {
            showToast('Eroare la ștergere: ' + error.message, 'error');
            return;
        }

        showToast('Cererea a fost ștearsă definitiv.', 'success');
        await loadRequests();
    } catch (err) {
        showToast('Eroare de conexiune la ștergerea cererii.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = prev;
    }
}

export function initRealtimeRequestsListener() {
    if (state.realtimeRequestsChannel) return;

    try {
        state.realtimeRequestsChannel = client
            .channel('cereri-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cereri_inscriere' }, (payload) => {
                const nouNume = payload.new ? payload.new.nume_complet : 'un nou solicitant';
                showToast(`📋 Cerere nouă de înscriere primită de la: ${nouNume}!`, 'info', 6000);
                loadRequests();
                window.dispatchEvent(new CustomEvent('ugr:notification-new-request', { detail: payload.new }));
            })
            .subscribe();
    } catch (e) {
        // Silențios dacă realtime nu este activ
    }

    window.addEventListener('ugr:request-converted', () => {
        loadRequests();
    });
}
