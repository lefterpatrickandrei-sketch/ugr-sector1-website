/**
 * Item Modification History & Audit Diff ("Istoric Modificări")
 * Queries public.audit_log for a specific item and provides field-level rollback
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';

let activeHistoryContext = null;

export async function openItemHistoryModal(table, rowId, rowTitle) {
    activeHistoryContext = { table, rowId, rowTitle };

    const modal = document.getElementById('modal-item-history');
    const titleEl = document.getElementById('history-modal-item-title');
    const timelineEl = document.getElementById('history-timeline-container');

    if (!modal || !timelineEl) return;

    if (titleEl) {
        titleEl.textContent = `Istoric: ${rowTitle || rowId}`;
    }

    clearElement(timelineEl);
    timelineEl.appendChild(el('div', { className: 'loading-pulse' }, ['Se încarcă istoricul de modificări din registrul de audit...']));

    modal.classList.add('active');

    try {
        const { data, error } = await client
            .from('audit_log')
            .select('*')
            .eq('tabel', table)
            .eq('rand_id', String(rowId))
            .order('ts', { ascending: false })
            .limit(50);

        if (error) throw error;

        renderHistoryTimeline(data || []);
    } catch (err) {
        showToast(`Eroare la citirea istoricului: ${err.message}`, 'error');
        clearElement(timelineEl);
        timelineEl.appendChild(el('p', { className: 'text-error' }, [`Nu s-a putut citi istoricul: ${err.message}`]));
    }
}

export function closeItemHistoryModal() {
    const modal = document.getElementById('modal-item-history');
    if (modal) modal.classList.remove('active');
    activeHistoryContext = null;
}

export function renderHistoryTimeline(logs) {
    const timelineEl = document.getElementById('history-timeline-container');
    if (!timelineEl) return;

    clearElement(timelineEl);

    if (logs.length === 0) {
        timelineEl.appendChild(el('div', { className: 'empty-notice' }, [
            'Nu există evenimente de audit înregistrate pentru acest element.'
        ]));
        return;
    }

    const isOwnerOrEditor = state.adminRecord?.rol === 'owner' || state.adminRecord?.rol === 'editor';

    logs.forEach((log, index) => {
        const card = el('div', { className: 'cms-card history-entry-card', style: { marginBottom: '16px' } });

        const dateStr = log.ts ? new Date(log.ts).toLocaleString('ro-RO') : '—';
        let actionBadgeClass = 'badge-subtle';
        if (log.actiune === 'INSERT') actionBadgeClass = 'badge-success';
        else if (log.actiune === 'UPDATE') actionBadgeClass = 'badge-warning';
        else if (log.actiune === 'DELETE') actionBadgeClass = 'badge-danger';

        const header = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }, [
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
                el('span', { className: `status-badge ${actionBadgeClass}` }, [log.actiune]),
                el('span', { style: { fontSize: '13px', fontWeight: '600', color: '#ffffff' } }, [dateStr]),
                el('span', { style: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Space Mono' } }, [
                    log.admin_id ? `Admin: ${log.admin_id.slice(0, 8)}...` : 'Sistem / Anon'
                ])
            ]),
            (log.actiune === 'UPDATE' && log.vechi && isOwnerOrEditor) ? el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-sm',
                style: { fontSize: '11px', padding: '3px 8px' },
                onClick: () => handleRestoreSnapshot(log.vechi, dateStr)
            }, ['↩️ Restaurează această versiune']) : null
        ]);

        card.appendChild(header);

        // Diff câmpuri
        const diffTable = buildDiffTable(log.vechi, log.nou, log.actiune);
        if (diffTable) {
            card.appendChild(diffTable);
        }

        timelineEl.appendChild(card);
    });
}

function buildDiffTable(oldObj, newObj, actiune) {
    if (actiune === 'INSERT') {
        const table = el('table', { className: 'cms-table', style: { fontSize: '12px' } });
        const tbody = el('tbody');
        const keys = Object.keys(newObj || {}).filter(k => !['id', 'creat_la', 'actualizat_la'].includes(k));

        keys.forEach(k => {
            const val = formatDiffVal(newObj[k]);
            tbody.appendChild(el('tr', {}, [
                el('td', { style: { width: '30%', fontWeight: '600', color: 'var(--cyan)' } }, [k]),
                el('td', { style: { color: 'var(--success)' } }, [val])
            ]));
        });
        table.appendChild(tbody);
        return table;
    }

    if (actiune === 'UPDATE') {
        const oldO = oldObj || {};
        const newO = newObj || {};
        const allKeys = Array.from(new Set([...Object.keys(oldO), ...Object.keys(newO)]))
            .filter(k => !['id', 'actualizat_la'].includes(k));

        const changedKeys = allKeys.filter(k => JSON.stringify(oldO[k]) !== JSON.stringify(newO[k]));

        if (changedKeys.length === 0) {
            return el('div', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, ['Niciun câmp modificat detectat.']);
        }

        const table = el('table', { className: 'cms-table', style: { fontSize: '12px' } });
        const thead = el('thead', {}, [
            el('tr', {}, [
                el('th', { style: { width: '25%' } }, ['Câmp']),
                el('th', { style: { width: '37%' } }, ['Valoare anterioară']),
                el('th', { style: { width: '38%' } }, ['Valoare nouă'])
            ])
        ]);
        const tbody = el('tbody');

        changedKeys.forEach(k => {
            const vOld = formatDiffVal(oldO[k]);
            const vNew = formatDiffVal(newO[k]);

            tbody.appendChild(el('tr', { className: 'row-diff-changed' }, [
                el('td', { style: { fontWeight: '600', color: 'var(--cyan)' } }, [k]),
                el('td', { style: { color: '#f87171', background: 'rgba(239, 68, 68, 0.08)' } }, [vOld]),
                el('td', { style: { color: '#34d399', background: 'rgba(16, 185, 129, 0.08)' } }, [vNew])
            ]));
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    if (actiune === 'DELETE') {
        return el('div', { style: { fontSize: '12px', color: '#f87171' } }, [
            'Înregistrarea a fost ștearsă în acest punct.'
        ]);
    }

    return null;
}

function formatDiffVal(val) {
    if (val === null || val === undefined) return '— (nul)';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'object') return JSON.stringify(val);
    const s = String(val);
    return s.length > 120 ? (s.slice(0, 120) + '...') : s;
}

export async function handleRestoreSnapshot(snapshot, snapshotDate) {
    if (!activeHistoryContext || !snapshot) return;
    const { table, rowId } = activeHistoryContext;

    if (!confirm(`Sunteți sigur că doriți să restaurați starea acestui element de la data de ${snapshotDate}?`)) {
        return;
    }

    // Eliminare câmpuri de sistem
    const cleanPayload = { ...snapshot };
    delete cleanPayload.id;
    delete cleanPayload.creat_la;
    delete cleanPayload.actualizat_la;

    try {
        const { error } = await client
            .from(table)
            .update(cleanPayload)
            .eq('id', rowId);

        if (error) throw error;

        showToast('Versiunea anterioară a fost restaurată cu succes!', 'success');
        closeItemHistoryModal();

        // Refresh corespunzător dacă utilizatorul e pe o vedere deschisă
        window.dispatchEvent(new CustomEvent('ugr:item-restored', { detail: { table, rowId } }));
    } catch (err) {
        showToast(`Eroare la restaurarea versiunii: ${err.message}`, 'error');
    }
}
