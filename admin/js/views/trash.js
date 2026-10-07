/**
 * Trash View ("Coș de Reciclate")
 * Manages soft-deleted items across: membri, stiri, leadership, faq, documente
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';
import { writeRows, describeDbError } from '../lib/db.js';
import { formatDateOnlyRo } from '../lib/format.js';

let pendingPurgeItem = null;

// T-J5: categoriile care nu au putut fi citite la ultimul loadTrash().
// Reținute la nivel de modul ca mesajul din listă să nu se piardă la re-render.
let failedTrashSources = [];

// T-J5: numele afișate în coș. Cheia e starea locală a view-ului (tabelul
// sursă), nu o coloană din baza de date.
const TRASH_SOURCES = [
    { tabel: 'membri', tipLabel: 'Membru Registru' },
    { tabel: 'stiri', tipLabel: 'Articol Știre' },
    { tabel: 'leadership', tipLabel: 'Membru Conducere' },
    { tabel: 'faq', tipLabel: 'Întrebare Frecventă' },
    { tabel: 'documente', tipLabel: 'Document Oficial' }
];

export async function loadTrash() {
    const list = document.getElementById('trash-items-list');
    const badgeNav = document.getElementById('badge-nav-trash');

    if (list) {
        clearElement(list);
        list.appendChild(el('div', { className: 'loading-pulse' }, ['Se încarcă elementele din coșul de reciclate...']));
    }

    try {
        const responses = await Promise.all([
            client.from('membri').select('*').not('deleted_at', 'is', null),
            client.from('stiri').select('*').not('deleted_at', 'is', null),
            client.from('leadership').select('*').not('deleted_at', 'is', null),
            client.from('faq').select('*').not('deleted_at', 'is', null),
            client.from('documente').select('*').not('deleted_at', 'is', null)
        ]);

        // T-J5: Promise.all nu arunca la un .error per-tabel, deci o politică
        // RLS reușită pe un tabel și refuzată pe altul arădea un coș gol, ca și
        // când nu ar fi fost nimic de șters. Verificăm fiecare răspuns separat.
        const byTable = {};
        const failedTables = [];
        responses.forEach((res, index) => {
            const { tabel, tipLabel } = TRASH_SOURCES[index];
            if (res.error) {
                failedTables.push(tipLabel);
                byTable[tabel] = [];
            } else {
                byTable[tabel] = res.data || [];
            }
        });

        failedTrashSources = failedTables;

        if (failedTables.length > 0) {
            showToast(
                `Nu s-au putut încărca toate categoriile din coș: ${failedTables.join(', ')}. ` +
                'Este posibil ca rolul curent să nu aibă acces la acele tabele.',
                'error'
            );
        }

        const trashItems = [];

        byTable.membri.forEach(m => {
            trashItems.push({
                id: m.id,
                tabel: 'membri',
                tipLabel: 'Membru Registru',
                titlu: `${m.nume} (${m.id})`,
                subtitlu: `${m.judet || 'București'} • ${m.categorie || 'Categoria B'}`,
                deleted_at: m.deleted_at
            });
        });

        // T-J5: coloana din baza de date este data_publicare. Rândul precedent
        // citea s.data, o coloană inexistentă, deci data nu apărea niciodată.
        byTable.stiri.forEach(s => {
            trashItems.push({
                id: s.id,
                tabel: 'stiri',
                tipLabel: 'Articol Știre',
                titlu: s.titlu,
                subtitlu: `Publicat la: ${s.data_publicare ? formatDateOnlyRo(s.data_publicare) : '—'} • Categorie: ${s.categorie || 'General'}`,
                deleted_at: s.deleted_at
            });
        });

        byTable.leadership.forEach(l => {
            trashItems.push({
                id: l.id,
                tabel: 'leadership',
                tipLabel: 'Membru Conducere',
                titlu: `${l.nume} (${l.functie})`,
                subtitlu: `Grup: ${l.grup === 'filiala' ? 'Filiala Sector 1' : 'Biroul Executiv Central'}`,
                deleted_at: l.deleted_at
            });
        });

        byTable.faq.forEach(f => {
            trashItems.push({
                id: f.id,
                tabel: 'faq',
                tipLabel: 'Întrebare Frecventă',
                titlu: f.intrebare,
                subtitlu: `Categorie: ${f.categorie || 'aderare'}`,
                deleted_at: f.deleted_at
            });
        });

        byTable.documente.forEach(d => {
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
        failedTrashSources = [];
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

    // T-J5: dacă o categorie nu s-a putut încărca, lista nu este cu adevărat
        // goală. Mesajul spune explicit asta, în loc să sugereze că
        // administratorul a golit coșul.
        if (items.length === 0) {
            const notice = el('div', { className: 'empty-notice' }, [
                failedTrashSources.length > 0
                    ? `Nu s-au putut încărca categoriile: ${failedTrashSources.join(', ')}. Restul coșului este gol.`
                    : 'Coșul de reciclate este gol.'
            ]);
            list.appendChild(notice);
            return;
        }

        if (failedTrashSources.length > 0) {
            list.appendChild(el('p', {
                style: { fontSize: '12px', margin: '0 0 12px', color: 'var(--error, #ef4444)' }
            }, [`⚠️ Nu s-au putut încărca categoriile: ${failedTrashSources.join(', ')}.`]));
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
    // T-J5: tabelul vine din lista randată în view, nu din input exterior.
    // Totuși, orice tabel primit prin cale greșită ar ajunge în .from() și ar
    // putea șterge/crea rânduri într-o tabelă neașteptată.
    const TABLES = ['membri', 'stiri', 'leadership', 'faq', 'documente'];
    if (!TABLES.includes(table)) {
        showToast('Tabel necunoscut pentru restaurare. Operațiunea a fost oprită.', 'error');
        return;
    }

    try {
        // T-J2: .select('id') — altfel o restaurare blocată de RLS ar raporta succes
        const { error } = await writeRows(
            client
                .from(table)
                .update({ deleted_at: null })
                .eq('id', id)
                .select('id'),
            { context: `restaurarea elementului «${title || id}» din ${table}` }
        );

        if (error) throw error;

        showToast(`Elementul «${title || id}» a fost restaurat cu succes!`, 'success');
        await loadTrash();
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la restaurare.'), 'error');
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

    if (!TRASH_SOURCES.some(src => src.tabel === table)) {
        closePurgeModal();
        showToast('Tabel necunoscut pentru ștergere definitivă. Operațiunea a fost oprită.', 'error');
        return;
    }

    const btnConfirm = document.getElementById('btn-confirm-purge');
    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Se șterge definitiv...';
    }

    try {
        const { error } = await writeRows(
            client
                .from(table)
                .delete()
                .eq('id', id)
                .select('id'),
            { context: `ștergerea definitivă a elementului «${title}» din ${table}` }
        );

        if (error) throw error;

        showToast(`Elementul «${title}» a fost șters definitiv din baza de date.`, 'info');
        closePurgeModal();
        await loadTrash();
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la ștergerea definitivă.'), 'error');
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

    if (oldItems.length === 0) {
        showToast('Nu există elemente mai vechi de 30 de zile în coș.', 'info');
        return;
    }

    let purgedCount = 0;
    const failed = [];
    for (const it of oldItems) {
        try {
            // T-J2: .select('id') ca să numărăm doar ștergerile reușite
            const { error } = await writeRows(
                client
                    .from(it.tabel)
                    .delete()
                    .eq('id', it.id)
                    .select('id'),
                { context: `ștergerea automată a elementului ${it.id} din ${it.tabel}` }
            );

            if (error) throw error;
            purgedCount++;
        } catch (e) {
            // Continuă pentru celelalte, dar reținem elementele pentru raport
            failed.push(`${it.tabel}#${it.id}`);
        }
    }

    if (failed.length === 0) {
        showToast(`Au fost eliminate definitiv ${purgedCount} elemente expirate.`, 'info');
    } else {
        showToast(
            `Au fost eliminate definitiv ${purgedCount} din ${oldItems.length} elemente expirate. ` +
            `${failed.length} au eșuat și au rămas în coș: ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? '…' : ''}`,
            'warning'
        );
    }
    await loadTrash();
}
