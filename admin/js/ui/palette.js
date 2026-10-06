/**
 * Global Command Palette (Ctrl+K / Spotlight Search)
 */

import { state } from '../state.js';

let cmdCurrentItems = [];
let cmdActiveIndex = 0;
let commandActions = {};

export function registerPaletteActions(actions) {
    commandActions = actions;
}

export function openCommandPalette() {
    const modalCommandPalette = document.getElementById('modal-command-palette');
    const cmdPaletteSearchInput = document.getElementById('cmd-palette-search-input');
    if (!modalCommandPalette || !cmdPaletteSearchInput) return;

    modalCommandPalette.classList.add('active');
    cmdPaletteSearchInput.value = '';
    cmdActiveIndex = 0;
    renderCommandPaletteResults('');
    cmdPaletteSearchInput.focus();
}

export function closeCommandPalette() {
    const modalCommandPalette = document.getElementById('modal-command-palette');
    if (!modalCommandPalette) return;
    modalCommandPalette.classList.remove('active');
    cmdActiveIndex = 0;
}

export function updateCommandPaletteHighlight() {
    cmdCurrentItems.forEach((ci, idx) => {
        ci.element.classList.toggle('selected', idx === cmdActiveIndex);
        if (idx === cmdActiveIndex) {
            ci.element.scrollIntoView({ block: 'nearest' });
        }
    });
}

export function navigateCommandPalette(direction) {
    if (cmdCurrentItems.length === 0) return;
    if (direction === 'down') {
        cmdActiveIndex = (cmdActiveIndex + 1) % cmdCurrentItems.length;
    } else if (direction === 'up') {
        cmdActiveIndex = (cmdActiveIndex - 1 + cmdCurrentItems.length) % cmdCurrentItems.length;
    }
    updateCommandPaletteHighlight();
}

export function executeSelectedPaletteCommand() {
    if (cmdCurrentItems[cmdActiveIndex]) {
        cmdCurrentItems[cmdActiveIndex].action();
    }
}

