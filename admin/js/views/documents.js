/**
 * Documents View ("Documente Oficiale")
 * Manages public.documente (Formulare tipizate, Statut, Cereri adeziune)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';
import { openItemHistoryModal } from './history.js';
import { writeRows, describeDbError } from '../lib/db.js';

let editingDocId = null;

export async function loadDocuments() {
    const list = document.getElementById('documents-items-list');
    if (list) {
        clearElement(list);
        list.appendChild(el('div', { className: 'loading-pulse' }, ['Se încarcă documentele oficiale...']));
    }

    try {
        const { data, error } = await client
            .from('documente')
            .select('*')
            .is('deleted_at', null)
            .order('ordine', { ascending: true });

        if (error) throw error;

        state.allDocumentsData = data || [];
        renderDocumentsList();
    } catch (err) {
        showToast(`Eroare la încărcarea documentelor: ${err.message}`, 'error');
        if (list) {
            clearElement(list);
            list.appendChild(el('p', { className: 'text-error' }, [`Eroare: ${err.message}`]));
        }
    }
}

export function renderDocumentsList() {
    const list = document.getElementById('documents-items-list');
    if (!list) return;

    clearElement(list);

    let items = [...state.allDocumentsData];

    if (state.documentsSearchQuery) {
        const q = state.documentsSearchQuery.toLowerCase();
        items = items.filter(d => 
            (d.titlu && d.titlu.toLowerCase().includes(q)) ||
            (d.descriere && d.descriere.toLowerCase().includes(q)) ||
            (d.tip && d.tip.toLowerCase().includes(q))
        );
    }

    if (items.length === 0) {
        list.appendChild(el('div', { className: 'empty-notice' }, ['Nu s-au găsit documente oficiale conform căutării.']));
        return;
    }

    items.forEach((doc, idx) => {
        list.appendChild(createDocumentCard(doc, idx, items.length));
    });
}

function createDocumentCard(doc, index, totalItems) {
    const isOwnerOrEditor = state.adminRecord?.rol === 'owner' || state.adminRecord?.rol === 'editor';
    const isOwner = state.adminRecord?.rol === 'owner';

    const card = el('div', { className: 'cms-card doc-card', 'data-id': doc.id });

    // File icon based on type
    const isPdf = (doc.tip && doc.tip.toLowerCase().includes('pdf')) || doc.fisier_url.endsWith('.pdf');
    const iconSymbol = isPdf ? '📄' : '📝';

    const iconBox = el('div', { className: 'doc-card-icon' }, [iconSymbol]);

    const info = el('div', { className: 'doc-card-info' }, [
        el('div', { className: 'doc-card-header' }, [
            el('h4', { className: 'doc-card-title' }, [doc.titlu]),
            doc.badge ? el('span', { className: 'badge-pill' }, [doc.badge]) : null,
            el('span', { className: 'badge-tech' }, [doc.tip || 'Document']),
            el('span', { className: `status-badge ${doc.publicat ? 'badge-success' : 'badge-subtle'}` }, [
                doc.publicat ? '✓ Publicat' : 'Ciornă'
            ]),
            state.uiMode === 'avansat' ? el('span', { className: 'badge-tech' }, [`Ord: ${doc.ordine}`]) : null
        ]),
        doc.descriere ? el('p', { className: 'doc-card-desc' }, [doc.descriere]) : null,
        el('div', { className: 'doc-card-link-box' }, [
            el('span', { className: 'text-subtle' }, ['Fișier: ']),
            el('a', {
                href: `../${doc.fisier_url}`,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'doc-link-anchor'
            }, [doc.fisier_url])
        ])
    ]);

    const actions = el('div', { className: 'doc-card-actions' }, [
        isOwnerOrEditor ? el('div', { className: 'order-btn-group' }, [
            el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-xs',
                title: 'Mută mai sus',
                disabled: index === 0,
                onClick: () => handleReorderDoc(doc, -1)
            }, ['▲']),
            el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-xs',
                title: 'Mută mai jos',
                disabled: index === totalItems - 1,
                onClick: () => handleReorderDoc(doc, 1)
            }, ['▼'])
        ]) : null,

        isOwnerOrEditor ? el('button', {
            type: 'button',
            className: `btn btn-sm ${doc.publicat ? 'btn-secondary' : 'btn-success'}`,
            onClick: () => handleToggleDocPublish(doc)
        }, [doc.publicat ? 'Retrage' : 'Publică']) : null,

        // Istoric (Audit diff)
        el('button', {
            type: 'button',
            className: 'btn btn-secondary btn-sm',
            title: 'Vezi istoricul modificărilor',
            onClick: () => openItemHistoryModal('documente', doc.id, doc.titlu)
        }, ['🕒']),

        isOwnerOrEditor ? el('button', {
            type: 'button',
            className: 'btn btn-secondary btn-sm',
            onClick: () => openEditDocModal(doc)
        }, ['✏️ Editează']) : null,

        isOwner ? el('button', {
            type: 'button',
            className: 'btn btn-danger btn-sm',
            onClick: () => handleDeleteDoc(doc)
        }, ['🗑️']) : null
    ]);

    card.appendChild(iconBox);
    card.appendChild(info);
    card.appendChild(actions);

    return card;
}

export function openAddDocModal() {
    editingDocId = null;
    const modal = document.getElementById('modal-doc');
    const title = document.getElementById('modal-doc-title');
    const form = document.getElementById('form-doc');

    if (title) title.textContent = 'Adăugare Document Oficial';
    if (form) form.reset();

    const publicatInput = document.getElementById('doc-publicat');
    if (publicatInput) publicatInput.checked = true;

    if (modal) modal.classList.add('active');
}

export function openEditDocModal(doc) {
    editingDocId = doc.id;
    const modal = document.getElementById('modal-doc');
    const title = document.getElementById('modal-doc-title');

    if (title) title.textContent = 'Editare Document Oficial';

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('doc-titlu', doc.titlu);
    setVal('doc-descriere', doc.descriere);
    setVal('doc-tip', doc.tip);
    setVal('doc-badge', doc.badge);
    setVal('doc-fisier-url', doc.fisier_url);
    setVal('doc-ordine', doc.ordine);

    const publicatInput = document.getElementById('doc-publicat');
    if (publicatInput) publicatInput.checked = doc.publicat;

    if (modal) modal.classList.add('active');
}

export function closeDocModal() {
    const modal = document.getElementById('modal-doc');
    if (modal) modal.classList.remove('active');
    editingDocId = null;
}

export async function handleSaveDoc(e) {
    if (e) e.preventDefault();

    const getVal = (id) => document.getElementById(id)?.value.trim() || '';
    const titlu = getVal('doc-titlu');
    const fisierUrl = getVal('doc-fisier-url');

    if (!titlu || !fisierUrl) {
        showToast('Titlul și calea/URL-ul fișierului sunt obligatorii.', 'warning');
        return;
    }

    const payload = {
        titlu,
        descriere: getVal('doc-descriere') || null,
        tip: getVal('doc-tip') || 'DOCX',
        badge: getVal('doc-badge') || null,
        fisier_url: fisierUrl,
        ordine: parseInt(getVal('doc-ordine') || '0', 10),
        publicat: document.getElementById('doc-publicat')?.checked ?? true
    };

    try {
        if (editingDocId) {
            const { error } = await writeRows(
                client
                    .from('documente')
                    .update(payload)
                    .eq('id', editingDocId)
                    .select('id'),
                { context: 'actualizarea documentului' }
            );
            if (error) throw error;
            showToast('Documentul a fost actualizat!', 'success');
        } else {
            const { error } = await writeRows(
                client
                    .from('documente')
                    .insert([payload])
                    .select('id'),
                { context: 'adăugarea documentului' }
            );
            if (error) throw error;
            showToast('Documentul a fost adăugat!', 'success');
        }

        closeDocModal();
        await loadDocuments();
    } catch (err) {
        showToast(describeDbError(err, 'Documentul nu a putut fi salvat.'), 'error');
    }
}

export async function handleToggleDocPublish(doc) {
    try {
        const nextState = !doc.publicat;
        const { error } = await writeRows(
            client
                .from('documente')
                .update({ publicat: nextState })
                .eq('id', doc.id)
                .select('id'),
            { context: 'schimbarea stării de publicare' }
        );

        if (error) throw error;

        doc.publicat = nextState;
        renderDocumentsList();
        showToast('Starea de publicare a documentului a fost modificată.', 'info');
    } catch (err) {
        showToast(describeDbError(err, 'Starea documentului nu a putut fi modificată.'), 'error');
    }
}

export async function handleReorderDoc(doc, delta) {
    const currentIndex = state.allDocumentsData.findIndex(item => item.id === doc.id);
    const targetIndex = currentIndex + delta;

    if (targetIndex < 0 || targetIndex >= state.allDocumentsData.length) return;

    const targetDoc = state.allDocumentsData[targetIndex];
    const currentOrder = doc.ordine;
    const targetOrder = targetDoc.ordine;

    try {
        const { error: errUp } = await writeRows(
            client.from('documente').update({ ordine: targetOrder }).eq('id', doc.id).select('id'),
            { context: 'reordonarea documentelor' }
        );
        if (errUp) throw errUp;

        const { error: errDown } = await writeRows(
            client.from('documente').update({ ordine: currentOrder }).eq('id', targetDoc.id).select('id'),
            { context: 'reordonarea documentelor' }
        );
        if (errDown) throw errDown;

        doc.ordine = targetOrder;
        targetDoc.ordine = currentOrder;

        state.allDocumentsData.sort((a, b) => a.ordine - b.ordine);
        renderDocumentsList();
        showToast('Ordinea documentelor a fost actualizată!', 'success');
    } catch (err) {
        showToast(describeDbError(err, 'Ordinea documentelor nu a putut fi actualizată.'), 'error');
    }
}

export async function handleDeleteDoc(doc) {
    if (!confirm(`Sunteți sigur că doriți să ștergeți documentul: "${doc.titlu}"?`)) {
        return;
    }

    try {
        const { error } = await writeRows(
            client
                .from('documente')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', doc.id)
                .select('id'),
            { context: 'arhivarea documentului' }
        );

        if (error) throw error;

        showToast('Documentul a fost șters (mutat în arhivă).', 'info');
        await loadDocuments();
    } catch (err) {
        showToast(describeDbError(err, 'Documentul nu a putut fi șters.'), 'error');
    }
}
