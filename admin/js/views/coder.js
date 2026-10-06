/**
 * Coder View ("Consolă Dezvoltator" - Avansat)
 * Provides generic table browsing, raw row JSON editing, full database backup/restore,
 * RLS policy inspection, and interactive API code snippets.
 */

import { state } from '../state.js';
import { client, SUPABASE_URL, ANON_KEY } from '../supabase.js';
import { showToast } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';

let currentCoderTable = 'membri';
let coderTableData = [];
let coderEditingRow = null;
let coderActiveTab = 'browser'; // 'browser' | 'backup' | 'rls' | 'snippets' | 'schema'

export const AVAILABLE_TABLES = [
    { id: 'membri', name: 'membri', label: 'Registru Membri' },
    { id: 'stiri', name: 'stiri', label: 'Știri & Comunicate' },
    { id: 'leadership', name: 'leadership', label: 'Conducere' },
    { id: 'faq', name: 'faq', label: 'Întrebări Frecvente' },
    { id: 'documente', name: 'documente', label: 'Documente' },
    { id: 'setari', name: 'setari', label: 'Setări Filială' },
    { id: 'cereri_inscriere', name: 'cereri_inscriere', label: 'Cereri Înscriere' },
    { id: 'audit_log', name: 'audit_log', label: 'Jurnal Audit' }
];

export async function loadCoderView() {
    setupCoderTabs();
    if (coderActiveTab === 'browser') {
        await loadCoderTableData(currentCoderTable);
    } else if (coderActiveTab === 'rls') {
        await loadRlsInspector();
    } else if (coderActiveTab === 'snippets') {
        renderApiSnippets();
    } else if (coderActiveTab === 'schema') {
        renderSchemaDocumentation();
    }
}

function setupCoderTabs() {
    const tabBtns = document.querySelectorAll('.coder-tab-btn');
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            coderActiveTab = btn.getAttribute('data-coder-tab');

            document.querySelectorAll('.coder-tab-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            const activePanel = document.getElementById(`coder-panel-${coderActiveTab}`);
            if (activePanel) activePanel.style.display = 'block';

            loadCoderView();
        };
    });
}

// ============================================================================
// 1. GENERIC TABLE BROWSER & ROW JSON EDITOR
// ============================================================================

export async function loadCoderTableData(tableName) {
    currentCoderTable = tableName;
    const tableSelect = document.getElementById('coder-table-select');
    if (tableSelect) tableSelect.value = tableName;

    const container = document.getElementById('coder-table-container');
    if (!container) return;

    clearElement(container);
    container.appendChild(el('div', { className: 'loading-pulse' }, [`Se încarcă tabela public.${tableName}...`]));

    try {
        const { data, error } = await client
            .from(tableName)
            .select('*')
            .order(tableName === 'audit_log' ? 'creat_la' : (tableName === 'setari' ? 'cheie' : 'id'), { ascending: false })
            .limit(100);

        if (error) {
            clearElement(container);
            container.appendChild(el('div', { className: 'alert alert-danger' }, [
                `Eroare la citirea tabelei ${tableName}: ${error.message}`
            ]));
            return;
        }

        coderTableData = data || [];
        renderCoderTable(container, coderTableData, tableName);

    } catch (err) {
        clearElement(container);
        container.appendChild(el('div', { className: 'alert alert-danger' }, [
            `Eroare conexiune: ${err.message}`
        ]));
    }
}

