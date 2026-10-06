/**
 * FAQ View ("Întrebări Frecvente")
 * Manages public.faq (Statut, BCPI, Studenți FIFIM, Evenimente)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast } from '../ui/toast.js';
import { el, clearElement, renderMarkdownLite } from '../lib/dom.js';
import { openItemHistoryModal } from './history.js';

let editingFaqId = null;

export async function loadFaq() {
    const list = document.getElementById('faq-items-list');
    if (list) {
        clearElement(list);
        list.appendChild(el('div', { className: 'loading-pulse' }, ['Se încarcă întrebările frecvente...']));
    }

    try {
        const { data, error } = await client
            .from('faq')
            .select('*')
            .is('deleted_at', null)
            .order('ordine', { ascending: true });

        if (error) throw error;

        state.allFaqData = data || [];
        renderFaqList();
    } catch (err) {
        showToast(`Eroare la încărcarea FAQ: ${err.message}`, 'error');
        if (list) {
            clearElement(list);
            list.appendChild(el('p', { className: 'text-error' }, [`Eroare: ${err.message}`]));
        }
    }
}

export function renderFaqList() {
    const list = document.getElementById('faq-items-list');
    if (!list) return;

    clearElement(list);

    let items = [...state.allFaqData];

    // Filtrare categorie
    if (state.faqFilterCategory && state.faqFilterCategory !== 'toate') {
        items = items.filter(item => item.categorie === state.faqFilterCategory);
    }

    // Căutare
    if (state.faqSearchQuery) {
        const q = state.faqSearchQuery.toLowerCase();
        items = items.filter(item => 
            (item.intrebare && item.intrebare.toLowerCase().includes(q)) ||
            (item.raspuns && item.raspuns.toLowerCase().includes(q)) ||
            (item.tag && item.tag.toLowerCase().includes(q))
        );
    }

    if (items.length === 0) {
        list.appendChild(el('div', { className: 'empty-notice' }, ['Nu s-au găsit întrebări frecvente conform criteriilor selectate.']));
        return;
    }

    items.forEach((item, idx) => {
        list.appendChild(createFaqCard(item, idx, items.length));
    });
}

function createFaqCard(faqItem, index, totalItems) {
    const isOwnerOrEditor = state.adminRecord?.rol === 'owner' || state.adminRecord?.rol === 'editor';
    const isOwner = state.adminRecord?.rol === 'owner';

    const card = el('div', { className: 'cms-card faq-card', 'data-id': faqItem.id });

    // Header card
    const header = el('div', { className: 'faq-card-header' }, [
        el('div', { className: 'faq-card-meta' }, [
            faqItem.tag ? el('span', { className: 'faq-tag-badge' }, [faqItem.tag]) : null,
            el('span', { className: 'badge-tech' }, [faqItem.categorie || 'General']),
            state.uiMode === 'avansat' ? el('span', { className: 'badge-tech' }, [`Ord: ${faqItem.ordine}`]) : null
        ]),
        el('div', { className: 'faq-card-status' }, [
            el('span', { className: `status-badge ${faqItem.publicat ? 'badge-success' : 'badge-subtle'}` }, [
                faqItem.publicat ? '✓ Publicat' : 'Ciornă'
            ])
        ])
    ]);

    // Question
    const question = el('h4', { className: 'faq-card-question' }, [faqItem.intrebare]);

    // Answer rendered safely without innerHTML
    const answerContainer = el('div', { className: 'faq-card-answer' }, [
        renderMarkdownLite(faqItem.raspuns)
    ]);

    // Actions
    const actions = el('div', { className: 'faq-card-actions' }, [
        isOwnerOrEditor ? el('div', { className: 'order-btn-group' }, [
            el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-xs',
                title: 'Mută mai sus',
                disabled: index === 0,
                onClick: () => handleReorderFaq(faqItem, -1)
            }, ['▲']),
            el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-xs',
                title: 'Mută mai jos',
                disabled: index === totalItems - 1,
                onClick: () => handleReorderFaq(faqItem, 1)
            }, ['▼'])
        ]) : null,

        isOwnerOrEditor ? el('button', {
            type: 'button',
            className: `btn btn-sm ${faqItem.publicat ? 'btn-secondary' : 'btn-success'}`,
            onClick: () => handleToggleFaqPublish(faqItem)
        }, [faqItem.publicat ? 'Retrage ciornă' : 'Publică']) : null,

        // Istoric (Audit diff)
        el('button', {
            type: 'button',
            className: 'btn btn-secondary btn-sm',
            title: 'Vezi istoricul modificărilor',
            onClick: () => openItemHistoryModal('faq', faqItem.id, faqItem.intrebare)
        }, ['🕒']),

        isOwnerOrEditor ? el('button', {
            type: 'button',
            className: 'btn btn-secondary btn-sm',
            onClick: () => openEditFaqModal(faqItem)
        }, ['✏️ Editează']) : null,

        isOwner ? el('button', {
            type: 'button',
            className: 'btn btn-danger btn-sm',
            onClick: () => handleDeleteFaq(faqItem)
        }, ['🗑️']) : null
    ]);

    card.appendChild(header);
    card.appendChild(question);
    card.appendChild(answerContainer);
    card.appendChild(actions);

    return card;
}

export function openAddFaqModal() {
    editingFaqId = null;
    const modal = document.getElementById('modal-faq');
    const title = document.getElementById('modal-faq-title');
    const form = document.getElementById('form-faq');

    if (title) title.textContent = 'Adăugare Întrebare Frecventă';
    if (form) form.reset();

    const publicatInput = document.getElementById('faq-publicat');
    if (publicatInput) publicatInput.checked = true;

    if (modal) modal.classList.add('active');
}

export function openEditFaqModal(faqItem) {
    editingFaqId = faqItem.id;
    const modal = document.getElementById('modal-faq');
    const title = document.getElementById('modal-faq-title');

    if (title) title.textContent = 'Editare Întrebare Frecventă';

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('faq-categorie', faqItem.categorie);
    setVal('faq-tag', faqItem.tag);
    setVal('faq-intrebare', faqItem.intrebare);
    setVal('faq-raspuns', faqItem.raspuns);
    setVal('faq-ordine', faqItem.ordine);

    const publicatInput = document.getElementById('faq-publicat');
    if (publicatInput) publicatInput.checked = faqItem.publicat;

    if (modal) modal.classList.add('active');
}

export function closeFaqModal() {
    const modal = document.getElementById('modal-faq');
    if (modal) modal.classList.remove('active');
    editingFaqId = null;
}

export async function handleSaveFaq(e) {
    if (e) e.preventDefault();

    const getVal = (id) => document.getElementById(id)?.value.trim() || '';
    const intrebare = getVal('faq-intrebare');
    const raspuns = getVal('faq-raspuns');

    if (!intrebare || !raspuns) {
        showToast('Întrebarea și răspunsul sunt câmpuri obligatorii.', 'warning');
        return;
    }

    const payload = {
        categorie: getVal('faq-categorie') || 'aderare',
        tag: getVal('faq-tag') || null,
        intrebare,
        raspuns,
        ordine: parseInt(getVal('faq-ordine') || '0', 10),
        publicat: document.getElementById('faq-publicat')?.checked ?? true
    };

    try {
        if (editingFaqId) {
            const { error } = await client
                .from('faq')
                .update(payload)
                .eq('id', editingFaqId);
            if (error) throw error;
            showToast('Întrebarea frecventă a fost actualizată!', 'success');
        } else {
            const { error } = await client
                .from('faq')
                .insert([payload]);
            if (error) throw error;
            showToast('Întrebarea frecventă a fost adăugată!', 'success');
        }

        closeFaqModal();
        await loadFaq();
    } catch (err) {
        showToast(`Eroare la salvare: ${err.message}`, 'error');
    }
}

export async function handleToggleFaqPublish(faqItem) {
    try {
        const nextState = !faqItem.publicat;
        const { error } = await client
            .from('faq')
            .update({ publicat: nextState })
            .eq('id', faqItem.id);

        if (error) throw error;

        faqItem.publicat = nextState;
        renderFaqList();
        showToast(`Starea de publicare a fost modificată.`, 'info');
    } catch (err) {
        showToast(`Eroare: ${err.message}`, 'error');
    }
}

export async function handleReorderFaq(faqItem, delta) {
    const currentIndex = state.allFaqData.findIndex(item => item.id === faqItem.id);
    const targetIndex = currentIndex + delta;

    if (targetIndex < 0 || targetIndex >= state.allFaqData.length) return;

    const targetFaq = state.allFaqData[targetIndex];
    const currentOrder = faqItem.ordine;
    const targetOrder = targetFaq.ordine;

    try {
        await client.from('faq').update({ ordine: targetOrder }).eq('id', faqItem.id);
        await client.from('faq').update({ ordine: currentOrder }).eq('id', targetFaq.id);

        faqItem.ordine = targetOrder;
        targetFaq.ordine = currentOrder;

        state.allFaqData.sort((a, b) => a.ordine - b.ordine);
        renderFaqList();
        showToast('Ordinea întrebărilor a fost actualizată!', 'success');
    } catch (err) {
        showToast(`Eroare la reordonare: ${err.message}`, 'error');
    }
}

export async function handleDeleteFaq(faqItem) {
    if (!confirm(`Sunteți sigur că doriți să ștergeți întrebarea: "${faqItem.intrebare}"?`)) {
        return;
    }

    try {
        const { error } = await client
            .from('faq')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', faqItem.id);

        if (error) throw error;

        showToast('Întrebarea a fost ștearsă (mutată în arhivă).', 'info');
        await loadFaq();
    } catch (err) {
        showToast(`Eroare la ștergere: ${err.message}`, 'error');
    }
}