export function renderCommandPaletteResults(query) {
    const cmdPaletteResultsContainer = document.getElementById('cmd-palette-results-container') || document.getElementById('cmd-palette-results');
    if (!cmdPaletteResultsContainer) return;

    while (cmdPaletteResultsContainer.firstChild) {
        cmdPaletteResultsContainer.removeChild(cmdPaletteResultsContainer.firstChild);
    }
    cmdCurrentItems = [];
    cmdActiveIndex = 0;

    const q = (query || '').toLowerCase().trim();

    const sysCommands = [
        { title: "Panou General (Overview)", desc: "Comută la tabloul de bord cu indicatori KPI", icon: "📊", action: () => commandActions.switchView?.('overview') },
        { title: "Editor Pagini Site Public", desc: "Personalizează textele, secțiunile și butoanele celor 5 pagini", icon: "🌐", action: () => commandActions.switchView?.('pages') },
        { title: "Cereri de Înscriere", desc: "Gestionează dosarele candidaților noi", icon: "📋", action: () => commandActions.switchView?.('requests') },
        { title: "Registru Membri UGR", desc: "Vizualizează și filtrează specialiștii autorizați", icon: "👥", action: () => commandActions.switchView?.('members') },
        { title: "Știri & Comunicate", desc: "Publică și gestionează articolele filialei", icon: "📰", action: () => commandActions.switchView?.('news') },
        { title: "Setări Filială", desc: "Editează datele oficiale, cotizațiile și ghidul", icon: "⚙️", action: () => commandActions.switchView?.('settings') },
        { title: "Conducere & Echipă", desc: "Gestionează conducerea filialei și BEX central", icon: "🏛️", action: () => commandActions.switchView?.('leadership') },
        { title: "Întrebări Frecvente (FAQ)", desc: "Administrează asistența și ghidurile utile", icon: "❓", action: () => commandActions.switchView?.('faq') },
        { title: "Documente Oficiale", desc: "Gestionează cererile și statutele descărcabile", icon: "📄", action: () => commandActions.switchView?.('documents') },
        { title: "Coș de Reciclate (Trash)", desc: "Elemente șterse logic și restaurare date", icon: "🗑️", action: () => commandActions.switchView?.('trash') },
        { title: "Roluri & Securitate Acces", desc: "Gestiunea conturilor administrative și RBAC", icon: "👥", action: () => commandActions.switchView?.('roles') },
        { title: "Stare Sincronizare Site", desc: "Sondează ce vede site-ul public vs baza de date", icon: "🔄", action: () => commandActions.switchView?.('sync') },
        { title: "Consolă Dezvoltator (Coder Mode)", desc: "Browser tabele, JSON raw, backup și RLS inspector", icon: "💻", action: () => commandActions.switchView?.('coder') },
        { title: "Descarcă Backup Complet Bază de Date", desc: "Exportă toate cele 8 tabele într-un pachet JSON", icon: "💾", action: () => { commandActions.switchView?.('coder'); commandActions.handleExportFullBackup?.(); } },
        { title: "Telemetrie & Monitorizare", desc: "Vizitatori live și jurnal de audit", icon: "📈", action: () => commandActions.switchView?.('telemetry') },
        { title: "Adaugă Membru Nou", desc: "Înregistrează un specialist în baza de date", icon: "➕", action: () => { commandActions.switchView?.('members'); commandActions.openAddMemberModal?.(); } },
        { title: "Importă Membri din CSV", desc: "Încarcă fișier CSV cu membri noi în masă", icon: "📤", action: () => { commandActions.switchView?.('members'); commandActions.openCsvImportModal?.(); } },
        { title: "Publică Știre Nouă", desc: "Deschide formularul de publicare articol", icon: "✍️", action: () => { commandActions.switchView?.('news'); commandActions.openAddNewsModal?.(); } },
        { title: "Adaugă Membru Conducere", desc: "Deschide formularul de membru conducere", icon: "➕", action: () => { commandActions.switchView?.('leadership'); commandActions.openAddLeaderModal?.(); } },
        { title: "Adaugă Întrebare Frecventă", desc: "Deschide formularul de adăugare FAQ", icon: "➕", action: () => { commandActions.switchView?.('faq'); commandActions.openAddFaqModal?.(); } },
        { title: "Adaugă Document Oficial", desc: "Deschide formularul de adăugare document", icon: "➕", action: () => { commandActions.switchView?.('documents'); commandActions.openAddDocModal?.(); } },
        { title: "Adaugă Administrator Nou", desc: "Înregistrează un cont de administrator", icon: "➕", action: () => { commandActions.switchView?.('roles'); commandActions.openAddAdminModal?.(); } },
        { title: "Sincronizează Știri Locale", desc: "Importă cele 9 știri oficiale în Supabase", icon: "📥", action: () => commandActions.handleSyncDefaultNews?.() },
        { title: "Exportă CSV Membri", desc: "Descarcă registrul membrilor în format Excel", icon: "📁", action: () => commandActions.exportMembersToCsv?.() },
        { title: "Exportă CSV Cereri", desc: "Descarcă cererile înregistrate în CSV", icon: "📁", action: () => commandActions.exportRequestsToCsv?.() },
        { title: "Galerie Foto & Upload (Media)", desc: "Explorează și încarcă imagini în Supabase Storage", icon: "🖼️", action: () => commandActions.openMediaPickerModal?.() },
        { title: "Profil & Securitate Cont", desc: "Schimbă parola și verifică MFA AAL2", icon: "⚙️", action: () => commandActions.openAdminProfileModal?.() },
        { title: "Deconectare Sesiune", desc: "Închide sesiunea securizată de administrator", icon: "🔒", action: () => commandActions.handleSignOut?.() }
    ];

    const matchedSys = sysCommands.filter(c => !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
    const matchedNews = (state.allNewsData || []).filter(n => q && (n.titlu || '').toLowerCase().includes(q)).slice(0, 5);
    const matchedMembers = (state.allMembersData || []).filter(m => q && ((m.nume || '').toLowerCase().includes(q) || (m.serie_autorizatie || '').toLowerCase().includes(q))).slice(0, 5);
    const matchedRequests = (state.allRequestsData || []).filter(r => q && ((r.nume_complet || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q))).slice(0, 5);

    let itemIdx = 0;

    function appendGroup(title, items, type) {
        if (items.length === 0) return;
        const gTitle = document.createElement('div');
        gTitle.className = 'cmd-palette-group-title';
        gTitle.textContent = title;
        cmdPaletteResultsContainer.appendChild(gTitle);

        items.forEach(item => {
            const currentIdx = itemIdx++;
            const row = document.createElement('div');
            row.className = 'cmd-palette-item';
            row.setAttribute('role', 'option');
            if (currentIdx === cmdActiveIndex) row.classList.add('selected');

            const left = document.createElement('div');
            left.className = 'cmd-palette-item-left';

            const iconSpan = document.createElement('span');
            iconSpan.className = 'cmd-palette-item-icon';
            iconSpan.textContent = type === 'sys' ? item.icon : (type === 'news' ? '📰' : (type === 'mem' ? '👤' : '📋'));
            left.appendChild(iconSpan);

            const titleEl = document.createElement('div');
            titleEl.className = 'cmd-palette-item-title';
            titleEl.textContent = type === 'sys' ? item.title : (type === 'news' ? item.titlu : (type === 'mem' ? item.nume : item.nume_complet));
            left.appendChild(titleEl);

            row.appendChild(left);

            const badgeEl = document.createElement('span');
            badgeEl.className = 'cmd-palette-item-badge';
            badgeEl.textContent = type === 'sys' ? 'Comandă' : (type === 'news' ? (item.publicat ? 'Publicat' : 'Ciornă') : (type === 'mem' ? (item.judet || 'Membru') : (item.status || 'Cerere')));
            row.appendChild(badgeEl);

            const execAction = () => {
                closeCommandPalette();
                if (type === 'sys') {
                    item.action();
                } else if (type === 'news') {
                    commandActions.switchView?.('news');
                    commandActions.openPreviewNewsModal?.(item);
                } else if (type === 'mem') {
                    commandActions.switchView?.('members');
                    commandActions.openEditMemberModal?.(item);
                } else if (type === 'req') {
                    commandActions.switchView?.('requests');
                }
            };

            cmdCurrentItems.push({ element: row, action: execAction });

            row.addEventListener('click', execAction);
            row.addEventListener('mouseenter', () => {
                cmdActiveIndex = currentIdx;
                updateCommandPaletteHighlight();
            });

            cmdPaletteResultsContainer.appendChild(row);
        });
    }

    appendGroup('⚡ Acțiuni & Comenzi Rapide', matchedSys, 'sys');
    appendGroup('📰 Știri & Comunicate', matchedNews, 'news');
    appendGroup('👥 Membri Înregistrați', matchedMembers, 'mem');
    appendGroup('📋 Cereri de Înscriere', matchedRequests, 'req');

    if (cmdCurrentItems.length === 0) {
        const noRes = document.createElement('div');
        noRes.style.cssText = 'text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 13.5px;';
        noRes.textContent = `Niciun rezultat găsit pentru «${query}».`;
        cmdPaletteResultsContainer.appendChild(noRes);
    }
}
