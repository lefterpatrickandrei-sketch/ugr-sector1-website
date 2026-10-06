/**
 * Members View (Registru Membri ANCPI)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from '../ui/toast.js';
import { formatStatusLabel, updateCharCounters } from '../lib/format.js';
import { renderPaginationControls } from '../ui/pagination.js';
import { updateBulkActionsBar } from '../ui/bulkbar.js';

let editingMemberId = null;
let currentFilteredMembers = [];

export async function loadMembers() {
    const membersFeedback = document.getElementById('members-feedback');
    const btnRefreshMembers = document.getElementById('btn-refresh-members');

    clearBannerFeedback(membersFeedback);
    if (btnRefreshMembers) {
        btnRefreshMembers.disabled = true;
        btnRefreshMembers.textContent = '↻ Se încarcă...';
    }

    try {
        const { data, error } = await client
            .from('membri')
            .select('id, nume, judet, serie_autorizatie, categorie, status, afisare_publica, created_at, updated_at')
            .order('nume', { ascending: true });

        if (error) {
            setBannerFeedback(membersFeedback, 'Eroare la citirea membrilor: ' + error.message, 'error');
            return;
        }

        state.allMembersData = data || [];
        updateMembersKpi();
        applyMembersFilter();
    } catch (err) {
        setBannerFeedback(membersFeedback, 'Eroare de conexiune la citirea membrilor.', 'error');
    } finally {
        if (btnRefreshMembers) {
            btnRefreshMembers.disabled = false;
            btnRefreshMembers.textContent = '↻ Reîmprospătează';
        }
    }
}

export function updateMembersKpi() {
    const badgeNavMembers = document.getElementById('badge-nav-members');
    const kpiValMembersTotal = document.getElementById('kpi-val-members-total');
    const kpiSubtextMembers = document.getElementById('kpi-subtext-members');

    const total = state.allMembersData.length;
    const publicCount = state.allMembersData.filter(m => m.afisare_publica).length;

    if (badgeNavMembers) badgeNavMembers.textContent = total;
    if (kpiValMembersTotal) kpiValMembersTotal.textContent = total;
    if (kpiSubtextMembers) kpiSubtextMembers.textContent = `${publicCount} afișați public pe site`;
}

export function applyMembersFilter() {
    const membersStatusFilter = document.getElementById('members-status-filter');
    const membersJudetFilter = document.getElementById('members-judet-filter');
    const membersSearchInput = document.getElementById('members-search-input');

    const selectedStatus = membersStatusFilter ? membersStatusFilter.value : 'toate';
    const selectedJudet = membersJudetFilter ? membersJudetFilter.value : 'toate';
    const searchTerm = membersSearchInput ? membersSearchInput.value.toLowerCase().trim() : '';

    currentFilteredMembers = state.allMembersData.filter(m => {
        if (selectedStatus !== 'toate') {
            if (m.status !== selectedStatus) return false;
        }
        if (selectedJudet !== 'toate') {
            if (m.judet !== selectedJudet) return false;
        }
        if (searchTerm) {
            const name = (m.nume || '').toLowerCase();
            const id = (m.id || '').toLowerCase();
            const serie = (m.serie_autorizatie || '').toLowerCase();
            if (!name.includes(searchTerm) && !id.includes(searchTerm) && !serie.includes(searchTerm)) {
                return false;
            }
        }
        return true;
    });

    renderMembersWithPagination();
}

export function renderMembersWithPagination() {
    const paginationMembers = document.getElementById('pagination-members');
    const total = currentFilteredMembers.length;
    const isAll = state.membersLimit === 'toate' || state.membersLimit === total;
    const numSize = isAll ? total : parseInt(state.membersLimit, 10);
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / numSize));
    if (state.membersPage > totalPages) state.membersPage = 1;

    const start = isAll ? 0 : (state.membersPage - 1) * numSize;
    const end = isAll ? total : start + numSize;
    const pageItems = currentFilteredMembers.slice(start, end);

    renderMembersTable(pageItems, total);

    renderPaginationControls(
        paginationMembers,
        total,
        state.membersPage,
        String(state.membersLimit),
        (newPage) => {
            state.membersPage = newPage;
            renderMembersWithPagination();
        },
        (newSize) => {
            state.membersLimit = newSize === 'toate' ? 'toate' : parseInt(newSize, 10);
            state.membersPage = 1;
            renderMembersWithPagination();
        }
    );
}

export function renderMembersTable(items, totalCount) {
    const membersTableBody = document.getElementById('members-table-body');
    const membersCounterBadge = document.getElementById('members-counter-badge');
    const selectAllMembers = document.getElementById('select-all-members');

    if (!membersTableBody) return;

    while (membersTableBody.firstChild) {
        membersTableBody.removeChild(membersTableBody.firstChild);
    }

    const cnt = totalCount !== undefined ? totalCount : items.length;
    if (membersCounterBadge) {
        membersCounterBadge.textContent = cnt + (cnt === 1 ? ' membru' : ' membri');
    }

    if (items.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', '9');
        td.style.textAlign = 'center';
        td.style.padding = '48px 20px';
        td.style.color = 'var(--text-muted)';
        td.textContent = 'Nu a fost găsit niciun membru conform filtrelor selectate.';
        tr.appendChild(td);
        membersTableBody.appendChild(tr);
        if (selectAllMembers) selectAllMembers.checked = false;
        return;
    }

    items.forEach(m => {
        const tr = document.createElement('tr');

        // Checkbox Selecție în masă
        const tdCb = document.createElement('td');
        tdCb.style.textAlign = 'center';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'table-checkbox';
        cb.checked = state.selectedMemberIds.has(m.id);
        cb.title = 'Selectează membru';
        cb.addEventListener('change', () => {
            if (cb.checked) state.selectedMemberIds.add(m.id);
            else state.selectedMemberIds.delete(m.id);
            updateBulkActionsBar();
        });
        tdCb.appendChild(cb);
        tr.appendChild(tdCb);

        // ID
        const tdId = document.createElement('td');
        tdId.style.fontFamily = 'Space Mono, monospace';
        tdId.style.color = 'var(--cyan)';
        tdId.style.fontWeight = '700';
        tdId.textContent = m.id;
        tr.appendChild(tdId);

        // Nume
        const tdNume = document.createElement('td');
        tdNume.style.fontWeight = '600';
        tdNume.style.color = '#ffffff';
        tdNume.textContent = m.nume;
        tr.appendChild(tdNume);

        // Județ
        const tdJudet = document.createElement('td');
        tdJudet.textContent = m.judet || '—';
        tr.appendChild(tdJudet);

        // Serie
        const tdSerie = document.createElement('td');
        tdSerie.style.fontSize = '12.5px';
        tdSerie.textContent = m.serie_autorizatie || '—';
        tr.appendChild(tdSerie);

        // Categorie
        const tdCat = document.createElement('td');
        tdCat.textContent = m.categorie || '—';
        tr.appendChild(tdCat);

        // Status
        const tdStatus = document.createElement('td');
        const stBadge = document.createElement('span');
        stBadge.className = 'status-badge ' + (m.status || 'activ');
        stBadge.textContent = formatStatusLabel(m.status);
        tdStatus.appendChild(stBadge);
        tr.appendChild(tdStatus);

        // Afișare site
        const tdPublic = document.createElement('td');
        const pubBadge = document.createElement('span');
        pubBadge.className = 'status-badge ' + (m.afisare_publica ? 'activ' : 'inactiv');
        pubBadge.textContent = m.afisare_publica ? '👁 Public' : '🚫 Ascuns';
        tdPublic.appendChild(pubBadge);
        tr.appendChild(tdPublic);

        // Acțiuni
        const tdActions = document.createElement('td');
        tdActions.style.textAlign = 'right';

        const actionsWrap = document.createElement('div');
        actionsWrap.style.display = 'inline-flex';
        actionsWrap.style.gap = '6px';

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn-secondary btn-sm';
        btnEdit.textContent = '✎ Editează';
        btnEdit.addEventListener('click', () => openEditMemberModal(m));
        actionsWrap.appendChild(btnEdit);

        const btnToggle = document.createElement('button');
        btnToggle.type = 'button';
        btnToggle.className = 'btn btn-sm ' + (m.afisare_publica ? 'btn-warning' : 'btn-success');
        btnToggle.textContent = m.afisare_publica ? 'Ascunde' : 'Afișează';
        btnToggle.addEventListener('click', async () => {
            await handleToggleMemberVisibility(m.id, !m.afisare_publica, btnToggle);
        });
        actionsWrap.appendChild(btnToggle);

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.textContent = '🗑';
        btnDelete.title = 'Șterge membru';
        btnDelete.addEventListener('click', async () => {
            if (confirm(`Ștergi definitiv membrul ${m.nume} (${m.id}) din registru?`)) {
                await handleDeleteMember(m.id, btnDelete);
            }
        });
        actionsWrap.appendChild(btnDelete);

        tdActions.appendChild(actionsWrap);
        tr.appendChild(tdActions);

        membersTableBody.appendChild(tr);
    });

    if (selectAllMembers) {
        const allOnPageSelected = items.length > 0 && items.every(m => state.selectedMemberIds.has(m.id));
        selectAllMembers.checked = allOnPageSelected;
    }
}

export function openAddMemberModal() {
    editingMemberId = null;
    const modalMember = document.getElementById('modal-member');
    const modalMemberTitle = document.getElementById('modal-member-title');
    const memberInputId = document.getElementById('member-input-id');
    const memberInputNume = document.getElementById('member-input-nume');
    const memberInputJudet = document.getElementById('member-input-judet');
    const memberInputSerie = document.getElementById('member-input-serie');
    const memberInputCategorie = document.getElementById('member-input-categorie');
    const memberInputStatus = document.getElementById('member-input-status');
    const memberInputPublic = document.getElementById('member-input-public');

    if (!modalMember) return;
    if (modalMemberTitle) modalMemberTitle.textContent = 'Adaugă membru nou';
    if (memberInputId) {
        memberInputId.value = '';
        memberInputId.disabled = false;
    }
    if (memberInputNume) memberInputNume.value = '';
    if (memberInputJudet) memberInputJudet.value = 'București';
    if (memberInputSerie) memberInputSerie.value = '';
    if (memberInputCategorie) memberInputCategorie.value = 'Categoria A';
    if (memberInputStatus) memberInputStatus.value = 'activ';
    if (memberInputPublic) memberInputPublic.checked = true;

    updateCharCounters();
    modalMember.classList.add('active');
    if (memberInputId) memberInputId.focus();
}

export function openEditMemberModal(m) {
    editingMemberId = m.id;
    const modalMember = document.getElementById('modal-member');
    const modalMemberTitle = document.getElementById('modal-member-title');
    const memberInputId = document.getElementById('member-input-id');
    const memberInputNume = document.getElementById('member-input-nume');
    const memberInputJudet = document.getElementById('member-input-judet');
    const memberInputSerie = document.getElementById('member-input-serie');
    const memberInputCategorie = document.getElementById('member-input-categorie');
    const memberInputStatus = document.getElementById('member-input-status');
    const memberInputPublic = document.getElementById('member-input-public');

    if (!modalMember) return;
    if (modalMemberTitle) modalMemberTitle.textContent = `Editează membru: ${m.nume} (${m.id})`;
    if (memberInputId) {
        memberInputId.value = m.id;
        memberInputId.disabled = true;
    }
    if (memberInputNume) memberInputNume.value = m.nume || '';
    if (memberInputJudet) memberInputJudet.value = m.judet || 'București';
    if (memberInputSerie) memberInputSerie.value = m.serie_autorizatie || '';
    if (memberInputCategorie) memberInputCategorie.value = m.categorie || 'Categoria A';
    if (memberInputStatus) memberInputStatus.value = m.status || 'activ';
    if (memberInputPublic) memberInputPublic.checked = !!m.afisare_publica;

    updateCharCounters();
    modalMember.classList.add('active');
    if (memberInputNume) memberInputNume.focus();
}

export function closeMemberModal() {
    const modalMember = document.getElementById('modal-member');
    if (modalMember) modalMember.classList.remove('active');
    editingMemberId = null;
}

export async function handleSaveMember() {
    const btnSaveMember = document.getElementById('btn-save-member');
    const memberInputId = document.getElementById('member-input-id');
    const memberInputNume = document.getElementById('member-input-nume');
    const memberInputJudet = document.getElementById('member-input-judet');
    const memberInputSerie = document.getElementById('member-input-serie');
    const memberInputCategorie = document.getElementById('member-input-categorie');
    const memberInputStatus = document.getElementById('member-input-status');
    const memberInputPublic = document.getElementById('member-input-public');

    const idVal = memberInputId ? memberInputId.value.trim() : '';
    const numeVal = memberInputNume ? memberInputNume.value.trim() : '';
    const judetVal = memberInputJudet ? memberInputJudet.value : 'București';
    const serieVal = memberInputSerie ? memberInputSerie.value.trim() : '';
    const categorieVal = memberInputCategorie ? memberInputCategorie.value : 'Categoria A';
    const statusVal = memberInputStatus ? memberInputStatus.value : 'activ';
    const publicVal = memberInputPublic ? memberInputPublic.checked : true;

    if (!idVal || /\s/.test(idVal)) {
        showToast('ID-ul este obligatoriu și fără spații (ex: UGR-0123).', 'error');
        return;
    }

    if (!numeVal || numeVal.length < 2 || numeVal.length > 120) {
        showToast('Numele trebuie să aibă între 2 și 120 de caractere.', 'error');
        return;
    }

    if (serieVal && serieVal.length > 80) {
        showToast('Seria nu poate depăși 80 de caractere.', 'error');
        return;
    }

    if (btnSaveMember) {
        btnSaveMember.disabled = true;
        btnSaveMember.textContent = 'Salvare...';
    }

    try {
        if (editingMemberId) {
            const { error } = await client
                .from('membri')
                .update({
                    nume: numeVal,
                    judet: judetVal,
                    serie_autorizatie: serieVal,
                    categorie: categorieVal,
                    status: statusVal,
                    afisare_publica: publicVal
                })
                .eq('id', editingMemberId);

            if (error) {
                showToast('Eroare: ' + error.message, 'error');
                return;
            }
            showToast(`Membrul «${numeVal}» a fost actualizat cu succes!`, 'success');
        } else {
            const { error } = await client
                .from('membri')
                .insert([{
                    id: idVal,
                    nume: numeVal,
                    judet: judetVal,
                    serie_autorizatie: serieVal,
                    categorie: categorieVal,
                    status: statusVal,
                    afisare_publica: publicVal
                }]);

            if (error) {
                if (error.code === '23505' || (error.message && error.message.includes('unique'))) {
                    showToast(`ID-ul «${idVal}» există deja. Alegeți alt ID.`, 'error');
                } else {
                    showToast('Eroare: ' + error.message, 'error');
                }
                return;
            }
            showToast(`Membrul «${numeVal}» (${idVal}) a fost adăugat!`, 'success');
        }

        closeMemberModal();
        await loadMembers();
    } catch (err) {
        showToast('Eroare de conexiune la salvarea membrului.', 'error');
    } finally {
        if (btnSaveMember) {
            btnSaveMember.disabled = false;
            btnSaveMember.textContent = 'Salvează membru';
        }
    }
}

export async function handleToggleMemberVisibility(memberId, newVisibility, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = '...';
    }

    try {
        const { error } = await client
            .from('membri')
            .update({ afisare_publica: newVisibility })
            .eq('id', memberId);

        if (error) {
            showToast('Eroare la actualizarea vizibilității: ' + error.message, 'error');
            return;
        }

        showToast(`Vizibilitate actualizată: ${newVisibility ? 'Public pe site' : 'Ascuns de pe site'}`, 'success');
        await loadMembers();
    } catch (err) {
        showToast('Eroare de rețea la actualizarea vizibilității.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
        }
    }
}

export async function handleDeleteMember(memberId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = '...';
    }

    try {
        const { error } = await client
            .from('membri')
            .delete()
            .eq('id', memberId);

        if (error) {
            showToast('Eroare la ștergere: ' + error.message, 'error');
            return;
        }

        showToast('Membrul a fost eliminat din registru.', 'success');
        await loadMembers();
    } catch (err) {
        showToast('Eroare de conexiune la ștergerea membrului.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
        }
    }
}
