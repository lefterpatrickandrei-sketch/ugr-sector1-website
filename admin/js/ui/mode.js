/**
 * UI Mode Switcher (Simplu / Avansat)
 * Stored in localStorage ('ugr_ui_mode')
 */

import { state } from '../state.js';
import { showToast } from './toast.js';

export function setUiMode(mode) {
    if (mode !== 'simplu' && mode !== 'avansat') return;
    
    state.uiMode = mode;
    localStorage.setItem('ugr_ui_mode', mode);

    document.body.classList.remove('mode-simplu', 'mode-avansat');
    document.body.classList.add(`mode-${mode}`);

    const btnSimplu = document.getElementById('btn-mode-simplu');
    const btnAvansat = document.getElementById('btn-mode-avansat');

    if (btnSimplu && btnAvansat) {
        btnSimplu.classList.toggle('active', mode === 'simplu');
        btnAvansat.classList.toggle('active', mode === 'avansat');
        btnSimplu.setAttribute('aria-pressed', mode === 'simplu' ? 'true' : 'false');
        btnAvansat.setAttribute('aria-pressed', mode === 'avansat' ? 'true' : 'false');
    }

    // Toggle visibility of advanced-only elements
    const advancedElements = document.querySelectorAll('.advanced-only');
    advancedElements.forEach(el => {
        // T-J10: .advanced-only și owner-only sunt condiții independente, iar
        // codul de mai jos scrie display direct, deci le-ar suprascrie.
        // ownerOnly === 'false' înseamnă "rol nepermis", caz în care rămâne ascuns
        // indiferent de modul de lucru.
        const ownerBlocked = el.dataset.ownerOnly === 'false';
        el.style.display = (mode === 'avansat' && !ownerBlocked) ? '' : 'none';
    });

    const simpleElements = document.querySelectorAll('.simple-only');
    simpleElements.forEach(el => {
        el.style.display = mode === 'simplu' ? '' : 'none';
    });

    showToast(`Modul de lucru ${mode === 'simplu' ? 'Simplu (Ghidat)' : 'Avansat (Tehnic)'} a fost activat.`, 'info');
}

export function initUiMode() {
    const saved = localStorage.getItem('ugr_ui_mode') || 'simplu';
    setUiMode(saved);

    const btnSimplu = document.getElementById('btn-mode-simplu');
    const btnAvansat = document.getElementById('btn-mode-avansat');

    if (btnSimplu) {
        btnSimplu.addEventListener('click', () => setUiMode('simplu'));
    }
    if (btnAvansat) {
        btnAvansat.addEventListener('click', () => setUiMode('avansat'));
    }
}
