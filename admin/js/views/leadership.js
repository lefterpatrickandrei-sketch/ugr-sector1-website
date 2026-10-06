/**
 * Leadership View ("Conducere")
 * Manages public.leadership (Birou Executiv Central & Conducere Filiala Sector 1)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';
import { openItemHistoryModal } from './history.js';

let editingLeaderId = null;

export async function loadLeadership() {
    const listFiliala = document.getElementById('leadership-list-filiala');
    const listCentral = document.getElementById('leadership-list-central');

    if (listFiliala) {
        clearElement(listFiliala);
        listFiliala.appendChild(el('div', { className: 'loading-pulse' }, ['Se încarcă membrii conducerii filialei...']));
    }
    if (listCentral) {
        clearElement(listCentral);
        listCentral.appendChild(el('div', { className: 'loading-pulse' }, ['Se încarcă Biroul Executiv central...']));
    }

    try {
        const { data, error } = await client
            .from('leadership')
            .select('*')
            .is('deleted_at', null)
            .order('ordine', { ascending: true });

        if (error) throw error;

        state.allLeadershipData = data || [];
        renderLeadershipLists();
    } catch (err) {
        showToast(`Eroare la încărcarea conducerii: ${err.message}`, 'error');
        if (listFiliala) {
            clearElement(listFiliala);
            listFiliala.appendChild(el('p', { className: 'text-error' }, [`Eroare: ${err.message}`]));
        }
    }
}

export function renderLeadershipLists() {
    const listFiliala = document.getElementById('leadership-list-filiala');
    const listCentral = document.getElementById('leadership-list-central');

    if (!listFiliala || !listCentral) return;

    clearElement(listFiliala);
    clearElement(listCentral);

    const filialaItems = state.allLeadershipData.filter(l => l.grup === 'filiala');
    const centralItems = state.allLeadershipData.filter(l => l.grup === 'central');

    // Filiala
    if (filialaItems.length === 0) {
        listFiliala.appendChild(el('div', { className: 'empty-notice' }, ['Nu există membri înregistrați pentru Filiala Sector 1.']));
    } else {
        filialaItems.forEach((leader, idx) => {
            listFiliala.appendChild(createLeaderCard(leader, idx, filialaItems.length));
        });
    }

    // Central
    if (centralItems.length === 0) {
        listCentral.appendChild(el('div', { className: 'empty-notice' }, ['Nu există membri înregistrați pentru conducerea centrală.']));
    } else {
        centralItems.forEach((leader, idx) => {
            listCentral.appendChild(createLeaderCard(leader, idx, centralItems.length));
        });
    }
}

function createLeaderCard(leader, index, totalInGroup) {
    const isOwnerOrEditor = state.adminRecord?.rol === 'owner' || state.adminRecord?.rol === 'editor';
    const isOwner = state.adminRecord?.rol === 'owner';

    const card = el('div', { className: 'cms-card leader-card', 'data-id': leader.id });

    // Foto / Avatar
    const avatar = leader.foto_url 
        ? el('img', { src: leader.foto_url, alt: leader.nume, className: 'leader-card-avatar' })
        : el('div', { className: 'leader-card-avatar avatar-placeholder' }, [leader.nume.slice(0, 2).toUpperCase()]);

    // Info
    const info = el('div', { className: 'leader-card-info' }, [
        el('div', { className: 'leader-card-header' }, [
            el('h4', { className: 'leader-card-name' }, [leader.nume]),
            el('span', { className: `status-badge ${leader.afisare_publica ? 'badge-success' : 'badge-subtle'}` }, [
                leader.afisare_publica ? '👁️ Public' : '🔒 Ascuns'
            ]),
            state.uiMode === 'avansat' 
                ? el('span', { className: 'badge-tech' }, [`Ord: ${leader.ordine}`])
                : null
        ]),
        el('div', { className: 'leader-card-role' }, [leader.functie]),
        leader.descriere ? el('p', { className: 'leader-card-desc' }, [leader.descriere]) : null,
        el('div', { className: 'leader-card-contacts' }, [
            leader.telefon ? el('span', { className: 'leader-contact-item' }, [`📞 ${leader.telefon}`]) : null,
            leader.email ? el('span', { className: 'leader-contact-item' }, [`✉️ ${leader.email}`]) : null
        ])
    ]);

    // Acțiuni (Reordonare & Editare)
    const actions = el('div', { className: 'leader-card-actions' }, [
        // Reordonare sus/jos
        isOwnerOrEditor ? el('div', { className: 'order-btn-group' }, [
            el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-xs',
                title: 'Mută mai sus',
                disabled: index === 0,
                onClick: () => handleReorderLeader(leader, -1)
            }, ['▲']),
            el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-xs',
                title: 'Mută mai jos',
                disabled: index === totalInGroup - 1,
                onClick: () => handleReorderLeader(leader, 1)
            }, ['▼'])
        ]) : null,

        // Toggle vizibilitate
        isOwnerOrEditor ? el('button', {
            type: 'button',
            className: `btn btn-sm ${leader.afisare_publica ? 'btn-secondary' : 'btn-warning'}`,
            title: leader.afisare_publica ? 'Ascunde de pe site' : 'Afișează public pe site',
            onClick: () => handleToggleVisibility(leader)
        }, [leader.afisare_publica ? 'Ascunde' : 'Afișează']) : null,

        // Istoric (Audit diff)
        el('button', {
            type: 'button',
            className: 'btn btn-secondary btn-sm',
            title: 'Vezi istoricul modificărilor',
            onClick: () => openItemHistoryModal('leadership', leader.id, `${leader.nume} (${leader.functie})`)
        }, ['🕒']),

        // Edit
        isOwnerOrEditor ? el('button', {
            type: 'button',
            className: 'btn btn-secondary btn-sm',
            onClick: () => openEditLeaderModal(leader)
        }, ['✏️ Editează']) : null,

        // Delete (doar owner)
        isOwner ? el('button', {
            type: 'button',
            className: 'btn btn-danger btn-sm',
            onClick: () => handleDeleteLeader(leader)
        }, ['🗑️']) : null
    ]);

    card.appendChild(avatar);
    card.appendChild(info);
    card.appendChild(actions);

    return card;
}

export function openAddLeaderModal(defaultGroup = 'filiala') {
    editingLeaderId = null;
    const modal = document.getElementById('modal-leader');
    const title = document.getElementById('modal-leader-title');
    const form = document.getElementById('form-leader');

    if (title) title.textContent = 'Adăugare Membru Conducere';
    if (form) form.reset();

    const groupSelect = document.getElementById('leader-grup');
    if (groupSelect) groupSelect.value = defaultGroup;

    const visibleInput = document.getElementById('leader-afisare');
    if (visibleInput) visibleInput.checked = true;

    if (modal) modal.classList.add('active');
}

export function openEditLeaderModal(leader) {
    editingLeaderId = leader.id;
    const modal = document.getElementById('modal-leader');
    const title = document.getElementById('modal-leader-title');

    if (title) title.textContent = `Editare: ${leader.nume}`;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('leader-grup', leader.grup);
    setVal('leader-nume', leader.nume);
    setVal('leader-functie', leader.functie);
    setVal('leader-descriere', leader.descriere);
    setVal('leader-telefon', leader.telefon);
    setVal('leader-email', leader.email);
    setVal('leader-foto', leader.foto_url);
    setVal('leader-ordine', leader.ordine);

    const visibleInput = document.getElementById('leader-afisare');
    if (visibleInput) visibleInput.checked = leader.afisare_publica;

    if (modal) modal.classList.add('active');
}

export function closeLeaderModal() {
    const modal = document.getElementById('modal-leader');
    if (modal) modal.classList.remove('active');
    editingLeaderId = null;
}

export async function handleSaveLeader(e) {
    if (e) e.preventDefault();

    const getVal = (id) => document.getElementById(id)?.value.trim() || '';
    const nume = getVal('leader-nume');
    const functie = getVal('leader-functie');

    if (!nume || !functie) {
        showToast('Numele și funcția sunt câmpuri obligatorii.', 'warning');
        return;
    }

    const payload = {
        grup: getVal('leader-grup') || 'filiala',
        nume,
        functie,
        descriere: getVal('leader-descriere') || null,
        telefon: getVal('leader-telefon') || null,
        email: getVal('leader-email') || null,
        foto_url: getVal('leader-foto') || null,
        ordine: parseInt(getVal('leader-ordine') || '0', 10),
        afisare_publica: document.getElementById('leader-afisare')?.checked ?? true
    };

    try {
        if (editingLeaderId) {
            const { error } = await client
                .from('leadership')
                .update(payload)
                .eq('id', editingLeaderId);
            if (error) throw error;
            showToast('Membru conducere actualizat cu succes!', 'success');
        } else {
            const { error } = await client
                .from('leadership')
                .insert([payload]);
            if (error) throw error;
            showToast('Membru conducere adăugat cu succes!', 'success');
        }

        closeLeaderModal();
        await loadLeadership();
    } catch (err) {
        showToast(`Eroare la salvare: ${err.message}`, 'error');
    }
}

export async function handleToggleVisibility(leader) {
    try {
        const nextState = !leader.afisare_publica;
        const { error } = await client
            .from('leadership')
            .update({ afisare_publica: nextState })
            .eq('id', leader.id);

        if (error) throw error;

        leader.afisare_publica = nextState;
        renderLeadershipLists();
        showToast(`Vizibilitatea pentru ${leader.nume} a fost modificată.`, 'info');
    } catch (err) {
        showToast(`Eroare: ${err.message}`, 'error');
    }
}

export async function handleReorderLeader(leader, delta) {
    const groupItems = state.allLeadershipData.filter(l => l.grup === leader.grup);
    const currentIndex = groupItems.findIndex(l => l.id === leader.id);
    const targetIndex = currentIndex + delta;

    if (targetIndex < 0 || targetIndex >= groupItems.length) return;

    const targetLeader = groupItems[targetIndex];
    const currentOrder = leader.ordine;
    const targetOrder = targetLeader.ordine;

    try {
        // Swap orders
        await client.from('leadership').update({ ordine: targetOrder }).eq('id', leader.id);
        await client.from('leadership').update({ ordine: currentOrder }).eq('id', targetLeader.id);

        leader.ordine = targetOrder;
        targetLeader.ordine = currentOrder;

        state.allLeadershipData.sort((a, b) => a.ordine - b.ordine);
        renderLeadershipLists();
        showToast('Ordinea a fost actualizată!', 'success');
    } catch (err) {
        showToast(`Eroare la reordonare: ${err.message}`, 'error');
    }
}

export async function handleDeleteLeader(leader) {
    if (!confirm(`Sunteți sigur că doriți să ștergeți pe ${leader.nume} (${leader.functie})?`)) {
        return;
    }

    try {
        // Soft delete (deleted_at = now)
        const { error } = await client
            .from('leadership')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', leader.id);

        if (error) throw error;

        showToast(`${leader.nume} a fost șters (mutat în arhivă).`, 'info');
        await loadLeadership();
    } catch (err) {
        showToast(`Eroare la ștergere: ${err.message}`, 'error');
    }
}