function renderCoderTable(container, data, tableName) {
    clearElement(container);

    if (data.length === 0) {
        container.appendChild(el('div', { className: 'empty-state-card' }, [
            el('h4', {}, [`Tabela public.${tableName} este goală`]),
            el('p', { className: 'text-subtle' }, ['Nu există înregistrări în această tabelă.'])
        ]));
        return;
    }

    const columns = Object.keys(data[0]);

    const tableWrapper = el('div', { className: 'table-responsive' });
    const table = el('table', { className: 'table coder-grid-table' });
    const thead = el('thead');
    const headerRow = el('tr');

    headerRow.appendChild(el('th', { style: 'width: 80px;' }, ['Acțiuni']));
    columns.forEach(col => {
        headerRow.appendChild(el('th', {}, [col]));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = el('tbody');
    data.forEach(row => {
        const tr = el('tr');

        // Acțiuni
        const tdActions = el('td');
        const btnEditJson = el('button', {
            type: 'button',
            className: 'btn btn-secondary btn-xs',
            title: 'Editează rândul ca JSON',
            onClick: () => openCoderJsonEditorModal(row, tableName)
        }, ['{ } JSON']);
        tdActions.appendChild(btnEditJson);
        tr.appendChild(tdActions);

        // Coloane de date
        columns.forEach(col => {
            const val = row[col];
            let displayVal = '';
            if (val === null || val === undefined) {
                displayVal = 'null';
            } else if (typeof val === 'object') {
                displayVal = JSON.stringify(val);
                if (displayVal.length > 50) displayVal = displayVal.substring(0, 47) + '...';
            } else {
                displayVal = String(val);
                if (displayVal.length > 60) displayVal = displayVal.substring(0, 57) + '...';
            }

            const td = el('td', {
                className: val === null ? 'text-muted' : (typeof val === 'number' ? 'text-cyan' : ''),
                title: typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
            }, [displayVal]);

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
}

export function openCoderJsonEditorModal(row, tableName) {
    coderEditingRow = { row, tableName };
    const modal = document.getElementById('modal-coder-json-editor');
    const title = document.getElementById('modal-coder-json-title');
    const textarea = document.getElementById('coder-json-textarea');
    const feedback = document.getElementById('coder-json-feedback');

    if (!modal) return;
    if (feedback) feedback.textContent = '';

    const rowId = row.id || row.cheie || 'record';
    if (title) title.textContent = `Editor JSON: public.${tableName} [${rowId}]`;
    if (textarea) {
        textarea.value = JSON.stringify(row, null, 2);
    }

    modal.classList.add('active');
    if (textarea) textarea.focus();
}

export function closeCoderJsonEditorModal() {
    const modal = document.getElementById('modal-coder-json-editor');
    if (modal) modal.classList.remove('active');
    coderEditingRow = null;
}

export async function handleSaveCoderJson() {
    const textarea = document.getElementById('coder-json-textarea');
    const feedback = document.getElementById('coder-json-feedback');
    const btnSave = document.getElementById('btn-save-coder-json');

    if (!coderEditingRow || !textarea) return;
    const { row, tableName } = coderEditingRow;

    let parsed = null;
    try {
        parsed = JSON.parse(textarea.value);
    } catch (err) {
        if (feedback) {
            feedback.className = 'text-danger';
            feedback.textContent = 'Eroare sintaxă JSON: ' + err.message;
        }
        return;
    }

    if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = 'Salvare...';
    }

    try {
        const idCol = tableName === 'setari' ? 'cheie' : 'id';
        const idVal = row[idCol];

        const { error } = await client
            .from(tableName)
            .update(parsed)
            .eq(idCol, idVal);

        if (error) {
            if (feedback) {
                feedback.className = 'text-danger';
                feedback.textContent = 'Eroare Supabase RLS / DB: ' + error.message;
            }
            return;
        }

        showToast(`Rândul din public.${tableName} a fost actualizat cu succes!`, 'success');
        closeCoderJsonEditorModal();
        await loadCoderTableData(tableName);

    } catch (err) {
        if (feedback) {
            feedback.className = 'text-danger';
            feedback.textContent = 'Eroare la salvare: ' + err.message;
        }
    } finally {
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.textContent = 'Salvează Modificările în DB';
        }
    }
}

// ============================================================================
// 2. EXPORT & BACKUP FULL BUNDLE
// ============================================================================

export function exportCurrentTableJson() {
    if (!coderTableData || coderTableData.length === 0) {
        showToast('Nu există date de exportat în tabela curentă.', 'warning');
        return;
    }
    const blob = new Blob([JSON.stringify(coderTableData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `ugr-${currentCoderTable}-${new Date().toISOString().slice(0, 10)}.json`);
    showToast(`Exportat public.${currentCoderTable} în JSON.`, 'success');
}

export function exportCurrentTableCsv() {
    if (!coderTableData || coderTableData.length === 0) {
        showToast('Nu există date de exportat în tabela curentă.', 'warning');
        return;
    }
    const cols = Object.keys(coderTableData[0]);
    const header = cols.join(',');
    const rows = coderTableData.map(row => {
        return cols.map(c => {
            const v = row[c];
            if (v === null || v === undefined) return '';
            const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
            return `"${s.replace(/"/g, '""')}"`;
        }).join(',');
    });
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `ugr-${currentCoderTable}-${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exportat public.${currentCoderTable} în CSV.`, 'success');
}

export async function handleExportFullBackup() {
    const btn = document.getElementById('btn-export-full-backup');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Generare backup complet...';
    }

    try {
        const backupBundle = {
            version: '4.0.0-rc1',
            branch: 'admin-v4',
            created_at: new Date().toISOString(),
            created_by: state.currentAdmin?.email || 'admin',
            tables: {}
        };

        for (const t of AVAILABLE_TABLES) {
            const { data, error } = await client.from(t.name).select('*');
            if (!error && Array.isArray(data)) {
                backupBundle.tables[t.name] = data;
            } else {
                backupBundle.tables[t.name] = [];
            }
        }

        const dateStr = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
        const filename = `ugr-s1-full-backup-${dateStr}.json`;
        const blob = new Blob([JSON.stringify(backupBundle, null, 2)], { type: 'application/json' });
        downloadBlob(blob, filename);

        showToast('Backup complet generat și descărcat cu succes!', 'success');

    } catch (err) {
        showToast('Eroare la generarea backup-ului complet: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '📥 Descarcă Backup Complet (Toate Tabelele)';
        }
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// 3. RLS POLICIES INSPECTOR
// ============================================================================

export async function loadRlsInspector() {
    const container = document.getElementById('coder-rls-container');
    if (!container) return;

    clearElement(container);
    container.appendChild(el('div', { className: 'loading-pulse' }, ['Se interoghează catalogul de politici RLS...']));

    let policies = [];

    // Încercare apel RPC get_table_rls_policies
    try {
        const { data, error } = await client.rpc('get_table_rls_policies');
        if (!error && Array.isArray(data) && data.length > 0) {
            policies = data;
        }
    } catch (e) {
        // Fallback la catalog documentat
    }

    if (policies.length === 0) {
        // Catalog documentat activ
        policies = getDocumentedRlsCatalog();
    }

    renderRlsPoliciesTable(container, policies);
}

function getDocumentedRlsCatalog() {
    return [
        { tablename: 'membri', policyname: 'membri_read_public', cmd: 'SELECT', roles: ['public'], qual: 'afisare_publica = true AND deleted_at IS NULL' },
        { tablename: 'membri', policyname: 'membri_admin_all', cmd: 'ALL', roles: ['authenticated'], qual: "admin_rol() IN ('owner', 'editor', 'admin')" },
        { tablename: 'stiri', policyname: 'stiri_read_public', cmd: 'SELECT', roles: ['public'], qual: 'publicat = true AND deleted_at IS NULL' },
        { tablename: 'stiri', policyname: 'stiri_admin_all', cmd: 'ALL', roles: ['authenticated'], qual: "admin_rol() IN ('owner', 'editor', 'admin')" },
        { tablename: 'leadership', policyname: 'leadership_read_public', cmd: 'SELECT', roles: ['public'], qual: 'afisare_publica = true AND deleted_at IS NULL' },
        { tablename: 'leadership', policyname: 'leadership_admin_all', cmd: 'ALL', roles: ['authenticated'], qual: "admin_rol() IN ('owner', 'editor', 'admin')" },
        { tablename: 'faq', policyname: 'faq_read_public', cmd: 'SELECT', roles: ['public'], qual: 'publicat = true AND deleted_at IS NULL' },
        { tablename: 'faq', policyname: 'faq_admin_all', cmd: 'ALL', roles: ['authenticated'], qual: "admin_rol() IN ('owner', 'editor', 'admin')" },
        { tablename: 'documente', policyname: 'documente_read_public', cmd: 'SELECT', roles: ['public'], qual: 'publicat = true AND deleted_at IS NULL' },
        { tablename: 'documente', policyname: 'documente_admin_all', cmd: 'ALL', roles: ['authenticated'], qual: "admin_rol() IN ('owner', 'editor', 'admin')" },
        { tablename: 'setari', policyname: 'setari_read_public', cmd: 'SELECT', roles: ['public'], qual: 'true' },
        { tablename: 'setari', policyname: 'setari_admin_update', cmd: 'UPDATE', roles: ['authenticated'], qual: "admin_rol() IN ('owner', 'editor', 'admin')" },
        { tablename: 'cereri_inscriere', policyname: 'cereri_insert_anon', cmd: 'INSERT', roles: ['public'], qual: 'with_check: true' },
        { tablename: 'cereri_inscriere', policyname: 'cereri_admin_select', cmd: 'SELECT', roles: ['authenticated'], qual: "admin_rol() IN ('owner', 'editor', 'admin', 'viewer')" },
        { tablename: 'admini', policyname: 'admini_self_select', cmd: 'SELECT', roles: ['authenticated'], qual: 'user_id = auth.uid()' },
        { tablename: 'admini', policyname: 'admini_owner_manage', cmd: 'ALL', roles: ['authenticated'], qual: "admin_rol() = 'owner'" },
        { tablename: 'audit_log', policyname: 'audit_read_admin', cmd: 'SELECT', roles: ['authenticated'], qual: "admin_rol() IN ('owner', 'editor', 'admin')" }
    ];
}

function renderRlsPoliciesTable(container, policies) {
    clearElement(container);

    const wrap = el('div', { className: 'table-responsive' });
    const table = el('table', { className: 'table' });

    const thead = el('thead', {}, [
        el('tr', {}, [
            el('th', {}, ['Tabelă']),
            el('th', {}, ['Nume Politică']),
            el('th', {}, ['Comandă']),
            el('th', {}, ['Roluri Țintă']),
            el('th', {}, ['Expresie USING / Condiție'])
        ])
    ]);

    const tbody = el('tbody');
    policies.forEach(p => {
        const cmdBadgeClass = p.cmd === 'SELECT' ? 'badge-success' : (p.cmd === 'ALL' ? 'badge-tech' : 'badge-warning');
        const isPublic = Array.isArray(p.roles) ? p.roles.includes('public') : String(p.roles).includes('public');

        const tr = el('tr', {}, [
            el('td', { style: 'font-weight: 600; color: #fff;' }, [`public.${p.tablename}`]),
            el('td', { className: 'font-mono text-cyan' }, [p.policyname]),
            el('td', {}, [
                el('span', { className: `status-badge ${cmdBadgeClass}` }, [p.cmd])
            ]),
            el('td', {}, [
                el('span', { className: `status-badge ${isPublic ? 'badge-subtle' : 'badge-owner'}` }, [
                    Array.isArray(p.roles) ? p.roles.join(', ') : String(p.roles)
                ])
            ]),
            el('td', { className: 'font-mono text-subtle', style: 'font-size: 11.5px;' }, [p.qual || '—'])
        ]);
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    container.appendChild(wrap);
}

// ============================================================================
// 4. API SNIPPETS GENERATOR
// ============================================================================

export function renderApiSnippets() {
    const container = document.getElementById('coder-snippets-container');
    if (!container) return;
    clearElement(container);

    const snippets = [
        {
            title: 'Interogare Publică Membri (JavaScript Client)',
            desc: 'Codul executat de site-ul public fără autentificare:',
            code: `// Fetch membri activi cu afișare publică
const { data, error } = await supabase
  .from('membri')
  .select('id, nume, judet, serie_autorizatie, categorie, status')
  .eq('afisare_publica', true)
  .is('deleted_at', null)
  .order('nume');`
        },
        {
            title: 'Interogare Anonimă prin cURL / REST API',
            desc: 'Cerere HTTP directă către Supabase REST API:',
            code: `curl -X GET "${SUPABASE_URL}/rest/v1/membri?afisare_publica=eq.true&deleted_at=is.null&select=id,nume,judet" \\
  -H "apikey: ${ANON_KEY}" \\
  -H "Authorization: Bearer ${ANON_KEY}"`
        },
        {
            title: 'Depunere Cerere Înscriere Nouă (Site Public)',
            desc: 'Inserare sigură permisă prin politica INSERT pe cereri_inscriere:',
            code: `const { data, error } = await supabase
  .from('cereri_inscriere')
  .insert([{
    nume_complet: "Ing. Ion Popescu",
    email: "ion.popescu@exemplu.ro",
    telefon: "0722000000",
    judet: "București - Sector 1",
    certificat_ancpi: "RO-B-F 0123",
    categorie_dorita: "Membru Titular",
    consimtamant_gdpr: true
  }]);`
        },
        {
            title: 'Soft-Delete și Restaurare Rând (Admin Mod)',
            desc: 'Ștergere logică prin marcare deleted_at fără pierdere date:',
            code: `// Soft-Delete (mutare în Coș)
await supabase.from('stiri')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', newsId);

// Restore (recuperare din Coș)
await supabase.from('stiri')
  .update({ deleted_at: null })
  .eq('id', newsId);`
        }
    ];

    snippets.forEach(s => {
        const card = el('div', { className: 'cms-card snippet-card' }, [
            el('h4', { className: 'snippet-title' }, [s.title]),
            el('p', { className: 'snippet-desc text-subtle' }, [s.desc]),
            el('pre', { className: 'snippet-code-block' }, [
                el('code', {}, [s.code])
            ]),
            el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-xs',
                onClick: () => {
                    navigator.clipboard.writeText(s.code);
                    showToast('Snippet copiat în clipboard!', 'success');
                }
            }, ['📋 Copiază Snippet'])
        ]);
        container.appendChild(card);
    });
}

// ============================================================================
// 5. DB SCHEMA DOCUMENTATION
// ============================================================================

export function renderSchemaDocumentation() {
    const container = document.getElementById('coder-schema-container');
    if (!container) return;
    clearElement(container);

    const schemaInfo = [
        {
            table: 'membri',
            desc: 'Registrul oficial al membrilor Uniunii Geodezilor din România - Filiala Sector 1',
            columns: [
                { name: 'id', type: 'text', pk: true, desc: 'Identificator unic registru (ex: UGR-0001)' },
                { name: 'nume', type: 'text', req: true, desc: 'Numele complet al specialistului' },
                { name: 'judet', type: 'text', desc: 'Județul de activitate' },
                { name: 'serie_autorizatie', type: 'text', desc: 'Certificat autorizare ANCPI' },
                { name: 'categorie', type: 'text', desc: 'Categoria tehnică ANCPI (A, B, C, D)' },
                { name: 'status', type: 'text', desc: 'activ | suspendat | retras' },
                { name: 'afisare_publica', type: 'boolean', desc: 'Control vizibilitate pe site public' },
                { name: 'demonstrativ', type: 'boolean', desc: 'Flag date demonstrative din inițializare' },
                { name: 'deleted_at', type: 'timestamptz', desc: 'Timestamp soft-delete (null = activ)' }
            ]
        },
        {
            table: 'stiri',
            desc: 'Comunicate oficiale, evenimente și știri de interes geodezic',
            columns: [
                { name: 'id', type: 'text', pk: true, desc: 'ID unic știre' },
                { name: 'titlu', type: 'text', req: true, desc: 'Titlul articolului' },
                { name: 'continut', type: 'text', req: true, desc: 'Corpul comunicatului' },
                { name: 'imagine_url', type: 'text', desc: 'Cale fișier imagine' },
                { name: 'data_publicare', type: 'date', desc: 'Data oficială de afișare' },
                { name: 'publicat', type: 'boolean', desc: 'Stare publicare (true = live, false = ciornă)' },
                { name: 'categorie', type: 'text', desc: 'Eveniment, Comunicat,BCPI' },
                { name: 'deleted_at', type: 'timestamptz', desc: 'Timestamp soft-delete' }
            ]
        },
        {
            table: 'cereri_inscriere',
            desc: 'Formulare de adeziune trimise online de solicitanți',
            columns: [
                { name: 'id', type: 'uuid', pk: true, desc: 'Cheie primară UUID generată automat' },
                { name: 'nume_complet', type: 'text', req: true, desc: 'Nume solicitant' },
                { name: 'email', type: 'text', req: true, desc: 'Adresă email de contact' },
                { name: 'telefon', type: 'text', req: true, desc: 'Număr telefon' },
                { name: 'status', type: 'text', desc: 'in_asteptare | aprobat | respins' },
                { name: 'membru_id', type: 'text', desc: 'FK către public.membri(id) la conversie' },
                { name: 'notite_interne', type: 'text', desc: 'Observații administrative interne' }
            ]
        }
    ];

    schemaInfo.forEach(sc => {
        const box = el('div', { className: 'cms-card schema-card' }, [
            el('div', { className: 'schema-card-header' }, [
                el('h4', { className: 'schema-title' }, [`public.${sc.table}`]),
                el('p', { className: 'schema-desc text-subtle' }, [sc.desc])
            ]),
            el('div', { className: 'table-responsive' }, [
                el('table', { className: 'table' }, [
                    el('thead', {}, [
                        el('tr', {}, [
                            el('th', {}, ['Coloană']),
                            el('th', {}, ['Tip']),
                            el('th', {}, ['Constrângeri']),
                            el('th', {}, ['Descriere'])
                        ])
                    ]),
                    el('tbody', {}, sc.columns.map(c => el('tr', {}, [
                        el('td', { className: 'font-mono text-cyan' }, [c.name]),
                        el('td', { className: 'font-mono text-subtle' }, [c.type]),
                        el('td', {}, [
                            c.pk ? el('span', { className: 'status-badge badge-warning' }, ['PK']) : null,
                            c.req ? el('span', { className: 'status-badge badge-danger' }, ['NOT NULL']) : null
                        ]),
                        el('td', {}, [c.desc])
                    ])))
                ])
            ])
        ]);
        container.appendChild(box);
    });
}
