/**
 * Trash View ("Coș de Reciclate")
 * Manages soft-deleted items across: membri, stiri, leadership, faq, documente
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';

let pendingPurgeItem = null;

export async function loadTrash() {
    const list = document.getElementById('trash-items-list');
    const badgeNav = document.getElementById('badge-nav-trash');

    if (list) {
        clearElement(list);
        list.appendChild(el('div', { className: 'loading-pulse' }, ['Se încarcă elementele din coșul de reciclate...']));
    }

    try {
        const [resMembri, resStiri, resLeader, resFaq, resDoc] = await Promise.all([
            client.from('membri').select('*').not('deleted_at', 'is', null),
            client.from('stiri').select('*').not('deleted_at', 'is', null),
            client.from('leadership').select('*').not('deleted_at', 'is', null),
            client.from('faq').select('*').not('deleted_at', 'is', null),
            client.from('documente').select('*').not('deleted_at', 'is', null)
        ]);

        const trashItems = [];

        (resMembri.data || []).forEach(m => {
            trashItems.push({
                id: m.id,
                tabel: 'membri',
                tipLabel: 'Membru Registru',
                titlu: `${m.nume} (${m.id})`,
                subtitlu: `${m.judet || 'București'} • ${m.categorie || 'Categoria B'}`,
                deleted_at: m.deleted_at
            });
        });

        (resStiri.data || []).forEach(s => {
            trashItems.push({
                id: s.id,
                tabel: 'stiri',
                tipLabel: 'Articol Știre',
                titlu: s.titlu,
                subtitlu: `Publicat la: ${s.data || '—'} • Categorie: ${s.categorie || 'General'}`,
                deleted_at: s.deleted_at
            });
        });

        (resLeader.data || []).forEach(l => {
            trashItems.push({
                id: l.id,
                tabel: 'leadership',
                tipLabel: 'Membru Conducere',
                titlu: `${l.nume} (${l.functie})`,
                subtitlu: `Grup: ${l.grup === 'filiala' ? 'Filiala Sector 1' : 'Biroul Executiv Central'}`,
                deleted_at: l.deleted_at
            });
        });

        (resFaq.data || []).forEach(f => {
            trashItems.push({
                id: f.id,
                tabel: 'faq',
                tipLabel: 'Întrebare Frecventă',
                titlu: f.intrebare,
                subtitlu: `Categorie: ${f.categorie || 'aderare'}`,
                deleted_at: f.deleted_at
            });
        });

        (resDoc.data || []).forEach(d => {
            trashItems.push({
                id: d.id,
                tabel: 'documente',
                tipLabel: 'Document Oficial',
                titlu: d.titlu,
                subtitlu: `Format: ${d.tip || 'DOCX'} • Fișier: ${d.fisier_url}`,
                deleted_at: d.deleted_at
            });
        });

        // Ordonare descrescătoare după data ștergerii
        trashItems.sort((a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0));

        state.allTrashData = trashItems;

        if (badgeNav) {
            badgeNav.textContent = trashItems.length;
            badgeNav.style.display = trashItems.length > 0 ? '' : 'none';
        }

        renderTrashList();
    } catch (err) {
        showToast(`Eroare la încărcarea coșului de reciclate: ${err.message}`, 'error');
        if (list) {
            clearElement(list);
            list.appendChild(el('p', { className: 'text-error' }, [`Eroare: ${err.message}`]));
        }
    }
}

export function renderTrashList() {
    const list = document.getElementById('trash-items-list');
    const autoPurgeBanner = document.getElementById('trash-autopurge-banner');
    if (!list) return;

    clearElement(list);

    let items = [...state.allTrashData];

    // Filtrare tip tabelă
    if (state.trashFilterType && state.trashFilterType !== 'toate') {
        items = items.filter(it => it.tabel === state.trashFilterType);
    }

    // Filtrare căutare
    if (state.trashSearchQuery) {
        const q = state.trashSearchQuery.toLowerCase();
        items = items.filter(it => 
            (it.titlu && it.titlu.toLowerCase().includes(q)) ||
            (it.subtitlu && it.subtitlu.toLowerCase().includes(q))
        );
    }

    // Verificare elemente mai vechi de 30 de zile
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const oldItems = state.allTrashData.filter(it => it.deleted_at && (now - new Date(it.deleted_at).getTime()) > thirtyDaysMs);

    if (autoPurgeBanner) {
        if (oldItems.length > 0 && (state.adminRecord?.rol === 'owner')) {
            autoPurgeBanner.style.display = 'flex';
            const countSpan = document.getElementById('trash-old-count');
            if (countSpan) countSpan.textContent = oldItems.length;
        } else {
            autoPurgeBanner.style.display = 'none';
        }
    }

    if (items.length === 0) {
        list.appendChild(el('div', { className: 'empty-notice' }, ['Coșul de reciclate este gol.']));
        return;
    }

    const isOwner = state.adminRecord?.rol === 'owner';

    items.forEach(item => {
        const card = el('div', { className: 'cms-card trash-card', 'data-id': item.id });

        const dateStr = item.deleted_at 
            ? new Date(item.deleted_at).toLocaleString('ro-RO')
            : 'recent';

        const header = el('div', { className: 'trash-card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
                el('span', { className: `badge-pill badge-trash-type badge-${item.tabel}` }, [item.tipLabel]),
                el('span', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, [`Șters la: ${dateStr}`])
            ]),
            el('div', { style: { display: 'flex', gap: '8px' } }, [
                el('button', {
                    type: 'button',
                    className: 'btn btn-secondary btn-sm',
                    onClick: () => handleRestoreTrashItem(item.tabel, item.id, item.titlu)
                }, ['♻️ Restaurează']),
                isOwner ? el('button', {
                    type: 'button',
                    className: 'btn btn-danger btn-sm',
                    onClick: () => openPurgeModal(item.tabel, item.id, item.titlu)
                }, ['🗑️ Șterge definitiv']) : null
            ])
        ]);

        const body = el('div', { style: { marginTop: '10px' } }, [
            el('h4', { style: { fontSize: '15px', color: '#ffffff', margin: '0 0 4px 0' } }, [item.titlu]),
            el('p', { style: { fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 } }, [item.subtitlu])
        ]);

        card.appendChild(header);
        card.appendChild(body);
        list.appendChild(card);
    });
}

export async function handleRestoreTrashItem(table, id, title) {
    try {
        const { error } = await client
            .from(table)
            .update({ deleted_at: null })
            .eq('id', id);

        if (error) throw error;

        showToast(`Elementul «${title || id}» a fost restaurat cu succes!`, 'success');
        await loadTrash();
    } catch (err) {
        showToast(`Eroare la restaurare: ${err.message}`, 'error');
    }
}

export function openPurgeModal(table, id, title) {
    pendingPurgeItem = { table, id, title };
    const modal = document.getElementById('modal-purge-confirm');
    const targetTitle = document.getElementById('purge-target-title');
    const confirmInput = document.getElementById('purge-confirm-input');
    const btnConfirm = document.getElementById('btn-confirm-purge');

    if (modal) {
        if (targetTitle) targetTitle.textContent = title;
        if (confirmInput) confirmInput.value = '';
        if (btnConfirm) btnConfirm.disabled = true;
        modal.classList.add('active');
        if (confirmInput) confirmInput.focus();
    }
}

export function closePurgeModal() {
    const modal = document.getElementById('modal-purge-confirm');
    if (modal) modal.classList.remove('active');
    pendingPurgeItem = null;
}

export async function handleConfirmPurge() {
    if (!pendingPurgeItem) return;
    const { table, id, title } = pendingPurgeItem;

    const btnConfirm = document.getElementById('btn-confirm-purge');
    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Se șterge definitiv...';
    }

    try {
        const { error } = await client
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast(`Elementul «${title}» a fost șters definitiv din baza de date.`, 'info');
        closePurgeModal();
        await loadTrash();
    } catch (err) {
        showToast(`Eroare la ștergerea definitivă: ${err.message}`, 'error');
    } finally {
        if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.textContent = 'Șterge definitiv';
        }
    }
}

export async function handlePurgeOldTrash() {
    if (!confirm('Sunteți sigur că doriți să ștergeți definitiv toate elementele mai vechi de 30 de zile? Această acțiune este ireversibilă.')) {
        return;
    }

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const oldItems = state.allTrashData.filter(it => it.deleted_at && (now - new Date(it.deleted_at).getTime()) > thirtyDaysMs);

    let purgedCount = 0;
    for (const it of oldItems) {
        try {
            await client.from(it.tabel).delete().eq('id', it.id);
            purgedCount++;
        } catch (e) {
            // Continuă pentru celelalte
        }
    }

    showToast(`Au fost eliminate definitiv ${purgedCount} elemente expirate.`, 'info');
    await loadTrash();
}
